"use client";

import React from "react";
import { motion } from "framer-motion";
import { Globe, Target, LineChart } from "lucide-react";

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

export const FeaturesGrid = () => {
  return (
    <section
      id="recursos"
      className="relative border-t border-slate-800 bg-slate-900 py-24 text-white scroll-mt-20"
    >
      {/* Background Glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-[100px]" />

      <div className="container relative z-10 mx-auto px-4 lg:px-8">
        <FadeInView>
          <div className="mx-auto mb-20 max-w-3xl text-center">
            <h2 className="mb-6 text-3xl font-extrabold tracking-tight md:text-5xl">
              Gerencie tudo em um só lugar
            </h2>
            <p className="text-xl text-slate-400">
              Cuidamos de toda a jornada digital do seu pequeno negócio, não apenas dos posts.
            </p>
          </div>
        </FadeInView>

        <div className="grid gap-8 md:grid-cols-3">
          <FadeInView delay={0.1}>
            <div className="group h-full rounded-2xl border border-slate-700/50 bg-slate-800/50 p-8 backdrop-blur-sm transition-transform duration-300 hover:-translate-y-2 hover:border-blue-500/30 hover:shadow-[0_0_40px_-10px_rgba(59,130,246,0.3)]">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500/10 transition-transform duration-300 group-hover:scale-110">
                <Globe className="h-7 w-7 text-blue-400" />
              </div>
              <h3 className="mb-4 text-2xl font-bold text-white">Google Meu Negócio</h3>
              <p className="text-lg leading-relaxed text-slate-400">
                Agendamos atualizações e respondemos avaliações automaticamente para sua empresa
                sempre aparecer no topo das buscas locais.
              </p>
            </div>
          </FadeInView>

          <FadeInView delay={0.2}>
            <div className="group h-full rounded-2xl border border-slate-700/50 bg-slate-800/50 p-8 backdrop-blur-sm transition-transform duration-300 hover:-translate-y-2 hover:border-orange-500/30 hover:shadow-[0_0_40px_-10px_rgba(249,115,22,0.3)]">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-orange-500/10 transition-transform duration-300 group-hover:scale-110">
                <Target className="h-7 w-7 text-orange-400" />
              </div>
              <h3 className="mb-4 text-2xl font-bold text-white">Anúncios Meta Integrados</h3>
              <p className="text-lg leading-relaxed text-slate-400">
                Gerou um post vencedor? Com 1 clique, a IA cria e lança uma campanha otimizada de
                tráfego pago no Instagram/Facebook com o orçamento que você definir.
              </p>
            </div>
          </FadeInView>

          <FadeInView delay={0.3}>
            <div className="group h-full rounded-2xl border border-slate-700/50 bg-slate-800/50 p-8 backdrop-blur-sm transition-transform duration-300 hover:-translate-y-2 hover:border-purple-500/30 hover:shadow-[0_0_40px_-10px_rgba(168,85,247,0.3)]">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-purple-500/10 transition-transform duration-300 group-hover:scale-110">
                <LineChart className="h-7 w-7 text-purple-400" />
              </div>
              <h3 className="mb-4 text-2xl font-bold text-white">Funil de Vendas</h3>
              <p className="text-lg leading-relaxed text-slate-400">
                Dashboard inteligente que mostra não apenas curtidas, mas quantas pessoas de fato
                clicaram no seu link e iniciaram conversas no seu WhatsApp.
              </p>
            </div>
          </FadeInView>
        </div>
      </div>
    </section>
  );
};
