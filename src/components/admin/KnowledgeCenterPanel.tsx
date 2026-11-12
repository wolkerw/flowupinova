"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bot,
  Clock,
  DownloadCloud,
  Edit2,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  KNOWLEDGE_PENDING_MARKER,
  KNOWLEDGE_STALE_DAYS,
  type KnowledgeAudience,
  type KnowledgeCategory,
  type KnowledgeChannel,
  type WhatsAppKnowledgeTopic,
} from "@/lib/types/whatsapp-knowledge";

const API = "/api/admin/whatsapp/knowledge";

const CATEGORY_LABELS: Record<KnowledgeCategory, string> = {
  planos: "Planos e preços",
  contrato: "Contrato e garantia",
  promocoes: "Promoções",
  empresa: "Sobre a empresa",
  funcionalidades: "Funcionalidades",
  novidades: "Novidades",
  suporte: "Suporte",
  duvidas: "Dúvidas e objeções",
  outros: "Outros",
};

const CHANNEL_LABELS: Record<KnowledgeChannel, string> = {
  ambos: "WhatsApp e Instagram",
  whatsapp: "Só WhatsApp",
  instagram: "Só Instagram",
};

const AUDIENCE_LABELS: Record<KnowledgeAudience, string> = {
  todos: "Todos",
  lead: "Leads",
  cliente: "Clientes",
};

type Filter = "todos" | "whatsapp" | "instagram" | "pendencias";

interface TopicForm {
  title: string;
  category: KnowledgeCategory;
  content: string;
  isActive: boolean;
  channel: KnowledgeChannel;
  audience: KnowledgeAudience;
  expiresAt: string;
}

const EMPTY_FORM: TopicForm = {
  title: "",
  category: "funcionalidades",
  content: "",
  isActive: true,
  channel: "ambos",
  audience: "todos",
  expiresAt: "",
};

const THEMES = {
  dark: {
    panel: "border-slate-700/60 bg-slate-900/80",
    card: "border-slate-700/80 bg-slate-900/80 shadow-md",
    inner: "bg-slate-950/40 border-slate-800",
    title: "text-white",
    text: "text-slate-300",
    muted: "text-slate-400",
    input:
      "border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none",
    primary: "bg-violet-600 text-white hover:bg-violet-700",
    secondary: "border-slate-700 text-slate-300 hover:text-white hover:border-slate-500",
    accent: "text-violet-400",
    divider: "border-slate-800",
    chipOn: "bg-violet-600 text-white border-violet-600",
    chipOff: "border-slate-700 text-slate-400 hover:text-white",
    reply: "bg-slate-800 border-slate-700 text-slate-100",
  },
  light: {
    panel: "border-slate-200 bg-white shadow-sm",
    card: "border-slate-200 bg-white shadow-sm",
    inner: "bg-slate-50 border-slate-200",
    title: "text-slate-900",
    text: "text-slate-700",
    muted: "text-slate-500",
    input:
      "border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:border-pink-500 focus:outline-none",
    primary: "bg-pink-600 text-white hover:bg-pink-700",
    secondary: "border-slate-300 text-slate-600 hover:text-slate-900 hover:border-slate-400",
    accent: "text-pink-500",
    divider: "border-slate-200",
    chipOn: "bg-pink-600 text-white border-pink-600",
    chipOff: "border-slate-300 text-slate-500 hover:text-slate-900",
    reply: "bg-slate-50 border-slate-200 text-slate-800",
  },
} as const;

export function daysSince(iso: string | undefined, now = Date.now()): number {
  const t = iso ? new Date(iso).getTime() : NaN;
  return Number.isNaN(t) ? 0 : Math.floor((now - t) / 86_400_000);
}

export function isExpired(expiresAt: string | null | undefined, now = new Date()): boolean {
  if (!expiresAt) return false;
  const end = new Date(`${expiresAt.slice(0, 10)}T23:59:59.999-03:00`);
  return !Number.isNaN(end.getTime()) && now.getTime() > end.getTime();
}

