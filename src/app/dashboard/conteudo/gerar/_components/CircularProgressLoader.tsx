"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface CircularProgressLoaderProps {
  isActive: boolean;
  className?: string;
}

export const CircularProgressLoader: React.FC<CircularProgressLoaderProps> = ({
  isActive,
  className,
}) => {
  const [progress, setProgress] = useState(0);
  const [shouldRender, setShouldRender] = useState(isActive);

  // Efeito de controle de montagem e progresso final
  useEffect(() => {
    if (isActive) {
      setShouldRender(true);
      setProgress(0);
    } else {
      // Quando for desativado, força para 100% de forma imediata
      setProgress(100);
      // Mantém renderizado por 600ms para permitir visualização da conclusão da animação (círculo se fechando)
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  // Simulação inteligente de progresso com curva de desaceleração (curva logística fictícia)
  useEffect(() => {
    if (!isActive || progress >= 100) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 98) {
          // Congela em 98% até receber isActive = false
          return prev;
        }

        // Incrementos dinâmicos baseados na faixa atual de progresso
        let increment = 0;
        if (prev < 15) {
          increment = 1.2; // Começa rápido
        } else if (prev < 35) {
          increment = 0.8;
        } else if (prev < 60) {
          increment = 0.5; // Velocidade de cruzeiro
        } else if (prev < 80) {
          increment = 0.25; // Desacelera nas etapas de polling
        } else if (prev < 90) {
          increment = 0.12;
        } else {
          increment = 0.04; // Quase estático no limite
        }

        const nextVal = prev + increment;
        return nextVal > 98 ? 98 : nextVal;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isActive, progress]);

  if (!shouldRender) return null;

  // Raio do círculo
  const radius = 45;
  // Circunferência de um círculo de raio 45 (2 * PI * r) = 282.74
  const strokeDasharray = 282.74;
  // Deslocamento do contorno do círculo conforme o progresso
  const strokeDashoffset = strokeDasharray * (1 - progress / 100);

  // Mapeamento dinâmico de frases otimistas e acolhedoras baseado no progresso
  let currentMessage = "Iniciando a criação do seu post... 🚀";
  if (progress >= 98) {
    currentMessage = "Tudo pronto! Carregando imagem... ✨";
  } else if (progress >= 88) {
    currentMessage = "Dando os toques finais de brilho... ❤️";
  } else if (progress >= 72) {
    currentMessage = "Esta geração está ficando linda! 🌟";
  } else if (progress >= 55) {
    currentMessage = "Nossa IA está desenhando cada detalhe... 💡";
  } else if (progress >= 35) {
    currentMessage = "Ambientando seu produto com perfeição... 🎨";
  } else if (progress >= 15) {
    currentMessage = "Analisando os detalhes do seu produto... ✨";
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "absolute inset-0 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm rounded-lg z-20 p-6",
        className
      )}
    >
      <div className="relative flex flex-col items-center gap-6">
        {/* SVG Container do Círculo de Progresso */}
        <div className="relative w-36 h-36">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Definições de Gradiente para o círculo premium */}
            <defs>
              <linearGradient id="premiumProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff6b00" />
                <stop offset="100%" stopColor="#ffb800" />
              </linearGradient>
            </defs>

            {/* Círculo de trilha cinza suave */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="rgba(241, 245, 249, 0.9)"
              strokeWidth="6"
              fill="transparent"
            />

            {/* Círculo de progresso ativo que se fecha */}
            <motion.circle
              cx="50"
              cy="50"
              r={radius}
              stroke="url(#premiumProgressGradient)"
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={strokeDasharray}
              animate={{ strokeDashoffset }}
              transition={{
                duration: progress === 100 ? 0.6 : 0.2,
                ease: progress === 100 ? "easeInOut" : "easeOut",
              }}
              strokeLinecap="round"
            />
          </svg>

          {/* Porcentagem em texto no centro absoluto */}
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <motion.span
              key={`percentage-${Math.round(progress)}`}
              initial={{ scale: 0.9, opacity: 0.8 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-2xl font-bold text-gray-800 tracking-tight"
            >
              {Math.round(progress)}%
            </motion.span>
          </div>
        </div>

        {/* Mensagem Otimista com Animação de Troca Suave */}
        <div className="h-14 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentMessage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="text-sm font-medium text-gray-600 text-center max-w-[280px] leading-relaxed"
            >
              {currentMessage}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
