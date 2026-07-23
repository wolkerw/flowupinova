"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Lightbulb,
  CheckCircle,
  Clock,
  Plus,
  Trash2,
  Edit,
  User,
  Calendar,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface Improvement {
  id: string;
  title: string;
  description: string;
  proposedBy: string;
  proposedAt: string;
  status: "pending" | "executed";
  executedBy?: string;
  executedAt?: string;
}

const ADMINS = ["Fernando", "Wolker", "Bruno"];

export default function MelhoriasAdminPage() {
  const [improvements, setImprovements] = useState<Improvement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "executed">("pending");

  // State for modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingImprovement, setEditingImprovement] = useState<Improvement | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [proposedBy, setProposedBy] = useState(ADMINS[0]); // Default to first admin

  // State for "Marcar como Executada"
  const [isExecuteModalOpen, setIsExecuteModalOpen] = useState(false);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [executedBy, setExecutedBy] = useState(ADMINS[0]);
  const [executedAt, setExecutedAt] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0]; // YYYY-MM-DD
  });

  const fetchImprovements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/melhorias");
      if (res.ok) {
        const data = await res.json();
        setImprovements(data.improvements || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImprovements();
  }, [fetchImprovements]);

  const handleOpenNew = () => {
    setEditingImprovement(null);
    setTitle("");
    setDescription("");
    setProposedBy(ADMINS[0]);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (item: Improvement) => {
    setEditingImprovement(item);
    setTitle(item.title);
    setDescription(item.description);
    setProposedBy(item.proposedBy || ADMINS[0]);
    setIsFormModalOpen(true);
  };

  const handleSaveForm = async () => {
    if (!title.trim() || !description.trim()) return;

    try {
      if (editingImprovement) {
        // Edit
        await fetch("/api/admin/melhorias", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingImprovement.id,
            title,
            description,
            proposedBy,
          }),
        });
      } else {
        // Create
        await fetch("/api/admin/melhorias", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            proposedBy,
          }),
        });
      }
      setIsFormModalOpen(false);
      fetchImprovements();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta melhoria permanentemente?")) return;
    try {
      await fetch(`/api/admin/melhorias?id=${id}`, { method: "DELETE" });
      fetchImprovements();
    } catch (error) {
      console.error(error);
    }
  };

  const handleOpenExecute = (id: string) => {
    setExecutingId(id);
    setExecutedBy(ADMINS[0]);
    setExecutedAt(new Date().toISOString().split("T")[0]);
    setIsExecuteModalOpen(true);
  };

  const handleExecute = async () => {
    if (!executingId) return;
    try {
      await fetch("/api/admin/melhorias", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: executingId,
          status: "executed",
          executedBy,
          executedAt: new Date(executedAt).toISOString(),
        }),
      });
      setIsExecuteModalOpen(false);
      setExecutingId(null);
      fetchImprovements();
    } catch (error) {
      console.error(error);
    }
  };

  const pendingItems = improvements.filter((i) => i.status === "pending");
  const executedItems = improvements.filter((i) => i.status === "executed");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-700/50 pb-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <Lightbulb className="h-6 w-6 text-violet-400" />
            Melhorias e Ajustes
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Acompanhe as propostas de melhorias, correções e funcionalidades futuras.
          </p>
        </div>
        <button
          onClick={handleOpenNew}
          className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700"
        >
          <Plus className="h-4 w-4" />
          Nova Proposta
        </button>
      </div>

      <div className="flex gap-4 border-b border-slate-800">
        <button
          onClick={() => setActiveTab("pending")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "pending"
              ? "border-violet-500 text-violet-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Clock className="h-4 w-4" />
          Pendentes ({pendingItems.length})
        </button>
        <button
          onClick={() => setActiveTab("executed")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "executed"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <CheckCircle className="h-4 w-4" />
          Histórico ({executedItems.length})
        </button>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-violet-500" />
        </div>
      ) : (
        <div className="grid gap-4">
          {(activeTab === "pending" ? pendingItems : executedItems).map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-4 rounded-xl border border-slate-700/50 bg-slate-800/40 p-5 md:flex-row md:items-start"
            >
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-slate-100">{item.title}</h3>
                  {item.status === "executed" ? (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                      <CheckCircle className="h-3 w-3" />
                      Executado
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
                      <Clock className="h-3 w-3" />
                      Pendente
                    </span>
                  )}
                </div>
                <p className="whitespace-pre-wrap text-sm text-slate-300 leading-relaxed">
                  {item.description}
                </p>
                
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Proposto por: <strong className="text-slate-400">{item.proposedBy}</strong>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Em: {new Date(item.proposedAt).toLocaleDateString("pt-BR")}
                  </div>
                  
                  {item.status === "executed" && (
                    <>
                      <div className="h-4 w-px bg-slate-700" />
                      <div className="flex items-center gap-1 text-emerald-400/80">
                        <CheckCircle className="h-3 w-3" />
                        Feito por: <strong className="text-emerald-400">{item.executedBy}</strong>
                      </div>
                      {item.executedAt && (
                        <div className="flex items-center gap-1 text-emerald-400/80">
                          <Calendar className="h-3 w-3" />
                          Concluído em: {new Date(item.executedAt).toLocaleDateString("pt-BR")}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {item.status === "pending" && (
                <div className="flex flex-col gap-2 md:w-40">
                  <button
                    onClick={() => handleOpenExecute(item.id)}
                    className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600/20 py-2 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-600/30 hover:text-emerald-300"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Concluir
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {(activeTab === "pending" ? pendingItems : executedItems).length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
              <Lightbulb className="mb-3 h-12 w-12 opacity-20" />
              <p>Nenhuma melhoria {activeTab === "pending" ? "pendente" : "no histórico"}.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal Nova/Editar Proposta */}
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="border-slate-800 bg-slate-900 text-slate-100 sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingImprovement ? "Editar Proposta" : "Nova Proposta"}</DialogTitle>
            <DialogDescription className="text-slate-400">
              Descreva a melhoria, feature ou ajuste que deve ser feito.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-300">Proposto por</label>
              <select
                value={proposedBy}
                onChange={(e) => setProposedBy(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-sm text-slate-100 focus:border-violet-500 focus:outline-none"
              >
                {ADMINS.map((admin) => (
                  <option key={admin} value={admin}>{admin}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-300">Título</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Melhorar o editor de textos"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-sm text-slate-100 focus:border-violet-500 focus:outline-none"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-300">Descrição detalhada</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: O editor precisa de fontes caligráficas..."
                rows={4}
                className="w-full resize-none rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-sm text-slate-100 focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsFormModalOpen(false)}
              className="rounded-lg border border-slate-700 bg-transparent px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveForm}
              disabled={!title.trim() || !description.trim()}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
            >
              Salvar Proposta
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Marcar Executada */}
      <Dialog open={isExecuteModalOpen} onOpenChange={setIsExecuteModalOpen}>
        <DialogContent className="border-slate-800 bg-slate-900 text-slate-100 sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Concluir Melhoria</DialogTitle>
            <DialogDescription className="text-slate-400">
              Quem executou esta melhoria e quando?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-300">Executado por</label>
              <select
                value={executedBy}
                onChange={(e) => setExecutedBy(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
              >
                {ADMINS.map((admin) => (
                  <option key={admin} value={admin}>{admin}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-300">Data de Conclusão</label>
              <input
                type="date"
                value={executedAt}
                onChange={(e) => setExecutedAt(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsExecuteModalOpen(false)}
              className="rounded-lg border border-slate-700 bg-transparent px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              Cancelar
            </button>
            <button
              onClick={handleExecute}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Confirmar Conclusão
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
