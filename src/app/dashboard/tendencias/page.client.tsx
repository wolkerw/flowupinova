"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  TrendingUp,
  Search,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Flame,
  Sparkles,
  Newspaper,
  Clock,
  AlertCircle,
  Loader2,
  ShieldCheck,
  CalendarDays,
  Target,
  Building2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/auth-provider";
import { getOnboardingProfile } from "@/lib/services/onboarding-service";
import type { GoogleTrendItem } from "@/app/api/trends/route";

type PeriodMode = "niche" | "today" | "week";

function extractShortCategoryLabel(rawCategory?: string): string {
  if (!rawCategory) return "";
  const firstSegment = rawCategory
    .split(/[—–\-|,/()]/)[0]
    .replace(
      /^(serviços?\s+de|loja\s+de|clínica\s+de|clinica\s+de|consultório\s+de|consultorio\s+de|agência\s+de|agencia\s+de|escritório\s+de|escritorio\s+de|empresa\s+de|estúdio\s+de|estudio\s+de|fornecedor\s+de|centro\s+de|instituto\s+de)\s+/i,
      ""
    )
    .trim();
  return firstSegment || rawCategory.trim();
}

/**
 * Construtor direto de Direção de Arte (Opção 1):
 * - Gancho e Título: Manchetando o tema em alta conectado ao seu nicho.
 * - Cenário e Composição Visual: Estilo fotográfico editorial, iluminação suave/estúdio, composição limpa e moderna.
 * - Diagramação de Texto: Headline curta e marcante para o texto em camadas da arte.
 * - Proibição estrita de menção a 8K, 4K ou 0,5K no texto do briefing.
 */
