"use client";

import React, { useState } from "react";
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
  Paintbrush,
  Type,
  SkipForward,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { useWizard } from "../context/WizardContext";
import { ImageInpaintModal, type EditorLayer } from "./ImageInpaintModal";

export const Step3ImageSelection = () => {
  const {
    generatedImages,
    setGeneratedImages,
    selectedImage,
    setSelectedImage: onSelectedImageChange,
    setStep,
    isGeneratingImages,
    handleDownloadImage: onDownload,
    mode,
    currentPostId,
    user,
    selectedContent,
    businessProfile,
    insertTextOnImage,
    inspirationFile,
  } = useWizard();

  const [isCorrectionOpen, setIsCorrectionOpen] = useState(false);
  const [activeImageToCorrect, setActiveImageToCorrect] = useState<string | null>(null);
  const [activeSlotName, setActiveSlotName] = useState<string>("");
  const [layersMap, setLayersMap] = useState<Record<string, { originalUrl: string; layers: EditorLayer[] }>>({});

  const onBack = () => setStep(2);
  const onNext = () => {
    if (!selectedImage && generatedImages.length > 0) {
      onSelectedImageChange(generatedImages[0]);
    }
    setStep(4);
  };

  const maxImages = inspirationFile ? 1 : 2;

  // Texto pré-carregado da Etapa 2 para o editor de textos
  const initialTextForEditor = selectedContent?.titulo || "";

  // Slot name da imagem selecionada para o inpainting
  const selectedSlotName = selectedImage
    ? String(generatedImages.indexOf(selectedImage) + 1 || 1)
    : "1";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="relative mx-auto w-full max-w-4xl overflow-hidden border-none shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <ImageIcon className="h-6 w-6 text-accent" />
            {maxImages === 1
              ? "Etapa 3: Imagem gerada pela IA"
              : "Etapa 3: Escolha a melhor imagem"}
          </CardTitle>
          <div className="flex items-center justify-between">
            <p className="pt-1 text-sm text-gray-600">
              {maxImages === 1
                ? generatedImages.length > 0
                  ? "Sua imagem publicitária foi criada a partir do seu produto!"
                  : "Aguarde enquanto nossa IA desenha a imagem ideal para o seu post."
                : generatedImages.length > 0
                  ? "Selecione uma das imagens geradas pela IA para usar no seu post."
                  : "Clique no botão abaixo para gerar as opções de imagem para o seu post."}
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Grid de imagens */}
          <div
            className={cn(
              "grid grid-cols-1 gap-4",
              maxImages === 1 ? "mx-auto w-full max-w-md md:grid-cols-1" : "md:grid-cols-2"
            )}
          >
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
                  alt={`Opção ${index + 1}`}
                  layout="fill"
                  objectFit="cover"
                  className="transition-transform duration-300 group-hover:scale-105"
                  unoptimized
                />
                {/* Badge de opção */}
                <div className="absolute bottom-2 left-2 z-10 rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
                  Opção {index + 1}
                </div>
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
                    className="relative aspect-square overflow-hidden rounded-lg border-2 border-dashed border-accent/30 bg-gradient-to-br from-slate-50 to-slate-100"
                  >
                    {/* Shimmer animado de fundo */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{
                        duration: 1.8,
                        repeat: Infinity,
                        ease: "linear",
                        delay: i * 0.4,
                      }}
                    />

                    {/* Conteúdo central do slot */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
                      {isActiveSlot && isGeneratingImages ? (
                        <>
                          {/* Ícone girando para o slot ativo */}
                          <div className="relative">
                            <motion.div
                              className="h-14 w-14 rounded-full border-4 border-accent/20"
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
                            className="text-center text-xs font-semibold leading-tight text-accent"
                          >
                            Gerando opção {slotNumber}...
                          </motion.span>
                          <span className="text-center text-[10px] text-muted-foreground">
                            Nossa IA está criando algo especial ✨
                          </span>
                        </>
                      ) : (
                        <>
                          {/* Ícone de espera para slots na fila */}
                          <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-muted-foreground/20">
                            <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
                          </div>
                          <span className="text-center text-xs font-medium text-muted-foreground">
                            Opção {slotNumber}
                          </span>
                          <span className="text-center text-[10px] text-muted-foreground/60">
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

      {/* Modal de edição de texto sobre imagem (botão hover em cada imagem) */}
      {isCorrectionOpen && activeImageToCorrect && (
        <ImageInpaintModal
          isOpen={isCorrectionOpen}
          onClose={() => {
            setIsCorrectionOpen(false);
            setActiveImageToCorrect(null);
            setActiveSlotName("");
          }}
          imageUrl={layersMap[activeImageToCorrect]?.originalUrl || activeImageToCorrect}
          initialLayers={layersMap[activeImageToCorrect]?.layers}
          postId={currentPostId || ""}
          userId={user?.uid || ""}
          fileName={activeSlotName}
          initialText={insertTextOnImage ? initialTextForEditor : undefined}
          brandKitPrimaryColor={
            businessProfile?.brandKit?.primaryColor || businessProfile?.primaryColor
          }
          brandKitSecondaryColor={
            businessProfile?.brandKit?.secondaryColor || businessProfile?.secondaryColor
          }
          onSuccess={(newImageUrl, layers) => {
            const origUrl = layersMap[activeImageToCorrect]?.originalUrl || activeImageToCorrect;
            setLayersMap((prev) => ({
              ...prev,
              [newImageUrl]: {
                originalUrl: origUrl,
                layers: layers || [],
              },
            }));
            setGeneratedImages((prev) => {
              const updated = [...prev];
              const idx = parseInt(activeSlotName, 10) - 1;
              if (idx >= 0 && idx < updated.length) {
                updated[idx] = newImageUrl;
              }
              return updated;
            });
            if (selectedImage === activeImageToCorrect) {
              onSelectedImageChange(newImageUrl);
            }
            setIsCorrectionOpen(false);
            setActiveImageToCorrect(null);
            setActiveSlotName("");
          }}
        />
      )}
    </motion.div>
  );
};
