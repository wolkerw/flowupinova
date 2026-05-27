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
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { useWizard } from "../context/WizardContext";

export const Step3ImageSelection = () => {
  const {
    generatedImages,
    selectedImage,
    setSelectedImage: onSelectedImageChange,
    setStep,
    handleGeneratePrompts: onGenerate,
    isGeneratingImages,
    handleDownloadImage: onDownload,
    referenceImageFile,
  } = useWizard();

  const onBack = () => setStep(2);
  const onNext = () => setStep(4);

  const maxImages = referenceImageFile ? 1 : 3;

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
            {maxImages === 1 ? "Etapa 3: Sua imagem gerada" : "Etapa 3: Escolha a melhor imagem"}
          </CardTitle>
          <div className="flex items-center justify-between">
            <p className="pt-1 text-sm text-gray-600">
              {maxImages === 1 
                ? (generatedImages.length > 0 
                  ? "Sua imagem publicitária foi criada a partir do seu produto!" 
                  : "Aguarde enquanto nossa IA desenha a imagem ideal para o seu post.")
                : (generatedImages.length > 0 
                  ? "Selecione a imagem gerada pela IA para usar em seu post."
                  : "Clique no botão abaixo para gerar as opções de imagem para o seu post.")
              }
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className={cn(
            "grid grid-cols-1 gap-4",
            maxImages === 1 ? "max-w-md mx-auto w-full md:grid-cols-1" : "md:grid-cols-3"
          )}>
            {/* Imagens já encontradas */}
            {generatedImages.map((imgSrc, index) => (
              <div
                key={`img-${index}`}
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
                {onDownload && (
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
                )}
              </div>
            ))}

            {/* Placeholders de carregamento para completar os slots necessários */}
            {generatedImages.length < maxImages &&
              [...Array(maxImages - generatedImages.length)].map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className="relative flex aspect-square animate-pulse flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted"
                >
                  <Loader2 className="h-8 w-8 animate-spin text-accent/40" />
                  <span className="mt-2 text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                    {maxImages === 1 ? "Gerando imagem..." : `Gerando opção ${generatedImages.length + i + 1}...`}
                  </span>
                </div>
              ))}
          </div>
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
