"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { doc, getDoc, collection, addDoc, serverTimestamp, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getFriendlyErrorMessage } from "@/lib/utils";
import { schedulePost, deletePost } from "@/lib/services/posts-service";
import { getMetaConnection, type MetaConnectionData } from "@/lib/services/meta-service";
import { getInstagramConnection, type InstagramConnectionData } from "@/lib/services/instagram-service";
import { getBusinessProfile, type BusinessProfileData } from "@/lib/services/business-profile-service";
import { getUnusedImages, saveUnusedImages, getContentHistory, saveContentHistory } from "@/lib/services/user-data-service";
import { GeneratedContent, Platform, LogoPosition } from "../types";

interface WizardContextType {
  // States
  step: number;
  setStep: (step: number) => void;
  postSummary: string;
  setPostSummary: (summary: string) => void;
  isLoading: boolean;
  generatedContent: GeneratedContent[];
  setGeneratedContent: React.Dispatch<React.SetStateAction<GeneratedContent[]>>;
  selectedContentId: string | undefined;
  setSelectedContentId: (id: string | undefined) => void;
  generatedImages: string[];
  setGeneratedImages: React.Dispatch<React.SetStateAction<string[]>>;
  selectedImage: string | null;
  setSelectedImage: (url: string | null) => void;
  processedImageUrl: string | null;
  setProcessedImageUrl: (url: string | null) => void;
  showSchedulerModal: boolean;
  setShowSchedulerModal: (show: boolean) => void;
  isPublishing: boolean;
  scheduleDateTime: string;
  setScheduleDateTime: (dateTime: string) => void;
  platforms: Platform[];
  setPlatforms: React.Dispatch<React.SetStateAction<Platform[]>>;
  collaborators: string[];
  setCollaborators: (collabs: string[]) => void;
  collaboratorsInput: string;
  setCollaboratorsInput: (input: string) => void;
  userTags: {username: string, x: number, y: number}[];
  setUserTags: (tags: {username: string, x: number, y: number}[]) => void;
  userTagsInput: string;
  setUserTagsInput: (input: string) => void;
  isGeneratingImages: boolean;
  setIsGeneratingImages: (val: boolean) => void;
  canStartPolling: boolean;
  contentHistory: GeneratedContent[];
  unusedImagesHistory: string[];
  
  // Reference Image States
  referenceImageFile: File | null;
  setReferenceImageFile: (file: File | null) => void;
  referenceImagePreview: string | null;
  setReferenceImagePreview: (preview: string | null) => void;
  inspirationFile: File | null;
  setInspirationFile: (file: File | null) => void;
  referenceDescription: string;
  setReferenceDescription: (desc: string) => void;
  referenceLink: string;
  setReferenceLink: (link: string) => void;
  
  // Customization States
  logoFile: File | null;
  setLogoFile: (file: File | null) => void;
  logoPreviewUrl: string | null;
  setLogoPreviewUrl: (url: string | null) => void;
  logoPosition: LogoPosition;
  setLogoPosition: (pos: LogoPosition) => void;
  logoScale: number;
  setLogoScale: (scale: number) => void;
  logoOpacity: number;
  setLogoOpacity: (opacity: number) => void;
  showTextOverlay: boolean;
  setShowTextOverlay: (show: boolean) => void;
  textPosition: LogoPosition;
  setTextPosition: (pos: LogoPosition) => void;
  textScale: number;
  setTextScale: (scale: number) => void;
  textColor: string;
  setTextColor: (color: string) => void;
  fontFamily: string;
  setFontFamily: (font: string) => void;
  fontWeight: string;
  setFontWeight: (weight: string) => void;
  isItalic: boolean;
  setIsItalic: (italic: boolean) => void;
  isUploading: boolean;
  
  // Computed & Refs
  mode: string | null;
  user: any;
  metaConnection: MetaConnectionData | null;
  instagramConnection: InstagramConnectionData | null;
  businessProfile: BusinessProfileData | null;
  currentPostId: string | null;
  visualLogoScale: number;
  selectedContent: GeneratedContent | null;
  logoInputRef: React.RefObject<HTMLInputElement>;
  foundFilesRef: React.RefObject<Set<string>>;
  