export function buildTrendArtDirectionBriefing(params: {
  trendTitle: string;
  newsTitle?: string;
  newsSnippet?: string;
  source?: string;
  companyNiche?: string;
  companyName?: string;
}) {
  const { trendTitle, newsTitle, newsSnippet, companyNiche, companyName } = params;
  const nicheLabel = companyNiche || "negócios";
  const cleanedTitle = (trendTitle || "").replace(/["“”]/g, "").trim();

  // 1. Gancho e Título: O tópico obrigatoriamente na Head com sentido completo e relevância prática (sem truncar e SEM ponto final)
  let headline = "";
  const topicLower = cleanedTitle.toLowerCase();
  if (topicLower.includes("outlook") || topicLower.includes("microsoft") || topicLower.includes("teams")) {
    headline = `Falhas em sistemas da Microsoft, como ${cleanedTitle}, mostram a importância de canais alternativos no setor de ${nicheLabel}`;
  } else if (newsTitle) {
    const cleanNews = newsTitle.replace(/\s*[-–|].*$/, "").trim();
    headline = `${cleanNews} sobre ${cleanedTitle}: o que muda para o seu negócio em ${nicheLabel}`;
  } else {
    headline = `Acontecimentos recentes sobre ${cleanedTitle} mostram a importância de estratégias sólidas em ${nicheLabel}`;
  }
  headline = headline.replace(/[\.\s]+$/, "");

  // 2. Fato da Notícia com alto teor informativo
  const newsSummary = newsSnippet
    ? newsSnippet.slice(0, 240)
    : newsTitle
    ? `Notícia em destaque: "${newsTitle}" trazendo desdobramentos operacionais importantes sobre ${cleanedTitle}.`
    : `Apurações jornalísticas recentes sobre "${cleanedTitle}" ganham forte repercussão no mercado brasileiro, mobilizando discussões técnicas e decisões estratégicas de negócios.`;

  // 3. Cenário e Composição Visual: Matriz equilibrada de layouts (Smartphone, Desktop, Conceitual e Executivo)
  const SCENARIOS = [
    `Fotografia editorial cinematográfica e profissional de alto padrão no segmento de ${nicheLabel}. Protagonista em postura confiante e moderna apresentando a solução em um smartphone elegante com tela nítida voltada para o leitor, iluminação de estúdio suave e difusa, composição limpa e equilibrada em ângulo aberto a médio, profundidade de campo sutil e espaço negativo reservado para diagramação de texto e identidade visual.`,
    `Fotografia editorial cinematográfica e profissional de alto padrão no segmento de ${nicheLabel}. Ambiente corporativo contemporâneo, profissionais analisando dados e relatórios estratégicos em monitores de mesa com iluminação de estúdio suave e difusa, composição limpa e equilibrada, profundidade de campo sutil, detalhes nítidos e naturais e espaço negativo premium.`,
    `Composição fotográfica conceitual e sofisticada no segmento de ${nicheLabel}. Linhas arquitetônicas modernas, iluminação volumétrica suave de estúdio e enquadramento equilibrado com amplo espaço negativo reservado para diagramação de texto e identidade visual, transmitindo segurança e inovação com estética editorial minimalista.`,
    `Fotografia executiva autêntica e acolhedora no habitat de ${nicheLabel}. Protagonista em postura confiante e natural em mesa de reunião elegante com laptop e caderno executivo, luz natural difusa, composição equilibrada e profundidade de campo suave.`
  ];
  const titleHash = Math.abs(cleanedTitle.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0));
  const visualScene = SCENARIOS[titleHash % SCENARIOS.length];
  const overlay = (titleHash % 2 === 0 ? "TITLE_ONLY" : "INFOGRAPHIC") as "TITLE_ONLY" | "INFOGRAPHIC";

  // 4. Briefing completo unificado (sem créditos de imprensa e sem menção a 8k ou 0,5k no texto)
  const fullBrief = `[Cena Visual]: ${visualScene} [Head Relevante da Arte]: "${headline}" [Contexto Resumido e Boas Práticas]: ${newsSummary} [Ação Estratégica do Negócio]: Conecte esse acontecimento a soluções de alto valor e orientações práticas para o público de ${nicheLabel}${companyName ? ` na ${companyName}` : ""}.`;

  return {
    headline,
    brief: fullBrief,
    overlay,
  };
}

export default function TendenciasPageClient() {
  const router = useRouter();
  const { user } = useAuth();
  const [trends, setTrends] = useState<GoogleTrendItem[]>([]);
  const [relatedSuggestions, setRelatedSuggestions] = useState<string[]>([]);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [structuringId, setStructuringId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [submittedQuery, setSubmittedQuery] = useState<string>("");
  const [period, setPeriod] = useState<PeriodMode>("today");
  const [companyNiche, setCompanyNiche] = useState<string>("");
  const [companyName, setCompanyName] = useState<string>("");

  // Carrega automaticamente o ramo/nicho da empresa salva no perfil
  useEffect(() => {
    let active = true;
    async function loadProfileNiche() {
      if (!user?.uid) return;
      try {
        const profile = await getOnboardingProfile(user.uid);
        if (!active || !profile) return;
        const shortCat = extractShortCategoryLabel(profile.category || profile.keyProducts || "");
        if (shortCat) {
          setCompanyNiche(shortCat);
        }
        if (profile.name) {
          setCompanyName(profile.name);
        }
      } catch (err) {
        console.warn("[TRENDS_PROFILE_WARN]", err);
      }
    }
    loadProfileNiche();
    return () => {
      active = false;
    };
  }, [user?.uid]);

  const fetchTrends = useCallback(
    async (
      queryParam = "",
      periodParam: PeriodMode = "today",
      nicheParam = "",
      isManualRefresh = false
    ) => {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const params = new URLSearchParams({
          geo: "BR",
          period: periodParam,
        });
        if (queryParam) {
          params.set("q", queryParam);
        }
        if (periodParam === "niche") {
          params.set("niche", nicheParam || companyNiche || "empreendedorismo");
        }

        const res = await fetch(`/api/trends?${params.toString()}`, { cache: "no-store" });
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Não foi possível carregar o Google Trends.");
        }

        setTrends(data.trends || []);
        setRelatedSuggestions(data.relatedSuggestions || []);
        setFetchedAt(data.fetchedAt || new Date().toISOString());
      } catch (err: any) {
        setError(err.message || "Falha ao sincronizar com o Google Trends.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [companyNiche]
  );

  useEffect(() => {
    fetchTrends("", "today", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchQuery.trim();
    setSubmittedQuery(clean);
    fetchTrends(clean, period, companyNiche, true);
  };

  const handlePeriodChange = (newPeriod: PeriodMode) => {
    setPeriod(newPeriod);
    fetchTrends(submittedQuery, newPeriod, companyNiche, true);
  };

  const filteredTrends = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || period === "niche") return trends;
    return trends.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.newsArticles.some(
          (n) => n.title.toLowerCase().includes(q) || n.source.toLowerCase().includes(q)
        )
    );
  }, [trends, searchQuery, period]);

  /**
   * Ao clicar no botão, a IA resume a notícia do tópico e gera um briefing estruturado
   * de alto padrão conectando o fato ocorrido diretamente ao nicho da empresa.
   * Não menciona 8k, 4k ou 0,5k no prompt, e envia quality=low para geração econômica.
   */
  const handleCreatePostFromTrend = async (trend: GoogleTrendItem) => {
    if (structuringId) return;
    setStructuringId(trend.id);

    const primaryArticle = trend.newsArticles[0];

    try {
      const res = await fetch("/api/trends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trendTitle: trend.title,
          newsTitle: primaryArticle?.title,
          source: primaryArticle?.source,
          newsUrl: primaryArticle?.url,
          companyNiche: companyNiche || undefined,
          companyName: companyName || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.fullBrief) {
        router.push(
          `/dashboard/imagens/gerar?mode=general&topic=${encodeURIComponent(
            data.fullBrief
          )}&headline=${encodeURIComponent(data.headline || "")}&overlay=${
            data.suggestedOverlay || "INFOGRAPHIC"
          }&quality=low`
        );
        return;
      }
    } catch (err) {
      console.warn("[TREND_STRUCT_FETCH_WARN] Falha ao estruturar com IA, usando fallback:", err);
    }

    // Fallback determinístico caso haja falha ou timeout na API
    const fallback = buildTrendArtDirectionBriefing({
      trendTitle: trend.title,
      newsTitle: primaryArticle?.title,
      source: primaryArticle?.source,
      companyNiche: companyNiche || undefined,
      companyName: companyName || undefined,
    });

    router.push(
      `/dashboard/imagens/gerar?mode=general&topic=${encodeURIComponent(
        fallback.brief
      )}&headline=${encodeURIComponent(fallback.headline)}&overlay=${
        fallback.overlay
      }&quality=low`
    );
    setStructuringId(null);
  };

  const handleCreatePostFromKeyword = async (keyword: string) => {
    if (structuringId) return;
    setStructuringId(keyword);

    try {
      const res = await fetch("/api/trends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trendTitle: keyword,
          companyNiche: companyNiche || undefined,
          companyName: companyName || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.fullBrief) {
        router.push(
          `/dashboard/imagens/gerar?mode=general&topic=${encodeURIComponent(
            data.fullBrief
          )}&headline=${encodeURIComponent(data.headline || "")}&overlay=${
            data.suggestedOverlay || "INFOGRAPHIC"
          }&quality=low`
        );
        return;
      }
    } catch (err) {
      console.warn("[KEYWORD_STRUCT_FETCH_WARN] Usando fallback para palavra-chave:", err);
    }

    const fallback = buildTrendArtDirectionBriefing({
      trendTitle: keyword,
      companyNiche: companyNiche || undefined,
      companyName: companyName || undefined,
    });

    router.push(
      `/dashboard/imagens/gerar?mode=general&topic=${encodeURIComponent(
        fallback.brief
      )}&headline=${encodeURIComponent(fallback.headline)}&overlay=${
        fallback.overlay
      }&quality=low`
    );
    setStructuringId(null);
  };

  const activeNicheLabel = submittedQuery || companyNiche || "Seu Ramo de Negócio";

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 font-inter">
      {/* Cabeçalho Principal */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-center">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0083C7] text-white">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h1 className="font-poppins text-2xl font-bold text-slate-900 md:text-3xl">
              Tendências no Google
            </h1>
            <Badge className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-50">
              <ShieldCheck className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
              Fonte Verificada: Google Trends Brasil (Ao Vivo)
            </Badge>
          </div>
          <p className="text-sm text-slate-600">
            Descubra o que os brasileiros mais estão pesquisando no Google e transforme os assuntos
            do momento em posts para o seu negócio.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {fetchedAt && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Clock className="h-3.5 w-3.5 text-[#0083C7]" />
              Atualizado{" "}
              {formatDistanceToNow(new Date(fetchedAt), { addSuffix: true, locale: ptBR })}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchTrends(submittedQuery, period, companyNiche, true)}
            disabled={loading || refreshing}
            className="rounded-lg border-slate-300 bg-white font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Atualizar Agora
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-lg border-[#0083C7] bg-white font-semibold text-[#0083C7] hover:bg-slate-50"
          >
            <a
              href={
                period === "niche"
                  ? `https://trends.google.com.br/trends/explore?q=${encodeURIComponent(activeNicheLabel)}&geo=BR&hl=pt-BR`
                  : `https://trends.google.com.br/trending?geo=BR&hl=pt-BR&hours=${period === "week" ? 168 : 24}`
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              Conferir no Google Trends
              <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </div>

      {/* Barra de Filtro e Escolha Simples: Do Meu Ramo vs Hoje vs Semana */}
      <Card className="rounded-lg border border-slate-200 bg-white shadow-xs">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Abas simples e diretas */}
            <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => handlePeriodChange("niche")}
                className={`flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors ${
                  period === "niche"
                    ? "bg-[#FA6305] text-white shadow-2xs"
                    : "text-slate-700 hover:text-slate-900"
                }`}
              >
                <Target className="h-4 w-4" />
                Seu Mercado
              </button>
              <button
                type="button"
                onClick={() => handlePeriodChange("today")}
                className={`flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors ${
                  period === "today"
                    ? "bg-[#0083C7] text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Flame className="h-4 w-4" />
                Em Alta Hoje
              </button>
              <button
                type="button"
                onClick={() => handlePeriodChange("week")}
                className={`flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors ${
                  period === "week"
                    ? "bg-[#0083C7] text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <CalendarDays className="h-4 w-4" />
                Últimos 7 Dias
              </button>
            </div>

            <form onSubmit={handleSearchSubmit} className="flex flex-1 flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar outro assunto ou tema específico no Google..."
                  className="h-10 rounded-lg border-slate-300 pl-9 text-sm"
                />
              </div>
              <Button
                type="submit"
                disabled={loading || refreshing}
                className="h-10 rounded-lg bg-[#0083C7] px-5 font-semibold text-white hover:bg-[#006da6]"
              >
                <Search className="mr-2 h-4 w-4" />
                Pesquisar no Google
              </Button>
              {(searchQuery || submittedQuery) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setSubmittedQuery("");
                    fetchTrends("", period, companyNiche, true);
                  }}
                  className="h-10 rounded-lg border-slate-300 font-medium text-slate-600"
                >
                  Limpar
                </Button>
              )}
            </form>
          </div>

          {/* Aviso explicativo quando está na aba automática "Do Meu Ramo" */}
          {period === "niche" && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-orange-200 bg-orange-50/70 px-4 py-2.5 text-xs text-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 shrink-0 text-[#FA6305]" />
                <span>
                  Mostrando automaticamente assuntos e notícias recentes do Google sobre{" "}
                  <strong className="font-bold text-slate-900">{activeNicheLabel}</strong>
                  {companyName ? ` (identificado do perfil de ${companyName})` : ""}.
                </span>
              </div>
            </div>
          )}

          {/* Sugestões reais do que as pessoas estão digitando no Google */}
          {(submittedQuery || period === "niche") && relatedSuggestions.length > 0 && (
            <div className="border-t border-slate-100 pt-4">
              <div className="mb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#0083C7]" />
                  <span className="font-poppins text-xs font-bold uppercase tracking-wide text-slate-700">
                    O que os clientes mais estão digitando no Google sobre &ldquo;{activeNicheLabel}
                    &rdquo;
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {relatedSuggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-800"
                  >
                    <span>{suggestion}</span>
                    <button
                      type="button"
                      disabled={Boolean(structuringId)}
                      onClick={() => handleCreatePostFromKeyword(suggestion)}
                      className="inline-flex items-center gap-1 rounded bg-[#FA6305] px-2 py-0.5 text-[11px] font-semibold text-white hover:bg-[#e05600] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {structuringId === suggestion ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3" />
                      )}
                      <span>{structuringId === suggestion ? "Resumindo..." : "Criar Post"}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estado de Carregamento / Erro / Lista de Cards */}
      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white py-20 text-center">
          <Loader2 className="mb-3 h-8 w-8 animate-spin text-[#0083C7]" />
          <p className="font-poppins text-base font-semibold text-slate-800">
            {period === "niche"
              ? `Buscando o que está em alta no Google para ${activeNicheLabel}...`
              : "Buscando os assuntos mais pesquisados no Google Brasil..."}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Sincronizando dados verificados em tempo real.
          </p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <AlertCircle className="mb-2 h-8 w-8 text-red-600" />
          <h3 className="font-poppins text-base font-bold text-red-900">
            Não foi possível carregar as tendências agora
          </h3>
          <p className="mt-1 max-w-md text-xs text-red-700">{error}</p>
          <Button
            onClick={() => fetchTrends(submittedQuery, period, companyNiche, true)}
            className="mt-4 rounded-lg bg-[#0083C7] text-white hover:bg-[#006da6]"
          >
            Tentar Novamente
          </Button>
        </div>
      ) : filteredTrends.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
          <TrendingUp className="mx-auto mb-3 h-10 w-10 text-slate-400" />
          <h3 className="font-poppins text-base font-bold text-slate-800">
            Nenhum assunto em alta encontrado para &ldquo;{searchQuery || activeNicheLabel}&rdquo;
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Experimente digitar uma palavra mais simples do seu ramo na busca acima e clicar em
            &ldquo;Pesquisar no Google&rdquo;.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTrends.map((trend, index) => (
            <Card
              key={trend.id}
              className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white shadow-xs transition-shadow hover:shadow-md"
            >
              <div>
                <CardHeader className="space-y-3 border-b border-slate-100 p-5 pb-4">
                  {/* Posição + Volume de Buscas Simples e Direto */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                      {period === "niche" ? `#${index + 1} no seu setor` : `#${index + 1} no Brasil`}
                    </span>
                    <Badge className="rounded-lg border-none bg-[#FA6305] px-2.5 py-1 text-xs font-bold text-white hover:bg-[#FA6305]">
                      <Flame className="mr-1 h-3.5 w-3.5" />
                      {period === "niche" ? trend.approxTraffic : `${trend.approxTraffic} buscas`}
                    </Badge>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <CardTitle
                      className={`font-poppins text-lg font-bold leading-snug text-slate-900 ${
                        period === "niche" ? "" : "capitalize"
                      }`}
                    >
                      {trend.title}
                    </CardTitle>
                    {trend.picture && (
                      <img
                        src={trend.picture}
                        alt={trend.title}
                        className="h-14 w-14 shrink-0 rounded-lg border border-slate-200 object-cover"
                      />
                    )}
                  </div>
                </CardHeader>

                {/* Contexto Simples: Notícia Principal ou Botão para Entender o Assunto */}
                <CardContent className="space-y-2.5 p-5">
                  {period === "niche" && trend.newsArticles.length > 0 ? (
                    <a
                      href={trend.newsArticles[0].url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs font-medium text-[#0083C7] transition-colors hover:border-[#0083C7]/40 hover:bg-slate-100/70"
                    >
                      <span>Ler matéria completa • Fonte: {trend.newsArticles[0].source}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    </a>
                  ) : (
                    <>
                      <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        <Newspaper className="h-3.5 w-3.5 text-[#0083C7]" />O que está acontecendo
                      </span>

                      {trend.newsArticles.length > 0 ? (
                        <div className="space-y-2">
                          {trend.newsArticles.slice(0, 2).map((article, idx) => (
                            <a
                              key={idx}
                              href={article.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block rounded-lg border border-slate-100 bg-slate-50 p-3 transition-colors hover:border-[#0083C7]/40 hover:bg-slate-100/70"
                            >
                              <p className="line-clamp-2 text-xs font-semibold leading-snug text-slate-800">
                                {article.title}
                              </p>
                              <div className="mt-1.5 flex items-center justify-between text-[11px] font-medium text-[#0083C7]">
                                <span>Fonte: {article.source}</span>
                                <ExternalLink className="h-3 w-3 shrink-0" />
                              </div>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <a
                          href={`https://www.google.com/search?q=${encodeURIComponent(trend.title)}&tbm=nws&hl=pt-BR`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs font-medium text-slate-600 transition-colors hover:border-[#0083C7]/40 hover:text-[#0083C7]"
                        >
                          <span>Ver notícias sobre esse assunto no Google</span>
                          <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[#0083C7]" />
                        </a>
                      )}
                    </>
                  )}
                </CardContent>
              </div>

              <CardFooter className="border-t border-slate-100 p-4 pt-3">
                <Button
                  type="button"
                  disabled={Boolean(structuringId)}
                  onClick={() => handleCreatePostFromTrend(trend)}
                  className="w-full rounded-lg bg-[#0083C7] font-poppins text-xs font-semibold text-white hover:bg-[#006da6] disabled:cursor-not-allowed disabled:opacity-75"
                >
                  {structuringId === trend.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resumindo notícia com IA...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Criar Post sobre esse Assunto
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
