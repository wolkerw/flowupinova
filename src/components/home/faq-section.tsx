"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import Link from "next/link";

const faqs = [
  {
    question: "Se eu não entender de internet, eu consigo usar?",
    answer: "Sim, a NumVapt foi desenhada para ser extremamente fácil e intuitiva. Com alguns cliques, a Inteligência Artificial cuida de toda a parte técnica para você.",
  },
  {
    question: "Tem limite de imagens que eu posso gerar?",
    answer: "Não! Nosso plano PRO oferece geração ilimitada de imagens para você nunca mais se preocupar com banco de imagens.",
  },
  {
    question: "Como funciona a conexão com meu Instagram e Google?",
    answer: "O processo é rápido e seguro. Você faz o login nas suas contas e a NumVapt se encarrega de agendar e publicar as postagens automaticamente nas suas redes.",
  },
  {
    question: "Por que a IA aprende sobre o meu negócio?",
    answer: "Ao se cadastrar, você nos conta um pouco sobre sua empresa. A IA analisa essas informações para gerar textos, hashtags e abordagens que tenham a voz exata da sua marca.",
  },
];

export const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-24 bg-[#FDFBF7]">
      <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-extrabold text-[#0B1426] mb-4 tracking-tight">
            Dúvidas frequentes
          </h2>
          <p className="text-slate-600 text-lg">
            Ainda em dúvida? Fale com nosso especialista humano — direto no{" "}
            <Link href="https://wa.me/555199922177" target="_blank" className="underline hover:text-[#0B1426]">
              chat
            </Link>.
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex items-center justify-between px-6 py-6 text-left focus:outline-none"
                >
                  <span className="font-bold text-lg text-[#0B1426]">
                    {faq.question}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-[#F5F2EC] flex items-center justify-center flex-shrink-0 ml-4 transition-colors">
                    {isOpen ? (
                      <Minus className="w-4 h-4 text-[#0B1426]" />
                    ) : (
                      <Plus className="w-4 h-4 text-[#0B1426]" />
                    )}
                  </div>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="px-6 pb-6 pt-0 text-slate-600 text-base leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
