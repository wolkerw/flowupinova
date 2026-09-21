"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, MessageCircle } from "lucide-react";
import Link from "next/link";

const faqs = [
  {
    question: "Se eu não entender de internet, eu consigo usar?",
    answer:
    "Sim, a NumVapt foi desenhada para ser extremamente fácil e intuitiva. Com alguns cliques, a Inteligência Artificial cuida de toda a parte técnica para você.",
  },
  {
    question: "Tem limite de imagens que eu posso gerar?",
    answer:
    "Não! Nosso plano PRO oferece geração ilimitada de imagens para você nunca mais se preocupar com banco de imagens.",
  },
  {
    question: "Como funciona a conexão com meu Instagram e Google?",
    answer:
    "O processo é rápido e seguro. Você faz o login nas suas contas e a NumVapt se encarrega de agendar e publicar as postagens automaticamente nas suas redes.",
  },
  {
    question: "Por que a IA aprende sobre o meu negócio?",
    answer:
    "Ao se cadastrar, você nos conta um pouco sobre sua empresa. A IA analisa essas informações para gerar textos, hashtags e abordagens que tenham a voz exata da sua marca.",
  },
  {
    question: "Como funciona a Garantia Risco Zero de 7 dias?",
    answer:
      "Se dentro dos primeiros 7 dias de uso você achar que a NumVapt não é para você, basta nos envia 1 e-mail solicitando o cancelamento. Devolvemos o seu dinheiro na hora, sem burocracia e sem letras miúdas.",
  },
];

export const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="duvidas" className="bg-[#FDFBF7] py-24 scroll-mt-20">
      <div className="container mx-auto max-w-4xl px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 text-4xl font-extrabold tracking-tight text-[#0B1426] md:text-5xl">
            Dúvidas frequentes
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-base sm:text-lg text-slate-600">
            <span>Ainda tem dúvidas? Fale com nosso especialista:</span>
            <a
              href="https://wa.me/5551920044035?text=Ol%C3%A1!%20Estava%20vendo%20as%20d%C3%BAvidas%20frequentes%20no%20site%20e%20gostaria%20de%20conversar%20com%20um%20especialista%20sobre%20a%20NumVapt."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200 transition-colors shadow-sm"
            >
              <MessageCircle className="h-4 w-4 text-[#25D366]" />
              Falar no WhatsApp
            </a>
          </div>
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
                className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="flex w-full items-center justify-between px-6 py-6 text-left focus:outline-none"
                >
                  <span className="text-lg font-bold text-[#0B1426]">{faq.question}</span>
                  <div className="ml-4 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#F5F2EC] transition-colors">
                    {isOpen ? (
                      <Minus className="h-4 w-4 text-[#0B1426]" />
                    ) : (
                      <Plus className="h-4 w-4 text-[#0B1426]" />
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
                      <div className="px-6 pb-6 pt-0 text-base leading-relaxed text-slate-600">
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
