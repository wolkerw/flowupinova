"use client";

import React from "react";
import { motion } from "framer-motion";
import { Zap, Brain, Store } from "lucide-react";

export const FeaturesBanner = () => {
  return (
    <section className="py-24 bg-[#F9F6F0]">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-[#0B101E] rounded-3xl p-10 md:p-12 shadow-2xl"
        >
          <div className="grid md:grid-cols-3 gap-10 md:gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-800">
            
            {/* Feature 1 */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-5 pt-8 md:pt-0 first:pt-0">
              <div className="flex-shrink-0 w-14 h-14 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-1">Geração ilimitada</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Crie quantos conteúdos e artes precisar, sem limite mensal.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-5 pt-8 md:pt-0 md:pl-8">
              <div className="flex-shrink-0 w-14 h-14 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-1">Auto-aprendizado Real</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  A IA aprende sobre a sua marca, tom de voz e produtos.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-5 pt-8 md:pt-0 md:pl-8">
              <div className="flex-shrink-0 w-14 h-14 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-1">Vitrine Google integrada</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
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
