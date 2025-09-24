
"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, ArrowRight, Bot, Loader2, ArrowLeft, Image as ImageIcon, Instagram, Facebook, Linkedin, UserCircle, Calendar, Send, Clock, X, Check } from "lucide-react";
import { motion } from "framer-motion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Image from 'next/image';
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";


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


export default function GerarConteudoPage() {
  const [step, setStep] = useState(1);
  const [postSummary, setPostSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([]);
  const [selectedContentId, setSelectedContentId] = useState<string | undefined>(undefined);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showSchedulerModal, setShowSchedulerModal] = useState(false);
  
  const [scheduleOptions, setScheduleOptions] = useState<ScheduleOptions>({
    instagram: { enabled: true, publishMode: 'now', dateTime: '' },
    facebook: { enabled: true, publishMode: 'now', dateTime: '' },
    linkedin: { enabled: true, publishMode: 'now', dateTime: '' }
  });

  const handleScheduleOptionChange = (platform: string, field: keyof ScheduleOptions[string], value: any) => {
    setScheduleOptions(prev => ({
      ...prev,
      [platform]: { ...prev[platform], [field]: value }
    }));
  };


  const handleGenerateText = async () => {
    setIsLoading(true);
    const webhookUrl = "https://n8n.flowupinova.com.br/webhook-test/gerador_de_ideias";
    
    // Mock data em caso de falha do webhook
    const mockData: GeneratedContent[] = [
      {
        titulo: "🚀 Impulsione seu Negócio com Vídeos!",
        subtitulo: "Descubra como o conteúdo audiovisual pode transformar sua marca e engajar seu público como nunca antes.",
        hashtags: ["#VideoMarketing", "#MarketingDigital", "#Engajamento"]
      },
      {
        titulo: "✨ A Mágica do Storytelling em Vídeos",
        subtitulo: "Conecte-se emocionalmente com seus clientes contando histórias que vendem. O vídeo é sua melhor ferramenta.",
        hashtags: ["#Storytelling", "#Branding", "#Conexao"]
      },
      {
        titulo: "📈 Resultados Reais: O ROI do Vídeo Marketing",
        subtitulo: "Vídeos não são apenas bonitos, eles trazem resultados. Aumente suas conversões e veja seu ROI decolar.",
        hashtags: ["#Resultados", "#ROI", "#MarketingDeConteudo"]
      }
    ];

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ summary: postSummary }),
      });

      if (!response.ok) {
        throw new Error("Falha ao buscar conteúdo da IA.");
      }
      
      const data = await response.json();
      
      const contentArray = Array.isArray(data) ? data : (data['output.publicacoes'] ? [data['output.publicacoes']] : []);

      if (contentArray.length === 0) {
        throw new Error("Formato de dados inesperado recebido do webhook.");
      }

      setGeneratedContent(contentArray);
      setSelectedContentId("0");
      setStep(2);

    } catch (error) {
      console.error(error);
      // Fallback para dados mockados em caso de erro
      setGeneratedContent(mockData);
      setSelectedContentId("0");
      setStep(2);
      alert("Ocorreu um erro ao gerar o conteúdo. Usando dados de exemplo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateImages = async () => {
    if (!selectedContentId) return;
  
    setIsLoading(true);
    const webhookUrl = "https://n8n.flowupinova.com.br/webhook-test/gerador_de_imagem";
    const selectedPublication = generatedContent[parseInt(selectedContentId, 10)];
    
    const mockImages = [
      "https://picsum.photos/seed/img1/400/600",
      "https://picsum.photos/seed/img2/400/600",
      "https://picsum.photos/seed/img3/400/600"
    ];

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ publicacoes: selectedPublication }),
      });

      if (!response.ok) {
        throw new Error("Falha ao gerar imagens da IA.");
      }
      
      const imageData = await response.json();

      // Ajuste para lidar com diferentes formatos de resposta
      const imageUrls = Array.isArray(imageData) 
        ? imageData.map((item: any) => item.url || item)
        : [imageData.url || imageData];

      if (!imageUrls || imageUrls.length === 0 || !imageUrls[0]) {
        throw new Error("Nenhuma URL de imagem encontrada na resposta.");
      }

      setGeneratedImages(imageUrls);
      setSelectedImage(imageUrls[0]);

    } catch (error) {
      console.error("Erro ao gerar imagens:", error);
      alert("Ocorreu um erro ao gerar as imagens. Usando imagens de exemplo.");
      setGeneratedImages(mockImages);
      setSelectedImage(mockImages[0]);
    } finally {
      setIsLoading(false);
      setStep(3);
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
            <CardFooter className="flex justify-end">
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
                    Gerar Conteúdo
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
                      <p className="text-xs text-blue-500 mt-2 break-words">{content.hashtags.join(' ')}</p>
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
                        src="https://picsum.photos/seed/1/320/480"
                        alt="Imagem genérica"
                        data-ai-hint="digital marketing"
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
                       <p className="text-xs text-blue-500 break-words">{selectedContent.hashtags.join(' ')}</p>
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
                        "relative aspect-[9/16] rounded-lg overflow-hidden cursor-pointer transition-all duration-300",
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
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="instagram"><Instagram className="w-4 h-4 mr-2"/>Instagram</TabsTrigger>
                  <TabsTrigger value="facebook"><Facebook className="w-4 h-4 mr-2"/>Facebook</TabsTrigger>
                  <TabsTrigger value="linkedin"><Linkedin className="w-4 h-4 mr-2"/>LinkedIn</TabsTrigger>
                </TabsList>
                <div className="mt-6 flex items-center justify-center bg-gray-100 p-8 rounded-lg">
                    <TabsContent value="instagram">
                        <div className="w-[320px] bg-white rounded-md shadow-lg border flex flex-col">
                            <div className="p-3 flex items-center gap-2 border-b">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src="https://picsum.photos/seed/avatar/40/40" />
                                    <AvatarFallback>Flow</AvatarFallback>
                                </Avatar>
                                <span className="font-bold text-sm">flowup</span>
                            </div>
                            <div className="relative w-full aspect-square">
                                <Image src={selectedImage} layout="fill" objectFit="cover" alt="Post preview" />
                            </div>
                            <div className="p-3 text-sm">
                                <p>
                                    <span className="font-bold">flowup</span> {selectedContent.subtitulo}
                                </p>
                                <p className="text-blue-500 mt-2">{selectedContent.hashtags.join(' ')}</p>
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="facebook">
                       <div className="w-[500px] bg-white rounded-lg shadow-lg border flex flex-col">
                            <div className="p-4 flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src="https://picsum.photos/seed/avatar/40/40" />
                                    <AvatarFallback>Flow</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-bold">FlowUp</p>
                                    <p className="text-xs text-gray-500">Agora mesmo</p>
                                </div>
                            </div>
                            <div className="px-4 pb-2 text-sm">
                                <p>{selectedContent.titulo}</p>
                                <p className="mt-2">{selectedContent.subtitulo}</p>
                            </div>
                            <div className="relative w-full aspect-video bg-gray-200">
                                <Image src={selectedImage} layout="fill" objectFit="cover" alt="Post preview" />
                            </div>
                            <div className="p-4 text-sm text-blue-500">{selectedContent.hashtags.join(' ')}</div>
                       </div>
                    </TabsContent>
                    <TabsContent value="linkedin">
                       <div className="w-[550px] bg-white rounded-lg shadow-lg border flex flex-col">
                            <div className="p-4 flex items-center gap-3 border-b">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src="https://picsum.photos/seed/avatar/50/50" />
                                    <AvatarFallback>Flow</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-bold">FlowUp Marketing Digital</p>
                                    <p className="text-xs text-gray-500">1.234 seguidores</p>
                                    <p className="text-xs text-gray-500">Promovido</p>
                                </div>
                            </div>
                            <div className="p-4 text-sm space-y-3">
                                <h3 className="font-bold text-lg">{selectedContent.titulo}</h3>
                                <p>{selectedContent.subtitulo}</p>
                            </div>
                            <div className="relative w-full aspect-[1.91/1] bg-gray-200">
                                <Image src={selectedImage} layout="fill" objectFit="cover" alt="Post preview" />
                            </div>
                             <div className="p-4 text-sm text-gray-600">{selectedContent.hashtags.join(' ')}</div>
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
                  Publicar / Agendar Post
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
              <h3 className="text-xl font-bold">Publicar ou Agendar Post</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowSchedulerModal(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              {[
                { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-600' },
                { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-700' },
                { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'text-sky-800' }
              ].map(platform => (
                <Card key={platform.id} className={cn("p-4", !scheduleOptions[platform.id].enabled && "bg-gray-50")}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <platform.icon className={cn("w-6 h-6", platform.color)} />
                      <Label htmlFor={`switch-${platform.id}`} className="text-lg font-semibold">{platform.name}</Label>
                    </div>
                    <Switch
                      id={`switch-${platform.id}`}
                      checked={scheduleOptions[platform.id].enabled}
                      onCheckedChange={(checked) => handleScheduleOptionChange(platform.id, 'enabled', checked)}
                    />
                  </div>
                  {scheduleOptions[platform.id].enabled && (
                    <div className="mt-4 pl-8">
                      <RadioGroup
                        value={scheduleOptions[platform.id].publishMode}
                        onValueChange={(value: "now" | "schedule") => handleScheduleOptionChange(platform.id, 'publishMode', value)}
                        className="flex gap-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="now" id={`${platform.id}-now`} />
                          <Label htmlFor={`${platform.id}-now`}>Publicar Agora</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="schedule" id={`${platform.id}-schedule`} />
                          <Label htmlFor={`${platform.id}-schedule`}>Agendar</Label>
                        </div>
                      </RadioGroup>
                      {scheduleOptions[platform.id].publishMode === 'schedule' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-4"
                        >
                          <Input
                            type="datetime-local"
                            value={scheduleOptions[platform.id].dateTime}
                            onChange={(e) => handleScheduleOptionChange(platform.id, 'dateTime', e.target.value)}
                          />
                        </motion.div>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
            <div className="p-6 border-t flex justify-end gap-3 bg-gray-50">
              <Button variant="outline" onClick={() => setShowSchedulerModal(false)}>
                Cancelar
              </Button>
              <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
                <Check className="w-4 h-4 mr-2" />
                Confirmar Agendamento
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}

    </div>
  );
}
