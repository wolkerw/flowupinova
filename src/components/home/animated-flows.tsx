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
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/auth/auth-provider";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const WHATSAPP_LINK =
  "https://wa.me/555199922177?text=Olá!%20Gostaria%20de%20saber%20mais%20sobre%20a%20NumVapt.";

export const TypingAnimation = ({ text, theme = "blue" }: { text: string; theme?: string }) => {
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
      <span
        className={`ml-0.5 inline-block h-3.5 w-1.5 animate-pulse align-middle ${theme === "pink" ? "bg-pink-500" : "bg-orange-500"}`}
      ></span>
    </span>
  );
};

const FLOWS = [
  {
    id: 1,
    titleInput: "FOTO 1: SUA ROUPA",
    imageInput: "/demo-clothing-isolated.png",
    promptTitle: "INPUT DA IDEIA (TEXTO)",
    promptText:
      "Modelo profissional vestindo esta jaqueta em Tóquio à noite, com luzes neon e visual cinematográfico...",
    imageOutput: "/demo-clothing-model.png",
    titleOutput1: "Modelo Real + Roupa",
    titleOutput2: "Fusão Pronta",
    isHybrid: false,
    theme: "blue",
  },
  {
    id: 2,
    titleInput: "FOTO 1: SEU PRODUTO",
    imageInput: "/Screenshot_27.png",
    promptTitle: "INPUT DA IDEIA (TEXTO)",
    promptText:
      "faça uma foto de catálogo deste hambúrguer e coloque-o numa mesa de lanchonete moderna...",
    imageOutput: "/numvapt-1783544518718.png",
    titleOutput1: "Cenário IA",
    titleOutput2: "Arte Pronta",
    isHybrid: false,
    theme: "blue",
  },
  {
    id: 3,
    titleInput: "FOTO 1: SELFIE (ROSTO)",
    imageInput: "/demo-hybrid-selfie.png",
    titleInput2: "FOTO 2: PROJETO/CENÁRIO",
    imageInput2: "/demo-hybrid-project.png",
    promptTitle: "INSTRUÇÕES DE MESCLAGEM",
    promptText:
      "Combine o rosto da Foto 1 com o cenário da Foto 2, mantendo a iluminação realista...",
    imageOutput: "/demo-hybrid-result.png",
    titleOutput1: "Rosto + Projeto Integrados",
    titleOutput2: "Fusão Pronta",
    isHybrid: true,
    theme: "pink",
  },
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
    <div className="relative h-[500px] w-full md:h-[400px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={flow.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <div className="flex h-full w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border border-slate-800 bg-[#0f172a] p-4 shadow-2xl sm:gap-6 sm:p-6 md:flex-row">
            {/* Left: Input Image */}
            {/* Left: Input Image(s) */}
            <div className="flex shrink-0 flex-col items-center">
              {flow.isHybrid ? (
                <div className="flex flex-col items-center gap-2 sm:gap-3">
                  <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border border-slate-700 bg-slate-800 p-2 shadow-lg sm:h-28 sm:w-28">
                    <div className="absolute left-1 top-1 z-20 rounded bg-black/80 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white sm:text-[9px]">
                      {flow.titleInput}
                    </div>
                    <div className="relative z-10 h-full w-full">
                      <Image
                        src={flow.imageInput}
                        alt="Input 1"
                        fill
                        className="rounded-md object-cover"
                      />
                    </div>
                    <motion.div
                      className="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-blue-400/20 to-transparent"
                      initial={{ top: "-100%" }}
                      animate={{ top: "200%" }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                    />
                  </div>
                  <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border border-slate-700 bg-slate-800 p-2 shadow-lg sm:h-28 sm:w-28">
                    <div className="absolute left-1 top-1 z-20 rounded bg-black/80 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white sm:text-[9px]">
                      {flow.titleInput2}
                    </div>
                    <div className="relative z-10 h-full w-full">
                      <Image
                        src={flow.imageInput2!}
                        alt="Input 2"
                        fill
                        className="rounded-md object-cover"
                      />
                    </div>
                    <motion.div
                      className="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-blue-400/20 to-transparent"
                      initial={{ top: "-100%" }}
                      animate={{ top: "200%" }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                    />
                  </div>
                </div>
              ) : (
                <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-xl border border-slate-700 bg-slate-800 p-3 sm:h-32 sm:w-32">
                  <div className="absolute left-2 top-2 z-20 rounded bg-black/80 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white sm:text-[9px]">
                    {flow.titleInput}
                  </div>
                  <div className="relative z-10 h-full w-full">
                    <Image src={flow.imageInput} alt="Original" fill className="object-contain" />
                  </div>
                  <motion.div
                    className="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-blue-400/20 to-transparent"
                    initial={{ top: "-100%" }}
                    animate={{ top: "200%" }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 0.5 }}
                  />
                </div>
              )}
            </div>

            {/* Center: Prompt */}
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <p
                className={`mb-2 text-[10px] font-bold uppercase tracking-widest ${flow.theme === "pink" ? "text-pink-500" : "text-orange-500"}`}
              >
                {flow.promptTitle}
              </p>
              <div
                className={`w-full max-w-[280px] rounded-xl border bg-slate-800/50 p-3 text-left sm:p-4 ${flow.theme === "pink" ? "border-pink-900/50" : "border-slate-700"}`}
              >
                <p
                  className={`mb-2 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide ${flow.theme === "pink" ? "text-pink-400" : "text-slate-400"}`}
                >
                  {flow.theme === "pink" && (
                    <span className="inline-block h-2 w-2 rounded-full bg-pink-500"></span>
                  )}
                  PROMPT DE IA
                </p>
                <p className="h-24 font-mono text-[11px] leading-relaxed text-slate-300 sm:text-xs">
                  <TypingAnimation text={flow.promptText} theme={flow.theme} />
                </p>
              </div>
              <motion.div
                animate={{ x: [0, 10, 0], opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className={`mt-3 flex items-center font-mono text-lg font-bold tracking-widest sm:mt-4 ${flow.theme === "pink" ? "text-pink-500" : "text-indigo-400"}`}
              >
                ------&gt;
              </motion.div>
            </div>

            {/* Right: Output Image */}
            <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 md:aspect-[3/4] md:w-56 lg:w-64">
              <motion.div
                initial={{ opacity: 0, filter: "blur(10px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                transition={{ duration: 1, delay: 3 }} // Começa após 3s
                className="absolute inset-0 z-10"
              >
                <Image src={flow.imageOutput} alt="Resultado" fill className="object-cover" />
              </motion.div>

              <div className="absolute inset-0 flex items-center justify-center opacity-30">
                <Bot className="h-12 w-12 animate-pulse text-slate-500" />
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 4 }}
                className="absolute left-2 top-2 z-20 rounded bg-teal-500/90 px-2 py-1 text-[9px] font-bold text-white shadow-sm sm:text-[10px]"
              >
                {flow.titleOutput1}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 4.5 }}
                className="absolute bottom-2 right-2 z-20 rounded bg-emerald-500 px-3 py-1.5 text-[10px] font-bold text-white shadow-lg sm:text-xs"
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
    imageSelfie: "/Screenshot_26.png",
    imageReference: "/3d775c5812ab51fe760005858f34926d.png",
    promptText:
      "Extrair estilo fotográfico, traços e iluminação da imagem de referência e aplicar na selfie...",
    imageOutput:
      "/users_m4hhWY415jZrmOZHYVXyqxrPxtg1_mediaGallery_avatar_d89306c0-7031-415a-bcc1-02b40f72b3cc.png",
    titleOutput1: "Estilo Transferido",
    titleOutput2: "Avatar IA",
  },
  {
    id: 2,
    imageSelfie: "/Screenshot_28.png",
    imageReference: "/download (2).jpeg",
    promptText:
      "Extrair estilo fotográfico e iluminação da imagem de referência e aplicar perfeitamente na selfie da modelo feminina...",
    imageOutput:
      "/users_m4hhWY415jZrmOZHYVXyqxrPxtg1_mediaGallery_avatar_d65f95a0-1b6e-43c3-bf1d-5df1f3d883b9.png",
    titleOutput1: "Estilo Transferido",
    titleOutput2: "Avatar IA",
  },
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
    <div className="relative h-[500px] w-full md:h-[400px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex} // Usa o currentIndex para forçar o re-render
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <div className="flex h-full w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border border-slate-800 bg-[#0f172a] p-4 shadow-2xl sm:gap-6 sm:p-6 md:flex-row">
            {/* Left: Input Images */}
            <div className="flex shrink-0 flex-col items-center gap-3">
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Selfie */}
                <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border border-slate-700 bg-slate-800 p-2 shadow-lg sm:h-28 sm:w-28">
                  <div className="absolute left-1 top-1 z-20 rounded bg-black/80 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white sm:text-[9px]">
                    SELFIE
                  </div>
                  <div className="relative z-10 h-full w-full">
                    <Image
                      src={flow.imageSelfie}
                      alt="Selfie"
                      fill
                      className="rounded-md object-cover"
                    />
                  </div>
                  <motion.div
                    className="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-blue-400/20 to-transparent"
                    initial={{ top: "-100%" }}
                    animate={{ top: "200%" }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                  />
                </div>

                <div className="text-lg font-bold text-slate-500 sm:text-xl">+</div>

                {/* Reference */}
                <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border border-slate-700 bg-slate-800 p-2 shadow-lg sm:h-28 sm:w-28">
                  <div className="absolute left-1 top-1 z-20 rounded bg-black/80 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white sm:text-[9px]">
                    REF
                  </div>
                  <div className="relative z-10 h-full w-full">
                    <Image
                      src={flow.imageReference}
                      alt="Referência"
                      fill
                      className="rounded-md object-cover"
                    />
                  </div>
                  <motion.div
                    className="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-blue-400/20 to-transparent"
                    initial={{ top: "-100%" }}
                    animate={{ top: "200%" }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                  />
                </div>
              </div>
            </div>

            {/* Center: Prompt */}
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <p className="mb-2 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-orange-500">
                INPUT DA IDEIA
              </p>

              <div className="flex h-auto min-h-[120px] w-full max-w-[280px] flex-col gap-3 rounded-xl border border-slate-700 bg-slate-800/50 p-3 text-left sm:p-4">
                <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                  PROMPT DE IA
                </p>

                {/* Text Prompt */}
                <div className="flex-1">
                  <p className="font-mono text-[11px] leading-relaxed text-slate-300 sm:text-[11.5px]">
                    <TypingAnimation text={flow.promptText} />
                  </p>
                </div>
              </div>
              <motion.div
                animate={{ x: [0, 10, 0], opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="mt-3 flex items-center font-mono text-lg font-bold tracking-widest text-indigo-400 sm:mt-4"
              >
                ------&gt;
              </motion.div>
            </div>

            {/* Right: Output Image */}
            <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 md:aspect-[3/4] md:w-56 lg:w-64">
              <motion.div
                initial={{ opacity: 0, filter: "blur(10px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                transition={{ duration: 1, delay: 3 }}
                className="absolute inset-0 z-10"
              >
                <Image src={flow.imageOutput} alt="Resultado" fill className="object-cover" />
              </motion.div>

              <div className="absolute inset-0 flex items-center justify-center opacity-30">
                <UserCircle2 className="h-12 w-12 animate-pulse text-slate-500" />
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 4 }}
                className="absolute left-2 top-2 z-20 rounded bg-blue-600/90 px-2 py-1 text-[9px] font-bold text-white shadow-sm sm:text-[10px]"
              >
                {flow.titleOutput1}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 4.5 }}
                className="absolute bottom-2 right-2 z-20 flex items-center gap-1 rounded bg-emerald-500 px-3 py-1.5 text-[10px] font-bold text-white shadow-lg sm:text-xs"
              >
                <SparklesIcon className="h-3 w-3" /> {flow.titleOutput2}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
