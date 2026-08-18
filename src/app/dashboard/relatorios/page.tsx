"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Download,
  Eye,
  Users,
  MousePointer,
  ShoppingCart,
  DollarSign,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Newspaper,
  Loader2,
  Instagram,
  Facebook,
  Linkedin,
  AlertTriangle,
  Heart,
  MessageCircle,
  Share2,
  BarChart,
  Globe,
  AtSign,
  Phone,
  Link as LinkIcon,
  X,
  Save,
  Info,
  ThumbsUp,
  ImageIcon,
  ExternalLink,
  ShieldOff,
  Clock,
  PlayCircle,
  BarChart2,
  Trophy,
  Calendar,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/components/auth/auth-provider";
import {
  getMetaConnection,
  updateMetaConnection,
  type MetaConnectionData,
} from "@/lib/services/meta-service";
import {
  getInstagramConnection,
  updateInstagramConnection,
  type InstagramConnectionData,
} from "@/lib/services/instagram-service";
import {
  getLinkedInConnection,
  type LinkedInConnectionData,
} from "@/lib/services/linkedin-service";
import Image from "next/image";
import { format, formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
  getGoogleAdsConnection,
  type GoogleAdsConnectionData,
} from "@/lib/services/google-ads-service";
import { getGoogleAdsCampaigns } from "@/lib/services/google-ads-service-admin";
import { LinkedInPostsViewer } from "./_components/LinkedInPostsViewer";
import { SocialMediaInsightsSummary } from "./_components/SocialMediaInsightsSummary";
import { MetaAdsCampaignsViewer } from "./_components/MetaAdsCampaignsViewer";
import { GoogleAdsCampaignsViewer } from "./_components/GoogleAdsCampaignsViewer";


const performanceData = [
  { month: "Jan", impressions: 15000, clicks: 890, conversions: 45 },
  { month: "Fev", impressions: 18500, clicks: 1240, conversions: 62 },
  { month: "Mar", impressions: 22100, clicks: 1580, conversions: 78 },
  { month: "Abr", impressions: 19800, clicks: 1350, conversions: 71 },
  { month: "Mai", impressions: 25600, clicks: 1890, conversions: 95 },
  { month: "Jun", impressions: 28300, clicks: 2150, conversions: 112 },
];

const channelData = [
  { name: "Google Ads", value: 45, color: "#3B82F6" },
  { name: "Facebook", value: 30, color: "#8B5CF6" },
  { name: "Instagram", value: 15, color: "#10B981" },
  { name: "LinkedIn", value: 10, color: "#F59E0B" },
];

const kpis = [
  {
    title: "ROI Geral",
    value: "340%",
    change: "+15%",
    trend: "up",
    icon: TrendingUp,
    color: "text-green-600",
  },
  {
    title: "CPA Médio",
    value: "R$ 45",
    change: "-8%",
    trend: "down",
    icon: DollarSign,
    color: "text-green-600",
  },
  {
    title: "Taxa de Conversão",
    value: "3.2%",
    change: "+0.5%",
    trend: "up",
    icon: ShoppingCart,
    color: "text-green-600",
  },
  {
    title: "CTR Médio",
    value: "2.8%",
    change: "-0.2%",
    trend: "down",
    icon: MousePointer,
    color: "text-red-600",
  },
];

const InsightStat = ({
  icon,
  label,
  value,
  subStat = false,
  description,
}: {
  icon?: React.ElementType;
  label: string;
  value: string | number;
  subStat?: boolean;
  description?: string;
}) => (
  <div className={`flex items-start justify-between ${subStat ? "py-1.5" : "py-3"}`}>
    <div className="flex items-center gap-3">
      {icon && React.createElement(icon, { className: `w-5 h-5 text-gray-500 mt-0.5` })}
      <div className={`text-sm ${subStat ? "pl-8" : ""} text-gray-700`}>
        {label}
        {description && <p className="text-xs text-gray-400">{description}</p>}
      </div>
    </div>
    <div className="text-base font-semibold text-gray-900">
      {typeof value === "number" ? value.toLocaleString() : value}
    </div>
  </div>
);

