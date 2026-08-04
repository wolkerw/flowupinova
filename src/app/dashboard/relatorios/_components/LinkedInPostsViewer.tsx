"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Linkedin,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  TrendingUp,
  TrendingDown,
  Sparkles,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Flame,
  Award,
  BarChart,
  Users,
  Building2,
  ThumbsUp,
  ArrowUpRight,
} from "lucide-react";
import { format } from "date-fns";
import type { LinkedInConnectionData } from "@/lib/services/linkedin-service";

export interface LinkedInPostsViewerProps {
  connection: LinkedInConnectionData | null;
}

const mockLinkedInPosts = [
  {
    id: "urn:li:share:718293819201",
    authorName: "FlowUp Inovação & Tecnologia",
    authorTitle: "Empresa de Automação & IA",
    text: "🚀 Como a Inteligência Artificial está transformando a criação de conteúdo para empresas B2B. Confira 3 casos reais de aceleração de resultados!",
    imageUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&auto=format&fit=crop&q=80",
    createdTime: "2026-08-01T14:30:00Z",
    permalink: "https://www.linkedin.com",
    metrics: {
      impressions: 4850,
      likes: 184,
      comments: 42,
      shares: 19,
      clicks: 128,
      engagementRate: "7.7%",
    },
    status: "trending",
    growth: "+45%",
  },
  {
    id: "urn:li:share:718293819202",
    authorName: "FlowUp Inovação & Tecnologia",
    authorTitle: "Empresa de Automação & IA",
    text: "💡 O segredo para manter consistência de postagens corporativas sem sobrecarregar sua equipe de marketing.",
    imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80",
    createdTime: "2026-07-28T10:15:00Z",
    permalink: "https://www.linkedin.com",
    metrics: {
      impressions: 3210,
      likes: 112,
      comments: 26,
      shares: 8,
      clicks: 94,
      engagementRate: "6.2%",
    },
    status: "superior",
    growth: "+18%",
  },
  {
    id: "urn:li:share:718293819203",
    authorName: "FlowUp Inovação & Tecnologia",
    authorTitle: "Empresa de Automação & IA",
    text: "📊 Comunicado: Lançamos novas atualizações na plataforma NumVapt para relatórios avançados de desempenho.",
    imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80",
    createdTime: "2026-07-20T09:00:00Z",
    permalink: "https://www.linkedin.com",
    metrics: {
      impressions: 1950,
      likes: 45,
      comments: 9,
      shares: 3,
      clicks: 38,
      engagementRate: "2.9%",
    },
    status: "declining",
    growth: "-12%",
  },
];

const linkedinAiRecommendations = [
  {
    id: "li-rec-1",
    title: "Postar Artigos de Opinião de Líderes (Thought Leadership)",
    description:
      "Posts com o formato de estória corporativa ou opinião de liderança geraram 45% mais comentários no seu perfil do LinkedIn.",
    actionText: "Gerar Post B2B",
    badge: "Alta Relevância B2B",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
  },
  {
    id: "li-rec-2",
    title: "Melhor Horário para Postar no LinkedIn",
    description:
      "Seu público no LinkedIn interage com maior frequência entre terças e quintas-feiras, das 09:00 às 11:00.",
    actionText: "Agendar Post",
    badge: "Dica de Engajamento",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
];

export function LinkedInPostsViewer({ connection }: LinkedInPostsViewerProps) {
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "trending" | "declining">("all");

  const isConnected = connection?.isConnected ?? false;

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
          Conecte sua conta do LinkedIn ou Página de Empresa para visualizar métricas B2B, estatísticas de postagens e recomendações da IA NumVapt.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild className="bg-[#0077B5] hover:bg-[#005e93] text-white font-semibold shadow-sm">
            <Link href="/dashboard/conteudo">
              <Linkedin className="mr-2 h-4 w-4" />
              Conectar LinkedIn
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const filteredPosts = mockLinkedInPosts.filter((p) => {
    if (activeTab === "trending") return p.status === "trending";
    if (activeTab === "declining") return p.status === "declining";
    return true;
  });

  const totalImpressions = mockLinkedInPosts.reduce((acc, p) => acc + p.metrics.impressions, 0);
  const totalLikes = mockLinkedInPosts.reduce((acc, p) => acc + p.metrics.likes, 0);
  const totalComments = mockLinkedInPosts.reduce((acc, p) => acc + p.metrics.comments, 0);
  const totalShares = mockLinkedInPosts.reduce((acc, p) => acc + p.metrics.shares, 0);

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
                  {connection?.personName || connection?.selectedOrganizationName || "LinkedIn Profiler B2B"}
                </h3>
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                  Conectado
                </Badge>
              </div>
              <p className="text-xs text-slate-600">
                Alvo de Publicação: {connection?.publishTarget === "organization" ? "Página de Empresa" : "Perfil Pessoal"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Métricas Gerais de LinkedIn */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Impressões B2B
              </span>
              <div className="rounded-lg bg-blue-50 p-2 text-[#0077B5]">
                <Eye className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-poppins text-3xl font-bold text-slate-900">
                {totalImpressions.toLocaleString("pt-BR")}
              </span>
              <span className="flex items-center text-xs font-semibold text-emerald-600">
                <TrendingUp className="mr-0.5 h-3.5 w-3.5" /> +24%
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
              <span className="flex items-center text-xs font-semibold text-emerald-600">
                <TrendingUp className="mr-0.5 h-3.5 w-3.5" /> +31%
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Curtidas, Parabéns & Apoio</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Comentários B2B
              </span>
              <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
                <MessageCircle className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-poppins text-3xl font-bold text-slate-900">
                {totalComments.toLocaleString("pt-BR")}
              </span>
              <span className="flex items-center text-xs font-semibold text-emerald-600">
                <TrendingUp className="mr-0.5 h-3.5 w-3.5" /> +15%
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
              <span className="flex items-center text-xs font-semibold text-emerald-600">
                <TrendingUp className="mr-0.5 h-3.5 w-3.5" /> +12%
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Reposts em redes profissionais</p>
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
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => (
              <Card
                key={post.id}
                className="flex flex-col border border-slate-200 shadow-xs transition-shadow hover:shadow-md"
              >
                <CardHeader className="p-4 pb-2">
                  <div className="relative aspect-video overflow-hidden rounded-md bg-slate-100">
                    <Image
                      src={post.imageUrl}
                      alt="Thumbnail post LinkedIn"
                      fill
                      className="object-cover"
                    />
                    {post.status === "trending" && (
                      <Badge className="absolute top-2 right-2 bg-orange-500 text-white font-bold border-none">
                        <Flame className="mr-1 h-3 w-3" /> Em Alta
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-grow p-4 pt-2 space-y-3">
                  <p className="line-clamp-2 text-sm text-slate-700 font-medium">
                    {post.text}
                  </p>
                  <p className="text-xs text-slate-500">
                    Publicado em {format(new Date(post.createdTime), "dd/MM/yyyy 'às' HH:mm")}
                  </p>

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
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button
                    variant="outline"
                    className="w-full text-xs font-semibold"
                    onClick={() => {
                      setSelectedPost(post);
                      setIsModalOpen(true);
                    }}
                  >
                    <BarChart className="mr-1.5 h-3.5 w-3.5 text-[#0077B5]" />
                    Ver Insights do Post
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
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
                Insights B2B & Estratégia LinkedIn (IA NumVapt)
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
                <Button className="bg-[#0077B5] hover:bg-[#005e93] text-white text-xs font-semibold">
                  {rec.actionText} <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
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
