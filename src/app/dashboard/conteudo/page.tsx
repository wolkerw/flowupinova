"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue }
  from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Calendar as CalendarIcon,
  Plus,
  Edit,
  Image,
  Video,
  FileText,
  Instagram,
  Facebook,
  Linkedin,
  Sparkles,
  Clock,
  CheckCircle,
  Loader2,
  Check,
  Paperclip,
  Link,
  Settings
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Conteudo() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [showSchedulerModal, setShowSchedulerModal] = useState(false);
  const [postToSchedule, setPostToSchedule] = useState({ text: "", imageUrl: null });
  const [selectedAccounts, setSelectedAccounts] = useState(new Set());
  const [isCanvaConnected, setIsCanvaConnected] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  const [connectedAccounts] = useState([
    { id: 'ig1', platform: 'instagram', name: '@impulso_app', icon: Instagram },
    { id: 'fb1', platform: 'facebook', name: 'Página Impulso Marketing', icon: Facebook },
    { id: 'li1', platform: 'linkedin', name: 'Impulso Co.', icon: Linkedin },
  ]);

  const socialAccounts = [
    { name: 'Instagram', icon: Instagram, color: '#E4405F', connected: true },
    { name: 'Facebook', icon: Facebook, color: '#1877F2', connected: true },
    { name: 'LinkedIn', icon: Linkedin, color: '#0A66C2', connected: false },
  ];

  const [aiPrompt, setAiPrompt] = useState("");
  const [aiTone, setAiTone] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [generatedText, setGeneratedText] = useState("");
  const [generatedImages, setGeneratedImages] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loadingAI, setLoadingAI] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePrompt, setImagePrompt] = useState("");
  const [previewAspectRatio, setPreviewAspectRatio] = useState("1:1");
  const [selectedTextSegments, setSelectedTextSegments] = useState(new Set());

  const scheduledPosts = [
    {
      id: 1,
      title: "Dica sobre produtividade",
      platforms: ["instagram", "facebook"],
      date: new Date(),
      time: "14:00",
      status: "scheduled",
      type: "image"
    },
    {
      id: 2,
      title: "Novidade do produto",
      platforms: ["facebook"],
      date: new Date(),
      time: "18:30",
      status: "published",
      type: "video"
    },
    {
      id: 3,
      title: "Artigo sobre marketing",
      platforms: ["linkedin"],
      date: new Date(),
      time: "09:00",
      status: "scheduled",
      type: "text"
    }
  ];

  const platformIcons = {
    instagram: Instagram,
    facebook: Facebook,
    linkedin: Linkedin
  };

  const typeIcons = {
    image: Image,
    video: Video,
    text: FileText
  };
  
  const aspectRatios = [
    { key: "1:1", label: "Quadrado (1:1)", suitableFor: "Feed (Instagram, Facebook)", className: "aspect-square" },
    { key: "4:5", label: "Retrato (4:5)", suitableFor: "Feed (Instagram)", className: "aspect-[4/5]" },
    { key: "9:16", label: "Stories (9:16)", suitableFor: "Stories & Reels", className: "aspect-[9/16]" },
    { key: "16:9", label: "Paisagem (16:9)", suitableFor: "Links (Facebook, LinkedIn)", className: "aspect-video" }
  ];

  const handleConnectCanva = async () => {
    setAuthLoading(true);
    setTimeout(() => {
      setIsCanvaConnected(true);
      setAuthLoading(false);
    }, 1000);
  };

  const handleDisconnectCanva = async () => {
    setAuthLoading(true);
    setTimeout(() => {
      setIsCanvaConnected(false);
      setAuthLoading(false);
    }, 1000);
  };

  const handleOpenScheduler = (postContent = { text: "", imageUrl: null }) => {
    setPostToSchedule(postContent);
    setSelectedAccounts(new Set());
    setShowSchedulerModal(true);
  };

  const handleOpenAIGenerator = () => {
    setCurrentStep(1);
    setAiPrompt("");
    setAiTone("");
    setGeneratedText("");
    setGeneratedImages([]);
    setSelectedImageIndex(0);
    setLoadingAI(false);
    setSelectedFile(null);
    setImagePrompt("");
    setPreviewAspectRatio("1:1");
    setSelectedTextSegments(new Set());
    setShowAIGenerator(true);
  };

  const handleAccountSelection = (accountId) => {
    setSelectedAccounts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(accountId)) {
        newSet.delete(accountId);
      } else {
        newSet.add(accountId);
      }
      return newSet;
    });
  };

  const handleSchedulePost = async () => {
    if (selectedAccounts.size === 0) {
      alert("Selecione pelo menos uma conta para agendar a postagem.");
      return;
    }
    console.log("Agendando post para as contas:", Array.from(selectedAccounts));
    console.log("Conteúdo:", postToSchedule);
    alert("Simulação: Post agendado com sucesso!");
    setShowSchedulerModal(false);
  };

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const splitTextIntoSegments = (text) => {
    if (!text) return [];
    const paragraphs = text.split('\n').filter(p => p.trim());
    if (paragraphs.length <= 2) {
      return text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 10);
    }
    return paragraphs;
  };

  const handleGenerateText = async () => {
    if (!aiPrompt) return;
    setLoadingAI(true);
    setGeneratedText("");
    setSelectedTextSegments(new Set());

    setTimeout(() => {
      const demoText = `✨ Café: Mais que uma bebida, uma inspiração! ☕\n\nComece seu dia com a energia e o foco que só um bom café pode oferecer. Cada xícara é um convite para criar, inovar e conquistar seus objetivos. Permita-se essa pausa revigorante e transforme sua rotina.\n\n#Café #Inspiração #Produtividade #FlowUp`;
      setGeneratedText(demoText);
      const segments = splitTextIntoSegments(demoText);
      setSelectedTextSegments(new Set(segments.map((_, index) => index)));
      setLoadingAI(false);
    }, 1500);
  };

  const handleSegmentToggle = (segmentIndex) => {
    setSelectedTextSegments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(segmentIndex)) {
        newSet.delete(segmentIndex);
      } else {
        newSet.add(segmentIndex);
      }
      return newSet;
    });
  };

  const getComposedText = () => {
    if (!generatedText) return "";
    const segments = splitTextIntoSegments(generatedText);
    const selectedSegmentsArray = Array.from(selectedTextSegments).sort((a, b) => a - b);
    return selectedSegmentsArray.map(index => segments[index]?.trim()).filter(Boolean).join('\n\n');
  };

  const getSelectedTextForImagePrompt = () => {
    const composedText = getComposedText();
    if (!composedText) return "";
    return `Criar uma imagem para acompanhar este conteúdo: ${composedText.substring(0, 200)}...`;
  };

  const handleGenerateImage = async (source) => {
    if (source === 'ai' && !imagePrompt) return;
    if (source === 'upload' && !selectedFile) return;

    setLoadingAI(true);
    setGeneratedImages([]);
    setSelectedImageIndex(0);

    setTimeout(() => {
      if (source === 'upload' && selectedFile) {
        setGeneratedImages([URL.createObjectURL(selectedFile)]);
      } else {
        setGeneratedImages([
            "https://picsum.photos/seed/1/1024/1024",
            "https://picsum.photos/seed/2/1024/1024",
            "https://picsum.photos/seed/3/1024/1024"
        ]);
      }
      setLoadingAI(false);
    }, 2000);
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      const imagePromptFromSelection = getSelectedTextForImagePrompt();
      setImagePrompt(imagePromptFromSelection);
    }
    setCurrentStep(currentStep + 1);
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleFinishAndSchedule = () => {
    const composedText = getComposedText();
    if (composedText || generatedImages.length > 0) {
      handleOpenScheduler({
        text: composedText,
        imageUrl: generatedImages[selectedImageIndex] || null,
      });
      setShowAIGenerator(false);
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <style>{`
        :root {
          --flowup-gradient: linear-gradient(135deg, #7DD3FC 0%, #3B82F6 50%, #1E40AF 100%);
          --flowup-cyan: #7DD3FC;
          --flowup-blue: #3B82F6;
        }
      `}</style>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Conteúdo & Marketing</h1>
          <p className="text-gray-600 mt-1">Crie e gerencie conteúdo para suas redes sociais com IA</p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            onClick={handleOpenAIGenerator}
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Gerar com IA
          </Button>
          <Button 
            onClick={() => handleOpenScheduler()}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agendar Post
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="shadow-lg border-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-blue-500" />
                    Calendário Editorial
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    locale={ptBR}
                    className="rounded-md border-none"
                  />
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-600">Posts agendados</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-gray-600">Posts publicados</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="shadow-lg border-none bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link className="w-5 h-5 text-blue-600" />
                    Contas Conectadas
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Conecte suas redes sociais para publicar automaticamente
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {socialAccounts.map((account, index) => (
                    <motion.div
                      key={account.name}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="p-4 border rounded-xl transition-all duration-300 ease-in-out hover:shadow-md hover:border-blue-200"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{backgroundColor: account.color + '1A'}}>
                            <account.icon className="w-6 h-6" style={{ color: account.color }} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{account.name}</h4>
                            <p className={`text-xs font-medium ${account.connected ? 'text-green-600' : 'text-gray-500'}`}>
                              {account.connected ? 'Conectado' : 'Não conectado'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="w-full sm:w-auto flex-shrink-0">
                           <Button
                            size="sm"
                            className={`w-full sm:w-auto transition-all ${
                              account.connected 
                                ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50' 
                                : 'text-white border-transparent'
                            }`}
                            style={!account.connected ? { background: 'var(--flowup-gradient)' } : {}}
                          >
                            {account.connected ? (
                              <>
                                <Settings className="w-4 h-4 mr-2" />
                                Gerenciar
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4 mr-2" />
                                Conectar
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Card className="shadow-lg border-none bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <img src="https://static.canva.com/static/images/favicon.ico" alt="Canva Icon" className="w-5 h-5"/>
                    Integração Canva
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Crie designs profissionais a partir do conteúdo gerado.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className={`p-4 border rounded-xl transition-all duration-300 ease-in-out ${isCanvaConnected ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isCanvaConnected ? 'bg-green-100' : 'bg-gray-100'}`}>
                          {isCanvaConnected ? 
                            <CheckCircle className="w-6 h-6 text-green-600" /> :
                            <Link className="w-6 h-6 text-gray-500" />
                          }
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Canva</h4>
                          <p className={`text-xs font-medium ${isCanvaConnected ? 'text-green-600' : 'text-gray-500'}`}>
                            {isCanvaConnected ? 'Conectado' : 'Não conectado'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="w-full sm:w-auto flex-shrink-0">
                         {isCanvaConnected ? (
                           <Button
                              size="sm"
                              variant="outline"
                              onClick={handleDisconnectCanva}
                              disabled={authLoading}
                              className="w-full sm:w-auto text-red-600 hover:bg-red-50 hover:text-red-700"
                           >
                              {authLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Settings className="w-4 h-4 mr-2" />}
                              Desconectar
                           </Button>
                         ) : (
                           <Button
                              size="sm"
                              onClick={handleConnectCanva}
                              disabled={authLoading}
                              className="w-full sm:w-auto text-white border-transparent"
                              style={{ background: 'var(--flowup-gradient)' }}
                           >
                              {authLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Plus className="w-4 h-4 mr-2" />}
                              Conectar
                           </Button>
                         )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="shadow-lg border-none">
            <CardHeader>
              <CardTitle>Posts do Dia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scheduledPosts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3">
                        {React.createElement(typeIcons[post.type], { 
                          className: "w-5 h-5 text-gray-500" 
                        })}
                        <div className="flex">
                          {post.platforms.map((platform, pIdx) => {
                            const PlatformIcon = platformIcons[platform];
                            return (
                              <PlatformIcon 
                                key={platform}
                                className={`w-5 h-5 text-blue-500 bg-white rounded-full p-0.5 border ${pIdx > 0 ? '-ml-2' : ''}`} 
                              />
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{post.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span>{post.time}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={post.status === 'published' ? 'default' : 'outline'}
                        className={post.status === 'published' ? 'bg-green-100 text-green-700' : ''}
                      >
                        {post.status === 'published' ? (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        ) : (
                          <Clock className="w-3 h-3 mr-1" />
                        )}
                        {post.status === 'published' ? 'Publicado' : 'Agendado'}
                      </Badge>
                      <Button variant="ghost" size="icon">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {showAIGenerator && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-500" />
                Gerador de Conteúdo IA - Passo {currentStep} de 3
              </h3>
              
              <div className="flex items-center gap-2 mt-4">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep >= step 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {step}
                    </div>
                    {step < 3 && (
                      <div className={`flex-grow h-1 mx-2 ${
                        currentStep > step ? 'bg-blue-500' : 'bg-gray-200'
                      }`}></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6">
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold mb-4">1. Criar Conteúdo em Texto</h4>
                    <p className="text-gray-600 mb-4">Descreva o que você quer que a IA escreva para sua postagem.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descrição do Conteúdo
                    </label>
                    <Textarea 
                      placeholder="Ex: Um texto sobre os benefícios do café com um tom inspiracional"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      className="h-24"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tom da mensagem
                    </label>
                    <Select value={aiTone} onValueChange={setAiTone}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tom" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="profissional">Profissional</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="inspiracional">Inspiracional</SelectItem>
                        <SelectItem value="educativo">Educativo</SelectItem>
                        <SelectItem value="divertido">Divertido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 min-h-[200px]">
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="font-medium text-gray-900">Prévia do Texto</h5>
                      {generatedText && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedTextSegments(new Set(splitTextIntoSegments(generatedText).map((_, i) => i)))}
                          >
                            Selecionar Tudo
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedTextSegments(new Set())}
                          >
                            Limpar Seleção
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {loadingAI ? (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <Loader2 className="w-6 h-6 animate-spin mr-2" />
                        <p>Gerando texto...</p>
                      </div>
                    ) : generatedText ? (
                      <div className="space-y-3">
                        <div className="bg-white p-4 rounded border">
                          <p className="whitespace-pre-wrap">{generatedText}</p>
                        </div>
                        
                        <div className="border-t pt-4">
                          <h6 className="font-medium text-gray-800 mb-3">Selecione os trechos para usar na imagem:</h6>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {splitTextIntoSegments(generatedText).map((segment, index) => (
                              <div key={index} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded">
                                <Checkbox
                                  id={`segment-${index}`}
                                  checked={selectedTextSegments.has(index)}
                                  onCheckedChange={() => handleSegmentToggle(index)}
                                  className="mt-1"
                                />
                                <label htmlFor={`segment-${index}`} className="text-sm text-gray-700 flex-1 cursor-pointer">
                                  {segment.trim()}
                                </label>
                              </div>
                            ))}
                          </div>
                          
                          {selectedTextSegments.size > 0 && (
                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                              <p className="text-xs text-blue-700 font-medium mb-1">
                                Prévia do prompt para imagem ({selectedTextSegments.size} trecho{selectedTextSegments.size !== 1 ? 's' : ''} selecionado{selectedTextSegments.size !== 1 ? 's' : ''}):
                              </p>
                              <p className="text-sm text-blue-800 italic">
                                {getSelectedTextForImagePrompt()}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">Clique em "Gerar Texto" para criar seu conteúdo...</p>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-6">
                        <div>
                            <h4 className="text-lg font-semibold">2. Design Visual</h4>
                            <p className="text-gray-600 text-sm mt-1">Crie a imagem para seu post.</p>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <h5 className="font-medium text-blue-900 mb-2 text-sm">Texto selecionado para o post:</h5>
                            <p className="text-blue-800 text-xs whitespace-pre-wrap max-h-24 overflow-y-auto">{getComposedText()}</p>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Prompt para Imagem
                            </label>
                            <Textarea 
                                placeholder="Use o texto acima como inspiração ou descreva a imagem que você deseja criar..."
                                value={imagePrompt}
                                onChange={(e) => setImagePrompt(e.target.value)}
                                className="h-20"
                            />
                             <Button 
                                onClick={() => handleGenerateImage('ai')}
                                disabled={loadingAI || !imagePrompt}
                                className="w-full mt-2 bg-purple-600 hover:bg-purple-700"
                              >
                                {loadingAI ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                                Gerar Imagem com IA
                              </Button>
                        </div>

                        <div className="flex items-center gap-2">
                           <hr className="flex-grow border-gray-200"/>
                           <span className="text-xs text-gray-400">OU</span>
                           <hr className="flex-grow border-gray-200"/>
                        </div>

                         <div>
                            <label htmlFor="file-upload-step2" className="block text-sm font-medium text-gray-700 mb-2">
                                Upload Próprio
                            </label>
                            <Button asChild variant="outline" className="w-full">
                              <label htmlFor="file-upload-step2" className="cursor-pointer flex items-center gap-2">
                                <Paperclip className="w-4 h-4" />
                                {selectedFile ? <span className="truncate">{selectedFile.name}</span> : "Selecionar Arquivo"}
                                <Input 
                                  id="file-upload-step2" 
                                  type="file" 
                                  className="sr-only" 
                                  onChange={handleFileChange}
                                  accept="image/*"
                                  disabled={loadingAI}
                                />
                              </label>
                            </Button>
                            {selectedFile && 
                                <Button 
                                    onClick={() => handleGenerateImage('upload')}
                                    disabled={loadingAI}
                                    className="w-full mt-2"
                                >
                                {loadingAI ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                Processar Upload
                                </Button>
                            }
                        </div>
                        
                        {generatedImages.length > 0 && (
                             <div className="space-y-2">
                                <h5 className="text-sm font-medium text-gray-700">Imagem para Edição:</h5>
                                <img 
                                    src={generatedImages[selectedImageIndex]} 
                                    alt="Imagem selecionada" 
                                    className="w-full rounded-lg object-cover border" 
                                />
                                <p className="text-xs text-gray-500 italic">Esta imagem pode ser usada dentro do editor ao lado.</p>
                             </div>
                        )}
                    </div>

                    <div className="lg:col-span-2 bg-gray-100 rounded-lg min-h-[600px] flex flex-col">
                        <div className="p-3 border-b bg-white rounded-t-lg">
                           <h5 className="font-semibold text-gray-800">Editor de Design</h5>
                           <p className="text-xs text-gray-500">Use o editor abaixo para finalizar seu post.</p>
                        </div>
                        <iframe
                            src="https://app.templated.io/editor?embed=e28464ed-1df8-4c9f-b932-fa026770bcb3"
                            width="100%"
                            height="100%"
                            className="border-0 flex-grow"
                            title="Editor Templated.io"
                        ></iframe>
                    </div>
                  </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold mb-4">Prévia Final e Agendamento</h4>
                    <p className="text-gray-600 mb-4">Confira como ficará sua postagem e escolha onde publicar.</p>
                  </div>

                  <div className="bg-white border rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-4">Prévia da Postagem</h5>
                    <div className="space-y-4">
                      {generatedImages.length > 0 && (
                        <div className={`mx-auto w-full max-w-sm rounded-lg overflow-hidden bg-gray-200 border ${aspectRatios.find(r => r.key === previewAspectRatio)?.className}`}>
                           <img 
                              src={generatedImages[selectedImageIndex]} 
                              alt="Imagem da postagem" 
                              className="w-full h-full object-cover" 
                           />
                        </div>
                      )}
                      {getComposedText() && (
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="whitespace-pre-wrap">{getComposedText()}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-gray-900 mb-3">Publicar em:</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {connectedAccounts.map(account => {
                        const Icon = account.icon;
                        const isSelected = selectedAccounts.has(account.id);
                        return (
                          <div
                            key={account.id}
                            onClick={() => handleAccountSelection(account.id)}
                            className={`p-3 border rounded-lg flex items-center gap-3 cursor-pointer transition-all ${
                              isSelected ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-full border-2 ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'} flex items-center justify-center`}>
                              {isSelected && <Check className="w-3 h-3 text-white"/>}
                            </div>
                            <Icon className="w-5 h-5 text-blue-600" />
                            <span className="font-medium text-sm">{account.name}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t flex justify-between sticky bottom-0 bg-white z-10">
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowAIGenerator(false)}>
                  Cancelar
                </Button>
                {currentStep > 1 && (
                  <Button variant="outline" onClick={handlePrevStep}>
                    Voltar
                  </Button>
                )}
              </div>

              <div className="flex gap-3">
                {currentStep === 1 && (
                  <>
                    <Button 
                      onClick={handleGenerateText}
                      disabled={loadingAI || !aiPrompt}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {loadingAI ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                      Gerar Texto
                    </Button>
                    <Button 
                      onClick={handleNextStep}
                      disabled={!generatedText || selectedTextSegments.size === 0}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Próximo
                    </Button>
                  </>
                )}

                {currentStep === 2 && (
                  <>
                    <Button 
                      onClick={handleNextStep}
                      disabled={generatedImages.length === 0 && getComposedText().length === 0}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Próximo
                    </Button>
                  </>
                )}

                {currentStep === 3 && (
                  <Button 
                    onClick={handleFinishAndSchedule}
                    disabled={selectedAccounts.size === 0}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Agendar Conteúdo
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {showSchedulerModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto"
          >
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Plus className="w-6 h-6 text-blue-500" />
                Agendar Nova Postagem
              </h3>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Publicar em:
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {connectedAccounts.map(account => {
                    const Icon = account.icon;
                    const isSelected = selectedAccounts.has(account.id);
                    return (
                      <div
                        key={account.id}
                        onClick={() => handleAccountSelection(account.id)}
                        className={`p-3 border rounded-lg flex items-center gap-3 cursor-pointer transition-all ${
                          isSelected ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'} flex items-center justify-center`}>
                          {isSelected && <Check className="w-3 h-3 text-white"/>}
                        </div>
                        <Icon className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-sm">{account.name}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conteúdo
                </label>
                <Textarea 
                  placeholder="Digite o conteúdo do seu post..."
                  className="h-32"
                  value={postToSchedule.text}
                  onChange={(e) => setPostToSchedule(prev => ({ ...prev, text: e.target.value }))}
                />
              </div>
              
              {postToSchedule.imageUrl && (
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Média
                    </label>
                    <div className="relative">
                        <img src={postToSchedule.imageUrl} alt="Prévia da imagem" className="rounded-lg w-full h-auto max-h-60 object-cover border"/>
                    </div>
                </div>
              )}
              
              <Button variant="outline" className="w-full flex items-center gap-2 text-gray-600">
                <Paperclip className="w-4 h-4"/>
                Anexar Mídia
              </Button>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data
                  </label>
                  <Input type="date" defaultValue={format(new Date(), "yyyy-MM-dd")}/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horário
                  </label>
                  <Input type="time" defaultValue="10:00"/>
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowSchedulerModal(false)}>
                Cancelar
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSchedulePost}>
                <CalendarIcon className="w-4 h-4 mr-2" />
                Agendar Post
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
