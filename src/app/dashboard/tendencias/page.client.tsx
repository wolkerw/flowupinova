"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
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
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { GoogleTrendItem } from "@/app/api/trends/route";

export default function TendenciasPageClient() {
  const router = useRouter();
  const [trends, setTrends] = useState<GoogleTrendItem[]>([]);
  const [relatedSuggestions, setRelatedSuggestions] = useState<string[]>([]);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [submittedQuery, setSubmittedQuery] = useState<string>("");

  const fetchTrends = useCallback(async (queryParam = "", isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const url = queryParam
        ? `/api/trends?geo=BR&q=${encodeURIComponent(queryParam)}`
        : `/api/trends?geo=BR`;
      const res = await fetch(url, { cache: "no-store" });
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
  }, []);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchQuery.trim();
    setSubmittedQuery(clean);
    fetchTrends(clean, true);
  };

  const filteredTrends = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return trends;
    return trends.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.newsArticles.some(
          (n) => n.title.toLowerCase().includes(q) || n.source.toLowerCase().includes(q)
        )
    );
  }, [trends, searchQuery]);

  const handleCreatePostFromTrend = (trend: GoogleTrendItem) => {
    const mainHeadline = trend.newsArticles[0]?.title
      ? ` (${trend.newsArticles[0].title} - Fonte: ${trend.newsArticles[0].source})`
      : "";
    const promptTopic = `Assunto em alta no Google Trends (${trend.approxTraffic} buscas): ${trend.title}${mainHeadline}. Crie um post engajador conectando este tema em alta ao meu negócio.`;
    router.push(`/dashboard/posts/gerar?mode=text&topic=${encodeURIComponent(promptTopic)}`);
  };

  const handleCreatePostFromKeyword = (keyword: string) => {
    const promptTopic = `Busca em alta no Google: "${keyword}". Crie um post estratégico e informativo sobre este tema para atrair clientes para o meu negócio.`;
    router.push(`/dashboard/posts/gerar?mode=text&topic=${encodeURIComponent(promptTopic)}`);
  };

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
            Acompanhe os assuntos que estão crescendo agora no Google Brasil com volume real de
            buscas e fontes verificadas de imprensa.
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
            onClick={() => fetchTrends(submittedQuery, true)}
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
              href="https://trends.google.com.br/trending?geo=BR&hl=pt-BR"
              target="_blank"
              rel="noopener noreferrer"
            >
              Conferir no Google Trends
              <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </div>

      {/* Barra de Filtro e Consulta de Termos no Google */}
      <Card className="rounded-lg border border-slate-200 bg-white shadow-xs">
        <CardContent className="p-4 sm:p-5">
          <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className=" absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrar tendências do dia ou pesquisar buscas reais do seu nicho no Google (ex: estética, odontologia, imóveis)..."
                className="h-10 rounded-lg border-slate-300 pl-9 text-sm"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || refreshing}
              className="h-10 rounded-lg bg-[#0083C7] px-5 font-semibold text-white hover:bg-[#006da6]"
            >
              <Search className="mr-2 h-4 w-4" />
              Consultar no Google
            </Button>
            {(searchQuery || submittedQuery) && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setSubmittedQuery("");
                  fetchTrends("", true);
                }}
                className="h-10 rounded-lg border-slate-300 font-medium text-slate-600"
              >
                Limpar
              </Button>
            )}
          </form>

          {/* Resultados do Google Autocomplete para o termo pesquisado */}
          {submittedQuery && relatedSuggestions.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <div className="mb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#0083C7]" />
                  <span className="font-poppins text-xs font-bold uppercase tracking-wide text-slate-700">
                    Buscas mais frequentes no Google para &ldquo;{submittedQuery}&rdquo;
                  </span>
                </div>
                <a
                  href={`https://trends.google.com.br/trends/explore?q=${encodeURIComponent(submittedQuery)}&geo=BR&hl=pt-BR`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#0083C7] hover:underline"
                >
                  Ver gráfico oficial no Google Trends
                  <ExternalLink className="h-3 w-3" />
                </a>
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
                      onClick={() => handleCreatePostFromKeyword(suggestion)}
                      className="inline-flex items-center gap-1 rounded bg-[#FA6305] px-2 py-0.5 text-[11px] font-semibold text-white hover:bg-[#e05600]"
                    >
                      <Sparkles className="h-3 w-3" />
                      Criar Post
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
            Consultando Google Trends Brasil em tempo real...
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Buscando volume oficial de pesquisas e fontes verificadas.
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
            onClick={() => fetchTrends(submittedQuery, true)}
            className="mt-4 rounded-lg bg-[#0083C7] text-white hover:bg-[#006da6]"
          >
            Tentar Novamente
          </Button>
        </div>
      ) : filteredTrends.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
          <TrendingUp className="mx-auto mb-3 h-10 w-10 text-slate-400" />
          <h3 className="font-poppins text-base font-bold text-slate-800">
            Nenhuma tendência do dia corresponde ao filtro &ldquo;{searchQuery}&rdquo;
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Clique em &ldquo;Consultar no Google&rdquo; acima para ver as buscas sugeridas para esse
            termo ou limpe o filtro para ver todas as tendências do Brasil hoje.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTrends.map((trend, index) => {
            const publishedDate = trend.pubDate ? new Date(trend.pubDate) : null;
            const timeAgo =
              publishedDate && !isNaN(publishedDate.getTime())
                ? formatDistanceToNow(publishedDate, { addSuffix: true, locale: ptBR })
                : "Hoje";

            return (
              <Card
                key={trend.id}
                className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white shadow-xs transition-shadow hover:shadow-md"
              >
                <div>
                  <CardHeader className="space-y-3 border-b border-slate-100 p-5 pb-4">
                    {/* Ponto 4: Selo de Fonte Verificada + Volume Real */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700">
                        #{index + 1} • {trend.sourceLabel}
                      </span>
                      <Badge className="rounded-lg border-none bg-[#FA6305] px-2.5 py-1 text-xs font-bold text-white hover:bg-[#FA6305]">
                        <Flame className="mr-1 h-3.5 w-3.5" />
                        {trend.approxTraffic} buscas
                      </Badge>
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="font-poppins text-lg font-bold leading-snug text-slate-900">
                          {trend.title}
                        </CardTitle>
                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="h-3 w-3" />
                          Detectado {timeAgo}
                        </p>
                      </div>
                      {trend.picture && (
                        <img
                          src={trend.picture}
                          alt={trend.title}
                          className="h-14 w-14 shrink-0 rounded-lg border border-slate-200 object-cover"
                        />
                      )}
                    </div>
                  </CardHeader>

                  {/* Manchetes e Fontes Verificadas que comprovam o motivo da alta */}
                  <CardContent className="space-y-3 p-5">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        <Newspaper className="h-3.5 w-3.5 text-[#0083C7]" />
                        Por que está em alta (Fontes Reais)
                      </span>
                      <a
                        href={trend.trendsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0083C7] hover:underline"
                      >
                        Google Trends
                        <ArrowUpRight className="h-3 w-3" />
                      </a>
                    </div>

                    {trend.newsArticles.length > 0 ? (
                      <div className="space-y-2.5">
                        {trend.newsArticles.map((article, idx) => (
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
                      <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
                        Termo com pico de busca direta no Google Brasil nas últimas horas.
                      </p>
                    )}
                  </CardContent>
                </div>

                <CardFooter className="border-t border-slate-100 p-4 pt-3">
                  <Button
                    type="button"
                    onClick={() => handleCreatePostFromTrend(trend)}
                    className="w-full rounded-lg bg-[#0083C7] font-poppins text-xs font-semibold text-white hover:bg-[#006da6]"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Criar Post sobre essa Tendência
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
