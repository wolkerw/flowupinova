

"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, ArrowRight, Bot, Loader2, ArrowLeft, Image as ImageIcon, Send, Calendar, Clock, X, Check, AlertTriangle, Instagram, Facebook, History, Archive, Combine } from "lucide-react";
import { motion } from "framer-motion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Image from 'next/image';
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { schedulePost } from "@/lib/services/posts-service";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { getMetaConnection, type MetaConnectionData } from "@/lib/services/meta-service";
import { getUnusedImages, saveUnusedImages, removeUnusedImage, getContentHistory, saveContentHistory } from "@/lib/services/user-data-service";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


interface GeneratedContent {
  titulo: string;
  subtitulo: string;
  hashtags: string[];
  url_da_imagem?: string;
}

type Platform = 'instagram' | 'facebook';


const Preview = ({ 
    imageUrl, 
    content, 
    user, 
    metaConnection 
}: { 
    imageUrl: string | null, 
    content: GeneratedContent | null, 
    user: any,
    metaConnection: MetaConnectionData | null,
}) => {
    
    const getAvatarFallback = () => {
        if (user?.displayName) return user.displayName.charAt(0).toUpperCase();
        if (metaConnection?.instagramUsername) return metaConnection.instagramUsername.charAt(0).toUpperCase();
        return "U";
    }

    return (
        <div className="w-full max-w-sm">
            <div className="w-full bg-white rounded-md shadow-lg border flex flex-col">
                <div className="p-3 flex items-center gap-2 border-b">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.photoURL || undefined} />
                        <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
                    </Avatar>
                    <span className="font-bold text-sm">{metaConnection?.instagramUsername || 'seu_usuario'}</span>
                </div>
                <div className="relative aspect-square bg-gray-200">
                    {imageUrl ? (
                        <Image src={imageUrl} alt="Preview da imagem" layout="fill" className="object-cover w-full h-full" />
                    ) : (
                         <div className="flex flex-col items-center justify-center text-center p-4 h-full">
                            <ImageIcon className="w-16 h-16 text-gray-400 mb-4" />
                            <p className="text-gray-500">Sua imagem aparecerá aqui</p>
                        </div>
                    )}
                </div>
                <div className="p-3 text-sm">
                    <p className="whitespace-pre-wrap">
                        <span className="font-bold">{metaConnection?.instagramUsername || 'seu_usuario'}</span>{' '}
                        {content && (
                            <>
                                <span className="font-bold">{content.titulo}</span>
                                {`\n\n${content.subtitulo}`}
                                {content.hashtags && `\n\n${content.hashtags.join(' ')}`}
                            </>
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
}


export default function GerarConteudoPage() {
  const [step, setStep] = useState(1);
  const [postSummary, setPostSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([]);
  const [selectedContentId, setSelectedContentId] = useState<string | undefined>(undefined);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showSchedulerModal, setShowSchedulerModal] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [scheduleDateTime, setScheduleDateTime] = useState('');
  const [metaConnection, setMetaConnection] = useState<MetaConnectionData | null>(null);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [platforms, setPlatforms] = useState<Platform[]>(['instagram']);
  
  // State for history and unused images
  const [contentHistory, setContentHistory] = useState<GeneratedContent[]>([]);
  const [unusedImagesHistory, setUnusedImagesHistory] = useState<string[]>([]);
  const [selectedHistoryContent, setSelectedHistoryContent] = useState<GeneratedContent | null>(null);
  const [selectedUnusedImage, setSelectedUnusedImage] = useState<string | null>(null);

  const fetchUnusedImages = async () => {
    if (!user) return;
    try {
      const unusedImages = await getUnusedImages(user.uid);
      setUnusedImagesHistory(unusedImages.reverse()); // Show newest first
    } catch (error: any) {
      console.error("Failed to fetch unused images:", error);
      toast({ variant: 'destructive', title: "Erro ao Carregar Artes", description: error.message });
    }
  };

  const fetchContentHistory = async () => {
    if (!user) return;
    try {
      const history = await getContentHistory(user.uid);
      setContentHistory(history);
    } catch (error: any) {
      console.error("Failed to fetch content history:", error);
      toast({ variant: 'destructive', title: "Erro ao Carregar Histórico", description: error.message });
    }
  };


  useEffect(() => {
    if (!user) return;
    
    async function loadInitialData() {
        try {
            // Fetch Meta connection status
            const metaConn = await getMetaConnection(user.uid);
            setMetaConnection(metaConn);

            // Fetch unused images
            await fetchUnusedImages();
            // Fetch content history
            await fetchContentHistory();

        } catch (error: any) {
            console.error("Failed to load initial data:", error);
            toast({ variant: 'destructive', title: "Erro ao Carregar Dados", description: error.message });
        }
    }

    loadInitialData();

  }, [user, toast]);

    useEffect(() => {
        // This is a cleanup function that runs when the component is unmounted
        // or before the component re-renders (if dependencies change).
        return () => {
            if (user && generatedImages.length > 0) {
                saveUnusedImages(user.uid, generatedImages)
                    .then(() => {
                        console.log("Unused images saved on cleanup.");
                    })
                    .catch(error => {
                        console.error("Failed to save unused images on cleanup:", error);
                    });
            }
        };
    }, [generatedImages, user]);


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
        
        if (!response.ok) {
            throw new Error(data.details || data.error || `Erro na API: ${response.status}`);
        }
        
        if (Array.isArray(data) && data.length > 0) {
            const content = data as GeneratedContent[];
            setGeneratedContent(content);
            setSelectedContentId("0");
            if(!summary) { // Only save to history if it's a new generation from summary
                await saveContentHistory(user.uid, content);
                await fetchContentHistory(); // Refresh history
            }

             const imageUrls = data.map(item => item.url_da_imagem).filter(Boolean) as string[];
             if (imageUrls.length > 0) {
                setGeneratedImages(imageUrls);
                setSelectedImage(imageUrls[0]);
            } else {
                setGeneratedImages([]);
                setSelectedImage(null);
            }
            setStep(2);
            return content; // Return content for chained operations
        } else {
            throw new Error("O formato da resposta da IA é inesperado ou está vazio.");
        }

    } catch (error: any) {
        console.error("Erro ao gerar texto:", error);
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
        await fetchUnusedImages(); // Refresh the gallery
    }
  
    setIsGeneratingImages(true);
    setGeneratedImages([]);
    setSelectedImage(null);
    
    try {
      const response = await fetch('/api/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicacoes: contentToUse }),
      });

      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || `Erro HTTP: ${response.status}`);
      }
      
      const imageUrls = result.imageUrls;

      if (!Array.isArray(imageUrls)) {
          throw new Error("Formato de resposta do webhook de imagem inesperado.");
      }

      if (imageUrls.length === 0) {
        throw new Error("A resposta do serviço não continha URLs de imagem válidas.");
      }

      setGeneratedImages(imageUrls);
      setSelectedImage(imageUrls[0]);
      
      if(publication) {
        setGeneratedContent(contentToUse);
        setSelectedContentId("0");
        setStep(3);
      }

    } catch (error: any) {
      console.error("Erro ao gerar imagens:", error);
      toast({ variant: 'destructive', title: "Erro ao gerar imagens", description: error.message });
    } finally {
      setIsGeneratingImages(false);
    }
  };

  const handleUseUnusedImage = async () => {
    if (!selectedUnusedImage) return;
    if (!postSummary.trim()) {
        toast({ variant: 'destructive', title: "Resumo necessário", description: "Por favor, escreva um resumo sobre o que é o post na Etapa 1." });
        return;
    }
    if (!user) return;

    const newContentArray = await handleGenerateText(postSummary);

    if (newContentArray && newContentArray.length > 0) {
        setGeneratedImages([selectedUnusedImage]);
        setSelectedImage(selectedUnusedImage);
        
        await removeUnusedImage(user.uid, selectedUnusedImage); 
        await fetchUnusedImages();
        
        setStep(4);
    }
  };

  const handleReuseContentAndArt = async () => {
    if (!selectedHistoryContent || !selectedUnusedImage || !user) return;
    
    // Set the selected content as the only option in generatedContent
    setGeneratedContent([selectedHistoryContent]);
    setSelectedContentId("0");

    // Set the selected image as the only option in generatedImages
    setGeneratedImages([selectedUnusedImage]);
    setSelectedImage(selectedUnusedImage);
    
    // Remove the image from the unused list as it's now being actively used
    await removeUnusedImage(user.uid, selectedUnusedImage);
    await fetchUnusedImages(); // Refresh the list in the UI

    // Go directly to the review step
    setStep(4);
  };

  const handleNextToStep3 = async () => {
    if(generatedImages.length === 0){
        await handleGenerateImages();
    }
    setStep(3);
  };

  const handlePlatformChange = (platform: Platform) => {
    setPlatforms(prev => 
        prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  }

  const handlePublish = async (publishMode: 'now' | 'schedule') => {
    if (!selectedContent || !selectedImage || !user || !metaConnection?.isConnected) {
        toast({ variant: "destructive", title: "Erro", description: "Verifique se selecionou conteúdo, imagem e se sua conta está conectada." });
        return;
    }
    if (platforms.length === 0) {
        toast({ variant: "destructive", title: "Nenhuma plataforma", description: "Selecione ao menos uma plataforma para publicar."});
        return;
    }
     if (publishMode === 'schedule' && !scheduleDateTime) {
        toast({ variant: "destructive", title: "Data inválida", description: "Por favor, selecione data e hora para o agendamento."});
        return;
    }

    setIsPublishing(true);
    
    const fullCaption = `${selectedContent.titulo}\n\n${selectedContent.subtitulo}\n\n${Array.isArray(selectedContent.hashtags) ? selectedContent.hashtags.join(' ') : ''}`;
    
    const result = await schedulePost(user.uid, {
        title: selectedContent.titulo,
        text: fullCaption,
        media: selectedImage,
        platforms: platforms,
        scheduledAt: publishMode === 'schedule' ? new Date(scheduleDateTime) : new Date(),
        metaConnection: metaConnection,
    });
    
    setIsPublishing(false);
    setShowSchedulerModal(false);

    if (result.success) {
      toast({ title: "Sucesso!", description: `Post ${publishMode === 'now' ? 'enviado para publicação' : 'agendado'} com sucesso!` });
      
      // The image is now officially used, so it's already been removed from the unused list
      // The rest of the generated images for this session are now "unused", so save them.
      const otherImages = generatedImages.filter(img => img !== selectedImage);
      if (otherImages.length > 0) {
          await saveUnusedImages(user.uid, otherImages);
      }
      
      // Clear generated images for this session as they've been handled
      setGeneratedImages([]);
      router.push('/dashboard/conteudo');
    } else {
      toast({ variant: "destructive", title: "Erro ao Agendar", description: result.error || "Ocorreu um erro desconhecido." });
       // If publishing failed, all generated images are still unused.
      await saveUnusedImages(user.uid, generatedImages);
      await fetchUnusedImages();
    }
};

  const handleHistoryContentSelection = (indexStr: string) => {
    const index = parseInt(indexStr, 10);
    const content = contentHistory.find((_, i) => i === index);
    setSelectedHistoryContent(content || null);
  };
  
  const handleUnusedImageSelection = (imageUrl: string) => {
    setSelectedUnusedImage(imageUrl);
  };

  const selectedContent = selectedContentId ? generatedContent[parseInt(selectedContentId, 10)] : null;
  
  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Gerar Conteúdo com IA</h1>
        <p className="text-gray-600 mt-1">
          {step === 1 && "Dê à nossa IA uma ideia e ela criará posts incríveis para você."}
          {step === 2 && "Selecione uma opção de texto para o seu post."}
          {step === 3 && "Selecione a melhor imagem para o seu post."}
          {step === 4 && "Revise e agende seu post para as redes sociais."}
        </p>
      </div>

      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          <Card className="shadow-lg border-none w-full max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Sparkles className="w-6 h-6 text-purple-500" />
                Etapa 1: Sobre o que é o post?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Escreva um resumo, uma ideia ou algumas palavras-chave sobre o conteúdo que você deseja criar. Quanto mais detalhes você fornecer, melhores serão as sugestões.
              </p>
              <Textarea
                placeholder="Ex: um post para o Instagram sobre os benefícios do nosso novo produto X, destacando a facilidade de uso e o design inovador."
                className="h-40 text-base"
                value={postSummary}
                onChange={(e) => setPostSummary(e.target.value)}
              />
            </CardContent>
            <CardFooter className="flex justify-end items-center">
              <Button
                onClick={() => handleGenerateText()}
                disabled={!postSummary.trim() || isLoading}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    Gerar Conteúdo com IA
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          <Card className="shadow-lg border-none w-full max-w-4xl mx-auto">
             <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                      <History className="w-6 h-6 text-gray-600" />
                      Histórico e Recursos
                  </CardTitle>
              </CardHeader>
              <CardContent>
                 <Tabs defaultValue="history">
                      <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="history">
                            <History className="w-4 h-4 mr-2" />
                            Conteúdos Anteriores
                          </TabsTrigger>
                          <TabsTrigger value="unused-images">
                              <Archive className="w-4 h-4 mr-2" />
                              Artes não Utilizadas
                          </TabsTrigger>
                      </TabsList>
                      <TabsContent value="history" className="mt-4">
                          <RadioGroup onValueChange={handleHistoryContentSelection}>
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-3">
                                {contentHistory.length > 0 ? contentHistory.map((content, index) => (
                                    <div key={index} className="flex items-center gap-4 p-3 border rounded-lg bg-gray-50/50">
                                        <RadioGroupItem 
                                            value={index.toString()}
                                            id={`history-item-${index}`}
                                        />
                                        <Label htmlFor={`history-item-${index}`} className="flex-1 cursor-pointer">
                                          <p className="font-semibold text-sm text-gray-800">{content.titulo}</p>
                                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{content.subtitulo}</p>
                                        </Label>
                                    </div>
                                )) : (
                                    <p className="text-sm text-center text-gray-500 py-8">Nenhum conteúdo no histórico.</p>
                                )}
                            </div>
                          </RadioGroup>
                          {selectedHistoryContent && !selectedUnusedImage && (
                            <div className="mt-4 flex justify-end">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleGenerateImages(selectedHistoryContent)}
                                  disabled={isGeneratingImages}
                                >
                                  {isGeneratingImages ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ImageIcon className="w-4 h-4 mr-2" />}
                                  Gerar Imagens para o item selecionado
                                </Button>
                            </div>
                          )}
                      </TabsContent>
                      <TabsContent value="unused-images" className="mt-4">
                            <RadioGroup onValueChange={handleUnusedImageSelection}>
                                <div className="grid grid-cols-3 md:grid-cols-5 gap-3 max-h-60 overflow-y-auto pr-3">
                                    {unusedImagesHistory.length > 0 ? unusedImagesHistory.map((img, index) => (
                                        <div key={index} className="relative">
                                            <RadioGroupItem value={img} id={`unused-img-${index}`} className="peer sr-only" />
                                            <Label htmlFor={`unused-img-${index}`} className="block aspect-square rounded-md overflow-hidden cursor-pointer ring-offset-background peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-primary">
                                                <Image src={img} alt={`Arte não utilizada ${index + 1}`} layout="fill" objectFit="cover" />
                                            </Label>
                                        </div>
                                    )) : (
                                        <p className="text-sm text-center text-gray-500 py-8 col-span-full">Nenhuma arte não utilizada.</p>
                                    )}
                                </div>
                            </RadioGroup>
                             {selectedUnusedImage && !selectedHistoryContent && (
                                <div className="mt-4 flex justify-end">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={handleUseUnusedImage}
                                      disabled={!postSummary.trim() || isLoading}
                                    >
                                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                                      Usar esta arte para publicar
                                    </Button>
                                </div>
                            )}
                             {!selectedUnusedImage && !selectedHistoryContent && unusedImagesHistory.length > 0 && (
                                <p className="text-xs text-center text-gray-500 pt-4">Selecione uma arte e escreva um resumo acima para publicá-la.</p>
                             )}
                      </TabsContent>
                  </Tabs>
                   {selectedHistoryContent && selectedUnusedImage && (
                        <div className="mt-6 flex justify-center border-t pt-4">
                            <Button
                                size="sm"
                                onClick={handleReuseContentAndArt}
                                className="bg-gradient-to-r from-green-500 to-teal-500 text-white"
                            >
                                <Combine className="w-4 h-4 mr-2"/>
                                Reutilizar Conteúdo e Arte
                            </Button>
                        </div>
                   )}
              </CardContent>
          </Card>
        </motion.div>
      )}

      {step === 2 && (
         <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {/* Coluna da Esquerda: Opções */}
          <Card className="shadow-lg border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Bot className="w-6 h-6 text-purple-500" />
                Etapa 2: Sugestões da IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Selecione uma das opções geradas para o seu post.
              </p>
              <RadioGroup value={selectedContentId} onValueChange={setSelectedContentId}>
                {generatedContent.map((content, index) => (
                  <div key={index} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value={index.toString()} id={`option-${index}`} className="mt-1" />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      <h4 className="font-bold text-base text-gray-900">{content.titulo}</h4>
                      <p className="text-sm text-gray-600 mt-1">{content.subtitulo}</p>
                      <p className="text-xs text-blue-500 mt-2 break-words">{Array.isArray(content.hashtags) ? content.hashtags.join(' ') : ''}</p>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
            <CardFooter className="flex justify-between">
               <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button
                onClick={handleNextToStep3}
                disabled={!selectedContentId || isGeneratingImages}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
              >
                {isGeneratingImages ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : 'Gerar Imagens e Avançar'}
                {!isGeneratingImages && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </CardFooter>
          </Card>
          
          {/* Coluna da Direita: Preview */}
           <div className="flex items-center justify-center">
             <div className="w-[320px] aspect-square bg-gray-200 rounded-3xl shadow-2xl border flex flex-col overflow-hidden relative">
                <Image 
                    src="/mascote-flowy.svg"
                    alt="Mascote robô da FlowUp"
                    layout="fill"
                    objectFit="contain"
                    className="opacity-40"
                />
                <div className="absolute inset-0 flex flex-col justify-between p-4 bg-black/30">
                    {/* Título no topo */}
                    <div className="text-center">
                        {selectedContent ? (
                            <h2 className="text-xl font-bold leading-tight text-white">{selectedContent.titulo}</h2>
                        ) : (
                            <div className="h-7 bg-white/30 rounded w-3/4 mx-auto animate-pulse"></div>
                        )}
                    </div>
                    
                    {/* Subtítulo no centro */}
                    <div className="text-center">
                        {selectedContent ? (
                            <p className="text-base text-white">{selectedContent.subtitulo}</p>
                        ) : (
                            <div className="h-4 bg-gray-400/50 rounded w-full animate-pulse"></div>
                        )}
                    </div>

                    {/* Hashtags na base */}
                    <div className="text-center">
                        {selectedContent ? (
                            <p className="text-xs text-blue-300 break-words">{Array.isArray(selectedContent.hashtags) ? selectedContent.hashtags.join(' ') : ''}</p>
                        ) : (
                             <div className="h-3 bg-gray-400/50 rounded w-1/2 mx-auto animate-pulse"></div>
                        )}
                    </div>
                </div>
            </div>
          </div>

        </motion.div>
      )}

      {step === 3 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="shadow-lg border-none w-full max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <ImageIcon className="w-6 h-6 text-purple-500" />
                Etapa 3: Escolha a melhor imagem
              </CardTitle>
              <div className="flex justify-between items-center">
                 <p className="text-sm text-gray-600 pt-1">Selecione uma das imagens geradas pela IA para usar em seu post.</p>
                 <Button variant="outline" onClick={() => handleGenerateImages()} disabled={isGeneratingImages || !selectedContentId}>
                    {isGeneratingImages ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    Gerar Novas Imagens
                  </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isGeneratingImages ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <Loader2 className="w-12 h-12 mr-2 animate-spin text-purple-500" />
                  <span className="text-lg text-gray-600 mt-4">Criando imagens incríveis...</span>
                </div>
              ) : generatedImages.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {generatedImages.map((imgSrc, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedImage(imgSrc)}
                      className={cn(
                        "relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all duration-300",
                        "ring-4 ring-offset-2",
                        selectedImage === imgSrc ? "ring-purple-500" : "ring-transparent"
                      )}
                    >
                      <Image
                        src={imgSrc}
                        alt={`Imagem gerada ${index + 1}`}
                        layout="fill"
                        objectFit="cover"
                        className="hover:scale-105 transition-transform duration-300"
                      />
                      {selectedImage === imgSrc && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Check className="w-12 h-12 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
                  <p className="text-lg font-semibold text-gray-700">Nenhuma imagem foi gerada.</p>
                  <p className="text-sm text-gray-500 mb-6">Parece que houve um problema. Tente gerar novamente.</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar e Mudar Texto
              </Button>
              <Button
                onClick={() => setStep(4)}
                disabled={!selectedImage || isGeneratingImages}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
              >
                Revisar e Publicar
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      )}
      
      {step === 4 && selectedContent && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="shadow-lg border-none w-full max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Sparkles className="w-6 h-6 text-purple-500" />
                Etapa 4: Revise e publique seu post
              </CardTitle>
               <p className="text-sm text-gray-600 pt-1">Revise o texto, a imagem e agende a publicação.</p>
            </CardHeader>
            <CardContent>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    {/* Coluna da Esquerda: Preview */}
                     <div className="space-y-6">
                        <h3 className="font-bold text-lg">Preview do Post</h3>
                        <div className="mt-6 flex items-center justify-center">
                           <Preview
                                imageUrl={selectedImage}
                                content={selectedContent}
                                user={user}
                                metaConnection={metaConnection}
                            />
                        </div>
                    </div>

                    {/* Coluna da Direita: Opções */}
                    <div className="space-y-6">
                        {/* Platform selection */}
                        <div>
                            <Label className="font-semibold">Onde Publicar?</Label>
                            <div className="grid grid-cols-2 gap-4 mt-2">
                                <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer peer-data-[state=checked]:border-primary" data-state={platforms.includes('instagram') ? 'checked' : 'unchecked'}>
                                    <Checkbox id="platform-instagram" checked={platforms.includes('instagram')} onCheckedChange={() => handlePlatformChange('instagram')} />
                                    <Label htmlFor="platform-instagram" className="flex items-center gap-2 cursor-pointer">
                                        <Instagram className="w-5 h-5 text-pink-500" />
                                        Instagram
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer peer-data-[state=checked]:border-primary" data-state={platforms.includes('facebook') ? 'checked' : 'unchecked'}>
                                    <Checkbox id="platform-facebook" checked={platforms.includes('facebook')} onCheckedChange={() => handlePlatformChange('facebook')} />
                                    <Label htmlFor="platform-facebook" className="flex items-center gap-2 cursor-pointer">
                                        <Facebook className="w-5 h-5 text-blue-600" />
                                        Facebook
                                    </Label>
                                </div>
                            </div>
                        </div>

                        {/* Publishing options */}
                       <div className="space-y-4">
                            <h3 className="font-bold text-lg">Publicar</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Button
                                    onClick={() => handlePublish('now')}
                                    disabled={!metaConnection?.isConnected || isPublishing || !selectedImage || isGeneratingImages || platforms.length === 0}
                                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                                    size="lg"
                                >
                                    {isPublishing ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Send className="w-5 h-5 mr-2" />}
                                    {isPublishing ? 'Publicando...' : 'Publicar Agora'}
                                </Button>
                                <Button
                                    onClick={() => setShowSchedulerModal(true)}
                                    disabled={!metaConnection?.isConnected || isPublishing || !selectedImage || isGeneratingImages || platforms.length === 0}
                                    variant="outline"
                                    size="lg"
                                >
                                    <Calendar className="w-5 h-5 mr-2" />
                                    Agendar
                                </Button>
                            </div>

                            {!metaConnection?.isConnected && (
                                <p className="text-xs text-red-600 mt-2 text-center flex items-center justify-center gap-1">
                                    <AlertTriangle className="w-4 h-4" /> 
                                    Conecte sua conta da Meta na página de Conteúdo para publicar.
                                </p>
                            )}
                       </div>
                    </div>
               </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar e Mudar Imagem
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      )}

      {showSchedulerModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowSchedulerModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full"
          >
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center gap-2"><Calendar className="w-5 h-5"/> Agendar Publicação</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowSchedulerModal(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
                <Label htmlFor="schedule-datetime">Selecione a data e hora</Label>
                <Input 
                    id="schedule-datetime" 
                    type="datetime-local" 
                    value={scheduleDateTime} 
                    onChange={(e) => setScheduleDateTime(e.target.value)} 
                />
            </div>
            <div className="p-6 border-t flex justify-end gap-3 bg-gray-50">
              <Button variant="outline" onClick={() => setShowSchedulerModal(false)} disabled={isPublishing}>
                Cancelar
              </Button>
              <Button
                onClick={() => handlePublish('schedule')}
                disabled={isPublishing || !scheduleDateTime}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                {isPublishing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2"/>}
                Confirmar Agendamento
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}

    </div>
  );
}
