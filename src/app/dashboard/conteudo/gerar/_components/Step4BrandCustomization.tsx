"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Edit, UploadCloud, Trash2, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoPosition } from "../types";

interface Step4BrandCustomizationProps {
  selectedImage: string;
  logoFile: File | null;
  logoPreviewUrl: string | null;
  logoPosition: LogoPosition;
  logoScale: number;
  logoOpacity: number;
  onLogoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onLogoRemove: () => void;
  onPositionChange: (pos: LogoPosition) => void;
  onScaleChange: (value: number) => void;
  onOpacityChange: (value: number) => void;
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
  onLogoUpload,
  onLogoRemove,
  onPositionChange,
  onScaleChange,
  onOpacityChange,
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

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
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
                  <Label className="text-sm">Posição</Label>
                  <RadioGroup value={logoPosition} onValueChange={(v) => onPositionChange(v as LogoPosition)} className="grid grid-cols-3 gap-2 mt-2">
                    {positions.map(pos => (
                      <div key={pos}>
                        <RadioGroupItem value={pos} id={pos} className="sr-only peer" />
                        <Label htmlFor={pos} className="flex items-center justify-center text-xs rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer peer-data-[state=checked]:border-primary capitalize">
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
        <div className="flex flex-col items-center justify-start h-full group">
          <div className="sticky top-24 w-full">
            <div className="w-full max-w-sm">
              <div className="relative aspect-square bg-gray-200 rounded-lg shadow-md border overflow-hidden">
                <Image src={selectedImage} layout="fill" objectFit="cover" alt="Imagem selecionada" unoptimized />
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
              </div>
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
