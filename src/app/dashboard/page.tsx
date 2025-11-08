

"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Heart, 
  Users, 
  Plus,
  Send,
  Bot,
  Loader2,
  Rocket,
  CheckCircle,
  Circle,
  Instagram,
  Facebook,
  MessageCircle,
  Share2,
  Image as ImageIcon,
  UploadCloud,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { ChatBubble, type Message } from "@/components/chat/chat-bubble";
import { useAuth } from "@/components/auth/auth-provider";
import { getMetaConnection, type MetaConnectionData } from "@/lib/services/meta-service";
import { getBusinessProfile, updateBusinessProfile, type BusinessProfileData } from "@/lib/services/business-profile-service";
import { getChatHistory, saveChatHistory, type StoredMessage } from "@/lib/services/chat-service";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";
import { uploadMediaAndGetURL } from "@/lib/services/posts-service";

const initialMessages: Message[] = [
  {
    sender: 'ai',
    text: 'Olá! Sou o **Flowy**, seu assistente de marketing. Como posso ajudar você a decolar hoje? ✨'
  }
];

const StepItem = ({ title, description, href, isCompleted, isCurrent, children }: { title: string; description: string; href?: string; isCompleted: boolean; isCurrent: boolean; children?: React.ReactNode }) => {
  return (
    <div className="flex items-start gap-4 relative pb-8">
       <div className="absolute left-3 top-3 -bottom-5 w-px bg-gray-200"></div>
       <div className="flex-shrink-0">
          {isCompleted ? (
              <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center">
                <CheckCircle className="w-4 h-4" />
              </div>
            ) : isCurrent ? (
              <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center ring-4 ring-primary/20">
                 <Circle className="w-2.5 h-2.5 fill-current" />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                 <Circle className="w-2.5 h-2.5 text-gray-400 fill-current" />
              </div>
            )}
       </div>
      <div className="pt-0.5">
        <h4 className={cn("font-semibold", isCurrent ? "text-primary" : "text-gray-800")}>{title}</h4>
        <p className="text-sm text-gray-500 mb-3 mt-1">{description}</p>
        {!isCompleted && isCurrent && href && (
          <Button asChild size="sm" variant={isCurrent ? 'default' : 'outline'}>
            <Link href={href}>Começar Agora</Link>
          </Button>
        )}
        {children}
      </div>
    </div>
  );
};

interface PlatformMetrics {
    reach: number;
    likes: number;
    comments: number;
    shares: number;
}

const MetricDisplay = ({ icon, value, label }: { icon: React.ElementType, value: number, label: string }) => (
    <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-sm mb-3">
            {React.createElement(icon, { className: "w-6 h-6 text-primary" })}
        </div>
        <div className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</div>
        <div className="text-sm text-gray-600">{label}</div>
    </div>
);


