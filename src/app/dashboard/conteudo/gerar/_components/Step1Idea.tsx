"use client";

import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, ArrowRight, Loader2, UploadCloud, X, Box, MessageSquare } from "lucide-react";
import { GeneratedContent } from "../types";

interface Step1IdeaProps {
  postSummary: string;
  onPostSummaryChange: (value: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
  contentHistory: GeneratedContent[];
  unusedImagesHistory: string[];
  selectedHistoryContent: GeneratedContent | null;
  selectedUnusedImage: string | null;
  onHistoryContentSelect: (index: string) => void;
  onUnusedImageSelect: (url: string) => void;
  onGenerateImagesForHistory: (content: GeneratedContent) => void;
  onUseUnusedImage: () => void;
  onReuseBoth: () => void;
  isGeneratingImages: boolean;
  referenceImagePreview: string | null;
  onReferenceImageChange: (file: File | null) => void;
  referenceDescription: string;
  onReferenceDescriptionChange: (value: string) => void;
}

export const Step1Idea = ({
  postSummary,
  onPostSummaryChange,
  onGenerate,
  isLoading,
  referenceImagePreview,
  onReferenceImageChange,
  referenceDescription,
  onReferenceDescriptionChange
}: Step1IdeaProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onReferenceImageChange(file);
    }
  };

  const isButtonDisabled = 
    !postSummary.trim() || 
    isLoading || 
    (!!referenceImagePreview && !referenceDescription.trim());

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-8">
      <Card className="shadow-lg border-none w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-6 h-6 text-purple-500" />
            Etapa 1: Sobre o que é o post?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-base font-semibold">Ideia do Conteúdo</Label>
            <p className="text-sm text-gray-600 mb-2">
              Escreva um resumo, uma ideia ou algumas palavras-chave sobre o conteúdo que você deseja criar. Quanto mais detalhes você fornecer, melhores serão os resultados.
            </p>
            <Textarea 
              placeholder="Ex: Criar um post sobre os benefícios do nosso novo produto X, destacando a facilidade de uso e o design inovador." 
              className="h-32 text-base" 
              value={postSummary} 
              onChange={(e) => onPostSummaryChange(e.target.value)} 
            />
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 mb-2">
              <Box className="w-5 h-5 text-blue-500" />
              <Label className="text-base font-semibold">Imagem do Produto (Opcional)</Label>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Deseja destacar um produto real? Envie uma foto dele para que a IA tente usá-la como base para criar a imagem do post. 
              <span className="block mt-1 text-xs italic">Exemplos: Foto do seu produto físico, uma embalagem específica ou um ambiente da sua loja.</span>
            </p>

            <div className="space-y-6">
              {!referenceImagePreview ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-gray-50 transition-all"
                >
                  <UploadCloud className="w-10 h-10 text-gray-400 mb-2" />
                  <p className="text-sm font-medium text-gray-700">Clique para enviar uma imagem</p>
                  <p className="text-xs text-gray-500">PNG, JPG ou JPEG (Máx. 5MB)</p>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>
              ) : (
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="relative w-40 h-40 rounded-lg overflow-hidden border shadow-sm group shrink-0">
                    <Image 
                      src={referenceImagePreview} 
                      alt="Referência" 
                      layout="fill" 
                      objectFit="cover" 
                    />
                    <button 
                      onClick={() => onReferenceImageChange(null)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <AnimatePresence>
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      className="flex-1 space-y-3 w-full"
                    >
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-primary" />
                        <Label className="text-sm font-bold">
                          Descreva a imagem enviada <span className="text-red-500">*</span>
                        </Label>
                      </div>
                      <p className="text-xs text-gray-500">
                        Explique o que é o produto/objeto na foto e como você gostaria que ele fosse integrado à imagem final (ex: "coloque este frasco de perfume sobre uma mesa de mármore com flores brancas ao fundo").
                      </p>
                      <Textarea 
                        placeholder="Descreva detalhes como cor, material e o cenário desejado para este item..." 
                        className="h-24 text-sm" 
                        value={referenceDescription} 
                        onChange={(e) => onReferenceDescriptionChange(e.target.value)}
                        required
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end items-center">
          <Button 
            onClick={onGenerate} 
            disabled={isButtonDisabled} 
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Gerando...</>
            ) : (
              <>Avançar <ArrowRight className="w-4 h-4 ml-2" /></>
            )}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};
