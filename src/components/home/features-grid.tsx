"use client";

import React from "react";
import { motion } from "framer-motion";
import { Globe, Target, LineChart } from "lucide-react";

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

export const FeaturesGrid = () => {
  return (
    <section id="recursos" className="py-24 bg-slate-900 text-white relative border-t border-slate-800">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <FadeInView>
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-6 tracking-tight">Gerencie tudo em um só lugar</h2>
            <p className="text-xl text-slate-400">
              Cuidamos de toda a jornada digital do seu pequeno negócio, não apenas dos posts.
            </p>
          </div>
        </FadeInView>

        <div className="grid md:grid-cols-3 gap-8">
          
          <FadeInView delay={0.1}>
            <div className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-2xl border border-slate-700/50 h-full hover:-translate-y-2 transition-transform duration-300 hover:shadow-[0_0_40px_-10px_rgba(59,130,246,0.3)] hover:border-blue-500/30 group">
              <div className="w-14 h-14 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Globe className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Google Meu Negócio</h3>
              <p className="text-slate-400 leading-relaxed text-lg">
                Agendamos atualizações e respondemos avaliações automaticamente para sua empresa sempre aparecer no topo das buscas locais.
              </p>
            </div>
          </FadeInView>

          <FadeInView delay={0.2}>
            <div className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-2xl border border-slate-700/50 h-full hover:-translate-y-2 transition-transform duration-300 hover:shadow-[0_0_40px_-10px_rgba(249,115,22,0.3)] hover:border-orange-500/30 group">
              <div className="w-14 h-14 bg-orange-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Target className="w-7 h-7 text-orange-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Anúncios Meta Integrados</h3>
              <p className="text-slate-400 leading-relaxed text-lg">
                Gerou um post vencedor? Com 1 clique, a IA cria e lança uma campanha otimizada de tráfego pago no Instagram/Facebook com o orçamento que você definir.
              </p>
            </div>
          </FadeInView>

          <FadeInView delay={0.3}>
            <div className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-2xl border border-slate-700/50 h-full hover:-translate-y-2 transition-transform duration-300 hover:shadow-[0_0_40px_-10px_rgba(168,85,247,0.3)] hover:border-purple-500/30 group">
              <div className="w-14 h-14 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <LineChart className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Funil de Vendas</h3>
              <p className="text-slate-400 leading-relaxed text-lg">
                Dashboard inteligente que mostra não apenas curtidas, mas quantas pessoas de fato clicaram no seu link e iniciaram conversas no seu WhatsApp.
              </p>
            </div>
          </FadeInView>

        </div>
      </div>
    </section>
  );
};
