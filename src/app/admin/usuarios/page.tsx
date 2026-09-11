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
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DigitalContractViewer } from "@/components/dashboard/DigitalContractViewer";
import type { UserContractDoc } from "@/lib/types/contract";

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
  subscriptionPlan?: "mensal" | "anual" | null;
  subscriptionExpiresAt?: string | null;
  hasSignedContract?: boolean;
  activeContract?: {
    id: string;
    modalidade: string;
    valorTotalCiclo: number;
    signedAtFormatted: string;
    status: string;
  } | null;
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
  const colors = ["bg-violet-600", "bg-blue-600", "bg-emerald-600", "bg-pink-600", "bg-amber-600"];
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
  onViewContract,
}: {
  user: UserSummary;
  onClose: () => void;
  onUpdate: () => void;
  onViewContract?: (user: UserSummary) => void;
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
      if (res.status === 403 || res.status === 401) {
        window.location.href = `/acesso/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      if (!res.ok) throw new Error("Ação falhou");
      onUpdate();
    } catch (err) {
      console.error(err);
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
      const res = await fetch(`/api/admin/users/${user.uid}`, { method: "DELETE" });
      if (res.status === 403 || res.status === 401) {
        window.location.href = `/acesso/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      if (!res.ok) throw new Error("Exclusão falhou");
      onClose();
      onUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setAction("");
    }
  };

  const createdAt = new Date(user.createdAt);

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-slate-900 border-l border-slate-700/60 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700/60 px-6 py-4">
        <div className="flex items-center gap-3">
          <Avatar name={user.displayName} email={user.email} />
          <div>
            <h2 className="font-semibold text-white">{user.displayName}</h2>
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

      {/* Conteúdo rolável */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Status badges */}
        <div className="flex flex-wrap gap-2">
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
              user.paymentStatus === "blocked"
                ? PLAN_COLORS.blocked
                : (PLAN_COLORS[user.plan] ?? PLAN_COLORS.trial)
            )}
          >
            {user.paymentStatus === "blocked"
              ? "Bloqueado"
              : user.plan === "standard"
                ? `Standard (${user.subscriptionPlan ? (user.subscriptionPlan === "anual" ? "Anual" : "Mensal") : "Mensal"})`
                : (PLAN_LABELS[user.plan] ?? user.plan)}
          </span>
          {user.plan === "trial" && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
                user.trialExpired
                  ? "border-red-500/20 bg-red-500/10 text-red-400"
                  : "border-blue-500/20 bg-blue-500/10 text-blue-400"
              )}
            >
              <Clock className="h-3 w-3" />
              {user.trialExpired ? "Trial Expirado" : `${user.trialDaysLeft} dias restantes`}
            </span>
          )}
          {user.hasSignedContract && (
            <span className="inline-flex items-center gap-1 rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-400">
              <CheckCircle className="h-3 w-3" /> Contrato Assinado
            </span>
          )}
        </div>

        {/* Informações detalhadas */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Detalhes da Conta
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(() => {
              const cards = [
                { label: "Posts Criados", value: user.postsCount, icon: FileText },
                { label: "Imagens Geradas", value: user.imagesCount, icon: ImageIcon },
              ];
              if (user.plan === "trial") {
                cards.push({
                  label: "Expiração Trial",
                  value: user.trialExpired ? "Expirado" : `${user.trialDaysLeft}d restantes`,
                  icon: Clock,
                });
              } else if (user.plan === "standard" && user.subscriptionExpiresAt) {
                const expDate = new Date(user.subscriptionExpiresAt);
                cards.push({
                  label: "Vencimento",
                  value: expDate.toLocaleDateString("pt-BR"),
                  icon: Clock,
                });
              }
              return cards;
            })().map(({ label, value, icon: Icon }) => (
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

          {/* Card de Contrato de Assinatura */}
          <div className="rounded-lg border border-slate-700/60 bg-slate-800/40 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <FileText className="h-4 w-4 text-[#0083C7]" />
                Contrato Digital NumVapt
              </div>
              {user.hasSignedContract ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[11px] font-medium text-green-400 border border-green-500/20">
                  <CheckCircle className="h-3 w-3" /> Assinado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-700/60 px-2 py-0.5 text-[11px] font-medium text-slate-400">
                  Pendente
                </span>
              )}
            </div>

            {user.hasSignedContract && user.activeContract && (
              <div className="text-xs text-slate-400 space-y-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/40">
                <p>
                  Modalidade: <span className="font-medium text-slate-200 uppercase">{user.activeContract.modalidade}</span>
                </p>
                {user.activeContract.signedAtFormatted && (
                  <p>
                    Data: <span className="text-slate-300">{user.activeContract.signedAtFormatted}</span>
                  </p>
                )}
                {user.activeContract.id && (
                  <p className="font-mono text-[10px] text-slate-500 truncate">
                    Protocolo: {user.activeContract.id}
                  </p>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => onViewContract?.(user)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#0083C7]/40 bg-[#0083C7]/10 py-2.5 text-xs font-medium text-[#0083C7] transition-colors hover:bg-[#0083C7]/20"
            >
              <Eye className="h-3.5 w-3.5" />
              {user.hasSignedContract ? "Visualizar Contrato Assinado" : "Consultar Minuta Padrão"}
            </button>
          </div>

          {/* Ações */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Ações</p>

            {/* Ativar/Mudar para Plano Mensal */}
            {!(user.plan === "standard" && user.subscriptionPlan === "mensal") && (
              <button
                onClick={() =>
                  doAction({ plan: "standard", subscriptionPlan: "mensal" }, "activate-mensal")
                }
                disabled={loading}
                className="flex w-full items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm font-medium text-green-400 transition-colors hover:bg-green-500/20 disabled:opacity-50"
              >
                {loading && action === "activate-mensal" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                {user.plan === "standard"
                  ? "Mudar para Plano Mensal"
                  : "Ativar Plano Mensal (30 dias)"}
              </button>
            )}

            {/* Ativar/Mudar para Plano Anual */}
            {!(user.plan === "standard" && user.subscriptionPlan === "anual") && (
              <button
                onClick={() =>
                  doAction({ plan: "standard", subscriptionPlan: "anual" }, "activate-anual")
                }
                disabled={loading}
                className="flex w-full items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-400 transition-colors hover:bg-amber-500/20 disabled:opacity-50"
              >
                {loading && action === "activate-anual" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Crown className="h-4 w-4" />
                )}
                {user.plan === "standard"
                  ? "Mudar para Plano Anual"
                  : "Ativar Plano Anual (365 dias)"}
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

            {/* Estender Trial (+7d / +30d) */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => doAction({ extendTrial: true, extendTrialDays: 7 }, "extend-7")}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-lg border border-violet-500/30 bg-violet-500/10 py-2.5 text-xs font-medium text-violet-400 transition-colors hover:bg-violet-500/20 disabled:opacity-50"
              >
                {loading && action === "extend-7" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CalendarPlus className="h-3.5 w-3.5" />
                )}
                Estender Trial (+7d)
              </button>

              <button
                onClick={() => doAction({ extendTrial: true, extendTrialDays: 30 }, "extend-30")}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-lg border border-fuchsia-500/30 bg-fuchsia-500/10 py-2.5 text-xs font-medium text-fuchsia-400 transition-colors hover:bg-fuchsia-500/20 disabled:opacity-50"
              >
                {loading && action === "extend-30" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CalendarPlus className="h-3.5 w-3.5" />
                )}
                Estender Trial (+30d)
              </button>
            </div>

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

  // Estados para o visualizador do contrato
  const [contractUser, setContractUser] = useState<UserSummary | null>(null);
  const [contractData, setContractData] = useState<UserContractDoc | null>(null);
  const [contractLoading, setContractLoading] = useState(false);
  const [isContractOpen, setIsContractOpen] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.status === 403 || res.status === 401) {
        window.location.href = `/acesso/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      if (!res.ok) throw new Error("Falha ao carregar usuários");
      const data = await res.json();
      setUsers(data.users ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenContract = async (user: UserSummary) => {
    setContractUser(user);
    setContractLoading(true);
    setIsContractOpen(true);
    try {
      const res = await fetch(`/api/admin/users/${user.uid}/contract`);
      if (res.ok) {
        const data = await res.json();
        setContractData(data.contract ?? null);
      } else {
        setContractData(null);
      }
    } catch (err) {
      console.error("Erro ao carregar contrato do usuário:", err);
      setContractData(null);
    } finally {
      setContractLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        !search ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.displayName.toLowerCase().includes(search.toLowerCase());

      const matchPlan =
        planFilter === "all" || (planFilter === "expired" ? u.trialExpired : u.plan === planFilter);

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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Busca */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 pl-9 pr-4 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
            />
          </div>

          {/* Filtros rápidos por plano */}
          <div className="flex flex-wrap gap-1.5">
            {filterOptions.map(({ value, label, count }) => (
              <button
                key={value}
                onClick={() => setPlanFilter(value)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  planFilter === value
                    ? "bg-violet-600 text-white"
                    : "border border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                )}
              >
                {label}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.2 text-[10px]",
                    planFilter === value ? "bg-violet-700 text-white" : "bg-slate-700 text-slate-400"
                  )}
                >
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabela de Usuários */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-widest text-slate-500 border-b border-slate-700/60">
                  <th className="px-4 py-3">Usuário</th>
                  <th className="px-4 py-3">Plano</th>
                  <th className="px-4 py-3 text-center">Contrato</th>
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
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                      Nenhum usuário encontrado
                    </td>
                  </tr>
                ) : (
                  filtered.map((user) => (
                    <tr key={user.uid} className="transition-colors hover:bg-slate-800/40">
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
                              : (PLAN_COLORS[user.plan] ?? PLAN_COLORS.trial)
                          )}
                        >
                          {user.paymentStatus === "blocked"
                            ? "Bloqueado"
                            : user.plan === "standard"
                              ? `Standard (${user.subscriptionPlan ? (user.subscriptionPlan === "anual" ? "Anual" : "Mensal") : "Mensal"})`
                              : (PLAN_LABELS[user.plan] ?? user.plan)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {user.hasSignedContract ? (
                          <button
                            type="button"
                            onClick={() => handleOpenContract(user)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-400 transition-colors hover:bg-green-500/20"
                            title="Visualizar Contrato Assinado"
                          >
                            <FileText className="h-3.5 w-3.5 text-green-400" />
                            Assinado
                          </button>
                        ) : (
                          <span className="text-xs text-slate-600">—</span>
                        )}
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
                        ) : user.plan === "standard" && user.subscriptionExpiresAt ? (
                          <span className="text-xs text-emerald-400">
                            Expira{" "}
                            {new Date(user.subscriptionExpiresAt).toLocaleDateString("pt-BR")}
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

      {/* Painel lateral de detalhes */}
      {selectedUser && (
        <UserSheet
          user={selectedUser}
          onClose={() => {
            setSelectedUser(null);
          }}
          onUpdate={fetchUsers}
          onViewContract={handleOpenContract}
        />
      )}

      {/* Modal de Visualização Integral do Contrato */}
      <Dialog open={isContractOpen} onOpenChange={setIsContractOpen}>
        <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto rounded-3xl p-6 sm:p-8 bg-white text-slate-900 border-slate-200">
          {contractLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500 space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-[#0083C7]" />
              <p className="text-sm">Carregando contrato digital do usuário...</p>
            </div>
          ) : (
            <DigitalContractViewer
              modalidade={contractData?.modalidade || contractUser?.subscriptionPlan || "anual"}
              formaPagamento={contractData?.formaPagamento || "pix"}
              readOnly={true}
              signedContract={contractData}
              initialAssinante={{
                nomeOuRazaoSocial:
                  contractData?.assinante?.nomeOuRazaoSocial ||
                  contractUser?.displayName ||
                  contractUser?.email ||
                  "",
                cpfOuCnpj: contractData?.assinante?.cpfOuCnpj || "",
                email: contractUser?.email || "",
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
