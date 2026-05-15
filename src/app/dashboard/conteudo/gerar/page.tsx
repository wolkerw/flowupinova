"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Check, X, Loader2, Calendar as CalendarIcon } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getFriendlyErrorMessage, isConnectionError } from "@/lib/utils";

import { schedulePost } from "@/lib/services/posts-service";
import { getMetaConnection, type MetaConnectionData } from "@/lib/services/meta-service";
import {
  getInstagramConnection,
  type InstagramConnectionData,
} from "@/lib/services/instagram-service";
import {
  getBusinessProfile,
  type BusinessProfileData,
} from "@/lib/services/business-profile-service";
import {
  getUnusedImages,
  saveUnusedImages,
  getContentHistory,
  saveContentHistory,
} from "@/lib/services/user-data-service";

import { GeneratedContent, Platform, LogoPosition } from "./types";
import { Step1Idea } from "./_components/Step1Idea";
import { Step2TextSelection } from "./_components/Step2TextSelection";
import { Step3ImageSelection } from "./_components/Step3ImageSelection";
import { Step4BrandCustomization } from "./_components/Step4BrandCustomization";
import { Step5ReviewPublish } from "./_components/Step5ReviewPublish";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ToastAction } from "@/components/ui/toast";

export default function GerarConteudoPage() {
  const [step, setStep] = useState(1);
  const [postSummary, setPostSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([]);
  const [selectedContentId, setSelectedContentId] = useState<string | undefined>(undefined);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [showSchedulerModal, setShowSchedulerModal] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [scheduleDateTime, setScheduleDateTime] = useState("");
  const [platforms, setPlatforms] = useState<Platform[]>([]);

  const [collaboratorsInput, setCollaboratorsInput] = useState("");
  const [collaborators, setCollaborators] = useState<string[]>([]);

  const [userTagsInput, setUserTagsInput] = useState("");
  const [userTags, setUserTags] = useState<{username: string, x: number, y: number}[]>([]);

  const [metaConnection, setMetaConnection] = useState<MetaConnectionData | null>(null);
  const [instagramConnection, setInstagramConnection] = useState<InstagramConnectionData | null>(
    null
  );
  const [businessProfile, setBusinessProfile] = useState<BusinessProfileData | null>(null);

  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [contentHistory, setContentHistory] = useState<GeneratedContent[]>([]);
  const [unusedImagesHistory, setUnusedImagesHistory] = useState<string[]>([]);

  // Estados para imagem de referência
  const [referenceImageFile, setReferenceImageFile] = useState<File | null>(null);
  const [referenceImagePreview, setReferenceImagePreview] = useState<string | null>(null);
  const [referenceDescription, setReferenceDescription] = useState("");

  // Personalização
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [logoPosition, setLogoPosition] = useState<LogoPosition>("bottom-right");
  const [logoScale, setLogoScale] = useState(30);
  const [logoOpacity, setLogoOpacity] = useState(80);

  const [isUploading, setIsUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Estado para rastrear o post atual e os prompts
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);

  // Refs para gerenciamento de memória e estado persistente
  const foundFilesRef = useRef<Set<string>>(new Set());
  const blobURLsRef = useRef<Set<string>>(new Set());
  const generatedImagesRef = useRef<string[]>([]);
  const userRef = useRef<any>(null);

  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const visualLogoScale = 5 + (logoScale - 10) * (45 / 90);

  const fetchUnusedImages = async () => {
    if (!user) return;
    try {
      const unusedImages = await getUnusedImages(user.uid);
      setUnusedImagesHistory(unusedImages.reverse());
    } catch (error: any) {
      console.error("Failed to fetch unused images:", error);
    }
  };

  const fetchContentHistory = async () => {
    if (!user) return;
    try {
      const history = await getContentHistory(user.uid);
      setContentHistory(history);
    } catch (error: any) {
      console.error("Failed to fetch content history:", error);
    }
  };

  useEffect(() => {
    if (!user) return;
    userRef.current = user;

    async function loadInitialData() {
      try {
        const [metaConn, instaConn, busProfile] = await Promise.all([
          getMetaConnection(user.uid),
          getInstagramConnection(user.uid),
          getBusinessProfile(user.uid),
          fetchUnusedImages(),
          fetchContentHistory(),
        ]);
        setMetaConnection(metaConn);
        setInstagramConnection(instaConn);
        setBusinessProfile(busProfile);
        
        const initialPlatforms: Platform[] = [];
        if (metaConn?.isConnected) initialPlatforms.push("facebook");
        if (instaConn?.isConnected) initialPlatforms.push("instagram");
        setPlatforms(initialPlatforms);
      } catch (error: any) {
        console.error("Failed to load initial data:", error);
      }
    }

    loadInitialData();
  }, [user]);

  useEffect(() => {
    generatedImagesRef.current = generatedImages;
  }, [generatedImages]);

  useEffect(() => {
    return () => {
      const currentImages = generatedImagesRef.current;
      const currentUser = userRef.current;

      if (currentUser && currentImages.length > 0) {
        const remoteUrls = currentImages.filter((url) => !url.startsWith("blob:"));
        if (remoteUrls.length > 0) {
          saveUnusedImages(currentUser.uid, remoteUrls).catch(console.error);
        }
      }

      blobURLsRef.current.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {
          console.warn("Falha ao revogar URL:", url, e);
        }
      });
      blobURLsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let attempts = 0;
    const maxAttempts = 15;

    // Apenas inicia o polling se NÃO houver imagem de referência (que é gerada instantaneamente)
    if (step === 3 && currentPostId && isGeneratingImages && !referenceImageFile) {
      const poll = async () => {
        attempts++;
        const filenamesToCheck = ["1", "2", "3"].filter((f) => !foundFilesRef.current.has(f));

        if (filenamesToCheck.length === 0) {
          setIsGeneratingImages(false);
          return true;
        }

        const fetchPromises = filenamesToCheck.map(async (filename) => {
          try {
            const response = await fetch(
              "https://webhook.flowupinova.com.br/webhook/buscar-imagens-supabase",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  postId: currentPostId,
                  filename: filename,
                  fileExtension: "png",
                }),
              }
            );

            if (response.ok) {
              const contentType = response.headers.get("content-type");

              if (contentType?.includes("application/json")) {
                const data = await response.json();
                const url = Array.isArray(data) ? data[0]?.url_post : data?.url_post;
                if (url) {
                  foundFilesRef.current.add(filename);
                  setGeneratedImages((prev) => [...prev, url]);
                  setSelectedImage((prev) => prev || url);
                }
              } else {
                const blob = await response.blob();
                if (blob.size > 100 && blob.type.startsWith("image/")) {
                  const imageUrl = URL.createObjectURL(blob);
                  blobURLsRef.current.add(imageUrl);
                  foundFilesRef.current.add(filename);

                  setGeneratedImages((prev) => [...prev, imageUrl]);
                  setSelectedImage((prev) => prev || imageUrl);
                }
              }
            }
          } catch (error) {
            console.error(`[POLLING] Erro ao buscar imagem ${filename}:`, error);
          }
        });

        await Promise.all(fetchPromises);

        if (foundFilesRef.current.size === 3) {
          setIsGeneratingImages(false);
          return true;
        }

        if (attempts >= maxAttempts) {
          setIsGeneratingImages(false);
          return true;
        }

        return false;
      };

      poll().then((stopped) => {
        if (!stopped) {
          interval = setInterval(async () => {
            const shouldStop = await poll();
            if (shouldStop) {
              clearInterval(interval);
            }
          }, 10000);
        }
      });
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, currentPostId, isGeneratingImages, toast, referenceImageFile]);

  const handleReferenceImageChange = (file: File | null) => {
    if (file) {
      const url = URL.createObjectURL(file);
      blobURLsRef.current.add(url);
      setReferenceImageFile(file);
      setReferenceImagePreview(url);
    } else {
      setReferenceImageFile(null);
      setReferenceImagePreview(null);
      setReferenceDescription("");
    }
  };

  const handleGenerateText = async (summary?: string) => {
    const textToGenerate = summary || postSummary;
    if (!textToGenerate.trim() || isLoading || !user) return null;
    setIsLoading(true);

    try {
      const response = await fetch("/api/generate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary: textToGenerate }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.error || "Erro na API");

      if (Array.isArray(data) && data.length > 0) {
        const content = data as GeneratedContent[];
        setGeneratedContent(content);
        setSelectedContentId("0");
        if (!summary) {
          await saveContentHistory(user.uid, content);
          await fetchContentHistory();
        }
        setStep(2);
        return content;
      } else {
        throw new Error("O formato da resposta da IA é inesperado.");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao gerar texto",
        description: getFriendlyErrorMessage(error.message),
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePrompts = async () => {
    const selectedContent = selectedContentId
      ? generatedContent[parseInt(selectedContentId, 10)]
      : generatedContent[0];
    if (!selectedContent || !user) return;

    setIsGeneratingImages(true);

    try {
      const fullCaption = `${selectedContent.título}\n\n${selectedContent.subtitulo}\n\n${Array.isArray(selectedContent.hashtags) ? selectedContent.hashtags.join(" ") : ""}`;
      const postsRef = collection(db, "users", user.uid, "posts");
      const docRef = await addDoc(postsRef, {
        text: fullCaption,
        status: "draft",
        createdAt: serverTimestamp(),
        scheduledAt: serverTimestamp(),
        imageUrls: [],
        platforms: [],
        isCarousel: false,
        connections: {
          instagramUsername: instagramConnection?.instagramUsername || null,
          pageName: metaConnection?.pageName || null,
        },
      });
      const postId = docRef.id;
      setCurrentPostId(postId);

      if (referenceImageFile) {
        // Fluxo de Imagem de Referência
        const formData = new FormData();
        formData.append("file", referenceImageFile);
        formData.append("description", referenceDescription);
        formData.append("postId", postId);
        formData.append("content", JSON.stringify(selectedContent));

        const response = await fetch("/api/proxy-webhook?target=gerador_imagem_referencia", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.details || "Erro ao processar imagem de referência.");
        }

        const result = await response.json();
        // Suporta tanto objeto único quanto array
        const imageUrl = Array.isArray(result) ? result[0]?.url_post : result?.url_post;

        if (!imageUrl) {
          throw new Error("Não foi possível obter a imagem gerada a partir da referência.");
        }

        setGeneratedImages([imageUrl]);
        setSelectedImage(imageUrl);
        setIsGeneratingImages(false);
        setStep(3);
        return;
      }

      // Fluxo Padrão (3 variações paralelas)
      const response = await fetch("/api/generate-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: selectedContent }),
      });
      const data = await response.json();
      const generatedPrompts = data?.[0]?.output?.prompt;

      if (!generatedPrompts || !Array.isArray(generatedPrompts)) {
        throw new Error("Não foi possível gerar os prompts para a imagem.");
      }

      const filenames = ["1", "2", "3"];
      const webhookPromises = filenames.map((fname, index) => {
        const promptToUse = generatedPrompts[index] || generatedPrompts[0];
        return fetch("https://webhook.flowupinova.com.br/webhook/gerador-imagem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: promptToUse,
            postId: postId,
            fileName: fname,
            content: selectedContent,
          }),
        });
      });

      const webhookResponses = await Promise.all(webhookPromises);
      if (!webhookResponses.every((res) => res.ok)) {
        throw new Error("O serviço de geração de imagem retornou um erro em uma das chamadas.");
      }

      setGeneratedImages([]);
      foundFilesRef.current.clear();
      setStep(3);
    } catch (error: any) {
      console.error("Erro no fluxo de geração:", error);
      toast({
        variant: "destructive",
        title: "Erro na Geração",
        description: getFriendlyErrorMessage(error.message),
      });
      setIsGeneratingImages(false);
    }
  };

  const handleLogoProcessing = async () => {
    if (!selectedImage) return;

    // Se não houver logomarca, tenta converter blob para URL pública do Supabase via webhook
    if (!logoFile) {
      if (!selectedImage.startsWith("blob:")) {
        setProcessedImageUrl(null);
        setStep(5);
        return;
      }

      setIsUploading(true);
      try {
        const formData = new FormData();
        const imageBlob = await fetch(selectedImage).then((r) => r.blob());
        formData.append("file", new File([imageBlob], "raw-image.jpg", { type: imageBlob.type }));

        const response = await fetch("/api/proxy-webhook?target=imagem_sem_logo", {
          method: "POST",
          body: formData,
          headers: { "X-Server-Timeout": "300" },
        });

        const result = await response.json();
        if (response.ok && result?.[0]?.url_post) {
          setProcessedImageUrl(result[0].url_post);
          setStep(5);
        } else {
          throw new Error("Não foi possível obter uma URL pública para a imagem.");
        }
      } catch (error: any) {
        console.error("Erro ao converter blob para URL pública:", error);
        // Fallback: vai para o passo 5 com o blob, o posts-service tentará o Firebase Storage
        setProcessedImageUrl(null);
        setStep(5);
      } finally {
        setIsUploading(false);
      }
      return;
    }

    setIsUploading(true);
    toast({
      title: "Processando imagem...",
      description: "Aplicando edições e enviando para o webhook.",
    });

    try {
      const img = new window.Image();
      img.src = selectedImage;
      await new Promise((resolve) => (img.onload = resolve));

      const formData = new FormData();
      const imageBlob = await fetch(selectedImage).then((r) => r.blob());
      formData.append(
        "file",
        new File([imageBlob], "generated-image.jpg", { type: imageBlob.type })
      );

      formData.append("logo", logoFile);
      formData.append("logoScale", logoScale.toString());
      formData.append("logoOpacity", logoOpacity.toString());

      const logoPixelWidth = img.width * (visualLogoScale / 100);
      let posX = 0,
        posY = 0;
      const margin = 16;

      switch (logoPosition) {
        case "top-left":
          posX = margin;
          posY = margin;
          break;
        case "top-center":
          posX = img.width / 2 - logoPixelWidth / 2;
          posY = margin;
          break;
        case "top-right":
          posX = img.width - logoPixelWidth - margin;
          posY = margin;
          break;
        case "left-center":
          posX = margin;
          posY = img.height / 2 - logoPixelWidth / 2;
          break;
        case "center":
          posX = img.width / 2 - logoPixelWidth / 2;
          posY = img.height / 2 - logoPixelWidth / 2;
          break;
        case "right-center":
          posX = img.width - logoPixelWidth - margin;
          posY = img.height / 2 - logoPixelWidth / 2;
          break;
        case "bottom-left":
          posX = margin;
          posY = img.height - logoPixelWidth - margin;
          break;
        case "bottom-center":
          posX = img.width / 2 - logoPixelWidth / 2;
          posY = img.height - logoPixelWidth - margin;
          break;
        case "bottom-right":
          posX = img.width - logoPixelWidth - margin;
          posY = img.height - logoPixelWidth - margin;
          break;
      }

      formData.append("positionX", Math.round(posX).toString());
      formData.append("positionY", Math.round(posY).toString());

      const response = await fetch("/api/proxy-webhook?target=post_manual", {
        method: "POST",
        body: formData,
        headers: { "X-Server-Timeout": "300" },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.details || "Falha no webhook de personalização.");

      setProcessedImageUrl(result?.[0]?.url_post);
      setStep(5);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao Processar Imagem",
        description: getFriendlyErrorMessage(error.message),
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handlePublish = async (publishMode: "now" | "schedule") => {
    let finalImageUrl = processedImageUrl || selectedImage;
    const selectedContent = selectedContentId ? generatedContent[parseInt(selectedContentId)] : null;

    if (!selectedContent || !finalImageUrl || !user) return;

    if (platforms.length === 0) {
      toast({
        variant: "destructive",
        title: "Nenhuma plataforma",
        description: "Selecione ao menos uma plataforma para publicar.",
      });
      return;
    }

    if (publishMode === "schedule" && !scheduleDateTime) {
      toast({
        variant: "destructive",
        title: "Data inválida",
        description: "Selecione data e hora.",
      });
      return;
    }

    setIsPublishing(true);

    // Se for um blob, tenta converter para URL pública do Supabase via webhook ANTES de tudo
    if (finalImageUrl.startsWith("blob:")) {
      try {
        const imageBlob = await fetch(finalImageUrl).then((r) => r.blob());
        const formData = new FormData();
        formData.append("file", new File([imageBlob], "post-image.jpg", { type: imageBlob.type }));

        const response = await fetch("/api/proxy-webhook?target=imagem_sem_logo", {
          method: "POST",
          body: formData,
          headers: { "X-Server-Timeout": "300" },
        });

        const result = await response.json();
        if (response.ok && result?.[0]?.url_post) {
          finalImageUrl = result[0].url_post;
          setProcessedImageUrl(finalImageUrl);
        } else {
          throw new Error("Não foi possível converter a imagem para uma URL pública do Supabase.");
        }
      } catch (error: any) {
        console.error("Erro na conversão automática:", error);
        toast({
          variant: "destructive",
          title: "Erro de Mídia",
          description:
            "Não conseguimos gerar uma URL pública para esta imagem no Supabase. O serviço de publicação pode falhar.",
        });
        // Continua com o blob como fallback, mas o posts-service provavelmente falhará no Firebase Storage
      }
    }
    const fullCaption = `${selectedContent.título}\n\n${selectedContent.subtitulo}\n\n${selectedContent.hashtags.join(" ")}`;

    try {
      const result = await schedulePost(user.uid, {
        text: fullCaption,
        media: [{ file: new File([], ""), publicUrl: finalImageUrl }],
        isCarousel: false,
        platforms: platforms,
        scheduledAt: publishMode === "schedule" ? new Date(scheduleDateTime) : new Date(),
        collaborators: collaborators.length > 0 ? collaborators : undefined,
        userTags: userTags.length > 0 ? userTags : undefined,
        metaConnection: metaConnection || undefined,
        instagramConnection: instagramConnection || undefined,
      });

      if (result.success) {
        toast({ 
          title: "Publicação realizada com sucesso!", 
          description: publishMode === "now" ? "Seu post foi enviado para as redes sociais." : "Seu post foi agendado com sucesso." 
        });
        router.push("/dashboard/conteudo");
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      const isConnError = isConnectionError(error.message);
      toast({
        variant: "destructive",
        title: "Erro ao Publicar",
        description: getFriendlyErrorMessage(error.message),
        action: isConnError ? (
          <ToastAction altText="Reconectar" onClick={() => router.push("/dashboard/conteudo")}>
            Ir para Conexões
          </ToastAction>
        ) : undefined,
      });
    } finally {
      setIsPublishing(false);
      setShowSchedulerModal(false);
    }
  };

  const handleDownloadImage = async (url: string) => {
    try {
      const blob = await fetch(url).then((r) => r.blob());
      const a = document.createElement("a");
      a.href = window.URL.createObjectURL(blob);
      a.download = `numvapt-${Date.now()}.jpg`;
      a.click();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro no Download" });
    }
  };

  const handleLogoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({ variant: "destructive", title: "Arquivo muito grande (Máx 2MB)" });
        return;
      }
      const url = URL.createObjectURL(file);
      blobURLsRef.current.add(url);
      setLogoPreviewUrl(url);
      setLogoFile(file);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Gerar Post</h1>
        <p className="mt-1 text-gray-600">
          {step === 1 && "Detalhe à nossa IA uma ideia e ela criará um post incríveis para você."}
          {step === 2 && "Etapa 2: Selecione uma opção de texto para o seu post."}
          {step === 3 && "Etapa 3: Selecione a melhor imagem para o seu post."}
          {step === 4 && "Etapa 4: Personalize sua imagem com sua logomarca."}
          {step === 5 && "Etapa 5: Revise e agende seu post para as redes sociais."}
        </p>
      </div>

      {step === 1 && (
        <Step1Idea
          postSummary={postSummary}
          onPostSummaryChange={setPostSummary}
          onGenerate={() => handleGenerateText()}
          isLoading={isLoading}
          referenceImagePreview={referenceImagePreview}
          onReferenceImageChange={handleReferenceImageChange}
          referenceDescription={referenceDescription}
          onReferenceDescriptionChange={setReferenceDescription}
        />
      )}

      {step === 2 && (
        <Step2TextSelection
          generatedContent={generatedContent}
          selectedContentId={selectedContentId}
          onSelectedContentIdChange={setSelectedContentId}
          onBack={() => setStep(1)}
          onGeneratePrompts={handleGeneratePrompts}
          isGeneratingImages={isGeneratingImages}
          user={user}
          instagramConnection={instagramConnection}
        />
      )}

      {step === 3 && (
        <Step3ImageSelection
          generatedImages={generatedImages}
          selectedImage={selectedImage}
          onSelectedImageChange={setSelectedImage}
          onBack={() => setStep(2)}
          onNext={() => setStep(4)}
          isGeneratingImages={isGeneratingImages}
          onDownload={handleDownloadImage}
        />
      )}

      {step === 4 && selectedImage && (
        <Step4BrandCustomization
          selectedImage={selectedImage}
          logoFile={logoFile}
          logoPreviewUrl={logoPreviewUrl}
          logoPosition={logoPosition}
          logoScale={logoScale}
          logoOpacity={logoOpacity}
          onLogoUpload={handleLogoFileChange}
          onLogoRemove={() => {
            setLogoFile(null);
            setLogoPreviewUrl(null);
          }}
          onPositionChange={setLogoPosition}
          onScaleChange={setLogoScale}
          onOpacityChange={setLogoOpacity}
          onBack={() => setStep(3)}
          onNext={handleLogoProcessing}
          isUploading={isUploading}
          visualLogoScale={visualLogoScale}
          logoInputRef={logoInputRef}
        />
      )}

      {step === 5 && selectedContentId && selectedImage && (
        <Step5ReviewPublish
          processedImageUrl={processedImageUrl}
          selectedImage={selectedImage}
          selectedContent={generatedContent[parseInt(selectedContentId)]}
          user={user}
          metaConnection={metaConnection}
          instagramConnection={instagramConnection}
          platforms={platforms}
          collaborators={collaborators}
          collaboratorsInput={collaboratorsInput}
          onCollaboratorsChange={setCollaborators}
          onCollaboratorsInputChange={setCollaboratorsInput}
          userTags={userTags}
          userTagsInput={userTagsInput}
          onUserTagsChange={setUserTags}
          onUserTagsInputChange={setUserTagsInput}
          onPlatformChange={(p) =>
            setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
          }
          onPublish={(mode) =>
            mode === "now" ? handlePublish("now") : setShowSchedulerModal(true)
          }
          onBack={() => setStep(4)}
          isPublishing={isPublishing}
        />
      )}

      {showSchedulerModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowSchedulerModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="max-md w-full rounded-xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b p-6">
              <h3 className="flex items-center gap-2 text-xl font-bold">
                <CalendarIcon className="h-5 w-5" /> Agendar Publicação
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setShowSchedulerModal(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="space-y-4 p-6">
              <Label htmlFor="schedule-datetime">Data e Hora</Label>
              <Input
                id="schedule-datetime"
                type="datetime-local"
                value={scheduleDateTime}
                onChange={(e) => setScheduleDateTime(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3 border-t bg-gray-50 p-6">
              <Button
                variant="outline"
                onClick={() => setShowSchedulerModal(false)}
                disabled={isPublishing}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => handlePublish("schedule")}
                disabled={isPublishing || !scheduleDateTime}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                {isPublishing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Confirmar
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
