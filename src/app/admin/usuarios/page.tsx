"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Filter,
  ChevronDown,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  X,
  Image as ImageIcon,
  FileText,
  AlertTriangle,
  RefreshCw,
  Trash2,
  ShieldOff,
  ShieldCheck,
  CalendarPlus,
  Eye,
  Phone,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UserSummary {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  segment?: string;
  plan: "trial" | "standard" | "blocked";
  paymentStatus: string;
  createdAt: string;
  trialDaysLeft: number;
  trialExpired: boolean;
  postsCount: number;
  imagesCount: number;
  lastSignIn?: string;
}

type PlanFilter = "all" | "trial" | "standard" | "blocked" | "expired";

const PLAN_LABELS: Record<string, string> = {
  trial: "Trial",
  standard: "Standard",
  blocked: "Bloqueado",
};

const PLAN_COLORS: Record<string, string> = {
  trial: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  standard: "text-green-400 bg-green-400/10 border-green-400/20",
  blocked: "text-red-400 bg-red-400/10 border-red-400/20",
};

const Avatar = ({ name, email }: { name: string; email: string }) => {
  const initials = (name || email).charAt(0).toUpperCase();
  const colors = [
    "bg-violet-600",
    "bg-blue-600",
    "bg-emerald-600",
    "bg-pink-600",
    "bg-amber-600",
  ];
  const colorIndex =
    (name || email).split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
  return (
    <div
      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${colors[colorIndex]} text-sm font-bold text-white`}
    >
      {initials}
    </div>
  );
};

function UserSheet({
  user,
  onClose,
  onUpdate,
}: {
  user: UserSummary;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [action, setAction] = useState("");

  const doAction = async (body: Record<string, unknown>, actionName: string) => {
    setLoading(true);
    setAction(actionName);
    try {
      const res = await fetch(`/api/admin/users/${user.uid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        onUpdate();
        onClose();
      }
    } finally {
      setLoading(false);
      setAction("");
    }
  };

  const doDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setLoading(true);
    setAction("delete");
    try {
      await fetch(`/api/admin/users/${user.uid}`, { method: "DELETE" });
      onUpdate();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const createdAt = new Date(user.createdAt);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md overflow-y-auto bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/50 p-5">
          <div className="flex items-center gap-3">
            <Avatar name={user.displayName} email={user.email} />
            <div>
              <p className="font-semibold text-white">{user.displayName}</p>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {/* Info Cards */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Plano Atual", value: PLAN_LABELS[user.plan] ?? user.plan, icon: Tag },
              { label: "Posts", value: `${user.postsCount}`, icon: FileText },
              { label: "Imagens", value: `${user.imagesCount}`, icon: ImageIcon },
              {
                label: "Trial",
                value: user.trialExpired
                  ? "Expirado"
                  : `${user.trialDaysLeft} dias restantes`,
                icon: Clock,
              },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-lg bg-slate-800/60 p-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </div>
                <p className="mt-1 font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>

          {user.segment && (
            <div className="rounded-lg bg-slate-800/60 p-3 text-xs text-slate-400">
              <span className="font-medium text-slate-300">Segmento:</span> {user.segment}
            </div>
          )}
          {user.phone && (
            <div className="flex items-center gap-2 rounded-lg bg-slate-800/60 p-3 text-xs text-slate-400">
              <Phone className="h-3.5 w-3.5" />
              {user.phone}
            </div>
          )}
          <div className="rounded-lg bg-slate-800/60 p-3 text-xs text-slate-400">
            Cadastrado em: {createdAt.toLocaleDateString("pt-BR")}
          </div>

          {/* Ações */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Ações</p>

            {user.plan !== "standard" && (
              <button
                onClick={() => doAction({ plan: "standard" }, "standard")}
                disabled={loading}
                className="flex w-full items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm font-medium text-green-400 transition-colors hover:bg-green-500/20 disabled:opacity-50"
              >
                {loading && action === "standard" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Ativar Plano Standard
              </button>
            )}

            {user.plan !== "trial" && (
              <button
                onClick={() => doAction({ plan: "trial" }, "trial")}
                disabled={loading}
                className="flex w-full items-center gap-3 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm font-medium text-blue-400 transition-colors hover:bg-blue-500/20 disabled:opacity-50"
              >
                {loading && action === "trial" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Clock className="h-4 w-4" />
                )}
                Mover para Trial
              </button>
            )}

            <button
              onClick={() => doAction({ extendTrial: true }, "extend")}
              disabled={loading}
              className="flex w-full items-center gap-3 rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-3 text-sm font-medium text-violet-400 transition-colors hover:bg-violet-500/20 disabled:opacity-50"
            >
              {loading && action === "extend" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CalendarPlus className="h-4 w-4" />
              )}
              Estender Trial (+7 dias)
            </button>

            {user.paymentStatus !== "blocked" ? (
              <button
                onClick={() => doAction({ paymentStatus: "blocked" }, "block")}
                disabled={loading}
                className="flex w-full items-center gap-3 rounded-lg border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-sm font-medium text-orange-400 transition-colors hover:bg-orange-500/20 disabled:opacity-50"
              >
                {loading && action === "block" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldOff className="h-4 w-4" />
                )}
                Bloquear Conta
              </button>
            ) : (
              <button
                onClick={() => doAction({ paymentStatus: "active" }, "unblock")}
                disabled={loading}
                className="flex w-full items-center gap-3 rounded-lg border border-teal-500/30 bg-teal-500/10 px-4 py-3 text-sm font-medium text-teal-400 transition-colors hover:bg-teal-500/20 disabled:opacity-50"
              >
                {loading && action === "unblock" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                Desbloquear Conta
              </button>
            )}

            <button
              onClick={doDelete}
              disabled={loading}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium transition-colors disabled:opacity-50",
                confirmDelete
                  ? "border-red-500/60 bg-red-500/20 text-red-300 hover:bg-red-500/30"
                  : "border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/10"
              )}
            >
              {loading && action === "delete" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {confirmDelete ? "⚠️ Confirmar Exclusão Permanente" : "Excluir Conta"}
            </button>
            {confirmDelete && (
              <p className="text-center text-xs text-red-400">
                Esta ação é irreversível. Clique novamente para confirmar.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsuariosPage() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<PlanFilter>("all");
  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setUsers(data.users ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        !search ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.displayName.toLowerCase().includes(search.toLowerCase());

      const matchPlan =
        planFilter === "all" ||
        (planFilter === "expired" ? u.trialExpired : u.plan === planFilter);

      return matchSearch && matchPlan;
    });
  }, [users, search, planFilter]);

  const filterOptions: { value: PlanFilter; label: string; count: number }[] = [
    { value: "all", label: "Todos", count: users.length },
    {
      value: "trial",
      label: "Trial Ativo",
      count: users.filter((u) => u.plan === "trial" && !u.trialExpired).length,
    },
    {
      value: "standard",
      label: "Standard",
      count: users.filter((u) => u.plan === "standard").length,
    },
    {
      value: "expired",
      label: "Trial Expirado",
      count: users.filter((u) => u.trialExpired).length,
    },
    {
      value: "blocked",
      label: "Bloqueados",
      count: users.filter((u) => u.paymentStatus === "blocked").length,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Usuários</h1>
          <p className="mt-1 text-sm text-slate-400">
            {users.length} usuário{users.length !== 1 ? "s" : ""} na plataforma
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </button>
      </div>

      {/* Filtros e Busca */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2.5 pl-9 pr-4 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPlanFilter(opt.value)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all",
                planFilter === opt.value
                  ? "border-violet-500 bg-violet-600 text-white"
                  : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600 hover:text-white"
              )}
            >
              {opt.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-xs",
                  planFilter === opt.value ? "bg-violet-500/50" : "bg-slate-700"
                )}
              >
                {opt.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-violet-500" />
            <p className="text-sm text-slate-400">Carregando usuários...</p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-700/50">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/80">
                <tr className="text-left text-xs font-semibold uppercase tracking-widest text-slate-500">
                  <th className="px-4 py-3">Usuário</th>
                  <th className="px-4 py-3">Plano</th>
                  <th className="px-4 py-3">Trial</th>
                  <th className="px-4 py-3 text-center">Posts</th>
                  <th className="px-4 py-3 text-center">Imagens</th>
                  <th className="px-4 py-3">Cadastro</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40 bg-slate-900">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                      Nenhum usuário encontrado
                    </td>
                  </tr>
                ) : (
                  filtered.map((user) => (
                    <tr
                      key={user.uid}
                      className="transition-colors hover:bg-slate-800/40"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={user.displayName} email={user.email} />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-white">{user.displayName}</p>
                            <p className="truncate text-xs text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                            user.paymentStatus === "blocked"
                              ? PLAN_COLORS.blocked
                              : PLAN_COLORS[user.plan] ?? PLAN_COLORS.trial
                          )}
                        >
                          {user.paymentStatus === "blocked"
                            ? "Bloqueado"
                            : PLAN_LABELS[user.plan] ?? user.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {user.plan === "trial" ? (
                          <span
                            className={cn(
                              "text-xs",
                              user.trialExpired ? "text-red-400" : "text-slate-400"
                            )}
                          >
                            {user.trialExpired ? "Expirado" : `${user.trialDaysLeft}d restantes`}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-medium text-slate-300">
                        {user.postsCount}
                      </td>
                      <td className="px-4 py-3 text-center font-medium text-slate-300">
                        {user.imagesCount}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-violet-500 hover:text-violet-400"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Gerenciar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Panel lateral */}
      {selectedUser && (
        <UserSheet
          user={selectedUser}
          onClose={() => { setSelectedUser(null); }}
          onUpdate={fetchUsers}
        />
      )}
    </div>
  );
}
