"use client";

import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import getCroppedImg from "@/lib/crop-image";
import { Loader2, ZoomIn, ZoomOut } from "lucide-react";

interface ImageCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedFile: File) => void;
}

export function ImageCropperModal({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete,
}: ImageCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropCompleteHandler = useCallback(
    (_croppedArea: any, croppedAreaPixels: any) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleSave = async () => {
    try {
      setIsProcessing(true);
      const croppedImageFile = await getCroppedImg(imageSrc, croppedAreaPixels, 0);
      
      if (croppedImageFile) {
        onCropComplete(croppedImageFile);
        onClose();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Recortar Símbolo da Logomarca</DialogTitle>
          <DialogDescription>
            Ajuste a imagem para focar apenas no símbolo da sua empresa. Isso será usado como o Avatar.
          </DialogDescription>
        </DialogHeader>

        <div className="relative w-full h-[300px] sm:h-[400px] bg-slate-900 rounded-lg overflow-hidden my-4">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1} // 1:1 aspect ratio for avatars
            cropShape="round" // Round shape for avatars
            showGrid={false}
            restrictPosition={false} // Allows dragging the image freely
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteHandler}
            onZoomChange={onZoomChange}
          />
        </div>

        <div className="flex items-center gap-4 px-4 py-2">
          <ZoomOut className="w-5 h-5 text-muted-foreground" />
          <Slider
            value={[zoom]}
            min={1}
            max={3}
            step={0.1}
            onValueChange={(value) => setZoom(value[0])}
            className="flex-1"
          />
          <ZoomIn className="w-5 h-5 text-muted-foreground" />
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isProcessing} className="bg-[#0083C7] hover:bg-[#006ca3]">
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar e Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