export default function Dashboard() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [loading, setLoading] = useState(false);
  const [metaConnection, setMetaConnection] = useState<MetaConnectionData | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfileData | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [instagramMetrics, setInstagramMetrics] = useState<PlatformMetrics | null>(null);
  const [facebookMetrics, setFacebookMetrics] = useState<PlatformMetrics | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBusinessProfile = useCallback(async () => {
    if (!user) return;
    getBusinessProfile(user.uid).then(setBusinessProfile);
  }, [user]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!user) return;
    
    const fetchInitialData = async () => {
        const connection = await getMetaConnection(user.uid);
        setMetaConnection(connection);
        fetchBusinessProfile();

        if (connection.isConnected) {
            fetchPlatformMetrics(connection);
        } else {
            setMetricsLoading(false);
        }

        const history = await getChatHistory(user.uid);
        if (history.length > 0) {
            const historyMessages: Message[] = history.map(msg => ({
                sender: msg.sender,
                text: msg.text,
                isError: msg.isError,
            }));
            setMessages(historyMessages);
        }
    };

    fetchInitialData();
  }, [user, fetchBusinessProfile]);

  useEffect(() => {
    if (user && messages.length > initialMessages.length) {
      const storedMessages: StoredMessage[] = messages.map(msg => ({
        sender: msg.sender,
        text: msg.text,
        isError: msg.isError,
        createdAt: new Date(),
      }));
      saveChatHistory(user.uid, storedMessages);
    }
  }, [messages, user]);

  
  const fetchPlatformMetrics = async (connection: MetaConnectionData) => {
        setMetricsLoading(true);

        try {
            if (connection.instagramId && connection.accessToken) {
                const igResponse = await fetch('/api/instagram/media', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ accessToken: connection.accessToken, instagramId: connection.instagramId }),
                });
                const igResult = await igResponse.json();
                if (igResult.success) {
                    const totalReach = igResult.media.reduce((acc: number, item: any) => acc + (item.insights?.reach || 0), 0);
                    const totalLikes = igResult.media.reduce((acc: number, item: any) => acc + (item.like_count || 0), 0);
                    const totalComments = igResult.media.reduce((acc: number, item: any) => acc + (item.comments_count || 0), 0);
                    const totalShares = igResult.media.reduce((acc: number, item: any) => acc + (item.insights?.shares || 0), 0);
                    setInstagramMetrics({ reach: totalReach, likes: totalLikes, comments: totalComments, shares: totalShares });
                }
            }

            if (connection.pageId && connection.accessToken) {
                const fbResponse = await fetch('/api/meta/page-posts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ accessToken: connection.accessToken, pageId: connection.pageId }),
                });
                const fbResult = await fbResponse.json();
                if (fbResult.success) {
                    const totalReach = fbResult.posts.reduce((acc: number, item: any) => acc + (item.insights?.reach || 0), 0);
                    const totalLikes = fbResult.posts.reduce((acc: number, item: any) => acc + (item.insights?.likes || 0), 0);
                    const totalComments = fbResult.posts.reduce((acc: number, item: any) => acc + (item.insights?.comments || 0), 0);
                    const totalShares = fbResult.posts.reduce((acc: number, item: any) => acc + (item.insights?.shares || 0), 0);
                    setFacebookMetrics({ reach: totalReach, likes: totalLikes, comments: totalComments, shares: totalShares });
                }
            }
        } catch (error) {
            console.error("Failed to fetch platform metrics:", error);
        } finally {
            setMetricsLoading(false);
        }
    };

  const handleSendMessage = async () => {
    if (!prompt.trim() || loading) return;

    const userMessage: Message = { sender: 'user', text: prompt };
    setMessages(prev => [...prev, userMessage]);
    const currentPrompt = prompt;
    setPrompt("");
    setLoading(true);

    try {
      const webhookUrl = process.env.NEXT_PUBLIC_N8N_CHAT_URL || "https://webhook.flowupinova.com.br/webhook/chat";
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: currentPrompt }),
      });

      if (!response.ok) {
        throw new Error(`Falha na comunicação com o webhook. Status: ${response.status}`);
      }
      
      const responseData = await response.json();
      
      const aiText = responseData?.[0]?.output;

      if (!aiText) {
        throw new Error("Não recebi uma resposta válida do webhook. O formato esperado é: `[{\"output\":\"sua resposta\"}]`");
      }
      
      const aiMessage: Message = { sender: 'ai', text: aiText };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error: any) {
       const errorMessage: Message = { sender: 'ai', text: `Ocorreu um erro: ${error.message}`, isError: true };
       setMessages(prev => [...prev, errorMessage]);
    } finally {
        setLoading(false);
    }
  };

  const getImageDimensions = (file: File): Promise<{width: number, height: number}> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.onload = () => {
                resolve({ width: img.width, height: img.height });
            };
            img.onerror = reject;
            img.src = e.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !event.target.files || event.target.files.length === 0) return;
    const file = event.target.files[0];

    setIsUploadingLogo(true);
    toast({ title: "Enviando logomarca..." });

    try {
        const { width, height } = await getImageDimensions(file);
        const logoUrl = await uploadMediaAndGetURL(user.uid, file, (progress) => {
            console.log(`Upload is ${progress}% done`);
        });
        
        await updateBusinessProfile(user.uid, { logoUrl, logoWidth: width, logoHeight: height });
        await fetchBusinessProfile();

        toast({ title: "Sucesso!", description: "Sua logomarca foi salva.", variant: "success" });

    } catch (error: any) {
        toast({ title: "Erro no Upload", description: error.message, variant: "destructive" });
    } finally {
        setIsUploadingLogo(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }
};

  const handleRemoveLogo = async () => {
    if (!user) return;
    setIsUploadingLogo(true); // Re-use the same loading state
    toast({ title: "Removendo logomarca..." });

    try {
        await updateBusinessProfile(user.uid, { logoUrl: "", logoWidth: 0, logoHeight: 0 });
        await fetchBusinessProfile();
        toast({ title: "Sucesso!", description: "Sua logomarca foi removida.", variant: "success" });
    } catch (error: any) {
        toast({ title: "Erro ao Remover", description: error.message, variant: "destructive" });
    } finally {
        setIsUploadingLogo(false);
    }
};

  const allStepsCompleted = useMemo(() => {
    if (!metaConnection || !businessProfile) return false;
    return !!businessProfile.logoUrl && metaConnection.isConnected && businessProfile.isVerified;
  }, [metaConnection, businessProfile]);

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Início</h1>
          <p className="text-gray-600 mt-1">Visão geral do seu marketing digital</p>
        </div>
         <Button 
            asChild
            className="text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-shadow"
            size="lg"
            >
            <Link href="/dashboard/conteudo">
                <Plus className="w-5 h-5 mr-2" />
                Criar conteúdo
            </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
            {metaConnection?.isConnected && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card className="border-none shadow-lg" style={{ background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)' }}>
                  <CardHeader>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      <TrendingUp className="w-6 h-6 text-primary" />
                      Resumo da Semana
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="instagram" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="instagram"><Instagram className="w-4 h-4 mr-2"/>Instagram</TabsTrigger>
                            <TabsTrigger value="facebook"><Facebook className="w-4 h-4 mr-2"/>Facebook</TabsTrigger>
                            <TabsTrigger value="tiktok" disabled>TikTok</TabsTrigger>
                            <TabsTrigger value="youtube" disabled>YouTube</TabsTrigger>
                        </TabsList>
                        <AnimatePresence mode="wait">
                         <motion.div
                            key={metricsLoading ? 'loading' : 'content'}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="pt-6"
                         >
                            {metricsLoading ? (
                                <div className="flex justify-center items-center h-32">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary"/>
                                </div>
                            ) : (
                                <>
                                    <TabsContent value="instagram">
                                        {instagramMetrics ? (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                                <MetricDisplay icon={Users} value={instagramMetrics.reach} label="Alcance"/>
                                                <MetricDisplay icon={Heart} value={instagramMetrics.likes} label="Curtidas"/>
                                                <MetricDisplay icon={MessageCircle} value={instagramMetrics.comments} label="Comentários"/>
                                                <MetricDisplay icon={Share2} value={instagramMetrics.shares} label="Compart."/>
                                            </div>
                                        ) : <p className="text-center text-gray-500">Não foi possível carregar as métricas.</p>}
                                    </TabsContent>
                                     <TabsContent value="facebook">
                                        {facebookMetrics ? (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                                <MetricDisplay icon={Users} value={facebookMetrics.reach} label="Alcance"/>
                                                <MetricDisplay icon={Heart} value={facebookMetrics.likes} label="Reações"/>
                                                <MetricDisplay icon={MessageCircle} value={facebookMetrics.comments} label="Comentários"/>
                                                <MetricDisplay icon={Share2} value={facebookMetrics.shares} label="Compart."/>
                                            </div>
                                        ) : <p className="text-center text-gray-500">Não foi possível carregar as métricas.</p>}
                                    </TabsContent>
                                    <TabsContent value="tiktok">
                                         <p className="text-center text-gray-500 py-8">Integração com TikTok em breve.</p>
                                    </TabsContent>
                                     <TabsContent value="youtube">
                                         <p className="text-center text-gray-500 py-8">Integração com YouTube em breve.</p>
                                    </TabsContent>
                                </>
                            )}
                         </motion.div>
                        </AnimatePresence>
                    </Tabs>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="shadow-lg border-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Bot className="w-6 h-6 text-primary" />
                    Converse com sua IA
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div ref={chatContainerRef} className="h-64 w-full overflow-y-auto rounded-lg bg-gray-50 p-4 border mb-4">
                    <AnimatePresence>
                      {messages.map((message, index) => (
                        <ChatBubble key={index} message={message} />
                      ))}
                    </AnimatePresence>
                    
                    {loading && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 flex items-start justify-start gap-3"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-primary">
                          <Bot className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <div className="mr-12 rounded-2xl rounded-bl-none border bg-card px-4 py-3 text-card-foreground shadow-sm">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            <span className="text-sm italic text-muted-foreground">Pensando...</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                  <div className="relative flex w-full items-center">
                    <Input
                      className="flex-grow border-gray-300 py-3 pl-4 pr-12 text-base focus-visible:ring-primary"
                      placeholder="Pergunte sobre marketing, crie conteúdos..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleSendMessage();
                          e.preventDefault();
                        }
                      }}
                      disabled={loading}
                    />
                    <Button
                      size="icon"
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full"
                      style={{ background: 'linear-gradient(135deg, hsl(var(--accent)), hsl(var(--primary)))' }}
                      onClick={handleSendMessage}
                      disabled={loading || !prompt.trim()}
                      aria-label="Enviar mensagem"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
        </div>

        <div className="lg:col-span-1 space-y-8">
            {!allStepsCompleted && (metaConnection !== null && businessProfile !== null) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="shadow-lg border-none sticky top-24">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Rocket className="w-6 h-6 text-primary" />
                      Primeiros Passos Para Decolar
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col">
                      <StepItem 
                        title="1. Adicione sua Logomarca"
                        description="Faça o upload da sua logomarca para personalizar seus conteúdos."
                        isCompleted={!!businessProfile?.logoUrl}
                        isCurrent={!businessProfile?.logoUrl}
                      >
                         {!businessProfile?.logoUrl && (
                           <div className="mt-2">
                            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" />
                             <Button onClick={() => fileInputRef.current?.click()} size="sm" variant="outline" disabled={isUploadingLogo}>
                               {isUploadingLogo ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UploadCloud className="w-4 h-4 mr-2"/>}
                               Enviar Logomarca
                             </Button>
                           </div>
                         )}
                         {businessProfile?.logoUrl && (
                            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <Image src={businessProfile.logoUrl} alt="Preview da logomarca" width={40} height={40} className="object-contain rounded-md bg-white"/>
                                    <div>
                                        <h5 className="font-semibold text-green-800">Logomarca Salva!</h5>
                                        <p className="text-xs text-green-700">Esta imagem será usada pela IA.</p>
                                    </div>
                                </div>
                                <Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-100 h-8 w-8" onClick={handleRemoveLogo} disabled={isUploadingLogo}>
                                    {isUploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4"/>}
                                </Button>
                            </div>
                         )}
                      </StepItem>
                      <StepItem 
                        title="2. Conecte suas Redes Sociais"
                        description="Integre seu Instagram e Facebook para começar a publicar e agendar."
                        href="/dashboard/conteudo"
                        isCompleted={metaConnection?.isConnected || false}
                        isCurrent={!!businessProfile?.logoUrl && !metaConnection?.isConnected}
                      />
                      <StepItem 
                        title="3. Conecte seu Perfil de Empresa"
                        description="Sincronize com o Google Meu Negócio para gerenciar sua presença local."
                        href="/dashboard/meu-negocio"
                        isCompleted={businessProfile?.isVerified || false}
                        isCurrent={!!businessProfile?.logoUrl && !!metaConnection?.isConnected && !businessProfile?.isVerified}
                      />
                      <StepItem 
                        title="4. Crie sua Primeira Publicação"
                        description="Use nossa IA para gerar e agendar seu primeiro post incrível."
                        href="/dashboard/conteudo/gerar"
                        isCompleted={false}
                        isCurrent={allStepsCompleted}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
        </div>
      </div>
    </div>
  );
}
