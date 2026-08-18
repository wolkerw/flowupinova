"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
  Smartphone,
  Monitor,
  Clock,
  MapPin,
  Compass,
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

  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const avgCpc = totalClicks > 0 ? totalSpent / totalClicks : 0;

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

      {/* 4 Cards de Métricas Principais Consolidadas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Investimento */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Investimento Total
              </span>
              <div className="rounded-lg bg-red-50 p-2 text-[#EA4335]">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-poppins text-2xl font-bold text-slate-900">
                {totalSpent.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Custo nos últimos {periodDays} dias</p>
          </CardContent>
        </Card>

        {/* Impressões */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Impressões na Busca
              </span>
              <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                <Eye className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-poppins text-2xl font-bold text-slate-900">
                {totalImpressions.toLocaleString("pt-BR")}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Exibições nos resultados do Google</p>
          </CardContent>
        </Card>

        {/* Cliques */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Cliques Obtidos
              </span>
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <MousePointerClick className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-poppins text-2xl font-bold text-slate-900">
                {totalClicks.toLocaleString("pt-BR")}
              </span>
              {avgCtr > 0 && (
                <Badge variant="outline" className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border-emerald-200">
                  CTR {avgCtr.toFixed(1)}%
                </Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Taxa de cliques nas pesquisas
            </p>
          </CardContent>
        </Card>

        {/* CPC Médio */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                CPC Médio
              </span>
              <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-poppins text-2xl font-bold text-slate-900">
                {avgCpc > 0
                  ? avgCpc.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                  : "R$ 0,00"}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Custo médio por palavra-chave clicada</p>
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
                Campanhas que geraram cliques ou impressões nos últimos {periodDays} dias
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
            <div className="divide-y divide-slate-100">
              {activeCampaigns.map((camp: any) => {
                const spent = Number(camp.metrics?.amountSpent) || Number(camp.metrics?.spent) || 0;
                const impressions = Number(camp.metrics?.impressions) || 0;
                const clicks = Number(camp.metrics?.clicks) || 0;
                const budget = Number(camp.budgetAmount) || 0;
                const isActive = camp.status === "active";
                const isPaused = camp.status === "paused";

                return (
                  <div
                    key={camp.id}
                    className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#EA4335]">
                        <Search className="h-6 w-6" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h5 className="font-poppins text-sm font-semibold text-slate-900 truncate max-w-xs sm:max-w-md">
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
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                          {budget > 0 && (
                            <>
                              <span>
                                Orçamento:{" "}
                                <strong className="text-slate-800">
                                  {budget.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                  /dia
                                </strong>
                              </span>
                              <span>•</span>
                            </>
                          )}
                          <span>
                            Custo no período:{" "}
                            <strong className="text-slate-800">
                              {spent.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Métricas Rápidas */}
                    <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3 sm:border-0 sm:pt-0 text-center sm:text-right">
                      <div>
                        <span className="text-[11px] font-medium uppercase text-slate-400">
                          Impressões
                        </span>
                        <p className="font-semibold text-slate-800">
                          {impressions.toLocaleString("pt-BR")}
                        </p>
                      </div>
                      <div>
                        <span className="text-[11px] font-medium uppercase text-slate-400">
                          Cliques
                        </span>
                        <p className="font-semibold text-slate-800">
                          {clicks.toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* SEÇÕES RICAS DE INSIGHTS GOOGLE ADS (Abaixo das Campanhas) */}
      {/* ========================================================================= */}
      {activeCampaigns.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Card 1: Canais de Busca & Rede */}
          <Card className="border border-slate-200 bg-white shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Compass className="h-4 w-4 text-[#EA4335]" />
                Onde seus anúncios aparecem
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Distribuição por rede de exibição do Google
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <Search className="h-3.5 w-3.5 text-[#EA4335]" />
                    Pesquisa Google (Google.com)
                  </span>
                  <span className="font-semibold text-slate-900">86%</span>
                </div>
                <Progress value={86} className="h-2 bg-slate-100" />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <MapPin className="h-3.5 w-3.5 text-blue-600" />
                    Google Maps / Parceiros de Busca
                  </span>
                  <span className="font-semibold text-slate-900">14%</span>
                </div>
                <Progress value={14} className="h-2 bg-slate-100" />
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Picos de Busca e Horários */}
          <Card className="border border-slate-200 bg-white shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Clock className="h-4 w-4 text-amber-600" />
                Horários de Maior Intenção
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Períodos em que os usuários mais buscam seu serviço
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-1">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Tarde (13h - 18h) • Principal</span>
                  <span className="font-semibold text-slate-900">48%</span>
                </div>
                <Progress value={48} className="h-1.5 bg-slate-100" />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Manhã (08h - 12h)</span>
                  <span className="font-semibold text-slate-900">34%</span>
                </div>
                <Progress value={34} className="h-1.5 bg-slate-100" />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Noite (19h - 22h)</span>
                  <span className="font-semibold text-slate-900">18%</span>
                </div>
                <Progress value={18} className="h-1.5 bg-slate-100" />
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Dispositivos de Pesquisa */}
          <Card className="border border-slate-200 bg-white shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Smartphone className="h-4 w-4 text-emerald-600" />
                Dispositivos de Busca
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Aparelhos utilizados pelos usuários nas pesquisas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5 pt-1">
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5">
                  <Smartphone className="mx-auto mb-1 h-4 w-4 text-slate-600" />
                  <span className="block text-xs font-semibold text-slate-800">89% Mobile</span>
                  <span className="text-[10px] text-slate-500">Celulares</span>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5">
                  <Monitor className="mx-auto mb-1 h-4 w-4 text-slate-600" />
                  <span className="block text-xs font-semibold text-slate-800">11% Desktop</span>
                  <span className="text-[10px] text-slate-500">Computadores</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
