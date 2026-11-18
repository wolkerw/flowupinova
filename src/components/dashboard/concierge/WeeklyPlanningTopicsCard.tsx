"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Save,
  Loader2,
  CheckCircle2,
  Clock,
  Sparkles,
  FileEdit,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { WeeklyPlanningTopics } from "@/lib/types/concierge";
import { cn } from "@/lib/utils";

interface WeeklyPlanningTopicsCardProps {
  workspaceId?: string | null;
  isApproverRole?: boolean;
}

const WEEKS_CONFIG = [
  {
    key: "week1" as const,
    weekNumber: 1,
    title: "Semana 1",
    period: "Dias 01 a 07",
    placeholder:
      "Ex: Lançamento do novo produto, novidades do mês, apresentação de diferenciais da marca...",
  },
  {
    key: "week2" as const,
    weekNumber: 2,
    title: "Semana 2",
    period: "Dias 08 a 14",
    placeholder:
      "Ex: Conteúdo educativo sobre o serviço, carrossel de dicas práticas, depoimento de cliente...",
  },
  {
    key: "week3" as const,
    weekNumber: 3,
    title: "Semana 3",
    period: "Dias 15 a 21",
    placeholder:
      "Ex: Quebra de dúvidas frequentes, bastidores da equipe ou case de sucesso em destaque...",
  },
  {
    key: "week4" as const,
    weekNumber: 4,
    title: "Semana 4",
    period: "Dias 22 a 31",
    placeholder:
      "Ex: Chamada para ação comercial, condições especiais de encerramento, incentivo a contato...",
  },
];

function getInitialMonthString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatMonthLabel(monthStr: string): string {
  try {
    const [year, month] = monthStr.split("-").map(Number);
    const date = new Date(year, month - 1, 1);
    const label = date.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
    return label.charAt(0).toUpperCase() + label.slice(1);
  } catch {
    return monthStr;
  }
}

