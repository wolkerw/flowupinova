"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  TrendingUp,
  MousePointerClick,
  Eye,
  Megaphone,
  CheckCircle2,
  PauseCircle,
  Clock,
  MapPin,
  ExternalLink,
  Facebook,
  Instagram,
  Layers,
  Sparkles,
  MessageSquare,
  Users,
  Target,
  BarChart2,
  Calendar,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface MetaAdsCampaignsViewerProps {
  campaigns: any[];
  isConnected: boolean;
  adAccountName?: string;
  pageName?: string;
  periodDays: string;
  onPeriodChange?: (newPeriod: string) => void;
}

export function MetaAdsCampaignsViewer({
  campaigns,
  isConnected,
  adAccountName,
  pageName,
  periodDays,
  onPeriodChange,
}: MetaAdsCampaignsViewerProps) {
  if (!isConnected) {
    return (
      <Card className="border border-slate-200 bg-white p-8 text-center shadow-xs">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-[#0083C7]">
          <Facebook className="h-7 w-7" />
        </div>
        <h3 className="mt-4 font-poppins text-lg font-semibold text-slate-800">
          Meta Ads Não Conectado
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          Conecte sua conta de anúncios da Meta (Facebook e Instagram) para visualizar métricas
          automáticas de tráfego, engajamento e investimento por campanha.
        </p>
        <div className="mt-6 flex justify-center">
          <Link href="/dashboard/anuncios">
            <Button className="bg-[#0083C7] text-white hover:bg-[#0070AA]">
              Conectar Meta Ads
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  // Filtrar apenas campanhas com custo > 0 ou impressões > 0 no período selecionado
  const activeCampaigns = campaigns.filter((c) => {
    const spent = Number(c.metrics?.amountSpent) || Number(c.metrics?.spent) || 0;
    const impressions = Number(c.metrics?.impressions) || 0;
    return spent > 0 || impressions > 0;
  });

  // Cálculos consolidados Meta Ads
  const totalSpent = activeCampaigns.reduce(
    (acc, c) => acc + (Number(c.metrics?.amountSpent) || Number(c.metrics?.spent) || 0),
    0
  );
  const totalImpressions = activeCampaigns.reduce(
    (acc, c) => acc + (Number(c.metrics?.impressions) || 0),
    0
  );
  const totalReach = activeCampaigns.reduce(
    (acc, c) => acc + (Number(c.metrics?.reach) || Number(c.metrics?.impressions) || 0),
    0
  );
  const totalClicks = activeCampaigns.reduce(
    (acc, c) => acc + (Number(c.metrics?.clicks) || 0),
    0
  );
  const totalActions = activeCampaigns.reduce(
    (acc, c) => acc + (Number(c.metrics?.actions) || 0),
    0
  );

  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const avgCpc = totalClicks > 0 ? totalSpent / totalClicks : 0;
  const avgCpm = totalImpressions > 0 ? (totalSpent / totalImpressions) * 1000 : 0;
  const costPerAction = totalActions > 0 ? totalSpent / totalActions : 0;
  const avgFrequency = totalReach > 0 ? totalImpressions / totalReach : 1;

  const getObjectiveLabel = (obj: string) => {
    const o = (obj || "").toUpperCase();
    if (o.includes("MESSAGES") || o.includes("MENSAGEM")) return "💬 Mensagens / Conversas";
    if (o.includes("TRAFFIC") || o.includes("TRAFEGO")) return "🎯 Tráfego no Link";
    if (o.includes("ENGAGEMENT") || o.includes("ENGAJAMENTO")) return "⚡ Engajamento";
    if (o.includes("OUTCOME_LEADS") || o.includes("LEAD")) return "📋 Geração de Leads";
    if (o.includes("OUTCOME_SALES") || o.includes("VENDA")) return "🛍️ Vendas / Conversão";
    if (o.includes("AWARENESS") || o.includes("RECONHECIMENTO")) return "📢 Reconhecimento";
    return "📢 Alcance e Tráfego";
  };

  return (
    <div className="space-y-6">
      {/* Header com Status da Conexão */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0083C7]">
            <Facebook className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-poppins text-sm font-semibold text-slate-900">
                {adAccountName ? `Conta: ${adAccountName}` : "Conta Meta Ads Conectada"}
              </h4>
              <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-medium hover:bg-emerald-100">
                Ativa
              </Badge>
            </div>
            {pageName && (
              <p className="text-xs text-slate-500">Página vinculada: {pageName}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/dashboard/anuncios">
            <Button variant="outline" size="sm" className="text-xs text-slate-700">
              <Megaphone className="mr-1.5 h-3.5 w-3.5 text-[#0083C7]" />
              Gerenciar Anúncios
            </Button>
          </Link>
        </div>
      </div>

      {/* 5 Cards de Métricas Consolidadas da Meta */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Investimento */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Gasto no Período
              </span>
              <div className="rounded-lg bg-blue-50 p-2 text-[#0083C7]">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-poppins text-xl font-bold text-slate-900">
                {totalSpent.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">Investido nos últimos {periodDays}d</p>
          </CardContent>
        </Card>

        {/* Impressões & Alcance */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Impressões
              </span>
              <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                <Eye className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-poppins text-xl font-bold text-slate-900">
                {totalImpressions.toLocaleString("pt-BR")}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Alcance: {totalReach.toLocaleString("pt-BR")} pessoas
            </p>
          </CardContent>
        </Card>

        {/* Cliques & CTR */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Cliques no Link
              </span>
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <MousePointerClick className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-poppins text-xl font-bold text-slate-900">
                {totalClicks.toLocaleString("pt-BR")}
              </span>
              {avgCtr > 0 && (
                <Badge variant="outline" className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border-emerald-200">
                  CTR {avgCtr.toFixed(1)}%
                </Badge>
              )}
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              CPC Médio: {avgCpc > 0 ? avgCpc.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "R$ 0,00"}
            </p>
          </CardContent>
        </Card>

        {/* Ações / Conversões */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Ações Principais
              </span>
              <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
                <MessageSquare className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-poppins text-xl font-bold text-slate-900">
                {totalActions.toLocaleString("pt-BR")}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              {costPerAction > 0
                ? `CPA: ${costPerAction.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`
                : "Mensagens & Cliques CTA"}
            </p>
          </CardContent>
        </Card>

        {/* CPM & Frequência */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                CPM Médio
              </span>
              <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-poppins text-xl font-bold text-slate-900">
                {avgCpm.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Freq. média: {avgFrequency.toFixed(2)}x
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Campanhas da Meta com atividade no período */}
      <Card className="border border-slate-200 bg-white shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                Campanhas Veiculadas no Período ({activeCampaigns.length})
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Exibindo apenas anúncios que registraram custo ou impressões no intervalo selecionado
              </CardDescription>
            </div>

            {/* Filtro de data sincronizado na parte inferior */}
            {onPeriodChange && (
              <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
                <Calendar className="ml-1.5 mr-1 h-3.5 w-3.5 text-[#0083C7]" />
                {[
                  { label: "7d", value: "7" },
                  { label: "14d", value: "14" },
                  { label: "30d", value: "30" },
                  { label: "90d", value: "90" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onPeriodChange(opt.value)}
                    className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                      periodDays === opt.value
                        ? "bg-[#0083C7] text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {activeCampaigns.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Megaphone className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="font-medium text-slate-700">Nenhuma campanha com veiculação neste período</p>
              <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                Não foram registrados gastos ou impressões nos últimos {periodDays} dias para esta conta de anúncios.
              </p>
              <div className="mt-4 flex items-center justify-center gap-3">
                <Link href="/dashboard/anuncios">
                  <Button size="sm" className="bg-[#0083C7] text-white hover:bg-[#0070AA]">
                    Criar Anúncio
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {activeCampaigns.map((camp: any) => {
                const spent = Number(camp.metrics?.amountSpent) || Number(camp.metrics?.spent) || 0;
                const impressions = Number(camp.metrics?.impressions) || 0;
                const clicks = Number(camp.metrics?.clicks) || 0;
                const actions = Number(camp.metrics?.actions) || clicks;
                const reach = Number(camp.metrics?.reach) || impressions;
                const ctr = Number(camp.metrics?.ctr) || (impressions > 0 ? (clicks / impressions) * 100 : 0);
                const cpc = Number(camp.metrics?.cpc) || (clicks > 0 ? spent / clicks : 0);
                const cpm = Number(camp.metrics?.cpm) || (impressions > 0 ? (spent / impressions) * 1000 : 0);
                const cpa = actions > 0 ? spent / actions : 0;
                const budget = Number(camp.budget?.amount) || 0;
                const isActive = camp.status === "active";
                const isPaused = camp.status === "paused";

                return (
                  <div
                    key={camp.id || camp.metaCampaignId}
                    className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 transition-all duration-200 hover:border-slate-300 hover:bg-white hover:shadow-xs"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      {/* Lado Esquerdo: Info da Campanha */}
                      <div className="flex items-start gap-3.5 min-w-0">
                        {camp.creative?.imageUrl ? (
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                            <Image
                              src={camp.creative.imageUrl}
                              alt={camp.name || "Criativo"}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#0083C7]">
                            <Facebook className="h-7 w-7" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h5 className="font-poppins text-sm font-semibold text-slate-900 truncate max-w-sm sm:max-w-md">
                              {camp.name || "Campanha Meta Ads"}
                            </h5>
                            <Badge
                              className={`text-[10px] font-medium ${
                                isActive
                                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                                  : isPaused
                                  ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                                  : "bg-slate-100 text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              {isActive ? "Ativa" : isPaused ? "Pausada" : camp.status || "Concluída"}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] font-medium text-blue-700 bg-blue-50 border-blue-200">
                              {getObjectiveLabel(camp.objective)}
                            </Badge>
                          </div>

                          {camp.targeting?.address && (
                            <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                              <MapPin className="h-3 w-3 text-slate-400" />
                              {camp.targeting.address} ({camp.targeting.radiusKm || 5}km)
                            </p>
                          )}

                          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                            {budget > 0 && (
                              <>
                                <span>
                                  Orçamento: <strong className="text-slate-800">{budget.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/dia</strong>
                                </span>
                                <span>•</span>
                              </>
                            )}
                            <span>
                              Investido no período: <strong className="text-[#0083C7]">{spent.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Lado Direito: Grid Completo de Métricas */}
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 border-t border-slate-200/60 pt-3 lg:border-0 lg:pt-0">
                        <div className="rounded-lg bg-white p-2 text-center shadow-2xs border border-slate-100">
                          <span className="block text-[10px] font-semibold uppercase text-slate-400">
                            Impressões
                          </span>
                          <span className="font-poppins text-xs font-bold text-slate-800">
                            {impressions.toLocaleString("pt-BR")}
                          </span>
                        </div>

                        <div className="rounded-lg bg-white p-2 text-center shadow-2xs border border-slate-100">
                          <span className="block text-[10px] font-semibold uppercase text-slate-400">
                            Alcance
                          </span>
                          <span className="font-poppins text-xs font-bold text-slate-800">
                            {reach.toLocaleString("pt-BR")}
                          </span>
                        </div>

                        <div className="rounded-lg bg-white p-2 text-center shadow-2xs border border-slate-100">
                          <span className="block text-[10px] font-semibold uppercase text-slate-400">
                            Cliques
                          </span>
                          <span className="font-poppins text-xs font-bold text-slate-800">
                            {clicks.toLocaleString("pt-BR")}
                          </span>
                        </div>

                        <div className="rounded-lg bg-white p-2 text-center shadow-2xs border border-slate-100">
                          <span className="block text-[10px] font-semibold uppercase text-slate-400">
                            CTR
                          </span>
                          <span className="font-poppins text-xs font-bold text-emerald-600">
                            {ctr.toFixed(2)}%
                          </span>
                        </div>

                        <div className="rounded-lg bg-white p-2 text-center shadow-2xs border border-slate-100">
                          <span className="block text-[10px] font-semibold uppercase text-slate-400">
                            CPC
                          </span>
                          <span className="font-poppins text-xs font-bold text-slate-800">
                            {cpc > 0 ? cpc.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "R$ 0,00"}
                          </span>
                        </div>

                        <div className="rounded-lg bg-white p-2 text-center shadow-2xs border border-slate-100">
                          <span className="block text-[10px] font-semibold uppercase text-slate-400">
                            Ações / CPA
                          </span>
                          <span className="font-poppins text-xs font-bold text-[#0083C7]">
                            {actions} {cpa > 0 && <span className="text-[10px] text-slate-500 font-normal">({cpa.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })})</span>}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
