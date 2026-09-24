"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Cpu,
  Image as ImageIcon,
  Sparkles,
  Bot,
  Save,
  Loader2,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Lock,
  Layers,
  Sliders,
} from "lucide-react";

interface AIModelsConfig {
  generalPlannerModel: string;
  generalImageModel: string;
  generalFallbackImageModel: string;
  imageQuality?: string;
  chatModel: string;
  promptsIdeaModel: string;
  updatedAt?: string;
  updatedBy?: string;
}

interface ModelOption {
  id: string;
  label: string;
  provider: "openai" | "google";
}

interface QualityOption {
  id: string;
  label: string;
}

interface AvailableOptions {
  planners: ModelOption[];
  imageGenerators: ModelOption[];
  imageQualities?: QualityOption[];
  chatAssistants: ModelOption[];
  promptGenerators: ModelOption[];
}

export function ModelsViewer() {
  const [config, setConfig] = useState<AIModelsConfig | null>(null);
  const [defaults, setDefaults] = useState<AIModelsConfig | null>(null);
  const [options, setOptions] = useState<AvailableOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/configuracoes/modelos");
      if (res.status === 403 || res.status === 401) {
        window.location.href = `/acesso/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      if (!res.ok) throw new Error("Falha ao carregar configuração de modelos");
      const data = await res.json();
      setConfig(data.config);
      setDefaults(data.defaults);
      setOptions(data.availableOptions);
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setStatusMessage("Não foi possível carregar a configuração atual dos modelos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    setStatus("idle");
    setStatusMessage("");

    try {
      const res = await fetch("/api/admin/configuracoes/modelos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (res.status === 403 || res.status === 401) {
        window.location.href = `/acesso/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao salvar");

      setConfig(data.config);
      setStatus("success");
      setStatusMessage("Configurações de modelos salvas e aplicadas em tempo real!");
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setStatusMessage(err.message || "Erro ao salvar alterações.");
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreDefaults = () => {
    if (defaults && config) {
      setConfig({
        ...config,
        generalPlannerModel: defaults.generalPlannerModel,
        generalImageModel: defaults.generalImageModel,
        generalFallbackImageModel: defaults.generalFallbackImageModel,
        imageQuality: defaults.imageQuality || "medium",
        chatModel: defaults.chatModel,
        promptsIdeaModel: defaults.promptsIdeaModel,
      });
      setStatus("idle");
      setStatusMessage("");
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-slate-700/50 bg-slate-800/60 p-6 text-slate-400">
        <Loader2 className="mr-2 h-6 w-6 animate-spin text-sky-400" />
        <span>Carregando configurações de modelos de IA...</span>
      </div>
    );
  }

  if (!config || !options) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-6 text-red-300">
        <AlertTriangle className="mb-2 h-6 w-6" />
        <p>Não foi possível exibir o gerenciador de modelos de IA.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Cpu className="h-6 w-6 text-sky-400" />
              <h2 className="text-xl font-semibold text-white">
                Controle Dinâmico de Modelos de IA
              </h2>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              Alterne os motores de IA e sistemas de contingência em tempo real para todos os fluxos da plataforma sem necessidade de novo deploy de código.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRestoreDefaults}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700 disabled:opacity-50"
              title="Restaurar valores padrões recomendados"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Padrões
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-[#0083C7] px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:bg-[#0072ad] disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar Modelos
                </>
              )}
            </button>
          </div>
        </div>

        {/* Feedback visual */}
        {status === "success" && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3 text-sm text-emerald-300">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            <span>{statusMessage}</span>
          </div>
        )}

        {status === "error" && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-950/20 p-3 text-sm text-red-300">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <span>{statusMessage}</span>
          </div>
        )}

        {config.updatedAt && (
          <p className="mt-3 text-xs text-slate-500">
            Última atualização: {new Date(config.updatedAt).toLocaleString("pt-BR")}
            {config.updatedBy ? ` por ${config.updatedBy}` : ""}
          </p>
        )}
      </div>

      {/* Grid de Seções */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bloco 1: Fluxo Geral de Imagens (Orquestrador) */}
        <div className="flex flex-col rounded-xl border border-slate-700/50 bg-slate-900/60 p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-white">
              <ImageIcon className="h-5 w-5 text-sky-400" />
              <h3 className="font-semibold">Fluxo Geral de Imagens Publicitárias</h3>
            </div>
            <span className="rounded bg-sky-950/60 px-2 py-0.5 text-[11px] font-medium text-sky-300 border border-sky-800/40">
              Orquestrador Ativo
            </span>
          </div>

          <p className="mb-4 text-xs text-slate-400">
            Controla a cadeia criativa com intermediário inteligente (Diretor de Arte) que interpreta briefing, fotos da Etapa 5 e BrandKit antes de acionar o motor gráfico.
          </p>

          <div className="space-y-4">
            {/* Planejador */}
            <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                1. Modelo Intermediário (Prompt Planner / Diretor Criativo)
              </label>
              <p className="mb-2 text-[11px] text-slate-400">
                Analisa referências fotográficas, aplica diretrizes de marca e estrutura o prompt em 10 blocos técnicos.
              </p>
              <select
                value={config.generalPlannerModel}
                onChange={(e) =>
                  setConfig({ ...config, generalPlannerModel: e.target.value })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
              >
                {options.planners.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Imagem Principal */}
            <div className="rounded-lg border border-emerald-900/40 bg-emerald-950/10 p-4">
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  2. Motor Gráfico Principal (Renderizador)
                </label>
                <span className="text-[10px] font-medium text-emerald-500">Primário</span>
              </div>
              <p className="mb-2 text-[11px] text-slate-400">
                Renderiza o anúncio final respeitando composição, tipografia e espaços de respiro sem crop destrutivo.
              </p>
              <select
                value={config.generalImageModel}
                onChange={(e) =>
                  setConfig({ ...config, generalImageModel: e.target.value })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                {options.imageGenerators.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Imagem Fallback */}
            <div className="rounded-lg border border-amber-900/40 bg-amber-950/10 p-4">
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                  3. Motor de Contingência (Fallback de Imagem)
                </label>
                <span className="text-[10px] font-medium text-amber-500">Redundância</span>
              </div>
              <p className="mb-2 text-[11px] text-slate-400">
                Acionado de forma automática e transparente se o motor principal retornar erro 429, timeout ou indisponibilidade.
              </p>
              <select
                value={config.generalFallbackImageModel}
                onChange={(e) =>
                  setConfig({ ...config, generalFallbackImageModel: e.target.value })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
              >
                {options.imageGenerators.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Nível de Qualidade e Custo de Imagem */}
            <div className="rounded-lg border border-sky-900/40 bg-sky-950/10 p-4">
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5 text-sky-400" />
                  4. Nível de Qualidade & Custo (OpenAI)
                </label>
                <span className="text-[10px] font-medium text-sky-500">Eficiência de Tokens</span>
              </div>
              <p className="mb-2 text-[11px] text-slate-400">
                Define a densidade de tokens e o acabamento das imagens geradas pelos modelos OpenAI (GPT-Image-2.5 / GPT Image 2). Permite economizar tokens em rascunhos ou elevar a fidelidade em campanhas finais.
              </p>
              <select
                value={config.imageQuality || "medium"}
                onChange={(e) =>
                  setConfig({ ...config, imageQuality: e.target.value })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
              >
                {options.imageQualities?.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Coluna 2: Assistentes Textuais e Avatar */}
        <div className="space-y-6">
          {/* Chat Vapti */}
          <div className="flex flex-col rounded-xl border border-slate-700/50 bg-slate-900/60 p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white">
                <Bot className="h-5 w-5 text-indigo-400" />
                <h3 className="font-semibold">Chat Vapti (Assistente Comercial)</h3>
              </div>
              <span className="rounded bg-indigo-950/60 px-2 py-0.5 text-[11px] font-medium text-indigo-300 border border-indigo-800/40">
                Conversacional
              </span>
            </div>
            <p className="mb-3 text-xs text-slate-400">
              Cérebro interativo que conversa com o usuário, extrai memórias do BrandKit e sugere pautas estratégicas.
            </p>
            <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Modelo Ativo do Chat
              </label>
              <select
                value={config.chatModel}
                onChange={(e) =>
                  setConfig({ ...config, chatModel: e.target.value })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                {options.chatAssistants.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Gerador de Ideias & Prompts */}
          <div className="flex flex-col rounded-xl border border-slate-700/50 bg-slate-900/60 p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white">
                <Sparkles className="h-5 w-5 text-amber-400" />
                <h3 className="font-semibold">Gerador de Ideias & Prompts</h3>
              </div>
              <span className="rounded bg-amber-950/60 px-2 py-0.5 text-[11px] font-medium text-amber-300 border border-amber-800/40">
                Copywriting
              </span>
            </div>
            <p className="mb-3 text-xs text-slate-400">
              Gera opções criativas de títulos, chamadas publicitárias e prompts em inglês para cada postagem.
            </p>
            <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Modelo de Ideias e Prompts
              </label>
              <select
                value={config.promptsIdeaModel}
                onChange={(e) =>
                  setConfig({ ...config, promptsIdeaModel: e.target.value })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
              >
                {options.promptGenerators.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Avatar IA (Digital Twin) - Congelado */}
          <div className="flex flex-col rounded-xl border border-purple-800/40 bg-purple-950/10 p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between border-b border-purple-800/30 pb-3">
              <div className="flex items-center gap-2 text-white">
                <ShieldCheck className="h-5 w-5 text-purple-400" />
                <h3 className="font-semibold">Avatar IA (Digital Twin Presença)</h3>
              </div>
              <span className="flex items-center gap-1 rounded bg-purple-900/60 px-2 py-0.5 text-[11px] font-semibold text-purple-200 border border-purple-700/50">
                <Lock className="h-3 w-3" />
                CONGELADO & HOMOLOGADO
              </span>
            </div>

            <p className="mb-3 text-xs text-slate-400">
              Fluxo protegido de clonagem visual e pose. Utiliza arquitetura dual multimodal proprietária com envio simultâneo de Selfie e Foto de Estilo.
            </p>

            <div className="rounded-lg border border-purple-900/30 bg-purple-950/30 p-3 text-xs text-slate-300">
              <div className="flex items-center justify-between font-mono text-[11px] text-purple-300">
                <span>Família Google Gemini Nano Banana Pro</span>
                <span className="text-[10px] text-slate-400">Dual Multimodal parts[1] + parts[2]</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Modelos de contingência fixos: <code className="text-purple-300">gemini-3-pro-image</code>, <code className="text-purple-300">gemini-2.0-flash-exp</code>, <code className="text-purple-300">gemini-3.5-flash</code>, <code className="text-purple-300">gemini-2.5-flash</code>.
              </p>
              <p className="mt-2 text-[10px] text-amber-400/90 font-medium">
                🔒 Bloqueado para edição por regra de negócio e garantia de fidelidade facial.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
