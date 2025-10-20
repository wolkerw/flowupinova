
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, ArrowRight, Bot, Loader2, ArrowLeft, Image as ImageIcon, Instagram, UserCircle, Calendar, Send, Clock, X, Check, Paperclip, AlertTriangle, UploadCloud, CornerUpRight, CornerUpLeft, CornerDownLeft, CornerDownRight, ArrowUpToLine, ArrowDownToLine, Copy } from "lucide-react";
import { motion } from "framer-motion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Image from 'next/image';
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { schedulePost } from "@/lib/services/posts-service";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { getMetaConnection, type MetaConnectionData } from "@/lib/services/meta-service";


interface GeneratedContent {
  titulo: string;
  subtitulo: string;
  hashtags: string[];
}

type LogoPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
type LogoSize = 'small' | 'medium' | 'large';

const positionClasses: Record<LogoPosition, string> = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
};

const sizeClasses: Record<LogoSize, string> = {
    'small': 'w-12 h-12',
    'medium': 'w-16 h-16',
    'large': 'w-20 h-20',
};

const Preview = ({ imageUrl, logoUrl, logoPosition, logoSize }: { imageUrl: string | null, logoUrl: string | null, logoPosition: LogoPosition, logoSize: LogoSize }) => {
    
    const renderContent = () => {
        if (!imageUrl) {
             return (
                <div className="flex flex-col items-center justify-center text-center p-4 h-full">
                    <ImageIcon className="w-16 h-16 text-gray-400 mb-4" />
                    <p className="text-gray-500">Pré-visualização do Post</p>
                </div>
            );
        }
        return <Image src={imageUrl} alt="Preview da imagem" layout="fill" className="object-cover w-full h-full" />;
    };

    return (
        <div className="w-full max-w-sm aspect-square bg-gray-200 rounded-lg flex flex-col items-center justify-center relative overflow-hidden">
            {renderContent()}
            {imageUrl && logoUrl && (
                <Image src={logoUrl} alt="Logo preview" width={64} height={64} className={cn("absolute object-contain", positionClasses[logoPosition], sizeClasses[logoSize])} />
            )}
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

  // Logo States
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [logoPosition, setLogoPosition] = useState<LogoPosition>('bottom-right');
  const [logoSize, setLogoSize] = useState<LogoSize>('medium');
  const logoInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    if (!user) return;
    getMetaConnection(user.uid).then(setMetaConnection);
  }, [user]);

  const handleGenerateText = async () => {
    if (!postSummary.trim() || isLoading) return;
    setIsLoading(true);

    try {
      const response = await fetch('/api/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary: postSummary }),
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Falha ao gerar o conteúdo de texto.');
      }
      
      if (Array.isArray(data) && data.length > 0) {
        setGeneratedContent(data);
        setSelectedContentId("0");
        setStep(2);
      } else {
        throw new Error("O formato da resposta da IA é inesperado ou está vazio.");
      }

    } catch (error: any) {
      console.error("Erro ao gerar texto:", error);
      toast({ variant: 'destructive', title: "Erro ao gerar texto", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateImages = async () => {
    if (!selectedContentId) return;
  
    setIsGeneratingImages(true);
    setGeneratedImages([]); // Limpa imagens antigas
    setSelectedImage(null);
    const selectedPublication = generatedContent[parseInt(selectedContentId, 10)];
    
    try {
      const response = await fetch('/api/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicacoes: [selectedPublication] }),
      });
      
      const imagesData = await response.json();

      if (!response.ok) {
        throw new Error(imagesData.error || 'Falha ao gerar imagens.');
      }
      
      const imageUrls = imagesData.map((item: any) => item.url_da_imagem).filter(Boolean);

      if (imageUrls.length === 0) {
        throw new Error("Nenhuma URL de imagem foi retornada pelo webhook.");
      }

      setGeneratedImages(imageUrls);
      setSelectedImage(imageUrls[0]);

    } catch (error: any) {
      console.error("Erro ao gerar imagens:", error);
      toast({ variant: 'destructive', title: "Erro ao gerar imagens", description: error.message });
    } finally {
      setIsGeneratingImages(false);
    }
  };

  const handleNextToStep3 = () => {
    setStep(3);
    handleGenerateImages();
  };

  const handlePublish = async (publishMode: 'now' | 'schedule') => {
    if (!selectedContent || !selectedImage || !user || !metaConnection?.isConnected) {
        toast({ variant: "destructive", title: "Erro", description: "Verifique se selecionou conteúdo, imagem e se sua conta está conectada." });
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
        platforms: ['instagram'],
        scheduledAt: publishMode === 'schedule' ? new Date(scheduleDateTime) : new Date(),
        metaConnection: metaConnection,
        logo: logoFile,
        logoOptions: { position: logoPosition, size: logoSize },
    });
    
    setIsPublishing(false);
    setShowSchedulerModal(false);

    if (result.success) {
      toast({ title: "Sucesso!", description: `Post ${publishMode === 'now' ? 'enviado para publicação' : 'agendado'} com sucesso!` });
      router.push('/dashboard/conteudo');
    } else {
      toast({ variant: "destructive", title: "Erro ao Agendar", description: result.error || "Ocorreu um erro desconhecido." });
    }
};

 const handleLogoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        const previewUrl = URL.createObjectURL(file);
        setLogoFile(file);
        setLogoPreviewUrl(previewUrl);
    }
    if(event.target) event.target.value = ""; // Reset input
  };

  const clearLogo = () => {
    if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
    setLogoFile(null);
    setLogoPreviewUrl(null);
  };
  
  const selectedContent = selectedContentId ? generatedContent[parseInt(selectedContentId, 10)] : null;
  const unusedImages = generatedImages.filter(img => img !== selectedImage);

  const getAvatarFallback = () => {
    if (user?.displayName) return user.displayName.charAt(0).toUpperCase();
    if (metaConnection?.instagramUsername) return metaConnection.instagramUsername.charAt(0).toUpperCase();
    return "U";
  }

  // Cleanup blob URLs
  useEffect(() => {
    return () => {
        if (logoPreviewUrl) {
            URL.revokeObjectURL(logoPreviewUrl);
        }
    };
  }, [logoPreviewUrl]);

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
                onClick={handleGenerateText}
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
                disabled={!selectedContentId}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
              >
                Gerar Imagens e Avançar
                <ArrowRight className="w-4 h-4 ml-2" />
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
                <div className="absolute inset-0 flex items-center justify-center p-4 bg-black/30">
                    {selectedContent ? (
                        <h2 className="text-2xl font-bold leading-tight text-white text-center">{selectedContent.titulo}</h2>
                    ) : (
                        <div className="h-8 bg-white/30 rounded w-3/4 mx-auto animate-pulse"></div>
                    )}
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
                   {selectedContent ? (
                     <>
                       <p className="text-sm text-white mb-2">{selectedContent.subtitulo}</p>
                       <p className="text-xs text-blue-300 break-words">{Array.isArray(selectedContent.hashtags) ? selectedContent.hashtags.join(' ') : ''}</p>
                     </>
                   ) : (
                     <div className="space-y-2">
                        <div className="h-4 bg-gray-400/50 rounded w-full animate-pulse"></div>
                        <div className="h-3 bg-gray-400/50 rounded w-1/2 animate-pulse mt-2"></div>
                     </div>
                   )}
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
              <p className="text-sm text-gray-600 pt-1">Selecione uma das imagens geradas pela IA para usar em seu post.</p>
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
                  <p className="text-sm text-gray-500 mb-6">Parece que houve um problema. Tente novamente.</p>
                  <Button variant="outline" onClick={handleGenerateImages} disabled={isGeneratingImages}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Gerar Novas Imagens
                  </Button>
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
               <p className="text-sm text-gray-600 pt-1">Revise o texto, a imagem, adicione sua marca e agende a publicação.</p>
            </CardHeader>
            <CardContent>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    {/* Coluna da Esquerda: Preview */}
                    <Tabs defaultValue="instagram" className="w-full">
                        <TabsList className="grid w-full grid-cols-1">
                          <TabsTrigger value="instagram"><Instagram className="w-4 h-4 mr-2"/>Preview do Post</TabsTrigger>
                        </TabsList>
                        <div className="mt-6 flex items-center justify-center bg-gray-100 p-8 rounded-lg">
                            <TabsContent value="instagram">
                                <div className="w-[320px] bg-white rounded-md shadow-lg border flex flex-col">
                                    <div className="p-3 flex items-center gap-2 border-b">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={user?.photoURL || undefined} />
                                            <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-bold text-sm">{metaConnection?.instagramUsername || 'seu_usuario'}</span>
                                    </div>
                                    
                                    <Preview 
                                        imageUrl={selectedImage}
                                        logoUrl={logoPreviewUrl}
                                        logoPosition={logoPosition}
                                        logoSize={logoSize}
                                    />
                                    
                                    <div className="p-3 text-sm">
                                        <p>
                                            <span className="font-bold">{metaConnection?.instagramUsername || 'seu_usuario'}</span> {selectedContent.subtitulo}
                                        </p>
                                        <p className="text-blue-500 mt-2 break-words">{Array.isArray(selectedContent.hashtags) ? selectedContent.hashtags.join(' ') : ''}</p>
                                    </div>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>

                    {/* Coluna da Direita: Opções */}
                    <div className="space-y-6">
                        {/* Logo Options */}
                        <div className="space-y-4">
                           <input type="file" ref={logoInputRef} onChange={handleLogoFileChange} accept="image/png, image/jpeg" className="hidden" />
                            <div className="relative">
                                <Button variant="outline" className="w-full flex items-center gap-2" onClick={() => logoInputRef.current?.click()}>
                                    <UploadCloud className="w-4 h-4 text-purple-500"/>
                                    Adicionar Logomarca
                                </Button>
                                {logoPreviewUrl && (
                                    <Button variant="ghost" size="icon" className="absolute top-1/2 -right-3 -translate-y-1/2 h-6 w-6 rounded-full bg-red-100 text-red-600 hover:bg-red-200" onClick={clearLogo}><X className="w-4 h-4"/></Button>
                                )}
                            </div>
                             {logoPreviewUrl && (
                                <div className="space-y-4 pt-2">
                                    <div>
                                        <Label className="font-medium text-sm">Posição da Logo</Label>
                                        <RadioGroup value={logoPosition} onValueChange={(v) => setLogoPosition(v as LogoPosition)} className="flex flex-wrap gap-2 mt-2">
                                            <Label htmlFor="pos-tl" className="p-2 border rounded-md cursor-pointer has-[:checked]:bg-blue-100 has-[:checked]:border-blue-400">
                                                <RadioGroupItem value="top-left" id="pos-tl" className="sr-only"/>
                                                <CornerUpLeft />
                                            </Label>
                                            <Label htmlFor="pos-tc" className="p-2 border rounded-md cursor-pointer has-[:checked]:bg-blue-100 has-[:checked]:border-blue-400">
                                                <RadioGroupItem value="top-center" id="pos-tc" className="sr-only"/>
                                                <ArrowUpToLine />
                                            </Label>
                                            <Label htmlFor="pos-tr" className="p-2 border rounded-md cursor-pointer has-[:checked]:bg-blue-100 has-[:checked]:border-blue-400">
                                                <RadioGroupItem value="top-right" id="pos-tr" className="sr-only"/>
                                                <CornerUpRight />
                                            </Label>
                                            <Label htmlFor="pos-bl" className="p-2 border rounded-md cursor-pointer has-[:checked]:bg-blue-100 has-[:checked]:border-blue-400">
                                                <RadioGroupItem value="bottom-left" id="pos-bl" className="sr-only"/>
                                                <CornerDownLeft />
                                            </Label>
                                             <Label htmlFor="pos-bc" className="p-2 border rounded-md cursor-pointer has-[:checked]:bg-blue-100 has-[:checked]:border-blue-400">
                                                <RadioGroupItem value="bottom-center" id="pos-bc" className="sr-only"/>
                                                <ArrowDownToLine />
                                            </Label>
                                             <Label htmlFor="pos-br" className="p-2 border rounded-md cursor-pointer has-[:checked]:bg-blue-100 has-[:checked]:border-blue-400">
                                                <RadioGroupItem value="bottom-right" id="pos-br" className="sr-only"/>
                                                <CornerDownRight />
                                            </Label>
                                        </RadioGroup>
                                    </div>
                                     <div>
                                        <Label className="font-medium text-sm">Tamanho da Logo</Label>
                                        <RadioGroup value={logoSize} onValueChange={(v) => setLogoSize(v as LogoSize)} className="grid grid-cols-3 gap-2 mt-2">
                                            <Label htmlFor="size-s" className="p-2 border rounded-md cursor-pointer text-center has-[:checked]:bg-blue-100 has-[:checked]:border-blue-400">
                                                <RadioGroupItem value="small" id="size-s" className="sr-only"/>
                                                Pequeno
                                            </Label>
                                            <Label htmlFor="size-m" className="p-2 border rounded-md cursor-pointer text-center has-[:checked]:bg-blue-100 has-[:checked]:border-blue-400">
                                                <RadioGroupItem value="medium" id="size-m" className="sr-only"/>
                                                Médio
                                            </Label>
                                            <Label htmlFor="size-l" className="p-2 border rounded-md cursor-pointer text-center has-[:checked]:bg-blue-100 has-[:checked]:border-blue-400">
                                                <RadioGroupItem value="large" id="size-l" className="sr-only"/>
                                                Grande
                                            </Label>
                                        </RadioGroup>
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* Publishing options */}
                       <div className="space-y-4">
                            <h3 className="font-bold text-lg">Publicar</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Button
                                    onClick={() => handlePublish('now')}
                                    disabled={!metaConnection?.isConnected || isPublishing || !selectedImage || isGeneratingImages}
                                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                                    size="lg"
                                >
                                    {isPublishing ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Send className="w-5 h-5 mr-2" />}
                                    {isPublishing ? 'Publicando...' : 'Publicar Agora'}
                                </Button>
                                <Button
                                    onClick={() => setShowSchedulerModal(true)}
                                    disabled={!metaConnection?.isConnected || isPublishing || !selectedImage || isGeneratingImages}
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
                       {/* Galeria de imagens não usadas */}
                       {unusedImages.length > 0 && (
                            <div className="space-y-4 pt-4">
                                <h3 className="font-bold text-lg">Artes não utilizadas</h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {unusedImages.map((img, index) => (
                                        <Image
                                            key={index}
                                            src={img}
                                            alt={`Arte não utilizada ${index + 1}`}
                                            width={100}
                                            height={100}
                                            className="rounded-md object-cover aspect-square"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
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

    