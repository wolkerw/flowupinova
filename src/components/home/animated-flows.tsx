"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatedEditorFlow } from "./animated-editor-flow";
import {
  Bot,
  BarChart3,
  Edit,
  Send,
  CheckCircle,
  MessageCircle,
  Sparkles as SparklesIcon,
  Instagram,
  Clock,
  ShieldCheck,
  TrendingUp,
  X,
  PlayCircle,
  ChevronDown,
  LayoutDashboard,
  Search,
  Paintbrush,
  Camera,
  Image as ImageIcon,
  UserCircle2,
  CalendarDays,
  Target,
  Zap,

  Globe,
  UploadCloud,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/auth/auth-provider";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const WHATSAPP_LINK = "https://wa.me/555199922177?text=Olá!%20Gostaria%20de%20saber%20mais%20sobre%20a%20NumVapt.";

export const TypingAnimation = ({ text, theme = 'blue' }: { text: string, theme?: string }) => {
  const [displayedText, setDisplayedText] = React.useState("");
  
  React.useEffect(() => {
    let i = 0;
    setDisplayedText(""); // Reset no início
    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, i));
      i++;
      if (i > text.length) {
        clearInterval(interval);
      }
    }, 45); // Digitação rápida
    return () => clearInterval(interval);
  }, [text]);

  return (
    <span>
      {displayedText}
      <span className={`animate-pulse w-1.5 h-3.5 inline-block ml-0.5 align-middle ${theme === 'pink' ? 'bg-pink-500' : 'bg-orange-500'}`}></span>
    </span>
  );
};

const FLOWS = [
  {
    id: 1,
    titleInput: "FOTO 1: SUA ROUPA",
    imageInput: "/demo-clothing-isolated.png",
    promptTitle: "INPUT DA IDEIA (TEXTO)",
    promptText: "Modelo profissional vestindo esta jaqueta em Tóquio à noite, com luzes neon e visual cinematográfico...",
    imageOutput: "/demo-clothing-model.png",
    titleOutput1: "Modelo Real + Roupa",
    titleOutput2: "Fusão Pronta",
    isHybrid: false,
    theme: "blue"
  },
  {
    id: 2,
    titleInput: "FOTO 1: SEU PRODUTO",
    imageInput: "/Screenshot_27.jpg",
    promptTitle: "INPUT DA IDEIA (TEXTO)",
    promptText: "faça uma foto de catálogo deste hambúrguer e coloque-o numa mesa de lanchonete moderna...",
    imageOutput: "/numvapt-1783544518718.jpg",
    titleOutput1: "Cenário IA",
    titleOutput2: "Arte Pronta",
    isHybrid: false,
    theme: "blue"
  },
  {
    id: 3,
    titleInput: "FOTO 1: SELFIE (ROSTO)",
    imageInput: "/demo-hybrid-selfie.png",
    titleInput2: "FOTO 2: PROJETO/CENÁRIO",
    imageInput2: "/demo-hybrid-project.png",
    promptTitle: "INSTRUÇÕES DE MESCLAGEM",
    promptText: "Combine o rosto da Foto 1 com o cenário da Foto 2, mantendo a iluminação realista...",
    imageOutput: "/demo-hybrid-result.png",
    titleOutput1: "Rosto + Projeto Integrados",
    titleOutput2: "Fusão Pronta",
    isHybrid: true,
    theme: "pink"
  }
];

