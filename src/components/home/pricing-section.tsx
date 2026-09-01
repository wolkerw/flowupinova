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
            <p className="text-xl text-slate-600">
              Escolha o plano ideal para o seu negócio. Teste de graça por 7 dias.
            </p>
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
              <p className="mb-8 text-xs text-slate-400 opacity-0">Espaçamento</p>

              <ul className="mb-8 flex-1 space-y-3 text-sm">
                <li className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                  <span>Posts ilimitados com IA</span>
                </li>
                <li className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                  <span>Editor de Textos Avançado</span>
                </li>
                <li className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                  <span>Agendamento automático</span>
                </li>
                <li className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                  <span>Integração Google Meu Negócio</span>
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
              <p className="mb-8 text-xs text-slate-400">Cobrado R$ 1.323 a cada 3 meses</p>

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
              <p className="mb-8 text-xs text-slate-400">Cobrado R$ 2.499 a cada 6 meses</p>

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
                  R$ 369<span className="text-xl">,23</span>
                </span>
                <span className="ml-1 text-sm text-slate-400">/mês</span>
              </div>
              <p className="mb-8 text-xs text-slate-400">Cobrado R$ 4.800 por 13 meses</p>

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
                <li className="flex items-start gap-2 text-slate-300">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-orange-500" />
                  <span>Geração de Imagens Prioritária</span>
                </li>
                <li className="flex items-start gap-2 text-slate-300">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-orange-500" />
                  <span>Suporte VIP WhatsApp</span>
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
                <Link href="/acesso/cadastro">Criar Conta Gratuita</Link>
              </Button>
              <p className="mt-4 text-sm text-orange-100/80">
                7 dias de teste grátis. Não pedimos cartão.
              </p>
            </div>
          </div>
        </FadeInView>
      </div>
    </section>
  );
};
