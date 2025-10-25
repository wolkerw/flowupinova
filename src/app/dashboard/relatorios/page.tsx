
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Bookmark
} from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/components/auth/auth-provider";
import { getMetaConnection, type MetaConnectionData } from "@/lib/services/meta-service";
import Image from "next/image";
import { format } from 'date-fns';

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

const InstagramMediaViewer = ({ connection }: { connection: MetaConnectionData }) => {
    const [media, setMedia] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMedia = async () => {
            if (!connection.isConnected || !connection.accessToken || !connection.instagramId) {
                setError("A conta da Meta não está conectada ou o ID do Instagram não está disponível.");
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);
            
            try {
                const response = await fetch('/api/instagram/media', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        accessToken: connection.accessToken,
                        instagramId: connection.instagramId 
                    }),
                });

                const result = await response.json();
                
                if (!response.ok || !result.success) {
                     if (response.status === 401) {
                         throw new Error("Sua sessão com a Meta expirou. Por favor, reconecte sua conta.");
                    }
                    throw new Error(result.error || "Falha ao buscar as mídias do Instagram.");
                }

                setMedia(result.media);
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {media.map((item) => (
                <Card key={item.id} className="shadow-lg border-none hover:shadow-xl transition-shadow">
                    <CardHeader className="p-4">
                        <div className="aspect-square relative rounded-t-lg overflow-hidden bg-gray-100">
                             <Image 
                                src={item.media_url || 'https://placehold.co/400'} 
                                alt="Imagem do post" 
                                layout="fill" 
                                objectFit="cover"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2" title={item.caption}>{item.caption || "Post sem legenda."}</p>
                        <p className="text-xs text-gray-500 mb-3">
                            Publicado em {format(new Date(item.timestamp), "dd/MM/yyyy HH:mm")}
                        </p>
                        <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-left">
                            <div className="flex items-center gap-1.5 text-gray-700">
                                <Eye className="w-3.5 h-3.5" />
                                <span className="font-semibold">{item.insights.reach || 0}</span>
                                <span className="text-xs text-gray-500">Alcance</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-700">
                                <Heart className="w-3.5 h-3.5" />
                                <span className="font-semibold">{item.insights.engagement || 0}</span>
                                <span className="text-xs text-gray-500">Engajamento</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-700">
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span className="font-semibold">{item.insights.comments_count || 0}</span>
                                <span className="text-xs text-gray-500">Comentários</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-700">
                                <Bookmark className="w-3.5 h-3.5" />
                                <span className="font-semibold">{item.insights.saved || 0}</span>
                                <span className="text-xs text-gray-500">Salvos</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};


const MetaPagePostsViewer = ({ connection }: { connection: MetaConnectionData }) => {
    const [posts, setPosts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
                <Card key={post.id} className="shadow-lg border-none hover:shadow-xl transition-shadow">
                    <CardHeader className="p-4">
                        <div className="aspect-video relative rounded-t-lg overflow-hidden bg-gray-100">
                             <Image 
                                src={post.full_picture || 'https://placehold.co/400'} 
                                alt="Imagem do post" 
                                layout="fill" 
                                objectFit="cover"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
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
                                <Users className="w-3.5 h-3.5" />
                                <span className="font-semibold">{post.insights.engagement || 0}</span>
                                <span className="text-xs text-gray-500">Engajamento</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-700">
                                <Heart className="w-3.5 h-3.5" />
                                <span className="font-semibold">{post.insights.likes || 0}</span>
                                <span className="text-xs text-gray-500">Curtidas</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-700">
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span className="font-semibold">{post.insights.comments || 0}</span>
                                <span className="text-xs text-gray-500">Comentários</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};


export default function Relatorios() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metaConnection, setMetaConnection] = useState<MetaConnectionData | null>(null);

  useEffect(() => {
    if (!user) return;

    async function fetchData() {
        setLoading(true);
        try {
            const metaResult = await getMetaConnection(user.uid);
            setMetaConnection(metaResult);
        } catch (error) {
            console.error("Erro ao buscar conexão da Meta:", error);
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
            <TabsTrigger value="campaigns">
                 <BarChart3 className="w-4 h-4 mr-2" />
                Campanhas
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
                    ) : metaConnection?.isConnected ? (
                        <Tabs defaultValue="facebook" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 max-w-sm mx-auto">
                                <TabsTrigger value="facebook">
                                    <Facebook className="w-4 h-4 mr-2" />
                                    Facebook
                                </TabsTrigger>
                                <TabsTrigger value="instagram">
                                    <Instagram className="w-4 h-4 mr-2" />
                                    Instagram
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="facebook" className="mt-6">
                                <MetaPagePostsViewer connection={metaConnection} />
                            </TabsContent>
                            <TabsContent value="instagram" className="mt-6">
                                <InstagramMediaViewer connection={metaConnection} />
                            </TabsContent>
                        </Tabs>
                    ) : (
                         <div className="text-center text-gray-500 py-10">
                            <AlertTriangle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                            <h3 className="font-semibold text-lg">Conta da Meta não conectada</h3>
                            <p className="text-sm">Conecte sua conta na página de "Conteúdo" para ver as análises.</p>
                        </div>
                    )}
                </CardContent>
                 <CardFooter>
                    <p className="text-xs text-center text-gray-500 italic w-full">
                        Métricas de alcance, engajamento, curtidas e comentários obtidas diretamente da API da Meta.
                    </p>
                </CardFooter>
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
                        <BarChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="impressions" fill="#3B82F6" name="Impressões" />
                        <Bar dataKey="clicks" fill="#8B5CF6" name="Cliques" />
                        </BarChart>
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

    