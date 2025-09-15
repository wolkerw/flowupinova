"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Mail,
  MessageCircle,
  Sparkles,
  Zap,
  Plus
} from "lucide-react";
import { motion } from "framer-motion";

export default function Marketplace() {
  const modules = [
    {
      name: "Email Marketing Avançado",
      icon: Mail,
      description: "Crie campanhas de email personalizadas, automatize fluxos e analise métricas de abertura e clique.",
      price: "R$ 49/mês",
      color: "linear-gradient(135deg, #7DD3FC 0%, #3B82F6 100%)"
    },
    {
      name: "WhatsApp Marketing Inteligente",
      icon: MessageCircle,
      description: "Envie mensagens automatizadas, gerencie conversas e feche vendas diretamente pelo WhatsApp.",
      price: "R$ 69/mês",
      color: "linear-gradient(135deg, #10B981 0%, #059669 100%)"
    },
    {
      name: "IA para Conteúdo Avançado",
      icon: Sparkles,
      description: "Gere textos, ideias e roteiros de conteúdo para blogs, posts e anúncios com o poder da inteligência artificial.",
      price: "R$ 59/mês",
      color: "linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)"
    },
    {
      name: "Análise Competitiva (IA)",
      icon: Zap,
      description: "Monitore a estratégia de marketing dos seus concorrentes, identifique tendências e descubra oportunidades com IA.",
      price: "R$ 79/mês",
      color: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)"
    }
  ];

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* FlowUp CSS Variables */}
      <style>{`
        :root {
          --flowup-gradient: linear-gradient(135deg, #7DD3FC 0%, #3B82F6 50%, #1E40AF 100%);
        }
      `}</style>

      {/* Cabeçalho */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Marketplace de Módulos</h1>
          <p className="text-gray-600 mt-1">Expanda as funcionalidades da sua plataforma FlowUp</p>
        </div>
      </div>

      {/* Grid de Módulos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {modules.map((module, index) => (
          <motion.div
            key={module.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="shadow-lg border-none hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4"
                     style={{ background: module.color }}>
                  <module.icon className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">{module.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-center pt-0 flex-grow flex flex-col justify-between">
                <p className="text-gray-600 text-sm mb-4">{module.description}</p>
                <div>
                    <div className="text-2xl font-bold mb-4" style={{ color: '#3B82F6' }}>{module.price}</div>
                    <Button className="w-full text-white shadow-md"
                           style={{ background: 'var(--flowup-gradient)' }}>
                      <Plus className="w-4 h-4 mr-2" />
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
