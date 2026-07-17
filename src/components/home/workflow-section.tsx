"use client";

import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Check } from "lucide-react";
import { AnimatedProductFlow, AnimatedAvatarFlow } from "./animated-flows";
import { AnimatedEditorFlow } from "./animated-editor-flow";

const FadeInView = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.7, ease: "easeOut", delay }}
  >
    {children}
  </motion.div>
);

export const WorkflowSection = () => {
  const mosaicImages = [
    "/mosaico/concept_1 (1).png",
    "/mosaico/concept_1.png",
    "/mosaico/concept_2 (1).png",
    "/mosaico/concept_2.png",
    "/mosaico/concept_3.png",
    "/mosaico/nanobanana_ref_generated.png",
    "/mosaico/numvapt-1779305655511.png",
    "/mosaico/numvapt-1779305658702.png",
    "/mosaico/numvapt-1779305661530.png",
    "/mosaico/numvapt-1780953400573.png",
    "/mosaico/numvapt-1781023326295.png",
    "/mosaico/numvapt-1783545177946.png",
  ];

  // Dividimos as imagens em 4 colunas para o grid animado
  const col1 = mosaicImages.slice(0, 3);
  const col2 = mosaicImages.slice(3, 6);
  const col3 = mosaicImages.slice(6, 9);
  const col4 = mosaicImages.slice(9, 12);

  const columns = [col1, col2, col3, col4];

  return (
    <section id="como-funciona" className="relative overflow-hidden bg-white pb-32">
      {/* Section Header with FULL WIDTH Mosaic */}
      <div className="relative mb-32 flex h-[600px] w-full items-center justify-center overflow-hidden bg-slate-50 py-24 md:py-40">
        {/* Mosaico Background Animado */}
        <div className="pointer-events-none absolute inset-0 z-0 flex select-none items-center gap-4 overflow-hidden px-4 opacity-[0.85]">
          {columns.map((col, i) => (
            <div key={i} className="relative h-[200vh] flex-1 overflow-visible">
              <motion.div
                className="absolute flex w-full flex-col gap-4"
                animate={{
                  y: i % 2 === 0 ? ["0%", "-50%"] : ["-50%", "0%"],
                }}
                transition={{
                  duration: 30 + i * 5, // Velocidades levemente diferentes
                  ease: "linear",
                  repeat: Infinity,
                }}
              >
                {/* Triplicamos as imagens para garantir o loop infinito perfeito e sem cortes na tela */}
                {[...col, ...col, ...col, ...col].map((src, index) => (
                  <div key={index} className="overflow-hidden rounded-xl shadow-md">
                    <img src={src} alt={`Mosaic`} className="h-auto w-full object-cover" />
                  </div>
                ))}
              </motion.div>
            </div>
          ))}
        </div>

        {/* Gradiente para suavizar as bordas do mosaico e fundir com o fundo da página */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#F9F6F0] via-transparent to-white" />

        {/* Gradiente lateral: Azul (Esquerda) -> Branco 70% (Centro) -> Laranja (Direita) */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-blue-500/60 via-white/70 to-orange-500/60" />

        {/* Text Content Overlay */}
        <FadeInView>
          <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
            <h2 className="mb-6 inline-block text-4xl font-extrabold tracking-tight text-slate-900 drop-shadow-lg md:text-6xl">
              A mágica acontece em{" "}
              <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                segundos
              </span>
            </h2>
            <p className="mx-auto max-w-2xl text-xl font-bold text-slate-900 drop-shadow-md">
              Veja como nossa IA transforma comandos simples em resultados profissionais prontos
              para publicar.
            </p>
          </div>
        </FadeInView>
      </div>

      <div className="container mx-auto px-4 lg:px-8">
        {/* Ideia para Postagem (Entre mosaico e fluxos) */}
        <div className="mb-40 text-center">
          <FadeInView>
            <h3 className="mb-16 text-3xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
              Da{" "}
              <span className="bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
                Ideia
              </span>{" "}
              à{" "}
              <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                Postagem
              </span>{" "}
              em Segundos
            </h3>

            <div className="flex flex-col items-center justify-center gap-8 md:flex-row md:gap-12">
              {/* Caixa de Prompt (Ideia) */}
              <motion.div
                className="relative w-full max-w-sm rounded-3xl border border-slate-200/60 bg-white p-6 text-left shadow-xl md:p-8"
                whileHover={{ y: -5 }}
              >
                <div className="mb-4 flex items-center gap-2 font-bold text-orange-500">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <span>Sua Ideia</span>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 font-medium leading-relaxed text-slate-600">
                  "Crie um post pro Instagram sobre a nossa nova coleção de jaquetas corta-vento,
                  destacando que elas são impermeáveis e ótimas pro frio."
                </div>
                <div className="absolute -bottom-4 -right-4 rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-600 shadow-sm">
                  Gerando...
                </div>
              </motion.div>

              {/* Sinal de + */}
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-2xl font-black text-slate-400 shadow-inner">
                +
              </div>

              {/* Preview de Postagem */}
              <motion.div
                className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-slate-200/60 bg-white text-left shadow-2xl"
                whileHover={{ y: -5 }}
              >
                {/* Instagram Mock Header */}
                <div className="flex items-center gap-3 border-b border-slate-100 p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white shadow-sm">
                    NV
                  </div>
                  <span className="text-sm font-bold text-slate-800">suamarca</span>
                </div>

                {/* Imagem do Post */}
                <div className="group relative aspect-square w-full overflow-hidden bg-slate-100">
                  <img
                    src="/numvapt-1784051866584.png"
                    alt="Post gerado"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                {/* Legenda do Post */}
                <div className="space-y-2 p-4">
                  <div className="mb-2 flex gap-4 text-slate-700">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      ></path>
                    </svg>
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      ></path>
                    </svg>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-700">
                    <span className="mr-2 font-bold text-slate-900">suamarca</span>O frio não te
                    para! ❄️ Nossa nova jaqueta corta-vento chegou para proteger seus treinos com
                    100% de impermeabilidade. Garanta a sua! 🧥🌧️ #Inverno #Proteção #CortaVento
                  </p>
                </div>
                <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-blue-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                  Pronto
                </div>
              </motion.div>
            </div>
          </FadeInView>
        </div>

        {/* Workflow 1: Produto */}
        <div className="mb-32 grid items-center gap-16 rounded-[2.5rem] border border-slate-100 bg-slate-50/50 p-8 lg:grid-cols-2 lg:p-12">
          <FadeInView>
            <div className="space-y-6">
              <h3 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-5xl">
                Fotos{" "}
                <span className="bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
                  incríveis
                </span>{" "}
                do seu{" "}
                <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                  produto
                </span>
              </h3>
              <p className="text-lg leading-relaxed text-slate-600">
                Envie uma foto crua do seu produto. Nossa IA o recorta e coloca dentro de um
                contexto profissional (ex: uma roupa sendo usada na praia, ou um lanche em uma mesa
                rústica).
              </p>
              <div className="mt-8 space-y-4">
                <h4 className="text-lg font-bold text-slate-900">Ideal para:</h4>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-500" />
                    <span className="text-slate-600">
                      <strong>Setor de Serviços</strong> (Eletricistas, encanadores, pintores,
                      mecânicos, assistências técnicas, psicólogos, médico, dentistas e
                      fisioterapeutas, etc)
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-500" />
                    <span className="text-slate-600">
                      <strong>Setor Imobiliário e Construção</strong> (Corretores de imóveis,
                      arquitetos, engenheiros, designers de interiores e pequenos empreiteiros, etc)
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-500" />
                    <span className="text-slate-600">
                      <strong>Varejo</strong> (Lojas de roupas femininas/masculinas/infantis,
                      e-commerces locais de calçados, lojistas de bolsas, bijuterias e óculos, etc)
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-500" />
                    <span className="text-slate-600">
                      <strong>Gastronomia</strong> (Hamburguerias, pizzarias, confeitarias,
                      marmitarias, cafeterias e padarias locais, etc)
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-500" />
                    <span className="text-slate-600">
                      <strong>Estética e Beleza</strong> (Cabeleireiros, manicures, esteticistas,
                      estúdios de tatuagem e micropigmentadoras, etc)
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </FadeInView>
          <FadeInView delay={0.2}>
            <AnimatedProductFlow />
          </FadeInView>
        </div>

        {/* Workflow 2: Editor (Zig-Zag) */}
        <div className="mb-32 grid items-center gap-16 rounded-[2.5rem] border border-slate-100 bg-slate-50/50 p-8 lg:grid-cols-2 lg:p-12">
          <FadeInView delay={0.2}>
            <div className="relative z-10 order-2 w-full lg:order-1">
              <AnimatedEditorFlow />
            </div>
          </FadeInView>
          <FadeInView>
            <div className="order-1 space-y-6 lg:order-2">
              <h3 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-5xl">
                Com Texto da{" "}
                <span className="bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
                  IA
                </span>{" "}
                ou Editor{" "}
                <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                  Manual
                </span>
              </h3>
              <p className="text-lg leading-relaxed text-slate-600">
                Você pode pedir para a IA gerar a imagem já com as copys (textos) embutidas de forma
                nativa e ultra-realista.
              </p>
              <p className="text-lg leading-relaxed text-slate-600">
                Prefere ter o controle milimétrico? Gere a imagem limpa e use nosso{" "}
                <strong>Editor de Textos integrado</strong> para adicionar suas próprias chamadas,
                mudar fontes, cores e arrastar para onde quiser, sem sair da plataforma!
              </p>
            </div>
          </FadeInView>
        </div>

        {/* Workflow 3: Avatar */}
        <div className="grid items-center gap-16 rounded-[2.5rem] border border-slate-100 bg-slate-50/50 p-8 lg:grid-cols-2 lg:p-12">
          <FadeInView>
            <div className="space-y-6">
              <h3 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-5xl">
                Fotos{" "}
                <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                  Profissionais
                </span>{" "}
                sem{" "}
                <span className="bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
                  Estúdio
                </span>
              </h3>
              <p className="text-lg leading-relaxed text-slate-600">
                A primeira impressão é a que fica. Envie uma simples selfie tirada no celular e uma
                referência de estilo. Nossa IA gera fotos de estúdio incríveis de você, prontas para
                usar no perfil do LinkedIn, WhatsApp ou Instagram.
              </p>
            </div>
          </FadeInView>
          <FadeInView delay={0.2}>
            <AnimatedAvatarFlow />
          </FadeInView>
        </div>
      </div>
    </section>
  );
};
