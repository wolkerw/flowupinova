"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCcw, Download, X, Maximize2 } from "lucide-react";

interface ImageZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  title?: string;
  onDownload?: (url: string) => void;
}

export function ImageZoomModal({
  isOpen,
  onClose,
  imageUrl,
  title = "Visualização da Imagem",
  onDownload,
}: ImageZoomModalProps) {
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Reset zoom & position when modal opens or image changes
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, imageUrl]);

  if (!imageUrl) return null;

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.3, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const nextScale = Math.max(prev - 0.3, 1);
      if (nextScale === 1) setPosition({ x: 0, y: 0 });
      return nextScale;
    });
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ eX: e.clientX - position.x, eY: e.clientY - position.y } as any);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    setPosition({
      x: e.clientX - (dragStart as any).eX,
      y: e.clientY - (dragStart as any).eY,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDownloadClick = () => {
    if (onDownload && imageUrl) {
      onDownload(imageUrl);
    } else if (imageUrl) {
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = `imagem_gerada_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[95vh] h-[90vh] p-0 border-none bg-slate-950/95 text-white overflow-hidden shadow-2xl rounded-2xl flex flex-col backdrop-blur-xl">
        {/* Header / Barra de Ferramentas Superior */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/60 z-20">
          <div className="flex items-center gap-2">
            <Maximize2 className="h-5 w-5 text-accent" />
            <DialogTitle className="text-base font-semibold text-slate-100">
              {title}
            </DialogTitle>
            <span className="text-xs font-mono text-slate-400 ml-2 bg-slate-800/60 px-2 py-0.5 rounded-md">
              {Math.round(scale * 100)}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Controles de Zoom */}
            <div className="flex items-center bg-slate-800/80 rounded-lg p-1 border border-slate-700/60 gap-1 mr-2">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={handleZoomOut}
                disabled={scale <= 1}
                title="Diminuir Zoom"
                className="h-7 w-7 text-slate-300 hover:text-white hover:bg-slate-700/60"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={handleReset}
                disabled={scale === 1}
                title="Resetar Zoom"
                className="h-7 w-7 text-slate-300 hover:text-white hover:bg-slate-700/60"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={handleZoomIn}
                disabled={scale >= 3}
                title="Aumentar Zoom"
                className="h-7 w-7 text-slate-300 hover:text-white hover:bg-slate-700/60"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            {/* Download */}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleDownloadClick}
              className="h-8 gap-1.5 border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-700 hover:text-white text-xs font-medium"
            >
              <Download className="h-3.5 w-3.5" />
              Baixar
            </Button>

            {/* Fechar */}
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Área Central da Imagem com Zoom/Pan */}
        <div
          className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing select-none p-4"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            className="transition-transform duration-100 ease-out flex items-center justify-center max-w-full max-h-full"
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default",
            }}
          >
            <img
              src={imageUrl}
              alt={title}
              className="max-w-[80vw] max-h-[75vh] object-contain rounded-lg shadow-2xl pointer-events-none"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
