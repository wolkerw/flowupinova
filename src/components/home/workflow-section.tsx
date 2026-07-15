"use client";

import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Check } from "lucide-react";
import { AnimatedProductFlow, AnimatedAvatarFlow } from "./animated-flows";
import { AnimatedEditorFlow } from "./animated-editor-flow";

const FadeInView = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => (
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
    "/demo-clothing-isolated.png",
    "/demo-clothing-model.png",
    "/demo-hybrid-project.png",
    "/demo-hybrid-result.png",
    "/demo-hybrid-selfie.png",
    "/demo-product-isolated.png",
    "/demo-product-raw-simple.png",
    "/demo-product-raw.png",
    "/demo-result.png",
    "/demo-scenario.png",
    "/images/avatar-demo/resultado.jpg",
    "/images/avatar-demo/result.jpg",
  ];

  // Dividimos as imagens em 4 colunas para o grid animado
  const col1 = mosaicImages.slice(0, 3);
  const col2 = mosaicImages.slice(3, 6);
  const col3 = mosaicImages.slice(6, 9);
  const col4 = mosaicImages.slice(9, 12);

  const columns = [col1, col2, col3, col4];

  return (
    <section id="como-funciona" className="pb-32 bg-white relative overflow-hidden">
      
      {/* Section Header with FULL WIDTH Mosaic */}
      <div className="relative mb-32 w-full overflow-hidden bg-slate-50 py-24 md:py-40 h-[600px] flex items-center justify-center">
        {/* Mosaico Background Animado */}
        <div className="absolute inset-0 z-0 opacity-[0.85] select-none pointer-events-none flex gap-4 px-4 overflow-hidden items-center">
          {columns.map((col, i) => (
            <div key={i} className="flex-1 overflow-visible relative h-[200vh]">
              <motion.div
                className="flex flex-col gap-4 absolute w-full"
                animate={{ 
                  y: i % 2 === 0 ? ["0%", "-50%"] : ["-50%", "0%"] 
                }}
                transition={{ 
                  duration: 30 + (i * 5), // Velocidades levemente diferentes
                  ease: "linear", 
                  repeat: Infinity,
                }}
              >
                {/* Triplicamos as imagens para garantir o loop infinito perfeito e sem cortes na tela */}
                {[...col, ...col, ...col, ...col].map((src, index) => (
                  <div key={index} className="shadow-md rounded-xl overflow-hidden">
                    <img src={src} alt={`Mosaic`} className="w-full h-auto object-cover" />
                  </div>
                ))}
              </motion.div>
            </div>
          ))}
        </div>
        
        {/* Gradiente para suavizar as bordas do mosaico e fundir com o fundo da página */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#F9F6F0] via-transparent to-white pointer-events-none" />
        
        {/* Gradiente lateral: Azul (Esquerda) -> Branco 70% (Centro) -> Laranja (Direita) */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/60 via-white/70 to-orange-500/60 pointer-events-none" />

        {/* Text Content Overlay */}
        <FadeInView>
          <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
            <h2 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight drop-shadow-lg inline-block">
              A mágica acontece em <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">segundos</span>
            </h2>
            <p className="text-xl text-slate-900 font-bold max-w-2xl mx-auto drop-shadow-md">
              Veja como nossa IA transforma comandos simples em resultados profissionais prontos para publicar.
            </p>
          </div>
        </FadeInView>
      </div>

      <div className="container mx-auto px-4 lg:px-8">
        
        {/* Ideia para Postagem (Entre mosaico e fluxos) */}
        <div className="mb-40 text-center">
          <FadeInView>
            <h3 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-16 tracking-tight">
              Da <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-400">Ideia</span> à <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">Postagem</span> em Segundos
            </h3>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
              
              {/* Caixa de Prompt (Ideia) */}
              <motion.div 
                className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-200/60 w-full max-w-sm text-left relative"
                whileHover={{ y: -5 }}
              >
                <div className="flex items-center gap-2 mb-4 text-orange-500 font-bold">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span>Sua Ideia</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-slate-600 font-medium leading-relaxed">
                  "Crie um post pro Instagram sobre a nossa nova coleção de jaquetas corta-vento, destacando que elas são impermeáveis e ótimas pro frio."
                </div>
                <div className="absolute -bottom-4 -right-4 bg-emerald-100 text-emerald-600 font-bold px-3 py-1 text-xs rounded-full shadow-sm border border-emerald-200">
                  Gerando...
                </div>
              </motion.div>

              {/* Sinal de + */}
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-black text-2xl shadow-inner border border-slate-200">
                +
              </div>

              {/* Preview de Postagem */}
              <motion.div 
                className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200/60 w-full max-w-sm text-left relative"
                whileHover={{ y: -5 }}
              >
                {/* Instagram Mock Header */}
                <div className="p-4 flex items-center gap-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    NV
                  </div>
                  <span className="font-bold text-sm text-slate-800">suamarca</span>
                </div>
                
                {/* Imagem do Post */}
                <div className="w-full aspect-square bg-slate-100 relative overflow-hidden group">
                  <img src="/numvapt-1784051866584.png" alt="Post gerado" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                
                {/* Legenda do Post */}
                <div className="p-4 space-y-2">
                  <div className="flex gap-4 mb-2 text-slate-700">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    <span className="font-bold text-slate-900 mr-2">suamarca</span>
                    O frio não te para! ❄️ Nossa nova jaqueta corta-vento chegou para proteger seus treinos com 100% de impermeabilidade. Garanta a sua! 🧥🌧️ #Inverno #Proteção #CortaVento
                  </p>
                </div>
                <div className="absolute top-4 right-4 bg-blue-500 text-white font-bold px-3 py-1 text-xs rounded-full shadow-lg flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  Pronto
                </div>
              </motion.div>
            </div>
          </FadeInView>
        </div>

        {/* Workflow 1: Produto */}
        <div className="bg-slate-50/50 rounded-[2.5rem] p-8 lg:p-12 border border-slate-100 grid lg:grid-cols-2 gap-16 items-center mb-32">
          <FadeInView>
            <div className="space-y-6">

              <h3 className="text-3xl md:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight">
                Fotos <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-400">incríveis</span> do seu <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">produto</span>
              </h3>
              <p className="text-slate-600 text-lg leading-relaxed">
                Envie uma foto crua do seu produto. Nossa IA o recorta e coloca dentro de um contexto profissional (ex: uma roupa sendo usada na praia, ou um lanche em uma mesa rústica).
              </p>
              <div className="mt-8 space-y-4">
                <h4 className="font-bold text-slate-900 text-lg">Ideal para:</h4>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <Check className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-600"><strong>Setor de Serviços</strong> (Eletricistas, encanadores, pintores, mecânicos, assistências técnicas, psicólogos, médico, dentistas e fisioterapeutas, etc)</span>
                  </li>
                  <li className="flex gap-3">
                    <Check className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-600"><strong>Setor Imobiliário e Construção</strong> (Corretores de imóveis, arquitetos, engenheiros, designers de interiores e pequenos empreiteiros, etc)</span>
                  </li>
                  <li className="flex gap-3">
                    <Check className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-600"><strong>Varejo</strong> (Lojas de roupas femininas/masculinas/infantis, e-commerces locais de calçados, lojistas de bolsas, bijuterias e óculos, etc)</span>
                  </li>
                  <li className="flex gap-3">
                    <Check className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-600"><strong>Gastronomia</strong> (Hamburguerias, pizzarias, confeitarias, marmitarias, cafeterias e padarias locais, etc)</span>
                  </li>
                  <li className="flex gap-3">
                    <Check className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-600"><strong>Estética e Beleza</strong> (Cabeleireiros, manicures, esteticistas, estúdios de tatuagem e micropigmentadoras, etc)</span>
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
        <div className="bg-slate-50/50 rounded-[2.5rem] p-8 lg:p-12 border border-slate-100 grid lg:grid-cols-2 gap-16 items-center mb-32">
          <FadeInView delay={0.2}>
            <div className="order-2 lg:order-1 w-full relative z-10">
              <AnimatedEditorFlow />
            </div>
          </FadeInView>
          <FadeInView>
            <div className="order-1 lg:order-2 space-y-6">

              <h3 className="text-3xl md:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight">
                Com Texto da <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-400">IA</span> ou Editor <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">Manual</span>
              </h3>
              <p className="text-slate-600 text-lg leading-relaxed">
                Você pode pedir para a IA gerar a imagem já com as copys (textos) embutidas de forma nativa e ultra-realista.
              </p>
              <p className="text-slate-600 text-lg leading-relaxed">
                Prefere ter o controle milimétrico? Gere a imagem limpa e use nosso <strong>Editor de Textos integrado</strong> para adicionar suas próprias chamadas, mudar fontes, cores e arrastar para onde quiser, sem sair da plataforma!
              </p>
            </div>
          </FadeInView>
        </div>

        {/* Workflow 3: Avatar */}
        <div className="bg-slate-50/50 rounded-[2.5rem] p-8 lg:p-12 border border-slate-100 grid lg:grid-cols-2 gap-16 items-center">
          <FadeInView>
            <div className="space-y-6">

              <h3 className="text-3xl md:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight">
                Fotos <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">Profissionais</span> sem <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-400">Estúdio</span>
              </h3>
              <p className="text-slate-600 text-lg leading-relaxed">
                A primeira impressão é a que fica. Envie uma simples selfie tirada no celular e uma referência de estilo. Nossa IA gera fotos de estúdio incríveis de você, prontas para usar no perfil do LinkedIn, WhatsApp ou Instagram.
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
