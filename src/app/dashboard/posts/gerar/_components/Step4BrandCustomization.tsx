"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import {
  UploadCloud,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Sparkles,
  Paintbrush,
  Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoPosition } from "../types";
import { CircularProgressLoader } from "./CircularProgressLoader";
import { ImageInpaintModal, type EditorLayer } from "./ImageInpaintModal";
import { ImageZoomModal } from "@/components/ui/ImageZoomModal";

import { useWizard } from "../context/WizardContext";

export const Step4BrandCustomization = () => {
  const [isZoomOpen, setIsZoomOpen] = React.useState(false);
  const {
    selectedImage,
    logoFile,
    logoPreviewUrl,
    logoPosition,
    logoScale,
    logoOpacity,
    handleLogoFileChange: onLogoUpload,
    setLogoFile,
    setLogoPreviewUrl,
    selectLogoFromBrandKit,
    setLogoPosition: onPositionChange,
    setLogoScale: onScaleChange,
    setLogoOpacity: onOpacityChange,
    setStep,
    handleLogoProcessing: onNext,
    isUploading,
    visualLogoScale,
    logoInputRef,
    isGeneratingImages,
    selectedContent,
    mode,
    currentPostId,
    user,
    businessProfile,
    insertTextOnImage,
    generateTextSuggestions,
    setSelectedImage,
    generatedImages,
    setGeneratedImages,
    processedImageUrl,
    setProcessedImageUrl,
  } = useWizard();

  const [isCorrectionOpen, setIsCorrectionOpen] = React.useState(false);
  const [layersMap, setLayersMap] = React.useState<Record<string, { originalUrl: string; layers: EditorLayer[] }>>({});

  // URL da imagem que deve ser exibida no preview da Step4.
  // Prefere a originalUrl do editor (sem marca d'agua processada) para permitir reedição.
  const previewImageUrl = React.useMemo(() => {
    if (selectedImage && layersMap[selectedImage]?.originalUrl) {
      return layersMap[selectedImage].originalUrl;
    }
    return selectedImage;
  }, [selectedImage, layersMap]);

  const isSyncImageMode = mode === "reference-photo" || mode === "reference-hybrid";

  const availableLogos = React.useMemo(() => {
    if (!businessProfile) return [];
    const logos = [];
    if (businessProfile.logos?.horizontal?.url) logos.push({ id: 'horizontal', url: businessProfile.logos.horizontal.url, label: 'Horizontal' });
    if (businessProfile.logos?.vertical?.url) logos.push({ id: 'vertical', url: businessProfile.logos.vertical.url, label: 'Vertical' });
    if (businessProfile.logos?.symbol?.url) logos.push({ id: 'symbol', url: businessProfile.logos.symbol.url, label: 'Símbolo' });
    if (businessProfile.logos?.avatar?.url) logos.push({ id: 'avatar', url: businessProfile.logos.avatar.url, label: 'Avatar' });
    
    if (logos.length === 0 && businessProfile.logo?.url) {
      logos.push({ id: 'default', url: businessProfile.logo.url, label: 'Principal' });
    }
    
    return logos;
  }, [businessProfile]);

  const onBack = () => {
    if (isSyncImageMode) {
      setStep(generateTextSuggestions ? 2 : 1);
    } else {
      setStep(3);
    }
  };
  const onLogoRemove = () => {
    setLogoFile(null);
    setLogoPreviewUrl(null);
  };
  const selectedTitle = selectedContent?.titulo || "";
  const positions: LogoPosition[] = [
    "top-left",
    "top-center",
    "top-right",
    "left-center",
    "center",
    "right-center",
    "bottom-left",
    "bottom-center",
    "bottom-right",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Sparkles className="h-6 w-6 text-accent" />
                Etapa 3: Personalize com sua Marca
              </CardTitle>
              <p className="text-sm text-gray-600">
                Adicione sua logomarca e o título à imagem selecionada.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Section */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Sua Logomarca</Label>
                {!logoPreviewUrl ? (
                  <div className="space-y-4">
                    {availableLogos.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {availableLogos.map((logo) => {
                          const isSelected = logoPreviewUrl === logo.url;
                          return (
                            <div
                              key={logo.id}
                              className={cn(
                                "cursor-pointer border-2 rounded-lg p-2 flex flex-col items-center justify-center transition-all",
                                isSelected
                                  ? "border-primary bg-primary/10 shadow-sm"
                                  : "border-slate-200 hover:border-indigo-400 hover:bg-slate-50"
                              )}
                              onClick={() => {
                                selectLogoFromBrandKit(logo.url, logo.label);
                              }}
                            >
                              <div className="relative w-full h-12 mb-1">
                                <Image src={logo.url} alt={logo.label} layout="fill" objectFit="contain" />
                              </div>
                              <span
                                className={cn(
                                  "text-[10px] font-semibold uppercase text-center w-full block truncate",
                                  isSelected ? "text-primary font-bold" : "text-gray-500"
                                )}
                              >
                                {logo.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      <UploadCloud className="mr-2 h-4 w-4" />
                      Anexar {availableLogos.length > 0 ? "Outra " : ""}Logomarca
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Grade de troca rápida entre logos do Brand Kit */}
                    {availableLogos.length > 1 && (
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Trocar por outra logo do Brand Kit:</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {availableLogos.map((logo) => {
                            const isSelected = logoPreviewUrl === logo.url;
                            return (
                              <div
                                key={logo.id}
                                className={cn(
                                  "cursor-pointer border-2 rounded-lg p-1.5 flex flex-col items-center justify-center transition-all",
                                  isSelected
                                    ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary"
                                    : "border-slate-200 hover:border-indigo-400 hover:bg-slate-50"
                                )}
                                onClick={() => {
                                  selectLogoFromBrandKit(logo.url, logo.label);
                                }}
                              >
                                <div className="relative w-full h-8 mb-1">
                                  <Image src={logo.url} alt={logo.label} layout="fill" objectFit="contain" />
                                </div>
                                <span
                                  className={cn(
                                    "text-[9px] font-semibold uppercase text-center w-full block truncate",
                                    isSelected ? "text-primary font-bold" : "text-gray-500"
                                  )}
                                >
                                  {logo.label} {isSelected ? "✓" : ""}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between rounded-lg border bg-gray-50 p-2">
                      <div className="flex items-center gap-2">
                        <Image
                          src={logoPreviewUrl}
                          alt="Preview da logomarca"
                          width={40}
                          height={40}
                          className="rounded object-contain"
                        />
                        <span className="max-w-[150px] truncate text-sm text-gray-600">
                          {logoFile?.name || "Logomarca Selecionada"}
                        </span>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-500 hover:bg-red-100"
                        onClick={onLogoRemove}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div>
                      <Label className="text-sm">Posição da Logo</Label>
                      <RadioGroup
                        value={logoPosition}
                        onValueChange={(v) => onPositionChange(v as LogoPosition)}
                        className="mt-2 grid grid-cols-3 gap-2"
                      >
                        {positions.map((pos) => (
                          <div key={`logo-${pos}`}>
                            <RadioGroupItem
                              value={pos}
                              id={`logo-${pos}`}
                              className="peer sr-only"
                            />
                            <Label
                              htmlFor={`logo-${pos}`}
                              className="flex cursor-pointer items-center justify-center rounded-md border-2 border-muted bg-popover p-2 text-xs capitalize hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary"
                            >
                              {pos.replace("-", " ")}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="logo-scale" className="text-sm">
                          Tamanho ({logoScale}%)
                        </Label>
                        <Slider
                          id="logo-scale"
                          min={10}
                          max={100}
                          step={1}
                          value={[logoScale]}
                          onValueChange={([v]) => onScaleChange(v)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="logo-opacity" className="text-sm">
                          Opacidade ({logoOpacity}%)
                        </Label>
                        <Slider
                          id="logo-opacity"
                          min={10}
                          max={100}
                          step={5}
                          value={[logoOpacity]}
                          onValueChange={([v]) => onOpacityChange(v)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="group flex h-full flex-col items-center justify-start">
          <div className="sticky top-24 w-full">
            <div className="mx-auto w-full max-w-sm">
              <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg border bg-gray-200 shadow-md">
                {isGeneratingImages ? (
                  <CircularProgressLoader isActive={isGeneratingImages} />
                ) : previewImageUrl ? (
                  <>
                    <Image
                      src={previewImageUrl}
                      layout="fill"
                      objectFit="cover"
                      alt="Imagem selecionada"
                      unoptimized
                    />
                    {/* Botão de Ampliar Preview */}
                    <Button
                      size="icon"
                      variant="secondary"
                      type="button"
                      onClick={() => setIsZoomOpen(true)}
                      title="Ampliar Imagem"
                      className="absolute right-2 top-2 z-30 h-8 w-8 bg-black/70 text-white hover:bg-black/90 backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>

                    {/* Logo Overlay Preview */}
                    {logoPreviewUrl && (
                      <div
                        className={cn("absolute z-10", {
                          "left-4 top-4": logoPosition === "top-left",
                          "left-1/2 top-4 -translate-x-1/2": logoPosition === "top-center",
                          "right-4 top-4": logoPosition === "top-right",
                          "left-4 top-1/2 -translate-y-1/2": logoPosition === "left-center",
                          "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2":
                            logoPosition === "center",
                          "right-4 top-1/2 -translate-y-1/2": logoPosition === "right-center",
                          "bottom-4 left-4": logoPosition === "bottom-left",
                          "bottom-4 left-1/2 -translate-x-1/2": logoPosition === "bottom-center",
                          "bottom-4 right-4": logoPosition === "bottom-right",
                        })}
                        style={{ width: `${visualLogoScale}%`, opacity: logoOpacity / 100 }}
                      >
                        <Image
                          src={logoPreviewUrl}
                          alt="Logomarca"
                          width={500}
                          height={500}
                          className="h-auto w-full"
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-8 text-center text-gray-400">
                    <p>Nenhuma imagem gerada.</p>
                  </div>
                )}
              </div>
              {selectedImage && !isGeneratingImages && (
                <Button
                  variant="outline"
                  onClick={() => setIsCorrectionOpen(true)}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border-primary/40 py-2 font-medium text-slate-800 transition-all hover:border-primary hover:bg-primary/5"
                >
                  <Paintbrush className="h-4 w-4 text-primary" />
                  Escrever Textos / Editar Imagem
                </Button>
              )}
              <p className="mt-4 text-center text-xs italic text-muted-foreground">
                * A visualização é uma estimativa. O resultado final pode variar ligeiramente.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-8 flex max-w-4xl justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Button
          onClick={() => onNext()}
          disabled={isUploading}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            "Revisar publicação"
          )}
          {!isUploading && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
      </div>
      <input
        type="file"
        ref={logoInputRef}
        onChange={onLogoUpload}
        accept="image/png, image/jpeg"
        className="hidden"
      />

      {isCorrectionOpen && selectedImage && (
        <ImageInpaintModal
          isOpen={isCorrectionOpen}
          onClose={() => setIsCorrectionOpen(false)}
          imageUrl={layersMap[selectedImage]?.originalUrl || selectedImage}
          initialLayers={layersMap[selectedImage]?.layers}
          postId={currentPostId || ""}
          userId={user?.uid || ""}
          fileName={"1"}
          initialText={insertTextOnImage ? selectedContent?.titulo : undefined}
          brandKitPrimaryColor={
            businessProfile?.brandKit?.primaryColor || businessProfile?.primaryColor
          }
          brandKitSecondaryColor={
            businessProfile?.brandKit?.secondaryColor || businessProfile?.secondaryColor
          }
          onSuccess={(newImageUrl, layers) => {
            const origUrl = layersMap[selectedImage]?.originalUrl || selectedImage;
            setLayersMap((prev) => ({
              ...prev,
              [newImageUrl]: {
                originalUrl: origUrl,
                layers: layers || [],
              },
            }));
            setSelectedImage(newImageUrl);
            // Atualiza também no array de geradas para consistência, se estiver lá
            if (generatedImages?.includes(selectedImage)) {
              const idx = generatedImages.indexOf(selectedImage);
              setGeneratedImages((prev) => {
                const updated = [...prev];
                updated[idx] = newImageUrl;
                return updated;
              });
            }
            setIsCorrectionOpen(false);
          }}
        />
      )}

      {/* Modal de Zoom da Imagem Selecionada */}
      <ImageZoomModal
        isOpen={isZoomOpen}
        onClose={() => setIsZoomOpen(false)}
        imageUrl={previewImageUrl || selectedImage}
        title="Preview da Imagem Selecionada"
      />
    </motion.div>
  );
};
