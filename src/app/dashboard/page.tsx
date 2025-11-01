
"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Heart, 
  Users, 
  ShoppingCart,
  Plus,
  Send,
  Bot,
  Loader2,
  Rocket,
  CheckCircle,
  Circle,
  Building2,
  Instagram,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { ChatBubble, type Message } from "@/components/chat/chat-bubble";
import { useAuth } from "@/components/auth/auth-provider";
import { getMetaConnection, type MetaConnectionData } from "@/lib/services/meta-service";
import { getBusinessProfile, type BusinessProfileData } from "@/lib/services/business-profile-service";
import { cn } from "@/lib/utils";

const initialMessages: Message[] = [
  {
    sender: 'ai',
    text: 'Olá! Sou o **Flowy**, seu assistente de marketing. Como posso ajudar você a decolar hoje? ✨'
  }
];

const StepItem = ({ title, description, href, isCompleted, isCurrent }: { title: string; description: string; href: string; isCompleted: boolean; isCurrent: boolean }) => {
  return (
    <div className={cn("flex items-start gap-4 transition-opacity", isCompleted && "opacity-50")}>
      <div className="flex flex-col items-center">
        {isCompleted ? (
          <CheckCircle className="w-6 h-6 text-green-500" />
        ) : (
          <Circle className={cn("w-6 h-6", isCurrent ? "text-primary" : "text-gray-300")} />
        )}
        <div className={cn("w-px h-full mt-2", isCompleted ? "bg-green-500" : "bg-gray-300")}></div>
      </div>
      <div>
        <h4 className={cn("font-semibold", isCurrent && "text-primary")}>{title}</h4>
        <p className="text-sm text-gray-500 mb-3">{description}</p>
        {!isCompleted && isCurrent && (
          <Button asChild size="sm">
            <Link href={href}>Começar Agora</Link>
          </Button>
        )}
      </div>
    </div>
  );
};


export default function Dashboard() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [loading, setLoading] = useState(false);
  const [metaConnection, setMetaConnection] = useState<MetaConnectionData | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfileData | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!user) return;
    getMetaConnection(user.uid).then(setMetaConnection);
    getBusinessProfile(user.uid).then(setBusinessProfile);
  }, [user]);

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

  const metrics = [
    { title: "Alcance", value: "124.5K", change: "+12%", icon: Users, color: "text-blue-600" },
    { title: "Engajamento", value: "8.7%", change: "+3.2%", icon: Heart, color: "text-pink-600" },
    { title: "Leads/Vendas", value: "89", change: "+24%", icon: ShoppingCart, color: "text-green-600" }
  ];

  const allStepsCompleted = useMemo(() => {
    if (!metaConnection || !businessProfile) return false;
    return metaConnection.isConnected && businessProfile.isVerified;
  }, [metaConnection, businessProfile]);


  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Cabeçalho */}
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

       {/* Resumo da semana */}
       {metaConnection?.isConnected && (
         <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="border-none shadow-lg" style={{ background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)' }}>
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <TrendingUp className="w-6 h-6" style={{ color: 'var(--flowup-blue)' }} />
                  Resumo da Semana
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {metrics.map((metric, index) => (
                    <motion.div
                      key={metric.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="text-center"
                    >
                      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-sm mb-3`}>
                        <metric.icon className={`w-6 h-6 ${metric.color}`} />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
                      <div className="text-sm text-gray-600">{metric.title}</div>
                      <div className="text-green-600 text-sm font-medium mt-1">{metric.change}</div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
       )}

       {/* First Steps Section */}
       {!allStepsCompleted && (metaConnection !== null && businessProfile !== null) && (
         <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
         >
          <Card className="shadow-lg border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Rocket className="w-6 h-6 text-primary" />
                Primeiros Passos Para Decolar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <StepItem 
                  title="1. Conecte suas Redes Sociais"
                  description="Integre seu Instagram e Facebook para começar a publicar e agendar."
                  href="/dashboard/conteudo"
                  isCompleted={metaConnection?.isConnected || false}
                  isCurrent={!metaConnection?.isConnected}
                />
                 <StepItem 
                  title="2. Conecte seu Perfil de Empresa"
                  description="Sincronize com o Google Meu Negócio para gerenciar sua presença local."
                  href="/dashboard/meu-negocio"
                  isCompleted={businessProfile?.isVerified || false}
                  isCurrent={metaConnection?.isConnected && !businessProfile?.isVerified}
                />
                 <StepItem 
                  title="3. Crie sua Primeira Publicação"
                  description="Use nossa IA para gerar e agendar seu primeiro post incrível."
                  href="/dashboard/conteudo/gerar"
                  isCompleted={false}
                  isCurrent={metaConnection?.isConnected && (businessProfile?.isVerified || false)}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
       )}

       {/* Chat Section */}
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
                    e.preventDefault(); // Prevents adding a new line in some browsers
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
  );
}
