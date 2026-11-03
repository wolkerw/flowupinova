"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Target,
  Sparkles,
  ExternalLink,
  Plus,
  Trash2,
  Pencil,
  Loader2,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Copy,
  ChevronDown,
  ChevronUp,
  Globe,
  Instagram,
  RefreshCw,
  Award,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { CompetitorAnalysisItem } from "@/lib/services/onboarding-service";

interface CompetitorsBenchmarkingSectionProps {
  competitors: CompetitorAnalysisItem[];
  onUpdateCompetitors: (updated: CompetitorAnalysisItem[]) => Promise<void>;
  userBusinessContext: {
    name?: string;
    category?: string;
    description?: string;
    targetAudience?: string;
  };
}

export function CompetitorsBenchmarkingSection({
  competitors = [],
  onUpdateCompetitors,
  userBusinessContext,
}: CompetitorsBenchmarkingSectionProps) {
  const { toast } = useToast();

  // Estados do Modal de Criação / Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<"direct_competitor" | "market_reference">("direct_competitor");
  const [website, setWebsite] = useState("");
  const [socialMedia, setSocialMedia] = useState("");
  const [notes, setNotes] = useState("");

  // Estado de Inspeção com IA
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});
  const toggleExpanded = (id: string) => {
    setExpandedMap((prev) => ({
      ...prev,
      [id]: prev[id] !== undefined ? !prev[id] : false,
    }));
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setName("");
    setType("direct_competitor");
    setWebsite("");
    setSocialMedia("");
    setNotes("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (comp: CompetitorAnalysisItem) => {
    setEditingId(comp.id);
    setName(comp.name || "");
    setType(comp.type || "direct_competitor");
    setWebsite(comp.website || "");
    setSocialMedia(comp.socialMedia || "");
    setNotes(comp.notes || "");
    setIsModalOpen(true);
  };

  const handleSaveCompetitor = async () => {
    if (!name.trim()) {
      toast({
        title: "Nome Obrigatório",
        description: "Informe o nome do concorrente ou marca de referência.",
        variant: "destructive",
      });
      return;
    }

    let cleanWebsite = website.trim();
    if (cleanWebsite && !cleanWebsite.startsWith("http://") && !cleanWebsite.startsWith("https://")) {
      cleanWebsite = `https://${cleanWebsite}`;
    }

    if (editingId) {
      const updated = competitors.map((c) =>
        c.id === editingId
          ? {
              ...c,
              name: name.trim(),
              type,
              website: cleanWebsite || undefined,
              socialMedia: socialMedia.trim() || undefined,
              notes: notes.trim() || undefined,
            }
          : c
      );
      await onUpdateCompetitors(updated);
      toast({
        title: "Concorrente Atualizado! ✨",
        description: `Informações de ${name.trim()} atualizadas com sucesso.`,
      });
    } else {
      const newItem: CompetitorAnalysisItem = {
        id: `comp_${Date.now()}`,
        name: name.trim(),
        type,
        website: cleanWebsite || undefined,
        socialMedia: socialMedia.trim() || undefined,
        notes: notes.trim() || undefined,
        status: "pending",
      };
      const updated = [...competitors, newItem];
      await onUpdateCompetitors(updated);
      toast({
        title: "Concorrente Cadastrado! 🎯",
        description: `Agora você pode clicar em "Inspecionar com IA" para analisar a presença digital dele.`,
      });
    }

    setIsModalOpen(false);
  };

  const handleDeleteCompetitor = async (comp: CompetitorAnalysisItem) => {
    if (confirm(`Deseja remover "${comp.name}" do seu radar de concorrência?`)) {
      const updated = competitors.filter((c) => c.id !== comp.id);
      await onUpdateCompetitors(updated);
      toast({
        title: "Concorrente Removido",
        description: `"${comp.name}" foi removido do seu Cérebro do Negócio.`,
      });
    }
  };

  const handleAnalyzeCompetitor = async (comp: CompetitorAnalysisItem) => {
    setAnalyzingId(comp.id);
    toast({
      title: "Inspecionando Concorrente... 🔍",
      description: `Nossa IA está analisando a presença digital de ${comp.name}. Isso leva alguns instantes.`,
    });

    try {
      const res = await fetch("/api/competitors/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competitorName: comp.name,
          type: comp.type,
          website: comp.website,
          socialMedia: comp.socialMedia,
          userBusinessContext,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Falha na análise do concorrente.");
      }

      const updated = competitors.map((c) =>
        c.id === comp.id
          ? {
              ...c,
              status: "completed" as const,
              analysisReport: data.report,
              analyzedAt: data.analyzedAt,
            }
          : c
      );

      await onUpdateCompetitors(updated);
      setExpandedMap((prev) => ({ ...prev, [comp.id]: true }));
      toast({
        title: "Inspeção Concluída com Sucesso! 🎯",
        description: `Identificamos os pontos fortes de ${comp.name} e oportunidades para o seu negócio vencê-los!`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro na Inspeção",
        description: err.message || "Não foi possível concluir a análise agora.",
      });
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado com Sucesso!",
      description: `${label} copiado para a área de transferência.`,
    });
  };

  return (
    <Card className="border-none shadow-md overflow-hidden bg-white">
      <CardHeader className="border-b border-slate-100 bg-slate-50/60 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                <Target className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg font-bold text-slate-900">
                Radar de Concorrentes & Referências do Mercado
              </CardTitle>
              <Badge className="bg-indigo-600 text-white text-[10px] font-bold border-none">
                Benchmarking por IA
              </Badge>
            </div>
            <CardDescription className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
              Cadastre concorrentes diretos ou marcas que você admira no seu nicho. Nossa IA inspeciona
              o site e redes sociais deles, revelando <strong>o que deu certo</strong> para você modelar
              e apontando <strong>onde eles erram</strong> para o seu negócio se destacar e atrair os clientes deles.
            </CardDescription>
          </div>

          <Button
            type="button"
            onClick={handleOpenAdd}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-9 px-3.5 rounded-xl shadow-xs shrink-0 self-start sm:self-auto gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Adicionar Concorrente
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {competitors.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <Target className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900">
                Nenhum concorrente ou referência cadastrada ainda
              </h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Adicione os principais concorrentes da sua cidade/região ou as maiores referências do seu segmento.
                A IA analisará a comunicação deles e entregará ideias de posts prontas para você superá-los.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenAdd}
              className="text-xs font-semibold text-indigo-700 border-indigo-200 hover:bg-indigo-50"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Cadastrar Primeiro Concorrente
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {competitors.map((comp) => {
              const isAnalyzing = analyzingId === comp.id;
              const hasReport = comp.status === "completed" && comp.analysisReport;
              const isExpanded = expandedMap[comp.id] !== undefined ? expandedMap[comp.id] : true;

              return (
                <div
                  key={comp.id}
                  className="rounded-2xl border border-slate-200 bg-white transition-all shadow-xs overflow-hidden"
                >
                  {/* Cabeçalho do Card do Concorrente */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-5 gap-3 bg-slate-50/50 border-b border-slate-100">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-bold text-slate-900">{comp.name}</h4>
                        <Badge
                          variant="outline"
                          className={
                            comp.type === "market_reference"
                              ? "bg-purple-50 text-purple-700 border-purple-200 text-[10px]"
                              : "bg-rose-50 text-rose-700 border-rose-200 text-[10px]"
                          }
                        >
                          {comp.type === "market_reference"
                            ? "⭐ Referência Aspiracional"
                            : "🎯 Concorrente Direto"}
                        </Badge>
                        {hasReport ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Inspecionado pela IA
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] text-slate-500">
                            ⏳ Pendente de Inspeção
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                        {comp.website && (
                          <a
                            href={comp.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-indigo-600 hover:underline"
                          >
                            <Globe className="h-3.5 w-3.5 text-slate-400" />
                            <span className="truncate max-w-[200px]">
                              {comp.website.replace(/^https?:\/\//, "")}
                            </span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {comp.socialMedia && (
                          <span className="flex items-center gap-1">
                            <Instagram className="h-3.5 w-3.5 text-pink-500" />
                            <span className="font-medium text-slate-700">{comp.socialMedia}</span>
                          </span>
                        )}
                        {comp.analyzedAt && (
                          <span className="text-[11px] text-slate-400">
                            Última análise:{" "}
                            {new Date(comp.analyzedAt).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
                      <Button
                        type="button"
                        size="sm"
                        disabled={isAnalyzing}
                        onClick={() => handleAnalyzeCompetitor(comp)}
                        className={
                          hasReport
                            ? "bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold h-8 px-3"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-8 px-3 shadow-xs"
                        }
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            Inspecionando...
                          </>
                        ) : hasReport ? (
                          <>
                            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                            Re-inspecionar
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                            Inspecionar com IA 🔍
                          </>
                        )}
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(comp)}
                        className="h-8 w-8 p-0 text-slate-500 hover:text-slate-800"
                        title="Editar Concorrente"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCompetitor(comp)}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600"
                        title="Remover Concorrente"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>

                      {hasReport && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(comp.id)}
                          className="h-8 text-xs text-indigo-700 hover:bg-indigo-50 font-semibold gap-1 px-2"
                        >
                          {isExpanded ? (
                            <>
                              Ocultar Dossiê <ChevronUp className="h-3.5 w-3.5" />
                            </>
                          ) : (
                            <>
                              Ver Dossiê da Concorrência <ChevronDown className="h-3.5 w-3.5" />
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Relatório Visual da Inspeção de IA */}
                  {hasReport && isExpanded && (
                    <div className="p-4 sm:p-6 space-y-6 bg-white animate-in fade-in-50 duration-200">
                      {/* 1. Resumo Executivo */}
                      <div className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-4 space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                          <TrendingUp className="h-4 w-4 text-indigo-600" />
                          Diagnóstico Executivo de Presença Digital
                        </span>
                        <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                          {comp.analysisReport?.executiveSummary}
                        </p>

                        {comp.analysisReport?.benchmarkScores && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-indigo-100 mt-3">
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs font-semibold text-slate-700">
                                <span>Posicionamento de Marca</span>
                                <span>{comp.analysisReport.benchmarkScores.positioning}%</span>
                              </div>
                              <Progress
                                value={comp.analysisReport.benchmarkScores.positioning}
                                className="h-1.5"
                              />
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs font-semibold text-slate-700">
                                <span>Clareza da Oferta</span>
                                <span>{comp.analysisReport.benchmarkScores.clarityOfOffer}%</span>
                              </div>
                              <Progress
                                value={comp.analysisReport.benchmarkScores.clarityOfOffer}
                                className="h-1.5"
                              />
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs font-semibold text-slate-700">
                                <span>Engajamento & Conteúdo</span>
                                <span>{comp.analysisReport.benchmarkScores.engagementTactics}%</span>
                              </div>
                              <Progress
                                value={comp.analysisReport.benchmarkScores.engagementTactics}
                                className="h-1.5"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 2. Grid de O Que Deu Certo vs Gargalos */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* O que deu certo (Melhores Práticas para Modelar) */}
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
                              <Award className="h-4 w-4" />
                            </div>
                            <div>
                              <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                                ⭐ O Que Deu Certo na Concorrência
                              </h5>
                              <p className="text-[11px] text-emerald-700">
                                Melhores práticas validadas para você modelar no seu negócio
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2.5">
                            {comp.analysisReport?.whatWorkedWell.map((item, idx) => (
                              <div
                                key={idx}
                                className="rounded-lg bg-white p-3 border border-emerald-100 shadow-2xs space-y-1"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-bold text-slate-900">{item.title}</span>
                                  <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                                    Impacto {item.impact}
                                  </Badge>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                  {item.description}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Gargalos e Oportunidades do Concorrente */}
                        <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-100 text-amber-700">
                              <AlertTriangle className="h-4 w-4" />
                            </div>
                            <div>
                              <h5 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                                ⚡ Onde a Concorrência Peca (Sua Vantagem)
                              </h5>
                              <p className="text-[11px] text-amber-700">
                                Lacunas deixadas por eles para você se posicionar como superior
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2.5">
                            {comp.analysisReport?.gapsAndOpportunities.map((item, idx) => (
                              <div
                                key={idx}
                                className="rounded-lg bg-white p-3 border border-amber-100 shadow-2xs space-y-1"
                              >
                                <span className="text-xs font-bold text-amber-900 block">
                                  ⚠️ {item.gap}
                                </span>
                                <p className="text-xs text-slate-700 leading-relaxed">
                                  <strong>👉 Como você vence:</strong> {item.howToCapitalize}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* 3. Ideias Prontas de Conteúdo para Superar a Concorrência */}
                      <div className="rounded-xl border border-indigo-200 bg-indigo-50/30 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-100 text-indigo-700">
                              <Lightbulb className="h-4 w-4" />
                            </div>
                            <div>
                              <h5 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                                💡 Ideias de Conteúdo para Superar Este Concorrente
                              </h5>
                              <p className="text-[11px] text-indigo-700">
                                Posts planejados para atrair clientes insatisfeitos com a concorrência
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {comp.analysisReport?.winningContentIdeas.map((idea, idx) => (
                            <div
                              key={idx}
                              className="rounded-xl bg-white p-3.5 border border-indigo-100 shadow-2xs space-y-2 flex flex-col justify-between"
                            >
                              <div className="space-y-1.5">
                                <Badge className="bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                                  {idea.format}
                                </Badge>
                                <h6 className="text-xs font-bold text-slate-900 leading-snug">
                                  &ldquo;{idea.headline}&rdquo;
                                </h6>
                                <p className="text-[11px] text-slate-600 leading-relaxed">
                                  {idea.rationale}
                                </p>
                              </div>

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleCopyText(
                                    `Formato: ${idea.format}\nTítulo: "${idea.headline}"\nObjetivo: ${idea.rationale}`,
                                    "Ideia de Post"
                                  )
                                }
                                className="h-7 text-[11px] text-indigo-700 hover:bg-indigo-50 justify-start px-2 font-semibold"
                              >
                                <Copy className="mr-1 h-3 w-3" /> Copiar Ideia
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Modal de Cadastro / Edição de Concorrente */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Target className="h-5 w-5 text-indigo-600" />
              {editingId ? "Editar Concorrente / Referência" : "Adicionar Concorrente ou Referência"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              Insira o nome, site e redes sociais. A inteligência do NumVapt inspecionará o conteúdo para
              extrair as melhores táticas para o seu negócio.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="compName" className="text-xs font-bold text-slate-800">
                Nome da Empresa / Marca <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="compName"
                placeholder="Ex: Empresa Concorrente X"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-800">Classificação</Label>
              <RadioGroup
                value={type}
                onValueChange={(val) => setType(val as any)}
                className="grid grid-cols-2 gap-2"
              >
                <div className="flex items-center space-x-2 rounded-xl border border-slate-200 p-2.5 hover:bg-slate-50 cursor-pointer">
                  <RadioGroupItem value="direct_competitor" id="type_direct" />
                  <Label htmlFor="type_direct" className="text-xs font-medium cursor-pointer">
                    🎯 Concorrente Direto
                  </Label>
                </div>
                <div className="flex items-center space-x-2 rounded-xl border border-slate-200 p-2.5 hover:bg-slate-50 cursor-pointer">
                  <RadioGroupItem value="market_reference" id="type_ref" />
                  <Label htmlFor="type_ref" className="text-xs font-medium cursor-pointer">
                    ⭐ Referência de Mercado
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="compWebsite" className="text-xs font-bold text-slate-800">
                Site Oficial (URL)
              </Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  id="compWebsite"
                  placeholder="https://concorrente.com.br"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="compSocial" className="text-xs font-bold text-slate-800">
                Perfil no Instagram / Rede Social
              </Label>
              <div className="relative">
                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-pink-500" />
                <Input
                  id="compSocial"
                  placeholder="@concorrente ou link do perfil"
                  value={socialMedia}
                  onChange={(e) => setSocialMedia(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="compNotes" className="text-xs font-bold text-slate-800">
                Observações ou Dúvidas sobre Este Concorrente (Opcional)
              </Label>
              <Textarea
                id="compNotes"
                rows={2}
                placeholder="Ex: Eles têm muitos seguidores mas poucos comentários; ou quero entender como eles estruturam os preços."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveCompetitor}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
            >
              {editingId ? "Salvar Alterações" : "Cadastrar Concorrente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
