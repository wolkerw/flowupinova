"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

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

export const PricingSection = () => {
  return (
    <section id="planos" className="relative overflow-hidden bg-slate-50 py-24 scroll-mt-20">
      <div className="container mx-auto px-4 lg:px-8">
        <FadeInView>
          <div className="mx-auto mb-20 max-w-3xl text-center">
            <h2 className="mb-6 text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
              O que falta para você acelerar?
            </h2>
            <div className="flex flex-col items-center gap-3">
              <p className="text-xl text-slate-600">
                <strong className="rounded-md bg-orange-100 px-2.5 py-1 font-extrabold uppercase text-orange-600 shadow-sm ring-1 ring-orange-200">
                  Garantia Risco Zero de 7 Dias
                </strong>
                !
              </p>
              <div className="flex max-w-xl items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 shadow-sm">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 shrink-0">
                  <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>
                  Teste à vontade! Se não gostar, cancele na hora com 1 e-mail, <strong>sem burocracia</strong>, e receba o seu dinheiro de volta.
                </span>
              </div>
            </div>
          </div>
        </FadeInView>

        <div className="mx-auto grid max-w-7xl items-stretch gap-6 md:grid-cols-2 xl:grid-cols-4">
          {/* Mensal */}
          <FadeInView delay={0.1}>
            <div className="relative flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h3 className="mb-2 text-xl font-bold text-slate-900">Mensal</h3>
              <p className="mb-6 h-10 text-sm text-slate-500">
                Flexibilidade total, cancele quando quiser.
              </p>

              <div className="mb-2 flex items-baseline">
                <span className="text-4xl font-extrabold text-slate-900">R$ 490</span>
                <span className="ml-1 text-sm text-slate-500">/mês</span>
              </div>
              <p className="mb-2 text-xs text-slate-400">Cobrança mensal</p>
              <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-[11px] leading-snug text-slate-600">
                Cobrado na modalidade <strong>"Assinatura Mensal Recorrente"</strong>, sendo assim não incide no valor total no limite do cartão de crédito.
              </div>

              <ul className="mb-8 flex-1 space-y-3 text-sm">
                <li className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                  <span>Gerenciador de Anúncios</span>
                </li>
                <li className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                  <span>Relatórios de Alcance dos posts</span>
                </li>
                <li className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                  <span>Galeria de Publicações</span>
                </li>
                <li className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                  <span>Foto Profissional com IA</span>
                </li>
                <li className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                  <span>Onboarding Inteligente com IA</span>
                </li>
                <li className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                  <span>Publicações num clique em Instagram, Facebook e Google Meu Negócio</span>
                </li>
                <li className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                  <span>Geração de Imagens Ilimitada</span>
                </li>
                <li className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                  <span>Suporte para Integração e Implementação gratuitos</span>
                </li>
              </ul>

              <Button
                asChild
                variant="outline"
                className="h-12 w-full rounded-full border-slate-300 transition-transform hover:scale-[1.02] hover:bg-slate-50"
              >
                <Link href="/acesso/cadastro">Começar Mensal</Link>
              </Button>
            </div>
          </FadeInView>

          {/* Trimestral */}
          <FadeInView delay={0.15}>
            <div className="relative flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-orange-100 px-3 py-1 text-[10px] font-bold text-orange-600 shadow-sm">
                10% OFF
              </div>
              <h3 className="mb-2 text-xl font-bold text-slate-900">Trimestral</h3>
              <p className="mb-6 h-10 text-sm text-slate-500">
                Plano de 3 meses para resultados consistentes.
              </p>

              <div className="mb-2 flex items-baseline">
                <span className="text-4xl font-extrabold text-slate-900">R$ 441</span>
                <span className="ml-1 text-sm text-slate-500">/mês</span>
              </div>
              <p className="mb-2 text-xs text-slate-400">Cobrado 3 x de R$ 441,00</p>
              <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-[11px] leading-snug text-slate-600">
                Cobrado na modalidade <strong>"Assinatura Mensal Recorrente"</strong>, sendo assim não incide no valor total no limite do cartão de crédito.
              </div>

              <ul className="mb-8 flex-1 space-y-3 text-sm">
                <li className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                  <span>Tudo do plano Mensal</span>
                </li>
              </ul>

              <Button
                asChild
                variant="outline"
                className="h-12 w-full rounded-full border-slate-300 transition-transform hover:scale-[1.02] hover:bg-slate-50"
              >
                <Link href="/acesso/cadastro">Começar Trimestral</Link>
              </Button>
            </div>
          </FadeInView>

          {/* Semestral */}
          <FadeInView delay={0.2}>
            <div className="relative flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-orange-100 px-3 py-1 text-[10px] font-bold text-orange-600 shadow-sm">
                15% OFF
              </div>
              <h3 className="mb-2 text-xl font-bold text-slate-900">Semestral</h3>
              <p className="mb-6 h-10 text-sm text-slate-500">
                Compromisso de 6 meses com ótimo desconto.
              </p>

              <div className="mb-2 flex items-baseline">
                <span className="text-4xl font-extrabold text-slate-900">
                  R$ 416<span className="text-xl">,50</span>
                </span>
                <span className="ml-1 text-sm text-slate-500">/mês</span>
              </div>
              <p className="mb-2 text-xs text-slate-400">Cobrado 6 x de R$ 416,50</p>
              <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-[11px] leading-snug text-slate-600">
                Cobrado na modalidade <strong>"Assinatura Mensal Recorrente"</strong>, sendo assim não incide no valor total no limite do cartão de crédito.
              </div>

              <ul className="mb-8 flex-1 space-y-3 text-sm">
                <li className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                  <span>Tudo do plano Mensal</span>
                </li>
              </ul>

              <Button
                asChild
                variant="outline"
                className="h-12 w-full rounded-full border-slate-300 transition-transform hover:scale-[1.02] hover:bg-slate-50"
              >
                <Link href="/acesso/cadastro">Começar Semestral</Link>
              </Button>
            </div>
          </FadeInView>

          {/* Anual (Destaque Lovable Style) */}
          <FadeInView delay={0.3}>
            <div className="relative z-10 flex h-full transform flex-col rounded-3xl border border-slate-700 bg-slate-900 p-8 shadow-2xl xl:-translate-y-4">
              {/* Glow Effect */}
              <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-orange-500/20 to-transparent" />

              <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-orange-500 to-orange-400 px-4 py-1.5 text-xs font-bold text-white shadow-lg">
                MAIS POPULAR - GANHE 1 MÊS
              </div>

              <h3 className="mb-2 text-xl font-bold text-white">Anual</h3>
              <p className="mb-6 h-10 text-sm text-slate-400">
                O melhor custo-benefício. Leve 13 meses!
              </p>

              <div className="mb-2 flex items-baseline">
                <span className="text-4xl font-extrabold text-white">
                  R$ 399<span className="text-xl">,00</span>
                </span>
                <span className="ml-1 text-sm text-slate-400">/mês</span>
              </div>
              <p className="text-xs text-slate-400">Cobrado 12 x de R$ 399,00</p>
              <p className="mt-1 mb-2 text-xs font-medium text-orange-400">
                Nesta modalidade o valor mensal fica R$ 368,30 considerando o bônus.
              </p>
              <div className="mb-6 rounded-xl border border-slate-700 bg-slate-800/90 p-2.5 text-[11px] leading-snug text-slate-300">
                Cobrado na modalidade <strong>"Assinatura Mensal Recorrente"</strong>, sendo assim não incide no valor total no limite do cartão de crédito.
              </div>

              <ul className="mb-8 flex-1 space-y-3 text-sm">
                <li className="flex items-start gap-2 text-slate-300">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-orange-500" />
                  <span>
                    <strong>Tudo do plano Mensal</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2 text-slate-300">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-orange-500" />
                  <span>1 Mês Grátis embutido</span>
                </li>
              </ul>

              <Button
                asChild
                className="h-12 w-full rounded-full bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-transform hover:scale-[1.02] hover:from-orange-600 hover:to-orange-500"
              >
                <Link href="/acesso/cadastro">Começar Anual</Link>
              </Button>
            </div>
          </FadeInView>
        </div>

        {/* Bottom CTA Banner */}
        <FadeInView delay={0.3}>
          <div className="relative mt-32 overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 to-orange-400 p-12 text-center shadow-xl">
            {/* Shapes decorativos */}
            <div className="absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-1/2 translate-y-1/2 rounded-full bg-black/10 blur-3xl" />

            <div className="relative z-10">
              <h2 className="mb-6 text-3xl font-extrabold text-white md:text-5xl">
                Pronto para colocar seu negócio no automático?
              </h2>
              <p className="mx-auto mb-10 max-w-2xl text-xl text-orange-100">
                Junte-se a dezenas de empreendedores que já estão economizando tempo e faturando
                mais com a IA.
              </p>
              <Button
                asChild
                size="lg"
                className="h-14 rounded-full bg-slate-900 px-10 text-lg text-white shadow-xl transition-transform hover:scale-105 hover:bg-slate-800"
              >
                <Link href="/acesso/cadastro">Criar Conta e Ganhar 1 Post</Link>
              </Button>
              <div className="mt-6 flex flex-col items-center gap-2">
                <p className="text-sm font-medium text-orange-100">
                  Garantia Incondicional de 7 Dias: se não gostar, devolvemos seu dinheiro sem burocracia.
                </p>
                <p className="text-xs text-orange-100/80">
                  Basta enviar um único e-mail solicitando o cancelamento. É simples e rápido.
                </p>
              </div>
            </div>
          </div>
        </FadeInView>
      </div>
    </section>
  );
};
