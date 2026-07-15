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
    <div className="w-full relative h-[500px] md:h-[450px]">
      {/* Abas no topo */}
      <div className="absolute top-0 left-0 right-0 z-20 flex justify-center -mt-4">
        <div className="bg-slate-900 border border-slate-700 rounded-full p-1 flex shadow-lg">
          <button
            onClick={() => setActiveTab("ai")}
            className={`px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
              activeTab === "ai"
                ? "bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Com Texto da IA
          </button>
          <button
            onClick={() => setActiveTab("manual")}
            className={`px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
              activeTab === "manual"
                ? "bg-gradient-to-r from-blue-500 to-blue-400 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Imagem Limpa + Editor
          </button>
        </div>
      </div>

      <div className="mt-6 w-full h-full relative">
        <AnimatePresence mode="wait">
          {activeTab === "ai" ? (
            <motion.div
              key="ai"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 bg-[#0f172a] rounded-2xl shadow-2xl overflow-hidden border border-slate-800 flex items-center justify-center p-6"
            >
              {/* Imagem com texto mesclado tipo IA */}
              <div className="relative w-full max-w-[400px] aspect-square md:aspect-[4/3] rounded-xl overflow-hidden border border-slate-700 shadow-2xl">
                <Image
                  src="/numvapt-1783544518718.png"
                  alt="Hambúrguer gerado por IA"
                  fill
                  className="object-cover"
                />
                {/* Texto embutido (simulando que faz parte da imagem gerada pela IA) */}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                    animate={{ opacity: 1, scale: 1, rotate: -2 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-white text-center"
                    style={{ textShadow: "2px 2px 8px rgba(0,0,0,0.8)" }}
                  >
                    <p className="font-serif text-4xl sm:text-5xl md:text-6xl font-black italic tracking-tighter text-yellow-500">
                      Burger
                    </p>
                    <p className="font-sans text-xl sm:text-2xl font-bold uppercase tracking-[0.2em] mt-2">
                      Especial
                    </p>
                  </motion.div>
                </div>
                
                <div className="absolute bottom-3 right-3 bg-orange-500/90 text-white text-[9px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
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
              className="absolute inset-0 bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-700 flex flex-col"
            >
              {/* Barra de Menu do Editor Mock */}
              <div className="h-10 border-b border-slate-800 bg-slate-950 flex items-center px-4 justify-between">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                </div>
                <div className="text-xs text-slate-500 font-medium">Editor NumVapt</div>
                <div className="w-10"></div>
              </div>

              <div className="flex flex-1 overflow-hidden">
                {/* Barra Lateral de Ferramentas */}
                <div className="w-14 sm:w-16 border-r border-slate-800 bg-slate-900/50 flex flex-col items-center py-4 gap-4">
                  <div className="p-2 rounded bg-blue-500/20 text-blue-400 cursor-pointer"><MousePointer2 size={18} /></div>
                  <div className="p-2 rounded text-slate-400 hover:text-slate-200 cursor-pointer"><Type size={18} /></div>
                  <div className="p-2 rounded text-slate-400 hover:text-slate-200 cursor-pointer"><TypeOutline size={18} /></div>
                  <div className="p-2 rounded text-slate-400 hover:text-slate-200 cursor-pointer"><Palette size={18} /></div>
                  <div className="p-2 rounded text-slate-400 hover:text-slate-200 cursor-pointer"><Layers size={18} /></div>
                </div>

                {/* Área de Edição (Canvas) */}
                <div className="flex-1 bg-slate-950 p-4 sm:p-8 flex items-center justify-center relative overflow-hidden">
                  {/* Container da Imagem (Canvas area) */}
                  <div className="relative w-full max-w-[360px] aspect-square rounded overflow-hidden shadow-2xl border border-slate-800 bg-black">
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
                      className="absolute top-8 left-8 right-8 cursor-move"
                    >
                      <div className="border border-blue-500 relative bg-black/20 p-4 backdrop-blur-sm shadow-xl">
                        {/* Alças de redimensionamento mock */}
                        <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 rounded-sm"></div>
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-sm"></div>
                        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 rounded-sm"></div>
                        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 rounded-sm"></div>
                        
                        {/* Cursor piscando mock */}
                        <motion.div 
                          className="absolute right-6 top-6 bottom-6 w-0.5 bg-blue-400"
                          animate={{ opacity: [1, 0, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />

                        <motion.div 
                          className="text-white text-center flex flex-col items-center"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1, duration: 0.5 }}
                        >
                          <div className="bg-red-600 text-white font-black uppercase text-xl sm:text-2xl px-3 py-1 skew-x-[-10deg] tracking-wider mb-1 inline-block shadow-lg">
                            Oferta
                          </div>
                          <div className="text-yellow-400 font-black text-3xl sm:text-4xl uppercase tracking-tighter drop-shadow-md">
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
                      className="absolute top-40 left-12 bg-slate-800 rounded-md border border-slate-700 shadow-xl p-2 flex gap-2 z-20 text-xs"
                    >
                      <div className="px-2 py-1 bg-slate-900 rounded text-slate-300 font-bold border border-slate-700">Anton</div>
                      <div className="px-2 py-1 bg-slate-700 rounded text-white font-bold cursor-pointer">B</div>
                      <div className="px-2 py-1 bg-slate-900 rounded text-slate-300 italic cursor-pointer">I</div>
                      <div className="px-2 py-1 bg-yellow-400 rounded text-black font-bold ml-2">Cor</div>
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
