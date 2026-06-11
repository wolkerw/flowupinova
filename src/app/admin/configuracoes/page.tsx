"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Save, Loader2, Settings, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";

interface GlobalSettings {
  generateImagesWebhook: string;
  generateTextWebhook: string;
  chatWebhook: string;
  postManualWebhook: string;
  imgNoLogoWebhook: string;
  imgRefWebhook: string;
  generatePromptsWebhook: string;
  generateImagesFalaiWebhook: string;
  analisarPresencaWebhook: string;
  generateAvatarWebhook: string;
  serverTimeout: string;
}

const WEBHOOK_LABELS: Record<keyof GlobalSettings, string> = {
  generateImagesWebhook: "Gerador de Imagens (n8n)",
  generateTextWebhook: "Gerador de Textos e Ideias (n8n)",
  chatWebhook: "Chat Vapti (n8n)",
  postManualWebhook: "Post Manual (n8n)",
  imgNoLogoWebhook: "Imagem Sem Logo (n8n)",
  imgRefWebhook: "Imagem com Referência (n8n)",
  generatePromptsWebhook: "Gerador de Prompts (n8n)",
  generateImagesFalaiWebhook: "Gerador Fal.ai (n8n)",
  analisarPresencaWebhook: "Analisar Presença (n8n)",
  generateAvatarWebhook: "Gerador de Avatar Digital Twin (n8n)",
  serverTimeout: "Timeout do Servidor (segundos)",
};

const DEFAULT_SETTINGS: GlobalSettings = {
  generateImagesWebhook: "https://webhook.flowupinova.com.br/webhook/gerador_de_imagem",
  generateTextWebhook: "https://webhook.flowupinova.com.br/webhook/gerador_de_ideias",
  chatWebhook: "https://webhook.flowupinova.com.br/webhook/chat",
  postManualWebhook: "https://webhook.flowupinova.com.br/webhook/post_manual",
  imgNoLogoWebhook: "https://webhook.flowupinova.com.br/webhook/imagem_sem_logo",
  imgRefWebhook: "https://webhook.flowupinova.com.br/webhook/gerador_imagem_referencia",
  generatePromptsWebhook: "https://webhook.flowupinova.com.br/webhook/gerador-prompts",
  generateImagesFalaiWebhook: "https://n8n.flowupinova.com.br/webhook-test/gerador-imagem-falai",
  analisarPresencaWebhook: "https://webhook.flowupinova.com.br/webhook/analisar-presenca",
  generateAvatarWebhook: "https://webhook.flowupinova.com.br/webhook/gerador_avatar_twin",
  serverTimeout: "300",
};

const WEBHOOK_KEYS = Object.keys(DEFAULT_SETTINGS).filter(
  (k) => k !== "serverTimeout"
) as (keyof GlobalSettings)[];

export default function AdminConfiguracoesPage() {
  const [settings, setSettings] = useState<GlobalSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, "ok" | "fail" | "testing">>({});
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      if (res.status === 403 || res.status === 401) {
        window.location.href = `/acesso/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      if (!res.ok) throw new Error("Falha ao carregar configurações");
      const data = await res.json();
      if (data.settings && Object.keys(data.settings).length > 0) {
        setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus("idle");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.status === 403 || res.status === 401) {
        window.location.href = `/acesso/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      setSaveStatus(res.ok ? "success" : "error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (key: keyof GlobalSettings) => {
    const url = settings[key];
    if (!url || !url.startsWith("http")) return;

    setTestingKey(key);
    setTestResults((prev) => ({ ...prev, [key]: "testing" }));
    try {
      await fetch(url, { method: "GET", signal: AbortSignal.timeout(5000) });
      setTestResults((prev) => ({ ...prev, [key]: "ok" }));
    } catch {
      setTestResults((prev) => ({ ...prev, [key]: "fail" }));
    } finally {
      setTestingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-violet-500" />
          <p className="text-slate-400">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Configurações Globais</h1>
          <p className="mt-1 text-sm text-slate-400">
            Gerencie os webhooks e parâmetros técnicos da plataforma
          </p>
        </div>
        <button
          onClick={fetchSettings}
          className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white"
        >
          <RefreshCw className="h-4 w-4" />
          Recarregar
        </button>
      </div>

      {/* Webhooks */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/60">
        <div className="flex items-center gap-3 border-b border-slate-700/50 px-5 py-4">
          <Settings className="h-4 w-4 text-violet-400" />
          <h2 className="text-sm font-semibold text-white">URLs de Webhooks (n8n)</h2>
        </div>
        <div className="divide-y divide-slate-700/40">
          {WEBHOOK_KEYS.map((key) => {
            const testResult = testResults[key];
            return (
              <div key={key} className="px-5 py-4">
                <label className="mb-1.5 block text-xs font-medium text-slate-400">
                  {WEBHOOK_LABELS[key]}
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={settings[key]}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs text-slate-200 focus:border-violet-500 focus:outline-none"
                    placeholder="https://..."
                  />
                  <button
                    onClick={() => handleTest(key)}
                    disabled={testingKey === key}
                    title="Testar conectividade"
                    className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-400 transition-colors hover:border-slate-600 hover:text-white disabled:opacity-50"
                  >
                    {testingKey === key ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : testResult === "ok" ? (
                      <CheckCircle className="h-3.5 w-3.5 text-green-400" />
                    ) : testResult === "fail" ? (
                      <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                    ) : (
                      <span className="text-xs">Testar</span>
                    )}
                  </button>
                </div>
                {testResult === "ok" && (
                  <p className="mt-1 text-xs text-green-400">✓ Respondendo</p>
                )}
                {testResult === "fail" && (
                  <p className="mt-1 text-xs text-red-400">✗ Sem resposta ou erro (timeout 5s)</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeout */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-5">
        <label className="mb-1.5 block text-xs font-medium text-slate-400">
          {WEBHOOK_LABELS.serverTimeout}
        </label>
        <input
          type="number"
          min={30}
          max={600}
          value={settings.serverTimeout}
          onChange={(e) => setSettings((prev) => ({ ...prev, serverTimeout: e.target.value }))}
          className="w-48 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
        />
        <p className="mt-1 text-xs text-slate-500">
          Tempo máximo de espera por resposta dos webhooks. Padrão: 300s.
        </p>
      </div>

      {/* Botão Salvar */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Salvando..." : "Salvar Configurações"}
        </button>
        {saveStatus === "success" && (
          <div className="flex items-center gap-2 text-sm text-green-400">
            <CheckCircle className="h-4 w-4" />
            Configurações salvas com sucesso!
          </div>
        )}
        {saveStatus === "error" && (
          <div className="flex items-center gap-2 text-sm text-red-400">
            <AlertTriangle className="h-4 w-4" />
            Erro ao salvar. Tente novamente.
          </div>
        )}
      </div>
    </div>
  );
}
