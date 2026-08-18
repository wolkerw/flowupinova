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
  Layers,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Key,
  Globe,
  Smartphone,
  Monitor,
  Video,
  Sparkles,
  PhoneCall,
  Flame,
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
  const [expandedCampaigns, setExpandedCampaigns] = React.useState<Record<string, boolean>>({});

  const toggleExpand = (campId: string) => {
    setExpandedCampaigns((prev) => ({
      ...prev,
      [campId]: !prev[campId],
    }));
  };

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

  const getChannelLabel = (channel: string, name?: string) => {
    const c = (channel || "").toUpperCase();
    const n = (name || "").toLowerCase();
    if (
      c.includes("VIDEO") ||
      c.includes("YOUTUBE") ||
      n.includes("youtube") ||
      n.includes("video") ||
      n.includes("vídeo") ||
      n.includes("yt -") ||
      n.includes("yt_")
    ) {
      return { label: "YouTube Ads", icon: Video, color: "text-red-700 bg-red-50 border-red-200" };
    }
    if (c.includes("PERFORMANCE_MAX")) return { label: "Performance Max", icon: Sparkles, color: "text-purple-700 bg-purple-50 border-purple-200" };
    if (c.includes("DISPLAY")) return { label: "Rede de Display", icon: Globe, color: "text-amber-700 bg-amber-50 border-amber-200" };
    if (c.includes("SHOPPING")) return { label: "Shopping", icon: Target, color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    return { label: "Rede de Pesquisa", icon: Search, color: "text-blue-700 bg-blue-50 border-blue-200" };
  };

  const getCampaignKeyMetric = (camp: any) => {
    const channelType = (camp.channelType || "").toUpperCase();
    const campName = (camp.name || "").toLowerCase();
    const isVideoChannel =
      channelType.includes("VIDEO") ||
      channelType.includes("YOUTUBE") ||
      campName.includes("youtube") ||
      campName.includes("video") ||
      campName.includes("vídeo") ||
      campName.includes("yt -") ||
      campName.includes("yt_");

    const spent = Number(camp.metrics?.amountSpent) || Number(camp.metrics?.spent) || 0;
    const clicks = Number(camp.metrics?.clicks) || 0;
    const impressions = Number(camp.metrics?.impressions) || 0;
    const conversions = Number(camp.metrics?.conversions) || 0;
    const costPerConv = Number(camp.metrics?.costPerConversion) || (conversions > 0 ? spent / conversions : 0);
    const cpc = Number(camp.metrics?.averageCpc) || (clicks > 0 ? spent / clicks : 0);
    const videoViews = Number(camp.metrics?.videoViews) || 0;
    const avgCpv = Number(camp.metrics?.averageCpv) || (videoViews > 0 ? spent / videoViews : 0);

    // 1. YouTube / Vídeo
    if (isVideoChannel) {
      const views = videoViews > 0 ? videoViews : impressions;
      return {
        label: "Visualizações",
        value: views.toLocaleString("pt-BR"),
        subLabel: avgCpv > 0 ? `CPV Médio: ${avgCpv.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}` : "Visualizações no YouTube",
        badge: "YouTube Ads",
      };
    }

    // 2. Conversões (se registradas)
    if (conversions > 0) {
      return {
        label: "Conversões",
        value: conversions.toLocaleString("pt-BR"),
        subLabel: costPerConv > 0 ? `Custo/Conv: ${costPerConv.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}` : "Ações de valor",
        badge: "Conversões",
      };
    }

    // 3. Rede de Pesquisa / PMax (Cliques)
    return {
      label: channelType.includes("SEARCH") ? "Cliques na Busca" : "Cliques",
      value: clicks.toLocaleString("pt-BR"),
      subLabel: cpc > 0 ? `CPC Médio: ${cpc.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}` : "Cliques nos anúncios",
      badge: "Cliques",
    };
  };

  // Consolidar palavras-chave das campanhas de pesquisa para a seção inferior dedicada
  const allKeywords = activeCampaigns
    .flatMap((c) => (c.keywords || []).map((k: any) => ({ ...k, campaignName: c.name })))
    .filter((kw) => (Number(kw.clicks) || 0) > 0 || (Number(kw.impressions) || 0) > 0 || (Number(kw.amountSpent) || Number(kw.spent) || 0) > 0)
    .sort((a, b) => (Number(b.clicks) || 0) - (Number(a.clicks) || 0));

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

      {/* 3 Cards de Métricas Principais Consolidadas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
            <p className="mt-1 text-xs text-slate-500">Total de exibições no período</p>
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
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Custo por Clique: {avgCpc > 0 ? avgCpc.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "R$ 0,00"}
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
                Campanhas que geraram cliques ou impressões nos últimos {periodDays} dias
              </CardDescription>
            </div>

            {/* Filtro de data sincronizado */}
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
                const campUniqueId = String(camp.id);
                const spent = Number(camp.metrics?.amountSpent) || Number(camp.metrics?.spent) || 0;
                const impressions = Number(camp.metrics?.impressions) || 0;
                const budget = Number(camp.budgetAmount) || 0;
                const isActive = camp.status === "active";
                const isPaused = camp.status === "paused";
                const keyMetric = getCampaignKeyMetric(camp);
                const isExpanded = !!expandedCampaigns[campUniqueId];
                const isVideoChannel =
                  (camp.channelType || "").toUpperCase().includes("VIDEO") ||
                  (camp.channelType || "").toUpperCase().includes("YOUTUBE") ||
                  (camp.name || "").toLowerCase().includes("youtube") ||
                  (camp.name || "").toLowerCase().includes("video") ||
                  (camp.name || "").toLowerCase().includes("vídeo") ||
                  (camp.name || "").toLowerCase().includes("yt -") ||
                  (camp.name || "").toLowerCase().includes("yt_");
                const isSearchChannel = !isVideoChannel && (camp.channelType || "").toUpperCase().includes("SEARCH");
                const isPMaxChannel = !isVideoChannel && (camp.channelType || "").toUpperCase().includes("PERFORMANCE_MAX");
                const channel = getChannelLabel(camp.channelType, camp.name);
                const ChannelIcon = channel.icon;

                // Filtrar anúncios ativos e ordenar pelos que mais geraram cliques/conversões/views
                const rawAds: any[] = camp.ads && camp.ads.length > 0 ? camp.ads : [{
                  id: `local-${campUniqueId}`,
                  name: camp.name || "Anúncio Principal",
                  status: camp.status || "active",
                  type: isVideoChannel ? "VIDEO_AD" : isSearchChannel ? "RESPONSIVE_SEARCH_AD" : "RESPONSIVE_DISPLAY_AD",
                  headlines: [camp.name],
                  descriptions: [],
                  finalUrls: [],
                  metrics: camp.metrics,
                }];

                const activeAds = rawAds
                  .filter((a: any) => (a.status || "").toLowerCase() === "active")
                  .sort((a: any, b: any) => {
                    if (isVideoChannel) {
                      const viewsDiff = (Number(b.metrics?.videoViews) || 0) - (Number(a.metrics?.videoViews) || 0);
                      if (viewsDiff !== 0) return viewsDiff;
                    }
                    const convDiff = (Number(b.metrics?.conversions) || 0) - (Number(a.metrics?.conversions) || 0);
                    if (convDiff !== 0) return convDiff;
                    const clicksDiff = (Number(b.metrics?.clicks) || 0) - (Number(a.metrics?.clicks) || 0);
                    if (clicksDiff !== 0) return clicksDiff;
                    return (Number(b.metrics?.impressions) || 0) - (Number(a.metrics?.impressions) || 0);
                  });

                return (
                  <div key={campUniqueId} className="py-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3.5">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#EA4335]">
                          <ChannelIcon className="h-6 w-6" />
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
                            <Badge variant="outline" className={`text-[10px] font-medium ${channel.color}`}>
                              {channel.label}
                            </Badge>
                          </div>

                          <div className="mt-1.5 flex flex-wrap items-center gap-3">
                            {budget > 0 && (
                              <div className="flex items-center text-xs text-slate-500">
                                <span>
                                  Orçamento:{" "}
                                  <strong className="text-slate-700">
                                    {budget.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                    /dia
                                  </strong>
                                </span>
                              </div>
                            )}

                            {/* Botão de Ver Anúncios Ativos */}
                            {activeAds.length > 0 && (
                              <button
                                type="button"
                                onClick={() => toggleExpand(campUniqueId)}
                                className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50/70 px-2 py-0.5 text-[11px] font-semibold text-[#EA4335] hover:bg-red-100 hover:border-red-300 transition-all cursor-pointer"
                              >
                                <Layers className="h-3 w-3 text-[#EA4335]" />
                                <span>
                                  {isExpanded
                                    ? "Ocultar anúncios"
                                    : `Ver anúncios ativos (${activeAds.length})`}
                                </span>
                                {isExpanded ? (
                                  <ChevronUp className="h-3 w-3 text-[#EA4335]" />
                                ) : (
                                  <ChevronDown className="h-3 w-3 text-[#EA4335]" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Métricas em Colunas Alinhadas */}
                      <div className="flex flex-wrap items-center justify-between sm:justify-end gap-5 border-t border-slate-100 pt-3 sm:border-0 sm:pt-0 text-center sm:text-right">
                        {/* 1. Investimento */}
                        <div className="min-w-[80px]">
                          <span className="text-[11px] font-semibold uppercase text-slate-400">
                            Investimento
                          </span>
                          <p className="font-poppins text-sm font-bold text-slate-800">
                            {spent.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </p>
                        </div>

                        {/* 2. Impressões */}
                        <div className="min-w-[80px]">
                          <span className="text-[11px] font-semibold uppercase text-slate-400">
                            Impressões
                          </span>
                          <p className="font-poppins text-sm font-bold text-slate-800">
                            {impressions.toLocaleString("pt-BR")}
                          </p>
                        </div>

                        {/* 3. Cliques */}
                        <div className="min-w-[70px]">
                          <span className="text-[11px] font-semibold uppercase text-slate-400">
                            Cliques
                          </span>
                          <p className="font-poppins text-sm font-bold text-slate-800">
                            {Number(camp.metrics?.clicks || 0).toLocaleString("pt-BR")}
                          </p>
                        </div>

                        {/* 4. Métrica Principal */}
                        <div className="min-w-[100px]">
                          <span className="text-[11px] font-bold uppercase text-[#EA4335]">
                            {keyMetric.label}
                          </span>
                          <p className="font-poppins text-base font-bold text-[#EA4335]">
                            {keyMetric.value}
                          </p>
                          <span className="block text-[10px] text-slate-500">
                            {keyMetric.subLabel}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Gaveta Expansível EXCLUSIVA de Anúncios Ativos */}
                    {isExpanded && activeAds.length > 0 && (
                      <div className="mt-4 space-y-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5 transition-all">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-200/80">
                          <Layers className="h-4 w-4 text-[#EA4335]" />
                          <h6 className="font-poppins text-xs font-bold uppercase tracking-wider text-slate-800">
                            Anúncios Ativos ({activeAds.length})
                          </h6>
                        </div>

                        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                          {activeAds.map((ad: any, idx: number) => {
                            const adSpent = Number(ad.metrics?.amountSpent) || Number(ad.metrics?.spent) || 0;
                            const adImpressions = Number(ad.metrics?.impressions) || 0;
                            const adClicks = Number(ad.metrics?.clicks) || 0;
                            const adCtr = Number(ad.metrics?.ctr) || 0;
                            const adConversions = Number(ad.metrics?.conversions) || 0;
                            const adVideoViews = Number(ad.metrics?.videoViews) || 0;
                            const adCpv = Number(ad.metrics?.averageCpv) || (adVideoViews > 0 ? adSpent / adVideoViews : 0);

                            const headlines = ad.headlines || [];
                            const descriptions = ad.descriptions || [];
                            const finalUrl = ad.finalUrls?.[0] || "";
                            let displayDomain = "seusite.com.br";
                            try {
                              if (finalUrl) {
                                const parsed = new URL(finalUrl);
                                displayDomain = parsed.hostname.replace(/^www\./, "");
                              }
                            } catch (e) {}

                            const isThisAdVideo =
                              isVideoChannel ||
                              (ad.type || "").toUpperCase().includes("VIDEO") ||
                              (ad.type || "").toUpperCase().includes("YOUTUBE") ||
                              (ad.name || "").toLowerCase().includes("video") ||
                              (ad.name || "").toLowerCase().includes("vídeo") ||
                              (ad.name || "").toLowerCase().includes("youtube");

                            // RENDERIZADOR A: YOUTUBE / VÍDEO
                            if (isThisAdVideo) {
                              return (
                                <div
                                  key={ad.id || idx}
                                  className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs transition-shadow hover:shadow-md"
                                >
                                  <div className="p-4 space-y-3 bg-white border-b border-slate-100 flex-1">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-red-600 text-white font-bold text-[10px]">
                                          ▶
                                        </div>
                                        <span className="text-xs font-semibold text-slate-800">
                                          YouTube Video Ad
                                        </span>
                                      </div>
                                      <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-700 border border-red-200">
                                        Vídeo
                                      </span>
                                    </div>

                                    <div className="relative aspect-video w-full rounded-lg bg-slate-900 flex flex-col items-center justify-center text-white overflow-hidden shadow-inner">
                                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600/90 text-white shadow-lg transition-transform hover:scale-110">
                                        <Video className="h-6 w-6" />
                                      </div>
                                      <span className="mt-2 text-xs font-medium text-slate-300">
                                        {ad.name || camp.name || "Vídeo Publicitário"}
                                      </span>
                                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] text-slate-400">
                                        <span>▶ 0:00 / HD</span>
                                        <span className="rounded bg-black/60 px-1 py-0.5">In-Stream / In-Feed</span>
                                      </div>
                                    </div>

                                    <div>
                                      <h4 className="font-poppins text-sm font-semibold text-slate-900 leading-snug">
                                        {headlines.length > 0 ? headlines.join(" | ") : ad.name || camp.name}
                                      </h4>
                                      <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                                        {descriptions.length > 0
                                          ? descriptions.join(" ")
                                          : "Campanha em vídeo veiculada no YouTube para alcance e engajamento com a marca."}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="bg-slate-50/80 p-3">
                                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                                      <div>
                                        <span className="text-[10px] uppercase font-semibold text-slate-400">Gasto</span>
                                        <p className="font-poppins font-bold text-slate-800 text-[11px]">
                                          {adSpent.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                        </p>
                                      </div>
                                      <div>
                                        <span className="text-[10px] uppercase font-semibold text-slate-400">Impressões</span>
                                        <p className="font-poppins font-bold text-slate-800 text-[11px]">
                                          {adImpressions.toLocaleString("pt-BR")}
                                        </p>
                                      </div>
                                      <div>
                                        <span className="text-[10px] uppercase font-semibold text-red-600">Views</span>
                                        <p className="font-poppins font-bold text-red-600 text-[11px]">
                                          {(adVideoViews > 0 ? adVideoViews : adImpressions).toLocaleString("pt-BR")}
                                        </p>
                                      </div>
                                      <div>
                                        <span className="text-[10px] uppercase font-semibold text-slate-600">CPV Médio</span>
                                        <p className="font-poppins font-bold text-slate-700 text-[11px]">
                                          {adCpv > 0 ? adCpv.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—"}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            }

                            // RENDERIZADOR B: PERFORMANCE MAX
                            if (isPMaxChannel) {
                              return (
                                <div
                                  key={ad.id || idx}
                                  className="flex flex-col overflow-hidden rounded-xl border border-purple-200 bg-white shadow-xs transition-shadow hover:shadow-md"
                                >
                                  <div className="p-4 space-y-2.5 bg-white border-b border-purple-100 flex-1">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-purple-600" />
                                        <span className="text-xs font-semibold text-purple-900">
                                          Grupo de Recursos PMax
                                        </span>
                                      </div>
                                      <span className="rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-purple-700 border border-purple-200">
                                        Multi-Canal
                                      </span>
                                    </div>

                                    <h4 className="font-poppins text-sm font-semibold text-slate-900">
                                      {headlines.length > 0 ? headlines.join(" | ") : ad.name || camp.name}
                                    </h4>
                                    <p className="text-xs text-slate-600">
                                      {descriptions.length > 0 ? descriptions.join(" ") : "Recursos inteligentes distribuídos automaticamente entre Pesquisa, YouTube, Display, Maps e Gmail."}
                                    </p>

                                    <div className="pt-1 flex flex-wrap gap-1.5">
                                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">🔍 Pesquisa</span>
                                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">▶️ YouTube</span>
                                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">🖼️ Display</span>
                                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">📍 Maps</span>
                                    </div>
                                  </div>

                                  <div className="bg-purple-50/50 p-3">
                                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                                      <div>
                                        <span className="text-[10px] uppercase font-semibold text-slate-400">Gasto</span>
                                        <p className="font-poppins font-bold text-slate-800 text-[11px]">
                                          {adSpent.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                        </p>
                                      </div>
                                      <div>
                                        <span className="text-[10px] uppercase font-semibold text-slate-400">Impressões</span>
                                        <p className="font-poppins font-bold text-slate-800 text-[11px]">
                                          {adImpressions.toLocaleString("pt-BR")}
                                        </p>
                                      </div>
                                      <div>
                                        <span className="text-[10px] uppercase font-semibold text-purple-700">Cliques</span>
                                        <p className="font-poppins font-bold text-purple-700 text-[11px]">
                                          {adClicks.toLocaleString("pt-BR")}
                                        </p>
                                      </div>
                                      <div>
                                        <span className="text-[10px] uppercase font-semibold text-emerald-600">Conv.</span>
                                        <p className="font-poppins font-bold text-emerald-600 text-[11px]">
                                          {adConversions.toLocaleString("pt-BR")}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            }

                            // RENDERIZADOR C: REDE DE PESQUISA (GOOGLE SEARCH SERP MOCKUP)
                            return (
                              <div
                                key={ad.id || idx}
                                className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs transition-shadow hover:shadow-md"
                              >
                                <div className="p-4 space-y-2.5 bg-white border-b border-slate-100 flex-1">
                                  {/* Header Google: Favicon + URL + Patrocinado */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs min-w-0">
                                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600">
                                        G
                                      </div>
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-1.5 text-[11px] text-slate-700 truncate">
                                          <span className="font-semibold">{displayDomain}</span>
                                          {pathString && <span className="text-slate-400">› {pathString}</span>}
                                        </div>
                                      </div>
                                    </div>
                                    <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-700 border border-slate-200">
                                      Patrocinado
                                    </span>
                                  </div>

                                  {/* Título em Azul Google (#1a0dab) */}
                                  <div>
                                    <h4 className="font-poppins text-sm sm:text-base font-semibold text-[#1a0dab] leading-snug hover:underline cursor-pointer">
                                      {headlines.length > 0
                                        ? headlines.slice(0, 3).join(" | ")
                                        : ad.name || camp.name || "Anúncio na Rede de Pesquisa Google"}
                                    </h4>
                                  </div>

                                  {/* Descrição em Cinza Escuro Google (#4d5156) */}
                                  <p className="text-xs text-[#4d5156] leading-relaxed">
                                    {descriptions.length > 0
                                      ? descriptions.join(" ")
                                      : "Atendimento ágil, serviços especializados e suporte completo. Clique e fale com nossos especialistas agora mesmo."}
                                  </p>

                                  {/* Sitelinks / Extensões Rápidas de Ação */}
                                  <div className="pt-2 flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center gap-1 rounded-md bg-blue-50/70 border border-blue-200 px-2 py-0.5 text-[11px] font-semibold text-[#1a0dab]">
                                      <PhoneCall className="h-3 w-3" />
                                      Ligar / WhatsApp
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                                      🎯 Fazer Orçamento
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                                      📍 Localização
                                    </span>
                                  </div>
                                </div>

                                {/* Barra de Métricas Individuais deste Anúncio */}
                                <div className="bg-slate-50/80 p-3">
                                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                                    <div>
                                      <span className="text-[10px] uppercase font-semibold text-slate-400">Gasto</span>
                                      <p className="font-poppins font-bold text-slate-800 text-[11px]">
                                        {adSpent.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-[10px] uppercase font-semibold text-slate-400">Impressões</span>
                                      <p className="font-poppins font-bold text-slate-800 text-[11px]">
                                        {adImpressions.toLocaleString("pt-BR")}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-[10px] uppercase font-semibold text-[#EA4335]">Cliques</span>
                                      <p className="font-poppins font-bold text-[#EA4335] text-[11px]">
                                        {adClicks.toLocaleString("pt-BR")}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-[10px] uppercase font-semibold text-emerald-600">
                                        {adConversions > 0 ? "Conv." : "CTR"}
                                      </span>
                                      <p className="font-poppins font-bold text-emerald-600 text-[11px]">
                                        {adConversions > 0 ? adConversions.toLocaleString("pt-BR") : `${adCtr.toFixed(1)}%`}
                                      </p>
                                    </div>
                                  </div>

                                  {finalUrl && (
                                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex justify-center">
                                      <a
                                        href={finalUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#EA4335] hover:underline"
                                      >
                                        <ExternalLink className="h-3 w-3" />
                                        Visitar página de destino
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SEÇÃO INFERIOR DEDICADA: TOP PALAVRAS-CHAVE DE PESQUISA (ORGANIZADA & LIMPA) */}
      {allKeywords.length > 0 && (
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-[#EA4335]">
                <Key className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-slate-900">
                  Top Palavras-Chave de Pesquisa
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Termos mais buscados e acionados que geraram tráfego no Google
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] uppercase font-semibold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Palavra-Chave</th>
                    <th className="px-4 py-3 text-right">Investimento</th>
                    <th className="px-4 py-3 text-right">Impressões</th>
                    <th className="px-4 py-3 text-right">Cliques</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allKeywords.slice(0, 15).map((kw: any, idx: number) => {
                    const kwSpent = Number(kw.amountSpent) || Number(kw.spent) || 0;
                    const kwImpressions = Number(kw.impressions) || 0;
                    const kwClicks = Number(kw.clicks) || 0;

                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          <div className="flex items-center gap-2">
                            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="font-semibold text-slate-800">{kw.text}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900">
                          {kwSpent.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600">
                          {kwImpressions.toLocaleString("pt-BR")}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-[#EA4335]">
                          {kwClicks.toLocaleString("pt-BR")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
