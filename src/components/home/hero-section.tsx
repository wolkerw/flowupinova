"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Bot, PlayCircle, Sparkles, CheckCircle2 } from "lucide-react";
import { TypingAnimation } from "./animated-flows";

export const HeroSection = () => {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-slate-50 min-h-[90vh] flex items-center">
      {/* Elementos de background estilo Lovable (Gradients suaves) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-to-tr from-orange-200/40 via-blue-200/20 to-purple-200/40 blur-3xl rounded-full opacity-60 pointer-events-none" />

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          
          {/* Text Content */}
          <motion.div 
            className="flex-1 text-center lg:text-left space-y-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-slate-600 text-sm font-medium mb-2">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <span>Marketing com IA para o seu negócio</span>
            </div>

            {/* Título */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1] flex flex-col items-center lg:items-start mb-6">
              <span className="max-w-[15ch]">
                O marketing da <span className="relative inline-block">sua empresa,<span className="absolute -bottom-1 left-0 w-full h-1.5 bg-orange-300 rounded-full opacity-80 -rotate-1"></span></span> feito <span className="italic text-orange-500 font-serif font-light">por você</span> mesmo em minutos.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 sm:text-xl">
              A Plataforma intuitiva que cria seus posts, agenda publicações e atualiza sua vitrine digital enquanto você foca no seu trabalho.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <Button asChild size="lg" className="w-full sm:w-auto text-lg h-14 px-8 rounded-full bg-[#0083C7] text-white hover:bg-[#006ca3] hover:scale-105 transition-transform duration-300 shadow-soft">
                <Link href="/acesso/cadastro">
                  Comece Gratuitamente
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto text-lg h-14 px-8 rounded-full border-[#FA6305] text-[#FA6305] hover:bg-orange-50 hover:scale-105 transition-transform duration-300">
                <Link href="#como-funciona">
                  <PlayCircle className="w-5 h-5 mr-2" />
                  Ver demonstração
                </Link>
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4 text-sm text-slate-600 font-medium">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> Uso intuitivo</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> Imagens ilimitadas</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> Suporte Real</span>
            </div>
          </motion.div>

          {/* Logotipo Flutuante */}
          <motion.div 
            className="flex-1 w-full max-w-lg lg:max-w-none relative flex justify-center items-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.img 
              src="/1.png" 
              alt="Marca NumVapt"
              className="w-full max-w-md object-contain drop-shadow-2xl"
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
