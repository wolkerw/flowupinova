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
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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

export default function AdminConteudoPage() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const topImageUsers = [...users]
    .sort((a, b) => b.imagesCount - a.imagesCount)
    .slice(0, 10);

  const topPostUsers = [...users]
    .sort((a, b) => b.postsCount - a.postsCount)
    .slice(0, 10);

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

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-violet-500" />
          <p className="text-slate-400">Carregando dados de conteúdo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Conteúdo Gerado</h1>
          <p className="mt-1 text-sm text-slate-400">
            Volume e saúde das gerações de conteúdo na plataforma
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </button>
      </div>

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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Ranking de imagens */}
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-5">
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-pink-400" />
            <h3 className="text-sm font-semibold text-white">Top Imagens Geradas</h3>
          </div>
          <div className="space-y-2">
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
          <div className="space-y-2">
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
  );
}