export function hasPending(topic: Pick<WhatsAppKnowledgeTopic, "content">): boolean {
  return (topic.content || "").includes(KNOWLEDGE_PENDING_MARKER);
}

export default function KnowledgeCenterPanel({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const th = THEMES[variant];

  const [topics, setTopics] = useState<WhatsAppKnowledgeTopic[]>([]);
  const [defaults, setDefaults] = useState<WhatsAppKnowledgeTopic[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<Filter>("todos");
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const [editing, setEditing] = useState<WhatsAppKnowledgeTopic | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<TopicForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [importing, setImporting] = useState(false);

  const [testChannel, setTestChannel] = useState<"whatsapp" | "instagram">(
    variant === "light" ? "instagram" : "whatsapp"
  );
  const [testQuestion, setTestQuestion] = useState("");
  const [testing, setTesting] = useState(false);
  const [testReply, setTestReply] = useState("");
  const [testError, setTestError] = useState("");

  const fetchTopics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API);
      if (res.ok) {
        const data = await res.json();
        setTopics(data.topics || []);
        setDefaults(data.defaultTopics || []);
      }
    } catch (err) {
      console.error("Erro ao carregar central de conhecimento:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  const defaultsById = useMemo(() => new Map(defaults.map((d) => [d.id, d])), [defaults]);
  const missingDefaults = useMemo(
    () => defaults.filter((d) => !topics.some((t) => t.id === d.id)),
    [defaults, topics]
  );

  const stats = useMemo(() => {
    const now = new Date();
    return {
      pending: topics.filter(hasPending).length,
      stale: topics.filter((t) => t.isActive && daysSince(t.updatedAt) > KNOWLEDGE_STALE_DAYS).length,
      expired: topics.filter((t) => isExpired(t.expiresAt, now)).length,
    };
  }, [topics]);

  const visibleTopics = useMemo(() => {
    const now = new Date();
    const sorted = [...topics].sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
    switch (filter) {
      case "whatsapp":
      case "instagram":
        return sorted.filter((t) => !t.channel || t.channel === "ambos" || t.channel === filter);
      case "pendencias":
        return sorted.filter(
          (t) =>
            hasPending(t) ||
            isExpired(t.expiresAt, now) ||
            (t.isActive && daysSince(t.updatedAt) > KNOWLEDGE_STALE_DAYS)
        );
      default:
        return sorted;
    }
  }, [topics, filter]);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setFormOpen(true);
  };

  const openEdit = (topic: WhatsAppKnowledgeTopic) => {
    setEditing(topic);
    setForm({
      title: topic.title,
      category: topic.category,
      content: topic.content,
      isActive: topic.isActive,
      channel: topic.channel || "ambos",
      audience: topic.audience || "todos",
      expiresAt: topic.expiresAt ? topic.expiresAt.slice(0, 10) : "",
    });
    setFormError("");
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setFormError("");
  };

  const postTopic = async (payload: Record<string, unknown>) => {
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, error: data.error as string | undefined };
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (!form.title.trim() || !form.content.trim()) {
      setFormError("Preencha o título e o conteúdo.");
      return;
    }
    if (form.isActive && form.content.includes(KNOWLEDGE_PENDING_MARKER)) {
      setFormError(
        `Complete as informações e remova o marcador ${KNOWLEDGE_PENDING_MARKER}, ou salve o tópico como inativo.`
      );
      return;
    }

    setSaving(true);
    try {
      const { ok, error } = await postTopic({
        id: editing?.id,
        order: editing?.order,
        ...form,
        title: form.title.trim(),
        content: form.content.trim(),
        expiresAt: form.expiresAt || null,
      });
      if (!ok) {
        setFormError(error || "Não foi possível salvar o tópico.");
        return;
      }
      closeForm();
      setNotice({ kind: "ok", text: "Tópico salvo. A Maia já usa a nova versão." });
      fetchTopics();
    } catch (err) {
      console.error("Erro ao salvar tópico:", err);
      setFormError("Não foi possível salvar o tópico.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (topic: WhatsAppKnowledgeTopic) => {
    const nextActive = !topic.isActive;
    if (nextActive && hasPending(topic)) {
      setNotice({
        kind: "error",
        text: `"${topic.title}" ainda tem informações a preencher. Edite o tópico antes de ativar.`,
      });
      return;
    }
    setTopics((prev) => prev.map((t) => (t.id === topic.id ? { ...t, isActive: nextActive } : t)));
    const { ok, error } = await postTopic({ ...topic, isActive: nextActive });
    if (!ok) {
      setNotice({ kind: "error", text: error || "Não foi possível alterar o status." });
      fetchTopics();
    }
  };

  const handleDelete = async (topic: WhatsAppKnowledgeTopic) => {
    if (!confirm(`Excluir "${topic.title}" da central de informações da Maia?`)) return;
    try {
      const res = await fetch(`${API}?id=${encodeURIComponent(topic.id)}`, { method: "DELETE" });
      if (res.ok) setTopics((prev) => prev.filter((t) => t.id !== topic.id));
    } catch (err) {
      console.error("Erro ao excluir tópico:", err);
    }
  };

  const patch = async (body: Record<string, unknown>) => {
    const res = await fetch(API, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return { ok: res.ok, data: await res.json().catch(() => ({})) };
  };

  const handleImportDefaults = async () => {
    setImporting(true);
    try {
      const { ok, data } = await patch({ action: "import-defaults" });
      if (ok) {
        const n = (data.imported || []).length;
        setNotice({
          kind: "ok",
          text:
            n > 0
              ? `${n} tópico(s) padrão importado(s). Os que dependem de dados do negócio chegam inativos.`
              : "Todos os tópicos padrão já estão na central.",
        });
        fetchTopics();
      } else {
        setNotice({ kind: "error", text: data.error || "Falha ao importar tópicos padrão." });
      }
    } finally {
      setImporting(false);
    }
  };

  const handleRestoreDefault = async (topic: WhatsAppKnowledgeTopic) => {
    if (!confirm(`Substituir "${topic.title}" pela versão padrão? As edições feitas neste tópico serão perdidas.`))
      return;
    const { ok, data } = await patch({ action: "restore-default", id: topic.id });
    if (ok) {
      setNotice({ kind: "ok", text: "Versão padrão restaurada." });
      fetchTopics();
    } else {
      setNotice({ kind: "error", text: data.error || "Falha ao restaurar a versão padrão." });
    }
  };

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (testing) return;
    if (!testQuestion.trim()) {
      setTestError("Digite uma pergunta para testar.");
      return;
    }
    setTesting(true);
    setTestError("");
    setTestReply("");
    try {
      const res = await fetch(`${API}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: testChannel, message: testQuestion.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setTestError(data.error || "Não foi possível gerar a resposta de teste.");
        return;
      }
      setTestReply(data.replyText || "(resposta vazia)");
    } catch {
      setTestError("Não foi possível gerar a resposta de teste.");
    } finally {
      setTesting(false);
    }
  };

  const differsFromDefault = (topic: WhatsAppKnowledgeTopic) => {
    const def = defaultsById.get(topic.id);
    return Boolean(def && (def.content !== topic.content || def.title !== topic.title));
  };

  const badge = "px-2 py-0.5 rounded-full text-[10px] font-semibold border";

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className={cn("flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-5 rounded-2xl border", th.panel)}>
        <div>
          <h2 className={cn("text-base font-bold flex items-center gap-2", th.title)}>
            <Sparkles className={cn("h-4 w-4", th.accent)} />
            Central de informações da Maia (WhatsApp e Instagram)
          </h2>
          <p className={cn("text-xs mt-1 max-w-2xl", th.muted)}>
            Preços, regras, funcionalidades e novidades que a Maia consulta em tempo real. Cada tópico pode valer
            para um canal, para leads ou clientes, e ter data de validade.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          {missingDefaults.length > 0 && (
            <button
              onClick={handleImportDefaults}
              disabled={importing}
              className={cn("flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold disabled:opacity-50", th.secondary)}
            >
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <DownloadCloud className="h-4 w-4" />}
              Importar {missingDefaults.length} tópico(s) padrão
            </button>
          )}
          <button
            onClick={openNew}
            className={cn("flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold", th.primary)}
          >
            <Plus className="h-4 w-4" />
            Novo tópico
          </button>
        </div>
      </div>

      {notice && (
        <div
          role="status"
          className={cn(
            "flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-xs",
            notice.kind === "ok"
              ? "border-green-500/30 bg-green-500/10 text-green-600"
              : "border-red-500/30 bg-red-500/10 text-red-500"
          )}
        >
          <span>{notice.text}</span>
          <button onClick={() => setNotice(null)} aria-label="Fechar aviso">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Resumo de pendências */}
      {(stats.pending > 0 || stats.stale > 0 || stats.expired > 0) && (
        <div className="flex flex-wrap gap-2 text-[11px]">
          {stats.pending > 0 && (
            <span className={cn(badge, "bg-amber-500/10 text-amber-600 border-amber-500/30")}>
              {stats.pending} tópico(s) aguardando preenchimento
            </span>
          )}
          {stats.stale > 0 && (
            <span className={cn(badge, "bg-orange-500/10 text-orange-600 border-orange-500/30")}>
              {stats.stale} ativo(s) sem revisão há mais de {KNOWLEDGE_STALE_DAYS} dias
            </span>
          )}
          {stats.expired > 0 && (
            <span className={cn(badge, "bg-red-500/10 text-red-500 border-red-500/30")}>
              {stats.expired} vencido(s): a Maia não usa mais
            </span>
          )}
        </div>
      )}

      {/* Formulário */}
      {formOpen && (
        <div className={cn("p-5 rounded-2xl border space-y-4", th.panel)}>
          <div className={cn("flex items-center justify-between border-b pb-3", th.divider)}>
            <h3 className={cn("text-sm font-bold flex items-center gap-2", th.title)}>
              <Edit2 className={cn("h-4 w-4", th.accent)} />
              {editing ? "Editar tópico" : "Novo tópico"}
            </h3>
            <button onClick={closeForm} className={th.muted} aria-label="Fechar formulário">
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className={cn("block text-xs font-medium mb-1", th.text)}>Título</label>
                <input
                  type="text"
                  placeholder="Tabela de preços, Black Friday, Como conectar o Instagram"
                  value={form.title}
                  onChange={(e) => {
                    setForm({ ...form, title: e.target.value });
                    setFormError("");
                  }}
                  className={cn("w-full rounded-xl border px-3.5 py-2 text-xs", th.input)}
                />
              </div>
              <div>
                <label className={cn("block text-xs font-medium mb-1", th.text)}>Categoria</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as KnowledgeCategory })}
                  className={cn("w-full rounded-xl border px-3 py-2 text-xs", th.input)}
                >
                  {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={cn("block text-xs font-medium mb-1", th.text)}>Canal</label>
                <select
                  value={form.channel}
                  onChange={(e) => setForm({ ...form, channel: e.target.value as KnowledgeChannel })}
                  className={cn("w-full rounded-xl border px-3 py-2 text-xs", th.input)}
                >
                  {Object.entries(CHANNEL_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={cn("block text-xs font-medium mb-1", th.text)}>Público</label>
                <select
                  value={form.audience}
                  onChange={(e) => setForm({ ...form, audience: e.target.value as KnowledgeAudience })}
                  className={cn("w-full rounded-xl border px-3 py-2 text-xs", th.input)}
                >
                  <option value="todos">Todos</option>
                  <option value="lead">Leads (ainda não são clientes)</option>
                  <option value="cliente">Clientes (já assinam)</option>
                </select>
              </div>
              <div>
                <label className={cn("block text-xs font-medium mb-1", th.text)}>Válido até (opcional)</label>
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  className={cn("w-full rounded-xl border px-3 py-2 text-xs", th.input)}
                />
              </div>
            </div>

            <div>
              <label className={cn("block text-xs font-medium mb-1", th.text)}>Conteúdo e instruções para a Maia</label>
              <textarea
                rows={7}
                placeholder="Informações que a Maia deve usar ao falar sobre este assunto, com links oficiais."
                value={form.content}
                onChange={(e) => {
                  setForm({ ...form, content: e.target.value });
                  setFormError("");
                }}
                className={cn("w-full rounded-xl border p-3 text-xs", th.input)}
              />
              {form.content.includes(KNOWLEDGE_PENDING_MARKER) && (
                <p className="mt-1 text-[11px] text-amber-600">
                  Este tópico tem trechos marcados com {KNOWLEDGE_PENDING_MARKER}. Complete-os e apague o marcador para
                  poder ativá-lo.
                </p>
              )}
            </div>

            {formError && <p className="text-[13px] text-red-500">{formError}</p>}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <label className={cn("flex items-center gap-2 cursor-pointer text-xs", th.text)}>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => {
                    setForm({ ...form, isActive: e.target.checked });
                    setFormError("");
                  }}
                />
                Ativo (a Maia passa a usar imediatamente)
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className={cn("px-4 py-2 rounded-xl text-xs font-semibold border", th.secondary)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={cn("flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-50", th.primary)}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Salvar
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Testar resposta */}
      <form onSubmit={handleTest} className={cn("p-5 rounded-2xl border space-y-3", th.panel)}>
        <h3 className={cn("text-sm font-bold flex items-center gap-2", th.title)}>
          <Bot className={cn("h-4 w-4", th.accent)} />
          Testar resposta da Maia
        </h3>
        <p className={cn("text-xs", th.muted)}>
          Simula a resposta com a central atual. Nada é enviado a clientes.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={testChannel}
            onChange={(e) => setTestChannel(e.target.value as "whatsapp" | "instagram")}
            className={cn("rounded-xl border px-3 py-2 text-xs sm:w-40", th.input)}
            aria-label="Canal do teste"
          >
            <option value="whatsapp">WhatsApp</option>
            <option value="instagram">Instagram Direct</option>
          </select>
          <input
            type="text"
            value={testQuestion}
            onChange={(e) => {
              setTestQuestion(e.target.value);
              setTestError("");
            }}
            placeholder="Quanto custa o anúncio? O teste grátis tem limite?"
            className={cn("flex-1 rounded-xl border px-3.5 py-2 text-xs", th.input)}
            aria-label="Pergunta de teste"
          />
          <button
            type="submit"
            disabled={testing}
            className={cn("flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-50", th.primary)}
          >
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Testar
          </button>
        </div>
        {testError && <p className="text-[13px] text-red-500">{testError}</p>}
        {testReply && (
          <p className={cn("text-xs whitespace-pre-wrap leading-relaxed rounded-xl border p-3", th.reply)}>{testReply}</p>
        )}
      </form>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["todos", `Todos (${topics.length})`],
            ["whatsapp", "Usados no WhatsApp"],
            ["instagram", "Usados no Instagram"],
            ["pendencias", "Precisam de atenção"],
          ] as [Filter, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={cn("rounded-full border px-3 py-1 text-[11px] font-semibold", filter === value ? th.chipOn : th.chipOff)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tópicos */}
      {loading ? (
        <div className={cn("flex flex-col items-center justify-center h-48", th.muted)}>
          <Loader2 className="h-6 w-6 animate-spin mb-2" />
          <span className="text-xs">Carregando a central de informações...</span>
        </div>
      ) : visibleTopics.length === 0 ? (
        <div className={cn("p-8 rounded-2xl border text-center text-xs", th.panel, th.muted)}>
          Nenhum tópico neste filtro.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleTopics.map((topic) => {
            const pending = hasPending(topic);
            const expired = isExpired(topic.expiresAt);
            const age = daysSince(topic.updatedAt);
            const stale = topic.isActive && age > KNOWLEDGE_STALE_DAYS;
            const usable = topic.isActive && !pending && !expired;
            return (
              <div
                key={topic.id}
                className={cn("p-4 rounded-2xl border flex flex-col justify-between", th.card, !usable && "opacity-70")}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    <span className={cn(badge, "bg-blue-500/10 text-blue-500 border-blue-500/20")}>
                      {CATEGORY_LABELS[topic.category] || topic.category}
                    </span>
                    <span className={cn(badge, "bg-slate-500/10 border-slate-500/20", th.muted)}>
                      {CHANNEL_LABELS[topic.channel || "ambos"]}
                    </span>
                    <span className={cn(badge, "bg-slate-500/10 border-slate-500/20", th.muted)}>
                      {AUDIENCE_LABELS[topic.audience || "todos"]}
                    </span>
                    <button
                      onClick={() => handleToggle(topic)}
                      title={topic.isActive ? "Desativar tópico" : "Ativar tópico"}
                      className={cn(
                        badge,
                        "ml-auto",
                        topic.isActive
                          ? "bg-green-500/10 text-green-600 border-green-500/20"
                          : "bg-slate-500/10 border-slate-500/20 " + th.muted
                      )}
                    >
                      {topic.isActive ? "Ativo" : "Inativo"}
                    </button>
                  </div>

                  {(pending || expired || stale) && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {pending && (
                        <span className={cn(badge, "flex items-center gap-1 bg-amber-500/10 text-amber-600 border-amber-500/30")}>
                          <AlertTriangle className="h-3 w-3" /> Falta preencher
                        </span>
                      )}
                      {expired && (
                        <span className={cn(badge, "bg-red-500/10 text-red-500 border-red-500/30")}>
                          Vencido em {new Date(`${topic.expiresAt!.slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                      {stale && (
                        <span className={cn(badge, "flex items-center gap-1 bg-orange-500/10 text-orange-600 border-orange-500/30")}>
                          <Clock className="h-3 w-3" /> Sem revisão há {age} dias
                        </span>
                      )}
                    </div>
                  )}

                  <h4 className={cn("text-sm font-bold mb-2", th.title)}>{topic.title}</h4>
                  <p className={cn("text-xs whitespace-pre-wrap leading-relaxed p-3 rounded-xl border max-h-64 overflow-y-auto", th.text, th.inner)}>
                    {topic.content}
                  </p>
                </div>

                <div className={cn("flex flex-wrap items-center justify-between gap-2 pt-4 mt-3 border-t text-[10px]", th.divider, th.muted)}>
                  <span>
                    Atualizado em {new Date(topic.updatedAt).toLocaleDateString("pt-BR")}
                    {topic.expiresAt && !expired
                      ? ` · válido até ${new Date(`${topic.expiresAt.slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR")}`
                      : ""}
                  </span>
                  <div className="flex gap-3">
                    {differsFromDefault(topic) && (
                      <button
                        onClick={() => handleRestoreDefault(topic)}
                        className="flex items-center gap-1 hover:underline"
                        title="Substituir pelo texto padrão mais recente"
                      >
                        <RotateCcw className="h-3 w-3" /> Restaurar padrão
                      </button>
                    )}
                    <button onClick={() => openEdit(topic)} className="flex items-center gap-1 hover:underline">
                      <Edit2 className="h-3 w-3" /> Editar
                    </button>
                    <button
                      onClick={() => handleDelete(topic)}
                      className="text-red-500 hover:text-red-400 flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" /> Excluir
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
