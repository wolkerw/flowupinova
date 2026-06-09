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
      ? `${prefix ?? ""}$${value.toFixed(2)}`
      : `${prefix ?? ""}${value.toLocaleString("pt-BR")}`;

  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/60 p-5 backdrop-blur-sm transition-all hover:border-slate-600 hover:bg-slate-800">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-slate-400">{title}</p>
          <p className={`mt-2 text-3xl font-bold ${color}`}>{formatted}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>
        <div className={`rounded-lg p-2.5 ${color.replace("text-", "bg-").replace("-400", "-500/10")}`}>
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
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Falha ao carregar dados");
      const data = await res.json();
      setStats(data.stats);
      setSignups(data.signups);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const planData = stats
    ? [
        { name: "Trial", value: stats.trialUsers - stats.trialExpiredUsers },
        { name: "Standard", value: stats.standardUsers },
        { name: "Expirado", value: stats.trialExpiredUsers },
      ].filter((d) => d.value > 0)
    : [];

  const signupsFormatted = signups.slice(-14).map((s) => ({
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">
            Visão geral da plataforma NumVapt
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-slate-500">
              Atualizado às {lastUpdated.toLocaleTimeString("pt-BR")}
            </span>
          )}
          <button
            onClick={fetchData}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </button>
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
          Conteúdo e Atividade
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard
            title="Imagens Geradas"
            value={stats?.totalImagesGenerated ?? 0}
            subtitle="Total na galeria"
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

      {/* Custo Estimado de APIs */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
          Custo Estimado de IA (USD)
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Gráfico de linha: novos cadastros */}
        <div className="lg:col-span-2 rounded-xl border border-slate-700/50 bg-slate-800/60 p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">
            Novos Cadastros (últimos 14 dias)
          </h3>
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
                strokeWidth={2}
                dot={{ fill: "#8b5cf6", r: 3 }}
                name="Novos usuários"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de pizza: distribuição de planos */}
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-5">
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
            <div className="flex h-40 items-center justify-center text-slate-500 text-sm">
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
              {stats.trialExpiredUsers} usuário{stats.trialExpiredUsers > 1 ? "s" : ""} com trial expirado
            </p>
            <p className="mt-0.5 text-xs text-orange-400/80">
              Estes usuários estão sem acesso ativo. Considere entrar em contato para converter em Standard.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
