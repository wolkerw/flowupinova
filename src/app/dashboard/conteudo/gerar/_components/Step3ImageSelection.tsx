"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageIcon, Loader2, ArrowLeft, ArrowRight, Check, Download, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step3ImageSelectionProps {
  generatedImages: string[];
  selectedImage: string | null;
  onSelectedImageChange: (url: string) => void;
  onBack: () => void;
  onNext: () => void;
  isGeneratingImages: boolean;
  onDownload: (url: string) => void;
}

export const Step3ImageSelection = ({
  generatedImages,
  selectedImage,
  onSelectedImageChange,
  onBack,
  onNext,
  isGeneratingImages,
  onDownload
}: Step3ImageSelectionProps) => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="shadow-lg border-none w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <ImageIcon className="w-6 h-6 text-purple-500" />
            Etapa 3: Escolha a melhor imagem
          </CardTitle>
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600 pt-1">Selecione uma das imagens geradas pela IA para usar em seu post.</p>
          </div>
        </CardHeader>
        <CardContent>
          {isGeneratingImages ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 className="w-12 h-12 mr-2 animate-spin text-purple-500" />
              <span className="text-lg text-gray-600 mt-4">Criando imagens incríveis...</span>
            </div>
          ) : generatedImages.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {generatedImages.map((imgSrc, index) => (
                <div 
                  key={index} 
                  onClick={() => onSelectedImageChange(imgSrc)} 
                  className={cn(
                    "relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all duration-300 group",
                    "ring-4 ring-offset-2",
                    selectedImage === imgSrc ? "ring-purple-500" : "ring-transparent"
                  )}
                >
                  <Image 
                    src={imgSrc} 
                    alt={`Imagem gerada ${index + 1}`} 
                    layout="fill" 
                    objectFit="cover" 
                    className="group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                  />
                  {selectedImage === imgSrc && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Check className="w-12 h-12 text-white" />
                    </div>
                  )}
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    onClick={(e) => { e.stopPropagation(); onDownload(imgSrc); }} 
                    className="absolute top-2 right-2 z-10 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
              <p className="text-lg font-semibold text-gray-700">Nenhuma imagem foi gerada.</p>
              <p className="text-sm text-gray-500 mb-6">Parece que houve um problema. Tente gerar novamente.</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />Voltar e Mudar Texto
          </Button>
          <Button 
            onClick={onNext} 
            disabled={!selectedImage || isGeneratingImages} 
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
          >
            Avançar<ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};
