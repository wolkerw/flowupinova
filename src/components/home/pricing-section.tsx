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

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto items-center">
          
          {/* Mensal */}
          <FadeInView delay={0.1}>
            <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm relative h-full flex flex-col">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Mensal</h3>
              <p className="text-slate-500 mb-6">Flexibilidade total, cancele quando quiser.</p>
              
              <div className="flex items-baseline mb-8">
                <span className="text-5xl font-extrabold text-slate-900">R$ 490</span>
                <span className="text-slate-500 ml-2">/mês</span>
              </div>
              
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-start gap-3 text-slate-700">
                  <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
                  <span>Posts ilimitados com IA</span>
                </li>
                <li className="flex items-start gap-3 text-slate-700">
                  <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
                  <span>Editor de Textos Avançado</span>
                </li>
                <li className="flex items-start gap-3 text-slate-700">
                  <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
                  <span>Agendamento automático</span>
                </li>
                <li className="flex items-start gap-3 text-slate-700">
                  <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
                  <span>Integração Google Meu Negócio</span>
                </li>
              </ul>
              
              <Button asChild variant="outline" size="lg" className="w-full rounded-full border-slate-300 h-14 text-lg hover:bg-slate-50 hover:scale-[1.02] transition-transform">
                <Link href="/acesso/cadastro">Começar Mensal</Link>
              </Button>
            </div>
          </FadeInView>

          {/* Anual (Destaque Lovable Style) */}
          <FadeInView delay={0.2}>
            <div className="bg-slate-900 p-10 rounded-3xl border border-slate-700 shadow-2xl relative h-full flex flex-col transform md:scale-105 z-10">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-transparent rounded-3xl pointer-events-none" />
              
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-orange-400 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-lg">
                MAIS POPULAR - ECONOMIZE 18%
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2">Anual</h3>
              <p className="text-slate-400 mb-6">O melhor custo-benefício para quem quer crescer.</p>
              
              <div className="flex items-baseline mb-8">
                <span className="text-5xl font-extrabold text-white">R$ 400</span>
                <span className="text-slate-400 ml-2">/mês</span>
              </div>
              <p className="text-slate-400 text-sm mb-6 -mt-6">Cobrado R$ 4.800 anualmente</p>
              
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-start gap-3 text-slate-300">
                  <CheckCircle2 className="w-6 h-6 text-orange-500 shrink-0" />
                  <span><strong>Tudo do plano Mensal, mais:</strong></span>
                </li>
                <li className="flex items-start gap-3 text-slate-300">
                  <CheckCircle2 className="w-6 h-6 text-orange-500 shrink-0" />
                  <span>2 Meses Grátis embutidos</span>
                </li>
                <li className="flex items-start gap-3 text-slate-300">
                  <CheckCircle2 className="w-6 h-6 text-orange-500 shrink-0" />
                  <span>Geração de Imagens Prioritária</span>
                </li>
                <li className="flex items-start gap-3 text-slate-300">
                  <CheckCircle2 className="w-6 h-6 text-orange-500 shrink-0" />
                  <span>Suporte VIP WhatsApp</span>
                </li>
              </ul>
              
              <Button asChild size="lg" className="w-full rounded-full bg-gradient-to-r from-orange-500 to-orange-400 text-white h-14 text-lg hover:from-orange-600 hover:to-orange-500 hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(249,115,22,0.4)]">
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