export function WeeklyPlanningTopicsCard({
  workspaceId,
  isApproverRole = false,
}: WeeklyPlanningTopicsCardProps) {
  const { toast } = useToast();

  const [currentMonth, setCurrentMonth] = useState<string>(getInitialMonthString);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const [topics, setTopics] = useState<WeeklyPlanningTopics>({
    month: getInitialMonthString(),
    week1: "",
    week2: "",
    week3: "",
    week4: "",
    notes: "",
  });

  const [initialTopics, setInitialTopics] = useState<WeeklyPlanningTopics>({
    month: getInitialMonthString(),
    week1: "",
    week2: "",
    week3: "",
    week4: "",
    notes: "",
  });

  const isCurrentCalendarMonth = useMemo(() => {
    return currentMonth === getInitialMonthString();
  }, [currentMonth]);

  // Carrega os tópicos do mês selecionado
  const loadTopics = useCallback(
    async (monthToLoad: string) => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({ month: monthToLoad });
        if (workspaceId) {
          queryParams.set("workspaceId", workspaceId);
        }

        const res = await fetch(`/api/concierge/topics?${queryParams.toString()}`);
        if (!res.ok) {
          throw new Error("Falha ao carregar pautas da semana.");
        }

        const data = await res.json();
        if (data?.topics) {
          const loaded: WeeklyPlanningTopics = {
            month: data.topics.month || monthToLoad,
            week1: data.topics.week1 || "",
            week2: data.topics.week2 || "",
            week3: data.topics.week3 || "",
            week4: data.topics.week4 || "",
            notes: data.topics.notes || "",
            updatedAt: data.topics.updatedAt,
            updatedBy: data.topics.updatedBy,
            updatedByRole: data.topics.updatedByRole,
          };
          setTopics(loaded);
          setInitialTopics(loaded);
        }
      } catch (error) {
        console.error("Erro ao buscar tópicos semanais:", error);
        toast({
          title: "Não foi possível carregar as pautas",
          description: "Verifique sua conexão e tente novamente.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [workspaceId, toast]
  );

  useEffect(() => {
    loadTopics(currentMonth);
  }, [currentMonth, loadTopics]);

  // Navegação entre meses
  const handlePrevMonth = () => {
    const [year, month] = currentMonth.split("-").map(Number);
    const prevDate = new Date(year, month - 2, 1);
    const prevMonthStr = `${prevDate.getFullYear()}-${String(
      prevDate.getMonth() + 1
    ).padStart(2, "0")}`;
    setCurrentMonth(prevMonthStr);
  };

  const handleNextMonth = () => {
    const [year, month] = currentMonth.split("-").map(Number);
    const nextDate = new Date(year, month, 1);
    const nextMonthStr = `${nextDate.getFullYear()}-${String(
      nextDate.getMonth() + 1
    ).padStart(2, "0")}`;
    setCurrentMonth(nextMonthStr);
  };

  const handleResetToCurrentMonth = () => {
    setCurrentMonth(getInitialMonthString());
  };

  // Verificação de alterações (dirty state)
  const isDirty = useMemo(() => {
    return (
      (topics.week1 || "") !== (initialTopics.week1 || "") ||
      (topics.week2 || "") !== (initialTopics.week2 || "") ||
      (topics.week3 || "") !== (initialTopics.week3 || "") ||
      (topics.week4 || "") !== (initialTopics.week4 || "") ||
      (topics.notes || "") !== (initialTopics.notes || "")
    );
  }, [topics, initialTopics]);

  // Contagem de semanas preenchidas
  const filledWeeksCount = useMemo(() => {
    return [topics.week1, topics.week2, topics.week3, topics.week4].filter(
      (w) => (w || "").trim().length > 0
    ).length;
  }, [topics]);

  // Reverter alterações locais não salvas
  const handleDiscardChanges = () => {
    setTopics(initialTopics);
  };

  // Salvar pautas no Firestore
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/concierge/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: currentMonth,
          week1: topics.week1,
          week2: topics.week2,
          week3: topics.week3,
          week4: topics.week4,
          notes: topics.notes,
          workspaceId: workspaceId || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Erro ao salvar planejamento.");
      }

      const data = await res.json();
      if (data?.topics) {
        const updated: WeeklyPlanningTopics = {
          month: data.topics.month || currentMonth,
          week1: data.topics.week1 || "",
          week2: data.topics.week2 || "",
          week3: data.topics.week3 || "",
          week4: data.topics.week4 || "",
          notes: data.topics.notes || "",
          updatedAt: data.topics.updatedAt,
          updatedBy: data.topics.updatedBy,
          updatedByRole: data.topics.updatedByRole,
        };
        setTopics(updated);
        setInitialTopics(updated);
      }

      toast({
        title: "Pautas Semanais Salvas!",
        description: isApproverRole
          ? "Seus direcionamentos foram registrados com sucesso e já estão visíveis para o seu gestor de conteúdo."
          : "O cronograma de pautas da semana foi atualizado e sincronizado com sucesso.",
      });
    } catch (error: any) {
      console.error("Erro ao salvar tópicos:", error);
      toast({
        title: "Erro ao salvar pautas",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const formatLastUpdated = (dateString?: string) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return null;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-sm transition-all">
      {/* Topo do Card: Título, Seleção de Mês e Controles */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-[#0083C7]/10 text-[#0083C7] border border-[#0083C7]/20 mt-0.5">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-white font-['Poppins'] tracking-tight">
                Pautas Semanais do Mês
              </h2>
              <span
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                  filledWeeksCount === 4
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : filledWeeksCount > 0
                    ? "bg-[#FA6305]/10 text-[#FA6305] border-[#FA6305]/30"
                    : "bg-slate-800 text-slate-400 border-slate-700"
                )}
              >
                {filledWeeksCount === 4
                  ? "4 de 4 semanas definidas"
                  : `${filledWeeksCount} de 4 semanas preenchidas`}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-['Inter']">
              {isApproverRole
                ? "Defina os assuntos e prioridades que você deseja ver publicados em cada semana deste mês."
                : "Consulte e ajuste os temas prioritários acordados para cada semana com o cliente."}
            </p>
          </div>
        </div>

        {/* Seletor de Mês & Botão de Recolher */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              disabled={loading || saving}
              title="Mês anterior"
              aria-label="Mês anterior"
              className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 text-xs font-semibold text-slate-200 capitalize min-w-[130px] text-center select-none">
              {formatMonthLabel(currentMonth)}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              disabled={loading || saving}
              title="Próximo mês"
              aria-label="Próximo mês"
              className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {!isCurrentCalendarMonth && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetToCurrentMonth}
              className="border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 text-xs h-9 rounded-lg"
            >
              Mês Atual
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="text-slate-400 hover:text-white hover:bg-slate-800 h-9 px-2 rounded-lg"
            title={isExpanded ? "Recolher pautas semanais" : "Expandir pautas semanais"}
            aria-label={isExpanded ? "Recolher pautas semanais" : "Expandir pautas semanais"}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Conteúdo Expansível: Grade das 4 Semanas + Observações */}
      {isExpanded && (
        <div className="mt-5 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-[#0083C7] mb-2" />
              <p className="text-xs">Carregando pautas de {formatMonthLabel(currentMonth)}...</p>
            </div>
          ) : (
            <>
              {/* Grade de 4 semanas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {WEEKS_CONFIG.map((week) => {
                  const currentValue = topics[week.key] || "";
                  const isFilled = currentValue.trim().length > 0;

                  return (
                    <div
                      key={week.key}
                      className={cn(
                        "flex flex-col justify-between bg-slate-950 border rounded-lg p-3.5 transition-all",
                        isFilled
                          ? "border-slate-700/80 hover:border-slate-600"
                          : "border-slate-800/80 hover:border-slate-700"
                      )}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-white uppercase tracking-wider font-['Poppins']">
                            {week.title}
                          </span>
                          <span className="text-[11px] font-medium text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            {week.period}
                          </span>
                        </div>

                        <Textarea
                          value={currentValue}
                          onChange={(e) =>
                            setTopics((prev) => ({
                              ...prev,
                              [week.key]: e.target.value,
                            }))
                          }
                          placeholder={week.placeholder}
                          rows={4}
                          className="w-full text-xs bg-slate-900 border-slate-800 focus:border-[#0083C7] focus:ring-1 focus:ring-[#0083C7] text-slate-100 placeholder:text-slate-500 rounded-lg resize-none min-h-[95px] leading-relaxed"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-900 text-[11px] text-slate-500">
                        <span>{currentValue.length} caracteres</span>
                        {isFilled ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3 h-3" />
                            Pauta definida
                          </span>
                        ) : (
                          <span className="text-slate-500">Em aberto</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Campo Opcional de Observações ou Alinhamentos do Mês */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5">
                <div className="flex items-center gap-2 mb-2">
                  <FileEdit className="w-3.5 h-3.5 text-[#FA6305]" />
                  <label
                    htmlFor="concierge-monthly-notes"
                    className="text-xs font-semibold text-slate-200"
                  >
                    Observações & Alinhamentos Estratégicos do Mês (Opcional)
                  </label>
                </div>
                <Textarea
                  id="concierge-monthly-notes"
                  value={topics.notes || ""}
                  onChange={(e) =>
                    setTopics((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="Ex: Neste mês temos evento presencial na 3ª semana; dar ênfase a depoimentos e vídeos curtos no formato Reels..."
                  rows={2}
                  className="w-full text-xs bg-slate-900 border-slate-800 focus:border-[#0083C7] focus:ring-1 focus:ring-[#0083C7] text-slate-100 placeholder:text-slate-500 rounded-lg resize-none leading-relaxed"
                />
              </div>

              {/* Rodapé: Metadados da Última Alteração & Botões de Ação */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  {topics.updatedAt ? (
                    <>
                      <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>
                        Última atualização em{" "}
                        <strong className="text-slate-300 font-medium">
                          {formatLastUpdated(topics.updatedAt)}
                        </strong>
                        {topics.updatedBy && (
                          <>
                            {" "}
                            por{" "}
                            <span className="text-slate-300">
                              {topics.updatedBy}
                            </span>
                            {topics.updatedByRole === "client_approver" ? " (Cliente)" : " (Gestor)"}
                          </>
                        )}
                      </span>
                    </>
                  ) : (
                    <span>Nenhuma pauta salva ainda para este mês.</span>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {isDirty && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleDiscardChanges}
                      disabled={saving}
                      className="text-slate-400 hover:text-white hover:bg-slate-800 text-xs h-9 rounded-lg gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Descartar
                    </Button>
                  )}

                  <Button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || !isDirty}
                    className={cn(
                      "text-white font-medium text-xs px-4 h-9 rounded-lg shadow-sm flex items-center gap-2 transition-all",
                      isDirty
                        ? "bg-[#0083C7] hover:bg-[#0072ad] active:scale-[0.99]"
                        : "bg-slate-800 text-slate-400 cursor-not-allowed"
                    )}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Salvar Pautas</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
