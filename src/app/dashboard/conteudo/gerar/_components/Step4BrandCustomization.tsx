"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Edit, UploadCloud, Trash2, ArrowLeft, ArrowRight, Loader2, MessageSquare, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoPosition } from "../types";

import { useWizard } from "../context/WizardContext";

export const Step4BrandCustomization = () => {
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
    showTextOverlay,
    setShowTextOverlay: onTextToggle,
    textPosition,
    setTextPosition: onTextPositionChange,
    textScale,
    setTextScale: onTextScaleChange,
    textColor,
    setTextColor: onTextColorChange,
    fontFamily,
    setFontFamily: onFontFamilyChange,
    fontWeight,
    setFontWeight: onFontWeightChange,
    isItalic,
    setIsItalic: onItalicToggle,
  } = useWizard();

  const onBack = () => setStep(3);
  const onLogoRemove = () => {
    setLogoFile(null);
    setLogoPreviewUrl(null);
  };
  const selectedTitle = selectedContent?.título || "";
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
              <p className="text-sm text-gray-600">Adicione sua logomarca e o título à imagem selecionada.</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Section */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Sua Logomarca</Label>
                {!logoPreviewUrl ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Anexar Logomarca
                  </Button>
                ) : (
                  <div className="space-y-4">
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
                          {logoFile?.name}
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
                            <RadioGroupItem value={pos} id={`logo-${pos}`} className="peer sr-only" />
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
                        <Label htmlFor="logo-scale" className="text-sm">Tamanho ({logoScale}%)</Label>
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
                        <Label htmlFor="logo-opacity" className="text-sm">Opacidade ({logoOpacity}%)</Label>
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

              {/* Text Section */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-500" />
                    <Label className="text-base font-semibold">Texto na Imagem</Label>
                  </div>
                  <Button
                    variant={showTextOverlay ? "default" : "outline"}
                    size="sm"
                    onClick={() => onTextToggle(!showTextOverlay)}
                  >
                    {showTextOverlay ? "Ativado" : "Desativado"}
                  </Button>
                </div>
                
                {showTextOverlay && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <Label className="text-sm">Posição do Texto</Label>
                      <RadioGroup
                        value={textPosition}
                        onValueChange={(v) => onTextPositionChange(v as LogoPosition)}
                        className="mt-2 grid grid-cols-3 gap-2"
                      >
                        {positions.map((pos) => (
                          <div key={`text-${pos}`}>
                            <RadioGroupItem value={pos} id={`text-${pos}`} className="peer sr-only" />
                            <Label
                              htmlFor={`text-${pos}`}
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
                        <Label className="text-sm">Tamanho Texto</Label>
                        <Slider
                          min={50}
                          max={200}
                          step={1}
                          value={[textScale]}
                          onValueChange={([v]) => onTextScaleChange(v)}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Fonte</Label>
                        <select
                          value={fontFamily}
                          onChange={(e) => onFontFamilyChange(e.target.value)}
                          className="mt-2 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                        >
                          <option value="Inter">Padrão (Inter)</option>
                          <option value="'Montserrat', sans-serif">Moderna (Montserrat)</option>
                          <option value="'Bebas Neue', cursive">Impacto (Bebas Neue)</option>
                          <option value="'Playfair Display', serif">Elegante (Playfair)</option>
                          <option value="'Roboto', sans-serif">Limpa (Roboto)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm">Peso e Estilo</Label>
                        <div className="mt-2 flex gap-2">
                          <Button
                            variant={fontWeight === "bold" ? "default" : "outline"}
                            size="sm"
                            className="flex-1 font-bold"
                            onClick={() => onFontWeightChange(fontWeight === "bold" ? "normal" : "bold")}
                          >
                            B
                          </Button>
                          <Button
                            variant={isItalic ? "default" : "outline"}
                            size="sm"
                            className="flex-1 italic"
                            onClick={() => onItalicToggle(!isItalic)}
                          >
                            I
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm">Cor do Texto</Label>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {["#FFFFFF", "#000000", "#FFD700", "#3B82F6", "#EF4444", "#10B981"].map((c) => (
                            <button
                              key={c}
                              onClick={() => onTextColorChange(c)}
                              className={cn(
                                "h-6 w-6 rounded-full border border-gray-300 transition-transform hover:scale-110",
                                textColor === c && "ring-2 ring-primary ring-offset-2"
                              )}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
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
              <div className="relative aspect-square overflow-hidden rounded-lg border bg-gray-200 shadow-md flex items-center justify-center">
                {isGeneratingImages && !selectedImage ? (
                  <div className="flex flex-col items-center gap-4 text-gray-500 p-8 text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <div>
                      <p className="font-bold">Gerando sua arte...</p>
                      <p className="text-xs">Isso pode levar alguns segundos.</p>
                    </div>
                  </div>
                ) : selectedImage ? (
                  <>
                    <Image
                      src={selectedImage}
                      layout="fill"
                      objectFit="cover"
                      alt="Imagem selecionada"
                      unoptimized
                    />

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

                    {/* Text Overlay Preview */}
                    {showTextOverlay && selectedTitle && (
                      <div
                        className={cn("absolute z-20 px-4 w-full flex pointer-events-none", {
                          "top-4 items-start justify-start": textPosition === "top-left",
                          "top-4 items-start justify-center text-center": textPosition === "top-center",
                          "top-4 items-start justify-end text-right": textPosition === "top-right",
                          "top-1/2 -translate-y-1/2 items-center justify-start": textPosition === "left-center",
                          "top-1/2 -translate-y-1/2 items-center justify-center text-center": textPosition === "center",
                          "top-1/2 -translate-y-1/2 items-center justify-end text-right": textPosition === "right-center",
                          "bottom-4 items-end justify-start": textPosition === "bottom-left",
                          "bottom-4 items-end justify-center text-center": textPosition === "bottom-center",
                          "bottom-4 items-end justify-end text-right": textPosition === "bottom-right",
                        })}
                      >
                        <span 
                          className={cn("leading-tight break-words max-w-full drop-shadow-lg uppercase transition-all", {
                            "font-bold": fontWeight === "bold",
                            "italic": isItalic
                          })}
                          style={{ 
                            fontSize: `${(textScale / 100) * 1.5}rem`,
                            color: textColor,
                            fontFamily: fontFamily
                          }}
                        >
                          {selectedTitle}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-gray-400 p-8 text-center">
                    <p>Nenhuma imagem gerada.</p>
                  </div>
                )}
              </div>
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
    </motion.div>
  );
};
