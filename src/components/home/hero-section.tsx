"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, PlayCircle, Sparkles, CheckCircle2, X } from "lucide-react";
import { TypingAnimation } from "./animated-flows";

// URL do vídeo de demonstração — troque pela variável de ambiente NEXT_PUBLIC_DEMO_VIDEO_URL
// ou substitua o valor abaixo pelo ID do vídeo do YouTube
const DEMO_VIDEO_URL =
  process.env.NEXT_PUBLIC_DEMO_VIDEO_URL ||
  "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0&modestbranding=1";

function VideoLightbox({ onClose }: { onClose: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Fechar com ESC
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    // Bloquear scroll do body ao abrir
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={overlayRef}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={handleOverlayClick}
        role="dialog"
        aria-modal="true"
        aria-label="Vídeo de demonstração"
      >
        <motion.div
          className="relative w-full max-w-4xl"
          initial={{ scale: 0.9, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 30 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* Botão fechar */}
          <button
            onClick={onClose}
            className="absolute -top-12 right-0 flex items-center gap-2 text-sm text-white/80 transition-colors hover:text-white focus:outline-none"
            aria-label="Fechar vídeo"
          >
            <X className="h-5 w-5" />
            <span>Fechar (ESC)</span>
          </button>

          {/* Container responsivo 16:9 */}
          <div className="relative w-full overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10" style={{ paddingBottom: "56.25%" }}>
            <iframe
              className="absolute inset-0 h-full w-full"
              src={DEMO_VIDEO_URL}
              title="Demonstração NumVapt"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>

          {/* Texto abaixo do vídeo */}
          <p className="mt-4 text-center text-sm text-white/60">
            Veja como é simples criar posts profissionais com IA em minutos.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export const HeroSection = () => {
  const [showVideo, setShowVideo] = useState(false);

  return (
    <>
      <section className="relative flex min-h-[90vh] items-center overflow-hidden bg-slate-50 pb-20 pt-32 md:pb-32 md:pt-48">
        {/* Elementos de background estilo Lovable (Gradients suaves) */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-orange-200/40 via-blue-200/20 to-purple-200/40 opacity-60 blur-3xl" />

        <div className="container relative z-10 mx-auto px-4 lg:px-8">
          <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-20">
            {/* Text Content */}
            <motion.div
              className="flex-1 space-y-8 text-center lg:text-left"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              {/* Badge */}
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-600 shadow-sm">
                <div className="h-2 w-2 rounded-full bg-orange-500" />
                <span>Marketing com IA para o seu negócio</span>
              </div>

              {/* Título */}
              <h1 className="mb-6 flex flex-col items-center text-5xl font-extrabold leading-[1.1] tracking-tight text-slate-900 md:text-6xl lg:items-start lg:text-7xl">
                <span className="max-w-[15ch]">
                  O marketing da{" "}
                  <span className="relative inline-block">
                    sua empresa,
                    <span className="absolute -bottom-1 left-0 h-1.5 w-full -rotate-1 rounded-full bg-orange-300 opacity-80"></span>
                  </span>{" "}
                  feito <span className="font-serif font-light italic text-orange-500">por você</span>{" "}
                  mesmo em minutos.
                </span>
              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 sm:text-xl">
                A Plataforma intuitiva que cria seus posts, agenda publicações e atualiza sua vitrine
                digital enquanto você foca no seu trabalho.
              </p>

              <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row lg:justify-start">
                <Button
                  asChild
                  size="lg"
                  className="shadow-soft h-14 w-full rounded-full bg-[#0083C7] px-8 text-lg text-white transition-transform duration-300 hover:scale-105 hover:bg-[#006ca3] sm:w-auto"
                >
                  <Link href="/acesso/cadastro">Comece Gratuitamente</Link>
                </Button>

                {/* Botão Ver Demonstração — abre lightbox */}
                <Button
                  variant="outline"
                  size="lg"
                  id="btn-ver-demonstracao"
                  onClick={() => setShowVideo(true)}
                  className="group relative h-14 w-full overflow-hidden rounded-full border-[#FA6305] px-8 text-lg text-[#FA6305] transition-all duration-300 hover:scale-105 hover:bg-orange-50 hover:text-[#FA6305] sm:w-auto"
                >
                  <PlayCircle className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                  Ver demonstração
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-4 text-sm font-medium text-slate-600 lg:justify-start">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> Uso intuitivo
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> Imagens ilimitadas
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> Suporte Real
                </span>
              </div>
            </motion.div>

            {/* Logotipo Flutuante */}
            <motion.div
              className="relative flex w-full max-w-lg flex-1 items-center justify-center lg:max-w-none"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {/* Play overlay clicável sobre a imagem */}
              <div className="group relative cursor-pointer" onClick={() => setShowVideo(true)}>
                <motion.img
                  src="/1.png"
                  alt="Marca NumVapt"
                  className="w-full max-w-md object-contain drop-shadow-2xl transition-transform duration-300 group-hover:scale-[1.02]"
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                />
                {/* Play button flutuante sobre a imagem */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/90 shadow-2xl ring-4 ring-white/50 backdrop-blur-sm">
                    <PlayCircle className="h-10 w-10 text-[#FA6305]" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Lightbox de Vídeo */}
      {showVideo && <VideoLightbox onClose={() => setShowVideo(false)} />}
    </>
  );
};