export const AnimatedProductFlow = () => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % FLOWS.length);
    }, 7500); // 7.5s por fluxo
    return () => clearInterval(timer);
  }, []);

  const flow = FLOWS[currentIndex];

  return (
    <div className="w-full relative h-[500px] md:h-[400px]">
      <AnimatePresence mode="wait">
        <motion.div 
          key={flow.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <div className="bg-[#0f172a] rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row items-center justify-center gap-4 sm:gap-6 w-full h-full shadow-2xl overflow-hidden border border-slate-800">
            {/* Left: Input Image */}
            {/* Left: Input Image(s) */}
            <div className="flex flex-col items-center shrink-0">
              {flow.isHybrid ? (
                <div className="flex flex-col gap-2 sm:gap-3 items-center">
                  <div className="bg-slate-800 rounded-xl p-2 border border-slate-700 w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center relative overflow-hidden shadow-lg">
                      <div className="absolute top-1 left-1 z-20 bg-black/80 text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">{flow.titleInput}</div>
                      <div className="relative w-full h-full z-10">
                        <Image src={flow.imageInput} alt="Input 1" fill className="object-cover rounded-md" />
                      </div>
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-400/20 to-transparent z-10"
                        initial={{ top: "-100%" }}
                        animate={{ top: "200%" }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                      />
                  </div>
                  <div className="bg-slate-800 rounded-xl p-2 border border-slate-700 w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center relative overflow-hidden shadow-lg">
                      <div className="absolute top-1 left-1 z-20 bg-black/80 text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">{flow.titleInput2}</div>
                      <div className="relative w-full h-full z-10">
                        <Image src={flow.imageInput2!} alt="Input 2" fill className="object-cover rounded-md" />
                      </div>
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-400/20 to-transparent z-10"
                        initial={{ top: "-100%" }}
                        animate={{ top: "200%" }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                      />
                  </div>
                </div>
              ) : (
                <div className="bg-slate-800 rounded-xl p-3 border border-slate-700 w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute top-2 left-2 z-20 bg-black/80 text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">{flow.titleInput}</div>
                    <div className="relative w-full h-full z-10">
                      <Image src={flow.imageInput} alt="Original" fill className="object-contain" />
                    </div>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-400/20 to-transparent z-10"
                      initial={{ top: "-100%" }}
                      animate={{ top: "200%" }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 0.5 }}
                    />
                </div>
              )}
            </div>
            
            {/* Center: Prompt */}
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <p className={`text-[10px] font-bold mb-2 tracking-widest uppercase ${flow.theme === 'pink' ? 'text-pink-500' : 'text-orange-500'}`}>{flow.promptTitle}</p>
              <div className={`border bg-slate-800/50 rounded-xl p-3 sm:p-4 w-full max-w-[280px] text-left ${flow.theme === 'pink' ? 'border-pink-900/50' : 'border-slate-700'}`}>
                  <p className={`text-[9px] font-bold mb-2 uppercase tracking-wide flex items-center gap-1 ${flow.theme === 'pink' ? 'text-pink-400' : 'text-slate-400'}`}>
                    {flow.theme === 'pink' && <span className="w-2 h-2 rounded-full bg-pink-500 inline-block"></span>}
                    PROMPT DE IA
                  </p>
                  <p className="text-slate-300 text-[11px] sm:text-xs font-mono leading-relaxed h-24">
                    <TypingAnimation text={flow.promptText} theme={flow.theme} />
                  </p>
              </div>
              <motion.div 
                animate={{ x: [0, 10, 0], opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className={`font-mono mt-3 sm:mt-4 font-bold tracking-widest text-lg flex items-center ${flow.theme === 'pink' ? 'text-pink-500' : 'text-indigo-400'}`}
              >
                ------&gt;
              </motion.div>
            </div>

            {/* Right: Output Image */}
            <div className="w-full md:w-56 lg:w-64 aspect-[4/3] md:aspect-[3/4] relative rounded-xl overflow-hidden border border-slate-700 shrink-0 bg-slate-900">
              <motion.div
                initial={{ opacity: 0, filter: "blur(10px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                transition={{ duration: 1, delay: 3 }} // Começa após 3s
                className="absolute inset-0 z-10"
              >
                <Image src={flow.imageOutput} alt="Resultado" fill className="object-cover" />
              </motion.div>
              
              <div className="absolute inset-0 flex items-center justify-center opacity-30">
                <Bot className="w-12 h-12 text-slate-500 animate-pulse" />
              </div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 4 }}
                className="absolute top-2 left-2 bg-teal-500/90 text-white text-[9px] sm:text-[10px] font-bold px-2 py-1 rounded shadow-sm z-20"
              >
                {flow.titleOutput1}
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 4.5 }}
                className="absolute bottom-2 right-2 bg-emerald-500 text-white text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded shadow-lg z-20"
              >
                {flow.titleOutput2}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const AVATAR_FLOWS = [
  {
    id: 1,
    imageSelfie: "/Screenshot_26.jpg",
    imageReference: "/3d775c5812ab51fe760005858f34926d.jpg",
    promptText: "Extrair estilo fotográfico, traços e iluminação da imagem de referência e aplicar na selfie...",
    imageOutput: "/users_m4hhWY415jZrmOZHYVXyqxrPxtg1_mediaGallery_avatar_d89306c0-7031-415a-bcc1-02b40f72b3cc.jpg",
    titleOutput1: "Estilo Transferido",
    titleOutput2: "Avatar IA"
  },
  {
    id: 2,
    imageSelfie: "/Screenshot_28.jpg",
    imageReference: "/download (2).jpeg",
    promptText: "Extrair estilo fotográfico e iluminação da imagem de referência e aplicar perfeitamente na selfie da modelo feminina...",
    imageOutput: "/users_m4hhWY415jZrmOZHYVXyqxrPxtg1_mediaGallery_avatar_d65f95a0-1b6e-43c3-bf1d-5df1f3d883b9.jpg",
    titleOutput1: "Estilo Transferido",
    titleOutput2: "Avatar IA"
  }
];

export const AnimatedAvatarFlow = () => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => prev + 1); // Incrementa infinitamente
    }, 7500);
    return () => clearInterval(timer);
  }, []);

  // Usa o resto da divisão para sempre pegar o índice correto caso haja mais itens depois
  const flow = AVATAR_FLOWS[currentIndex % AVATAR_FLOWS.length];

  return (
    <div className="w-full relative h-[500px] md:h-[400px]">
      <AnimatePresence mode="wait">
        <motion.div 
          key={currentIndex} // Usa o currentIndex para forçar o re-render
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <div className="bg-[#0f172a] rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row items-center justify-center gap-4 sm:gap-6 w-full h-full shadow-2xl overflow-hidden border border-slate-800">
            
            {/* Left: Input Images */}
            <div className="flex flex-col gap-3 shrink-0 items-center">
              <div className="flex gap-2 sm:gap-3 items-center">
                {/* Selfie */}
                <div className="bg-slate-800 rounded-xl p-2 border border-slate-700 w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center relative overflow-hidden shadow-lg">
                    <div className="absolute top-1 left-1 z-20 bg-black/80 text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">SELFIE</div>
                    <div className="relative w-full h-full z-10">
                      <Image src={flow.imageSelfie} alt="Selfie" fill className="object-cover rounded-md" />
                    </div>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-400/20 to-transparent z-10"
                      initial={{ top: "-100%" }}
                      animate={{ top: "200%" }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                    />
                </div>

                <div className="text-slate-500 font-bold text-lg sm:text-xl">+</div>

                {/* Reference */}
                <div className="bg-slate-800 rounded-xl p-2 border border-slate-700 w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center relative overflow-hidden shadow-lg">
                    <div className="absolute top-1 left-1 z-20 bg-black/80 text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">REF</div>
                    <div className="relative w-full h-full z-10">
                      <Image src={flow.imageReference} alt="Referência" fill className="object-cover rounded-md" />
                    </div>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-400/20 to-transparent z-10"
                      initial={{ top: "-100%" }}
                      animate={{ top: "200%" }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                    />
                </div>
              </div>
            </div>
            
            {/* Center: Prompt */}
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <p className="text-orange-500 text-[10px] font-bold mb-2 tracking-widest uppercase whitespace-nowrap">INPUT DA IDEIA</p>
              
              <div className="border border-slate-700 bg-slate-800/50 rounded-xl p-3 sm:p-4 w-full max-w-[280px] text-left flex flex-col gap-3 h-auto min-h-[120px]">
                  <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wide">PROMPT DE IA</p>
                  
                  {/* Text Prompt */}
                  <div className="flex-1">
                    <p className="text-slate-300 text-[11px] sm:text-[11.5px] font-mono leading-relaxed">
                      <TypingAnimation text={flow.promptText} />
                    </p>
                  </div>
              </div>
              <motion.div 
                animate={{ x: [0, 10, 0], opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="text-indigo-400 font-mono mt-3 sm:mt-4 font-bold tracking-widest text-lg flex items-center"
              >
                ------&gt;
              </motion.div>
            </div>

            {/* Right: Output Image */}
            <div className="w-full md:w-56 lg:w-64 aspect-[4/3] md:aspect-[3/4] relative rounded-xl overflow-hidden border border-slate-700 shrink-0 bg-slate-900">
              <motion.div
                initial={{ opacity: 0, filter: "blur(10px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                transition={{ duration: 1, delay: 3 }}
                className="absolute inset-0 z-10"
              >
                <Image src={flow.imageOutput} alt="Resultado" fill className="object-cover" />
              </motion.div>
              
              <div className="absolute inset-0 flex items-center justify-center opacity-30">
                <UserCircle2 className="w-12 h-12 text-slate-500 animate-pulse" />
              </div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 4 }}
                className="absolute top-2 left-2 bg-blue-600/90 text-white text-[9px] sm:text-[10px] font-bold px-2 py-1 rounded shadow-sm z-20"
              >
                {flow.titleOutput1}
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 4.5 }}
                className="absolute bottom-2 right-2 bg-emerald-500 text-white text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded shadow-lg z-20 flex items-center gap-1"
              >
                <SparklesIcon className="w-3 h-3" /> {flow.titleOutput2}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
