"use client";

import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Sparkles,
  ArrowRight,
  Loader2,
  UploadCloud,
  X,
  Box,
  MessageSquare,
  FlaskConical,
  Scale,
  Home,
  User,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useWizard } from "../context/WizardContext";
import { LayoutStyleSelector, LayoutStyleId } from "./LayoutStyleSelector";
import { ProductPresetSelector, ProductPresetId } from "./ProductPresetSelector";


const PackshotAnimationDemo = () => {
  const [activeDemoTab, setActiveDemoTab] = React.useState<"text-ambientation" | "packshot-hybrid">(
    "text-ambientation"
  );

  // Digitação do prompt para a Opção A
  const [typedText, setTypedText] = React.useState("");
  const [loopTrigger, setLoopTrigger] = React.useState(0);
  const fullTextA =
    "Modelo profissional vestindo esta jaqueta em Tóquio à noite, com luzes de neon...";

  // Digitação do prompt para a Opção B
  const [typedTextB, setTypedTextB] = React.useState("");
  const [loopTriggerB, setLoopTriggerB] = React.useState(0);
  const fullTextB =
    "Substitua o produto da foto de referência pelo meu produto, mantendo o cenário fiel...";

  React.useEffect(() => {
    if (activeDemoTab !== "text-ambientation") {
      setTypedText("");
      return;
    }
    let index = 0;
    setTypedText("");
    const interval = setInterval(() => {
      index++;
      setTypedText(fullTextA.substring(0, index));
      if (index >= fullTextA.length) {
        clearInterval(interval);
        const timeout = setTimeout(() => {
          setLoopTrigger((prev) => prev + 1);
        }, 3000);
        return () => clearTimeout(timeout);
      }
    }, 60);
    return () => clearInterval(interval);
  }, [activeDemoTab, loopTrigger]);

  React.useEffect(() => {
    if (activeDemoTab !== "packshot-hybrid") {
      setTypedTextB("");
      return;
    }
    let index = 0;
    setTypedTextB("");
    const interval = setInterval(() => {
      index++;
      setTypedTextB(fullTextB.substring(0, index));
      if (index >= fullTextB.length) {
        clearInterval(interval);
        const timeout = setTimeout(() => {
          setLoopTriggerB((prev) => prev + 1);
        }, 3000);
        return () => clearTimeout(timeout);
      }
    }, 55);
    return () => clearInterval(interval);
  }, [activeDemoTab, loopTriggerB]);

  return (
    <div className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-gray-100 bg-gray-50/50 p-6 shadow-sm">
      {/* Abas Superiores para alternar a demonstração */}
      <div className="mb-5 flex justify-center gap-3">
        <button
          type="button"
          onClick={() => setActiveDemoTab("text-ambientation")}
          className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
            activeDemoTab === "text-ambientation"
              ? "bg-accent text-white shadow-md shadow-accent/20"
              : "bg-slate-200/80 text-slate-600 hover:bg-slate-300"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Opção A: Produto em Uso
        </button>
        <button
          type="button"
          onClick={() => setActiveDemoTab("packshot-hybrid")}
          className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
            activeDemoTab === "packshot-hybrid"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
              : "bg-slate-200/80 text-slate-600 hover:bg-slate-300"
          }`}
        >
          <Box className="h-3.5 w-3.5" />
          Opção B: Produto em Uso com Referência
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeDemoTab === "text-ambientation" ? (
          <motion.div
            key="demo-text-ambientation"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="relative flex h-60 items-center justify-between gap-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-inner"
          >
            {/* LADO ESQUERDO: Foto 1 - Sua Roupa */}
            <div className="z-10 flex flex-col gap-4">
              <div className="relative flex h-36 w-32 flex-col items-center justify-center overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900 text-center">
                <span className="absolute left-1.5 top-1.5 z-20 rounded bg-black/50 px-1 py-0.5 text-[7px] font-bold uppercase tracking-wider text-white">
                  Foto 1: Sua Roupa
                </span>

                {/* Fundo de estúdio plano cinza */}
                <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-800 to-slate-900" />

                {/* Jaqueta puffer que esmaece durante a fusão */}
                <motion.div
                  className="z-10 cursor-default"
                  animate={{
                    opacity: [1, 0.25, 0.25, 1, 1],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    times: [0, 0.15, 0.85, 0.95, 1],
                  }}
                >
                  <img
                    src="/demo-clothing-isolated.png"
                    alt="Roupa Isolada"
                    className="h-24 w-20 object-contain"
                  />
                </motion.div>
              </div>
            </div>

            {/* CENTRO: Caixa do Prompt de Texto Animado */}
            <div className="z-10 flex flex-1 flex-col items-center justify-center px-2">
              <span className="mb-2 animate-pulse text-center text-[7px] font-extrabold uppercase tracking-widest text-accent">
                Input da Ideia (Texto)
              </span>

              <div className="relative w-full max-w-[200px] rounded-lg border border-slate-700 bg-slate-950/80 p-2.5 text-left shadow-lg">
                <div className="mb-1 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 animate-ping rounded-full bg-accent" />
                  <span className="text-[7px] font-bold uppercase text-slate-500">
                    Prompt de IA
                  </span>
                </div>
                <div className="min-h-[44px] break-words font-mono text-[9px] leading-snug text-slate-300">
                  {typedText}
                  <span
                    className="ml-0.5 inline-block h-3 w-1 animate-pulse bg-accent"
                    style={{ verticalAlign: "middle" }}
                  />
                </div>
              </div>

              {/* Conector de fluxo */}
              <div className="relative mt-2 flex h-8 w-16 items-center justify-center">
                <svg width="64" height="24" viewBox="0 0 64 24" fill="none">
                  <path
                    d="M2 12 H 58"
                    stroke="#6366f1"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    strokeLinecap="round"
                  />
                  <path
                    d="M50 8L58 12L50 16"
                    stroke="#6366f1"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            {/* LADO DIREITO: Foto 3 - Exemplo da Modelo Vestindo a Roupa */}
            <div className="relative flex h-52 w-64 flex-col items-center justify-center overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
              <span className="absolute right-2 top-2 z-20 rounded bg-black/50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                Foto 3: Imagem Gerada
              </span>

              {/* Fundo do Cenário Vazio antes da fusão */}
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/60" />

              <motion.div
                className="z-15 absolute flex flex-col items-center justify-center rounded-lg border border-dashed border-white/50 bg-black/40 p-2 opacity-40"
                animate={{
                  opacity: [0.5, 0.5, 0, 0, 0.5],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  times: [0, 0.15, 0.45, 0.85, 1],
                }}
              >
                <Sparkles className="h-5 w-5 animate-spin text-white" />
                <span className="mt-1 text-[7px] font-bold leading-none text-white">
                  Vestindo modelo...
                </span>
              </motion.div>

              {/* Roupa da Foto 1 que viaja em direção à Foto 3 */}
              <motion.div
                className="pointer-events-none absolute z-20 flex flex-col items-center"
                style={{
                  top: "15%",
                }}
                animate={{
                  x: [-240, -240, 0, 0, -240],
                  y: [-12, -12, 10, 10, -12],
                  scale: [0.6, 0.6, 0.8, 0.8, 0.6],
                  opacity: [0, 1, 1, 0, 0],
                  filter: [
                    "drop-shadow(0 0 0px rgba(99,102,241,0))",
                    "drop-shadow(0 0 10px rgba(99,102,241,0.9))",
                    "drop-shadow(0 0 10px rgba(99,102,241,0.9))",
                    "drop-shadow(0 0 0px rgba(99,102,241,0))",
                    "drop-shadow(0 0 0px rgba(99,102,241,0))",
                  ],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  times: [0, 0.15, 0.45, 0.55, 1],
                }}
              >
                <div className="absolute -top-7 z-30 animate-bounce whitespace-nowrap rounded-full bg-accent px-1.5 py-0.5 text-[8px] font-bold text-white shadow-md">
                  Vestindo Roupa...
                </div>

                <img
                  src="/demo-clothing-isolated.png"
                  alt="Roupa em Viagem"
                  className="h-24 w-20 object-contain"
                />
              </motion.div>

              {/* Imagem real da modelo vestindo a jaqueta puffer vermelha */}
              <motion.div
                className="pointer-events-none absolute inset-0 z-30"
                animate={{
                  opacity: [0, 0, 0, 1, 1, 0],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  times: [0, 0.2, 0.45, 0.55, 0.93, 1],
                }}
              >
                <img
                  src="/demo-clothing-model.png"
                  alt="Modelo de IA no Cenário"
                  className="h-full w-full object-cover"
                />

                {/* Banner didático */}
                <div className="z-45 absolute left-2 top-2 rounded bg-emerald-500/90 px-2 py-0.5 text-[8px] font-bold text-white shadow-sm">
                  Modelo Real + Roupa
                </div>

                {/* Efeito de flash na fusão */}
                <motion.div
                  className="absolute inset-0 z-40 skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{
                    left: ["-100%", "-100%", "200%", "200%", "-100%"],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    times: [0, 0.55, 0.75, 0.85, 1],
                    ease: "easeOut",
                  }}
                />
              </motion.div>

              <span className="absolute bottom-2 right-2 z-40 flex items-center gap-1 rounded bg-emerald-500/90 px-2 py-0.5 text-[9px] font-bold text-white">
                <span className="h-2 w-2 animate-ping rounded-full bg-white" />
                Fusão Pronta
              </span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="demo-packshot-hybrid"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="relative flex h-60 items-center justify-between gap-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-inner"
          >
            {/* Lado Esquerdo: Fotos de Entrada (1 e 2) empilhadas */}
            <div className="z-10 flex flex-col gap-4">
              {/* Caixa 1: Foto 1 - Seu Produto */}
              <div className="relative flex h-24 w-28 flex-col items-center justify-center overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900 text-center">
                <span className="absolute left-1.5 top-1 z-20 rounded bg-black/50 px-1 py-0.5 text-[7px] font-bold uppercase tracking-wider text-white">
                  Foto 1: Produto
                </span>

                <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-800 to-slate-900" />

                <motion.div
                  className="z-10 cursor-default"
                  animate={{
                    opacity: [1, 0.25, 0.25, 1, 1],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    times: [0, 0.15, 0.85, 0.95, 1],
                  }}
                >
                  <img
                    src="/demo-product-isolated.png"
                    alt="Seu Produto"
                    className="h-20 w-16 scale-[0.9] object-contain"
                  />
                </motion.div>
              </div>

              {/* Caixa 2: Foto 2 - Cenário Referência */}
              <div className="relative flex h-24 w-28 flex-col items-center justify-center overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900 text-center">
                <span className="absolute left-1.5 top-1 z-20 rounded bg-black/50 px-1 py-0.5 text-[7px] font-bold uppercase tracking-wider text-white">
                  Foto 2: Referência
                </span>

                <div className="absolute inset-0 z-0">
                  <img
                    src="/demo-scenario.png"
                    alt="Cenário Referência"
                    className="h-full w-full object-cover opacity-80"
                  />
                </div>

                <motion.div
                  className="absolute z-10 h-2 w-2 rounded-full bg-cyan-400 blur-[2px]"
                  animate={{
                    opacity: [1, 0.3, 0.3, 1, 1],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    times: [0, 0.15, 0.85, 0.95, 1],
                  }}
                />
              </div>
            </div>

            {/* CENTRO: Caixa do Prompt de Texto Animado (Opção B) */}
            <div className="z-10 flex flex-1 flex-col items-center justify-center px-2">
              <span className="mb-2 animate-pulse text-center text-[7px] font-extrabold uppercase tracking-widest text-blue-400">
                Instrução de Troca
              </span>

              <div className="relative w-full max-w-[200px] rounded-lg border border-blue-900/60 bg-slate-950/80 p-2.5 text-left shadow-lg">
                <div className="mb-1 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 animate-ping rounded-full bg-blue-500" />
                  <span className="text-[7px] font-bold uppercase text-slate-500">
                    Prompt de IA
                  </span>
                </div>
                <div className="min-h-[44px] break-words font-mono text-[9px] leading-snug text-slate-300">
                  {typedTextB}
                  <span
                    className="ml-0.5 inline-block h-3 w-1 animate-pulse bg-blue-500"
                    style={{ verticalAlign: "middle" }}
                  />
                </div>
              </div>

              {/* Conector de fluxo */}
              <div className="relative mt-2 flex h-8 w-16 items-center justify-center">
                <svg width="64" height="24" viewBox="0 0 64 24" fill="none">
                  <path
                    d="M2 12 H 58"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    strokeLinecap="round"
                  />
                  <path
                    d="M50 8L58 12L50 16"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            {/* Lado Direito: Foto 3 - Exemplo Real */}
            <div className="relative flex h-52 w-64 flex-col items-center justify-center overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
              <span className="absolute right-2 top-2 z-20 rounded bg-black/50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                Foto 3: Imagem Gerada
              </span>

              <div className="absolute inset-0 z-0">
                <img
                  src="/demo-scenario.png"
                  alt="Cenário de Estúdio"
                  className="h-full w-full object-cover"
                />
              </div>

              <motion.div
                className="absolute z-10 flex flex-col items-center justify-center rounded-lg border border-dashed border-white/50 bg-black/40 p-2 opacity-40"
                animate={{
                  opacity: [0.5, 0.5, 0, 0, 0.5],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  times: [0, 0.15, 0.45, 0.85, 1],
                }}
              >
                <Sparkles className="h-5 w-5 animate-spin text-white" />
                <span className="mt-1 text-[7px] font-bold leading-none text-white">
                  Gerando...
                </span>
              </motion.div>

              {/* Produto que viaja */}
              <motion.div
                className="pointer-events-none absolute z-20 flex flex-col items-center"
                style={{
                  mixBlendMode: "screen",
                  top: "10%",
                }}
                animate={{
                  x: [-240, -240, 0, 0, -240],
                  y: [-52, -52, 10, 10, -52],
                  scale: [0.65, 0.65, 0.75, 0.75, 0.65],
                  opacity: [0, 1, 1, 0, 0],
                  filter: [
                    "drop-shadow(0 0 0px rgba(99,102,241,0))",
                    "drop-shadow(0 0 10px rgba(99,102,241,0.9))",
                    "drop-shadow(0 0 10px rgba(99,102,241,0.9))",
                    "drop-shadow(0 0 0px rgba(99,102,241,0))",
                    "drop-shadow(0 0 0px rgba(99,102,241,0))",
                  ],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  times: [0, 0.15, 0.45, 0.55, 1],
                }}
              >
                <div className="absolute -top-7 z-30 animate-bounce whitespace-nowrap rounded-full bg-accent px-1.5 py-0.5 text-[8px] font-bold text-white shadow-md">
                  Copiando Produto...
                </div>

                <img
                  src="/demo-product-isolated.png"
                  alt="Produto em Viagem"
                  className="h-32 w-24 object-contain"
                />
              </motion.div>

              {/* Brilho do Cenário */}
              <motion.div
                className="pointer-events-none absolute z-20 h-8 w-8 rounded-full bg-cyan-400/30 blur-md"
                style={{ bottom: "10%" }}
                animate={{
                  x: [-240, -240, 0, 0, -240],
                  y: [52, 52, -10, -10, 52],
                  scale: [1, 1.2, 1, 0, 1],
                  opacity: [0, 0.8, 0.8, 0, 0],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  times: [0, 0.15, 0.45, 0.55, 1],
                }}
              />

              {/* Foto 3: Imagem Completa Fundida */}
              <motion.div
                className="pointer-events-none absolute inset-0 z-30"
                animate={{
                  opacity: [0, 0, 0, 1, 1, 0],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  times: [0, 0.2, 0.45, 0.55, 0.93, 1],
                }}
              >
                <img
                  src="/demo-result.png"
                  alt="Resultado Final Comercial"
                  className="h-full w-full object-cover"
                />

                <div className="z-45 absolute left-2 top-2 rounded bg-emerald-500/90 px-2 py-0.5 text-[8px] font-bold text-white shadow-sm">
                  Cenário Completo + Produto
                </div>

                <motion.div
                  className="absolute inset-0 z-40 skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{
                    left: ["-100%", "-100%", "200%", "200%", "-100%"],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    times: [0, 0.55, 0.75, 0.85, 1],
                    ease: "easeOut",
                  }}
                />
              </motion.div>

              <span className="absolute bottom-2 right-2 z-40 flex items-center gap-1 rounded bg-emerald-500/90 px-2 py-0.5 text-[9px] font-bold text-white">
                <span className="h-2 w-2 animate-ping rounded-full bg-white" />
                Fusão Pronta
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const HybridAnimationDemo = () => {
  const [typedText, setTypedText] = React.useState("");
  const [loopTrigger, setLoopTrigger] = React.useState(0);
  const fullText =
    "Combine o rosto da Foto 1 de forma natural em frente à casa moderna da Foto 2 durante o pôr do sol...";

  React.useEffect(() => {
    let index = 0;
    setTypedText("");
    const interval = setInterval(() => {
      index++;
      setTypedText(fullText.substring(0, index));
      if (index >= fullText.length) {
        clearInterval(interval);
        const timeout = setTimeout(() => {
          setLoopTrigger((prev) => prev + 1);
        }, 3000);
        return () => clearTimeout(timeout);
      }
    }, 55);
    return () => clearInterval(interval);
  }, [loopTrigger]);

  return (
    <div className="relative mx-auto mb-6 w-full max-w-3xl overflow-hidden rounded-2xl border border-gray-100 bg-gray-50/50 p-6 shadow-sm">
      <div className="mb-4 flex flex-col items-center">
        <span className="rounded-full bg-pink-500/10 px-3 py-1 text-xs font-bold text-pink-600">
          Demonstração do Fluxo Híbrido
        </span>
        <h4 className="mt-1.5 text-center text-sm font-semibold text-gray-800">
          Veja como a IA mescla seu rosto com o cenário do projeto:
        </h4>
      </div>

      <div className="relative flex h-60 items-center justify-between gap-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-inner">
        {/* Lado Esquerdo: Selfie (1) + Projeto (2) empilhados */}
        <div className="z-10 flex flex-col gap-4">
          {/* Foto 1: Sua Selfie */}
          <div className="relative flex h-24 w-28 flex-col items-center justify-center overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900 text-center">
            <span className="absolute left-1.5 top-1 z-20 rounded bg-black/50 px-1 py-0.5 text-[7px] font-bold uppercase tracking-wider text-white">
              Foto 1: Selfie (Rosto)
            </span>
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-800 to-slate-900" />
            <motion.div
              className="z-10 cursor-default"
              animate={{
                opacity: [1, 0.25, 0.25, 1, 1],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                times: [0, 0.15, 0.85, 0.95, 1],
              }}
            >
              <img
                src="/demo-hybrid-selfie.png"
                alt="Sua Selfie"
                className="h-20 w-16 rounded-md object-cover"
              />
            </motion.div>
          </div>

          {/* Foto 2: Foto do Projeto */}
          <div className="relative flex h-24 w-28 flex-col items-center justify-center overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900 text-center">
            <span className="absolute left-1.5 top-1 z-20 rounded bg-black/50 px-1 py-0.5 text-[7px] font-bold uppercase tracking-wider text-white">
              Foto 2: Projeto/Cenário
            </span>
            <div className="absolute inset-0 z-0">
              <img
                src="/demo-hybrid-project.png"
                alt="Projeto"
                className="h-full w-full object-cover opacity-80"
              />
            </div>
            <motion.div
              className="absolute z-10 h-2 w-2 rounded-full bg-pink-400 blur-[2px]"
              animate={{
                opacity: [1, 0.3, 0.3, 1, 1],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                times: [0, 0.15, 0.85, 0.95, 1],
              }}
            />
          </div>
        </div>

        {/* CENTRO: Caixa do Prompt de Fusão Híbrida */}
        <div className="z-10 flex flex-1 flex-col items-center justify-center px-2">
          <span className="mb-2 animate-pulse text-center text-[7px] font-extrabold uppercase tracking-widest text-pink-400">
            Instruções de Mesclagem
          </span>
          <div className="relative w-full max-w-[200px] rounded-lg border border-pink-900/60 bg-slate-950/80 p-2.5 text-left shadow-lg">
            <div className="mb-1 flex items-center gap-1">
              <span className="h-1.5 w-1.5 animate-ping rounded-full bg-pink-500" />
              <span className="text-[7px] font-bold uppercase text-slate-500">Prompt de IA</span>
            </div>
            <div className="min-h-[44px] break-words font-mono text-[9px] leading-snug text-slate-300">
              {typedText}
              <span
                className="ml-0.5 inline-block h-3 w-1 animate-pulse bg-pink-500"
                style={{ verticalAlign: "middle" }}
              />
            </div>
          </div>

          {/* Conector de fluxo */}
          <div className="relative mt-2 flex h-8 w-16 items-center justify-center">
            <svg width="64" height="24" viewBox="0 0 64 24" fill="none">
              <path
                d="M2 12 H 58"
                stroke="#ec4899"
                strokeWidth="2"
                strokeDasharray="4 4"
                strokeLinecap="round"
              />
              <path
                d="M50 8L58 12L50 16"
                stroke="#ec4899"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Lado Direito: Foto 3 - Resultado Final Híbrido */}
        <div className="relative flex h-52 w-64 flex-col items-center justify-center overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
          <span className="absolute right-2 top-2 z-20 rounded bg-black/50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
            Foto 3: Imagem Gerada
          </span>
          <div className="absolute inset-0 z-0">
            <img
              src="/demo-hybrid-project.png"
              alt="Fundo Casa"
              className="h-full w-full object-cover"
            />
          </div>

          <motion.div
            className="absolute z-10 flex flex-col items-center justify-center rounded-lg border border-dashed border-white/50 bg-black/40 p-2 opacity-40"
            animate={{
              opacity: [0.5, 0.5, 0, 0, 0.5],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              times: [0, 0.15, 0.45, 0.85, 1],
            }}
          >
            <Sparkles className="h-5 w-5 animate-spin text-white" />
            <span className="mt-1 text-[7px] font-bold leading-none text-white">Combinando...</span>
          </motion.div>

          {/* Rosto que viaja */}
          <motion.div
            className="pointer-events-none absolute z-20 flex flex-col items-center"
            style={{
              top: "12%",
            }}
            animate={{
              x: [-240, -240, 0, 0, -240],
              y: [-52, -52, 10, 10, -52],
              scale: [0.55, 0.55, 0.65, 0.65, 0.55],
              opacity: [0, 1, 1, 0, 0],
              filter: [
                "drop-shadow(0 0 0px rgba(236,72,153,0))",
                "drop-shadow(0 0 10px rgba(236,72,153,0.9))",
                "drop-shadow(0 0 10px rgba(236,72,153,0.9))",
                "drop-shadow(0 0 0px rgba(236,72,153,0))",
                "drop-shadow(0 0 0px rgba(236,72,153,0))",
              ],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
              times: [0, 0.15, 0.45, 0.55, 1],
            }}
          >
            <div className="absolute -top-7 z-30 animate-bounce whitespace-nowrap rounded-full bg-pink-500 px-1.5 py-0.5 text-[8px] font-bold text-white shadow-md">
              Mesclando Rosto...
            </div>
            <img
              src="/demo-hybrid-selfie.png"
              alt="Rosto em Viagem"
              className="h-20 w-16 rounded-full border-2 border-pink-500 object-cover"
            />
          </motion.div>

          {/* Brilho da fusão */}
          <motion.div
            className="pointer-events-none absolute z-20 h-8 w-8 rounded-full bg-pink-500/30 blur-md"
            style={{ bottom: "10%" }}
            animate={{
              x: [-240, -240, 0, 0, -240],
              y: [52, 52, -10, -10, 52],
              scale: [1, 1.2, 1, 0, 1],
              opacity: [0, 0.8, 0.8, 0, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
              times: [0, 0.15, 0.45, 0.55, 1],
            }}
          />

          {/* Foto 3: Imagem Completa Fundida */}
          <motion.div
            className="pointer-events-none absolute inset-0 z-30"
            animate={{
              opacity: [0, 0, 0, 1, 1, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              times: [0, 0.2, 0.45, 0.55, 0.93, 1],
            }}
          >
            <img
              src="/demo-hybrid-result.png"
              alt="Resultado Final Híbrido"
              className="h-full w-full object-cover"
            />

            <div className="z-45 absolute left-2 top-2 rounded bg-emerald-500/90 px-2 py-0.5 text-[8px] font-bold text-white shadow-sm">
              Rosto + Projeto Integrados
            </div>

            <motion.div
              className="absolute inset-0 z-40 skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{
                left: ["-100%", "-100%", "200%", "200%", "-100%"],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                times: [0, 0.55, 0.75, 0.85, 1],
                ease: "easeOut",
              }}
            />
          </motion.div>

          <span className="absolute bottom-2 right-2 z-40 flex items-center gap-1 rounded bg-emerald-500/90 px-2 py-0.5 text-[9px] font-bold text-white">
            <span className="h-2 w-2 animate-ping rounded-full bg-white" />
            Fusão Pronta
          </span>
        </div>
      </div>
    </div>
  );
};

export const Step1Idea = () => {
  const {
    postSummary,
    setPostSummary: onPostSummaryChange,
    handleGenerateText: onGenerate,
    isLoading,
    referenceImagePreview,
    handleReferenceImageChange: onReferenceImageChange,
    referenceDescription,
    setReferenceDescription: onReferenceDescriptionChange,
    mode,
    referenceLink,
    setReferenceLink: onReferenceLinkChange,
    generateTextSuggestions,
    setGenerateTextSuggestions,
    setInspirationFile: onInspirationFileChange,
    secondaryReferenceImagePreview,
    handleSecondaryReferenceImageChange: onSecondaryReferenceImageChange,
    secondaryReferenceDescription,
    setSecondaryReferenceDescription: onSecondaryReferenceDescriptionChange,
    hybridPriority,
    setHybridPriority,
    productWorkflow,
    setProductWorkflow,
    layoutStyle,
    setLayoutStyle,
    insertTextOnImage,
    setInsertTextOnImage,
    productHeadline,
    setProductHeadline,
    referenceReplicationMode,
    setReferenceReplicationMode,
  } = useWizard();

  const hideImageOption = mode === "concept";
  const hideTextOption = mode === "reference-photo";
  const isLinkMode = mode === "reference-link" || mode === "reference-inspiration";
  const isHybridMode = mode === "reference-hybrid";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const secondaryFileInputRef = useRef<HTMLInputElement>(null);

  // Preenche a descrição padrão automaticamente se estiver em branco no modo de referência
  React.useEffect(() => {
    if (mode === "reference-inspiration" && !referenceDescription.trim()) {
      onReferenceDescriptionChange(
        "Criar um post profissional mantendo fielmente o layout, as cores, o cenário e a estrutura da referência de inspiração, adaptando a arte conceitualmente para as características de negócios da minha marca."
      );
    } else if (isLinkMode && !referenceDescription.trim()) {
      onReferenceDescriptionChange(
        "Criar um post profissional mantendo fielmente o layout, as cores e a estrutura da referência de inspiração, integrando o meu produto ou pessoa de forma perfeitamente harmônica."
      );
    }
  }, [isLinkMode, mode, referenceDescription, onReferenceDescriptionChange]);

  React.useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      let imageFile: File | null = null;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            imageFile = file;
            break;
          }
        }
      }

      if (!imageFile) return;

      // Direcionar inteligentemente com base no modo ativo
      if (mode === "concept") {
        onInspirationFileChange?.(imageFile);
        onReferenceLinkChange?.(URL.createObjectURL(imageFile));
      } else if (isLinkMode) {
        if (!referenceLink) {
          onInspirationFileChange?.(imageFile);
          onReferenceLinkChange?.(URL.createObjectURL(imageFile));
        } else if (!referenceImagePreview) {
          onReferenceImageChange(imageFile);
        }
      } else if (mode === "reference-photo") {
        if (!referenceImagePreview) {
          onReferenceImageChange(imageFile);
        } else if (productWorkflow === "packshot-hybrid" && !secondaryReferenceImagePreview) {
          onSecondaryReferenceImageChange(imageFile);
        }
      } else if (isHybridMode) {
        if (!referenceImagePreview) {
          onReferenceImageChange(imageFile);
        } else if (!secondaryReferenceImagePreview) {
          onSecondaryReferenceImageChange(imageFile);
        }
      } else {
        if (!referenceImagePreview) {
          onReferenceImageChange(imageFile);
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [
    mode,
    isLinkMode,
    isHybridMode,
    productWorkflow,
    referenceLink,
    referenceImagePreview,
    secondaryReferenceImagePreview,
    onInspirationFileChange,
    onReferenceLinkChange,
    onReferenceImageChange,
    onSecondaryReferenceImageChange,
  ]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onReferenceImageChange(file);
    }
  };

  const isButtonDisabled =
    isLoading ||
    (mode === "reference-inspiration"
      ? !referenceLink
      : isLinkMode
        ? !referenceLink || !referenceImagePreview
        : mode === "reference-photo"
          ? !productWorkflow
            ? true
            : productWorkflow === "packshot-hybrid"
              ? !referenceImagePreview ||
                !secondaryReferenceImagePreview ||
                !referenceDescription.trim()
              : !referenceImagePreview || !referenceDescription.trim()
          : isHybridMode
            ? !referenceImagePreview ||
              !secondaryReferenceImagePreview ||
              !referenceDescription.trim()
            : !postSummary.trim() || (!!referenceImagePreview && !referenceDescription.trim()));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <Card className="mx-auto w-full max-w-4xl border-none shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-6 w-6 text-accent" />
            Etapa 1: Envie as imagens do post
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {mode === "reference-photo" && (
            <div className="space-y-6">
              {!productWorkflow && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4 }}
                  className="overflow-hidden"
                >
                  <PackshotAnimationDemo />
                </motion.div>
              )}

              <Label className="text-base font-bold text-gray-800">
                Selecione como deseja criar a imagem do seu produto:
              </Label>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setProductWorkflow("text-ambientation")}
                  className={cn(
                    "group relative flex flex-col items-start rounded-2xl border-2 p-5 text-left transition-all duration-200",
                    productWorkflow === "text-ambientation"
                      ? "border-[#FA6305] bg-orange-50/40 shadow-md ring-2 ring-[#FA6305]/20"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                  )}
                >
                  <div className="flex w-full items-center justify-between mb-3">
                    <div
                      className={cn(
                        "rounded-xl p-2.5 transition-colors",
                        productWorkflow === "text-ambientation"
                          ? "bg-[#FA6305] text-white shadow-sm"
                          : "bg-orange-100/80 text-[#FA6305]"
                      )}
                    >
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                        productWorkflow === "text-ambientation"
                          ? "bg-orange-200/80 text-orange-900"
                          : "bg-slate-100 text-slate-600"
                      )}
                    >
                      1 Foto + Descrição
                    </span>
                  </div>
                  <span className="text-base font-bold text-slate-900">
                    Opção A — Produto em Uso
                  </span>
                  <span className="mt-1 text-xs leading-relaxed text-slate-600">
                    Ideal para colocar o seu produto em cenários fotográficos ou sendo usado por uma pessoa.
                  </span>
                  <span className="mt-3 w-full rounded-lg bg-white/90 border border-slate-200/70 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 shadow-2xs">
                    💡 Ex: Envie a foto da garrafa e escolha um preset ou digite o cenário
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setProductWorkflow("packshot-hybrid")}
                  className={cn(
                    "group relative flex flex-col items-start rounded-2xl border-2 p-5 text-left transition-all duration-200",
                    productWorkflow === "packshot-hybrid"
                      ? "border-[#0083C7] bg-sky-50/40 shadow-md ring-2 ring-[#0083C7]/20"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                  )}
                >
                  <div className="flex w-full items-center justify-between mb-3">
                    <div
                      className={cn(
                        "rounded-xl p-2.5 transition-colors",
                        productWorkflow === "packshot-hybrid"
                          ? "bg-[#0083C7] text-white shadow-sm"
                          : "bg-sky-100/80 text-[#0083C7]"
                      )}
                    >
                      <Box className="h-5 w-5" />
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                        productWorkflow === "packshot-hybrid"
                          ? "bg-sky-200/80 text-sky-900"
                          : "bg-slate-100 text-slate-600"
                      )}
                    >
                      2 Fotos (Fusão Inteligente)
                    </span>
                  </div>
                  <span className="text-base font-bold text-slate-900">
                    Opção B — Produto com Foto de Referência
                  </span>
                  <span className="mt-1 text-xs leading-relaxed text-slate-600">
                    Clona o layout, iluminação ou estrutura gráfica exata da foto de referência enviada.
                  </span>
                  <span className="mt-3 w-full rounded-lg bg-white/90 border border-slate-200/70 px-2.5 py-1.5 text-[11px] font-medium text-sky-800 shadow-2xs">
                    ✨ Ex: Envie seu produto + foto de anúncio inspirador que deseja replicar
                  </span>
                </button>
              </div>
            </div>
          )}

          {isLinkMode && (
            <div className="space-y-6">
              <p className="text-center text-sm text-gray-600">
                {mode === "reference-inspiration"
                  ? "Para criar o seu post conceitual, envie o print do post que você gostou como inspiração."
                  : "Para criar o seu post com o layout perfeito, envie o print do post que você gostou (Inspiração) E a foto do seu produto ou pessoa (Conteúdo)."}
              </p>

              <div
                className={cn(
                  "grid grid-cols-1 gap-6",
                  mode === "reference-inspiration" ? "mx-auto w-full max-w-xl" : "md:grid-cols-2"
                )}
              >
                {/* 1. Print de Inspiração */}
                <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/50 p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-primary">
                    <Sparkles className="h-5 w-5 animate-pulse text-accent" />
                    <Label className="text-base font-bold">1. Print de Inspiração (Layout)</Label>
                  </div>
                  <p className="text-xs text-gray-500">
                    O post modelo que servirá de referência para o círculo de desconto, molduras,
                    cores e posições.
                  </p>

                  {!referenceLink ? (
                    <div
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) {
                            onInspirationFileChange?.(file);
                            onReferenceLinkChange?.(URL.createObjectURL(file));
                          }
                        };
                        input.click();
                      }}
                      className="flex h-44 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-4 transition-all hover:border-accent hover:bg-accent/5"
                    >
                      <UploadCloud className="mb-2 h-8 w-8 text-gray-400" />
                      <p className="text-center text-xs font-bold text-gray-700">
                        Clique para carregar ou cole (Ctrl+V) o print de inspiração
                      </p>
                      <p className="mt-1 text-[10px] text-gray-400">
                        PNG, JPG de posts do Instagram, etc.
                      </p>
                    </div>
                  ) : (
                    <div className="relative flex h-44 flex-col items-center justify-center rounded-lg border bg-white p-3 shadow-inner">
                      <div className="relative h-28 w-28 overflow-hidden rounded border shadow-sm">
                        <Image
                          src={referenceLink}
                          alt="Referência"
                          layout="fill"
                          objectFit="cover"
                          unoptimized
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-7 text-xs text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={() => {
                          onInspirationFileChange?.(null);
                          onReferenceLinkChange?.("");
                        }}
                      >
                        Trocar imagem
                      </Button>
                    </div>
                  )}
                </div>

                {/* 2. Foto do Produto ou Pessoa (apenas se não for modo inspiração puro) */}
                {mode !== "reference-inspiration" && (
                  <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/50 p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-primary">
                      <Box className="h-5 w-5 text-blue-500" />
                      <Label className="text-base font-bold">
                        2. Foto do seu Produto ou Pessoa
                      </Label>
                    </div>
                    <p className="text-xs text-gray-500">
                      A foto do seu produto real, pessoa ou modelo que será recortada e inserida na
                      arte de destino.
                    </p>

                    {!referenceImagePreview ? (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="flex h-44 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-4 transition-all hover:border-blue-500 hover:bg-blue-50/20"
                      >
                        <UploadCloud className="mb-2 h-8 w-8 text-gray-400" />
                        <p className="text-center text-xs font-bold text-gray-700">
                          Clique para carregar ou cole (Ctrl+V) a foto do produto/modelo
                        </p>
                        <p className="mt-1 text-[10px] text-gray-400">
                          Tire uma foto nítida e bem iluminada.
                        </p>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/*"
                          className="hidden"
                        />
                      </div>
                    ) : (
                      <div className="relative flex h-44 flex-col items-center justify-center rounded-lg border bg-white p-3 shadow-inner">
                        <div className="relative h-28 w-28 overflow-hidden rounded border shadow-sm">
                          <Image
                            src={referenceImagePreview}
                            alt="Produto"
                            layout="fill"
                            objectFit="cover"
                            unoptimized
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 h-7 text-xs text-red-500 hover:bg-red-50 hover:text-red-600"
                          onClick={() => onReferenceImageChange(null)}
                        >
                          Trocar imagem
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {isHybridMode && (
            <div className="space-y-6">
              <p className="text-sm text-gray-600">
                Gere uma imagem combinando o rosto de uma pessoa (selfie) com um produto ou projeto
                em um cenário realista.
              </p>

              {!referenceImagePreview && !secondaryReferenceImagePreview && <HybridAnimationDemo />}

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* 1. Foto da Pessoa */}
                <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/50 p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-primary">
                    <Sparkles className="h-5 w-5 animate-pulse text-accent" />
                    <Label className="text-base font-bold">1. Foto da Pessoa</Label>
                  </div>
                  <p className="text-xs text-gray-500">
                    Selfie nítida e bem iluminada para preservar a fidelidade do rosto.
                  </p>

                  {!referenceImagePreview ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="flex h-44 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-4 transition-all hover:border-accent hover:bg-accent/5"
                    >
                      <UploadCloud className="mb-2 h-8 w-8 text-gray-400" />
                      <p className="text-center text-xs font-bold text-gray-700">
                        Clique para carregar ou cole (Ctrl+V) a selfie
                      </p>
                      <p className="mt-1 text-[10px] text-gray-400">PNG, JPG com boa iluminação.</p>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <div className="relative flex h-44 flex-col items-center justify-center rounded-lg border bg-white p-3 shadow-inner">
                      <div className="relative h-28 w-28 overflow-hidden rounded border shadow-sm">
                        <Image
                          src={referenceImagePreview}
                          alt="Selfie da Pessoa"
                          layout="fill"
                          objectFit="cover"
                          unoptimized
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-7 text-xs text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={() => onReferenceImageChange(null)}
                      >
                        Trocar imagem
                      </Button>
                    </div>
                  )}
                </div>

                {/* 2. Foto do Cenário */}
                <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/50 p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-primary">
                    <Box className="h-5 w-5 text-blue-500" />
                    <Label className="text-base font-bold">2. Foto do Cenário</Label>
                  </div>
                  <p className="text-xs text-gray-500">
                    Foto do produto, projeto, casa ou cenário complementar.
                  </p>

                  {!secondaryReferenceImagePreview ? (
                    <div
                      onClick={() => secondaryFileInputRef.current?.click()}
                      className="flex h-44 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-4 transition-all hover:border-blue-500 hover:bg-blue-50/20"
                    >
                      <UploadCloud className="mb-2 h-8 w-8 text-gray-400" />
                      <p className="text-center text-xs font-bold text-gray-700">
                        Clique para carregar ou cole (Ctrl+V) o produto/projeto
                      </p>
                      <p className="mt-1 text-[10px] text-gray-400">
                        PNG, JPG do produto ou arquitetura.
                      </p>
                      <input
                        type="file"
                        ref={secondaryFileInputRef}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            onSecondaryReferenceImageChange(file);
                          }
                        }}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <div className="relative flex h-44 flex-col items-center justify-center rounded-lg border bg-white p-3 shadow-inner">
                      <div className="relative h-28 w-28 overflow-hidden rounded border shadow-sm">
                        <Image
                          src={secondaryReferenceImagePreview}
                          alt="Produto/Projeto"
                          layout="fill"
                          objectFit="cover"
                          unoptimized
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-7 text-xs text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={() => onSecondaryReferenceImageChange(null)}
                      >
                        Trocar imagem
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {mode !== "reference-photo" && !isHybridMode && (
            <div className="space-y-2 border-t pt-4">
              <Label className="text-base font-semibold">
                {isLinkMode ? "Ideia do Conteúdo / Promoção" : "Ideia do Conteúdo"}
              </Label>
              <p className="mb-2 text-sm text-gray-600">
                {isLinkMode
                  ? "Descreva a sua promoção, descontos, textos importantes ou o tema que deseja destacar (ex: 'Oferecer 35% de desconto no notebook Dell'). A IA integrará isso ao layout."
                  : "Escreva um resumo, uma ideia ou algumas palavras-chave sobre o conteúdo que você deseja criar."}
              </p>
              <Textarea
                placeholder={
                  isLinkMode
                    ? "Ex: Cupom de 35% de desconto na compra do novo notebook Dell Inspiron neste final de semana!"
                    : "Ex: Criar um post sobre os benefícios do nosso novo produto X, destacando a facilidade de uso e o design inovador."
                }
                className="h-32 bg-white text-base"
                value={postSummary}
                onChange={(e) => onPostSummaryChange(e.target.value)}
              />

              {/* Seção opcional de Print de Inspiração para o modo conceito */}
              {mode === "concept" && (
                <div className="mx-auto mt-6 w-full max-w-xl space-y-3 rounded-xl border border-gray-100 bg-gray-50/50 p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-primary">
                    <Sparkles className="h-5 w-5 animate-pulse text-accent" />
                    <Label className="text-base font-bold">
                      Print de Inspiração / Referência Visual (Opcional)
                    </Label>
                  </div>
                  <p className="text-xs text-gray-500">
                    Gostou de alguma postagem nas redes sociais? Envie o print dela e a IA gerará
                    uma opção de imagem inspirada no mesmo layout, cenário e cores de composição.
                  </p>

                  {!referenceLink ? (
                    <div
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) {
                            onInspirationFileChange?.(file);
                            onReferenceLinkChange?.(URL.createObjectURL(file));
                          }
                        };
                        input.click();
                      }}
                      className="flex h-40 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-4 transition-all hover:border-accent hover:bg-accent/5"
                    >
                      <UploadCloud className="mb-2 h-8 w-8 text-gray-400" />
                      <p className="text-center text-xs font-bold text-gray-700">
                        Clique para carregar ou cole (Ctrl+V) o print de inspiração
                      </p>
                      <p className="mt-1 text-[10px] text-gray-400">
                        PNG, JPG de posts do Instagram, etc. (Opcional)
                      </p>
                    </div>
                  ) : (
                    <div className="relative flex h-40 flex-col items-center justify-center rounded-lg border bg-white p-3 shadow-inner">
                      <div className="relative h-24 w-24 overflow-hidden rounded border shadow-sm">
                        <Image
                          src={referenceLink}
                          alt="Print de Referência"
                          layout="fill"
                          objectFit="cover"
                          unoptimized
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-7 text-xs text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={() => {
                          onInspirationFileChange?.(null);
                          onReferenceLinkChange?.("");
                        }}
                      >
                        Remover print
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Seletor de Estilo de Layout — apenas no modo conceito */}
          {mode === "concept" && (
            <div className="border-t pt-4">
              <LayoutStyleSelector
                value={layoutStyle as LayoutStyleId}
                onChange={(style) => setLayoutStyle(style)}
              />
            </div>
          )}

          {isHybridMode && (
            <div className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <Label className="text-base font-semibold">Prioridade de Foco da Geração</Label>
                <p className="text-sm text-gray-600">
                  Escolha o elemento que a inteligência artificial deve priorizar e manter fiel ao
                  combinar as imagens.

                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <button
                    key="btn-balanced"
                    type="button"
                    onClick={() => setHybridPriority("balanced")}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all ${
                      hybridPriority === "balanced"
                        ? "border-accent bg-accent/5 shadow-md shadow-accent/5"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <Scale
                      className={`h-6 w-6 ${hybridPriority === "balanced" ? "text-accent" : "text-gray-400"}`}
                    />
                    <div>
                      <p className="text-xs font-bold text-gray-800">Foco em Ambos</p>
                      <p className="mt-1 text-[10px] leading-normal text-gray-500">
                        Mescla equilibrada e proporcional dos elementos.
                      </p>
                    </div>
                  </button>

                  <button
                    key="btn-scenario"
                    type="button"
                    onClick={() => setHybridPriority("scenario")}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all ${
                      hybridPriority === "scenario"
                        ? "border-blue-500 bg-blue-50/10 shadow-md shadow-blue-500/5"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <Home
                      className={`h-6 w-6 ${hybridPriority === "scenario" ? "text-blue-500" : "text-gray-400"}`}
                    />
                    <div>
                      <p className="text-xs font-bold text-gray-800">Priorizar Cenário</p>
                      <p className="mt-1 text-[10px] leading-normal text-gray-500">
                        Preserva rigidamente a casa ou ambiente da Foto 2.
                      </p>
                    </div>
                  </button>

                  <button
                    key="btn-person"
                    type="button"
                    onClick={() => setHybridPriority("person")}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all ${
                      hybridPriority === "person"
                        ? "border-pink-500 bg-pink-50/10 shadow-md shadow-pink-500/5"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <User
                      className={`h-6 w-6 ${hybridPriority === "person" ? "text-pink-500" : "text-gray-400"}`}
                    />
                    <div>
                      <p className="text-xs font-bold text-gray-800">Priorizar Pessoa</p>
                      <p className="mt-1 text-[10px] leading-normal text-gray-500">
                        Destaque máximo e fidelidade de rosto do corretor/modelo.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Label className="text-base font-semibold">
                  Descrição do Cenário e Ideias Promocionais
                </Label>
                <p className="mb-2 text-sm text-gray-600">
                  Explique detalhadamente como deseja combinar a pessoa e o produto/projeto na
                  imagem final. Seja específico sobre roupas, pose, cenário de fundo, iluminação ou
                  texto promocional se houver.
                </p>
                <Textarea
                  placeholder="Ex: Coloque o arquiteto da Foto 1 de terno azul escuro e braços cruzados sorrindo, posicionado em frente à casa moderna da Foto 2 durante o pôr do sol."
                  className="h-32 bg-white text-base"
                  value={referenceDescription}
                  onChange={(e) => onReferenceDescriptionChange(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {!hideImageOption &&
            !isLinkMode &&
            !isHybridMode &&
            (mode !== "reference-photo" || !!productWorkflow) && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-6 border-t pt-6"
              >
                {productWorkflow === "text-ambientation" ? (
                  // Interface A: Upload Único + Prompt de Texto
                  <div className="space-y-6">
                    <div className="mb-2 flex flex-col">
                      <div className="flex items-center gap-2">
                        <Box className="h-5 w-5 text-blue-500" />
                        <Label className="text-base font-bold text-gray-800">
                          Foto do seu Produto
                        </Label>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Envie uma foto do seu produto físico para que a IA crie novos cenários para
                        ele.
                      </p>
                    </div>

                    <div className="space-y-6">
                      {!referenceImagePreview ? (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 p-8 transition-all hover:border-accent hover:bg-accent/5"
                        >
                          <UploadCloud className="mb-2 h-10 w-10 text-gray-400" />
                          <p className="text-sm font-medium text-gray-700">
                            Clique para enviar a foto do produto
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG ou JPEG (Máx. 5MB)</p>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                          />
                        </div>
                      ) : (
                        <div className="w-full space-y-6 pt-1">
                          <div className="flex flex-col items-start gap-6 md:flex-row">
                            <div className="group relative h-40 w-40 shrink-0 overflow-hidden rounded-xl border shadow-sm">
                              <Image
                                src={referenceImagePreview}
                                alt="Referência"
                                layout="fill"
                                objectFit="cover"
                              />
                              <button
                                type="button"
                                onClick={() => onReferenceImageChange(null)}
                                className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>

                            <AnimatePresence>
                              <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="w-full flex-1 space-y-3"
                              >
                                <div className="flex items-center gap-2">
                                  <MessageSquare className="h-4 w-4 text-primary" />
                                  <Label className="text-sm font-bold text-gray-800">
                                    Ideias de Cenário / Detalhes Adicionais (Opcional)
                                  </Label>
                                </div>
                                <p className="text-xs text-gray-500">
                                  Personalize o cenário do produto ou escolha um dos presets visuais abaixo.
                                </p>
                                <Textarea
                                  placeholder="Ex: Frasco de perfume posicionado sobre mesa de mármore branco com iluminação suave de estúdio..."
                                  className="h-24 text-sm bg-white border-slate-200 focus:ring-2 focus:ring-[#0083C7] rounded-xl"
                                  value={referenceDescription}
                                  onChange={(e) => onReferenceDescriptionChange(e.target.value)}
                                />
                              </motion.div>
                            </AnimatePresence>
                          </div>

                          {/* Inserção de Títulos e Textos Publicitários (Acima dos Presets) */}
                          <div className="border-t pt-5 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                              <div>
                                <Label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                  <span>✍️</span> Inserção de Texto / Título na Imagem
                                </Label>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  Deseja incluir títulos publicitários, slogans ou valores desenhados na arte?
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Button
                                  type="button"
                                  variant={insertTextOnImage === false ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setInsertTextOnImage(false)}
                                  className={cn(
                                    "text-xs h-8 px-3 rounded-lg font-medium",
                                    insertTextOnImage === false && "bg-slate-800 hover:bg-slate-900 text-white"
                                  )}
                                >
                                  🖼️ Apenas Foto (Sem Texto)
                                </Button>
                                <Button
                                  type="button"
                                  variant={insertTextOnImage !== false ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setInsertTextOnImage(true)}
                                  className={cn(
                                    "text-xs h-8 px-3 rounded-lg font-bold",
                                    insertTextOnImage !== false && "bg-[#0083C7] hover:bg-[#0072ad] text-white shadow-xs"
                                  )}
                                >
                                  ✨ Incluir Título na Arte
                                </Button>
                              </div>
                            </div>

                            {insertTextOnImage !== false && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-2 pl-1"
                              >
                                <Label className="text-xs font-bold text-slate-700">
                                  Título, Slogan ou Frase Principal do Anúncio (Opcional)
                                </Label>
                                <input
                                  type="text"
                                  value={productHeadline}
                                  onChange={(e) => setProductHeadline(e.target.value)}
                                  placeholder="Ex: FEITA PARA CONECTAR ou 30% OFF NO SEGUNDO ITEM"
                                  className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0083C7]"
                                />
                                <p className="text-[11px] text-slate-400">
                                  A IA renderizará este título com tipografia comercial profissional de alto impacto e contraste.
                                </p>
                              </motion.div>
                            )}
                          </div>

                          {/* Seletor Visual de Presets Especializados de Produtos */}
                          <div className="border-t pt-5">
                            <ProductPresetSelector
                              value={layoutStyle}
                              onChange={(preset, hint) => {
                                setLayoutStyle(preset as LayoutStyleId);
                                onReferenceDescriptionChange(hint || "");
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  // Interface B: Upload Duplo para Packshot Híbrido com Alta Hierarquia e Contraste
                  <div className="space-y-6">
                    {/* Grid de Uploads com Destaque Cromático */}
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      {/* 1. Foto do seu Produto Real */}
                      <div className="flex flex-col justify-between rounded-2xl border-2 border-orange-200/90 bg-gradient-to-b from-orange-50/50 via-white to-white p-5 shadow-xs transition-all">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#FA6305] px-2.5 py-1 text-[11px] font-bold text-white shadow-xs">
                              <Box className="h-3.5 w-3.5" />
                              Passo 1 • Seu Produto Real
                            </span>
                            <span className="text-[10px] font-semibold text-orange-800/80 bg-orange-100/70 px-2 py-0.5 rounded-md">
                              Fidelidade 100%
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed mb-4">
                            Foto simples (mesmo amadora) do seu produto real que será preservado e integrado.
                          </p>
                        </div>

                        {!referenceImagePreview ? (
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className="group flex h-48 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-orange-300 bg-white p-4 text-center transition-all hover:border-[#FA6305] hover:bg-orange-50/30 hover:shadow-xs"
                          >
                            <div className="mb-2.5 rounded-full bg-orange-100 p-3 text-[#FA6305] transition-transform group-hover:scale-110">
                              <UploadCloud className="h-6 w-6" />
                            </div>
                            <p className="text-xs font-bold text-slate-800">
                              Clique para carregar o seu produto
                            </p>
                            <p className="mt-1 text-[11px] text-slate-400">
                              PNG ou JPG com boa iluminação
                            </p>
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleFileChange}
                              accept="image/*"
                              className="hidden"
                            />
                          </div>
                        ) : (
                          <div className="relative flex h-48 flex-col items-center justify-center rounded-xl border border-orange-200 bg-white p-3 shadow-inner">
                            <div className="relative h-32 w-32 overflow-hidden rounded-lg border border-slate-200 shadow-sm">
                              <Image
                                src={referenceImagePreview}
                                alt="Seu Produto"
                                layout="fill"
                                objectFit="cover"
                                unoptimized
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-2 h-7 text-xs font-medium text-red-500 hover:bg-red-50 hover:text-red-600"
                              onClick={() => onReferenceImageChange(null)}
                            >
                              Trocar imagem
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* 2. Foto de Referência */}
                      <div className="flex flex-col justify-between rounded-2xl border-2 border-sky-200/90 bg-gradient-to-b from-sky-50/50 via-white to-white p-5 shadow-xs transition-all">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#0083C7] px-2.5 py-1 text-[11px] font-bold text-white shadow-xs">
                              <Sparkles className="h-3.5 w-3.5" />
                              Passo 2 • Foto de Referência
                            </span>
                            <span className="text-[10px] font-semibold text-sky-800/80 bg-sky-100/70 px-2 py-0.5 rounded-md">
                              Inspiração Visual
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed mb-4">
                            Foto de inspiração profissional da qual copiaremos o cenário, iluminação e layout.
                          </p>
                        </div>

                        {!secondaryReferenceImagePreview ? (
                          <div
                            onClick={() => secondaryFileInputRef.current?.click()}
                            className="group flex h-48 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-sky-300 bg-white p-4 text-center transition-all hover:border-[#0083C7] hover:bg-sky-50/30 hover:shadow-xs"
                          >
                            <div className="mb-2.5 rounded-full bg-sky-100 p-3 text-[#0083C7] transition-transform group-hover:scale-110">
                              <UploadCloud className="h-6 w-6" />
                            </div>
                            <p className="text-xs font-bold text-slate-800">
                              Clique para carregar a referência
                            </p>
                            <p className="mt-1 text-[11px] text-slate-400">
                              PNG ou JPG do post ou anúncio modelo
                            </p>
                            <input
                              type="file"
                              ref={secondaryFileInputRef}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  onSecondaryReferenceImageChange(file);
                                }
                              }}
                              accept="image/*"
                              className="hidden"
                            />
                          </div>
                        ) : (
                          <div className="relative flex h-48 flex-col items-center justify-center rounded-xl border border-sky-200 bg-white p-3 shadow-inner">
                            <div className="relative h-32 w-32 overflow-hidden rounded-lg border border-slate-200 shadow-sm">
                              <Image
                                src={secondaryReferenceImagePreview}
                                alt="Foto de Referência"
                                layout="fill"
                                objectFit="cover"
                                unoptimized
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-2 h-7 text-xs font-medium text-red-500 hover:bg-red-50 hover:text-red-600"
                              onClick={() => onSecondaryReferenceImageChange(null)}
                            >
                              Trocar imagem
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Modo de Replicação da Referência com Display System */}
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 shadow-xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                        <div>
                          <Label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <span>🎯</span> O que deseja replicar da foto de referência?
                          </Label>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Escolha se deseja clonar todo o layout gráfico ou apenas a iluminação e cenário 3D.
                          </p>
                        </div>
                        <span className="self-start sm:self-auto rounded-full bg-[#0083C7]/10 px-2.5 py-1 text-[10px] font-bold text-[#0083C7]">
                          IA Display System Ativa
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <button
                          type="button"
                          onClick={() => setReferenceReplicationMode("full")}
                          className={cn(
                            "group relative flex flex-col items-start p-4 rounded-xl border-2 text-left transition-all duration-200",
                            referenceReplicationMode === "full"
                              ? "border-[#0083C7] bg-white shadow-md ring-2 ring-[#0083C7]/20"
                              : "border-slate-200/90 bg-white/80 hover:border-slate-300 hover:bg-white"
                          )}
                        >
                          <div className="flex w-full items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">📑</span>
                              <span className="text-xs font-bold text-slate-900">
                                Replicar Tudo (Layout Completo)
                              </span>
                            </div>
                            {referenceReplicationMode === "full" && (
                              <span className="h-2.5 w-2.5 rounded-full bg-[#0083C7] ring-4 ring-[#0083C7]/20" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600 leading-snug">
                            Copia o cenário, iluminação, e também a <strong>estrutura de textos, selos, cards e badges</strong> da referência adaptados ao seu produto.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setReferenceReplicationMode("scenario_only")}
                          className={cn(
                            "group relative flex flex-col items-start p-4 rounded-xl border-2 text-left transition-all duration-200",
                            referenceReplicationMode === "scenario_only"
                              ? "border-[#0083C7] bg-white shadow-md ring-2 ring-[#0083C7]/20"
                              : "border-slate-200/90 bg-white/80 hover:border-slate-300 hover:bg-white"
                          )}
                        >
                          <div className="flex w-full items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">🌿</span>
                              <span className="text-xs font-bold text-slate-900">
                                Apenas Cenário & Ambientação (Foto Limpa)
                              </span>
                            </div>
                            {referenceReplicationMode === "scenario_only" && (
                              <span className="h-2.5 w-2.5 rounded-full bg-[#0083C7] ring-4 ring-[#0083C7]/20" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600 leading-snug">
                            Copia apenas a <strong>iluminação, ângulo de câmera, materiais e fundo 3D</strong>, gerando uma foto limpa sem os textos da referência.
                          </p>
                        </button>
                      </div>
                    </div>

                    {/* Inserção de Texto / Título na Imagem */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                        <div>
                          <Label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <span>✍️</span> Inserção de Texto / Título na Arte
                          </Label>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Deseja incluir títulos publicitários, slogans ou frases desenhados na arte?
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            type="button"
                            variant={insertTextOnImage === false ? "default" : "outline"}
                            size="sm"
                            onClick={() => setInsertTextOnImage(false)}
                            className={cn(
                              "text-xs h-8 px-3 rounded-lg font-medium",
                              insertTextOnImage === false && "bg-slate-800 hover:bg-slate-900 text-white"
                            )}
                          >
                            🖼️ Apenas Foto (Sem Texto)
                          </Button>
                          <Button
                            type="button"
                            variant={insertTextOnImage !== false ? "default" : "outline"}
                            size="sm"
                            onClick={() => setInsertTextOnImage(true)}
                            className={cn(
                              "text-xs h-8 px-3 rounded-lg font-bold",
                              insertTextOnImage !== false && "bg-[#0083C7] hover:bg-[#0072ad] text-white shadow-xs"
                            )}
                          >
                            ✨ Incluir Título na Arte
                          </Button>
                        </div>
                      </div>

                      {insertTextOnImage !== false && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-2"
                        >
                          <Label className="text-xs font-bold text-slate-700">
                            Título, Slogan ou Frase Principal do Anúncio (Opcional)
                          </Label>
                          <input
                            type="text"
                            value={productHeadline}
                            onChange={(e) => setProductHeadline(e.target.value)}
                            placeholder="Ex: FEITA PARA CONECTAR ou 30% OFF NO SEGUNDO ITEM"
                            className="w-full h-10 px-3.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0083C7] transition-all"
                          />
                          <p className="text-[11px] text-slate-500">
                            A IA desenhará este título na imagem respeitando o layout e estilo visual da referência.
                          </p>
                        </motion.div>
                      )}
                    </div>

                    {/* Descrição e Instruções Adicionais */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
                      <div>
                        <Label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <span>✍️</span> Instruções Adicionais ou Ajustes (Opcional)
                        </Label>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Explique se gostaria de fazer algum ajuste na fusão (ex: "coloque o meu produto no lugar da garrafa profissional e mantenha os respingos de água").
                        </p>
                      </div>
                      <Textarea
                        placeholder="Descreva detalhes específicos ou instruções para a fusão das imagens..."
                        className="min-h-[90px] bg-slate-50/50 border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-[#0083C7] rounded-xl transition-all"
                        value={referenceDescription}
                        onChange={(e) => onReferenceDescriptionChange(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            )}
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t pt-4">
          <div className="flex items-center space-x-2">
            {(mode === "reference-photo" || mode === "reference-hybrid") && (
              <>
                <Switch
                  id="generate-text"
                  checked={generateTextSuggestions}
                  onCheckedChange={setGenerateTextSuggestions}
                />
                <Label
                  htmlFor="generate-text"
                  className="cursor-pointer text-sm font-medium text-gray-700"
                >
                  Gerar Conteúdo (Opcional)
                </Label>
              </>
            )}
          </div>
          <Button
            onClick={() => onGenerate()}
            disabled={isButtonDisabled}
            className="bg-accent text-white shadow-md hover:bg-accent/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                {hideTextOption && !referenceImagePreview ? "Aguardando imagem..." : "Avançar"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};
