"use client";

import React from "react";
import { ChevronLeft, ChevronRight, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface CarouselPreviewOverlayProps {
  currentSlide: number;
  totalSlides: number;
  onPrev: () => void;
  onNext: () => void;
}

/**
 * Controles sobrepostos (contador, seta anterior e próxima) para navegação de carrossel no preview.
 * Usa `z-30` para permanecer acima das camadas de imagem (`z-10`) e logo (`z-10`).
 */
export function CarouselPreviewOverlay({
  currentSlide,
  totalSlides,
  onPrev,
  onNext,
}: CarouselPreviewOverlayProps) {
  if (totalSlides <= 1) return null;

  return (
    <>
      <div
        data-testid="carousel-slide-counter"
        className="pointer-events-none absolute right-2 top-2 z-30 flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-xs font-medium text-white shadow"
      >
        <Copy className="h-3 w-3" />
        <span>
          {currentSlide + 1}/{totalSlides}
        </span>
      </div>
      {currentSlide > 0 && (
        <button
          type="button"
          aria-label="Slide anterior"
          onClick={onPrev}
          className="absolute left-2 top-1/2 z-30 -translate-y-1/2 cursor-pointer rounded-full bg-black/70 p-1.5 text-white shadow-md transition-colors hover:bg-black/90"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      {currentSlide < totalSlides - 1 && (
        <button
          type="button"
          aria-label="Próximo slide"
          onClick={onNext}
          className="absolute right-2 top-1/2 z-30 -translate-y-1/2 cursor-pointer rounded-full bg-black/70 p-1.5 text-white shadow-md transition-colors hover:bg-black/90"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </>
  );
}

interface CarouselPreviewDotsProps {
  totalSlides: number;
  currentSlide: number;
  onSelectSlide: (index: number) => void;
}

/**
 * Indicadores clicáveis de página para navegar diretamente para qualquer slide do carrossel.
 */
export function CarouselPreviewDots({
  totalSlides,
  currentSlide,
  onSelectSlide,
}: CarouselPreviewDotsProps) {
  if (totalSlides <= 1) return null;

  return (
    <div
      className="flex items-center gap-1"
      role="tablist"
      aria-label="Navegação de slides do carrossel"
    >
      {Array.from({ length: totalSlides }).map((_, idx) => (
        <button
          key={idx}
          type="button"
          aria-label={`Ir para slide ${idx + 1}`}
          aria-current={idx === currentSlide ? "true" : undefined}
          onClick={() => onSelectSlide(idx)}
          className={cn(
            "h-2 w-2 rounded-full transition-all",
            idx === currentSlide ? "scale-110 bg-[#0083C7]" : "bg-gray-300 hover:bg-gray-400"
          )}
        />
      ))}
    </div>
  );
}
