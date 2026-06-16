"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Megaphone, Check, AlertCircle } from "lucide-react";
import { getMetaConnection, updateMetaConnection } from "@/lib/services/meta-service";
import { useToast } from "@/hooks/use-toast";

interface AccountsSelectorProps {
  userId: string;
  onAccountSelected?: (accountId: string, accountName: string) => void;
}

export default function AccountsSelector({ userId, onAccountSelected }: AccountsSelectorProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [metaConnected, setMetaConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMetaConnectionAndAccounts() {
      if (!userId) return;
      setLoading(true);
      setError(null);
      try {
        const connection = await getMetaConnection(userId);
        if (connection.isConnected && connection.accessToken) {
          setMetaConnected(true);
          if (connection.adAccountId) {
            setSelectedAccountId(connection.adAccountId);
          }

          // Fetch accounts from our API
          const response = await fetch("/api/ads/accounts");
          const data = await response.json();

          if (data.success && data.accounts) {
            setAccounts(data.accounts);
            // If there's only one account and none was selected, auto-select it
            if (data.accounts.length === 1 && !connection.adAccountId) {
              const autoAcc = data.accounts[0];
              setSelectedAccountId(autoAcc.id);
              await updateMetaConnection(userId, {
                adAccountId: autoAcc.id,
                adAccountName: autoAcc.name,
              });
              if (onAccountSelected) {
                onAccountSelected(autoAcc.id, autoAcc.name);
              }
            }
          } else {
            setError(data.error || "Não foi possível carregar as contas de anúncios.");
          }
        } else {
          setMetaConnected(false);
        }
      } catch (err: any) {
        console.error("Erro ao carregar contas de anúncios:", err);
        setError("Erro ao conectar com as contas de anúncios da Meta.");
      } finally {
        setLoading(false);
      }
    }

    loadMetaConnectionAndAccounts();
  }, [userId, onAccountSelected]);

  const handleAccountChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const accountId = e.target.value;
    const selectedAcc = accounts.find((acc) => acc.id === accountId);
    if (!selectedAcc) return;

    setSaving(true);
    try {
      setSelectedAccountId(accountId);
      await updateMetaConnection(userId, {
        adAccountId: selectedAcc.id,
        adAccountName: selectedAcc.name,
      });

      toast({
        title: "Conta de Anúncios Salva!",
        description: `Conectado com sucesso à conta "${selectedAcc.name}".`,
      });

      if (onAccountSelected) {
        onAccountSelected(selectedAcc.id, selectedAcc.name);
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro ao Salvar",
        description: err.message || "Não foi possível vincular a conta de anúncios.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-xs text-slate-500 font-medium">Buscando contas de anúncios da Meta...</span>
      </div>
    );
  }

  if (!metaConnected) {
    return null;
  }

  return (
    <div className="p-5 rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-300 hover:shadow-md">
      <div className="flex items-center gap-3.5">
        <div className="bg-primary/10 text-primary p-2.5 rounded-lg">
          <Megaphone className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900 leading-tight">Configurações de Anúncios</h4>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            Selecione qual conta de anúncios ativa receberá as cobranças do cartão.
          </p>
        </div>
      </div>

      <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {error ? (
          <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50/50 border border-red-100 p-2.5 rounded-lg max-w-md">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : accounts.length === 0 ? (
          <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50/50 border border-amber-100 p-2.5 rounded-lg">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>Nenhuma conta de anúncios encontrada nesta conta da Meta.</span>
          </div>
        ) : (
          <div className="relative min-w-[260px]">
            <select
              value={selectedAccountId}
              onChange={handleAccountChange}
              disabled={saving}
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none disabled:opacity-50 appearance-none pr-8 cursor-pointer"
            >
              <option value="" disabled>-- Selecione a Conta de Anúncios --</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.id})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              ) : (
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              )}
            </div>
          </div>
        )}

        {selectedAccountId && !saving && !error && (
          <div className="flex items-center justify-center gap-1.5 bg-green-500/10 text-green-700 px-3.5 py-2 rounded-lg text-xs font-bold border border-green-500/10">
            <Check className="h-3.5 w-3.5" />
            Viculado
          </div>
        )}
      </div>
    </div>
  );
}