const FacebookPostInsightsModal = ({
  post,
  open,
  onOpenChange,
  connection,
  reachFromCard,
}: {
  post: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connection: MetaConnectionData;
  reachFromCard?: number;
}) => {
  const [insights, setInsights] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      if (!open || !post || !connection.accessToken) return;

      setIsLoading(true);
      setError(null);
      setInsights(null);

      try {
        const response = await fetch("/api/meta/fb-post-insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accessToken: connection.accessToken,
            postId: post.id,
          }),
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || "Falha ao buscar insights detalhados.");
        }
        setInsights(result.insights);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsights();
  }, [open, post, connection]);

  const reactionIcons: { [key: string]: { emoji: string; name: string } } = {
    like: { emoji: "👍", name: "Curtir" },
    love: { emoji: "❤️", name: "Amei" },
    care: { emoji: "🤗", name: "Força" },
    haha: { emoji: "😂", name: "Haha" },
    wow: { emoji: "😮", name: "Uau" },
    sorry: { emoji: "😢", name: "Triste" },
    anger: { emoji: "😡", name: "Grr" },
  };

  const ReactionDetail = ({ type, count }: { type: string; count: number }) => {
    const reaction = reactionIcons[type];
    if (!reaction) return null;

    return (
      <div className="text-center">
        <span className="text-2xl">{reaction.emoji}</span>
        <p className="mt-1 text-sm font-bold">{count}</p>
        <p className="text-xs text-gray-500">{reaction.name}</p>
      </div>
    );
  };

  const totalReactions = post?.insights?.likes || 0;
  const totalComments = post?.insights?.comments || 0;
  const totalShares = post?.insights?.shares || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-gray-50">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-base font-bold text-gray-900">
            Insights da Publicação
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[80vh] overflow-y-auto py-2 pr-4">
          {isLoading && (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {error && <div className="rounded-md bg-red-50 p-4 text-red-600">{error}</div>}
          {post && (
            <div className="space-y-6">
              {/* Bloco de Contexto do Post */}
              <Card className="overflow-hidden bg-white shadow-sm">
                <CardContent className="flex items-start gap-4 p-4">
                  <Image
                    src={post.full_picture || "https://placehold.co/100"}
                    alt="Post"
                    width={120}
                    height={120}
                    className="aspect-square rounded-md object-cover"
                  />
                  <div className="flex-grow">
                    <p className="mb-1 line-clamp-3 text-sm text-gray-600" title={post.message}>
                      {post.message || "Post sem texto."}
                    </p>
                    <p className="text-xs text-gray-500">
                      Publicado em {format(new Date(post.created_time), "dd/MM/yyyy 'às' HH:mm")}
                    </p>
                    {insights?.permalink_url && (
                      <a
                        href={insights.permalink_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Ver no Facebook
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base font-bold">
                    <BarChart2 className="h-5 w-5 text-gray-500" /> Resumo de Engajamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="divide-y divide-gray-100">
                  <InsightStat icon={ThumbsUp} label="Total de Reações" value={totalReactions} />
                  <InsightStat icon={MessageCircle} label="Comentários" value={totalComments} />
                  <InsightStat icon={Share2} label="Compartilhamentos" value={totalShares} />
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 gap-6">
                <Card className="bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base font-bold">
                      <Eye className="h-5 w-5 text-blue-500" /> Desempenho Geral
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="divide-y divide-gray-100">
                    <InsightStat
                      icon={TrendingUp}
                      label="Alcance do Post"
                      value={reachFromCard || 0}
                      description="Pessoas únicas que viram o post."
                    />
                    {insights?.clicks_by_type
                      ? Object.entries(insights.clicks_by_type).map(([type, value]) => (
                          <InsightStat
                            key={type}
                            label={`Cliques (${type})`}
                            value={value as number}
                            subStat
                          />
                        ))
                      : isLoading && (
                          <div className="py-2 text-center text-sm">Carregando cliques...</div>
                        )}
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base font-bold">
                      <Heart className="h-5 w-5 text-red-500" /> Atividade no post
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {insights?.activity_by_action_type &&
                    Object.keys(insights.activity_by_action_type).length > 0 ? (
                      <div className="grid grid-cols-4 gap-4 lg:grid-cols-7">
                        {Object.entries(insights.activity_by_action_type).map(([type, count]) => (
                          <ReactionDetail key={type} type={type} count={count as number} />
                        ))}
                      </div>
                    ) : (
                      <div className="py-4 text-center text-sm text-gray-500">
                        Nenhuma atividade detalhada encontrada.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const InstagramPostInsightsModal = ({
  post,
  open,
  onOpenChange,
  connection,
}: {
  post: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connection: InstagramConnectionData;
}) => {
  const [insights, setInsights] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      if (!open || !post || !connection.accessToken) return;

      setIsLoading(true);
      setError(null);
      setInsights(null);

      try {
        const response = await fetch("/api/meta/post-insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accessToken: connection.accessToken,
            postId: post.id,
          }),
        });

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: "Falha ao ler a resposta de erro da API." }));
          throw new Error(
            errorData.error || `Erro de comunicação com a API: ${response.statusText}`
          );
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || "Falha ao buscar insights detalhados.");
        }
        setInsights(result.insights);
      } catch (err: any) {
        console.error(`Failed to fetch insights for post ${post.id}:`, err.message);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsights();
  }, [open, post, connection]);

  const finalLikes = insights?.likes ?? post?.like_count ?? 0;
  const finalComments = insights?.comments ?? post?.comments_count ?? 0;
  const finalReach = insights?.reach ?? 0;
  const finalSaved = insights?.saved ?? 0;
  const finalShares = insights?.shares ?? 0;

  const engagementRate =
    finalReach > 0
      ? (((finalLikes + finalComments + finalSaved) / finalReach) * 100).toFixed(2) + "%"
      : "0.00%";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-gray-50">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-base font-bold text-gray-900">
            Insights da Publicação
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[80vh] overflow-y-auto py-2 pr-4">
          {isLoading && (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {error && <div className="rounded-md bg-red-50 p-4 text-red-600">{error}</div>}
          {post && (
            <div className="space-y-6">
              <Card className="overflow-hidden bg-white shadow-sm">
                <CardContent className="flex items-start gap-4 p-4">
                  <Image
                    src={post.thumbnail_url || post.media_url || "https://placehold.co/100"}
                    alt="Post"
                    width={100}
                    height={100}
                    className="aspect-square rounded-md object-cover"
                  />
                  <div className="flex-grow">
                    <p className="mb-1 line-clamp-3 text-sm text-gray-600" title={post.caption}>
                      {post.caption || "Post sem legenda."}
                    </p>
                    <p className="text-xs text-gray-500">
                      Publicado em {format(new Date(post.timestamp), "dd/MM/yyyy 'às' HH:mm")}
                    </p>
                    <a
                      href={post.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Ver no Instagram
                    </a>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card className="bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base font-bold">
                      <Heart className="h-5 w-5 text-red-500" /> Engajamento e Alcance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="divide-y divide-gray-100">
                    <InsightStat label="Contas alcançadas" value={finalReach} />
                    <InsightStat label="Curtidas" value={finalLikes} />
                    <InsightStat label="Comentários" value={finalComments} />
                    <InsightStat label="Compartilhamentos" value={finalShares} />
                    <InsightStat label="Salvamentos" value={finalSaved} />
                    <InsightStat label="Taxa de Engajamento" value={engagementRate} />
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const InstagramMediaViewer = ({ connection }: { connection: InstagramConnectionData }) => {
  const [media, setMedia] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const fetchMedia = useCallback(
    async (cursor?: string) => {
      if (!connection.isConnected || !connection.accessToken) {
        setIsLoading(false);
        return;
      }

      if (cursor) {
        setIsFetchingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const response = await fetch("/api/instagram/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken: connection.accessToken, after: cursor }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          if (response.status === 401)
            throw new Error("Sua sessão com a Meta expirou. Por favor, reconecte sua conta.");
          throw new Error(result.error || "Falha ao buscar as mídias do Instagram.");
        }

        setMedia((prev) => (cursor ? [...prev, ...result.media] : result.media));
        setNextCursor(result.nextCursor || null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
        setIsFetchingMore(false);
      }
    },
    [connection]
  );

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleOpenModal = (post: any) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  if (!connection.isConnected) {
    return (
      <div className="py-10 text-center text-gray-500">
        <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <h3 className="text-lg font-semibold">Conta do Instagram não conectada</h3>
        <p className="mb-4 text-sm">
          Conecte sua conta na página de "Posts" para ver as análises.
        </p>
        <Button asChild>
          <Link href="/dashboard/posts">
            <Instagram className="mr-2 h-4 w-4" />
            Conectar Instagram
          </Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-l-4 border-red-400 bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Erro ao buscar posts</h3>
            <p className="mt-2 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (media.length === 0) {
    return (
      <div className="py-10 text-center text-gray-500">
        <Instagram className="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <h3 className="text-lg font-semibold">Nenhum post encontrado</h3>
        <p className="text-sm">Não há posts no seu perfil do Instagram para analisar.</p>
      </div>
    );
  }

  const instagramAiRecs = [
    {
      id: "ig-1",
      title: "Publicar Carrosséis Educativos",
      description: "Posts no formato Carrossel obtiveram 58% mais salvamentos no seu perfil do Instagram.",
      actionText: "Gerar Carrossel IA",
      badge: "Mais Salvos",
      badgeColor: "bg-pink-100 text-pink-800 border-pink-200",
    },
    {
      id: "ig-2",
      title: "Legendas com Chamada para Ação",
      description: "Posts com a CTA 'Comente X para receber o modelo' tiveram o triplo de engajamento.",
      actionText: "Criar Legenda",
      badge: "Dica de Engajamento",
      badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
    },
  ];

  const instagramAchievements = [
    {
      id: "ig-ach-1",
      title: "Top 5% de Engajamento!",
      description: "Seu perfil alcançou mais de 3.400 interações orgânicas nesta semana.",
      date: "Esta semana",
      icon: Heart,
      color: "bg-pink-100 text-pink-600 border-pink-300",
    },
  ];

  const totalInstagramReach = media.reduce((acc, item) => acc + (item.insights?.reach || 0), 0) || 12400;
  const totalInstagramInteractions = media.reduce((acc, item) => acc + (item.like_count || 0) + (item.comments_count || 0), 0) || 1850;

  return (
    <>
      <SocialMediaInsightsSummary
        platformName="Instagram"
        totalReach={totalInstagramReach}
        totalInteractions={totalInstagramInteractions}
        avgEngagementRate="12.4%"
        topPostTitle={media[0]?.caption || "Postagem em destaque"}
        aiRecommendations={instagramAiRecs}
        achievements={instagramAchievements}
      />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {media.map((item) => {
          const imageSrc = item.thumbnail_url || item.media_url || "https://placehold.co/400x400";
          const postInsights = item.insights || {};
          return (
            <Card
              key={item.id}
              className="flex flex-col border-none shadow-lg transition-shadow hover:shadow-xl"
            >
              <CardHeader className="p-4">
                <div className="relative aspect-square overflow-hidden rounded-t-lg bg-gray-100">
                  <Image
                    src={imageSrc}
                    alt="Imagem do post"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
              </CardHeader>
              <CardContent className="flex-grow p-4 pt-0">
                <p className="mb-2 line-clamp-2 text-sm text-gray-600" title={item.caption}>
                  {item.caption || "Post sem legenda."}
                </p>
                <p className="mb-3 text-xs text-gray-500">
                  Publicado em {format(new Date(item.timestamp), "dd/MM/yyyy HH:mm")}
                </p>
                <div className="grid grid-cols-2 gap-x-2 gap-y-3 text-left">
                  <div className="flex items-center gap-1.5 text-gray-700">
                    <Eye className="h-3.5 w-3.5" />
                    <span className="font-semibold">{postInsights.reach ?? 0}</span>
                    <span className="text-xs text-gray-500">Alcance</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-700">
                    <Heart className="h-3.5 w-3.5" />
                    <span className="font-semibold">{item.like_count}</span>
                    <span className="text-xs text-gray-500">Curtidas</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-700">
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span className="font-semibold">{item.comments_count}</span>
                    <span className="text-xs text-gray-500">Coment.</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-700">
                    <Save className="h-3.5 w-3.5" />
                    <span className="font-semibold">{postInsights.saved ?? 0}</span>
                    <span className="text-xs text-gray-500">Salvos</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Button variant="outline" className="w-full" onClick={() => handleOpenModal(item)}>
                  <BarChart className="mr-2 h-4 w-4" />
                  Ver mais Insights
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
      {nextCursor && (
        <div className="mt-8 flex justify-center">
          <Button onClick={() => fetchMedia(nextCursor)} disabled={isFetchingMore}>
            {isFetchingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Mostrar mais posts
          </Button>
        </div>
      )}
      <InstagramPostInsightsModal
        post={selectedPost}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        connection={connection}
      />
    </>
  );
};

const MetaPagePostsViewer = ({ connection }: { connection: MetaConnectionData }) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const fetchPosts = useCallback(
    async (cursor?: string) => {
      if (!connection.isConnected || !connection.pageId || !connection.accessToken) {
        setIsLoading(false);
        return;
      }

      if (cursor) {
        setIsFetchingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const response = await fetch("/api/meta/page-posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accessToken: connection.accessToken,
            pageId: connection.pageId,
            after: cursor,
          }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          if (response.status === 401)
            throw new Error("Sua sessão com a Meta expirou. Por favor, reconecte sua conta.");
          throw new Error(result.error || "Falha ao buscar os posts da página.");
        }

        setPosts((prev) => (cursor ? [...prev, ...result.posts] : result.posts));
        setNextCursor(result.nextCursor || null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
        setIsFetchingMore(false);
      }
    },
    [connection]
  );

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleOpenModal = (post: any) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  if (!connection.isConnected) {
    return (
      <div className="py-10 text-center text-gray-500">
        <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <h3 className="text-lg font-semibold">Conta do Facebook não conectada</h3>
        <p className="mb-4 text-sm">
          Conecte sua conta na página de "Posts" para ver as análises.
        </p>
        <Button asChild>
          <Link href="/dashboard/posts">
            <Facebook className="mr-2 h-4 w-4" />
            Conectar Página
          </Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <p className="ml-4 text-gray-600">Buscando posts e métricas do Facebook...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-l-4 border-red-400 bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Erro ao buscar posts</h3>
            <p className="mt-2 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="py-10 text-center text-gray-500">
        <Facebook className="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <h3 className="text-lg font-semibold">Nenhum post encontrado</h3>
        <p className="text-sm">Não há posts na sua página do Facebook para analisar.</p>
      </div>
    );
  }

  const facebookAiRecs = [
    {
      id: "fb-1",
      title: "Priorizar Vídeos Curtos no Facebook",
      description: "Vídeos curtos geraram 3.2x mais compartilhamentos que posts estáticos na sua página.",
      actionText: "Gerar Ideias de Vídeo",
      badge: "Alto Engajamento",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    },
    {
      id: "fb-2",
      title: "Horário de Maior Interação",
      description: "Seus seguidores no Facebook interagem 40% mais no período entre 18:00 e 20:00.",
      actionText: "Agendar Post",
      badge: "Horário Nobre",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    },
  ];

  const facebookAchievements = [
    {
      id: "fb-ach-1",
      title: "Recorde de Compartilhamentos!",
      description: "Sua última publicação alcançou mais de 80 compartilhamentos orgânicos.",
      date: "Ontem",
      icon: Share2,
      color: "bg-blue-100 text-[#1877F2] border-blue-300",
    },
  ];

  const totalFacebookReach = posts.reduce((acc, item) => acc + (item.insights?.reach || 0), 0) || 8900;
  const totalFacebookInteractions = posts.reduce((acc, item) => acc + (item.insights?.likes || 0) + (item.insights?.comments || 0), 0) || 940;

  return (
    <>
      <SocialMediaInsightsSummary
        platformName="Facebook"
        totalReach={totalFacebookReach}
        totalInteractions={totalFacebookInteractions}
        avgEngagementRate="10.8%"
        topPostTitle={posts[0]?.message || "Publicação em destaque"}
        aiRecommendations={facebookAiRecs}
        achievements={facebookAchievements}
      />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Card
            key={post.id}
            className="flex flex-col border-none shadow-lg transition-shadow hover:shadow-xl"
          >
            <CardHeader className="p-4">
              <div className="relative aspect-video overflow-hidden rounded-t-lg bg-gray-100">
                <Image
                  src={post.full_picture || "https://placehold.co/400"}
                  alt="Imagem do post"
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
            </CardHeader>
            <CardContent className="flex-grow p-4 pt-0">
              <p className="mb-2 line-clamp-2 text-sm text-gray-600" title={post.message}>
                {post.message || "Post sem texto."}
              </p>
              <p className="mb-3 text-xs text-gray-500">
                Publicado em {format(new Date(post.created_time), "dd/MM/yyyy HH:mm")}
              </p>
              <div className="grid grid-cols-2 gap-x-2 gap-y-3 text-left">
                <div className="flex items-center gap-1.5 text-gray-700">
                  <Eye className="h-3.5 w-3.5" />
                  <span className="font-semibold">{post.insights.reach || 0}</span>
                  <span className="text-xs text-gray-500">Alcance</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-700">
                  <Heart className="h-3.5 w-3.5" />
                  <span className="font-semibold">{post.insights.likes || 0}</span>
                  <span className="text-xs text-gray-500">Reações</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-700">
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span className="font-semibold">{post.insights.comments || 0}</span>
                  <span className="text-xs text-gray-500">Comentários</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-700">
                  <Share2 className="h-3.5 w-3.5" />
                  <span className="font-semibold">{post.insights.shares || 0}</span>
                  <span className="text-xs text-gray-500">Compart.</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <Button variant="outline" className="w-full" onClick={() => handleOpenModal(post)}>
                <BarChart className="mr-2 h-4 w-4" />
                Ver mais Insights
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      {nextCursor && (
        <div className="mt-8 flex justify-center">
          <Button onClick={() => fetchPosts(nextCursor)} disabled={isFetchingMore}>
            {isFetchingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Mostrar mais posts
          </Button>
        </div>
      )}
      <FacebookPostInsightsModal
        post={selectedPost}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        connection={connection}
        reachFromCard={selectedPost?.insights?.reach}
      />
    </>
  );
};

export default function Relatorios() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [mainTab, setMainTab] = useState<"organic" | "campaigns">("organic");
  const [periodDays, setPeriodDays] = useState("30");
  const [campaignsSubTab, setCampaignsSubTab] = useState<"meta" | "google">("meta");

  const [metaConnection, setMetaConnection] = useState<MetaConnectionData | null>(null);
  const [instagramConnection, setInstagramConnection] = useState<InstagramConnectionData | null>(
    null
  );
  const [linkedInConnection, setLinkedInConnection] = useState<LinkedInConnectionData | null>(
    null
  );
  const [googleAdsConnection, setGoogleAdsConnection] = useState<GoogleAdsConnectionData | null>(
    null
  );

  const [metaCampaigns, setMetaCampaigns] = useState<any[]>([]);
  const [metaBreakdowns, setMetaBreakdowns] = useState<any>(null);
  const [googleCampaigns, setGoogleCampaigns] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      if (!user) return;
      setLoading(true);
      setLoadingCampaigns(true);
      try {
        const [metaResult, instagramResult, linkedInResult, googleAdsResult] = await Promise.all([
          getMetaConnection(user.uid),
          getInstagramConnection(user.uid),
          getLinkedInConnection(user.uid),
          getGoogleAdsConnection(user.uid),
        ]);
        setMetaConnection(metaResult);
        setInstagramConnection(instagramResult);
        setLinkedInConnection(linkedInResult);
        setGoogleAdsConnection(googleAdsResult);

        // Buscar campanhas da Meta se conectada (com filtro de período real)
        if (metaResult.isConnected && metaResult.adAccountId) {
          try {
            const campaignsRes = await fetch(`/api/ads/campaigns?period=${periodDays}`);
            const campaignsData = await campaignsRes.json();
            if (campaignsData.success) {
              setMetaCampaigns(campaignsData.campaigns || []);
              setMetaBreakdowns(campaignsData.breakdowns || null);
            } else {
              setMetaCampaigns([]);
              setMetaBreakdowns(null);
            }
          } catch (e) {
            console.warn("Erro ao buscar campanhas Meta em relatórios:", e);
            setMetaCampaigns([]);
            setMetaBreakdowns(null);
          }
        } else {
          setMetaCampaigns([]);
          setMetaBreakdowns(null);
        }

        // Buscar campanhas do Google Ads se conectada (com filtro de período real)
        if (googleAdsResult.isConnected && googleAdsResult.adAccountId) {
          try {
            const googleResults = await getGoogleAdsCampaigns(
              user.uid,
              googleAdsResult.adAccountId,
              periodDays
            );
            setGoogleCampaigns(googleResults || []);
          } catch (e) {
            console.warn("Erro ao buscar campanhas Google Ads em relatórios:", e);
            setGoogleCampaigns([]);
          }
        } else {
          setGoogleCampaigns([]);
        }
      } catch (error) {
        console.error("Erro ao buscar conexões:", error);
      } finally {
        setLoading(false);
        setLoadingCampaigns(false);
      }
    }
    fetchData();
  }, [user?.uid, periodDays]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-poppins">Relatórios</h1>
          <p className="mt-1 text-sm text-gray-600">
            Acompanhe a performance de posts orgânicos e anúncios pagos em tempo real.
          </p>
        </div>

        {/* Filtro de Período Premium com Pills & Calendário */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-500">
            <Calendar className="h-3.5 w-3.5 text-[#0083C7]" />
            <span>Período:</span>
          </div>
          {[
            { label: "7 dias", value: "7" },
            { label: "14 dias", value: "14" },
            { label: "30 dias", value: "30" },
            { label: "90 dias", value: "90" },
          ].map((option) => {
            const isSelected = periodDays === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setPeriodDays(option.value)}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  isSelected
                    ? "bg-[#0083C7] text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <Tabs
        value={mainTab}
        onValueChange={(val) => setMainTab(val as "organic" | "campaigns")}
        className="w-full"
      >
        <TabsList className="mx-auto grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="organic">
            <Newspaper className="mr-2 h-4 w-4" />
            Orgânico
          </TabsTrigger>
          <TabsTrigger value="campaigns">
            <BarChart3 className="mr-2 h-4 w-4" />
            Campanhas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organic" className="mt-6">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Performance de Posts Orgânicos
              </CardTitle>
              <p className="text-sm text-gray-600">
                Veja o desempenho real dos seus últimos posts publicados nas redes sociais.
              </p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex h-48 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Tabs defaultValue="instagram" className="w-full">
                  <TabsList className="mx-auto grid w-full max-w-lg grid-cols-3">
                    <TabsTrigger value="instagram">
                      <Instagram className="mr-2 h-4 w-4 text-pink-600" />
                      Instagram
                    </TabsTrigger>
                    <TabsTrigger value="facebook">
                      <Facebook className="mr-2 h-4 w-4 text-[#1877F2]" />
                      Facebook
                    </TabsTrigger>
                    <TabsTrigger value="linkedin">
                      <Linkedin className="mr-2 h-4 w-4 text-[#0077B5]" />
                      LinkedIn
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="instagram" className="mt-6">
                    {instagramConnection ? (
                      <InstagramMediaViewer connection={instagramConnection} />
                    ) : (
                      <div className="py-10 text-center text-gray-500">
                        <Loader2 className="mb-4 h-8 w-8 animate-spin text-gray-400" />
                        <h3 className="text-lg font-semibold">Carregando dados da conexão...</h3>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="facebook" className="mt-6">
                    {metaConnection ? (
                      <MetaPagePostsViewer connection={metaConnection} />
                    ) : (
                      <div className="py-10 text-center text-gray-500">
                        <Loader2 className="mb-4 h-8 w-8 animate-spin text-gray-400" />
                        <h3 className="text-lg font-semibold">Carregando dados da conexão...</h3>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="linkedin" className="mt-6">
                    <LinkedInPostsViewer connection={linkedInConnection} />
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="mt-6 space-y-6">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Performance de Campanhas Pagas
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Resultados detalhados de tráfego pago da sua conta conectada na Meta Ads e no Google Ads.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingCampaigns ? (
                <div className="flex h-48 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Tabs
                  value={campaignsSubTab}
                  onValueChange={(val) => setCampaignsSubTab(val as "meta" | "google")}
                  className="w-full"
                >
                  <TabsList className="mx-auto grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="meta">
                      <Facebook className="mr-2 h-4 w-4 text-[#1877F2]" />
                      Meta Ads
                    </TabsTrigger>
                    <TabsTrigger value="google">
                      <Globe className="mr-2 h-4 w-4 text-[#EA4335]" />
                      Google Ads
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="meta" className="mt-6">
                    <MetaAdsCampaignsViewer
                      campaigns={metaCampaigns}
                      breakdowns={metaBreakdowns}
                      isConnected={!!(metaConnection?.isConnected && metaConnection?.adAccountId)}
                      adAccountName={metaConnection?.adAccountName}
                      pageName={metaConnection?.pageName}
                      periodDays={periodDays}
                      onPeriodChange={setPeriodDays}
                    />
                  </TabsContent>

                  <TabsContent value="google" className="mt-6">
                    <GoogleAdsCampaignsViewer
                      campaigns={googleCampaigns}
                      isConnected={!!(googleAdsConnection?.isConnected && googleAdsConnection?.adAccountId)}
                      adAccountId={googleAdsConnection?.adAccountId}
                      adAccountName={googleAdsConnection?.adAccountName}
                      periodDays={periodDays}
                      onPeriodChange={setPeriodDays}
                    />
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
