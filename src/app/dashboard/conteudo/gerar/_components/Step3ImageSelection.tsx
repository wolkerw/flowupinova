"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ImageIcon,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  AlertTriangle,
} from "lucide-react";
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
  onDownload,
}: Step3ImageSelectionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="mx-auto w-full max-w-4xl border-none shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <ImageIcon className="h-6 w-6 text-accent" />
            Etapa 3: Escolha a melhor imagem
          </CardTitle>
          <div className="flex items-center justify-between">
            <p className="pt-1 text-sm text-gray-600">
              Selecione uma das imagens geradas pela IA para usar em seu post.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {isGeneratingImages ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="relative flex aspect-square animate-pulse flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted"
                >
                  <Loader2 className="h-8 w-8 animate-spin text-accent/40" />
                  <span className="mt-2 text-xs font-medium text-muted-foreground">
                    Gerando imagem {i + 1}...
                  </span>
                </div>
              ))}
            </div>
          ) : generatedImages.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {generatedImages.map((imgSrc, index) => (
                <div
                  key={index}
                  onClick={() => onSelectedImageChange(imgSrc)}
                  className={cn(
                    "group relative aspect-square cursor-pointer overflow-hidden rounded-lg transition-all duration-300",
                    "ring-4 ring-offset-2",
                    selectedImage === imgSrc ? "ring-accent" : "ring-transparent"
                  )}
                >
                  <Image
                    src={imgSrc}
                    alt={`Imagem gerada ${index + 1}`}
                    layout="fill"
                    objectFit="cover"
                    className="transition-transform duration-300 group-hover:scale-105"
                    unoptimized
                  />
                  {selectedImage === imgSrc && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                      <Check className="h-12 w-12 text-white" />
                    </div>
                  )}
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownload(imgSrc);
                    }}
                    className="absolute right-2 top-2 z-10 h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <AlertTriangle className="mb-4 h-12 w-12 text-destructive" />
              <p className="text-lg font-semibold text-gray-700">Nenhuma imagem foi gerada.</p>
              <p className="mb-6 text-sm text-gray-500">
                Parece que houve um problema. Tente gerar novamente.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar e Mudar Texto
          </Button>
          <Button
            onClick={onNext}
            disabled={!selectedImage || isGeneratingImages}
            className="bg-accent text-white shadow-md hover:bg-accent/90"
          >
            Avançar
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};
