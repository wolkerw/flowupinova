"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, Loader2, HomeIcon, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatBubble, type Message } from "@/components/chat/chat-bubble";
import { getAiResponse } from "./actions";

const initialMessages: Message[] = [
  {
    sender: 'ai',
    text: 'Olá! Sou o **FlowUp**, seu assistente de marketing. Como posso ajudar você a decolar hoje? ✨'
  }
];

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async () => {
    if (!prompt.trim() || loading) return;

    const userMessage: Message = { sender: 'user', text: prompt };
    setMessages(prev => [...prev, userMessage]);
    const currentPrompt = prompt;
    setPrompt("");
    setLoading(true);

    try {
      const aiResponseText = await getAiResponse(currentPrompt);
      const aiMessage: Message = { sender: 'ai', text: aiResponseText };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Erro no chat:", error);
      const errorMessage: Message = { 
        sender: 'ai', 
        text: "Desculpe, um erro inesperado ocorreu. Por favor, tente novamente.", 
        isError: true 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex w-full max-w-4xl flex-col items-center justify-center text-center"
      >
        <div className="relative mb-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-accent to-primary">
            <Bot className="h-12 w-12 text-primary-foreground" />
          </div>
          <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-accent animate-pulse" />
        </div>

        <h1 className="mb-8 text-4xl font-bold leading-tight text-foreground sm:text-5xl font-headline">
          Olá! Como posso ajudar você hoje?
        </h1>

        <div className="mb-6 h-96 w-full max-w-3xl overflow-y-auto rounded-xl bg-card p-6 shadow-lg">
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
          <div ref={messagesEndRef} />
        </div>

        <div className="relative mb-8 flex w-full max-w-2xl items-center rounded-xl border bg-card p-2 shadow-lg">
          <Input
            className="flex-grow border-none bg-transparent py-3 pl-4 pr-12 text-base focus-visible:ring-0"
            placeholder="Pergunte sobre marketing, crie conteúdos..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") handleSendMessage();
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

        <Link href="/dashboard">
          <Button variant="outline" className="flex items-center gap-2 border-accent shadow-lg transition-all duration-300 hover:shadow-xl hover:bg-accent/10">
            <HomeIcon className="h-5 w-5" />
            Ir para o Dashboard
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
