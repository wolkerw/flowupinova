
"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function GerarConteudoPage() {
  const [postSummary, setPostSummary] = useState("");

  const handleGenerate = () => {
    // Lógica para gerar conteúdo será adicionada aqui
    console.log("Gerando conteúdo com o resumo:", postSummary);
  };

  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto">
      {/* Cabeçalho */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Gerar Conteúdo com IA</h1>
        <p className="text-gray-600 mt-1">Dê à nossa IA uma ideia e ela criará posts incríveis para você.</p>
      </div>

      {/* Etapa 1 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="shadow-lg border-none w-full">
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
              onClick={handleGenerate}
              disabled={!postSummary.trim()}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
            >
              Gerar Conteúdo
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
