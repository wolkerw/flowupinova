
"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  Heart, 
  Users, 
  ShoppingCart,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  FileText,
  Megaphone,
  Mail,
  BarChart3,
  Calendar,
  Target,
  Sparkles,
  Send,
  Bot,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { ChatBubble, type Message } from "@/components/chat/chat-bubble";

const initialMessages: Message[] = [
  {
    sender: 'ai',
    text: 'Olá! Sou o **Flowy**, seu assistente de marketing. Como posso ajudar você a decolar hoje? ✨'
  }
];

export default function Dashboard() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [loading, setLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

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

  const aiTasks = [
    { id: 1, task: "Criar post sobre benefícios do produto", completed: false, priority: "alta" },
    { id: 2, task: "Otimizar anúncio Facebook - público 25-40 anos", completed: false, priority: "média" },
    { id: 3, task: "Responder comentários no Instagram", completed: true, priority: "baixa" },
    { id: 4, task: "Agendar email semanal para leads", completed: false, priority: "alta" },
    { id: 5, task: "Analisar métricas da semana passada", completed: false, priority: "média" }
  ];

  const campaigns = [
    { name: "Campanha Black Friday", status: "success", progress: 85, budget: "R$ 2.500" },
    { name: "Lançamento Produto X", status: "warning", progress: 45, budget: "R$ 1.200" },
    { name: "Retargeting Site", status: "success", progress: 92, budget: "R$ 800" }
  ];

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Início</h1>
          <p className="text-gray-600 mt-1">Visão geral do seu marketing digital</p>
        </div>
        <Button asChild className="text-white" style={{ background: 'var(--flowup-gradient)' }}>
            <Link href="/dashboard/conteudo">
                <Plus className="w-4 h-4 mr-2" />
                Criar conteúdo
            </Link>
        </Button>
      </div>

       {/* Resumo da semana */}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tarefas sugeridas pela IA */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="shadow-lg border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" style={{ color: 'var(--flowup-cyan)' }} />
                Tarefas Sugeridas por IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {aiTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Checkbox 
                    checked={task.completed} 
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className={`text-sm ${task.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                      {task.task}
                    </p>
                    <Badge 
                      variant="outline" 
                      className={`mt-1 text-xs ${
                        task.priority === 'alta' ? 'border-red-200 text-red-700' :
                        task.priority === 'média' ? 'border-yellow-200 text-yellow-700' :
                        'border-green-200 text-green-700'
                      }`}
                    >
                      {task.priority}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Campanhas em andamento */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="shadow-lg border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" style={{ color: 'var(--flowup-blue)' }} />
                Campanhas em Andamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {campaigns.map((campaign, index) => (
                <motion.div
                  key={campaign.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="p-4 border rounded-lg hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                    <div className="flex items-center gap-2">
                      {campaign.status === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {campaign.status === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                      <span className="text-sm text-gray-500">{campaign.budget}</span>
                    </div>
                  </div>
                  <Progress value={campaign.progress} className="mb-2" />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{campaign.progress}% concluído</span>
                    <span>{campaign.status === 'success' ? 'Performance boa' : 'Atenção necessária'}</span>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
