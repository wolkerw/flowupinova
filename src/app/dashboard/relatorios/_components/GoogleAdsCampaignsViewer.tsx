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
  Search,
  Target,
  Calendar,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";

interface GoogleAdsCampaignsViewerProps {
  campaigns: any[];
  isConnected: boolean;
  adAccountId?: string;
  adAccountName?: string;
  periodDays: string;
  onPeriodChange?: (newPeriod: string) => void;
}

export function GoogleAdsCampaignsViewer({
  campaigns,
  isConnected,
  adAccountId,
  adAccountName,
  periodDays,
  onPeriodChange,
}: GoogleAdsCampaignsViewerProps) {
  if (!isConnected) {
    return (
      <Card className="border border-slate-200 bg-white p-8 text-center shadow-xs">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-red-50 text-[#EA4335]">
          <Search className="h-7 w-7" />
        </div>
        <h3 className="mt-4 font-poppins text-lg font-semibold text-slate-800">
          Google Ads Não Conectado
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          Conecte sua conta de anúncios do Google Ads para acompanhar cliques, impressões de busca,
          custo por palavra-chave e ROI das suas campanhas.
        </p>
        <div className="mt-6 flex justify-center">
          <Link href="/dashboard/anuncios">
            <Button className="bg-[#EA4335] text-white hover:bg-[#D33828]">
              Conectar Google Ads
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

  // Cálculos consolidados Google Ads
  const totalSpent = activeCampaigns.reduce(
    (acc, c) => acc + (Number(c.metrics?.amountSpent) || Number(c.metrics?.spent) || 0),
    0
  );
  const totalImpressions = activeCampaigns.reduce(
    (acc, c) => acc + (Number(c.metrics?.impressions) || 0),
    0
  );
  const totalClicks = activeCampaigns.reduce(
    (acc, c) => acc + (Number(c.metrics?.clicks) || 0),
    0
  );
  const totalConversions = activeCampaigns.reduce(
    (acc, c) => acc + (Number(c.metrics?.conversions) || 0),
    0
  );

  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const avgCpc = totalClicks > 0 ? totalSpent / totalClicks : 0;
  const avgCostPerConv = totalConversions > 0 ? totalSpent / totalConversions : 0;

  const getChannelLabel = (channel: string) => {
    const c = (channel || "").toUpperCase();
    if (c.includes("SEARCH")) return "🔍 Rede de Pesquisa";
    if (c.includes("DISPLAY")) return "🖼️ Rede de Display";
    if (c.includes("PERFORMANCE_MAX")) return "🚀 Performance Max";
    if (c.includes("SHOPPING")) return "🛍️ Google Shopping";
    if (c.includes("VIDEO") || c.includes("YOUTUBE")) return "▶️ YouTube Ads";
    if (c.includes("LOCAL")) return "📍 Google Maps / Local";
    return "🔍 Pesquisa Google";
  };

  const getBiddingLabel = (bid: string) => {
    const b = (bid || "").toUpperCase();
    if (b.includes("MAXIMIZE_CLICKS")) return "Max. Cliques";
    if (b.includes("MAXIMIZE_CONVERSIONS")) return "Max. Conversões";
    if (b.includes("TARGET_CPA")) return "CPA Desejado";
    if (b.includes("MANUAL_CPC")) return "CPC Manual";
    return b ? b.replace(/_/g, " ") : "Otimização Automática";
  };

  return (
    <div className="space-y-6">
      {/* Header com Status da Conexão */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-[#EA4335]">
            <Search className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-poppins text-sm font-semibold text-slate-900">
                {adAccountName ? adAccountName : "Conta Google Ads Conectada"}
              </h4>
              <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-medium hover:bg-emerald-100">
                Ativa
              </Badge>
            </div>
            {adAccountId && (
              <p className="text-xs text-slate-500">Customer ID: {adAccountId}</p>
            )}
          </div>
        </div>

        <Link href="/dashboard/anuncios">
          <Button variant="outline" size="sm" className="text-xs text-slate-700">
            <Megaphone className="mr-1.5 h-3.5 w-3.5 text-[#EA4335]" />
            Gerenciar Anúncios Google
          </Button>
        </Link>
      </div>

      {/* 5 Cards de Métricas Específicas do Google Ads */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Investimento */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Investimento Total
              </span>
              <div className="rounded-lg bg-red-50 p-2 text-[#EA4335]">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-poppins text-xl font-bold text-slate-900">
                {totalSpent.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">Custo nos últimos {periodDays}d</p>
          </CardContent>
        </Card>

        {/* Impressões */}
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
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-poppins text-xl font-bold text-slate-900">
                {totalImpressions.toLocaleString("pt-BR")}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">Exibições nas buscas</p>
          </CardContent>
        </Card>

        {/* Cliques & CTR */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Cliques Obtidos
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
              Taxa de cliques nas pesquisas
            </p>
          </CardContent>
        </Card>

        {/* CPC Médio */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                CPC Médio
              </span>
              <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-poppins text-xl font-bold text-slate-900">
                {avgCpc > 0
                  ? avgCpc.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                  : "R$ 0,00"}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">Custo por clique</p>
          </CardContent>
        </Card>

        {/* Conversões */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Conversões
              </span>
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <Target className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-poppins text-xl font-bold text-slate-900">
                {totalConversions.toLocaleString("pt-BR")}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              {avgCostPerConv > 0
                ? `CPA: ${avgCostPerConv.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`
                : "Ações de valor no site"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Campanhas do Google Ads com atividade no período */}
      <Card className="border border-slate-200 bg-white shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                Campanhas Veiculadas no Período ({activeCampaigns.length})
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Exibindo apenas campanhas com custo ou impressões nos últimos {periodDays} dias
              </CardDescription>
            </div>

            {/* Filtro de data sincronizado na parte inferior */}
            {onPeriodChange && (
              <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
                <Calendar className="ml-1.5 mr-1 h-3.5 w-3.5 text-[#EA4335]" />
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
                        ? "bg-[#EA4335] text-white shadow-xs"
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
              <Search className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="font-medium text-slate-700">Nenhuma campanha com veiculação neste período</p>
              <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                Não foram registrados gastos ou impressões nos últimos {periodDays} dias para esta conta do Google Ads.
              </p>
              <div className="mt-4 flex items-center justify-center gap-3">
                <Link href="/dashboard/anuncios">
                  <Button size="sm" className="bg-[#EA4335] text-white hover:bg-[#D33828]">
                    Criar Anúncio no Google
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
                const conversions = Number(camp.metrics?.conversions) || 0;
                const ctr = Number(camp.metrics?.ctr) || (impressions > 0 ? (clicks / impressions) * 100 : 0);
                const avgCpc = Number(camp.metrics?.averageCpc) || (clicks > 0 ? spent / clicks : 0);
                const costPerConv = conversions > 0 ? spent / conversions : 0;
                const budget = Number(camp.budgetAmount) || 0;
                const isActive = camp.status === "active";
                const isPaused = camp.status === "paused";

                return (
                  <div
                    key={camp.id}
                    className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 transition-all duration-200 hover:border-slate-300 hover:bg-white hover:shadow-xs"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      {/* Lado Esquerdo: Info da Campanha */}
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#EA4335]">
                          <Search className="h-7 w-7" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h5 className="font-poppins text-sm font-semibold text-slate-900 truncate max-w-sm sm:max-w-md">
                              {camp.name || "Campanha Google Ads"}
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
                            <Badge variant="outline" className="text-[10px] font-medium text-red-700 bg-red-50 border-red-200">
                              {getChannelLabel(camp.channelType)}
                            </Badge>
                            {camp.biddingStrategy && (
                              <Badge variant="secondary" className="text-[10px] text-slate-600 bg-slate-100">
                                {getBiddingLabel(camp.biddingStrategy)}
                              </Badge>
                            )}
                          </div>

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
                              Custo no período: <strong className="text-[#EA4335]">{spent.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Lado Direito: Grid Completo de Métricas */}
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 border-t border-slate-200/60 pt-3 lg:border-0 lg:pt-0">
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
                            CPC Médio
                          </span>
                          <span className="font-poppins text-xs font-bold text-slate-800">
                            {avgCpc > 0 ? avgCpc.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "R$ 0,00"}
                          </span>
                        </div>

                        <div className="rounded-lg bg-white p-2 text-center shadow-2xs border border-slate-100">
                          <span className="block text-[10px] font-semibold uppercase text-slate-400">
                            Conversões
                          </span>
                          <span className="font-poppins text-xs font-bold text-blue-600">
                            {conversions} {costPerConv > 0 && <span className="text-[10px] text-slate-500 font-normal">({costPerConv.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })})</span>}
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
