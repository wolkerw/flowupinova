"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Edit, UploadCloud, Trash2, ArrowLeft, ArrowRight, Loader2, Type, Plus, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoPosition, TextOverlay } from "../types";

interface Step4BrandCustomizationProps {
  selectedImage: string;
  logoFile: File | null;
  logoPreviewUrl: string | null;
  logoPosition: LogoPosition;
  logoScale: number;
  logoOpacity: number;
  overlayTexts: TextOverlay[];
  onLogoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onLogoRemove: () => void;
  onPositionChange: (pos: LogoPosition) => void;
  onScaleChange: (value: number) => void;
  onOpacityChange: (value: number) => void;
  onOverlayTextsChange: (texts: TextOverlay[]) => void;
  onBack: () => void;
  onNext: () => void;
  isUploading: boolean;
  visualLogoScale: number;
  logoInputRef: React.RefObject<HTMLInputElement>;
}

export const Step4BrandCustomization = ({
  selectedImage,
  logoFile,
  logoPreviewUrl,
  logoPosition,
  logoScale,
  logoOpacity,
  overlayTexts,
  onLogoUpload,
  onLogoRemove,
  onPositionChange,
  onScaleChange,
  onOpacityChange,
  onOverlayTextsChange,
  onBack,
  onNext,
  isUploading,
  visualLogoScale,
  logoInputRef
}: Step4BrandCustomizationProps) => {
  const positions: LogoPosition[] = [
    'top-left', 'top-center', 'top-right', 
    'left-center', 'center', 'right-center', 
    'bottom-left', 'bottom-center', 'bottom-right'
  ];

  const handleAddText = () => {
    const newText: TextOverlay = {
      id: crypto.randomUUID(),
      text: "R$ 0,00",
      position: 'bottom-left',
      color: '#FFFFFF',
      size: 24,
    };
    onOverlayTextsChange([...overlayTexts, newText]);
  };

  const handleRemoveText = (id: string) => {
    onOverlayTextsChange(overlayTexts.filter(t => t.id !== id));
  };

  const handleUpdateText = (id: string, updates: Partial<TextOverlay>) => {
    onOverlayTextsChange(overlayTexts.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const getPositionClasses = (pos: LogoPosition) => {
    switch (pos) {
      case 'top-left': return 'top-4 left-4 text-left';
      case 'top-center': return 'top-4 left-1/2 -translate-x-1/2 text-center';
      case 'top-right': return 'top-4 right-4 text-right';
      case 'left-center': return 'top-1/2 left-4 -translate-y-1/2 text-left';
      case 'center': return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center';
      case 'right-center': return 'top-1/2 right-4 -translate-y-1/2 text-right';
      case 'bottom-left': return 'bottom-4 left-4 text-left';
      case 'bottom-center': return 'bottom-4 left-1/2 -translate-x-1/2 text-center';
      case 'bottom-right': return 'bottom-4 right-4 text-right';
      default: return '';
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <Card className="shadow-lg border-none">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Edit className="w-5 h-5"/>Personalize com sua Marca</CardTitle>
              <p className="text-sm text-gray-600">Adicione sua logomarca à imagem selecionada.</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {!logoPreviewUrl ? (
                <Button variant="outline" className="w-full" onClick={() => logoInputRef.current?.click()}>
                  <UploadCloud className="w-4 h-4 mr-2"/>Anexar Logomarca
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-2 border rounded-lg bg-gray-50">
                    <div className="flex items-center gap-2">
                      <Image src={logoPreviewUrl} alt="Preview da logomarca" width={40} height={40} className="object-contain rounded" />
                      <span className="text-sm text-gray-600 truncate max-w-[150px]">{logoFile?.name}</span>
                    </div>
                    <Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-100" onClick={onLogoRemove}>
                      <Trash2 className="w-4 h-4"/>
                    </Button>
                  </div>
                  <div>
                    <Label className="text-sm">Posição da Logo</Label>
                    <RadioGroup value={logoPosition} onValueChange={(v) => onPositionChange(v as LogoPosition)} className="grid grid-cols-3 gap-2 mt-2">
                      {positions.map(pos => (
                        <div key={pos}>
                          <RadioGroupItem value={pos} id={`logo-${pos}`} className="sr-only peer" />
                          <Label htmlFor={`logo-${pos}`} className="flex items-center justify-center text-xs rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer peer-data-[state=checked]:border-primary capitalize">
                            {pos.replace('-', ' ')}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  <div>
                    <Label htmlFor="logo-scale" className="text-sm">Tamanho ({logoScale}%)</Label>
                    <Slider id="logo-scale" min={10} max={100} step={1} value={[logoScale]} onValueChange={([v]) => onScaleChange(v)} />
                  </div>
                  <div>
                    <Label htmlFor="logo-opacity" className="text-sm">Opacidade ({logoOpacity}%)</Label>
                    <Slider id="logo-opacity" min={10} max={100} step={5} value={[logoOpacity]} onValueChange={([v]) => onOpacityChange(v)} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div className="space-y-1">
                <CardTitle className="text-lg flex items-center gap-2"><Type className="w-5 h-5"/>Textos na Imagem</CardTitle>
                <p className="text-sm text-gray-600">Adicione preços ou informações importantes.</p>
              </div>
              <Button size="sm" variant="outline" onClick={handleAddText} className="shrink-0">
                <Plus className="w-4 h-4 mr-1" /> Add Texto
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <AnimatePresence>
                {overlayTexts.map((item, index) => (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 border rounded-lg space-y-4 bg-gray-50/50"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <Label className="text-xs mb-1 block">Conteúdo do Texto</Label>
                        <Input 
                          value={item.text} 
                          onChange={(e) => handleUpdateText(item.id, { text: e.target.value })}
                          placeholder="Ex: R$ 99,90"
                          className="h-8 text-sm"
                        />
                      </div>
                      <Button size="icon" variant="ghost" className="text-red-500 mt-5" onClick={() => handleRemoveText(item.id)}>
                        <Trash2 className="w-4 h-4"/>
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs mb-1 block">Tamanho ({item.size}px)</Label>
                        <Slider min={12} max={72} step={1} value={[item.size]} onValueChange={([v]) => handleUpdateText(item.id, { size: v })} />
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">Cor</Label>
                        <div className="flex gap-2">
                          <button 
                            className={cn("w-6 h-6 rounded-full border bg-white", item.color === '#FFFFFF' && "ring-2 ring-primary ring-offset-1")} 
                            onClick={() => handleUpdateText(item.id, { color: '#FFFFFF' })}
                          />
                          <button 
                            className={cn("w-6 h-6 rounded-full border bg-black", item.color === '#000000' && "ring-2 ring-primary ring-offset-1")} 
                            onClick={() => handleUpdateText(item.id, { color: '#000000' })}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs mb-1 block">Posição</Label>
                      <RadioGroup 
                        value={item.position} 
                        onValueChange={(v) => handleUpdateText(item.id, { position: v as LogoPosition })} 
                        className="grid grid-cols-3 gap-1 mt-1"
                      >
                        {positions.map(pos => (
                          <div key={pos}>
                            <RadioGroupItem value={pos} id={`text-${index}-${pos}`} className="sr-only peer" />
                            <Label htmlFor={`text-${index}-${pos}`} className="flex items-center justify-center text-[10px] py-1 border rounded hover:bg-accent cursor-pointer peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-white capitalize">
                              {pos.replace('-', ' ')}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {overlayTexts.length === 0 && (
                <div className="text-center py-6 border-2 border-dashed rounded-lg text-muted-foreground text-sm">
                  Nenhum texto adicionado.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col items-center justify-start h-full group">
          <div className="sticky top-24 w-full">
            <div className="w-full max-w-sm mx-auto">
              <div className="relative aspect-square bg-gray-200 rounded-lg shadow-md border overflow-hidden">
                <Image src={selectedImage} layout="fill" objectFit="cover" alt="Imagem selecionada" unoptimized />
                
                {/* Logo Overlay Preview */}
                {logoPreviewUrl && (
                  <div 
                    className={cn("absolute z-10", {
                      'top-4 left-4': logoPosition === 'top-left',
                      'top-4 left-1/2 -translate-x-1/2': logoPosition === 'top-center',
                      'top-4 right-4': logoPosition === 'top-right',
                      'top-1/2 left-4 -translate-y-1/2': logoPosition === 'left-center',
                      'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2': logoPosition === 'center',
                      'top-1/2 right-4 -translate-y-1/2': logoPosition === 'right-center',
                      'bottom-4 left-4': logoPosition === 'bottom-left',
                      'bottom-4 left-1/2 -translate-x-1/2': logoPosition === 'bottom-center',
                      'bottom-4 right-4': logoPosition === 'bottom-right',
                    })} 
                    style={{ width: `${visualLogoScale}%`, opacity: logoOpacity / 100 }}
                  >
                    <Image src={logoPreviewUrl} alt="Logomarca" width={500} height={500} className="h-auto w-full"/>
                  </div>
                )}

                {/* Text Overlays Preview */}
                {overlayTexts.map((overlay) => (
                  <div 
                    key={overlay.id}
                    className={cn("absolute z-20 px-2 pointer-events-none drop-shadow-md", getPositionClasses(overlay.position))}
                    style={{ 
                      color: overlay.color, 
                      fontSize: `${overlay.size / 4}%`, // Scaling for preview container
                      fontWeight: 'bold',
                      lineHeight: 1.2
                    }}
                  >
                    {overlay.text}
                  </div>
                ))}
              </div>
              <p className="text-center text-xs text-muted-foreground mt-4 italic">
                * A visualização é uma estimativa. O resultado final pode variar ligeiramente.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-between mt-8 max-w-4xl mx-auto">
        <Button variant="outline" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" />Voltar</Button>
        <Button onClick={onNext} disabled={isUploading} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
          {isUploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processando...</> : 'Revisar publicação'}
          {!isUploading && <ArrowRight className="w-4 h-4 ml-2" />}
        </Button>
      </div>
      <input type="file" ref={logoInputRef} onChange={onLogoUpload} accept="image/png, image/jpeg" className="hidden" />
    </motion.div>
  );
};
