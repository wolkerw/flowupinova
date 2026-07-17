"use client";

import React from "react";
import { motion } from "framer-motion";
import { Search, Palette, Pencil, ArrowUpRight } from "lucide-react";
import Link from "next/link";

const FadeInView = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
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
    <section className="relative overflow-hidden bg-[#F9F6F0] py-24">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <FadeInView>
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center rounded-full bg-emerald-200 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-emerald-800">
              Onboarding Inteligente
            </div>
            <h2 className="mb-6 text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
              A IA aprende sobre você{" "}
              <span className="font-serif font-light italic text-orange-500">antes</span>
              <br className="hidden md:block" /> de começar.
            </h2>
            <p className="text-lg font-medium text-slate-600">
              Escolha o formato ideal para o seu ritmo. Em minutos, seu negócio já está pronto para
              publicar.
            </p>
          </div>
        </FadeInView>

        {/* Cards Grid */}
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {/* Card 1: Via Site Inteligente */}
          <FadeInView delay={0.1}>
            <div className="group flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-transform duration-300 hover:-translate-y-1">
              <div className="mb-6 flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-500">
                  <Search className="h-6 w-6" />
                </div>
                <div className="rounded-full bg-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800">
                  RECOMENDADO
                </div>
              </div>
              <h3 className="mb-4 text-2xl font-extrabold text-slate-900">Via Site Inteligente</h3>
              <p className="mb-8 flex-1 leading-relaxed text-slate-500">
                Envie a URL do seu site — a IA extrai seu tom, cores, produtos e serviços em
                segundos.
              </p>
              <Link
                href="/acesso/cadastro"
                className="inline-flex items-center font-bold text-slate-900 transition-colors hover:text-orange-500"
              >
                Começar por aqui <ArrowUpRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </FadeInView>

          {/* Card 2: Via BrandKit (Dark) */}
          <FadeInView delay={0.2}>
            <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-800 bg-[#111625] p-8 shadow-xl transition-transform duration-300 hover:-translate-y-1">
              {/* Subtle orange glow */}
              <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 bg-orange-500/10 blur-[80px]" />

              <div className="relative z-10 mb-6 flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg shadow-orange-500/30">
                  <Palette className="h-6 w-6" />
                </div>
                <div className="rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white shadow-lg shadow-orange-500/20">
                  MAIS PRECISO
                </div>
              </div>
              <h3 className="relative z-10 mb-4 text-2xl font-extrabold text-white">
                Via BrandKit
              </h3>
              <p className="relative z-10 mb-8 flex-1 leading-relaxed text-slate-300">
                Envie sua identidade visual, paleta, fontes e tom de voz. A IA se calibra 100% ao
                seu jeito.
              </p>
              <Link
                href="/acesso/cadastro"
                className="relative z-10 inline-flex items-center font-bold text-white transition-colors hover:text-orange-400"
              >
                Começar por aqui{" "}
                <ArrowUpRight className="ml-1 h-4 w-4 text-slate-400 transition-colors group-hover:text-orange-400" />
              </Link>
            </div>
          </FadeInView>

          {/* Card 3: Manual Express */}
          <FadeInView delay={0.3}>
            <div className="group flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-transform duration-300 hover:-translate-y-1">
              <div className="mb-6 flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-500">
                  <Pencil className="h-6 w-6" />
                </div>
                <div className="rounded-full bg-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800">
                  RÁPIDO
                </div>
              </div>
              <h3 className="mb-4 text-2xl font-extrabold text-slate-900">Manual Express</h3>
              <p className="mb-8 flex-1 leading-relaxed text-slate-500">
                Preencha um mini formulário de 2 minutos e comece a gerar conteúdo agora mesmo.
              </p>
              <Link
                href="/acesso/cadastro"
                className="inline-flex items-center font-bold text-slate-900 transition-colors hover:text-orange-500"
              >
                Começar por aqui <ArrowUpRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </FadeInView>
        </div>
      </div>
    </section>
  );
};
