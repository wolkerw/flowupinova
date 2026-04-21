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
            <ImageIcon className="w-6 h-6 text-accent" />
            Etapa 3: Escolha a melhor imagem
          </CardTitle>
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600 pt-1">Selecione uma das imagens geradas pela IA para usar em seu post.</p>
          </div>
        </CardHeader>
        <CardContent>
          {isGeneratingImages ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div 
                  key={i} 
                  className="relative aspect-square rounded-lg bg-muted animate-pulse flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/20"
                >
                  <Loader2 className="w-8 h-8 animate-spin text-accent/40" />
                  <span className="text-xs text-muted-foreground mt-2 font-medium">Gerando imagem {i + 1}...</span>
                </div>
              ))}
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
                    selectedImage === imgSrc ? "ring-accent" : "ring-transparent"
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
            className="bg-accent hover:bg-accent/90 text-white shadow-md"
          >
            Avançar<ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};
