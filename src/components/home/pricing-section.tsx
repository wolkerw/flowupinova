"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

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

export const PricingSection = () => {
  return (
    <section id="planos" className="py-24 bg-slate-50 relative overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        
        <FadeInView>
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">O que falta para você acelerar?</h2>
            <p className="text-xl text-slate-600">
              Escolha o plano ideal para o seu negócio. Teste de graça por 7 dias.
            </p>
          </div>
        </FadeInView>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl mx-auto items-stretch">
          
          {/* Mensal */}
          <FadeInView delay={0.1}>
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative h-full flex flex-col">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Mensal</h3>
              <p className="text-slate-500 text-sm mb-6 h-10">Flexibilidade total, cancele quando quiser.</p>
              
              <div className="flex items-baseline mb-2">
                <span className="text-4xl font-extrabold text-slate-900">R$ 490</span>
                <span className="text-slate-500 ml-1 text-sm">/mês</span>
              </div>
              <p className="text-slate-400 text-xs mb-8 opacity-0">Espaçamento</p>
              
              <ul className="space-y-3 mb-8 flex-1 text-sm">
                <li className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  <span>Posts ilimitados com IA</span>
                </li>
                <li className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  <span>Editor de Textos Avançado</span>
                </li>
                <li className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  <span>Agendamento automático</span>
                </li>
                <li className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  <span>Integração Google Meu Negócio</span>
                </li>
              </ul>
              
              <Button asChild variant="outline" className="w-full rounded-full border-slate-300 h-12 hover:bg-slate-50 hover:scale-[1.02] transition-transform">
                <Link href="/acesso/cadastro">Começar Mensal</Link>
              </Button>
            </div>
          </FadeInView>

          {/* Trimestral */}
          <FadeInView delay={0.15}>
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative h-full flex flex-col">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-100 text-orange-600 text-[10px] font-bold px-3 py-1 rounded-full shadow-sm">
                10% OFF
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Trimestral</h3>
              <p className="text-slate-500 text-sm mb-6 h-10">Plano de 3 meses para resultados consistentes.</p>
              
              <div className="flex items-baseline mb-2">
                <span className="text-4xl font-extrabold text-slate-900">R$ 441</span>
                <span className="text-slate-500 ml-1 text-sm">/mês</span>
              </div>
              <p className="text-slate-400 text-xs mb-8">Cobrado R$ 1.323 a cada 3 meses</p>
              
              <ul className="space-y-3 mb-8 flex-1 text-sm">
                <li className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  <span>Tudo do plano Mensal</span>
                </li>
              </ul>
              
              <Button asChild variant="outline" className="w-full rounded-full border-slate-300 h-12 hover:bg-slate-50 hover:scale-[1.02] transition-transform">
                <Link href="/acesso/cadastro">Começar Trimestral</Link>
              </Button>
            </div>
          </FadeInView>

          {/* Semestral */}
          <FadeInView delay={0.2}>
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative h-full flex flex-col">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-100 text-orange-600 text-[10px] font-bold px-3 py-1 rounded-full shadow-sm">
                15% OFF
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Semestral</h3>
              <p className="text-slate-500 text-sm mb-6 h-10">Compromisso de 6 meses com ótimo desconto.</p>
              
              <div className="flex items-baseline mb-2">
                <span className="text-4xl font-extrabold text-slate-900">R$ 416<span className="text-xl">,50</span></span>
                <span className="text-slate-500 ml-1 text-sm">/mês</span>
              </div>
              <p className="text-slate-400 text-xs mb-8">Cobrado R$ 2.499 a cada 6 meses</p>
              
              <ul className="space-y-3 mb-8 flex-1 text-sm">
                <li className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  <span>Tudo do plano Mensal</span>
                </li>
              </ul>
              
              <Button asChild variant="outline" className="w-full rounded-full border-slate-300 h-12 hover:bg-slate-50 hover:scale-[1.02] transition-transform">
                <Link href="/acesso/cadastro">Começar Semestral</Link>
              </Button>
            </div>
          </FadeInView>

          {/* Anual (Destaque Lovable Style) */}
          <FadeInView delay={0.3}>
            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-700 shadow-2xl relative h-full flex flex-col transform xl:-translate-y-4 z-10">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-transparent rounded-3xl pointer-events-none" />
              
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-orange-400 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                MAIS POPULAR - GANHE 1 MÊS
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">Anual</h3>
              <p className="text-slate-400 text-sm mb-6 h-10">O melhor custo-benefício. Leve 13 meses!</p>
              
              <div className="flex items-baseline mb-2">
                <span className="text-4xl font-extrabold text-white">R$ 369<span className="text-xl">,23</span></span>
                <span className="text-slate-400 ml-1 text-sm">/mês</span>
              </div>
              <p className="text-slate-400 text-xs mb-8">Cobrado R$ 4.800 por 13 meses</p>
              
              <ul className="space-y-3 mb-8 flex-1 text-sm">
                <li className="flex items-start gap-2 text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0" />
                  <span><strong>Tudo do plano Mensal</strong></span>
                </li>
                <li className="flex items-start gap-2 text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0" />
                  <span>1 Mês Grátis embutido</span>
                </li>
                <li className="flex items-start gap-2 text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0" />
                  <span>Geração de Imagens Prioritária</span>
                </li>
                <li className="flex items-start gap-2 text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0" />
                  <span>Suporte VIP WhatsApp</span>
                </li>
              </ul>
              
              <Button asChild className="w-full rounded-full bg-gradient-to-r from-orange-500 to-orange-400 text-white h-12 hover:from-orange-600 hover:to-orange-500 hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(249,115,22,0.4)]">
                <Link href="/acesso/cadastro">Começar Anual</Link>
              </Button>
            </div>
          </FadeInView>

        </div>

        {/* Bottom CTA Banner */}
        <FadeInView delay={0.3}>
          <div className="mt-32 bg-gradient-to-r from-orange-500 to-orange-400 rounded-3xl p-12 text-center shadow-xl relative overflow-hidden">
            {/* Shapes decorativos */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6">Pronto para colocar seu negócio no automático?</h2>
              <p className="text-orange-100 text-xl max-w-2xl mx-auto mb-10">
                Junte-se a dezenas de empreendedores que já estão economizando tempo e faturando mais com a IA.
              </p>
              <Button asChild size="lg" className="bg-slate-900 text-white hover:bg-slate-800 rounded-full h-14 px-10 text-lg hover:scale-105 transition-transform shadow-xl">
                <Link href="/acesso/cadastro">Criar Conta Gratuita</Link>
              </Button>
              <p className="text-orange-100/80 text-sm mt-4">7 dias de teste grátis. Não pedimos cartão.</p>
            </div>
          </div>
        </FadeInView>

      </div>
    </section>
  );
};
