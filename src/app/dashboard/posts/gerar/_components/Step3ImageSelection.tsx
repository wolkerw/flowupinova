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
  Maximize2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { useWizard } from "../context/WizardContext";
import { useSubscriptionGate } from "@/hooks/use-subscription-gate";
import { ImageInpaintModal, type EditorLayer } from "./ImageInpaintModal";
import { ImageAiEditorModal } from "@/components/dashboard/ImageAiEditorModal";
import { ImageZoomModal } from "@/components/ui/ImageZoomModal";

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

  const { canEditImages } = useSubscriptionGate();

  const [isCorrectionOpen, setIsCorrectionOpen] = useState(false);
  const [activeImageToCorrect, setActiveImageToCorrect] = useState<string | null>(null);
  const [activeSlotName, setActiveSlotName] = useState<string>("");
  const [layersMap, setLayersMap] = useState<Record<string, { originalUrl: string; layers: EditorLayer[] }>>({});
  const [zoomImage, setZoomImage] = useState<{ url: string; title: string } | null>(null);
  const [aiEditorImage, setAiEditorImage] = useState<{ url: string; index: number } | null>(null);

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
                  "group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-lg transition-all duration-300",
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
                {/* Ações de Hover (Editar IA, Ampliar e Baixar) */}
                <div className="absolute right-2 top-2 z-20 flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                  {canEditImages && (
                    <Button
                      size="sm"
                      variant="secondary"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAiEditorImage({ url: imgSrc, index });
                      }}
                      title="Ajustar Título / Infográfico com GPT-image-2.5"
                      className="h-8 px-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs backdrop-blur-sm shadow-md flex items-center gap-1"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Ajustar IA</span>
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="secondary"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setZoomImage({ url: imgSrc, title: `Opção ${index + 1}` });
                    }}
                    title="Ampliar Imagem"
                    className="h-8 w-8 bg-black/70 text-white hover:bg-black/90 backdrop-blur-sm"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                  {onDownload && (
                    <Button
                      size="icon"
                      variant="secondary"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownload(imgSrc);
                      }}
                      title="Baixar Imagem"
                      className="h-8 w-8 bg-black/70 text-white hover:bg-black/90 backdrop-blur-sm"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </div>
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
                    className="relative aspect-[3/4] overflow-hidden rounded-lg border-2 border-dashed border-accent/30 bg-gradient-to-br from-slate-50 to-slate-100"
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
                      {isGeneratingImages ? (
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
                            Aguardando geração...
                          </span>
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })}
          </div>

          {/* Banner de Ajuste Fino Inteligente com GPT-image-2.5 (Apenas para usuários autorizados no Admin) */}
          {canEditImages && selectedImage && (
            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white shadow-xs">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-950">
                    Deseja ajustar o título ou texto de infográfico desta arte?
                  </h4>
                  <p className="text-[11px] text-amber-800">
                    O modelo GPT-image-2.5 preserva o design e altera cirurgicamente os textos solicitados.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                type="button"
                onClick={() => {
                  const idx = generatedImages.indexOf(selectedImage);
                  setAiEditorImage({ url: selectedImage, index: idx >= 0 ? idx : 0 });
                }}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl h-8 px-3.5 shadow-xs shrink-0 flex items-center gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Ajustar com IA
              </Button>
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
            disabled={!selectedImage}
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

      {/* Modal de Zoom e Ampliação da Imagem */}
      <ImageZoomModal
        isOpen={!!zoomImage}
        onClose={() => setZoomImage(null)}
        imageUrl={zoomImage?.url || null}
        title={zoomImage?.title || "Visualização da Imagem"}
        onDownload={onDownload}
      />

      {/* Modal de Edição Inteligente com GPT-image-2.5 */}
      {aiEditorImage && (
        <ImageAiEditorModal
          isOpen={!!aiEditorImage}
          onClose={() => setAiEditorImage(null)}
          imageUrl={aiEditorImage.url}
          format="portrait"
          onSuccess={(newImageUrl) => {
            setGeneratedImages((prev) => {
              const updated = [...prev];
              if (aiEditorImage.index >= 0 && aiEditorImage.index < updated.length) {
                updated[aiEditorImage.index] = newImageUrl;
              }
              return updated;
            });
            onSelectedImageChange(newImageUrl);
            setAiEditorImage(null);
          }}
        />
      )}
    </motion.div>
  );
};
