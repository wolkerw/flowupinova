"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const MetaConnectionGuideModal = ({
  open,
  onOpenChange,
  onProceed,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProceed: () => void;
}) => {
  const [isChecked1, setIsChecked1] = useState(false);
  const [isChecked2, setIsChecked2] = useState(false);
  const [activeClickTarget, setActiveClickTarget] = useState<1 | 2 | null>(null);
  const [highlightStep, setHighlightStep] = useState<1 | 2 | null>(1);
  const [cursorPos, setCursorPos] = useState({ x: 320, y: 10, opacity: 1 });

  const containerRef = useRef<HTMLDivElement>(null);
  const radio1Ref = useRef<HTMLDivElement>(null);
  const radio2Ref = useRef<HTMLDivElement>(null);

  const getRadioPos = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!containerRef.current || !ref.current) return null;
    const cRect = containerRef.current.getBoundingClientRect();
    const rRect = ref.current.getBoundingClientRect();
    if (cRect.width === 0 || rRect.width === 0) return null;
    return {
      x: rRect.left - cRect.left + rRect.width / 2 - 3,
      y: rRect.top - cRect.top + rRect.height / 2 - 3,
    };
  };

  useEffect(() => {
    if (!open) return;

    let t1: NodeJS.Timeout,
      t2: NodeJS.Timeout,
      t3: NodeJS.Timeout,
      t4: NodeJS.Timeout,
      t5: NodeJS.Timeout,
      t6: NodeJS.Timeout,
      t7: NodeJS.Timeout,
      t8: NodeJS.Timeout,
      loopTimer: NodeJS.Timeout;

    const runSingleScreenLoop = () => {
      setIsChecked1(false);
      setIsChecked2(false);
      setActiveClickTarget(null);
      setHighlightStep(1);
      setCursorPos({ x: 320, y: 10, opacity: 1 });

      // 1. Rabisco vermelho 1 surge no tempo 0. Mouse sai da posição de repouso aos 800ms e desliza até Páginas
      t1 = setTimeout(() => {
        const live1 = getRadioPos(radio1Ref);
        if (live1) {
          setCursorPos({ x: live1.x, y: live1.y, opacity: 1 });
        } else {
          setCursorPos({ x: 38, y: 92, opacity: 1 });
        }
      }, 800);

      // 2. Clique na Opção de Páginas no segundo 1.8 (quando o mouse completa o voo)
      t2 = setTimeout(() => {
        setActiveClickTarget(1);
      }, 1800);

      // 3. Marca Páginas no segundo 2.0 (inicia pausa de 2 segundos do mouse)
      t3 = setTimeout(() => {
        setActiveClickTarget(null);
        setIsChecked1(true);
      }, 2000);

      // 4. Rabisco vermelho 2 surge imediatamente no segundo 2.2 (sem esperar o mouse)
      t4 = setTimeout(() => {
        setHighlightStep(2);
      }, 2200);

      // 5. Mouse aguarda um pouco mais em Páginas e desliza para Empresas aos 4.8s
      t5 = setTimeout(() => {
        const live2 = getRadioPos(radio2Ref);
        if (live2) {
          setCursorPos({ x: live2.x, y: live2.y, opacity: 1 });
        } else {
          setCursorPos({ x: 38, y: 236, opacity: 1 });
        }
      }, 4800);

      // 6. Clique na Opção de Empresas no segundo 6.0
      t6 = setTimeout(() => {
        setActiveClickTarget(2);
      }, 6000);

      // 7. Marca Empresas no segundo 6.2 (pausa final com tudo marcado)
      t7 = setTimeout(() => {
        setActiveClickTarget(null);
        setIsChecked2(true);
        setHighlightStep(null);
      }, 6200);

      // 8. Ao final da pausa (8.2s), mouse desliza suavemente DE VOLTA para o ponto inicial de repouso
      t8 = setTimeout(() => {
        setCursorPos({ x: 320, y: 10, opacity: 1 });
      }, 8200);

      // Loop do ciclo recomeça a cada 9.5 segundos
      loopTimer = setTimeout(runSingleScreenLoop, 9500);
    };

    // Atraso de 250ms para que o modal da Radix UI termine a animação de zoom-in antes de medir os refs
    const startTimer = setTimeout(runSingleScreenLoop, 250);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
      clearTimeout(t7);
      clearTimeout(t8);
      clearTimeout(loopTimer);
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden font-inter">
        {/* Header Superior */}
        <div className="p-5 pb-3 bg-white flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-[#0083C7] font-bold text-xl shadow-sm">
              f
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 font-poppins">
                Como conectar a Meta
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-inter">
                Selecione &quot;Aceitar todas&quot; em ambas as telas:
              </DialogDescription>
            </div>
          </div>
          <span className="text-xs font-bold text-[#0083C7] bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            Passo 1 & 2
          </span>
        </div>

        {/* Simulador da Janela do Navegador com ambos os passos na mesma tela */}
        <div className="p-5 bg-slate-100/70">
          <div ref={containerRef} className="relative bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden p-5 space-y-3">
            {/* Master Cursor Animado Ancorado na Caixa do Simulador (Movimento Suave 1.2s) */}
            <AnimatePresence>
              <motion.div
                key="master-cursor-sim"
                initial={{ x: cursorPos.x, y: cursorPos.y, opacity: cursorPos.opacity }}
                animate={{
                  x: cursorPos.x,
                  y: cursorPos.y,
                  opacity: cursorPos.opacity,
                  scale: activeClickTarget ? 0.75 : 1,
                }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
                className="pointer-events-none absolute left-0 top-0 z-30"
              >
                <svg className="w-5 h-5 fill-slate-900 drop-shadow-md" viewBox="0 0 24 24">
                  <path d="M3 3l7 18 3-7 7-3L3 3z" />
                </svg>
                {activeClickTarget && (
                  <span className="absolute -left-2 -top-2 w-8 h-8 rounded-full border-2 border-[#0083C7] bg-blue-400/30 animate-ping" />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Top Bar do Navegador Limpa */}
            <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between -mx-5 -mt-5 mb-1">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Demonstração Passo 1 e Passo 2</span>
            </div>

            {/* BLOCO 1: PÁGINAS */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0083C7] bg-blue-50 px-2 py-0.5 rounded">
                  1ª Tela • Páginas
                </span>
                <span className="text-[11px] font-bold text-slate-700">
                  Escolha aceitar todas as páginas atuais e no futuro
                </span>
              </div>

              {/* Opção 1 (Recomendada / Clicada com 1 Único Rabisco Vermelho) */}
              <div
                className={`p-2.5 rounded-xl border-2 transition-all flex items-center justify-between relative ${
                  isChecked1 ? "border-[#0083C7] bg-blue-50/70 shadow-sm" : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {/* 1 Único Rabisco Vermelho Feito à Mão Circulando a Bolinha de Seleção */}
                    <AnimatePresence>
                      {highlightStep === 1 && !isChecked1 && (
                        <svg
                          key="doodle-radio-1"
                          className="absolute -inset-2 w-8 h-8 pointer-events-none z-30 overflow-visible -left-2 -top-2"
                          viewBox="0 0 40 40"
                        >
                          <motion.path
                            d="M 20,4 C 30,3 38,10 37,20 C 36,30 28,37 18,36 C 8,35 3,26 4,16 C 5,6 14,3 24,4 C 34,5 39,14 38,24"
                            fill="none"
                            stroke="#EF4444"
                            strokeWidth="2.8"
                            strokeLinecap="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                          />
                        </svg>
                      )}
                    </AnimatePresence>

                    <div
                      ref={radio1Ref}
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                        isChecked1 ? "border-[#0083C7] bg-[#0083C7]" : "border-slate-300 bg-white"
                      }`}
                    >
                      {isChecked1 && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>

                  <span className="text-xs font-bold text-slate-900">
                    Aceitar todas as Páginas atuais e no futuro
                  </span>
                </div>
              </div>

              {/* Opção 2 (Apenas Visual - Desmarcada) */}
              <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between opacity-60">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full border-2 border-slate-300 bg-white" />
                  <span className="text-xs font-medium text-slate-500">
                    Aceitar apenas as Páginas atuais
                  </span>
                </div>
              </div>
            </div>

            {/* DIVISOR SUAVE */}
            <div className="border-t border-slate-100 my-1" />

            {/* BLOCO 2: EMPRESAS */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0083C7] bg-blue-50 px-2 py-0.5 rounded">
                  2ª Tela • Empresas
                </span>
                <span className="text-[11px] font-bold text-slate-700">
                  Escolha aceitar todas as empresas atuais e no futuro
                </span>
              </div>

              {/* Opção 1 (Recomendada / Clicada com 1 Único Rabisco Vermelho) */}
              <div
                className={`p-2.5 rounded-xl border-2 transition-all flex items-center justify-between relative ${
                  isChecked2 ? "border-[#0083C7] bg-blue-50/70 shadow-sm" : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {/* 1 Único Rabisco Vermelho Feito à Mão Circulando a Bolinha de Seleção */}
                    <AnimatePresence>
                      {highlightStep === 2 && !isChecked2 && (
                        <svg
                          key="doodle-radio-2"
                          className="absolute -inset-2 w-8 h-8 pointer-events-none z-30 overflow-visible -left-2 -top-2"
                          viewBox="0 0 40 40"
                        >
                          <motion.path
                            d="M 20,4 C 30,3 38,10 37,20 C 36,30 28,37 18,36 C 8,35 3,26 4,16 C 5,6 14,3 24,4 C 34,5 39,14 38,24"
                            fill="none"
                            stroke="#EF4444"
                            strokeWidth="2.8"
                            strokeLinecap="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                          />
                        </svg>
                      )}
                    </AnimatePresence>

                    <div
                      ref={radio2Ref}
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                        isChecked2 ? "border-[#0083C7] bg-[#0083C7]" : "border-slate-300 bg-white"
                      }`}
                    >
                      {isChecked2 && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>

                  <span className="text-xs font-bold text-slate-900">
                    Aceitar todas as Empresas atuais e no futuro
                  </span>
                </div>
              </div>

              {/* Opção 2 (Apenas Visual - Desmarcada) */}
              <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between opacity-60">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full border-2 border-slate-300 bg-white" />
                  <span className="text-xs font-medium text-slate-500">
                    Aceitar apenas as Empresas atuais
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            Cancelar
          </Button>

          <Button
            type="button"
            onClick={onProceed}
            className="bg-[#0083C7] hover:bg-[#006ba3] text-white font-bold text-xs h-11 px-6 rounded-2xl shadow-md"
          >
            Conectar agora! →
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
