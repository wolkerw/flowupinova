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
  ChevronDown,
  ChevronUp,
  Search,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface MetaAdsCampaignsViewerProps {
  campaigns: any[];
  breakdowns?: {
    platforms?: any[];
    devices?: any[];
    ageGender?: any[];
    placements?: any[];
    regions?: any[];
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

  // Processar dados reais de Público (Idade e Gênero)
  const ageGenderList = breakdowns?.ageGender || [];
  let femaleImpressions = 0;
  let maleImpressions = 0;
  const ageMap = new Map<string, number>();

  ageGenderList.forEach((item: any) => {
    const imp = parseInt(item.impressions || "0");
    const gender = (item.gender || "").toLowerCase();
    const age = item.age || "Outros";

    if (gender === "female") femaleImpressions += imp;
    if (gender === "male") maleImpressions += imp;

    ageMap.set(age, (ageMap.get(age) || 0) + imp);
  });

  const totalGenderImp = femaleImpressions + maleImpressions;
  const femaleShare = totalGenderImp > 0 ? Math.round((femaleImpressions / totalGenderImp) * 100) : 0;
  const maleShare = totalGenderImp > 0 ? Math.round((maleImpressions / totalGenderImp) * 100) : 0;

  const totalAgeImp = Array.from(ageMap.values()).reduce((a, b) => a + b, 0);
  const standardAgeBrackets = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"];
  const ageDistribution = standardAgeBrackets
    .map((age) => {
      const imp = ageMap.get(age) || 0;
      const share = totalAgeImp > 0 ? Math.round((imp / totalAgeImp) * 100) : 0;
      return { age, imp, share };
    })
    .filter((a) => a.imp > 0);

  // Processar dados reais de Posicionamentos (Feed, Stories, Reels)
  const placementList = breakdowns?.placements || [];
  let feedImpressions = 0;
  let storyImpressions = 0;
  let reelsImpressions = 0;
  let otherPlacementImpressions = 0;

  placementList.forEach((item: any) => {
    const imp = parseInt(item.impressions || "0");
    const pos = (item.platform_position || "").toLowerCase();
    if (pos.includes("feed")) feedImpressions += imp;
    else if (pos.includes("story") || pos.includes("stories")) storyImpressions += imp;
    else if (pos.includes("reels") || pos.includes("reel")) reelsImpressions += imp;
    else otherPlacementImpressions += imp;
  });

  const totalPlacementImp = feedImpressions + storyImpressions + reelsImpressions + otherPlacementImpressions;
  const feedShare = totalPlacementImp > 0 ? Math.round((feedImpressions / totalPlacementImp) * 100) : 0;
  const storyShare = totalPlacementImp > 0 ? Math.round((storyImpressions / totalPlacementImp) * 100) : 0;
  const reelsShare = totalPlacementImp > 0 ? Math.round((reelsImpressions / totalPlacementImp) * 100) : 0;

  // Processar dados reais de Regiões / Estados
  const regionList = breakdowns?.regions || [];
  const regionMap = new Map<string, { impressions: number; clicks: number }>();
  regionList.forEach((item: any) => {
    const name = item.region || "Outros";
    const imp = parseInt(item.impressions || "0");
    const clicks = parseInt(item.clicks || "0");
    const current = regionMap.get(name) || { impressions: 0, clicks: 0 };
    regionMap.set(name, {
      impressions: current.impressions + imp,
      clicks: current.clicks + clicks,
    });
  });

  const topRegions = Array.from(regionMap.entries())
    .map(([region, data]) => ({ region, ...data }))
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 4);
  const totalRegionImp = topRegions.reduce((acc, r) => acc + r.impressions, 0);

  // Função para identificar o objetivo e a métrica chave correspondente da campanha 100% via API da Meta
  const getCampaignKeyMetric = (camp: any) => {
    const obj = (camp.objective || "").toUpperCase();
    const dest = (camp.destinationType || "").toUpperCase();
    const goal = (camp.optimizationGoal || "").toUpperCase();

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

    // 1. MENSAGENS (WhatsApp / Messenger / Direct / Meta ODAX com destino em Mensagem)
    const isMessaging =
      dest.includes("WHATSAPP") ||
      dest.includes("MESSENGER") ||
      dest.includes("INSTAGRAM_DIRECT") ||
      dest.includes("MESSAGING") ||
      goal.includes("CONVERSATION") ||
      goal.includes("MESSAGING") ||
      obj.includes("MESSAGE") ||
      messages > 0;

    if (isMessaging) {
      const count = messages > 0 ? messages : Number(camp.metrics?.actions) || clicks;
      const unitCost = count > 0 ? spent / count : 0;
      return {
        label: "Mensagens",
        value: count.toLocaleString("pt-BR"),
        subLabel: unitCost > 0 ? `Custo/Mensagem: ${unitCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}` : "Conversas iniciadas",
        badge: "Mensagens",
      };
    }

    // 2. LEADS (Formulários instantâneos / Geração de cadastros nativa da Meta)
    const isLeads =
      goal.includes("LEAD") ||
      dest.includes("ON_AD") ||
      obj.includes("LEAD") ||
      leads > 0;

    if (isLeads) {
      const count = leads > 0 ? leads : Number(camp.metrics?.actions) || clicks;
      const unitCost = count > 0 ? spent / count : 0;
      return {
        label: "Leads",
        value: count.toLocaleString("pt-BR"),
        subLabel: unitCost > 0 ? `Custo/Lead: ${unitCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}` : "Cadastros gerados",
        badge: "Leads",
      };
    }

    // 3. VENDAS (E-commerce / Catálogo / Conversões no site)
    const isSales =
      goal.includes("OFFSITE_CONVERSIONS") ||
      goal.includes("PURCHASE") ||
      goal.includes("VALUE") ||
      obj.includes("SALE") ||
      obj.includes("PURCHASE") ||
      obj.includes("CONVERSION") ||
      sales > 0;

    if (isSales) {
      const count = sales > 0 ? sales : Number(camp.metrics?.actions) || clicks;
      const unitCost = count > 0 ? spent / count : 0;
      return {
        label: "Vendas",
        value: count.toLocaleString("pt-BR"),
        subLabel: unitCost > 0 ? `Custo/Venda: ${unitCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}` : "Vendas realizadas",
        badge: "Vendas",
      };
    }

    // 4. DOWNLOADS / APP PROMOTION
    const isApp =
      goal.includes("APP_INSTALL") ||
      dest.includes("APP") ||
      obj.includes("APP") ||
      appInstalls > 0;

    if (isApp) {
      const count = appInstalls > 0 ? appInstalls : Number(camp.metrics?.actions) || clicks;
      const unitCost = count > 0 ? spent / count : 0;
      return {
        label: "Downloads",
        value: count.toLocaleString("pt-BR"),
        subLabel: unitCost > 0 ? `Custo/Download: ${unitCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}` : "Instalações do app",
        badge: "Downloads",
      };
    }

    // 5. TRÁFEGO (Cliques no link / Visitas à página de destino)
    const isTraffic =
      goal.includes("LINK_CLICK") ||
      goal.includes("LANDING_PAGE_VIEW") ||
      obj.includes("TRAFFIC") ||
      obj.includes("LINK_CLICK");

    if (isTraffic) {
      const count = linkClicks > 0 ? linkClicks : clicks;
      const unitCost = count > 0 ? spent / count : cpc;
      return {
        label: "Cliques",
        value: count.toLocaleString("pt-BR"),
        subLabel: unitCost > 0 ? `CPC: ${unitCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}` : "Cliques no link",
        badge: "Tráfego",
      };
    }

    // 6. ALCANCE / RECONHECIMENTO (Pessoas únicas alcançadas / Impressões)
    const isAwareness =
      goal.includes("REACH") ||
      goal.includes("IMPRESSION") ||
      obj.includes("AWARENESS") ||
      obj.includes("REACH") ||
      obj.includes("BRAND");

    if (isAwareness) {
      return {
        label: "Alcance",
        value: reach.toLocaleString("pt-BR"),
        subLabel: cpm > 0 ? `CPM: ${cpm.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}` : "Pessoas alcançadas",
        badge: "Alcance",
      };
    }

    // 7. VISUALIZAÇÕES DE VÍDEO (ThruPlay / Video Views)
    const isVideo =
      goal.includes("THRUPLAY") ||
      goal.includes("VIDEO") ||
      obj.includes("VIDEO") ||
      videoViews > 0;

    if (isVideo) {
      const count = videoViews > 0 ? videoViews : Number(camp.metrics?.actions) || clicks;
      const unitCost = count > 0 ? spent / count : 0;
      return {
        label: "Visualizações",
        value: count.toLocaleString("pt-BR"),
        subLabel: unitCost > 0 ? `CPV: ${unitCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}` : "Visualizações do vídeo",
        badge: "Visualizações",
      };
    }

    // 8. INTERAÇÕES GERAIS / ENGAJAMENTO (Post Engagement)
    const interactionCount = postEngagement > 0 ? postEngagement : Number(camp.metrics?.actions) || clicks;
    const unitCost = interactionCount > 0 ? spent / interactionCount : 0;
    return {
      label: "Interações",
      value: interactionCount.toLocaleString("pt-BR"),
      subLabel: unitCost > 0 ? `Custo/Interação: ${unitCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}` : "Curtidas e comentários",
      badge: "Interações",
    };
  };

  const [expandedCampaigns, setExpandedCampaigns] = React.useState<Record<string, boolean>>({});

  const toggleExpand = (campId: string) => {
    setExpandedCampaigns((prev) => ({
      ...prev,
      [campId]: !prev[campId],
    }));
  };

  const getCtaLabel = (ctaType: string) => {
    const c = (ctaType || "").toUpperCase();
    if (c.includes("MESSAGE") || c.includes("WHATSAPP")) return "💬 Enviar mensagem no WhatsApp";
    if (c.includes("LEARN_MORE")) return "🎯 Saiba mais";
    if (c.includes("SIGN_UP") || c.includes("SUBSCRIBE")) return "📋 Cadastre-se";
    if (c.includes("SHOP_NOW") || c.includes("ORDER_NOW") || c.includes("BUY")) return "🛒 Comprar agora";
    if (c.includes("CONTACT_US")) return "📞 Fale conosco";
    if (c.includes("DOWNLOAD") || c.includes("INSTALL")) return "📲 Baixar app";
    if (c.includes("GET_OFFER") || c.includes("GET_QUOTE")) return "🏷️ Obter oferta";
    return "🎯 Saiba mais";
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
            <p className="mt-1 text-xs text-slate-500">Total de exibições no período</p>
          </CardContent>
        </Card>

        {/* Cliques */}
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
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Custo por Clique: {avgCpc > 0 ? avgCpc.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "R$ 0,00"}
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
              <Search className="mx-auto mb-3 h-10 w-10 text-slate-300" />
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
                const campUniqueId = camp.id || camp.metaCampaignId;
                const spent = Number(camp.metrics?.amountSpent) || Number(camp.metrics?.spent) || 0;
                const impressions = Number(camp.metrics?.impressions) || 0;
                const budget = Number(camp.budget?.amount) || 0;
                const isActive = camp.status === "active";
                const isPaused = camp.status === "paused";
                const keyMetric = getCampaignKeyMetric(camp);
                const isExpanded = !!expandedCampaigns[campUniqueId];

                // Filtrar ESTRITAMENTE anúncios ATIVOS da campanha
                const rawAds: any[] = camp.ads && camp.ads.length > 0 ? camp.ads : (camp.creative?.imageUrl ? [{
                  id: `local-${campUniqueId}`,
                  name: camp.name,
                  status: camp.status || "active",
                  imageUrl: camp.creative.imageUrl,
                  title: camp.name,
                  body: "",
                  callToActionType: camp.creative.ctaType,
                  metrics: camp.metrics,
                }] : []);
                const activeAds = rawAds.filter((a: any) => (a.status || "").toLowerCase() === "active");

                // Métrica padronizada e coerente com o objetivo da campanha
                const getAdTargetMetric = (ad: any) => {
                  const label = keyMetric.label;
                  if (label === "Mensagens") {
                    const msgs = Number(ad.metrics?.messagesCount) || 0;
                    return { title: "MSGS", value: msgs.toLocaleString("pt-BR") };
                  }
                  if (label === "Leads") {
                    const leads = Number(ad.metrics?.leadsCount) || 0;
                    return { title: "LEADS", value: leads.toLocaleString("pt-BR") };
                  }
                  if (label === "Vendas") {
                    const sales = Number(ad.metrics?.salesCount) || 0;
                    return { title: "VENDAS", value: sales.toLocaleString("pt-BR") };
                  }
                  if (label === "Downloads") {
                    const installs = Number(ad.metrics?.appInstallsCount) || 0;
                    return { title: "DOWNLOADS", value: installs.toLocaleString("pt-BR") };
                  }
                  if (label === "Visualizações") {
                    const views = Number(ad.metrics?.videoViewsCount) || 0;
                    return { title: "VIEWS", value: views.toLocaleString("pt-BR") };
                  }
                  const clicks = Number(ad.metrics?.clicks) || 0;
                  return { title: "CLIQUES", value: clicks.toLocaleString("pt-BR") };
                };

                return (
                  <div key={campUniqueId} className="py-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3.5">
                        {camp.creative?.imageUrl || (activeAds[0]?.imageUrl) ? (
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                            <Image
                              src={camp.creative?.imageUrl || activeAds[0]?.imageUrl}
                              alt={camp.name || "Criativo"}
                              fill
                              unoptimized
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
                                className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50/70 px-2 py-0.5 text-[11px] font-semibold text-[#0083C7] hover:bg-blue-100 hover:border-blue-300 transition-all cursor-pointer"
                              >
                                <Layers className="h-3 w-3 text-[#0083C7]" />
                                <span>{isExpanded ? "Ocultar anúncios" : `Ver anúncios ativos (${activeAds.length})`}</span>
                                {isExpanded ? (
                                  <ChevronUp className="h-3 w-3 text-[#0083C7]" />
                                ) : (
                                  <ChevronDown className="h-3 w-3 text-[#0083C7]" />
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

                        {/* 3. Cliques (se a métrica principal não for Cliques) */}
                        {keyMetric.label !== "Cliques" && (
                          <div className="min-w-[70px]">
                            <span className="text-[11px] font-semibold uppercase text-slate-400">
                              Cliques
                            </span>
                            <p className="font-poppins text-sm font-bold text-slate-800">
                              {Number(camp.metrics?.clicks || 0).toLocaleString("pt-BR")}
                            </p>
                          </div>
                        )}

                        {/* 4. Métrica Principal do Objetivo */}
                        <div className="min-w-[100px]">
                          <span className="text-[11px] font-bold uppercase text-[#0083C7]">
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

                    {/* Galeria de Anúncios e Criativos Expansível com Extrema Qualidade */}
                    {isExpanded && activeAds.length > 0 && (
                      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5 transition-all">
                        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200/80">
                          <Layers className="h-4 w-4 text-[#0083C7]" />
                          <h6 className="font-poppins text-xs font-bold uppercase tracking-wider text-slate-800">
                            Anúncios Ativos ({activeAds.length})
                          </h6>
                        </div>

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                          {activeAds.map((ad: any, idx: number) => {
                            const isAdActive = (ad.status || "").toLowerCase() === "active";
                            const adSpent = Number(ad.metrics?.spend) || 0;
                            const adImpressions = Number(ad.metrics?.impressions) || 0;
                            const targetMetric = getAdTargetMetric(ad);

                            return (
                              <div
                                key={ad.id || idx}
                                className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs transition-shadow hover:shadow-md"
                              >
                                {/* Header do Mockup do Post */}
                                <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-white">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white p-0.5">
                                      <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-slate-800">
                                        <Instagram className="h-4 w-4 text-pink-600" />
                                      </div>
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-poppins text-xs font-semibold text-slate-900 truncate">
                                        {pageName || adAccountName || "Anúncio Oficial"}
                                      </p>
                                      <p className="text-[10px] text-slate-400">Patrocinado</p>
                                    </div>
                                  </div>
                                  <Badge
                                    className={`text-[9px] font-medium ${
                                      isAdActive
                                        ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                                        : "bg-slate-100 text-slate-700 hover:bg-slate-100"
                                    }`}
                                  >
                                    {isAdActive ? "Ativo" : "Pausado"}
                                  </Badge>
                                </div>

                                {/* Imagem / Mídia do Criativo em Alta Resolução */}
                                <div className="relative aspect-square w-full overflow-hidden bg-slate-900">
                                  {ad.imageUrl ? (
                                    <Image
                                      src={ad.imageUrl}
                                      alt={ad.title || ad.name || "Criativo"}
                                      fill
                                      unoptimized
                                      sizes="(max-width: 768px) 100vw, 400px"
                                      className="object-cover object-center transition-transform duration-300 hover:scale-105"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-slate-400">
                                      <Facebook className="h-10 w-10 opacity-30" />
                                    </div>
                                  )}
                                </div>

                                {/* Barra de CTA do Anúncio */}
                                <div className="flex items-center justify-between bg-slate-50 px-3.5 py-2.5 border-y border-slate-100">
                                  <div className="min-w-0 pr-2">
                                    <p className="text-xs font-bold text-slate-900 truncate">
                                      {ad.title || "Anúncio Meta"}
                                    </p>
                                  </div>
                                  <span className="shrink-0 rounded-md bg-[#0083C7] px-2.5 py-1 text-[10px] font-semibold text-white shadow-2xs">
                                    {getCtaLabel(ad.callToActionType)}
                                  </span>
                                </div>

                                {/* Copy / Legenda do Anúncio */}
                                {ad.body ? (
                                  <div className="p-3 text-xs text-slate-600 border-b border-slate-100 flex-1">
                                    <p className="line-clamp-4 leading-relaxed whitespace-pre-line">
                                      {ad.body}
                                    </p>
                                  </div>
                                ) : (
                                  <div className="p-3 text-xs text-slate-400 italic border-b border-slate-100 flex-1">
                                    Criativo direto sem texto adicional
                                  </div>
                                )}

                                {/* Métricas Individuais deste Anúncio */}
                                <div className="bg-slate-50/80 p-3">
                                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
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
                                      <span className="text-[10px] uppercase font-semibold text-[#0083C7]">
                                        {targetMetric.title}
                                      </span>
                                      <p className="font-poppins font-bold text-[#0083C7] text-[11px]">
                                        {targetMetric.value}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Link Externo se disponível */}
                                  {(ad.instagramPermalinkUrl || ad.effectiveObjectStoryId) && (
                                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex justify-center">
                                      <a
                                        href={
                                          ad.instagramPermalinkUrl ||
                                          `https://facebook.com/${ad.effectiveObjectStoryId}`
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0083C7] hover:underline"
                                      >
                                        <ExternalLink className="h-3 w-3" />
                                        Ver no {ad.instagramPermalinkUrl ? "Instagram" : "Facebook"}
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

      {/* Detalhamentos Oficiais da Meta Ads API (se retornados) */}
      {(totalGenderImp > 0 || totalPlatformImp > 0 || topRegions.length > 0 || totalPlacementImp > 0) && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* 1. Público: Idade e Gênero */}
          {totalGenderImp > 0 && (
            <Card className="border border-slate-200 bg-white shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Users className="h-4 w-4 text-[#0083C7]" />
                  Público: Idade e Gênero
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Distribuição de quem visualizou seus anúncios
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-1">
                {/* Proporção de Gênero */}
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
                    <span className="flex items-center gap-1.5 text-pink-600">
                      👩 Mulheres ({femaleShare}%)
                    </span>
                    <span className="flex items-center gap-1.5 text-blue-600">
                      👨 Homens ({maleShare}%)
                    </span>
                  </div>
                  <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="bg-pink-500 transition-all"
                      style={{ width: `${femaleShare}%` }}
                    />
                    <div
                      className="bg-blue-600 transition-all"
                      style={{ width: `${maleShare}%` }}
                    />
                  </div>
                </div>

                {/* Distribuição por Faixas Etárias */}
                {ageDistribution.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Faixas Etárias
                    </span>
                    <div className="space-y-2">
                      {ageDistribution.map((item) => (
                        <div key={item.age} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium text-slate-700">{item.age} anos</span>
                            <span className="font-semibold text-slate-900">
                              {item.share}% ({item.imp.toLocaleString("pt-BR")} imp)
                            </span>
                          </div>
                          <Progress value={item.share} className="h-1.5 bg-slate-100" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 2. Exibição por Plataforma (Instagram vs Facebook) */}
          {totalPlatformImp > 0 && (
            <Card className="border border-slate-200 bg-white shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Instagram className="h-4 w-4 text-pink-600" />
                  Exibição por Plataforma
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Distribuição de impressões no período
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-1">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="flex items-center gap-1.5 text-slate-700">
                      <Instagram className="h-3.5 w-3.5 text-pink-600" />
                      Instagram
                    </span>
                    <span className="font-semibold text-slate-900">
                      {instaShare}% ({instaImpressions.toLocaleString("pt-BR")} imp)
                    </span>
                  </div>
                  <Progress value={instaShare} className="h-2 bg-slate-100" />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="flex items-center gap-1.5 text-slate-700">
                      <Facebook className="h-3.5 w-3.5 text-[#1877F2]" />
                      Facebook
                    </span>
                    <span className="font-semibold text-slate-900">
                      {fbShare}% ({fbImpressions.toLocaleString("pt-BR")} imp)
                    </span>
                  </div>
                  <Progress value={fbShare} className="h-2 bg-slate-100" />
                </div>

                {/* Formatos / Posicionamentos (se houver dados) */}
                {totalPlacementImp > 0 && (
                  <div className="border-t border-slate-100 pt-3 space-y-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Formatos com Mais Entrega
                    </span>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                        <span className="text-[11px] text-slate-500 block">Feed</span>
                        <strong className="text-slate-800 font-poppins">{feedShare}%</strong>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                        <span className="text-[11px] text-slate-500 block">Stories</span>
                        <strong className="text-slate-800 font-poppins">{storyShare}%</strong>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                        <span className="text-[11px] text-slate-500 block">Reels</span>
                        <strong className="text-slate-800 font-poppins">{reelsShare}%</strong>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 3. Principais Regiões (se houver dados) */}
          {topRegions.length > 0 && (
            <Card className="border border-slate-200 bg-white shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  Principais Regiões
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Estados com maior volume de exibições
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-1">
                {topRegions.map((r) => {
                  const share = totalRegionImp > 0 ? Math.round((r.impressions / totalRegionImp) * 100) : 0;
                  return (
                    <div key={r.region} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-slate-700">{r.region}</span>
                        <span className="font-semibold text-slate-900">
                          {share}% ({r.impressions.toLocaleString("pt-BR")} imp)
                        </span>
                      </div>
                      <Progress value={share} className="h-1.5 bg-slate-100" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
