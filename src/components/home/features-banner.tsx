"use client";

import React from "react";
import { motion } from "framer-motion";
import { Zap, Brain, Store } from "lucide-react";

export const FeaturesBanner = () => {
  return (
    <section className="bg-[#F9F6F0] py-24">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl bg-[#0B101E] p-10 shadow-2xl md:p-12"
        >
          <div className="grid gap-10 divide-y divide-slate-800 md:grid-cols-3 md:gap-8 md:divide-x md:divide-y-0">
            {/* Feature 1 */}
            <div className="flex flex-col items-start gap-5 pt-8 first:pt-0 md:flex-row md:items-center md:pt-0">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border border-orange-500/20 bg-orange-500/10 text-orange-500">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h3 className="mb-1 text-lg font-bold text-white">Geração ilimitada</h3>
                <p className="text-sm leading-relaxed text-slate-400">
                  Crie quantos conteúdos e artes precisar, sem limite mensal.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col items-start gap-5 pt-8 md:flex-row md:items-center md:pl-8 md:pt-0">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border border-orange-500/20 bg-orange-500/10 text-orange-500">
                <Brain className="h-6 w-6" />
              </div>
              <div>
                <h3 className="mb-1 text-lg font-bold text-white">Auto-aprendizado Real</h3>
                <p className="text-sm leading-relaxed text-slate-400">
                  A IA aprende sobre a sua marca, tom de voz e produtos.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col items-start gap-5 pt-8 md:flex-row md:items-center md:pl-8 md:pt-0">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border border-orange-500/20 bg-orange-500/10 text-orange-500">
                <Store className="h-6 w-6" />
              </div>
              <div>
                <h3 className="mb-1 text-lg font-bold text-white">Vitrine Google integrada</h3>
                <p className="text-sm leading-relaxed text-slate-400">
                  Publica direto no seu perfil do Google Meu Negócio.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
