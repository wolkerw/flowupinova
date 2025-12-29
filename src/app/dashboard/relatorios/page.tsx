

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/components/auth/auth-provider";
import { getMetaConnection, type MetaConnectionData } from "@/lib/services/meta-service";
import { getInstagramConnection, type InstagramConnectionData } from "@/lib/services/instagram-service";
import Image from "next/image";
import { format, formatDistanceToNowStrict } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const performanceData = [
    { month: 'Jan', impressions: 15000, clicks: 890, conversions: 45 },
    { month: 'Fev', impressions: 18500, clicks: 1240, conversions: 62 },
    { month: 'Mar', impressions: 22100, clicks: 1580, conversions: 78 },
    { month: 'Abr', impressions: 19800, clicks: 1350, conversions: 71 },
    { month: 'Mai', impressions: 25600, clicks: 1890, conversions: 95 },
    { month: 'Jun', impressions: 28300, clicks: 2150, conversions: 112 }
  ];

const channelData = [
    { name: 'Google Ads', value: 45, color: '#3B82F6' },
    { name: 'Facebook', value: 30, color: '#8B5CF6' },
    { name: 'Instagram', value: 15, color: '#10B981' },
    { name: 'LinkedIn', value: 10, color: '#F59E0B' }
];

const kpis = [
    {
      title: "ROI Geral",
      value: "340%",
      change: "+15%",
      trend: "up",
      icon: TrendingUp,
      color: "text-green-600"
    },
    {
      title: "CPA Médio",
      value: "R$ 45",
      change: "-8%",
      trend: "down",
      icon: DollarSign,
      color: "text-green-600"
    },
    {
      title: "Taxa de Conversão",
      value: "3.2%",
      change: "+0.5%",
      trend: "up",
      icon: ShoppingCart,
      color: "text-green-600"
    },
    {
      title: "CTR Médio",
      value: "2.8%",
      change: "-0.2%",
      trend: "down",
      icon: MousePointer,
      color: "text-red-600"
    }
];

const InsightStat = ({ icon, label, value, subStat = false, description }: { icon?: React.ElementType, label: string, value: string | number, subStat?: boolean, description?: string }) => (
    <div className={`flex items-start justify-between ${subStat ? 'py-1.5' : 'py-3'}`}>
        <div className="flex items-center gap-3">
            {icon && React.createElement(icon, { className: `w-5 h-5 text-gray-500 mt-0.5` })}
            <div className={`text-sm ${subStat ? 'pl-8' : ''} text-gray-700`}>
                {label}
                {description && <p className="text-xs text-gray-400">{description}</p>}
            </div>
        </div>
        <div className="font-semibold text-gray-900 text-base">{typeof value === 'number' ? value.toLocaleString() : value}</div>
    </div>
);


