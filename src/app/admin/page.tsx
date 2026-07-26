"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Image as ImageIcon,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  BarChart3,
  RefreshCw,
  MessageSquare,
  ShieldCheck,
  Cpu,
  Sparkles,
  Layers,
  Activity,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { ImageModelUsagePoint } from "@/lib/services/admin-dashboard-service";

interface GoogleAIStudioModelUsage {
  model: string;
  provider: string;
  type: string;
  requestsCount: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number;
  costBrl: number;
}

interface GoogleAIStudioRealStats {
  connected: boolean;
  statusMessage: string;
  availableModelsCount: number;
  totalRequests: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  totalImagesGenerated: number;
  totalCostUsd: number;
  totalCostBrl: number;
  usdToBrlRate: number;
  selectedPeriodDays: number | null;
  modelsUsage: GoogleAIStudioModelUsage[];
}

const MODEL_COLORS = [
  "#ec4899",
  "#8b5cf6",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#6366f1",
  "#06b6d4",
  "#f97316",
];

export const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data: ImageModelUsagePoint = payload[0].payload;
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-900/95 p-3 shadow-xl backdrop-blur-md text-xs space-y-1.5">
        <p className="font-bold text-white flex items-center gap-1.5">
          <Cpu className="h-3.5 w-3.5 text-sky-400" />
          {data.model}
        </p>
        <p className="text-slate-300">
          Gerações: <span className="font-semibold text-white">{data.count.toLocaleString("pt-BR")}</span>
        </p>
        <p className="text-slate-300">
          Custo Total: <span className="font-semibold text-emerald-400">${data.totalCostUsd.toFixed(4)}</span>
        </p>
        <div className="border-t border-slate-800 pt-1.5">
          <p className="font-semibold text-amber-400">
            Custo Médio / Geração: ${data.avgCostUsd.toFixed(4)} (R$ {data.avgCostBrl.toFixed(2)})
          </p>
        </div>
      </div>
    );
  }
  return null;
};

interface PlatformStats {
  totalUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  trialUsers: number;
  standardUsers: number;
  trialExpiredUsers: number;
  totalImagesGenerated: number;
  totalPostsPublished: number;
  totalPostsFailed: number;
  totalChatSessions: number;
  estimatedCostFalai: number;
  estimatedCostImagen4: number;
  estimatedCostNanoBanana: number;
  estimatedCostGemini: number;
  estimatedCostTotal: number;
}

interface SignupDataPoint {
  date: string;
  count: number;
}

const KpiCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  prefix,
  format,
}: {
  title: string;
  value: number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  prefix?: string;
  format?: "number" | "currency";
}) => {
  const formatted =
    format === "currency"
      ? `${prefix ?? ""}$${value.toFixed(4)}`
      : `${prefix ?? ""}${value.toLocaleString("pt-BR")}`;

  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/60 p-5 backdrop-blur-sm transition-all hover:border-slate-600 hover:bg-slate-800">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-slate-400">{title}</p>
          <p className={`mt-2 text-3xl font-bold ${color}`}>{formatted}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>
        <div
          className={`rounded-lg p-2.5 ${color.replace("text-", "bg-").replace("-400", "-500/10")}`}
        >
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
      </div>
    </div>
  );
};

