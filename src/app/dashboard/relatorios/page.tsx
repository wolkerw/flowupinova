"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Share2,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Newspaper,
  Loader2,
  Instagram,
  Facebook
} from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/components/auth/auth-provider";
import { getScheduledPosts, type PostDataOutput } from "@/lib/services/posts-service";
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

// Componente para posts orgânicos
const OrganicPosts = ({ posts, isLoading, metaConnection }: { posts: any[], isLoading: boolean, metaConnection: MetaConnectionData | null }) => {
    
    // Simulação de métricas para posts orgânicos
    const getOrganicMetrics = (postId: string) => {
        const hash = postId.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
        return {
            reach: Math.floor(Math.abs(Math.sin(hash) * 10000)),
            engagement: Math.floor(Math.abs(Math.sin(hash * 2) * 500)),
            likes: Math.floor(Math.abs(Math.sin(hash * 3) * 300)),
        };
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-48">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }
    
    if (posts.length === 0) {
        return (
            <div className="text-center text-gray-500 py-10">
                <Newspaper className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="font-semibold text-lg">Nenhuma publicação encontrada</h3>
                <p className="text-sm">Ainda não há posts publicados para analisar.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => {
                const metrics = getOrganicMetrics(post.id);
                return (
                    <Card key={post.id} className="shadow-lg border-none hover:shadow-xl transition-shadow">
                        <CardHeader className="p-4">
                            <div className="aspect-video relative rounded-t-lg overflow-hidden bg-gray-100">
                                <Image src={post.imageUrl || 'https://placehold.co/400'} alt={post.title} layout="fill" objectFit="cover" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <h4 className="font-bold truncate" title={post.title}>{post.title}</h4>
                            <p className="text-xs text-gray-500 mb-3">
                                Publicado em {format(new Date(post.scheduledAt), "dd/MM/yyyy")}
                            </p>
                             <div className="flex items-center gap-2 mb-4">
                                {post.platforms.includes('instagram') && metaConnection?.instagramUsername && (
                                  <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                                    <Instagram className="w-3.5 h-3.5" />
                                    <span>@{metaConnection.instagramUsername}</span>
                                  </div>
                                )}
                                {post.platforms.includes('facebook') && metaConnection?.pageName && (
                                  <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                                    <Facebook className="w-3.5 h-3.5 text-blue-600" />
                                    <span>{metaConnection.pageName}</span>
                                  </div>
                                )}
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div>
                                    <p className="text-sm font-semibold">{metrics.reach.toLocaleString()}</p>
                                    <p className="text-xs text-gray-500">Alcance</p>
                                </div>
                                 <div>
                                    <p className="text-sm font-semibold">{metrics.engagement.toLocaleString()}</p>
                                    <p className="text-xs text-gray-500">Engajamento</p>
                                </div>
                                 <div>
                                    <p className="text-sm font-semibold">{metrics.likes.toLocaleString()}</p>
                                    <p className="text-xs text-gray-500">Curtidas</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
};


export default function Relatorios() {
  const { user } = useAuth();
  const [publishedPosts, setPublishedPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [metaConnection, setMetaConnection] = useState<MetaConnectionData | null>(null);

  useEffect(() => {
    if (!user) return;

    async function fetchData() {
        setLoadingPosts(true);
        try {
            const [postsResults, metaResult] = await Promise.all([
                getScheduledPosts(user.uid),
                getMetaConnection(user.uid)
            ]);

            const successfulPosts = postsResults
                .filter(p => p.success && p.post)
                .map(p => p.post!);

            const published = successfulPosts.filter(p => p.status === 'published');
            
            setPublishedPosts(published);
            setMetaConnection(metaResult);

        } catch (error) {
            console.error("Erro ao buscar dados para relatórios:", error);
        } finally {
            setLoadingPosts(false);
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
                        <Instagram className="w-5 h-5 text-pink-500" />
                        Performance das Publicações Orgânicas
                    </CardTitle>
                    <p className="text-sm text-gray-600">Veja o desempenho dos seus últimos posts publicados.</p>
                </CardHeader>
                <CardContent>
                    <OrganicPosts posts={publishedPosts} isLoading={loadingPosts} metaConnection={metaConnection} />
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

    