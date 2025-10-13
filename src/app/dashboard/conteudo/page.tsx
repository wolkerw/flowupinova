
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Calendar as CalendarIcon,
  Plus,
  Edit,
  FileText,
  Instagram,
  Sparkles,
  Clock,
  CheckCircle,
  Loader2,
  AlertTriangle,
  Link as LinkIcon,
  LogOut,
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from 'date-fns';
import type { PostDataOutput } from "@/lib/services/posts-service";
import type { MetaConnectionData } from "@/lib/services/meta-service";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";


interface DisplayPost extends PostDataOutput {
    date: Date;
    time: string;
}


export default function Conteudo() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, getIdToken } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [scheduledPosts, setScheduledPosts] = useState<DisplayPost[]>([]);
  const [metaConnection, setMetaConnection] = useState<MetaConnectionData>({ isConnected: false });

  const fetchPageData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const token = await getIdToken();

    if (!token) {
        toast({ variant: 'destructive', title: "Erro de Autenticação", description: "Não foi possível obter o token de autenticação." });
        setLoading(false);
        return;
    }
    
    const headers = { 'Authorization': `Bearer ${token}` };

    console.log("[DEBUG] Fetching page data for user:", user.uid);
    try {
        const [postsResponse, metaResponse] = await Promise.all([
            fetch('/api/posts', { headers }),
            fetch('/api/meta/connection', { headers })
        ]);
        
        if (!postsResponse.ok || !metaResponse.ok) {
            console.error("Posts response:", postsResponse.status, postsResponse.statusText);
            console.error("Meta response:", metaResponse.status, metaResponse.statusText);
            const postError = await postsResponse.text();
            const metaError = await metaResponse.text();
            console.error("Posts error body:", postError);
            console.error("Meta error body:", metaError);
            throw new Error('Failed to fetch data from API');
        }

        const postsResult = await postsResponse.json();
        const metaResult = await metaResponse.json();

        console.log("[DEBUG] Meta connection status from API:", metaResult);

        const displayPosts = postsResult.posts.map((post: PostDataOutput) => {
            const scheduledDate = new Date(post.scheduledAt); // Ensure it's a Date object
            return {
                ...post,
                date: scheduledDate,
                time: format(scheduledDate, 'HH:mm'),
            };
        });

        setScheduledPosts(displayPosts);
        setMetaConnection(metaResult.connection);

    } catch (error) {
        console.error("Failed to fetch page data:", error);
        toast({ variant: 'destructive', title: "Erro ao carregar dados", description: "Não foi possível carregar os posts e o status da conexão." });
    } finally {
        setLoading(false);
    }
  }, [user, toast, getIdToken]);

  // Handle toast notifications on page load from URL params
  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');

    if (connected === 'true') {
      toast({
        title: "Sucesso!",
        description: "Conectado com a Meta (Instagram/Facebook).",
        variant: "default",
      });
      // Clean the URL and refetch data
      router.replace('/dashboard/conteudo', { scroll: false });
      fetchPageData();
    } else if (error) {
      toast({
        title: "Erro na Conexão",
        description: error,
        variant: "destructive",
      });
      // Clean the URL
      router.replace('/dashboard/conteudo', { scroll: false });
    }
  }, [searchParams, router, toast, fetchPageData]);


  useEffect(() => {
    if(user) {
        fetchPageData();
    }
  }, [user, fetchPageData]);

  const handleConnectMeta = () => {
    if (!user) {
        toast({ variant: "destructive", title: "Erro", description: "Você precisa estar logado para conectar." });
        return;
    }
    const clientId = process.env.NEXT_PUBLIC_META_APP_ID;
    if (!clientId) {
        toast({
            variant: "destructive",
            title: "Erro de Configuração",
            description: "O ID do aplicativo da Meta não foi configurado. Adicione NEXT_PUBLIC_META_APP_ID ao seu arquivo .env",
        });
        return;
    }

    const redirectUri = "https://9000-firebase-studio-1757951248950.cluster-57i2ylwve5fskth4xb2kui2ow2.cloudworkstations.dev/api/meta/callback";
    // Pass the user ID in the state parameter for the backend to use
    const state = user.uid;
    const scope = [
        'pages_show_list',
        'pages_read_engagement',
        'pages_manage_posts',
        'instagram_basic',
        'instagram_manage_insights',
        'instagram_content_publish'
    ].join(',');
    
    const authUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${scope}&response_type=code&display=popup`;
    
    window.location.href = authUrl;
  };
  
  const handleDisconnectMeta = async () => {
    if (!user) return;
    try {
        const token = await getIdToken();
        if (!token) throw new Error("Authentication token not found.");
        const response = await fetch('/api/meta/connection', { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) throw new Error('Failed to disconnect');
        setMetaConnection({ isConnected: false });
        toast({ title: "Desconectado", description: "A conexão com a Meta foi removida." });
    } catch(e) {
        toast({ title: "Erro", description: "Não foi possível desconectar.", variant: "destructive"});
    }
  };

  
  const platformIcons: { [key: string]: React.ElementType } = {
    instagram: Instagram,
  };

  const filteredPosts = scheduledPosts.filter(post => selectedDate && format(post.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd'));

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Conteúdo & Marketing</h1>
          <p className="text-gray-600 mt-1">Crie e gerencie conteúdo para suas redes sociais com IA</p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
            onClick={() => router.push('/dashboard/conteudo/gerar')}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Gerar Conteúdo com IA
          </Button>
          <Button 
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            onClick={() => router.push('/dashboard/conteudo/criar')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar Conteúdo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="shadow-lg border-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-blue-500" />
                    Calendário Editorial
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border-none"
                    disabled={loading}
                  />
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-600">Posts agendados</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-gray-600">Posts publicados</span>
                    </div>
                     <div className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-gray-600">Posts com falha</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
             <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                >
                <Card className="shadow-lg border-none">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <LinkIcon className="w-5 h-5 text-gray-700" />
                            Conexões
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                         <div className="space-y-4">
                            {metaConnection.isConnected ? (
                                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-center gap-3">
                                         <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500">
                                            <Instagram className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-green-900">Conectado</h3>
                                            <p className="text-sm text-green-700">Instagram & Facebook</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={handleDisconnectMeta} className="text-red-600 hover:bg-red-100">
                                        <LogOut className="w-4 h-4"/>
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between p-4 bg-gray-50 border border-dashed rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500">
                                            <Instagram className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-800">Instagram & Facebook</h3>
                                            <p className="text-sm text-gray-500">Publique seus conteúdos.</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" onClick={handleConnectMeta} disabled={loading}>
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Conectar'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="shadow-lg border-none">
            <CardHeader>
              <CardTitle>Posts do Dia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredPosts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden">
                          {post.imageUrl ? 
                              <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
                               :
                              <FileText className="w-5 h-5 text-gray-500" />
                          }
                      </div>
                      <div className="flex -space-x-2">
                        {post.platforms.map((platform) => {
                          const PlatformIcon = platformIcons[platform as keyof typeof platformIcons];
                          return (
                            PlatformIcon && <div key={platform} className="w-6 h-6 bg-white border-2 border-white rounded-full flex items-center justify-center"><PlatformIcon 
                              className="w-5 h-5 text-gray-700"
                            /></div>
                          );
                        })}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{post.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span>{post.time}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={post.status === 'published' ? 'default' : 'outline'}
                        className={
                            post.status === 'published' ? 'bg-green-100 text-green-700' 
                            : post.status === 'failed' ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'}
                      >
                        {post.status === 'published' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {post.status === 'scheduled' && <Clock className="w-3 h-3 mr-1" />}
                        {post.status === 'failed' && <AlertTriangle className="w-3 h-3 mr-1" />}
                        {post.status}
                      </Badge>
                      <Button variant="ghost" size="icon">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
                {filteredPosts.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                       {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /> : "Nenhum post para a data selecionada."}
                    </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
