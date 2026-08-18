"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign,
  TrendingUp,
  MousePointer,
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
  AlertCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface MetaAdsCampaignsViewerProps {
  campaigns: any[];
  isConnected: boolean;
  adAccountName?: string;
  pageName?: string;
  periodDays: string;
}

export function MetaAdsCampaignsViewer({
  campaigns,
  isConnected,
  adAccountName,
  pageName,
  periodDays,
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

  // Cálculos consolidados Meta Ads
  const totalSpent = campaigns.reduce(
    (acc, c) => acc + (Number(c.metrics?.amountSpent) || Number(c.metrics?.spent) || 0),
    0
  );
  const totalImpressions = campaigns.reduce(
    (acc, c) => acc + (Number(c.metrics?.impressions) || 0),
    0
  );
  const totalClicks = campaigns.reduce(
    (acc, c) => acc + (Number(c.metrics?.clicks) || 0),
    0
  );
  const totalActions = campaigns.reduce(
    (acc, c) => acc + (Number(c.metrics?.actions) || 0),
    0
  );

  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const avgCpc = totalClicks > 0 ? totalSpent / totalClicks : 0;
  const costPerAction = totalActions > 0 ? totalSpent / totalActions : 0;

  return (
    <div className="space-y-6">
      {/* Header com Status da Conexão */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#0083C7]">
            <Facebook className="h-5 w-5" />
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

        <Link href="/dashboard/anuncios">
          <Button variant="outline" size="sm" className="text-xs text-slate-700">
            <Megaphone className="mr-1.5 h-3.5 w-3.5 text-[#0083C7]" />
            Gerenciar Anúncios
          </Button>
        </Link>
      </div>

      {/* 4 Cards de Métricas Específicas da Meta */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Investimento */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Gasto no Período
              </span>
              <div className="rounded-lg bg-blue-50 p-2 text-[#0083C7]">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-poppins text-2xl font-bold text-slate-900">
                {totalSpent.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Total investido nos últimos {periodDays} dias</p>
          </CardContent>
        </Card>

        {/* Impressões & Alcance */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Impressões
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
            <p className="mt-1 text-xs text-slate-500">Exibições no feed e stories</p>
          </CardContent>
        </Card>

        {/* Cliques & CTR */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Cliques no Link
              </span>
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <MousePointer className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-poppins text-2xl font-bold text-slate-900">
                {totalClicks.toLocaleString("pt-BR")}
              </span>
              {avgCtr > 0 && (
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 text-[10px]">
                  CTR {avgCtr.toFixed(1)}%
                </Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              CPC Médio: {avgCpc > 0 ? avgCpc.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "R$ 0,00"}
            </p>
          </CardContent>
        </Card>

        {/* Ações / Conversões */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Ações Principais
              </span>
              <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
                <MessageSquare className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-poppins text-2xl font-bold text-slate-900">
                {totalActions.toLocaleString("pt-BR")}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {costPerAction > 0
                ? `Custo/Ação: ${costPerAction.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`
                : "Cliques diretos em mensagens / CTA"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Campanhas da Meta */}
      <Card className="border border-slate-200 bg-white shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-slate-800">
                Campanhas Meta Ads ({campaigns.length})
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Desempenho individualizado de cada anúncio veiculado no Facebook e Instagram
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Megaphone className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="font-medium text-slate-700">Nenhuma campanha encontrada</p>
              <p className="mt-1 text-xs text-slate-500">
                Crie sua primeira campanha patrocinada na aba de Anúncios para começar a ver dados.
              </p>
              <Link href="/dashboard/anuncios">
                <Button size="sm" className="mt-4 bg-[#0083C7] text-white hover:bg-[#0070AA]">
                  Criar Campanha
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {campaigns.map((camp: any) => {
                const spent = Number(camp.metrics?.amountSpent) || Number(camp.metrics?.spent) || 0;
                const impressions = Number(camp.metrics?.impressions) || 0;
                const clicks = Number(camp.metrics?.clicks) || 0;
                const actions = Number(camp.metrics?.actions) || clicks;
                const budget = Number(camp.budget?.amount) || 0;
                const isActive = camp.status === "active";
                const isPaused = camp.status === "paused";

                return (
                  <div
                    key={camp.id || camp.metaCampaignId}
                    className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3.5">
                      {camp.creative?.imageUrl ? (
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                          <Image
                            src={camp.creative.imageUrl}
                            alt={camp.name || "Criativo"}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#0083C7]">
                          <Facebook className="h-6 w-6" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h5 className="font-poppins text-sm font-semibold text-slate-900 truncate max-w-xs sm:max-w-md">
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
                        </div>

                        {camp.targeting?.address && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            {camp.targeting.address} ({camp.targeting.radiusKm || 5}km)
                          </p>
                        )}

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
                            Gasto no período:{" "}
                            <strong className="text-slate-800">
                              {spent.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Métricas Rápidas */}
                    <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-3 sm:border-0 sm:pt-0 text-center sm:text-right">
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
                      <div>
                        <span className="text-[11px] font-medium uppercase text-slate-400">
                          Ações
                        </span>
                        <p className="font-semibold text-[#0083C7]">
                          {actions.toLocaleString("pt-BR")}
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
    </div>
  );
}
