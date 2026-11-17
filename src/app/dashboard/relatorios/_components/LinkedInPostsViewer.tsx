"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Linkedin,
  Eye,
  MessageCircle,
  Share2,
  TrendingDown,
  Sparkles,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Flame,
  BarChart,
  ThumbsUp,
  ArrowUpRight,
  MousePointerClick,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/components/auth/auth-provider";
import type { LinkedInConnectionData } from "@/lib/services/linkedin-service";
import type { LinkedInPostMetricItem } from "@/app/api/linkedin/metrics/route";

export interface LinkedInPostsViewerProps {
  connection: LinkedInConnectionData | null;
  periodDays?: string;
}

const linkedinAiRecommendations = [
  {
    id: "li-rec-1",
    title: "Postar Artigos de Opinião e Bastidores da Empresa",
    description:
      "Posts com histórias reais da empresa ou visão de liderança costumam gerar maior alcance e engajamento no LinkedIn.",
    actionText: "Gerar Post",
    badge: "Alta Relevância",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
  },
  {
    id: "li-rec-2",
    title: "Melhor Horário para Postar no LinkedIn",
    description:
      "Publicações corporativas entre terças e quintas-feiras, das 09:00 às 11:00, tendem a alcançar maior visibilidade profissional.",
    actionText: "Agendar Post",
    badge: "Dica de Engajamento",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
];

export function LinkedInPostsViewer({ connection, periodDays = "30" }: LinkedInPostsViewerProps) {
  const { user, getIdToken } = useAuth();
  const [selectedPost, setSelectedPost] = useState<LinkedInPostMetricItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "trending" | "declining">("all");
  const [posts, setPosts] = useState<LinkedInPostMetricItem[]>([]);
  const [orgName, setOrgName] = useState<string>(
    connection?.selectedOrganizationName || connection?.personName || ""
  );
  const [orgTotals, setOrgTotals] = useState({
    impressions: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    clicks: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConnected = connection?.isConnected ?? false;

  const fetchMetrics = useCallback(async () => {
    if (!isConnected) return;
    setLoading(true);
    setError(null);
    try {
      const token = user ? await getIdToken().catch(() => null) : null;
      const res = await fetch("/api/linkedin/metrics", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Não foi possível carregar as métricas do LinkedIn.");
      }
      setPosts(Array.isArray(data.posts) ? data.posts : []);
      if (data.organizationName) {
        setOrgName(data.organizationName);
      }
      if (data.totals) {
        setOrgTotals({
          impressions: Number(data.totals.impressions || 0),
          likes: Number(data.totals.likes || 0),
          comments: Number(data.totals.comments || 0),
          shares: Number(data.totals.shares || 0),
          clicks: Number(data.totals.clicks || 0),
        });
      }
      if (data.warning) {
        setError(data.warning);
      }
    } catch (err: any) {
      setError(err.message || "Erro ao buscar métricas no LinkedIn.");
    } finally {
      setLoading(false);
    }
  }, [isConnected, user, getIdToken]);

  useEffect(() => {
    if (isConnected) {
      fetchMetrics();
    }
  }, [isConnected, fetchMetrics]);

  const cutoffDate = React.useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (parseInt(periodDays || "30", 10) - 1));
    return d;
  }, [periodDays]);

  const filteredPosts = React.useMemo(() => {
    return posts.filter((p) => {
      const isWithinDate = new Date(p.createdTime) >= cutoffDate;
      if (!isWithinDate) return false;
      if (activeTab === "trending") return p.status === "trending";
      if (activeTab === "declining") return p.status === "declining";
      return true;
    });
  }, [posts, activeTab, cutoffDate]);

  const sumPosts = React.useMemo(() => {
    return filteredPosts.reduce(
      (acc, p) => ({
        impressions: acc.impressions + (p.metrics?.impressions || 0),
        likes: acc.likes + (p.metrics?.likes || 0),
        comments: acc.comments + (p.metrics?.comments || 0),
        shares: acc.shares + (p.metrics?.shares || 0),
        clicks: acc.clicks + (p.metrics?.clicks || 0),
      }),
      { impressions: 0, likes: 0, comments: 0, shares: 0, clicks: 0 }
    );
  }, [filteredPosts]);

  // Se houver métricas nos posts filtrados, exibe a soma; caso contrário usa os totais da página corporativa
  const totalImpressions = sumPosts.impressions || orgTotals.impressions;
  const totalLikes = sumPosts.likes || orgTotals.likes;
  const totalComments = sumPosts.comments || orgTotals.comments;
  const totalShares = sumPosts.shares || orgTotals.shares;
  const totalClicks = sumPosts.clicks || orgTotals.clicks;

  if (!isConnected) {
    return (
      <div className="py-12 text-center text-slate-500">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-[#0077B5]">
          <Linkedin className="h-10 w-10" />
        </div>
        <h3 className="font-poppins text-xl font-bold text-slate-900">
          Conta do LinkedIn não conectada
        </h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">
          Conecte sua conta do LinkedIn ou Página de Empresa para visualizar métricas, estatísticas de postagens e recomendações da IA NumVapt.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild className="bg-[#0077B5] hover:bg-[#005e93] text-white font-semibold shadow-sm">
            <Link href="/dashboard/posts">
              <Linkedin className="mr-2 h-4 w-4" />
              Conectar LinkedIn
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      {/* Banner de Perfil Conectado */}
      <Card className="border border-slate-200 bg-gradient-to-r from-blue-50 via-white to-slate-50 shadow-xs">
        <CardContent className="flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0077B5] text-white shadow-md">
              <Linkedin className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-poppins text-lg font-bold text-slate-900">
                  {orgName || connection?.selectedOrganizationName || connection?.personName || "Página do LinkedIn"}
                </h3>
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                  Conectado
                </Badge>
              </div>
              <p className="text-xs text-slate-600">
                Página Corporativa: {orgName || connection?.selectedOrganizationName || "Não selecionada"}
                {connection?.personName ? ` • Admin: ${connection.personName}` : ""}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchMetrics}
            disabled={loading}
            className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar Métricas
          </Button>
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold">Aviso ao consultar métricas no LinkedIn</p>
            <p className="mt-0.5 text-amber-800">{error}</p>
          </div>
        </div>
      )}

      {/* Cards de Métricas Gerais de LinkedIn (Impressões, Reações, Comentários, Compartilhamentos, Cliques) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Impressões
              </span>
              <div className="rounded-lg bg-blue-50 p-2 text-[#0077B5]">
                <Eye className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-poppins text-3xl font-bold text-slate-900">
                {totalImpressions.toLocaleString("pt-BR")}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Visualizações no feed corporativo</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Reações Totais
              </span>
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <ThumbsUp className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-poppins text-3xl font-bold text-slate-900">
                {totalLikes.toLocaleString("pt-BR")}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Curtidas, Parabéns & Apoio</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Comentários
              </span>
              <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
                <MessageCircle className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-poppins text-3xl font-bold text-slate-900">
                {totalComments.toLocaleString("pt-BR")}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Interações de profissionais</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Compartilhamentos
              </span>
              <div className="rounded-lg bg-orange-50 p-2 text-[#FA6305]">
                <Share2 className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-poppins text-3xl font-bold text-slate-900">
                {totalShares.toLocaleString("pt-BR")}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Reposts em redes profissionais</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Cliques
              </span>
              <div className="rounded-lg bg-sky-50 p-2 text-[#0083C7]">
                <MousePointerClick className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-poppins text-3xl font-bold text-slate-900">
                {totalClicks.toLocaleString("pt-BR")}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Cliques nas publicações</p>
          </CardContent>
        </Card>
      </div>

      {/* Classificação por Conteúdo ("Seu Conteúdo LinkedIn") */}
      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="font-poppins text-lg font-bold text-slate-900">
              Desempenho de Publicações no LinkedIn
            </CardTitle>
            <CardDescription className="text-slate-500">
              Análise detalhada por postagem, engajamento e métricas de alcance corporativo.
            </CardDescription>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(val: any) => setActiveTab(val)}
            className="w-full sm:w-auto"
          >
            <TabsList className="grid w-full grid-cols-3 bg-slate-100 sm:w-auto">
              <TabsTrigger value="all" className="text-xs">
                Todos
              </TabsTrigger>
              <TabsTrigger value="trending" className="text-xs text-orange-700">
                <Flame className="mr-1 h-3.5 w-3.5" /> Em Alta
              </TabsTrigger>
              <TabsTrigger value="declining" className="text-xs text-slate-700">
                <TrendingDown className="mr-1 h-3.5 w-3.5" /> Em Baixa
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Loader2 className="mb-3 h-8 w-8 animate-spin text-[#0077B5]" />
              <p className="text-sm font-medium text-slate-700">
                Carregando publicações e métricas do LinkedIn...
              </p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-xs">
              <Linkedin className="mx-auto mb-3 h-10 w-10 text-slate-400" />
              <h4 className="text-base font-semibold text-slate-800">
                Nenhum post publicado no LinkedIn no período
              </h4>
              <p className="mt-1 text-xs text-slate-500">
                Suas publicações realizadas pelo NumVapt ou pela sua Página Corporativa do LinkedIn aparecerão aqui com métricas em tempo real.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredPosts.map((post) => (
                <Card
                  key={post.id}
                  className="flex flex-col border border-slate-200 shadow-xs transition-shadow hover:shadow-md"
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="relative aspect-video overflow-hidden rounded-md bg-slate-100">
                      {post.imageUrl ? (
                        <img
                          src={post.imageUrl}
                          alt="Thumbnail post LinkedIn"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-blue-50 text-[#0077B5]">
                          <Linkedin className="h-10 w-10 opacity-40" />
                        </div>
                      )}
                      {post.status === "trending" && (
                        <Badge className="absolute top-2 right-2 bg-orange-500 text-white font-bold border-none">
                          <Flame className="mr-1 h-3 w-3" /> Em Alta
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow p-4 pt-2 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-semibold text-[#0077B5]">
                        {orgName || connection?.selectedOrganizationName || "Página Corporativa"}
                      </span>
                      <span>{format(new Date(post.createdTime), "dd/MM/yyyy 'às' HH:mm")}</span>
                    </div>
                    <p className="line-clamp-2 text-sm text-slate-700 font-medium">{post.text}</p>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5 text-blue-600" />
                        <span className="font-bold text-slate-900">{post.metrics.impressions}</span>
                        <span className="text-[11px]">Impr.</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ThumbsUp className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="font-bold text-slate-900">{post.metrics.likes}</span>
                        <span className="text-[11px]">Reações</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MessageCircle className="h-3.5 w-3.5 text-purple-600" />
                        <span className="font-bold text-slate-900">{post.metrics.comments}</span>
                        <span className="text-[11px]">Coment.</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Share2 className="h-3.5 w-3.5 text-orange-600" />
                        <span className="font-bold text-slate-900">{post.metrics.shares}</span>
                        <span className="text-[11px]">Shares</span>
                      </div>
                      <div className="flex items-center gap-1.5 col-span-2">
                        <MousePointerClick className="h-3.5 w-3.5 text-[#0083C7]" />
                        <span className="font-bold text-slate-900">{post.metrics.clicks}</span>
                        <span className="text-[11px]">Cliques</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 text-xs font-semibold"
                      onClick={() => {
                        setSelectedPost(post);
                        setIsModalOpen(true);
                      }}
                    >
                      <BarChart className="mr-1.5 h-3.5 w-3.5 text-[#0077B5]" />
                      Ver Insights
                    </Button>
                    <Button asChild variant="ghost" size="icon" className="shrink-0">
                      <a href={post.permalink} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 text-slate-500" />
                      </a>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* IA Recommendations para LinkedIn */}
      <Card className="border border-blue-200 bg-gradient-to-r from-blue-50/60 to-white shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-[#0077B5] p-2 text-white shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="font-poppins text-lg font-bold text-slate-900">
                Estratégia & Recomendações para LinkedIn
              </CardTitle>
              <CardDescription className="text-slate-600">
                Recomendações orientadas a dados para fortalecer o posicionamento da sua marca no LinkedIn.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {linkedinAiRecommendations.map((rec) => (
            <div
              key={rec.id}
              className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-5 shadow-xs"
            >
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Badge className={rec.badgeColor}>{rec.badge}</Badge>
                  <Sparkles className="h-4 w-4 text-[#0077B5]" />
                </div>
                <h4 className="font-poppins font-bold text-slate-900">{rec.title}</h4>
                <p className="mt-1 text-sm text-slate-600">{rec.description}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                <Button asChild className="bg-[#0077B5] hover:bg-[#005e93] text-white text-xs font-semibold">
                  <Link href="/dashboard/posts/gerar">
                    {rec.actionText} <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Modal de Insights do Post do LinkedIn */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg bg-slate-50">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="font-poppins text-base font-bold text-slate-900">
              Insights da Publicação no LinkedIn
            </DialogTitle>
          </DialogHeader>

          {selectedPost && (
            <div className="space-y-4 py-2">
              <Card className="bg-white border-slate-200 shadow-xs">
                <CardContent className="p-4 space-y-2">
                  <p className="text-sm text-slate-700 font-medium">{selectedPost.text}</p>
                  <p className="text-xs text-slate-500">
                    Publicado em {format(new Date(selectedPost.createdTime), "dd/MM/yyyy 'às' HH:mm")}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200 shadow-xs">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-slate-900">
                    Resumo de Desempenho e Engajamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="divide-y divide-slate-100 text-sm">
                  <div className="flex justify-between py-2">
                    <span className="text-slate-600">Impressões no Feed:</span>
                    <span className="font-bold text-slate-900">{selectedPost.metrics.impressions}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-600">Reações / Curtidas:</span>
                    <span className="font-bold text-slate-900">{selectedPost.metrics.likes}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-600">Comentários:</span>
                    <span className="font-bold text-slate-900">{selectedPost.metrics.comments}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-600">Compartilhamentos:</span>
                    <span className="font-bold text-slate-900">{selectedPost.metrics.shares}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-600">Cliques no Conteúdo:</span>
                    <span className="font-bold text-slate-900">{selectedPost.metrics.clicks}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-600">Taxa de Engajamento:</span>
                    <span className="font-bold text-emerald-600">{selectedPost.metrics.engagementRate}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
