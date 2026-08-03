"use client";

import React from "react";
import { Cpu, Image as ImageIcon, Sparkles, Workflow, ArrowRight } from "lucide-react";

export function ModelsViewer() {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-6">
      <div className="mb-6 flex items-center gap-3">
        <Cpu className="h-5 w-5 text-violet-400" />
        <h2 className="text-lg font-semibold text-white">
          Modelos de Inteligência Artificial em Uso
        </h2>
      </div>
      <p className="mb-6 text-sm text-slate-400">
        Esta tela mapeia quais os motores gráficos reais acionados por cada botão do aplicativo e
        seus sistemas de contingência (fallback) em caso de instabilidade.
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Conceito */}
        <div className="flex flex-col rounded-lg border border-slate-700/50 bg-slate-900/50 p-5">
          <div className="mb-4 flex items-center gap-2 text-slate-200">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-medium">Gerar Imagem Conceito</h3>
          </div>

          <div className="flex-1 space-y-3">
            <div className="rounded border border-emerald-900/50 bg-emerald-950/20 p-3">
              <span className="mb-1 block text-xs font-medium text-emerald-400">
                Modelo Principal
              </span>
              <p className="text-sm font-semibold text-slate-200">GPT Image 2</p>
              <p className="mt-1 text-xs text-slate-400">Provedor: OpenAI</p>
            </div>

            <div className="rounded border border-amber-900/50 bg-amber-950/20 p-3">
              <span className="mb-1 block text-xs font-medium text-amber-400">
                Modelo de Fallback
              </span>
              <p className="text-sm font-semibold text-slate-200">Imagen 4.0 Ultra</p>
              <p className="mt-1 text-xs text-slate-400">
                Acionado nativamente pelo servidor caso a comunicação com a OpenAI (GPT Image 2) apresente instabilidade ou falha.
              </p>
            </div>
          </div>
        </div>

        {/* Produto */}
        <div className="flex flex-col rounded-lg border border-slate-700/50 bg-slate-900/50 p-5">
          <div className="mb-4 flex items-center gap-2 text-slate-200">
            <ImageIcon className="h-4 w-4 text-blue-400" />
            <h3 className="text-sm font-medium">Gerar com Foto de Produto</h3>
          </div>

          <div className="flex-1 space-y-3">
            <div className="rounded border border-violet-900/50 bg-violet-950/20 p-3">
              <span className="mb-1 block text-xs font-medium text-violet-400">
                Pré-Processamento
              </span>
              <p className="text-sm font-semibold text-slate-200">Bria AI</p>
              <p className="mt-1 text-xs text-slate-400">
                Remove o fundo original com precisão milimétrica.
              </p>
            </div>

            <div className="flex items-center justify-center text-slate-600">
              <ArrowRight className="h-4 w-4 rotate-90 md:rotate-0" />
            </div>

            <div className="rounded border border-emerald-900/50 bg-emerald-950/20 p-3">
              <span className="mb-1 block text-xs font-medium text-emerald-400">
                Modelo Principal
              </span>
              <p className="text-sm font-semibold text-slate-200">Nano Banana Pro</p>
              <p className="mt-1 text-xs text-slate-400">Provedor: Gemini Image (Google)</p>
            </div>

            <div className="rounded border border-amber-900/50 bg-amber-950/20 p-3">
              <span className="mb-1 block text-xs font-medium text-amber-400">
                Modelo de Fallback
              </span>
              <p className="text-sm font-semibold text-slate-200">Flux Kontext</p>
              <p className="mt-1 text-xs text-slate-400">
                Acionado automaticamente se a API do Google recusar a fusão.
              </p>
            </div>
          </div>
        </div>

        {/* Hibrido */}
        <div className="flex flex-col rounded-lg border border-slate-700/50 bg-slate-900/50 p-5">
          <div className="mb-4 flex items-center gap-2 text-slate-200">
            <Workflow className="h-4 w-4 text-pink-400" />
            <h3 className="text-sm font-medium">Geração Híbrida</h3>
          </div>

          <div className="flex-1 space-y-3">
            <div className="rounded border border-emerald-900/50 bg-emerald-950/20 p-3">
              <span className="mb-1 block text-xs font-medium text-emerald-400">
                Modelo Principal
              </span>
              <p className="text-sm font-semibold text-slate-200">Nano Banana Pro</p>
              <p className="mt-1 text-xs text-slate-400">Provedor: Gemini Image (Google)</p>
              <p className="mt-2 text-[11px] leading-snug text-slate-500">
                Capaz de receber múltiplas imagens e injetar diretrizes UGC para swap de objetos e
                rostos.
              </p>
            </div>

            <div className="rounded border border-amber-900/50 bg-amber-950/20 p-3">
              <span className="mb-1 block text-xs font-medium text-amber-400">
                Modelo de Fallback
              </span>
              <p className="text-sm font-semibold text-slate-200">Flux Kontext</p>
              <p className="mt-1 text-xs text-slate-400">Provedor: Fal.ai</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
