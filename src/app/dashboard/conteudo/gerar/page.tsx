"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Check, X, Loader2, Calendar as CalendarIcon } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import { schedulePost } from "@/lib/services/posts-service";
import { getMetaConnection, type MetaConnectionData } from "@/lib/services/meta-service";
import { getInstagramConnection, type InstagramConnectionData } from "@/lib/services/instagram-service";
import { getBusinessProfile, type BusinessProfileData } from "@/lib/services/business-profile-service";
import { 
  getUnusedImages, 
  saveUnusedImages, 
  removeUnusedImage, 
  getContentHistory, 
  saveContentHistory 
} from "@/lib/services/user-data-service";

import { GeneratedContent, Platform, LogoPosition } from "./types";
import { Step1Idea } from "./_components/Step1Idea";
import { Step2TextSelection } from "./_components/Step2TextSelection";
import { Step3ImageSelection } from "./_components/Step3ImageSelection";
import { Step4BrandCustomization } from "./_components/Step4BrandCustomization";
import { Step5ReviewPublish } from "./_components/Step5ReviewPublish";

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
  const [scheduleDateTime, setScheduleDateTime] = useState('');
  const [platforms, setPlatforms] = useState<Platform[]>(['facebook', 'instagram']);
  
  const [metaConnection, setMetaConnection] = useState<MetaConnectionData | null>(null);
  const [instagramConnection, setInstagramConnection] = useState<InstagramConnectionData | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfileData | null>(null);
  
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [contentHistory, setContentHistory] = useState<GeneratedContent[]>([]);
  const [unusedImagesHistory, setUnusedImagesHistory] = useState<string[]>([]);
  const [selectedHistoryContent, setSelectedHistoryContent] = useState<GeneratedContent | null>(null);
  const [selectedUnusedImage, setSelectedUnusedImage] = useState<string | null>(null);

  // Estados para imagem de referência
  const [referenceImageFile, setReferenceImageFile] = useState<File | null>(null);
  const [referenceImagePreview, setReferenceImagePreview] = useState<string | null>(null);
  const [referenceDescription, setReferenceDescription] = useState("");

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [logoPosition, setLogoPosition] = useState<LogoPosition>('bottom-right');
  const [logoScale, setLogoScale] = useState(30);
  const [logoOpacity, setLogoOpacity] = useState(80);
  const [isUploading, setIsUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

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
    
    async function loadInitialData() {
      try {
        const [metaConn, instaConn, busProfile] = await Promise.all([
          getMetaConnection(user.uid),
          getInstagramConnection(user.uid),
          getBusinessProfile(user.uid),
          fetchUnusedImages(),
          fetchContentHistory()
        ]);
        setMetaConnection(metaConn);
        setInstagramConnection(instaConn);
        setBusinessProfile(busProfile);
      } catch (error: any) {
        console.error("Failed to load initial data:", error);
      }
    }

    loadInitialData();
  }, [user]);

  useEffect(() => {
    return () => {
      if (user && generatedImages.length > 0) {
        saveUnusedImages(user.uid, generatedImages).catch(console.error);
      }
      if (logoPreviewUrl && logoPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
      if (referenceImagePreview && referenceImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(referenceImagePreview);
      }
    };
  }, [generatedImages, user, logoPreviewUrl, referenceImagePreview]);

  const handleReferenceImageChange = (file: File | null) => {
    if (referenceImagePreview) {
      URL.revokeObjectURL(referenceImagePreview);
    }
    if (file) {
      setReferenceImageFile(file);
      setReferenceImagePreview(URL.createObjectURL(file));
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
      const response = await fetch('/api/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary: textToGenerate }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.error || "Erro na API");
      
      if (Array.isArray(data) && data.length > 0) {
        const content = data as GeneratedContent[];
        setGeneratedContent(content);
        setSelectedContentId("0");
        if(!summary) {
          await saveContentHistory(user.uid, content);
          await fetchContentHistory();
        }
        setStep(2);
        return content;
      } else {
        throw new Error("O formato da resposta da IA é inesperado ou está vazio.");
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: "Erro ao gerar texto", description: error.message });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateImages = async (publication?: GeneratedContent | null) => {
    if (!user) return;
    const contentToUse = publication ? [publication] : (selectedContentId ? [generatedContent[parseInt(selectedContentId, 10)]] : []);
    if (contentToUse.length === 0) {
      toast({ variant: 'destructive', title: "Nenhum conteúdo", description: "Selecione um texto para gerar imagens." });
      return;
    }
    
    if(generatedImages.length > 0) {
      await saveUnusedImages(user.uid, generatedImages);
      await fetchUnusedImages();
    }
  
    setIsGeneratingImages(true);
    setGeneratedImages([]);
    setSelectedImage(null);
    setProcessedImageUrl(null);
    
    try {
      const response = await fetch('/api/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicacoes: contentToUse }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.details || result.error || "Erro HTTP");
      
      const imageUrls = result.data.map((item: any) => item.url_da_imagem).filter(Boolean);
      if (imageUrls.length === 0) throw new Error("A resposta do serviço não continha URLs de imagem válidas.");

      setGeneratedImages(imageUrls);
      setSelectedImage(imageUrls[0]);
      setStep(3);
      if(publication) {
        setGeneratedContent(contentToUse);
        setSelectedContentId("0");
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: "Erro ao Gerar Imagens", description: error.message });
    } finally {
      setIsGeneratingImages(false);
    }
  };

  const handleLogoProcessing = async () => {
    if (!selectedImage) return;
    if (!logoFile) {
      setProcessedImageUrl(null);
      setStep(5);
      return;
    }
    
    setIsUploading(true);
    toast({ title: "Processando imagem...", description: "Aplicando edições e enviando para o webhook." });

    try {
      const img = new Image();
      img.src = selectedImage;
      await new Promise((resolve) => img.onload = resolve);

      const formData = new FormData();
      const imageBlob = await fetch(selectedImage).then(r => r.blob());
      formData.append('file', new File([imageBlob], "generated-image.jpg", { type: imageBlob.type }));
      formData.append('logo', logoFile);
      formData.append('logoScale', logoScale.toString());
      formData.append('logoOpacity', logoOpacity.toString());

      const logoPixelWidth = img.width * (visualLogoScale / 100);
      let posX = 0, posY = 0;
      const margin = 10;

      switch (logoPosition) {
        case 'top-left':    posX = margin; posY = margin; break;
        case 'top-center':  posX = (img.width / 2) - (logoPixelWidth / 2); posY = margin; break;
        case 'top-right':   posX = img.width - logoPixelWidth - margin; posY = margin; break;
        case 'left-center': posX = margin; posY = (img.height / 2) - (logoPixelWidth / 2); break;
        case 'center':      posX = (img.width / 2) - (logoPixelWidth / 2); posY = (img.height / 2) - (logoPixelWidth / 2); break;
        case 'right-center':posX = img.width - logoPixelWidth - margin; posY = (img.height / 2) - (logoPixelWidth / 2); break;
        case 'bottom-left': posX = margin; posY = img.height - logoPixelWidth - margin; break;
        case 'bottom-center':posX = (img.width / 2) - (logoPixelWidth / 2); posY = img.height - logoPixelWidth - margin; break;
        case 'bottom-right':posX = img.width - logoPixelWidth - margin; posY = img.height - logoPixelWidth - margin; break;
      }
      
      formData.append('positionX', Math.round(posX).toString());
      formData.append('positionY', Math.round(posY).toString());

      const response = await fetch("/api/proxy-webhook?target=post_manual", { method: 'POST', body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.details || "Falha no webhook");

      setProcessedImageUrl(result?.[0]?.url_post);
      setStep(5);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao Processar Imagem", description: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handlePublish = async (publishMode: 'now' | 'schedule') => {
    const finalImageUrl = processedImageUrl || selectedImage;
    const selectedContent = selectedContentId ? generatedContent[parseInt(selectedContentId, 10)] : null;
    
    if (!selectedContent || !finalImageUrl || !user) return;
    if (platforms.length === 0) {
      toast({ variant: "destructive", title: "Nenhuma plataforma", description: "Selecione ao menos uma plataforma para publicar."});
      return;
    }
    if (publishMode === 'schedule' && !scheduleDateTime) {
      toast({ variant: "destructive", title: "Data inválida", description: "Selecione data e hora."});
      return;
    }

    setIsPublishing(true);
    const fullCaption = `${selectedContent.título}\n\n${selectedContent.subtitulo}\n\n${selectedContent.hashtags.join(' ')}`;
    
    try {
      const result = await schedulePost(user.uid, {
        text: fullCaption,
        media: [{ file: new File([], ''), publicUrl: finalImageUrl }],
        isCarousel: false,
        platforms: platforms,
        scheduledAt: publishMode === 'schedule' ? new Date(scheduleDateTime) : new Date(),
        metaConnection: metaConnection || undefined,
        instagramConnection: instagramConnection || undefined,
      });
      
      if (result.success) {
        toast({ title: "Sucesso!", description: "Post processado com sucesso!" });
        router.push('/dashboard/conteudo');
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    } finally {
      setIsPublishing(false);
      setShowSchedulerModal(false);
    }
  };

  const handleDownloadImage = async (url: string) => {
    try {
      const blob = await fetch(url).then(r => r.blob());
      const a = document.createElement('a');
      a.href = window.URL.createObjectURL(blob);
      a.download = `flowup-${Date.now()}.jpg`;
      a.click();
    } catch (error) {
      toast({ variant: 'destructive', title: "Erro no Download" });
    }
  };

  const handleLogoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({ variant: "destructive", title: "Arquivo muito grande (Máx 2MB)" });
        return;
      }
      setLogoPreviewUrl(URL.createObjectURL(file));
      setLogoFile(file);
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Gerar Post</h1>
        <p className="text-gray-600 mt-1">
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
          contentHistory={contentHistory}
          unusedImagesHistory={unusedImagesHistory}
          selectedHistoryContent={selectedHistoryContent}
          selectedUnusedImage={selectedUnusedImage}
          onHistoryContentSelect={(idx) => setSelectedHistoryContent(contentHistory[parseInt(idx)])}
          onUnusedImageSelect={setSelectedUnusedImage}
          onGenerateImagesForHistory={handleGenerateImages}
          onUseUnusedImage={async () => {
            const res = await handleGenerateText("Gerar texto para imagem existente");
            if(res && selectedUnusedImage) {
              setSelectedImage(selectedUnusedImage);
              setGeneratedImages([selectedUnusedImage]);
              await removeUnusedImage(user!.uid, selectedUnusedImage);
              setStep(4);
            }
          }}
          onReuseBoth={async () => {
            if(selectedHistoryContent && selectedUnusedImage) {
              setGeneratedContent([selectedHistoryContent]);
              setSelectedContentId("0");
              setSelectedImage(selectedUnusedImage);
              setGeneratedImages([selectedUnusedImage]);
              await removeUnusedImage(user!.uid, selectedUnusedImage);
              setStep(4);
            }
          }}
          isGeneratingImages={isGeneratingImages}
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
          onNext={() => handleGenerateImages()}
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
          onLogoRemove={() => { setLogoFile(null); setLogoPreviewUrl(null); }}
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
          onPlatformChange={(p) => setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
          onPublish={(mode) => mode === 'now' ? handlePublish('now') : setShowSchedulerModal(true)}
          onBack={() => setStep(4)}
          isPublishing={isPublishing}
        />
      )}

      {showSchedulerModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowSchedulerModal(false)}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b flex justify-between items-center"><h3 className="text-xl font-bold flex items-center gap-2"><CalendarIcon className="w-5 h-5"/> Agendar Publicação</h3><Button variant="ghost" size="icon" onClick={() => setShowSchedulerModal(false)}><X className="w-5 h-5" /></Button></div>
            <div className="p-6 space-y-4"><Label htmlFor="schedule-datetime">Data e Hora</Label><Input id="schedule-datetime" type="datetime-local" value={scheduleDateTime} onChange={(e) => setScheduleDateTime(e.target.value)} /></div>
            <div className="p-6 border-t flex justify-end gap-3 bg-gray-50">
              <Button variant="outline" onClick={() => setShowSchedulerModal(false)} disabled={isPublishing}>Cancelar</Button>
              <Button onClick={() => handlePublish('schedule')} disabled={isPublishing || !scheduleDateTime} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">{isPublishing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2"/>}Confirmar</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
