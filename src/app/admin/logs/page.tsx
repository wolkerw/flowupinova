"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FileWarning,
  RefreshCw,
  AlertTriangle,
  Clock,
  User,
  Instagram,
  Facebook,
  CheckCircle,
} from "lucide-react";

interface FailedPost {
  uid: string;
  postId: string;
  reason: string;
  scheduledAt: string;
  platforms: string[];
}

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  instagram: Instagram,
  facebook: Facebook,
};

export default function AdminLogsPage() {
  const [failedPosts, setFailedPosts] = useState<FailedPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/logs");
      if (res.status === 403 || res.status === 401) {
        window.location.href = `/acesso/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      if (!res.ok) throw new Error("Falha ao carregar logs");
      const data = await res.json();
      setFailedPosts(data.failedPosts ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Logs & Erros</h1>
          <p className="mt-1 text-sm text-slate-400">
            Posts com falha e erros de publicação na plataforma
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </button>
      </div>

      {/* Banner de resumo */}
      <div
        className={`flex items-start gap-3 rounded-xl border p-4 ${
          failedPosts.length > 0
            ? "border-red-500/30 bg-red-500/10"
            : "border-green-500/30 bg-green-500/10"
        }`}
      >
        {failedPosts.length > 0 ? (
          <>
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
            <div>
              <p className="text-sm font-semibold text-red-300">
                {failedPosts.length} post{failedPosts.length > 1 ? "s" : ""} com falha encontrado
                {failedPosts.length > 1 ? "s" : ""}
              </p>
              <p className="mt-0.5 text-xs text-red-400/80">
                Verifique os motivos abaixo e entre em contato com os usuários afetados se
                necessário.
              </p>
            </div>
          </>
        ) : (
          <>
            <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-400" />
            <div>
              <p className="text-sm font-semibold text-green-300">Tudo certo!</p>
              <p className="mt-0.5 text-xs text-green-400/80">
                Nenhum post com falha encontrado na plataforma.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Tabela de posts com falha */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-violet-500" />
            <p className="text-sm text-slate-400">Carregando logs...</p>
          </div>
        </div>
      ) : failedPosts.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-xl border border-slate-700/50 bg-slate-800/30">
          <FileWarning className="h-10 w-10 text-slate-600" />
          <p className="text-sm text-slate-500">Nenhum post com falha registrado</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-700/50">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/80">
                <tr className="text-left text-xs font-semibold uppercase tracking-widest text-slate-500">
                  <th className="px-4 py-3">Usuário</th>
                  <th className="px-4 py-3">Post ID</th>
                  <th className="px-4 py-3">Plataformas</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Motivo da Falha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40 bg-slate-900">
                {failedPosts.map((post) => (
                  <tr key={`${post.uid}-${post.postId}`} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-slate-500" />
                        <span className="font-mono text-xs text-slate-400">
                          {post.uid.substring(0, 12)}…
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-slate-400">
                        {post.postId.substring(0, 12)}…
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        {post.platforms.map((p) => {
                          const Icon = PLATFORM_ICONS[p.toLowerCase()];
                          return Icon ? (
                            <Icon key={p} className="h-4 w-4 text-slate-400" />
                          ) : (
                            <span key={p} className="text-xs text-slate-500">
                              {p}
                            </span>
                          );
                        })}
                        {post.platforms.length === 0 && (
                          <span className="text-xs text-slate-600">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock className="h-3.5 w-3.5" />
                        {post.scheduledAt
                          ? new Date(post.scheduledAt).toLocaleString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-xs">
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-red-500/20 bg-red-500/10 px-2 py-1 text-xs text-red-400">
                          <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{post.reason}</span>
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
