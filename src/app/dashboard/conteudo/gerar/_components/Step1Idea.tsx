"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Sparkles, ArrowRight, History, Archive, Loader2, ImageIcon, Send, Combine } from "lucide-react";
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
}

export const Step1Idea = ({
  postSummary,
  onPostSummaryChange,
  onGenerate,
  isLoading,
  contentHistory,
  unusedImagesHistory,
  selectedHistoryContent,
  selectedUnusedImage,
  onHistoryContentSelect,
  onUnusedImageSelect,
  onGenerateImagesForHistory,
  onUseUnusedImage,
  onReuseBoth,
  isGeneratingImages
}: Step1IdeaProps) => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-8">
      <Card className="shadow-lg border-none w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-6 h-6 text-purple-500" />
            Etapa 1: Sobre o que é o post?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Escreva um resumo, uma ideia ou algumas palavras-chave sobre o conteúdo que você deseja criar. Quanto mais detalhes você fornecer, melhores serão os resultados.
          </p>
          <Textarea 
            placeholder="Ex: Criar um post sobre os benefícios do nosso novo produto X, destacando a facilidade de uso e o design inovador." 
            className="h-40 text-base" 
            value={postSummary} 
            onChange={(e) => onPostSummaryChange(e.target.value)} 
          />
        </CardContent>
        <CardFooter className="flex justify-end items-center">
          <Button 
            onClick={onGenerate} 
            disabled={!postSummary.trim() || isLoading} 
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Gerando...</>
            ) : (
              <>Gerar Conteúdo com IA <ArrowRight className="w-4 h-4 ml-2" /></>
            )}
          </Button>
        </CardFooter>
      </Card>

      <div className="hidden">
        <Card className="shadow-lg border-none w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <History className="w-6 h-6 text-gray-600" />Histórico e Recursos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="history">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="history"><History className="w-4 h-4 mr-2" />Conteúdos Anteriores</TabsTrigger>
                <TabsTrigger value="unused-images"><Archive className="w-4 h-4 mr-2" />Artes não Utilizadas</TabsTrigger>
              </TabsList>
              
              <TabsContent value="history" className="mt-4">
                <RadioGroup onValueChange={onHistoryContentSelect}>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-3">
                    {contentHistory.length > 0 ? contentHistory.map((content, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 border rounded-lg bg-gray-50/50">
                        <RadioGroupItem value={index.toString()} id={`history-item-${index}`} />
                        <Label htmlFor={`history-item-${index}`} className="flex-1 cursor-pointer">
                          <p className="font-semibold text-sm text-gray-800">{content.título}</p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{content.subtitulo}</p>
                        </Label>
                      </div>
                    )) : (
                      <p className="text-sm text-center text-gray-500 py-8">Nenhum conteúdo no histórico.</p>
                    )}
                  </div>
                </RadioGroup>
                {selectedHistoryContent && !selectedUnusedImage && (
                  <div className="mt-4 flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => onGenerateImagesForHistory(selectedHistoryContent)} disabled={isGeneratingImages}>
                      {isGeneratingImages ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ImageIcon className="w-4 h-4 mr-2" />}
                      Gerar Imagens para o item selecionado
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="unused-images" className="mt-4">
                <RadioGroup onValueChange={onUnusedImageSelect}>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3 max-h-60 overflow-y-auto pr-3">
                    {unusedImagesHistory.length > 0 ? unusedImagesHistory.map((img, index) => (
                      <div key={index} className="relative">
                        <RadioGroupItem value={img} id={`unused-img-${index}`} className="peer sr-only" />
                        <Label htmlFor={`unused-img-${index}`} className="block aspect-square rounded-md overflow-hidden cursor-pointer ring-offset-background peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-primary">
                          <Image src={img} alt={`Arte não utilizada ${index + 1}`} layout="fill" objectFit="cover" unoptimized />
                        </Label>
                      </div>
                    )) : (
                      <p className="text-sm text-center text-gray-500 py-8 col-span-full">Nenhuma arte não utilizada.</p>
                    )}
                  </div>
                </RadioGroup>
                {selectedUnusedImage && !selectedHistoryContent && (
                  <div className="mt-4 flex justify-end">
                    <Button variant="outline" size="sm" onClick={onUseUnusedImage} disabled={isLoading}>
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                      Usar esta arte para publicar
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
            {selectedHistoryContent && selectedUnusedImage && (
              <div className="mt-6 flex justify-center border-t pt-4">
                <Button size="sm" onClick={onReuseBoth} className="bg-gradient-to-r from-green-500 to-teal-500 text-white">
                  <Combine className="w-4 h-4 mr-2"/>Reutilizar Conteúdo e Arte
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};