  // Handlers
  handleGenerateText: (summary?: string) => Promise<GeneratedContent[] | null>;
  handleGeneratePostContent: () => Promise<void>;
  handleGeneratePrompts: () => Promise<void>;
  handleLogoProcessing: () => Promise<void>;
  handlePublish: (publishMode: "now" | "schedule") => Promise<void>;
  handleReferenceImageChange: (file: File | null) => void;
  handleDownloadImage: (url: string) => Promise<void>;
  handleLogoFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const WizardContext = createContext<WizardContextType | undefined>(undefined);

export const WizardProvider = ({ children }: { children: React.ReactNode }) => {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
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
  const [instagramConnection, setInstagramConnection] = useState<InstagramConnectionData | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfileData | null>(null);

  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [canStartPolling, setCanStartPolling] = useState(false);
  const [contentHistory, setContentHistory] = useState<GeneratedContent[]>([]);
  const [unusedImagesHistory, setUnusedImagesHistory] = useState<string[]>([]);

  // Estados para imagem de referência
  const [referenceImageFile, setReferenceImageFile] = useState<File | null>(null);
  const [referenceImagePreview, setReferenceImagePreview] = useState<string | null>(null);
  const [inspirationFile, setInspirationFile] = useState<File | null>(null);
  const [referenceDescription, setReferenceDescription] = useState("");
  const [referenceLink, setReferenceLink] = useState("");

  // Personalização
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [logoPosition, setLogoPosition] = useState<LogoPosition>("bottom-right");
  const [logoScale, setLogoScale] = useState(30);
  const [logoOpacity, setLogoOpacity] = useState(80);
  
  // Text Overlay States
  const [showTextOverlay, setShowTextOverlay] = useState(false);
  const [textPosition, setTextPosition] = useState<LogoPosition>("top-center");
  const [textScale, setTextScale] = useState(100);
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [fontFamily, setFontFamily] = useState("Inter");
  const [fontWeight, setFontWeight] = useState("bold");
  const [isItalic, setIsItalic] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  const [lastGeneratedText, setLastGeneratedText] = useState<string>("");

  const handleSelectedImageChange = (url: string | null) => {
    setSelectedImage(url);
    setProcessedImageUrl(null); // Limpa a imagem processada com logo antigo ao mudar de imagem conceito
  };

  const foundFilesRef = useRef<Set<string>>(new Set());
  const blobURLsRef = useRef<Set<string>>(new Set());
  const generatedImagesRef = useRef<string[]>([]);
  const userRef = useRef<any>(null);

  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const visualLogoScale = 5 + (logoScale - 10) * (45 / 90);
  const selectedContent = selectedContentId
    ? generatedContent[parseInt(selectedContentId, 10)]
    : null;

  const fetchUnusedImages = useCallback(async () => {
    if (!user) return;
    try {
      const unusedImages = await getUnusedImages(user.uid);
      setUnusedImagesHistory(unusedImages.reverse());
    } catch (error: any) {
      console.error("Failed to fetch unused images:", error);
    }
  }, [user]);

  const fetchContentHistory = useCallback(async () => {
    if (!user) return;
    try {
      const history = await getContentHistory(user.uid);
      setContentHistory(history);
    } catch (error: any) {
      console.error("Failed to fetch content history:", error);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    userRef.current = user;

    async function loadInitialData() {
      try {
        if (!user) return;
        const [metaConn, instaConn, busProfile] = await Promise.all([
          getMetaConnection(user.uid),
          getInstagramConnection(user.uid),
          getBusinessProfile(user.uid),
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
    const maxAttempts = 30;

    if ((step === 3 || step === 4) && currentPostId && !referenceImageFile && canStartPolling) {
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
  }, [step, currentPostId, isGeneratingImages, toast, referenceImageFile, canStartPolling]);

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

  const handleGenerateText = async (summary?: any) => {
    let textToGenerate = (typeof summary === 'string' ? summary : null) || postSummary;
    
    if (mode === "reference-link" && !summary) {
      if (!inspirationFile || !referenceDescription.trim()) {
        toast({
          title: "Campos obrigatórios",
          description: "Por favor, envie uma imagem de inspiração e descreva o que deseja.",
        });
        return null;
      }
      setIsLoading(true);
      try {
        const formData = new FormData();
        formData.append("inspiration_file", inspirationFile);
        formData.append("description", referenceDescription);
        formData.append("user_id", user?.uid || "");
        
        if (businessProfile) {
          formData.append("business_name", businessProfile.name || "");
          formData.append("business_category", businessProfile.category || "");
          formData.append("business_description", businessProfile.description || "");
        }

        if (referenceImageFile) {
          formData.append("product_file", referenceImageFile);
        }

        const response = await fetch("/api/proxy-webhook?target=gerador_link_referencia", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.details || "Erro ao processar link de referência.");

        const publicacoes = Array.isArray(data) 
          ? (data[0]?.publicacoes || data) 
          : (data.publicacoes || data);

        if (Array.isArray(publicacoes)) {
          const mappedContent = publicacoes.map((item: any) => ({
            titulo: item.titulo || item.título || "",
            subtitulo: item.subtitulo || "",
            hashtags: item.hashtags || [],
            url_da_imagem: item.url_da_imagem
          }));

          setGeneratedContent(mappedContent);
          setSelectedContentId("0");
          setStep(2);
          return mappedContent;
        }
        throw new Error("Formato de resposta inválido do webhook.");
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Erro no Link",
          description: getFriendlyErrorMessage(error.message),
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    }

    if (mode === "reference-photo" && !textToGenerate.trim() && referenceDescription.trim()) {
      textToGenerate = referenceDescription;
    }

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

      const publicacoes = Array.isArray(data) 
        ? (data[0]?.publicacoes || data) 
        : (data.publicacoes || data);

      if (Array.isArray(publicacoes)) {
        const mappedContent = publicacoes.map((item: any) => ({
          titulo: item.titulo || item.título || "",
          subtitulo: item.subtitulo || "",
          hashtags: item.hashtags || [],
          url_da_imagem: item.url_da_imagem
        }));

        setGeneratedContent(mappedContent);
        setSelectedContentId("0");
        if (!summary) {
          await saveContentHistory(user.uid, mappedContent);
          await fetchContentHistory();
        }
        setStep(2);
        return mappedContent;
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

  const handleGeneratePostContent = async () => {
    if (!user || isLoading) return;
    setIsLoading(true);
    try {
      const imageUrl = generatedContent[0]?.url_da_imagem;
      const response = await fetch("/api/proxy-webhook?target=gerador_conteudo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl,
          businessProfile,
          referenceDescription,
          postId: currentPostId,
          userId: user.uid
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.details || "Erro ao gerar conteúdo.");

      const publicacoes = Array.isArray(data) 
        ? (data[0]?.publicacoes || data) 
        : (data.publicacoes || [data]);

      if (Array.isArray(publicacoes)) {
        const mappedContent = publicacoes.map((item: any) => ({
          titulo: item.titulo || item.título || "",
          subtitulo: item.subtitulo || "",
          hashtags: item.hashtags || [],
          url_da_imagem: imageUrl || item.url_da_imagem
        }));

        setGeneratedContent(mappedContent);
        setSelectedContentId("0");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro na Geração",
        description: getFriendlyErrorMessage(error.message),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePrompts = async () => {
    const selContent = selectedContentId
      ? generatedContent[parseInt(selectedContentId, 10)]
      : generatedContent[0];
    if (!selContent || !user) return;

    const fullCaption = `${selContent.titulo}\n\n${selContent.subtitulo}\n\n${Array.isArray(selContent.hashtags) ? selContent.hashtags.join(" ") : ""}`;

    // Se a legenda selecionada for idêntica à última gerada com sucesso e já temos imagens prontas,
    // apenas evitamos regerar as imagens para economizar tempo, banda e evitar bugs
    if (fullCaption === lastGeneratedText && generatedImages.length > 0) {
      console.log("[WIZARD] O conteúdo de texto selecionado não mudou. Mantendo as imagens geradas anteriormente.");
      return;
    }

    setIsGeneratingImages(true);
    setCanStartPolling(false);
    setGeneratedImages([]);
    foundFilesRef.current.clear();

    try {
      // Deletar o rascunho de post anterior ("draft") no Firestore local se o lojista decidir regerar as imagens
      if (currentPostId) {
        try {
          await deletePost(user.uid, currentPostId);
          console.log("[WIZARD] Post de rascunho anterior abandonado foi deletado do Firestore com sucesso.");
        } catch (deleteError) {
          console.error("[WIZARD] Erro ao deletar rascunho anterior obsoleto:", deleteError);
        }
      }
      const fullCaption = `${selContent.titulo}\n\n${selContent.subtitulo}\n\n${Array.isArray(selContent.hashtags) ? selContent.hashtags.join(" ") : ""}`;
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
        const formData = new FormData();
        formData.append("file", referenceImageFile);
        formData.append("description", referenceDescription);
        formData.append("postId", postId);
        formData.append("userId", user.uid);
        formData.append("content", JSON.stringify(selContent));

        const response = await fetch("/api/proxy-webhook?target=gerador_imagem_referencia", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.details || errorData.error || "Erro ao processar imagem de referência.");
        }

        console.log("[WIZARD] Geração por referência iniciada de forma assíncrona. Escutando Firestore em tempo real...");

        // Iniciamos um escutador em tempo real (onSnapshot) no Firestore para obter a imagem assim que ela ficar pronta
        const { onSnapshot } = await import("firebase/firestore");
        const postDocRef = doc(db, "users", user.uid, "posts", postId);
        
        const unsubscribe = onSnapshot(postDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data?.imageUrls && data.imageUrls.length > 0) {
              const finalUrl = data.imageUrls[0];
              console.log("[WIZARD] Imagem por referência recebida via Firestore com sucesso:", finalUrl);
              setGeneratedImages([finalUrl]);
              setSelectedImage(finalUrl);
              setLastGeneratedText(fullCaption); // Registra a legenda de sucesso
              setIsGeneratingImages(false);
              unsubscribe();
            } else if (data?.status === "failed") {
              const errMsg = data.failureReason || "Falha desconhecida na geração por referência.";
              toast({
                variant: "destructive",
                title: "Erro na Geração",
                description: getFriendlyErrorMessage(errMsg),
              });
              setIsGeneratingImages(false);
              unsubscribe();
            }
          }
        });
        
        return;
      }


      const response = await fetch("/api/generate-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: selContent }),
      });
      const data = await response.json();
      const generatedPrompts = data?.[0]?.output?.prompt;

      if (!generatedPrompts || !Array.isArray(generatedPrompts)) {
        throw new Error("Não foi possível gerar os prompts.");
      }

      console.log("[WIZARD] Prompts gerados localmente! Iniciando geração das imagens em paralelo via Google Imagen...");

      const filenames = ["1", "2", "3"];
      const imageGenerationPromises = filenames.map(async (fname, index) => {
        const promptToUse = generatedPrompts[index] || generatedPrompts[0];
        
        const imgResponse = await fetch("/api/generate-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: promptToUse,
            postId: postId,
            fileName: fname,
            userId: user.uid,
            content: selContent,
          }),
        });

        if (!imgResponse.ok) {
          const errData = await imgResponse.json().catch(() => ({}));
          throw new Error(errData.error || `Erro ao gerar a imagem ${fname}`);
        }

        const imgData = await imgResponse.json();
        return imgData.imageUrl;
      });

      const imageUrls = await Promise.all(imageGenerationPromises);
      console.log("[WIZARD] Sucesso absoluto! As 3 imagens foram geradas e salvas no Supabase:", imageUrls);

      // Atualizar o post no Firestore local a partir do frontend autenticado do usuário (usando as URLs estáveis do Supabase)
      try {
        const postDocRef = doc(db, "users", user.uid, "posts", postId);
        await updateDoc(postDocRef, {
          imageUrls: imageUrls
        });
        console.log("[WIZARD] Documento do post atualizado no Firestore com as imagens geradas.");
      } catch (firestoreError) {
        console.error("[WIZARD] Erro ao atualizar o Firestore local com as imagens:", firestoreError);
      }

      setGeneratedImages(imageUrls);
      setSelectedImage(imageUrls[0] || null);
      setLastGeneratedText(fullCaption); // Registra a legenda de sucesso
      
      // Ativa o polling assíncrono para carregar as imagens reais na tela conforme sobem no Supabase
      setCanStartPolling(true);
      // Mantemos o spinner rodando; o polling se encarregará de desativá-lo automaticamente quando as 3 imagens reais existirem

    } catch (error: any) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro na Geração", description: getFriendlyErrorMessage(error.message) });
      setIsGeneratingImages(false);
    }
  };

  const handleLogoProcessing = async () => {
    if (!selectedImage) return;
    if (!logoFile) {
      if (!selectedImage.startsWith("blob:")) {
        setProcessedImageUrl(null);
        setStep(5);
        return;
      }
      setIsUploading(true);
      try {
        const imageBlob = await fetch(selectedImage).then((r) => r.blob());
        const formData = new FormData();
        formData.append("file", new File([imageBlob], "raw-image.jpg", { type: imageBlob.type }));
        const response = await fetch("/api/proxy-webhook?target=imagem_sem_logo", { method: "POST", body: formData });
        const result = await response.json();
        if (response.ok && result?.[0]?.url_post) {
          const finalNoLogoUrl = result[0].url_post;
          setProcessedImageUrl(finalNoLogoUrl);

          // Atualizar o rascunho temporário no Firestore local com a URL convertida (caso exista rascunho)
          if (currentPostId) {
            try {
              const postDocRef = doc(db, "users", user.uid, "posts", currentPostId);
              await updateDoc(postDocRef, {
                imageUrls: [finalNoLogoUrl]
              });
              console.log("[WIZARD] Rascunho temporário atualizado com a imagem sem logotipo.");
            } catch (firestoreError) {
              console.error("[WIZARD] Erro ao salvar a imagem sem logo no Firestore local:", firestoreError);
            }
          }

          setStep(5);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsUploading(false);
      }
      return;
    }

    setIsUploading(true);
    try {
      const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
        return new Promise((resolve, reject) => {
          const img = document.createElement("img");
          img.onload = () => resolve({ width: img.width, height: img.height });
          img.onerror = reject;
          img.src = url;
        });
      };

      const visualLogoScale = 5 + (logoScale - 10) * (45 / 90);
      const { width: mainImageWidth, height: mainImageHeight } = await getImageDimensions(selectedImage);
      const logoPixelWidth = mainImageWidth * (visualLogoScale / 100);
      let positionX = 0, positionY = 0;
      
      // Margem proporcional baseada em 16px em relação ao tamanho máximo de 384px (max-w-sm) do preview no front
      const margin = mainImageWidth * 0.04167;

      switch (logoPosition) {
        case "top-left": positionX = margin; positionY = margin; break;
        case "top-center": positionX = mainImageWidth / 2 - logoPixelWidth / 2; positionY = margin; break;
        case "top-right": positionX = mainImageWidth - logoPixelWidth - margin; positionY = margin; break;
        case "left-center": positionX = margin; positionY = mainImageHeight / 2 - logoPixelWidth / 2; break;
        case "center": positionX = mainImageWidth / 2 - logoPixelWidth / 2; positionY = mainImageHeight / 2 - logoPixelWidth / 2; break;
        case "right-center": positionX = mainImageWidth - logoPixelWidth - margin; positionY = mainImageHeight / 2 - logoPixelWidth / 2; break;
        case "bottom-left": positionX = margin; positionY = mainImageHeight - logoPixelWidth - margin; break;
        case "bottom-center": positionX = mainImageWidth / 2 - logoPixelWidth / 2; positionY = mainImageHeight - logoPixelWidth - margin; break;
        case "bottom-right": positionX = mainImageWidth - logoPixelWidth - margin; positionY = mainImageHeight - logoPixelWidth - margin; break;
      }

      const formData = new FormData();
      const imageBlob = await fetch(selectedImage).then((r) => r.blob());
      formData.append("file", new File([imageBlob], "image.jpg", { type: imageBlob.type }));
      formData.append("logo", logoFile);
      formData.append("logoScale", logoScale.toString());
      formData.append("logoOpacity", logoOpacity.toString());
      formData.append("positionX", Math.round(positionX).toString());
      formData.append("positionY", Math.round(positionY).toString());

      const response = await fetch("/api/proxy-webhook?target=post_manual", { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error("Falha no webhook de personalização.");
      
      const finalLogoUrl = result?.[0]?.url_post;
      setProcessedImageUrl(finalLogoUrl);

      // Atualizar o rascunho temporário no Firestore local com a URL final com o logotipo aplicado
      if (currentPostId) {
        try {
          const postDocRef = doc(db, "users", user.uid, "posts", currentPostId);
          await updateDoc(postDocRef, {
            imageUrls: [finalLogoUrl]
          });
          console.log("[WIZARD] Rascunho temporário atualizado com a imagem com logotipo aplicado.");
        } catch (firestoreError) {
          console.error("[WIZARD] Erro ao salvar a imagem com logo no Firestore local:", firestoreError);
        }
      }

      setStep(5);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao Processar", description: getFriendlyErrorMessage(error.message) });
    } finally {
      setIsUploading(false);
    }
  };

  const handlePublish = async (publishMode: "now" | "schedule") => {
    let finalImageUrl = processedImageUrl || selectedImage;
    if (!selectedContent || !finalImageUrl || !user) return;
    if (platforms.length === 0) {
      toast({ variant: "destructive", title: "Nenhuma plataforma", description: "Selecione ao menos uma plataforma." });
      return;
    }
    if (publishMode === "schedule" && !scheduleDateTime) {
      toast({ variant: "destructive", title: "Data inválida", description: "Selecione data e hora." });
      return;
    }

    setIsPublishing(true);
    if (finalImageUrl.startsWith("blob:")) {
      try {
        const imageBlob = await fetch(finalImageUrl).then((r) => r.blob());
        const formData = new FormData();
        formData.append("file", new File([imageBlob], "post-image.jpg", { type: imageBlob.type }));
        const response = await fetch("/api/proxy-webhook?target=imagem_sem_logo", { method: "POST", body: formData });
        const result = await response.json();
        if (response.ok && result?.[0]?.url_post) {
          finalImageUrl = result[0].url_post;
          setProcessedImageUrl(finalImageUrl);
        }
      } catch (error) {
        console.error(error);
      }
    }

    const fullCaption = `${selectedContent.titulo}\n\n${selectedContent.subtitulo}\n\n${selectedContent.hashtags.join(" ")}`;
    try {
      const result = await schedulePost(user.uid, {
        text: fullCaption,
        media: [{ file: new File([], ""), publicUrl: finalImageUrl || undefined }],
        isCarousel: false,
        platforms: platforms,
        scheduledAt: publishMode === "schedule" ? new Date(scheduleDateTime) : new Date(),
        collaborators: collaborators.length > 0 ? collaborators : undefined,
        userTags: userTags.length > 0 ? userTags : undefined,
        metaConnection: metaConnection || undefined,
        instagramConnection: instagramConnection || undefined,
      });

      if (result.success) {
        toast({ title: "Sucesso!", description: publishMode === "now" ? "Post enviado." : "Post agendado." });
        
        // Deletar o rascunho temporário obsoleto do Firestore se a publicação foi concluída
        if (currentPostId) {
          try {
            await deletePost(user.uid, currentPostId);
            console.log("[WIZARD] Rascunho temporário deletado com sucesso para evitar post duplicado.");
          } catch (deleteError) {
            console.error("[WIZARD] Erro ao deletar rascunho temporário obsoleto:", deleteError);
          }
        }

        router.push("/dashboard/conteudo");
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao publicar", description: error.message });
    } finally {
      setIsPublishing(false);
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
    <WizardContext.Provider value={{
      step, setStep, postSummary, setPostSummary, isLoading, generatedContent, setGeneratedContent, selectedContentId, setSelectedContentId,
      generatedImages, setGeneratedImages, selectedImage, setSelectedImage: handleSelectedImageChange, processedImageUrl, setProcessedImageUrl,
      showSchedulerModal, setShowSchedulerModal, isPublishing, scheduleDateTime, setScheduleDateTime, platforms, setPlatforms,
      collaborators, setCollaborators, collaboratorsInput, setCollaboratorsInput, userTags, setUserTags, userTagsInput, setUserTagsInput,
      isGeneratingImages, setIsGeneratingImages, canStartPolling, contentHistory, unusedImagesHistory,
      referenceImageFile, setReferenceImageFile, referenceImagePreview, setReferenceImagePreview, inspirationFile, setInspirationFile,
      referenceDescription, setReferenceDescription, referenceLink, setReferenceLink,
      logoFile, setLogoFile, logoPreviewUrl, setLogoPreviewUrl, logoPosition, setLogoPosition, logoScale, setLogoScale, logoOpacity, setLogoOpacity,
      showTextOverlay, setShowTextOverlay, textPosition, setTextPosition, textScale, setTextScale, textColor, setTextColor,
      fontFamily, setFontFamily, fontWeight, setFontWeight, isItalic, setIsItalic, isUploading,
      mode, user, metaConnection, instagramConnection, businessProfile, currentPostId, visualLogoScale, selectedContent,
      logoInputRef, foundFilesRef,
      handleGenerateText, handleGeneratePostContent, handleGeneratePrompts, handleLogoProcessing, handlePublish,
      handleReferenceImageChange, handleDownloadImage, handleLogoFileChange
    }}>
      {children}
    </WizardContext.Provider>
  );
};

export const useWizard = () => {
  const context = useContext(WizardContext);
  if (!context) throw new Error("useWizard must be used within a WizardProvider");
  return context;
};