const PLAN_COLORS: Record<string, string> = {
  Trial: "#8b5cf6",
  Standard: "#22c55e",
  Expirado: "#f97316",
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [signups, setSignups] = useState<SignupDataPoint[]>([]);
  const [dailyImages, setDailyImages] = useState<SignupDataPoint[]>([]);
  const [imageModelsUsage, setImageModelsUsage] = useState<ImageModelUsagePoint[]>([]);
  const [aiStudioStats, setAiStudioStats] = useState<GoogleAIStudioRealStats | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(30);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async (periodDays: number = selectedPeriod) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/stats?days=${periodDays}`);
      if (res.status === 403 || res.status === 401) {
        window.location.href = `/acesso/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      if (!res.ok) throw new Error("Falha ao carregar dados");
      const data = await res.json();
      setStats(data.stats);
      setSignups(data.signups);
      if (data.dailyImages) {
        setDailyImages(data.dailyImages);
      }
      if (data.imageModelsUsage) {
        setImageModelsUsage(data.imageModelsUsage);
      }
      if (data.googleAiStudio) {
        setAiStudioStats(data.googleAiStudio);
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    fetchData(selectedPeriod);
  }, [selectedPeriod, fetchData]);

  const handlePeriodChange = (days: number) => {
    setSelectedPeriod(days);
    fetchData(days);
  };

  const getPeriodLabel = (days: number) => {
    switch (days) {
      case 1:
        return "Hoje (24h)";
      case 7:
        return "Últimos 7 dias";
      case 30:
        return "Últimos 30 dias";
      case 90:
        return "Últimos 90 dias";
      case 365:
        return "Último ano";
      case 0:
        return "Todo o período";
      default:
        return `Últimos ${days} dias`;
    }
  };

  const planData = stats
    ? [
        { name: "Trial", value: stats.trialUsers - stats.trialExpiredUsers },
        { name: "Standard", value: stats.standardUsers },
        { name: "Expirado", value: stats.trialExpiredUsers },
      ].filter((d) => d.value > 0)
    : [];

  const signupsFormatted = signups.map((s) => ({
    ...s,
    date: new Date(s.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
  }));

  const dailyImagesFormatted = dailyImages.map((s) => ({
    ...s,
    date: new Date(s.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
  }));

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-violet-500" />
          <p className="text-slate-400">Carregando dados da plataforma...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">
            Visão geral da plataforma NumVapt ({getPeriodLabel(selectedPeriod)})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Seletor de Período Global */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 p-1 text-xs font-medium">
            <span className="px-2 text-slate-400">Período:</span>
            {[
              { label: "24h", value: 1 },
              { label: "7D", value: 7 },
              { label: "30D", value: 30 },
              { label: "90D", value: 90 },
              { label: "1 Ano", value: 365 },
              { label: "Tudo", value: 0 },
            ].map((p) => (
              <button
                key={p.value}
                onClick={() => handlePeriodChange(p.value)}
                className={`rounded px-2.5 py-1 transition-colors ${
                  selectedPeriod === p.value
                    ? "bg-violet-600 text-white font-bold"
                    : "text-slate-400 hover:bg-slate-700 hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {lastUpdated && (
            <span className="text-xs text-slate-500">
              Atualizado às {lastUpdated.toLocaleTimeString("pt-BR")}
            </span>
          )}
          <button
            onClick={() => fetchData(selectedPeriod)}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </button>
        </div>
      </div>

      {/* Gráficos Principais (No Início da Página) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Gráfico 1: Novos Cadastros */}
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-5 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              <TrendingUp className="h-4 w-4 text-violet-400" />
              Novos Cadastros ({getPeriodLabel(selectedPeriod)})
            </h3>
            <span className="text-xs font-medium text-slate-400">
              Total: {signups.reduce((acc, curr) => acc + curr.count, 0)}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={signupsFormatted}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#f1f5f9",
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#8b5cf6"
                strokeWidth={2.5}
                dot={{ fill: "#8b5cf6", r: 3 }}
                name="Novos usuários"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico 2: Quantidade de Imagens Geradas */}
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-5 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              <ImageIcon className="h-4 w-4 text-pink-400" />
              Imagens Geradas ({getPeriodLabel(selectedPeriod)})
            </h3>
            <span className="text-xs font-medium text-slate-400">
              Total: {dailyImages.reduce((acc, curr) => acc + curr.count, 0)}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailyImagesFormatted}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#f1f5f9",
                }}
              />
              <Bar dataKey="count" fill="#ec4899" radius={[4, 4, 0, 0]} name="Imagens geradas" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico 3: Modelos de Geração de Imagem (Pizza) */}
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-5 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              <PieChartIcon className="h-4 w-4 text-sky-400" />
              Modelos de Imagem ({getPeriodLabel(selectedPeriod)})
            </h3>
            <span className="text-xs font-medium text-slate-400">
              Modelos: {imageModelsUsage.length}
            </span>
          </div>
          {imageModelsUsage.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={imageModelsUsage}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  dataKey="count"
                  nameKey="model"
                  strokeWidth={0}
                >
                  {imageModelsUsage.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={MODEL_COLORS[index % MODEL_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-xs text-slate-500">
              Nenhuma imagem gerada no período
            </div>
          )}
        </div>
      </div>

      {/* KPIs Principais */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
          Usuários
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard
            title="Total de Usuários"
            value={stats?.totalUsers ?? 0}
            subtitle="Na plataforma"
            icon={Users}
            color="text-violet-400"
          />
          <KpiCard
            title="Novos Hoje"
            value={stats?.newUsersToday ?? 0}
            subtitle={`${stats?.newUsersThisWeek ?? 0} esta semana`}
            icon={TrendingUp}
            color="text-emerald-400"
          />
          <KpiCard
            title="Em Trial Ativo"
            value={stats?.trialUsers ? stats.trialUsers - stats.trialExpiredUsers : 0}
            subtitle="7 dias de acesso"
            icon={Clock}
            color="text-blue-400"
          />
          <KpiCard
            title="Assinantes Standard"
            value={stats?.standardUsers ?? 0}
            subtitle="Plano pago ativo"
            icon={CheckCircle}
            color="text-green-400"
          />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
          Conteúdo e Atividade ({getPeriodLabel(selectedPeriod)})
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard
            title="Imagens Geradas"
            value={stats?.totalImagesGenerated ?? 0}
            subtitle={getPeriodLabel(selectedPeriod)}
            icon={ImageIcon}
            color="text-pink-400"
          />
          <KpiCard
            title="Posts Publicados"
            value={stats?.totalPostsPublished ?? 0}
            subtitle="Com sucesso"
            icon={ShieldCheck}
            color="text-teal-400"
          />
          <KpiCard
            title="Posts com Falha"
            value={stats?.totalPostsFailed ?? 0}
            subtitle="Verificar logs"
            icon={AlertTriangle}
            color="text-red-400"
          />
          <KpiCard
            title="Sessões de Chat"
            value={stats?.totalChatSessions ?? 0}
            subtitle="Com o Vapti"
            icon={MessageSquare}
            color="text-amber-400"
          />
        </div>
      </div>

      {/* Custos e Consumo de IA */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Custos e Consumo de IA ({getPeriodLabel(selectedPeriod)})
          </h2>
          {aiStudioStats && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                aiStudioStats.connected
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-400"
              }`}
            >
              {aiStudioStats.connected ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <AlertTriangle className="h-3 w-3" />
              )}
              {aiStudioStats.connected ? "AI Studio Conectado" : "AI Studio Atenção"}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <KpiCard
            title="Custo Total Real (AI Studio)"
            value={aiStudioStats?.totalCostUsd ?? 0}
            subtitle={`R$ ${(aiStudioStats?.totalCostBrl ?? 0).toFixed(2)} (USD/BRL ~${aiStudioStats?.usdToBrlRate ?? 5.65})`}
            icon={DollarSign}
            color="text-emerald-400"
            format="currency"
          />
          <KpiCard
            title="Requisições AI Studio"
            value={aiStudioStats?.totalRequests ?? 0}
            subtitle="Total acumulado"
            icon={Activity}
            color="text-sky-400"
          />
          <KpiCard
            title="Tokens de Entrada"
            value={aiStudioStats?.totalPromptTokens ?? 0}
            subtitle="Prompt tokens"
            icon={Layers}
            color="text-indigo-400"
          />
          <KpiCard
            title="Tokens de Saída"
            value={aiStudioStats?.totalCompletionTokens ?? 0}
            subtitle="Completion tokens"
            icon={Layers}
            color="text-violet-400"
          />
          <KpiCard
            title="Gerações Imagen"
            value={aiStudioStats?.totalImagesGenerated ?? 0}
            subtitle="Imagens criadas"
            icon={ImageIcon}
            color="text-pink-400"
          />
          <KpiCard
            title="Fal.ai (Referência)"
            value={stats?.estimatedCostFalai ?? 0}
            subtitle="~$0.05 por imagem"
            icon={DollarSign}
            color="text-orange-400"
            format="currency"
          />
          <KpiCard
            title="Google Imagen 4"
            value={stats?.estimatedCostImagen4 ?? 0}
            subtitle="~$0.03 por imagem"
            icon={DollarSign}
            color="text-yellow-400"
            format="currency"
          />
          <KpiCard
            title="Nano Banana Pro"
            value={stats?.estimatedCostNanoBanana ?? 0}
            subtitle="~$0.03 por imagem"
            icon={DollarSign}
            color="text-pink-400"
            format="currency"
          />
          <KpiCard
            title="Google Gemini (Chat)"
            value={stats?.estimatedCostGemini ?? 0}
            subtitle="~800 tokens/sessão"
            icon={DollarSign}
            color="text-indigo-400"
            format="currency"
          />
          <KpiCard
            title="Custo Total Estimado"
            value={stats?.estimatedCostTotal ?? 0}
            subtitle="Valor acumulado total"
            icon={BarChart3}
            color="text-violet-400"
            format="currency"
          />
        </div>

        {/* Tabela de Consumo por Modelo do Google AI Studio */}
        {aiStudioStats && aiStudioStats.modelsUsage.length > 0 && (
          <div className="mt-4 overflow-hidden rounded-lg border border-slate-800 bg-slate-800/40">
            <div className="border-b border-slate-800 px-4 py-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Detalhamento por Modelo
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-[10px] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-4 py-2.5">Modelo</th>
                    <th className="px-4 py-2.5">Operação</th>
                    <th className="px-4 py-2.5 text-right">Chamadas</th>
                    <th className="px-4 py-2.5 text-right">Tokens Entrada</th>
                    <th className="px-4 py-2.5 text-right">Tokens Saída</th>
                    <th className="px-4 py-2.5 text-right">Custo USD</th>
                    <th className="px-4 py-2.5 text-right">Custo BRL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {aiStudioStats.modelsUsage.map((m, idx) => (
                    <tr key={idx} className="transition-colors hover:bg-slate-800/50">
                      <td className="flex items-center gap-2 px-4 py-2.5 font-medium text-white">
                        <Cpu className="h-3.5 w-3.5 text-sky-400" />
                        {m.model}
                      </td>
                      <td className="px-4 py-2.5 text-slate-400 capitalize">{m.type.replace("_", " ")}</td>
                      <td className="px-4 py-2.5 text-right font-medium">{m.requestsCount}</td>
                      <td className="px-4 py-2.5 text-right">{m.promptTokens.toLocaleString("pt-BR")}</td>
                      <td className="px-4 py-2.5 text-right">{m.completionTokens.toLocaleString("pt-BR")}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-emerald-400">
                        ${m.costUsd.toFixed(4)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-slate-400">
                        R$ {m.costBrl.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Distribuição de Planos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Gráfico de pizza: distribuição de planos */}
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-5 lg:col-span-3">
          <h3 className="mb-4 text-sm font-semibold text-white">Distribuição de Planos</h3>
          {planData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={planData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {planData.map((entry, index) => (
                      <Cell key={index} fill={PLAN_COLORS[entry.name] ?? "#6b7280"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      color: "#f1f5f9",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1.5">
                {planData.map((entry) => (
                  <div key={entry.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: PLAN_COLORS[entry.name] }}
                      />
                      <span className="text-slate-400">{entry.name}</span>
                    </div>
                    <span className="font-medium text-white">{entry.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-40 items-center justify-center text-sm text-slate-500">
              Sem dados de usuários
            </div>
          )}
        </div>
      </div>

      {/* Aviso de trials expirados */}
      {stats && stats.trialExpiredUsers > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-orange-500/30 bg-orange-500/10 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-400" />
          <div>
            <p className="text-sm font-semibold text-orange-300">
              {stats.trialExpiredUsers} usuário{stats.trialExpiredUsers > 1 ? "s" : ""} com trial
              expirado
            </p>
            <p className="mt-0.5 text-xs text-orange-400/80">
              Estes usuários estão sem acesso ativo. Considere entrar em contato para converter em
              Standard.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
