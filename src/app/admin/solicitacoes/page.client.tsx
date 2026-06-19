"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Clock,
  User,
  Building2,
  FileText,
  AlertCircle,
  FileWarning,
} from "lucide-react";
import {
  listPendingCnpjRequests,
  processCnpjRequest,
  type AdminCnpjChangeRequest,
} from "@/lib/services/cnpj-request-service-admin";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export default function AdminCnpjRequestsClient() {
  const [requests, setRequests] = useState<AdminCnpjChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Estados de processamento
  const [selectedRequest, setSelectedRequest] = useState<AdminCnpjChangeRequest | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listPendingCnpjRequests();
      setRequests(data);
    } catch (err: any) {
      console.error("[CNPJ_ADMIN] Erro ao buscar solicitações:", err);
      toast({
        title: "Erro ao carregar dados",
        description: err.message || "Não foi possível carregar as solicitações de alteração.",
        variant: "destructive",
      });
      if (err.message?.includes("403") || err.message?.includes("401") || err.message?.includes("permission-denied")) {
        window.location.href = `/acesso/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAction = async () => {
    if (!selectedRequest || !actionType) return;

    setIsProcessing(true);
    const approve = actionType === "approve";

    try {
      await processCnpjRequest(selectedRequest.id, approve, adminNotes);
      toast({
        title: approve ? "Alteração Aprovada!" : "Alteração Rejeitada!",
        description: approve
          ? "Os novos dados cadastrais de CNPJ e Empresa foram aplicados com sucesso."
          : "A solicitação foi indeferida e o cliente notificado.",
        variant: "success",
      });
      setSelectedRequest(null);
      setActionType(null);
      setAdminNotes("");
      await fetchRequests();
    } catch (err: any) {
      toast({
        title: "Erro ao processar",
        description: err.message || "Ocorreu um erro ao salvar a decisão administrativa.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCnpj = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length !== 14) return value;
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-violet-500" />
            Solicitações de Alteração de CNPJ
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Aprove ou recuse pedidos de alteração cadastral jurídica para controle de Single Tenant.
          </p>
        </div>
        <button
          onClick={fetchRequests}
          disabled={loading}
          className="flex items-center gap-2 self-start rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-700 hover:text-white disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Atualizar
        </button>
      </div>

      {/* Conteúdo Principal */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-violet-500" />
            <p className="text-sm text-slate-400">Carregando solicitações pendentes...</p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-850/80 border-b border-slate-800">
                <tr className="text-left text-xs font-semibold uppercase tracking-widest text-slate-400">
                  <th className="px-6 py-4">Usuário / ID</th>
                  <th className="px-6 py-4">Nome Atual / CNPJ Atual</th>
                  <th className="px-6 py-4">Nome Solicitado / Novo CNPJ</th>
                  <th className="px-6 py-4">Justificativa do Cliente</th>
                  <th className="px-6 py-4">Data Envio</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Clock className="h-8 w-8 text-slate-600" />
                        <p className="font-medium">Nenhuma solicitação de alteração de CNPJ pendente</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req.id} className="transition-colors hover:bg-slate-850/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600/10 border border-violet-500/20 text-xs font-bold text-violet-400">
                            {req.userEmail.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 max-w-[200px]">
                            <p className="truncate font-semibold text-white" title={req.userEmail}>
                              {req.userEmail}
                            </p>
                            <p className="truncate text-[10px] font-mono text-slate-500" title={req.userId}>
                              ID: {req.userId}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="min-w-[150px]">
                          <p className="font-semibold text-slate-200">{req.currentBusinessName}</p>
                          <p className="text-xs text-slate-400 font-mono">
                            {req.currentCnpj ? formatCnpj(req.currentCnpj) : "Nenhum CNPJ"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="min-w-[150px] rounded-lg bg-violet-950/10 border border-violet-500/10 p-2">
                          <p className="font-bold text-violet-300">{req.requestedBusinessName}</p>
                          <p className="text-xs text-violet-200 font-mono">
                            {formatCnpj(req.requestedCnpj)}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-[280px] text-xs text-slate-300 whitespace-pre-line bg-slate-950/40 rounded-lg p-2.5 border border-slate-800">
                          {req.reason}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400 font-medium">
                        {new Date(req.createdAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(req);
                              setActionType("approve");
                              setAdminNotes("Solicitação de alteração cadastral aprovada.");
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-8 text-xs"
                          >
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedRequest(req);
                              setActionType("reject");
                              setAdminNotes("");
                            }}
                            className="bg-red-600 hover:bg-red-500 text-white font-bold h-8 text-xs"
                          >
                            Recusar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Diálogos de Confirmação */}
      <Dialog
        open={!!selectedRequest}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRequest(null);
            setActionType(null);
            setAdminNotes("");
          }
        }}
      >
        <DialogContent className="bg-slate-900 border border-slate-800 text-white sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-white">
              {actionType === "approve" ? "Confirmar Aprovação Jurídica" : "Justificar Recusa de Alteração"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {actionType === "approve"
                ? `Você está prestes a atualizar o CNPJ da empresa de "${selectedRequest?.currentBusinessName}" para "${selectedRequest?.requestedBusinessName}". Esta ação alterará permanentemente os dados fiscais e de IA do cliente.`
                : "Informe ao cliente o motivo técnico ou legal pelo qual a alteração cadastral foi indeferida."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                {actionType === "approve" ? "Notas do Administrador (Opcional)" : "Motivo do Indeferimento (Obrigatório)"}
              </label>
              <Textarea
                placeholder={
                  actionType === "approve"
                    ? "Observações sobre a aprovação..."
                    : "Ex: O CNPJ informado pertence a uma empresa ativa diferente do contrato original da conta Pro, o que viola os termos de uso único."
                }
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="min-h-[100px] bg-slate-950 border-slate-800 text-white"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              disabled={isProcessing}
              onClick={() => {
                setSelectedRequest(null);
                setActionType(null);
                setAdminNotes("");
              }}
              className="border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              disabled={isProcessing || (actionType === "reject" && !adminNotes.trim())}
              onClick={handleAction}
              className={cn(
                actionType === "approve"
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                  : "bg-red-600 hover:bg-red-500 text-white"
              )}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : actionType === "approve" ? (
                "Confirmar Aprovação"
              ) : (
                "Confirmar Recusa"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
