
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, ArrowRight, Bot, Loader2, ArrowLeft, Image as ImageIcon, Instagram, Facebook, Linkedin, UserCircle, Calendar, Send, Clock, X, Check, Paperclip, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Image from 'next/image';
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { schedulePost } from "@/lib/services/posts-service";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";


interface GeneratedContent {
  titulo: string;
  subtitulo: string;
  hashtags: string[];
}

interface ScheduleOptions {
  [key: string]: {
    enabled: boolean;
    publishMode: "now" | "schedule";
    dateTime: string;
  };
}

type ReferenceFile = {
    file: File;
    previewUrl: string;
    type: 'image' | 'video';
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
  
  const [scheduleOptions, setScheduleOptions] = useState<ScheduleOptions>({
    instagram: { enabled: true, publishMode: 'now', dateTime: '' },
    facebook: { enabled: false, publishMode: 'now', dateTime: '' },
    linkedin: { enabled: false, publishMode: 'now', dateTime: '' }
  });

  useEffect(() => {
    // This effect can be used for any initial setup if needed in the future.
  }, []);

  const handleScheduleOptionChange = (platform: string, field: keyof ScheduleOptions[string], value: any) => {
    setScheduleOptions(prev => ({
      ...prev,
      [platform]: { ...prev[platform], [field]: value }
    }));
  };

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
        throw new Error(data.error || 'Falha ao gerar o conteúdo de texto.');
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
      alert(`Ocorreu um erro: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateImages = async () => {
    if (!selectedContentId) return;
  
    setIsLoading(true);
    const selectedPublication = generatedContent[parseInt(selectedContentId, 10)];
    
    try {
      const response = await fetch('/api/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicacoes: [selectedPublication] }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || 'Falha ao gerar imagens.');
      }
      
      const imagesData = await response.json();
      const imageUrls = imagesData.map((item: any) => item.url_da_imagem).filter(Boolean);

      if (imageUrls.length === 0) {
        throw new Error("Nenhuma URL de imagem foi retornada pelo webhook.");
      }

      setGeneratedImages(imageUrls);
      setSelectedImage(imageUrls[0]);
      setStep(3);

    } catch (error: any) {
      console.error("Erro ao gerar imagens:", error);
      alert(`Ocorreu um erro ao gerar as imagens: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSchedule = async () => {
    if (!selectedContent || !selectedImage || isPublishing || !user) return;

    setIsPublishing(true);
    
    const fullCaption = `${selectedContent.titulo}\n\n${selectedContent.subtitulo}\n\n${Array.isArray(selectedContent.hashtags) ? selectedContent.hashtags.join(' ') : ''}`;
    
    const enabledPlatforms = Object.keys(scheduleOptions).filter(p => scheduleOptions[p].enabled);

    try {
        if (enabledPlatforms.length === 0) {
            alert("Selecione ao menos uma plataforma para agendar.");
            setIsPublishing(false);
            return;
        }

        const mainScheduleOption = scheduleOptions[enabledPlatforms[0]];

        if (mainScheduleOption.publishMode === 'schedule' && !mainScheduleOption.dateTime) {
            alert("Por favor, selecione data e hora para o agendamento.");
            setIsPublishing(false);
            return;
        }

        await schedulePost(user.uid, {
            title: selectedContent.titulo,
            text: fullCaption,
            imageUrl: selectedImage,
            platforms: enabledPlatforms,
            scheduledAt: mainScheduleOption.publishMode === 'schedule' ? new Date(mainScheduleOption.dateTime) : new Date(),
        });

        alert(`Post agendado com sucesso para ${enabledPlatforms.join(', ')}!`);
        setShowSchedulerModal(false);
        router.push('/dashboard/conteudo');

    } catch (error: any) {
        console.error("Erro no processo de agendamento:", error);
        alert(`Erro ao agendar: ${error.message}`);
    } finally {
        setIsPublishing(false);
    }
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
          {step === 3 && "Escolha a imagem perfeita para o seu post."}
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
                onClick={handleGenerateImages}
                disabled={!selectedContentId || isLoading}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando Imagens...
                  </>
                ) : (
                  <>
                    Próxima Etapa
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
          
          {/* Coluna da Direita: Preview */}
           <div className="flex items-center justify-center">
            <div className="w-[320px] aspect-[9/16] bg-white rounded-3xl shadow-2xl border flex flex-col overflow-hidden">
                <div className="relative w-full h-[60%] bg-gray-200">
                    <Image 
                        src="https://picsum.photos/seed/mascot/600/600"
                        alt="Mascote robô da FlowUp"
                        data-ai-hint="robot mascot"
                        layout="fill"
                        objectFit="cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center p-4 bg-black/30">
                        {selectedContent ? (
                            <h2 className="text-2xl font-bold leading-tight text-white text-center shadow-lg">{selectedContent.titulo}</h2>
                        ) : (
                            <div className="h-8 bg-white/30 rounded w-3/4 mx-auto animate-pulse"></div>
                        )}
                    </div>
                </div>
                <div className="flex-1 p-4 text-left">
                   {selectedContent ? (
                     <>
                       <p className="text-sm mb-3">{selectedContent.subtitulo}</p>
                       <p className="text-xs text-blue-500 break-words">{Array.isArray(selectedContent.hashtags) ? selectedContent.hashtags.join(' ') : ''}</p>
                     </>
                   ) : (
                     <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse mt-4"></div>
                     </div>
                   )}
                </div>
            </div>
          </div>

        </motion.div>
      )}

      {step === 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="shadow-lg border-none w-full max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <ImageIcon className="w-6 h-6 text-purple-500" />
                Etapa 3: Escolha a imagem para o seu post
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                A IA gerou estas imagens com base no conteúdo que você escolheu. Selecione a sua preferida.
              </p>
              <div className="grid grid-cols-3 gap-4">
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
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button
                disabled={!selectedImage}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                onClick={() => setStep(4)}
              >
                Próxima Etapa
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      )}
      
      {step === 4 && selectedContent && selectedImage && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="shadow-lg border-none w-full max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Sparkles className="w-6 h-6 text-purple-500" />
                Etapa 4: Revise e agende seu post
              </CardTitle>
            </CardHeader>
            <CardContent>
               <Tabs defaultValue="instagram" className="w-full">
                <TabsList className="grid w-full grid-cols-1">
                  <TabsTrigger value="instagram"><Instagram className="w-4 h-4 mr-2"/>Preview</TabsTrigger>
                </TabsList>
                <div className="mt-6 flex items-center justify-center bg-gray-100 p-8 rounded-lg">
                    <TabsContent value="instagram">
                        <div className="w-[320px] bg-white rounded-md shadow-lg border flex flex-col">
                            <div className="p-3 flex items-center gap-2 border-b">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={"https://picsum.photos/seed/avatar/40/40"} />
                                    <AvatarFallback>Flow</AvatarFallback>
                                </Avatar>
                                <span className="font-bold text-sm">seu_usuario</span>
                            </div>
                            <div className="relative w-full aspect-square">
                                <Image src={selectedImage} layout="fill" objectFit="cover" alt="Post preview" />
                            </div>
                            <div className="p-3 text-sm">
                                <p>
                                    <span className="font-bold">seu_usuario</span> {selectedContent.subtitulo}
                                </p>
                                <p className="text-blue-500 mt-2">{Array.isArray(selectedContent.hashtags) ? selectedContent.hashtags.join(' ') : ''}</p>
                            </div>
                        </div>
                    </TabsContent>
                </div>
               </Tabs>
               <div className="mt-6 flex justify-center">
                <Button
                  onClick={() => setShowSchedulerModal(true)}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  size="lg"
                >
                  <Send className="w-5 h-5 mr-2" />
                  Agendar Post
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      )}

      {showSchedulerModal && selectedContent && (
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
            className="bg-white rounded-xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col"
          >
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">Agendar Post</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowSchedulerModal(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <Card className="p-4 bg-gray-100 opacity-70">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Instagram className="w-6 h-6 text-pink-600" />
                      <Label className="text-lg font-semibold">Instagram</Label>
                      <Badge variant="destructive" className="text-xs">Conexão desativada</Badge>
                    </div>
                    <Switch
                      checked={false}
                      disabled={true}
                    />
                  </div>
                </Card>
                <Card className="p-4 bg-gray-100 opacity-70">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Facebook className="w-6 h-6 text-blue-700" />
                      <Label className="text-lg font-semibold">Facebook</Label>
                       <Badge variant="destructive" className="text-xs">Conexão desativada</Badge>
                    </div>
                    <Switch
                      checked={false}
                      disabled={true}
                    />
                  </div>
                </Card>
            </div>
            <div className="p-6 border-t flex justify-end gap-3 bg-gray-50">
              <Button variant="outline" onClick={() => setShowSchedulerModal(false)} disabled={isPublishing}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSchedule}
                disabled={true}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Agendamento Indisponível
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}

    </div>
  );
}