const FacebookPostInsightsModal = ({ post, open, onOpenChange, connection }: { post: any | null, open: boolean, onOpenChange: (open: boolean) => void, connection: MetaConnectionData }) => {
    const [insights, setInsights] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const reactionIcons: { [key: string]: React.ReactElement } = {
        like: <ThumbsUp className="w-5 h-5 text-blue-500" />,
        love: <Heart className="w-5 h-5 text-red-500 fill-current" />,
        wow: <div className="text-lg">😮</div>,
        haha: <div className="text-lg">😂</div>,
        sorry: <div className="text-lg">😢</div>,
        anger: <div className="text-lg">😡</div>,
    };

    useEffect(() => {
        const fetchInsights = async () => {
            if (!open || !post || !connection.accessToken) return;

            setIsLoading(true);
            setError(null);
            setInsights(null);

            try {
                 const response = await fetch('/api/meta/fb-post-insights', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        accessToken: connection.accessToken,
                        postId: post.id 
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
    
    // Calculated metrics
    const ctr = (insights?.impressions ?? 0) > 0 ? (((insights?.clicks ?? 0) / insights.impressions) * 100).toFixed(2) + '%' : '0.00%';
    const engagementRate = (insights?.reach ?? 0) > 0 ? (((insights?.engaged_users ?? 0) / insights.reach) * 100).toFixed(2) + '%' : '0.00%';
    const reactions = insights?.reactions_detail || {};
    const totalReactions = Object.values(reactions).reduce((acc: any, value: any) => acc + value, 0);

    return (
         <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-gray-50">
                <DialogHeader className="border-b pb-4">
                     <DialogTitle className="text-base font-bold text-gray-900">Insights da Publicação</DialogTitle>
                </DialogHeader>
                <div className="py-2 max-h-[80vh] overflow-y-auto pr-4">
                    {isLoading && <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>}
                    {error && <div className="text-red-600 bg-red-50 p-4 rounded-md">{error}</div>}
                    {insights && post && (
                        <div className="space-y-6">
                           
                            {/* Bloco de Contexto do Post */}
                            <Card className="bg-white overflow-hidden shadow-sm">
                                <CardContent className="p-4 flex gap-4 items-start">
                                    <Image src={post.full_picture || 'https://placehold.co/100'} alt="Post" width={120} height={120} className="rounded-md object-cover aspect-square"/>
                                    <div className="flex-grow">
                                        <p className="text-sm text-gray-600 line-clamp-3 mb-1" title={post.message}>{post.message || "Post sem texto."}</p>
                                        <p className="text-xs text-gray-500">Publicado em {format(new Date(post.created_time), "dd/MM/yyyy 'às' HH:mm")}</p>
                                        {insights.permalink_url && (
                                            <a href={insights.permalink_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-2">
                                                <ExternalLink className="w-3 h-3"/>
                                                Ver no Facebook
                                            </a>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                            
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card className="bg-white shadow-sm md:col-span-1">
                                     <CardHeader>
                                        <CardTitle className="text-base font-bold flex items-center gap-2"><Eye className="w-5 h-5 text-blue-500" /> Alcance e Impressões</CardTitle>
                                    </CardHeader>
                                    <CardContent className="divide-y divide-gray-100">
                                            <InsightStat icon={Users} label="Alcance Total" value={insights.reach || 0} description="Pessoas únicas que viram"/>
                                            <InsightStat icon={TrendingUp} label="Impressões Totais" value={insights.impressions || 0} description="Total de visualizações"/>
                                            <div className="pt-3 space-y-2">
                                                <Label className="text-xs text-gray-500">Alcance Orgânico ({insights.reach_organic || 0})</Label>
                                                <Progress value={((insights.reach_organic || 0) / (insights.reach || 1)) * 100} className="h-2"/>
                                            </div>
                                             <div className="pt-3 space-y-2">
                                                <Label className="text-xs text-gray-500">Impressões Orgânicas ({insights.impressions_organic || 0})</Label>
                                                <Progress value={((insights.impressions_organic || 0) / (insights.impressions || 1)) * 100} className="h-2"/>
                                            </div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-white shadow-sm md:col-span-1">
                                    <CardHeader>
                                        <CardTitle className="text-base font-bold flex items-center gap-2"><MousePointer className="w-5 h-5 text-green-500" /> Cliques e Engajamento</CardTitle>
                                    </CardHeader>
                                    <CardContent className="divide-y divide-gray-100">
                                         <InsightStat icon={MousePointer} label="Cliques no post" value={insights.clicks || 0} />
                                         <InsightStat icon={BarChart2} label="Taxa de Cliques (CTR)" value={ctr} />
                                         <InsightStat icon={Users} label="Pessoas engajadas" value={insights.engaged_users || 0} />
                                         <InsightStat icon={BarChart2} label="Taxa de Engajamento" value={engagementRate} />
                                    </CardContent>
                                </Card>
                               <Card className="bg-white shadow-sm md:col-span-1">
                                    <CardHeader>
                                        <CardTitle className="text-base font-bold flex items-center gap-2"><Heart className="w-5 h-5 text-red-500" /> Interações e Reações</CardTitle>
                                    </CardHeader>
                                    <CardContent className="divide-y divide-gray-100">
                                        <InsightStat icon={MessageCircle} label="Comentários" value={insights.comments || 0} />
                                        <InsightStat icon={Share2} label="Compartilhamentos" value={insights.shares || 0} />
                                        <div className="grid grid-cols-3 gap-y-2 gap-x-4 pt-3">
                                            {Object.entries(reactionIcons).map(([key, icon]) => (
                                                <div key={key} className="flex items-center gap-1.5">
                                                    {icon}
                                                    <span className="font-semibold text-sm text-gray-800">{reactions[key] || 0}</span>
                                                </div>
                                            ))}
                                        </div>
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


const InstagramPostInsightsModal = ({ post, open, onOpenChange, connection }: { post: any | null, open: boolean, onOpenChange: (open: boolean) => void, connection: InstagramConnectionData }) => {
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
                const response = await fetch('/api/meta/post-insights', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        accessToken: connection.accessToken,
                        postId: post.id 
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

    const engagementRate = (insights?.reach ?? 0) > 0 ? (((insights?.total_interactions ?? 0) / insights.reach) * 100).toFixed(2) + '%' : '0.00%';
    const isReel = post?.media_product_type === 'REELS' || post?.media_type === 'VIDEO';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-gray-50">
                <DialogHeader className="border-b pb-4">
                     <DialogTitle className="text-base font-bold text-gray-900">Insights da Publicação</DialogTitle>
                </DialogHeader>

                <div className="py-2 max-h-[80vh] overflow-y-auto pr-4">
                    {isLoading && <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>}
                    {error && <div className="text-red-600 bg-red-50 p-4 rounded-md">{error}</div>}
                    {insights && post && (
                         <div className="space-y-6">
                            
                            <Card className="bg-white overflow-hidden shadow-sm">
                                <CardContent className="p-4 flex gap-4 items-start">
                                    <Image src={post.thumbnail_url || post.media_url || 'https://placehold.co/100'} alt="Post" width={120} height={120} className="rounded-md object-cover aspect-square"/>
                                    <div className="flex-grow">
                                        <p className="text-sm text-gray-600 line-clamp-3 mb-1" title={post.caption}>{post.caption || "Post sem legenda."}</p>
                                        <p className="text-xs text-gray-500">Publicado em {format(new Date(post.timestamp), "dd/MM/yyyy 'às' HH:mm")}</p>
                                        <a href={post.permalink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-2">
                                            <ExternalLink className="w-3 h-3"/>
                                            Ver no Instagram
                                        </a>
                                    </div>
                                </CardContent>
                            </Card>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="bg-white shadow-sm">
                                     <CardHeader>
                                        <CardTitle className="text-base font-bold flex items-center gap-2"><Eye className="w-5 h-5 text-blue-500" /> Alcance e Atividade</CardTitle>
                                    </CardHeader>
                                    <CardContent className="divide-y divide-gray-100">
                                        <InsightStat label="Contas alcançadas" value={insights.reach || 0} />
                                        <InsightStat label="Impressões" value={insights.impressions || 0} />
                                        <InsightStat label="Visitas ao Perfil" value={insights.profile_visits || 0} />
                                        <InsightStat label="Cliques no Link do Site" value={insights.website_clicks || 0} />
                                    </CardContent>
                                </Card>
                                <Card className="bg-white shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-base font-bold flex items-center gap-2"><Heart className="w-5 h-5 text-red-500" /> Engajamento</CardTitle>
                                    </CardHeader>
                                    <CardContent className="divide-y divide-gray-100">
                                         <InsightStat label="Curtidas" value={insights.likes || 0} />
                                         <InsightStat label="Comentários" value={insights.comments || 0} />
                                         <InsightStat label="Compartilhamentos" value={insights.shares || 0} />
                                         <InsightStat label="Salvamentos" value={insights.saved || 0} />
                                         <InsightStat label="Total de Interações" value={insights.total_interactions || 0} />
                                         <InsightStat label="Taxa de Engajamento" value={engagementRate} />
                                    </CardContent>
                                </Card>
                                {(isReel || insights.plays) && (
                                     <Card className="bg-white shadow-sm md:col-span-2">
                                        <CardHeader>
                                            <CardTitle className="text-base font-bold flex items-center gap-2"><PlayCircle className="w-5 h-5 text-purple-500" /> Desempenho de Vídeo</CardTitle>
                                        </CardHeader>
                                        <CardContent className="divide-y divide-gray-100">
                                            <InsightStat label="Visualizações (Plays)" value={insights.plays || 0} />
                                            <InsightStat label="Tempo médio de visualização" value={`${(insights.ig_reels_avg_watch_time || 0).toFixed(2)}s`} />
                                        </CardContent>
                                    </Card>
                                )}
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
    const [error, setError] = useState<string | null>(null);
    const [selectedPost, setSelectedPost] = useState<any | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const [postInsights, setPostInsights] = useState<{ [key: string]: any }>({});
    const [insightsLoading, setInsightsLoading] = useState<{ [key: string]: boolean }>({});


    const handleOpenModal = (post: any) => {
        setSelectedPost(post);
        setIsModalOpen(true);
    };

    const fetchPostInsights = async (postId: string) => {
        if (!connection.accessToken) return;

        setInsightsLoading(prev => ({ ...prev, [postId]: true }));
        try {
            const response = await fetch('/api/meta/post-insights', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accessToken: connection.accessToken, postId }),
            });
            const result = await response.json();
            if (result.success) {
                setPostInsights(prev => ({ ...prev, [postId]: result.insights }));
            }
        } catch (error) {
            console.error(`Failed to fetch insights for post ${postId}`, error);
        } finally {
            setInsightsLoading(prev => ({ ...prev, [postId]: false }));
        }
    };


    useEffect(() => {
        const fetchMedia = async () => {
            if (!connection.isConnected || !connection.accessToken) {
                setError("A conta do Instagram não está conectada.");
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);
            
            try {
                const response = await fetch('/api/instagram/media', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ accessToken: connection.accessToken }),
                });

                const result = await response.json();
                
                if (!response.ok || !result.success) {
                     if (response.status === 401) {
                         throw new Error("Sua sessão com a Meta expirou. Por favor, reconecte sua conta.");
                    }
                    throw new Error(result.error || "Falha ao buscar as mídias do Instagram.");
                }
                setMedia(result.media);
                
                // Fetch insights for each post after media is loaded
                result.media.forEach((item: any) => {
                    fetchPostInsights(item.id);
                });

            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMedia();
    }, [connection]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-40">
                <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
                <p className="ml-4 text-gray-600">Buscando posts do Instagram...</p>
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
            <div className="text-center text-gray-500 py-10">
                <Instagram className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="font-semibold text-lg">Nenhum post encontrado</h3>
                <p className="text-sm">Não há posts no seu perfil do Instagram para analisar.</p>
            </div>
        );
    }

    return (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {media.map((item) => {
                const imageSrc = item.thumbnail_url || item.media_url || 'https://placehold.co/400x400';
                const currentInsights = postInsights[item.id] || {};
                const isLoadingInsights = insightsLoading[item.id];

                return (
                    <Card key={item.id} className="shadow-lg border-none hover:shadow-xl transition-shadow flex flex-col">
                        <CardHeader className="p-4">
                            <div className="aspect-square relative rounded-t-lg overflow-hidden bg-gray-100">
                                 <Image 
                                    src={imageSrc} 
                                    alt="Imagem do post" 
                                    fill
                                    unoptimized
                                    className="object-cover"
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 flex-grow">
                            <p className="text-sm text-gray-600 line-clamp-2 mb-2" title={item.caption}>{item.caption || "Post sem legenda."}</p>
                            <p className="text-xs text-gray-500 mb-3">
                                Publicado em {format(new Date(item.timestamp), "dd/MM/yyyy HH:mm")}
                            </p>
                            <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-left">
                                {isLoadingInsights ? (
                                    <div className="col-span-2 flex justify-center items-center h-12">
                                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-1.5 text-gray-700">
                                            <Eye className="w-3.5 h-3.5" />
                                            <span className="font-semibold">{currentInsights.reach || 0}</span>
                                            <span className="text-xs text-gray-500">Alcance</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-gray-700">
                                            <Heart className="w-3.5 h-3.5" />
                                            <span className="font-semibold">{item.like_count + (currentInsights.likes || 0)}</span>
                                            <span className="text-xs text-gray-500">Curtidas</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-gray-700">
                                            <MessageCircle className="w-3.5 h-3.5" />
                                            <span className="font-semibold">{item.comments_count + (currentInsights.comments || 0)}</span>
                                            <span className="text-xs text-gray-500">Comentários</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-gray-700">
                                            <Share2 className="w-3.5 h-3.5" />
                                            <span className="font-semibold">{currentInsights.shares || 0}</span>
                                            <span className="text-xs text-gray-500">Compart.</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </CardContent>
                         <CardFooter className="p-4 pt-0">
                             <Button variant="outline" className="w-full" onClick={() => handleOpenModal(item)}>
                                <BarChart className="w-4 h-4 mr-2" />
                                Ver mais Insights
                            </Button>
                        </CardFooter>
                    </Card>
                );
            })}
        </div>
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
    const [error, setError] = useState<string | null>(null);
    const [selectedPost, setSelectedPost] = useState<any | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

     const handleOpenModal = (post: any) => {
        setSelectedPost(post);
        setIsModalOpen(true);
    };

    useEffect(() => {
        const fetchPosts = async () => {
            if (!connection.isConnected || !connection.accessToken || !connection.pageId) {
                setError("A conta da Meta não está conectada ou o ID da página não está disponível.");
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);
            
            try {
                const response = await fetch('/api/meta/page-posts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        accessToken: connection.accessToken,
                        pageId: connection.pageId 
                    }),
                });

                const result = await response.json();
                
                if (!response.ok || !result.success) {
                    if (response.status === 401) {
                         throw new Error("Sua sessão com a Meta expirou. Por favor, reconecte sua conta.");
                    }
                    throw new Error(result.error || "Falha ao buscar os posts da página.");
                }

                setPosts(result.posts);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPosts();
    }, [connection]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-40">
                <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
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
            <div className="text-center text-gray-500 py-10">
                <Facebook className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="font-semibold text-lg">Nenhum post encontrado</h3>
                <p className="text-sm">Não há posts na sua página do Facebook para analisar.</p>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                    <Card key={post.id} className="shadow-lg border-none hover:shadow-xl transition-shadow flex flex-col">
                        <CardHeader className="p-4">
                            <div className="aspect-video relative rounded-t-lg overflow-hidden bg-gray-100">
                                <Image 
                                    src={post.full_picture || 'https://placehold.co/400'} 
                                    alt="Imagem do post" 
                                    fill
                                    unoptimized
                                    className="object-cover"
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 flex-grow">
                            <p className="text-sm text-gray-600 line-clamp-2 mb-2" title={post.message}>{post.message || "Post sem texto."}</p>
                            <p className="text-xs text-gray-500 mb-3">
                                Publicado em {format(new Date(post.created_time), "dd/MM/yyyy HH:mm")}
                            </p>
                            <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-left">
                                <div className="flex items-center gap-1.5 text-gray-700">
                                    <Eye className="w-3.5 h-3.5" />
                                    <span className="font-semibold">{post.insights.reach || 0}</span>
                                    <span className="text-xs text-gray-500">Alcance</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-gray-700">
                                    <Heart className="w-3.5 h-3.5" />
                                    <span className="font-semibold">{post.insights.likes || 0}</span>
                                    <span className="text-xs text-gray-500">Reações</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-gray-700">
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    <span className="font-semibold">{post.insights.comments || 0}</span>
                                    <span className="text-xs text-gray-500">Comentários</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-gray-700">
                                    <Share2 className="w-3.5 h-3.5" />
                                    <span className="font-semibold">{post.insights.shares || 0}</span>
                                    <span className="text-xs text-gray-500">Compart.</span>
                                </div>
                            </div>
                        </CardContent>
                         <CardFooter className="p-4 pt-0">
                            <Button variant="outline" className="w-full" onClick={() => handleOpenModal(post)}>
                                <BarChart className="w-4 h-4 mr-2" />
                                Ver mais Insights
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
            <FacebookPostInsightsModal
                post={selectedPost}
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                connection={connection}
            />
        </>
    );
};


export default function Relatorios() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metaConnection, setMetaConnection] = useState<MetaConnectionData | null>(null);
  const [instagramConnection, setInstagramConnection] = useState<InstagramConnectionData | null>(null);

  useEffect(() => {
    if (!user) return;

    async function fetchData() {
        setLoading(true);
        try {
            const [metaResult, instagramResult] = await Promise.all([
              getMetaConnection(user.uid),
              getInstagramConnection(user.uid),
            ]);
            setMetaConnection(metaResult);
            setInstagramConnection(instagramResult);
        } catch (error) {
            console.error("Erro ao buscar conexões:", error);
        } finally {
            setLoading(false);
        }
    }
    fetchData();
  }, [user]);


  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600 mt-1">Análise detalhada de performance</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select defaultValue="30">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="organic" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="organic">
                <Newspaper className="w-4 h-4 mr-2" />
                Orgânico
            </TabsTrigger>
            <TabsTrigger value="campaigns" disabled className="relative">
                 <BarChart3 className="w-4 h-4 mr-2" />
                Campanhas
                <Badge variant="secondary" className="absolute -top-2 -right-2 text-xs px-1.5 py-0.5">Em breve</Badge>
            </TabsTrigger>
        </TabsList>
        
        <TabsContent value="organic" className="mt-6">
             <Card className="shadow-lg border-none">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        Performance de Posts Orgânicos
                    </CardTitle>
                    <p className="text-sm text-gray-600">Veja o desempenho real dos seus últimos posts publicados.</p>
                </CardHeader>
                <CardContent>
                    {loading ? (
                         <div className="flex justify-center items-center h-48">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Tabs defaultValue="facebook" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 max-w-sm mx-auto">
                                <TabsTrigger value="facebook" disabled={!metaConnection?.isConnected}>
                                    <Facebook className="w-4 h-4 mr-2" />
                                    Facebook
                                </TabsTrigger>
                                <TabsTrigger value="instagram" disabled={!instagramConnection?.isConnected}>
                                    <Instagram className="w-4 h-4 mr-2" />
                                    Instagram
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="facebook" className="mt-6">
                                {metaConnection?.isConnected ? (
                                    <MetaPagePostsViewer connection={metaConnection} />
                                ) : (
                                    <div className="text-center text-gray-500 py-10">
                                      <AlertTriangle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                                      <h3 className="font-semibold text-lg">Conta do Facebook não conectada</h3>
                                      <p className="text-sm">Conecte sua conta na página de "Conteúdo" para ver as análises.</p>
                                  </div>
                                )}
                            </TabsContent>
                            <TabsContent value="instagram" className="mt-6">
                                {instagramConnection?.isConnected ? (
                                    <InstagramMediaViewer connection={instagramConnection} />
                                ) : (
                                   <div className="text-center text-gray-500 py-10">
                                      <AlertTriangle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                                      <h3 className="font-semibold text-lg">Conta do Instagram não conectada</h3>
                                      <p className="text-sm">Conecte sua conta na página de "Conteúdo" para ver as análises.</p>
                                  </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    )}
                </CardContent>
             </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="mt-6 space-y-8">
            {/* KPIs principais */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {kpis.map((kpi, index) => (
                <motion.div
                    key={kpi.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                    <Card className="shadow-lg border-none">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">{kpi.title}</p>
                            <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                            <div className={`flex items-center gap-1 text-sm mt-1 ${kpi.color}`}>
                            {kpi.trend === 'up' ? (
                                <TrendingUp className="w-3 h-3" />
                            ) : (
                                <TrendingDown className="w-3 h-3" />
                            )}
                            <span>{kpi.change}</span>
                            </div>
                        </div>
                        <kpi.icon className={`w-8 h-8 ${kpi.color.replace('text-', 'text-').split('-')[1] === 'green' ? 'text-green-500' : 'text-red-500'}`} />
                        </div>
                    </CardContent>
                    </Card>
                </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Gráfico de performance */}
                <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                >
                <Card className="shadow-lg border-none">
                    <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <LineChartIcon className="w-5 h-5 text-blue-500" />
                        Performance Mensal
                    </CardTitle>
                    </CardHeader>
                    <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <RechartsBarChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="impressions" fill="#3B82F6" name="Impressões" />
                        <Bar dataKey="clicks" fill="#8B5CF6" name="Cliques" />
                        </RechartsBarChart>
                    </ResponsiveContainer>
                    </CardContent>
                </Card>
                </motion.div>

                {/* Distribuição por canal */}
                <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                >
                <Card className="shadow-lg border-none">
                    <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <PieChartIcon className="w-5 h-5 text-purple-500" />
                        Distribuição por Canal
                    </CardTitle>
                    </CardHeader>
                    <CardContent>
                    <div className="flex items-center justify-center mb-6">
                        <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                            data={channelData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            >
                            {channelData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                        </ResponsiveContainer>
                    </div>
                    
                    <div className="space-y-3">
                        {channelData.map((channel) => (
                        <div key={channel.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                            <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: channel.color }}
                            ></div>
                            <span className="text-sm text-gray-700">{channel.name}</span>
                            </div>
                            <span className="font-semibold">{channel.value}%</span>
                        </div>
                        ))}
                    </div>
                    </CardContent>
                </Card>
                </motion.div>
            </div>

            {/* Gráfico de conversões */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
            >
                <Card className="shadow-lg border-none">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    Tendência de Conversões
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line 
                        type="monotone" 
                        dataKey="conversions" 
                        stroke="#10B981" 
                        strokeWidth={3} 
                        name="Conversões"
                        dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
                        />
                    </LineChart>
                    </ResponsiveContainer>
                </CardContent>
                </Card>
            </motion.div>

            {/* Insights e recomendações */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
            >
                <Card className="shadow-lg border-none">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-orange-500" />
                    Insights & Recomendações
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="font-semibold text-green-900 mb-2">📈 Performance Positiva</h4>
                        <p className="text-sm text-green-700">
                        Suas campanhas no Google Ads estão 15% acima da média do setor. Continue investindo neste canal.
                        </p>
                    </div>
                    
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Atenção Necessária</h4>
                        <p className="text-sm text-yellow-700">
                        O CTR do Facebook diminuiu. Considere testar novos criativos ou ajustar o público-alvo.
                        </p>
                    </div>
                    
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-2">💡 Oportunidade</h4>
                        <p className="text-sm text-blue-700">
                        LinkedIn mostra potencial de crescimento. Teste aumentar o orçamento em 20%.
                        </p>
                    </div>
                    
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <h4 className="font-semibold text-purple-900 mb-2">🎯 Meta do Mês</h4>
                        <p className="text-sm text-purple-700">
                        Você está 78% perto da meta de conversões. Faltam apenas 25 conversões.
                        </p>
                    </div>
                    </div>
                </CardContent>
                </Card>
            </motion.div>
        </TabsContent>

      </Tabs>
    </div>
  );
}
