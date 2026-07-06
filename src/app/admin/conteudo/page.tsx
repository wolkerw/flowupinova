"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  RefreshCw,
  Trophy,
  Activity,
  Layers,
  Search,
  Eye,
  Calendar,
  User,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  Clock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";

interface UserSummary {
  uid: string;
  email: string;
  displayName: string;
  imagesCount: number;
  postsCount: number;
}

interface PlatformStats {
  totalImagesGenerated: number;
  totalPostsPublished: number;
  totalPostsFailed: number;
}

interface PostItem {
  id: string;
  userId: string;
  text: string;
  imageUrl: string | null;
  imageUrls: string[];
  conceptUrls?: string[];
  status: "scheduled" | "publishing" | "published" | "failed" | "completed";
  platforms: string[];
  createdAt: string | null;
  scheduledAt: string | null;
  publishedAt: string | null;
  failureReason: string | null;
}

export default function AdminConteudoPage() {
  // Abas: stats (Painel Geral) e explore (Explorar Gerações)
  const [activeTab, setActiveTab] = useState<"stats" | "explore">("stats");

  // Dados Gerais
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Dados de Gerações
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [activeImageMap, setActiveImageMap] = useState<Record<string, string>>({});

  // Pesquisa/Filtros de Posts
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modais de Visualização
  const [selectedPost, setSelectedPost] = useState<PostItem | null>(null);
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);

  // Filtros de Gerações Diárias
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterDay, setFilterDay] = useState<string>("all");

  // Estatísticas Reais de Gerações (do Firestore apiUsageLogs via API dedicada)
  const [dailyStats, setDailyStats] = useState<{ date: string; geracoes: number }[]>([]);
  const [dailyStatsTotal, setDailyStatsTotal] = useState<number>(0);
  const [dailyStatsLoading, setDailyStatsLoading] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/stats"),
      ]);

      if (
        usersRes.status === 403 ||
        usersRes.status === 401 ||
        statsRes.status === 403 ||
        statsRes.status === 401
      ) {
        window.location.href = `/acesso/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        return;
      }

      if (!usersRes.ok || !statsRes.ok) {
        throw new Error("Falha ao carregar dados");
      }

      const usersData = await usersRes.json();
      const statsData = await statsRes.json();
      setUsers(usersData.users ?? []);
      setStats(statsData.stats ?? null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPosts = useCallback(async () => {
    setPostsLoading(true);
    setPostsError(null);
    try {
      const res = await fetch("/api/admin/posts");

      if (res.status === 403 || res.status === 401) {
        window.location.href = `/acesso/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        return;
      }

      if (!res.ok) {
        throw new Error("Falha ao buscar as postagens");
      }

      const data = await res.json();
      setPosts(data.posts ?? []);
    } catch (err: any) {
      console.error("[FETCH_ADMIN_POSTS] Erro:", err);
      setPostsError(err.message || "Erro desconhecido ao carregar as gerações.");
    } finally {
      setPostsLoading(false);
    }
  }, []);

  const fetchDailyStats = useCallback(async () => {
    setDailyStatsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterYear !== "all") params.append("year", filterYear);
      if (filterMonth !== "all") params.append("month", filterMonth);
      if (filterDay !== "all") params.append("day", filterDay);

      const res = await fetch(`/api/admin/daily-stats?${params.toString()}`);

      if (res.status === 403 || res.status === 401) {
        window.location.href = `/acesso/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        return;
      }

      if (!res.ok) {
        throw new Error("Falha ao buscar estatísticas diárias");
      }

      const data = await res.json();
      setDailyStats(data.stats ?? []);
      setDailyStatsTotal(data.total ?? 0);
    } catch (err: any) {
      console.error("[FETCH_DAILY_STATS] Erro:", err);
    } finally {
      setDailyStatsLoading(false);
    }
  }, [filterYear, filterMonth, filterDay]);

  useEffect(() => {
    fetchData();
    fetchPosts();
  }, [fetchData, fetchPosts]);

  useEffect(() => {
    fetchDailyStats();
  }, [fetchDailyStats]);

  // Rankings e Gráficos da aba Stats
  const topImageUsers = [...users].sort((a, b) => b.imagesCount - a.imagesCount).slice(0, 10);

  const topPostUsers = [...users].sort((a, b) => b.postsCount - a.postsCount).slice(0, 10);

  const chartData = topImageUsers.map((u) => ({
    name: u.displayName.split(" ")[0] || u.email.split("@")[0],
    imagens: u.imagesCount,
    posts: u.postsCount,
  }));

  const successRate =
    stats && stats.totalPostsPublished + stats.totalPostsFailed > 0
      ? Math.round(
          (stats.totalPostsPublished / (stats.totalPostsPublished + stats.totalPostsFailed)) * 100
        )
      : null;

  // Processamento de Gerações Diárias com Filtros (Substituído pela API para fidelidade de 100%)
  const availableYears = Array.from({ length: 5 }, (_, i) =>
    (new Date().getFullYear() - i).toString()
  );

  // Mapeador de usuário para exibir no grid de posts
  const getUserInfo = (userId: string) => {
    const matched = users.find((u) => u.uid === userId);
    return {
      displayName: matched?.displayName || "Usuário",
      email: matched?.email || "N/A",
    };
  };

  // Filtragem dos posts
  const filteredPosts = posts.filter((post) => {
    const userDetails = getUserInfo(post.userId);
    const matchesSearch =
      post.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userDetails.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userDetails.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "published" &&
        (post.status === "published" || post.status === "completed")) ||
      post.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Conteúdo Gerado</h1>
          <p className="mt-1 text-sm text-slate-400">
            Painel analítico e exploração visual de criações na plataforma NumVapt
          </p>
        </div>
        <div className="flex gap-2">
          {activeTab === "explore" && (
            <button
              onClick={fetchPosts}
              disabled={postsLoading}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-55"
            >
              <RefreshCw className={`h-4 w-4 ${postsLoading ? "animate-spin" : ""}`} />
              Recarregar Fotos
            </button>
          )}
          <button
            onClick={() => {
              fetchData();
              fetchDailyStats();
            }}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar Métricas
          </button>
        </div>
      </div>

      {/* Abas */}
      <div className="border-b border-slate-800">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab("stats")}
            className={`pb-3 text-sm font-semibold transition-colors ${
              activeTab === "stats"
                ? "border-b-2 border-violet-500 text-violet-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Gráficos e Estatísticas
          </button>
          <button
            onClick={() => setActiveTab("explore")}
            className={`pb-3 text-sm font-semibold transition-colors ${
              activeTab === "explore"
                ? "border-b-2 border-violet-500 text-violet-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Explorar Gerações Recentes
          </button>
        </div>
      </div>

      {loading && activeTab === "stats" ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-violet-500" />
            <p className="text-slate-400">Carregando dados...</p>
          </div>
        </div>
      ) : activeTab === "stats" ? (
        /* ==================== ABA 1: ESTATÍSTICAS ==================== */
        <div className="animate-fadeIn space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              {
                label: "Imagens Geradas",
                value: stats?.totalImagesGenerated ?? 0,
                icon: ImageIcon,
                color: "text-pink-400",
                bg: "bg-pink-400/10",
              },
              {
                label: "Posts Publicados",
                value: stats?.totalPostsPublished ?? 0,
                icon: CheckCircle,
                color: "text-emerald-400",
                bg: "bg-emerald-400/10",
              },
              {
                label: "Posts com Falha",
                value: stats?.totalPostsFailed ?? 0,
                icon: XCircle,
                color: "text-red-400",
                bg: "bg-red-400/10",
              },
              {
                label: "Taxa de Sucesso",
                value: successRate !== null ? `${successRate}%` : "—",
                icon: Activity,
                color: "text-violet-400",
                bg: "bg-violet-400/10",
                isString: true,
              },
            ].map(({ label, value, icon: Icon, color, bg, isString }) => (
              <div
                key={label}
                className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-widest text-slate-400">
                      {label}
                    </p>
                    <p className={`mt-2 text-3xl font-bold ${color}`}>
                      {isString ? value : Number(value).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <div className={`rounded-lg p-2.5 ${bg}`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Gráfico de barras: top usuários */}
          {chartData.length > 0 && (
            <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-5">
              <h3 className="mb-4 text-sm font-semibold text-white">
                Top 10 Usuários por Volume de Conteúdo
              </h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      color: "#f1f5f9",
                    }}
                  />
                  <Bar dataKey="imagens" fill="#ec4899" radius={[4, 4, 0, 0]} name="Imagens" />
                  <Bar dataKey="posts" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Posts" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Histórico de Gerações por Dia */}
          <div className="space-y-6 rounded-xl border border-slate-700/50 bg-slate-800/60 p-5">
            <div className="flex flex-col gap-4 border-b border-slate-700/40 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Histórico de Gerações por Dia</h3>
                <p className="mt-0.5 text-xs text-slate-400">
                  Acompanhe a quantidade exata de imagens e posts gerados por período.
                </p>
              </div>

              {/* Filtros */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Filtro Dia */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Dia
                  </label>
                  <select
                    value={filterDay}
                    onChange={(e) => setFilterDay(e.target.value)}
                    className="min-w-[70px] rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-300 focus:border-violet-500 focus:outline-none"
                  >
                    <option value="all">Todos</option>
                    {Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, "0")).map(
                      (d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* Filtro Mês */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Mês
                  </label>
                  <select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="min-w-[100px] rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-300 focus:border-violet-500 focus:outline-none"
                  >
                    <option value="all">Todos</option>
                    {[
                      { val: "01", name: "Janeiro" },
                      { val: "02", name: "Fevereiro" },
                      { val: "03", name: "Março" },
                      { val: "04", name: "Abril" },
                      { val: "05", name: "Maio" },
                      { val: "06", name: "Junho" },
                      { val: "07", name: "Julho" },
                      { val: "08", name: "Agosto" },
                      { val: "09", name: "Setembro" },
                      { val: "10", name: "Outubro" },
                      { val: "11", name: "Novembro" },
                      { val: "12", name: "Dezembro" },
                    ].map((m) => (
                      <option key={m.val} value={m.val}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro Ano */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Ano
                  </label>
                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="min-w-[80px] rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-300 focus:border-violet-500 focus:outline-none"
                  >
                    <option value="all">Todos</option>
                    {availableYears.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Limpar Filtros */}
                {(filterYear !== "all" || filterMonth !== "all" || filterDay !== "all") && (
                  <button
                    onClick={() => {
                      setFilterYear("all");
                      setFilterMonth("all");
                      setFilterDay("all");
                    }}
                    className="mt-5 rounded-lg border border-slate-700 bg-slate-950/60 px-2 py-1 text-xs text-slate-400 transition-colors hover:bg-slate-900 hover:text-white"
                  >
                    Limpar
                  </button>
                )}
              </div>
            </div>

            {dailyStatsLoading ? (
              <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900/20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-violet-500" />
                <p className="text-sm text-slate-400">Atualizando histórico de gerações...</p>
              </div>
            ) : dailyStats.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                {/* Gráfico */}
                <div className="xl:col-span-2">
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={dailyStats}>
                      <defs>
                        <linearGradient id="colorGeracoes" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                      <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1e293b",
                          border: "1px solid #334155",
                          borderRadius: "8px",
                          color: "#f1f5f9",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="geracoes"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorGeracoes)"
                        name="Gerações"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Tabela Detalhada com Informações Precisas */}
                <div className="flex max-h-[260px] flex-col overflow-hidden rounded-lg border border-slate-700 bg-slate-950/40">
                  <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-4 py-2 text-xs font-bold text-slate-300">
                    <span>Data</span>
                    <span>Qtd. Gerações</span>
                  </div>
                  <div className="scrollbar-thin scrollbar-thumb-slate-800 flex-1 divide-y divide-slate-800 overflow-y-auto">
                    {dailyStats.map((item) => (
                      <div
                        key={item.date}
                        className="flex items-center justify-between px-4 py-2 text-xs text-slate-300"
                      >
                        <span className="font-mono">{item.date}</span>
                        <span className="rounded-full bg-violet-500/10 px-2 py-0.5 font-bold text-violet-400">
                          {item.geracoes} {item.geracoes === 1 ? "geração" : "gerações"}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between border-t border-slate-800 bg-slate-900/30 px-4 py-2 text-[10px] font-medium text-slate-400">
                    <span>Total do período:</span>
                    <span className="font-bold text-white">
                      {dailyStatsTotal} {dailyStatsTotal === 1 ? "geração" : "gerações"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-700/60 bg-slate-900/20 py-10 text-center">
                <ImageIcon className="mb-2 h-8 w-8 text-slate-600 opacity-50" />
                <p className="text-sm font-medium text-slate-400">Nenhuma geração encontrada</p>
                <p className="mt-1 max-w-[280px] text-xs leading-normal text-slate-500">
                  Não houve registros de criação para o período de filtros selecionados.
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Ranking de imagens */}
            <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-pink-400" />
                <h3 className="text-sm font-semibold text-white">Top Imagens Geradas</h3>
              </div>
              <div className="space-y-3">
                {topImageUsers.map((u, i) => (
                  <div key={u.uid} className="flex items-center gap-3">
                    <span
                      className={`w-5 text-center text-xs font-bold ${
                        i === 0
                          ? "text-yellow-400"
                          : i === 1
                            ? "text-slate-300"
                            : i === 2
                              ? "text-amber-600"
                              : "text-slate-600"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-white">{u.displayName}</p>
                      <p className="truncate text-xs text-slate-500">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-1 rounded-full bg-pink-500/10 px-2 py-0.5">
                      <ImageIcon className="h-3 w-3 text-pink-400" />
                      <span className="text-xs font-bold text-pink-400">{u.imagesCount}</span>
                    </div>
                  </div>
                ))}
                {topImageUsers.length === 0 && (
                  <p className="text-center text-xs text-slate-500">Nenhum dado</p>
                )}
              </div>
            </div>

            {/* Ranking de posts */}
            <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Layers className="h-4 w-4 text-violet-400" />
                <h3 className="text-sm font-semibold text-white">Top Posts Publicados</h3>
              </div>
              <div className="space-y-3">
                {topPostUsers.map((u, i) => (
                  <div key={u.uid} className="flex items-center gap-3">
                    <span
                      className={`w-5 text-center text-xs font-bold ${
                        i === 0
                          ? "text-yellow-400"
                          : i === 1
                            ? "text-slate-300"
                            : i === 2
                              ? "text-amber-600"
                              : "text-slate-600"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-white">{u.displayName}</p>
                      <p className="truncate text-xs text-slate-500">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-0.5">
                      <Layers className="h-3 w-3 text-violet-400" />
                      <span className="text-xs font-bold text-violet-400">{u.postsCount}</span>
                    </div>
                  </div>
                ))}
                {topPostUsers.length === 0 && (
                  <p className="text-center text-xs text-slate-500">Nenhum dado</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ==================== ABA 2: EXPLORAR GERAÇÕES ==================== */
        <div className="animate-fadeIn space-y-6">
          {/* Filtros e Busca */}
          <div className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4 sm:flex-row">
            {/* Barra de Pesquisa */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Pesquisar por legenda, nome ou e-mail do usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:border-violet-500 focus:outline-none"
              />
            </div>
            {/* Filtro de Status */}
            <div className="flex gap-2 sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 focus:border-violet-500 focus:outline-none"
              >
                <option value="all">Todos os Status</option>
                <option value="published">Publicado</option>
                <option value="scheduled">Agendado</option>
                <option value="failed">Falhou</option>
              </select>
            </div>
          </div>

          {/* Estado de Carregamento */}
          {postsLoading ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-violet-500" />
              <p className="text-sm text-slate-400">Buscando imagens e posts gerados...</p>
            </div>
          ) : postsError ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-red-400" />
              <h3 className="mt-2 text-sm font-semibold text-white">Erro ao Carregar</h3>
              <p className="mt-1 text-xs text-slate-400">{postsError}</p>
              <button
                onClick={fetchPosts}
                className="mt-4 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20"
              >
                Tentar Novamente
              </button>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/20 py-16 text-center">
              <ImageIcon className="mx-auto h-10 w-10 text-slate-600" />
              <h3 className="mt-3 text-sm font-semibold text-white">Nenhuma geração encontrada</h3>
              <p className="mt-1 text-xs text-slate-500">
                {searchTerm || statusFilter !== "all"
                  ? "Tente mudar os filtros ou limpar o termo de pesquisa."
                  : "Nenhum usuário gerou posts ou imagens conceito até o momento."}
              </p>
            </div>
          ) : (
            /* Grid de Posts */
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredPosts.map((post) => {
                const creator = getUserInfo(post.userId);

                // Reunir todas as imagens únicas (finais, rascunhos e conceitos)
                const allImages = Array.from(
                  new Set([
                    ...(post.imageUrls || []),
                    ...(post.imageUrl ? [post.imageUrl] : []),
                    ...(post.conceptUrls || []),
                  ])
                ).filter(Boolean);

                const hasImages = allImages.length > 0;
                const currentImage = activeImageMap[post.id] || allImages[0];

                return (
                  <div
                    key={post.id}
                    className="flex flex-col overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/40 transition-all duration-200 hover:border-slate-700/60"
                  >
                    {/* Visualização de Imagem */}
                    <div className="group relative aspect-video w-full overflow-hidden bg-slate-950">
                      {hasImages ? (
                        <>
                          <img
                            src={currentImage}
                            alt="Preview"
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          {/* Botão de Zoom */}
                          <button
                            onClick={() => setZoomImageUrl(currentImage)}
                            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity duration-200 hover:bg-black/80 group-hover:opacity-100"
                            title="Ampliar Imagem"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center text-slate-600">
                          <ImageIcon className="h-10 w-10 opacity-40" />
                          <span className="mt-1 text-[11px]">Sem imagem vinculada</span>
                        </div>
                      )}

                      {/* Tag de Status */}
                      <div className="absolute bottom-2 left-2">
                        {post.status === "published" || post.status === "completed" ? (
                          <span className="flex items-center gap-1 rounded-full bg-emerald-500/90 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                            <CheckCircle className="h-3 w-3" /> Publicado
                          </span>
                        ) : post.status === "failed" ? (
                          <span className="flex items-center gap-1 rounded-full bg-red-500/90 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                            <XCircle className="h-3 w-3" /> Falhou
                          </span>
                        ) : post.status === "scheduled" ? (
                          <span className="flex items-center gap-1 rounded-full bg-blue-500/90 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                            <Calendar className="h-3 w-3" /> Agendado
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 rounded-full bg-amber-500/90 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                            <Clock className="h-3 w-3" /> Processando
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Exibir Miniaturas Interativas do Carrossel de Imagens */}
                    {allImages.length > 1 && (
                      <div className="scrollbar-thin scrollbar-thumb-slate-800 flex gap-2 overflow-x-auto border-b border-slate-800/60 bg-slate-950/40 p-2.5">
                        {allImages.map((imgUrl, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() =>
                              setActiveImageMap((prev) => ({ ...prev, [post.id]: imgUrl }))
                            }
                            className={`relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-150 ${
                              currentImage === imgUrl
                                ? "scale-105 border-violet-500 shadow-md shadow-violet-500/20"
                                : "border-slate-800 opacity-60 hover:border-slate-700 hover:opacity-100"
                            }`}
                          >
                            <img src={imgUrl} className="h-full w-full object-cover" />
                            {idx === 0 && (
                              <span className="absolute bottom-0 left-0 right-0 bg-violet-600/90 py-0.5 text-center text-[7px] font-bold uppercase tracking-wider text-white">
                                Ativa
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Dados do Criador */}
                    <div className="border-b border-slate-800/80 bg-slate-900/20 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-violet-400">
                          <User className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold text-slate-100">
                            {creator.displayName}
                          </p>
                          <p className="truncate text-[10px] text-slate-400">{creator.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Texto/Legenda do Post */}
                    <div className="flex flex-1 flex-col justify-between p-4">
                      <div className="space-y-2">
                        <p className="line-clamp-3 text-xs leading-relaxed text-slate-300">
                          {post.text || <em className="text-slate-500">Nenhum texto gerado</em>}
                        </p>
                        {post.text && post.text.length > 130 && (
                          <button
                            onClick={() => setSelectedPost(post)}
                            className="text-[11px] font-semibold text-violet-400 transition-colors hover:text-violet-300"
                          >
                            Ler Legenda Completa →
                          </button>
                        )}
                      </div>

                      {/* Rodapé do Card */}
                      <div className="mt-4 flex items-center justify-between border-t border-slate-800/60 pt-3 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-500" />
                          {post.createdAt
                            ? new Date(post.createdAt).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "N/A"}
                        </span>

                        <div className="flex gap-2">
                          {post.platforms.map((plat) => (
                            <span
                              key={plat}
                              className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-slate-300"
                            >
                              {plat}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Motivo de erro */}
                      {post.status === "failed" && post.failureReason && (
                        <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-[10px] text-red-400">
                          <strong>Erro:</strong> {post.failureReason}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal: Visualizar Legenda Completa */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="animate-scaleIn w-full max-w-xl rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-violet-400" />
                <h3 className="text-sm font-semibold text-white">Legenda Completa do Post</h3>
              </div>
              <button
                onClick={() => setSelectedPost(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Informações do Usuário no Modal */}
            <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-800/50 bg-slate-950/40 p-3 text-xs">
              <div>
                <p className="text-slate-400">Criado por:</p>
                <p className="font-bold text-white">
                  {getUserInfo(selectedPost.userId).displayName} (
                  {getUserInfo(selectedPost.userId).email})
                </p>
              </div>
              <div className="text-right">
                <p className="text-slate-400">Data:</p>
                <p className="font-bold text-white">
                  {selectedPost.createdAt
                    ? new Date(selectedPost.createdAt).toLocaleDateString("pt-BR")
                    : "N/A"}
                </p>
              </div>
            </div>

            <div className="mt-4 max-h-60 overflow-y-auto whitespace-pre-wrap rounded-lg bg-slate-950 p-4 text-xs leading-relaxed text-slate-200">
              {selectedPost.text}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedPost(null)}
                className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Zoom da Imagem */}
      {zoomImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setZoomImageUrl(null)}
        >
          <div className="relative max-h-[85vh] max-w-[85vw] overflow-hidden rounded-lg">
            <button
              onClick={() => setZoomImageUrl(null)}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
            >
              <XCircle className="h-5 w-5" />
            </button>
            <img
              src={zoomImageUrl}
              alt="Zoom"
              className="animate-scaleIn max-h-[85vh] max-w-[85vw] rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()} // impede fechar ao clicar na imagem em si
            />
          </div>
        </div>
      )}
    </div>
  );
}
