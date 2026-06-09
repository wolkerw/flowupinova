"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ImageIcon,
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { useWizard } from "../context/WizardContext";

 
export const Step3ImageSelection = () => {
  const {
    generatedImages,
    selectedImage,
    setSelectedImage: onSelectedImageChange,
    setStep,
    isGeneratingImages,
    handleDownloadImage: onDownload,
    mode,
  } = useWizard();

  const onBack = () => setStep(2);
  const onNext = () => setStep(4);

  const isReferenceMode = mode === "reference-photo" || mode === "reference-link";
  const maxImages = isReferenceMode ? 1 : 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="relative mx-auto w-full max-w-4xl border-none shadow-lg overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <ImageIcon className="h-6 w-6 text-accent" />
            {maxImages === 1 ? "Etapa 3: Imagem gerada pela IA" : "Etapa 3: Escolha a melhor imagem"}
          </CardTitle>
          <div className="flex items-center justify-between">
            <p className="pt-1 text-sm text-gray-600">
              {maxImages === 1 
                ? (generatedImages.length > 0 
                  ? "Sua imagem publicitária foi criada a partir do seu produto!" 
                  : "Aguarde enquanto nossa IA desenha a imagem ideal para o seu post.")
                : (generatedImages.length > 0 
                  ? "Selecione a imagem gerada pela IA para usar no seu post."
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
            {/* Imagens já geradas com sucesso */}
            {generatedImages.map((imgSrc, index) => (
              <motion.div
                key={`img-${index}`}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
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
              </motion.div>
            ))}

            {/* Slots de carregamento para as imagens ainda sendo geradas */}
            {(isGeneratingImages || generatedImages.length < maxImages) &&
              [...Array(Math.max(0, maxImages - generatedImages.length))].map((_, i) => {
                const slotNumber = generatedImages.length + i + 1;
                const isActiveSlot = i === 0; // O primeiro slot pendente é o que está gerando agora
                return (
                  <motion.div
                    key={`skeleton-${i}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: i * 0.1 }}
                    className="relative aspect-square rounded-lg overflow-hidden border-2 border-dashed border-accent/30 bg-gradient-to-br from-slate-50 to-slate-100"
                  >
                    {/* Shimmer animado de fundo */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "linear", delay: i * 0.4 }}
                    />

                    {/* Conteúdo central do slot */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
                      {isActiveSlot && isGeneratingImages ? (
                        <>
                          {/* Ícone girando para o slot ativo */}
                          <div className="relative">
                            <motion.div
                              className="w-14 h-14 rounded-full border-4 border-accent/20"
                              style={{ borderTopColor: "hsl(var(--accent))" }}
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <ImageIcon className="h-5 w-5 text-accent/60" />
                            </div>
                          </div>
                          <motion.span
                            animate={{ opacity: [0.6, 1, 0.6] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="text-xs font-semibold text-accent text-center leading-tight"
                          >
                            Gerando imagem {slotNumber}...
                          </motion.span>
                          <span className="text-[10px] text-muted-foreground text-center">
                            Nossa IA está criando algo especial ✨
                          </span>
                        </>
                      ) : (
                        <>
                          {/* Ícone de espera para slots na fila */}
                          <div className="w-14 h-14 rounded-full border-4 border-muted-foreground/20 flex items-center justify-center">
                            <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
                          </div>
                          <span className="text-xs font-medium text-muted-foreground text-center">
                            Imagem {slotNumber}
                          </span>
                          <span className="text-[10px] text-muted-foreground/60 text-center">
                            Na fila...
                          </span>
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })}
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
