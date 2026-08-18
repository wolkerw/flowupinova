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
  Smartphone,
  Monitor,
  Calendar,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface MetaAdsCampaignsViewerProps {
  campaigns: any[];
  breakdowns?: {
    platforms?: any[];
    devices?: any[];
  };
  isConnected: boolean;
  adAccountName?: string;
  pageName?: string;
  periodDays: string;
  onPeriodChange?: (newPeriod: string) => void;
}

export function MetaAdsCampaignsViewer({
  campaigns,
  breakdowns,
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
  const totalClicks = activeCampaigns.reduce(
    (acc, c) => acc + (Number(c.metrics?.clicks) || 0),
    0
  );

  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const avgCpc = totalClicks > 0 ? totalSpent / totalClicks : 0;

  // Processar dados reais de breakdown de plataforma (se retornados pela Meta)
  const platformList = breakdowns?.platforms || [];
  let instaImpressions = 0;
  let fbImpressions = 0;
  platformList.forEach((item: any) => {
    const imp = parseInt(item.impressions || "0");
    if (item.publisher_platform === "instagram") instaImpressions += imp;
    if (item.publisher_platform === "facebook") fbImpressions += imp;
  });
  const totalPlatformImp = instaImpressions + fbImpressions;
  const instaShare = totalPlatformImp > 0 ? Math.round((instaImpressions / totalPlatformImp) * 100) : 0;
  const fbShare = totalPlatformImp > 0 ? Math.round((fbImpressions / totalPlatformImp) * 100) : 0;

  // Processar dados reais de breakdown de dispositivo (se retornados pela Meta)
  const deviceList = breakdowns?.devices || [];
  let mobileImpressions = 0;
  let desktopImpressions = 0;
  deviceList.forEach((item: any) => {
    const imp = parseInt(item.impressions || "0");
    if (item.device_platform === "mobile") mobileImpressions += imp;
    if (item.device_platform === "desktop") desktopImpressions += imp;
  });
  const totalDeviceImp = mobileImpressions + desktopImpressions;
  const mobileShare = totalDeviceImp > 0 ? Math.round((mobileImpressions / totalDeviceImp) * 100) : 0;
  const desktopShare = totalDeviceImp > 0 ? Math.round((desktopImpressions / totalDeviceImp) * 100) : 0;

  // Função para identificar o objetivo e a métrica chave correspondente da campanha
  const getCampaignKeyMetric = (camp: any) => {
    const obj = (camp.objective || "").toUpperCase();
    const spent = Number(camp.metrics?.amountSpent) || Number(camp.metrics?.spent) || 0;
    const clicks = Number(camp.metrics?.clicks) || 0;
    const impressions = Number(camp.metrics?.impressions) || 0;
    const reach = Number(camp.metrics?.reach) || impressions;
    const cpm = Number(camp.metrics?.cpm) || (impressions > 0 ? (spent / impressions) * 1000 : 0);
    const cpc = Number(camp.metrics?.cpc) || (clicks > 0 ? spent / clicks : 0);

    const messages = Number(camp.metrics?.messagesCount) || 0;
    const leads = Number(camp.metrics?.leadsCount) || 0;
    const sales = Number(camp.metrics?.salesCount) || 0;
    const videoViews = Number(camp.metrics?.videoViewsCount) || 0;
    const postEngagement = Number(camp.metrics?.postEngagementCount) || 0;
    const appInstalls = Number(camp.metrics?.appInstallsCount) || 0;
    const linkClicks = Number(camp.metrics?.linkClicksCount) || clicks;

    // 1. TRÁFEGO (OUTCOME_TRAFFIC / LINK_CLICKS)
    if (obj.includes("TRAFFIC") || obj.includes("LINK_CLICK")) {
      const count = linkClicks > 0 ? linkClicks : clicks;
      const unitCost = count > 0 ? spent / count : cpc;
      return {
        label: "Cliques",
        value: count.toLocaleString("pt-BR"),
        subLabel: unitCost > 0 ? `CPC: ${unitCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}` : "Cliques no link",
        badge: "Tráfego",
      };
    }

    // 2. LEADS (OUTCOME_LEADS / LEAD_GENERATION)
    if (obj.includes("LEAD") || leads > 0) {
      const count = leads > 0 ? leads : Number(camp.metrics?.actions) || clicks;
      const unitCost = count > 0 ? spent / count : 0;
      return {
        label: "Leads",
        value: count.toLocaleString("pt-BR"),
        subLabel: unitCost > 0 ? `Custo/Lead: ${unitCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}` : "Cadastros gerados",
        badge: "Leads",
      };
    }

    // 3. VENDAS (OUTCOME_SALES / CONVERSIONS / PRODUCT_CATALOG_SALES)
    if (obj.includes("SALE") || obj.includes("PURCHASE") || obj.includes("CONVERSION") || sales > 0) {
      const count = sales > 0 ? sales : Number(camp.metrics?.actions) || clicks;
      const unitCost = count > 0 ? spent / count : 0;
      return {
        label: "Vendas",
        value: count.toLocaleString("pt-BR"),
        subLabel: unitCost > 0 ? `Custo/Venda: ${unitCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}` : "Vendas realizadas",
        badge: "Vendas",
      };
    }

    // 4. DOWNLOADS / APP PROMOTION (OUTCOME_APP_PROMOTION / APP_INSTALLS)
    if (obj.includes("APP") || appInstalls > 0) {
      const count = appInstalls > 0 ? appInstalls : Number(camp.metrics?.actions) || clicks;
      const unitCost = count > 0 ? spent / count : 0;
      return {
        label: "Downloads",
        value: count.toLocaleString("pt-BR"),
        subLabel: unitCost > 0 ? `Custo/Download: ${unitCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}` : "Instalações do app",
        badge: "Downloads",
      };
    }

    // 5. ALCANCE / RECONHECIMENTO (OUTCOME_AWARENESS / REACH / BRAND_AWARENESS)
    if (obj.includes("AWARENESS") || obj.includes("REACH") || obj.includes("BRAND")) {
      return {
        label: "Alcance",
        value: reach.toLocaleString("pt-BR"),
        subLabel: cpm > 0 ? `CPM: ${cpm.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}` : "Pessoas alcançadas",
        badge: "Alcance",
      };
    }

    // 6. ENGAJAMENTO (OUTCOME_ENGAGEMENT / POST_ENGAGEMENT / MESSAGES)
    // Se for mensagens (WhatsApp, Direct, Messenger)
    if (obj.includes("MESSAGE") || messages > 0) {
      const count = messages > 0 ? messages : Number(camp.metrics?.actions) || clicks;
      const unitCost = count > 0 ? spent / count : 0;
      return {
        label: "Mensagens",
        value: count.toLocaleString("pt-BR"),
        subLabel: unitCost > 0 ? `Custo/Mensagem: ${unitCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}` : "Conversas iniciadas",
        badge: "Mensagens",
      };
    }

    // Se for visualizações de vídeo
    if (obj.includes("VIDEO") || videoViews > 0) {
      const count = videoViews > 0 ? videoViews : Number(camp.metrics?.actions) || clicks;
      const unitCost = count > 0 ? spent / count : 0;
      return {
        label: "Visualizações",
        value: count.toLocaleString("pt-BR"),
        subLabel: unitCost > 0 ? `CPV: ${unitCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}` : "Visualizações do vídeo",
        badge: "Visualizações",
      };
    }

    // Interações gerais / engajamento com post
    const interactionCount = postEngagement > 0 ? postEngagement : Number(camp.metrics?.actions) || clicks;
    const unitCost = interactionCount > 0 ? spent / interactionCount : 0;
    return {
      label: "Interações",
      value: interactionCount.toLocaleString("pt-BR"),
      subLabel: unitCost > 0 ? `Custo/Interação: ${unitCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}` : "Curtidas e comentários",
      badge: "Interações",
    };
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

      {/* 3 Cards de Métricas Principais Consolidadas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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

        {/* Impressões */}
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
            <p className="mt-1 text-xs text-slate-500">Exibições no feed, reels e stories</p>
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
              CPC Médio: {avgCpc > 0 ? avgCpc.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "R$ 0,00"}
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
                Desempenho individualizado de cada anúncio de acordo com o seu objetivo específico
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
            <div className="divide-y divide-slate-100">
              {activeCampaigns.map((camp: any) => {
                const spent = Number(camp.metrics?.amountSpent) || Number(camp.metrics?.spent) || 0;
                const impressions = Number(camp.metrics?.impressions) || 0;
                const budget = Number(camp.budget?.amount) || 0;
                const isActive = camp.status === "active";
                const isPaused = camp.status === "paused";
                const keyMetric = getCampaignKeyMetric(camp);

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
                          <Badge variant="outline" className="text-[10px] font-medium text-blue-700 bg-blue-50 border-blue-200">
                            {keyMetric.badge}
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

                    {/* Métricas Dinâmicas Conforme o Objetivo */}
                    <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3 sm:border-0 sm:pt-0 text-center sm:text-right min-w-[180px]">
                      <div>
                        <span className="text-[11px] font-medium uppercase text-slate-400">
                          Impressões
                        </span>
                        <p className="font-semibold text-slate-800">
                          {impressions.toLocaleString("pt-BR")}
                        </p>
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold uppercase text-[#0083C7]">
                          {keyMetric.label}
                        </span>
                        <p className="font-poppins text-base font-bold text-[#0083C7]">
                          {keyMetric.value}
                        </p>
                        <span className="block text-[10px] text-slate-500">
                          {keyMetric.subLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Breakdowns Reais da API da Meta (se retornados) */}
      {totalPlatformImp > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Plataforma */}
          <Card className="border border-slate-200 bg-white shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Instagram className="h-4 w-4 text-pink-600" />
                Exibição por Plataforma (Dados Reais Meta)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Distribuição real de impressões apuradas pela Meta no período
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-1">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <Instagram className="h-3.5 w-3.5 text-pink-600" />
                    Instagram
                  </span>
                  <span className="font-semibold text-slate-900">{instaShare}% ({instaImpressions.toLocaleString("pt-BR")} imp)</span>
                </div>
                <Progress value={instaShare} className="h-2 bg-slate-100" />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <Facebook className="h-3.5 w-3.5 text-[#1877F2]" />
                    Facebook
                  </span>
                  <span className="font-semibold text-slate-900">{fbShare}% ({fbImpressions.toLocaleString("pt-BR")} imp)</span>
                </div>
                <Progress value={fbShare} className="h-2 bg-slate-100" />
              </div>
            </CardContent>
          </Card>

          {/* Dispositivos */}
          {totalDeviceImp > 0 && (
            <Card className="border border-slate-200 bg-white shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Smartphone className="h-4 w-4 text-emerald-600" />
                  Dispositivos de Acesso (Dados Reais Meta)
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Aparelhos onde os usuários visualizaram seus anúncios
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-1">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="flex items-center gap-1.5 text-slate-700">
                      <Smartphone className="h-3.5 w-3.5 text-slate-600" />
                      Mobile (Smartphones)
                    </span>
                    <span className="font-semibold text-slate-900">{mobileShare}% ({mobileImpressions.toLocaleString("pt-BR")} imp)</span>
                  </div>
                  <Progress value={mobileShare} className="h-2 bg-slate-100" />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="flex items-center gap-1.5 text-slate-700">
                      <Monitor className="h-3.5 w-3.5 text-slate-600" />
                      Desktop (Computadores)
                    </span>
                    <span className="font-semibold text-slate-900">{desktopShare}% ({desktopImpressions.toLocaleString("pt-BR")} imp)</span>
                  </div>
                  <Progress value={desktopShare} className="h-2 bg-slate-100" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
