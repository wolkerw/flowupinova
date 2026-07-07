"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, CheckCircle2 } from "lucide-react";

export const AvatarAnimationDemo = () => {
  const [typedText, setTypedText] = React.useState("");
  const [loopTrigger, setLoopTrigger] = React.useState(0);
  const fullText = "Substitua o rosto desta foto profissional pelo rosto da selfie mantendo a iluminação...";

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
    <div className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-gray-100 bg-gray-50/50 p-6 shadow-sm mb-8">
      <div className="mb-5 flex justify-center gap-3">
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-accent/20 transition-all"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Avatar IA: Criação de Retrato
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key="demo-avatar-ia"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="relative flex h-64 items-center justify-between gap-4 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 p-4 shadow-inner sm:p-6"
        >
          {/* LADO ESQUERDO: Foto 1 - Selfie */}
          <div className="z-10 flex flex-col gap-4">
            <div className="relative flex h-40 w-32 flex-col items-center justify-center overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900 text-center">
              <span className="absolute left-1.5 top-1.5 z-20 rounded bg-black/50 px-1 py-0.5 text-[7px] font-bold uppercase tracking-wider text-white">
                Foto 1: Seu Rosto
              </span>
              <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-800 to-slate-900" />
              
              <motion.div
                className="z-10 h-full w-full"
                animate={{ opacity: [1, 0.4, 0.4, 1, 1] }}
                transition={{ duration: 8, repeat: Infinity, times: [0, 0.15, 0.85, 0.95, 1] }}
              >
                <img
                  src="https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=500&q=80"
                  alt="Selfie"
                  className="h-full w-full object-cover"
                />
              </motion.div>
            </div>
          </div>

          {/* CENTRO: Foto 2 (Referência) + Prompt */}
          <div className="z-10 flex flex-1 flex-col items-center justify-center px-2">
            <div className="relative flex h-28 w-28 flex-col items-center justify-center overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900 text-center mb-3">
              <span className="absolute right-1.5 top-1.5 z-20 rounded bg-black/50 px-1 py-0.5 text-[7px] font-bold uppercase tracking-wider text-white">
                Foto 2: Estilo
              </span>
              <img
                src="https://images.unsplash.com/photo-1556157382-97eda2d62296?w=500&q=80"
                alt="Referência"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="relative w-full max-w-[200px] rounded-lg border border-slate-700 bg-slate-950/80 p-2 text-left shadow-lg">
              <div className="mb-1 flex items-center gap-1">
                <span className="h-1.5 w-1.5 animate-ping rounded-full bg-accent" />
                <span className="text-[7px] font-bold uppercase text-slate-500">
                  Instrução IA
                </span>
              </div>
              <div className="min-h-[32px] break-words font-mono text-[8px] leading-snug text-slate-300">
                {typedText}
                <span
                  className="ml-0.5 inline-block h-3 w-1 animate-pulse bg-accent"
                  style={{ verticalAlign: "middle" }}
                />
              </div>
            </div>
            
            {/* Conector */}
            <div className="relative mt-2 flex h-4 w-16 items-center justify-center">
              <svg width="64" height="12" viewBox="0 0 64 12" fill="none">
                <path d="M2 6 H 58" stroke="#6366f1" strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round" />
                <path d="M50 2L58 6L50 10" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* LADO DIREITO: Foto 3 - Resultado */}
          <div className="relative flex h-48 w-40 flex-col items-center justify-center overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
            <span className="absolute right-2 top-2 z-20 rounded bg-black/50 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white">
              Resultado
            </span>

            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/60" />

            <motion.div
              className="z-15 absolute flex flex-col items-center justify-center rounded-lg border border-dashed border-white/50 bg-black/40 p-2 opacity-40"
              animate={{ opacity: [0.5, 0.5, 0, 0, 0.5] }}
              transition={{ duration: 8, repeat: Infinity, times: [0, 0.15, 0.45, 0.85, 1] }}
            >
              <Sparkles className="h-5 w-5 animate-spin text-white" />
              <span className="mt-1 text-[7px] font-bold leading-none text-white">
                Processando...
              </span>
            </motion.div>

            {/* Rosto Selfie viaja para Foto 3 */}
            <motion.div
              className="pointer-events-none absolute z-20 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-accent"
              style={{ top: "30%" }}
              animate={{
                x: [-200, -200, 0, 0, -200],
                y: [20, 20, -10, -10, 20],
                scale: [0.8, 0.8, 1, 1, 0.8],
                opacity: [0, 1, 1, 0, 0],
                filter: [
                  "drop-shadow(0 0 0px rgba(99,102,241,0))",
                  "drop-shadow(0 0 10px rgba(99,102,241,0.9))",
                  "drop-shadow(0 0 10px rgba(99,102,241,0.9))",
                  "drop-shadow(0 0 0px rgba(99,102,241,0))",
                  "drop-shadow(0 0 0px rgba(99,102,241,0))",
                ],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", times: [0, 0.15, 0.45, 0.55, 1] }}
            >
              <img
                src="https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=500&q=80"
                alt="Selfie"
                className="h-full w-full object-cover"
              />
            </motion.div>

            {/* Resultado Final Fade In */}
            <motion.div
              className="absolute inset-0 z-30"
              animate={{ opacity: [0, 0, 1, 1, 1, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", times: [0, 0.45, 0.55, 0.85, 0.95, 1] }}
            >
              <img
                src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=500&q=80"
                alt="Resultado Avatar"
                className="h-full w-full object-cover"
              />
              <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 backdrop-blur-sm">
                <CheckCircle2 className="h-3 w-3 text-green-400" />
                <span className="text-[8px] font-bold text-white">Avatar IA Gerado</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
