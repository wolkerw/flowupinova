"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Type, Palette, TypeOutline, Layers, MousePointer2 } from "lucide-react";

export const AnimatedEditorFlow = () => {
  const [activeTab, setActiveTab] = useState<"ai" | "manual">("ai");

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTab((prev) => (prev === "ai" ? "manual" : "ai"));
    }, 7000); // 7s cada estado
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-[500px] w-full md:h-[450px]">
      {/* Abas no topo */}
      <div className="absolute left-0 right-0 top-0 z-20 -mt-4 flex justify-center">
        <div className="flex rounded-full border border-slate-700 bg-slate-900 p-1 shadow-lg">
          <button
            onClick={() => setActiveTab("ai")}
            className={`rounded-full px-4 py-2 text-xs font-bold transition-all sm:px-6 sm:text-sm ${
              activeTab === "ai"
                ? "bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Com Texto da IA
          </button>
          <button
            onClick={() => setActiveTab("manual")}
            className={`rounded-full px-4 py-2 text-xs font-bold transition-all sm:px-6 sm:text-sm ${
              activeTab === "manual"
                ? "bg-gradient-to-r from-blue-500 to-blue-400 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Imagem Limpa + Editor
          </button>
        </div>
      </div>

      <div className="relative mt-6 h-full w-full">
        <AnimatePresence mode="wait">
          {activeTab === "ai" ? (
            <motion.div
              key="ai"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-2xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl"
            >
              {/* Imagem com texto mesclado tipo IA */}
              <div className="relative aspect-square w-full max-w-[400px] overflow-hidden rounded-xl border border-slate-700 shadow-2xl md:aspect-[4/3]">
                <Image
                  src="/numvapt-1783544518718.png"
                  alt="Hambúrguer gerado por IA"
                  fill
                  className="object-cover"
                />
                {/* Texto embutido (simulando que faz parte da imagem gerada pela IA) */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                    animate={{ opacity: 1, scale: 1, rotate: -2 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-center text-white"
                    style={{ textShadow: "2px 2px 8px rgba(0,0,0,0.8)" }}
                  >
                    <p className="font-serif text-4xl font-black italic tracking-tighter text-yellow-500 sm:text-5xl md:text-6xl">
                      Burger
                    </p>
                    <p className="mt-2 font-sans text-xl font-bold uppercase tracking-[0.2em] sm:text-2xl">
                      Especial
                    </p>
                  </motion.div>
                </div>

                <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded bg-orange-500/90 px-2 py-1 text-[9px] font-bold text-white shadow-sm">
                  <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                  Gerado 100% via IA
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="manual"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 flex flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
            >
              {/* Barra de Menu do Editor Mock */}
              <div className="flex h-10 items-center justify-between border-b border-slate-800 bg-slate-950 px-4">
                <div className="flex gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500/50"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-500/50"></div>
                  <div className="h-3 w-3 rounded-full bg-green-500/50"></div>
                </div>
                <div className="text-xs font-medium text-slate-500">Editor NumVapt</div>
                <div className="w-10"></div>
              </div>

              <div className="flex flex-1 overflow-hidden">
                {/* Barra Lateral de Ferramentas */}
                <div className="flex w-14 flex-col items-center gap-4 border-r border-slate-800 bg-slate-900/50 py-4 sm:w-16">
                  <div className="cursor-pointer rounded bg-blue-500/20 p-2 text-blue-400">
                    <MousePointer2 size={18} />
                  </div>
                  <div className="cursor-pointer rounded p-2 text-slate-400 hover:text-slate-200">
                    <Type size={18} />
                  </div>
                  <div className="cursor-pointer rounded p-2 text-slate-400 hover:text-slate-200">
                    <TypeOutline size={18} />
                  </div>
                  <div className="cursor-pointer rounded p-2 text-slate-400 hover:text-slate-200">
                    <Palette size={18} />
                  </div>
                  <div className="cursor-pointer rounded p-2 text-slate-400 hover:text-slate-200">
                    <Layers size={18} />
                  </div>
                </div>

                {/* Área de Edição (Canvas) */}
                <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-slate-950 p-4 sm:p-8">
                  {/* Container da Imagem (Canvas area) */}
                  <div className="relative aspect-square w-full max-w-[360px] overflow-hidden rounded border border-slate-800 bg-black shadow-2xl">
                    <Image
                      src="/numvapt-1783544518718.png"
                      alt="Hambúrguer limpo"
                      fill
                      className="object-cover opacity-80"
                    />

                    {/* Elemento de Texto Sendo Editado (Caixa Bounding Box) */}
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0, x: -50, y: -20 }}
                      animate={{ scale: 1, opacity: 1, x: 0, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.5, type: "spring" }}
                      className="absolute left-8 right-8 top-8 cursor-move"
                    >
                      <div className="relative border border-blue-500 bg-black/20 p-4 shadow-xl backdrop-blur-sm">
                        {/* Alças de redimensionamento mock */}
                        <div className="absolute -left-1 -top-1 h-2 w-2 rounded-sm bg-blue-500"></div>
                        <div className="absolute -right-1 -top-1 h-2 w-2 rounded-sm bg-blue-500"></div>
                        <div className="absolute -bottom-1 -left-1 h-2 w-2 rounded-sm bg-blue-500"></div>
                        <div className="absolute -bottom-1 -right-1 h-2 w-2 rounded-sm bg-blue-500"></div>

                        {/* Cursor piscando mock */}
                        <motion.div
                          className="absolute bottom-6 right-6 top-6 w-0.5 bg-blue-400"
                          animate={{ opacity: [1, 0, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />

                        <motion.div
                          className="flex flex-col items-center text-center text-white"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1, duration: 0.5 }}
                        >
                          <div className="mb-1 inline-block skew-x-[-10deg] bg-red-600 px-3 py-1 text-xl font-black uppercase tracking-wider text-white shadow-lg sm:text-2xl">
                            Oferta
                          </div>
                          <div className="text-3xl font-black uppercase tracking-tighter text-yellow-400 drop-shadow-md sm:text-4xl">
                            50% OFF
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>

                    {/* Mock de menu flutuante de fonte */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 2, duration: 0.4 }}
                      className="absolute left-12 top-40 z-20 flex gap-2 rounded-md border border-slate-700 bg-slate-800 p-2 text-xs shadow-xl"
                    >
                      <div className="rounded border border-slate-700 bg-slate-900 px-2 py-1 font-bold text-slate-300">
                        Anton
                      </div>
                      <div className="cursor-pointer rounded bg-slate-700 px-2 py-1 font-bold text-white">
                        B
                      </div>
                      <div className="cursor-pointer rounded bg-slate-900 px-2 py-1 italic text-slate-300">
                        I
                      </div>
                      <div className="ml-2 rounded bg-yellow-400 px-2 py-1 font-bold text-black">
                        Cor
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
