"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, MessageCircle, Sparkles, Zap, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Marketplace() {
  const modules = [
    {
      name: "Email Marketing Avançado",
      icon: Mail,
      description:
        "Crie campanhas de email personalizadas, automatize fluxos e analise métricas de abertura e clique.",
      price: "R$ 49/mês",
      color: "bg-blue-500",
    },
    {
      name: "WhatsApp Marketing Inteligente",
      icon: MessageCircle,
      description:
        "Envie mensagens automatizadas, gerencie conversas e feche vendas diretamente pelo WhatsApp.",
      price: "R$ 69/mês",
      color: "bg-green-500",
    },
    {
      name: "IA para Conteúdo Avançado",
      icon: Sparkles,
      description:
        "Gere textos, ideias e roteiros de conteúdo para blogs, posts e anúncios com o poder da inteligência artificial.",
      price: "R$ 59/mês",
      color: "bg-purple-500",
    },
    {
      name: "Análise Competitiva (IA)",
      icon: Zap,
      description:
        "Monitore a estratégia de marketing dos seus concorrentes, identifique tendências e descubra oportunidades com IA.",
      price: "R$ 79/mês",
      color: "bg-amber-500",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      {/* Cabeçalho */}
      <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Marketplace de Módulos</h1>
          <p className="mt-1 text-gray-600">Expanda as funcionalidades da sua plataforma NumVapt</p>
        </div>
      </div>

      {/* Grid de Módulos */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {modules.map((module, index) => (
          <motion.div
            key={module.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="flex h-full transform flex-col border shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <CardHeader className="pb-4 text-center">
                <div
                  className={cn(
                    "mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-white",
                    module.color
                  )}
                >
                  <module.icon className="h-8 w-8" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">{module.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-grow flex-col justify-between pt-0 text-center">
                <p className="mb-4 text-sm text-gray-600">{module.description}</p>
                <div>
                  <div className="mb-4 text-2xl font-bold text-primary">{module.price}</div>
                  <Button className="w-full bg-primary text-white shadow-sm transition-all hover:bg-primary/90">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Módulo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
