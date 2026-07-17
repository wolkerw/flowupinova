"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";
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
];

export const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="bg-[#FDFBF7] py-24">
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
          <p className="text-lg text-slate-600">
            Ainda em dúvida? Fale com nosso especialista humano — direto no{" "}
            <Link
              href="https://wa.me/555199922177"
              target="_blank"
              className="underline hover:text-[#0B1426]"
            >
              chat
            </Link>
            .
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
