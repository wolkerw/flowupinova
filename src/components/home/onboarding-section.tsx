"use client";

import React from "react";
import { motion } from "framer-motion";
import { Search, Palette, Pencil, ArrowUpRight } from "lucide-react";
import Link from "next/link";

const FadeInView = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.7, ease: "easeOut", delay }}
    className="h-full"
  >
    {children}
  </motion.div>
);

export const OnboardingSection = () => {
  return (
    <section className="py-24 bg-[#F9F6F0] relative overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        
        {/* Header */}
        <FadeInView>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-emerald-200 text-emerald-800 text-xs font-bold tracking-wide mb-6 uppercase">
              Onboarding Inteligente
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight">
              A IA aprende sobre você <span className="italic text-orange-500 font-serif font-light">antes</span><br className="hidden md:block"/> de começar.
            </h2>
            <p className="text-lg text-slate-600 font-medium">
              Escolha o formato ideal para o seu ritmo. Em minutos, seu negócio já está pronto para publicar.
            </p>
          </div>
        </FadeInView>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          
          {/* Card 1: Via Site Inteligente */}
          <FadeInView delay={0.1}>
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm h-full flex flex-col group hover:-translate-y-1 transition-transform duration-300">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
                  <Search className="w-6 h-6" />
                </div>
                <div className="bg-emerald-200 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
                  RECOMENDADO
                </div>
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 mb-4">Via Site Inteligente</h3>
              <p className="text-slate-500 mb-8 flex-1 leading-relaxed">
                Envie a URL do seu site — a IA extrai seu tom, cores, produtos e serviços em segundos.
              </p>
              <Link href="/acesso/cadastro" className="inline-flex items-center text-slate-900 font-bold hover:text-orange-500 transition-colors">
                Começar por aqui <ArrowUpRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </FadeInView>

          {/* Card 2: Via BrandKit (Dark) */}
          <FadeInView delay={0.2}>
            <div className="bg-[#111625] p-8 rounded-3xl border border-slate-800 shadow-xl h-full flex flex-col relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
              {/* Subtle orange glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-[80px] pointer-events-none" />
              
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
                  <Palette className="w-6 h-6" />
                </div>
                <div className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg shadow-orange-500/20">
                  MAIS PRECISO
                </div>
              </div>
              <h3 className="text-2xl font-extrabold text-white mb-4 relative z-10">Via BrandKit</h3>
              <p className="text-slate-300 mb-8 flex-1 leading-relaxed relative z-10">
                Envie sua identidade visual, paleta, fontes e tom de voz. A IA se calibra 100% ao seu jeito.
              </p>
              <Link href="/acesso/cadastro" className="inline-flex items-center text-white font-bold hover:text-orange-400 transition-colors relative z-10">
                Começar por aqui <ArrowUpRight className="w-4 h-4 ml-1 text-slate-400 group-hover:text-orange-400 transition-colors" />
              </Link>
            </div>
          </FadeInView>

          {/* Card 3: Manual Express */}
          <FadeInView delay={0.3}>
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm h-full flex flex-col group hover:-translate-y-1 transition-transform duration-300">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
                  <Pencil className="w-6 h-6" />
                </div>
                <div className="bg-emerald-200 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
                  RÁPIDO
                </div>
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 mb-4">Manual Express</h3>
              <p className="text-slate-500 mb-8 flex-1 leading-relaxed">
                Preencha um mini formulário de 2 minutos e comece a gerar conteúdo agora mesmo.
              </p>
              <Link href="/acesso/cadastro" className="inline-flex items-center text-slate-900 font-bold hover:text-orange-500 transition-colors">
                Começar por aqui <ArrowUpRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </FadeInView>

        </div>
      </div>
    </section>
  );
};
