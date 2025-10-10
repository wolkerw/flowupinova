
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
  Image,
  Video,
  FileText,
  Instagram,
  Facebook,
  Linkedin,
  Sparkles,
  Clock,
  CheckCircle,
  Loader2,
  AlertTriangle,
  Link as LinkIcon,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from 'date-fns';
import { getScheduledPosts, PostDataOutput } from "@/lib/services/posts-service";
import { getMetaConnection, MetaConnectionData } from "@/lib/services/meta-service";
import { META_APP_ID } from "@/lib/config";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";


interface DisplayPost extends PostDataOutput {
    date: Date;
    time: string;
    type: 'image' | 'text';
}


export default function Conteudo() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [scheduledPosts, setScheduledPosts] = useState<DisplayPost[]>([]);
  const [metaConnection, setMetaConnection] = useState<MetaConnectionData | null>(null);

  const fetchPageData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
        const [postsResult, metaResult] = await Promise.all([
          getScheduledPosts(user.uid),
          getMetaConnection(user.uid)
        ]);

        const displayPosts = postsResult.map(post => {
            const scheduledDate = post.scheduledAt; // Already a Date object
            return {
                ...post,
                date: scheduledDate,
                time: format(scheduledDate, 'HH:mm'),
                type: (post.imageUrl ? 'image' : 'text') as 'image' | 'text',
            };
        });
        setScheduledPosts(displayPosts);
        setMetaConnection(metaResult);

    } catch (error) {
        console.error("Failed to fetch page data:", error);
        toast({ variant: 'destructive', title: "Erro ao carregar dados", description: "Não foi possível carregar os dados da página. Tente recarregar." });
    } finally {
        setLoading(false);
    }
  }, [user, toast]);


  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);


  // Effect to handle callbacks from Meta OAuth
  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');

    if (error) {
      toast({ variant: 'destructive', title: "Falha na conexão com a Meta", description: error });
      // Clean URL
      router.replace('/dashboard/conteudo');
    }

    if (connected === 'true') {
      toast({ title: "Conexão com a Meta bem-sucedida!", description: "Atualizando dados da sua conta..." });
      // Force refresh of data after connection
      fetchPageData();
      // Clean URL
      router.replace('/dashboard/conteudo');
    }
  }, [searchParams, fetchPageData, toast, router]);


  const handleConnectMeta = () => {
    if (!user) {
        toast({ variant: 'destructive', title: "Erro de Autenticação", description: "Você precisa estar logado para conectar sua conta." });
        return;
    }
    setIsConnecting(true); // Show loader on button
    
    // Dynamically create the redirect URI based on the current window location
    const redirectUri = `${window.location.origin}/api/meta/callback`;
    
    const scopes = [
      "pages_show_list",
      "pages_read_engagement",
      "pages_manage_posts",
      "instagram_basic",
      "instagram_manage_comments",
      "instagram_manage_insights",
      "instagram_content_publish",
      "business_management",
      "ads_management"
    ].join(",");
    
    // Includes userId and the correct origin in the state to retrieve it in the callback
    const stateObject = {
      userId: user.uid,
      origin: window.location.origin,
    };
    const authState = `flowup-auth-state:${JSON.stringify(stateObject)}`;

    const authUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${redirectUri}&state=${encodeURIComponent(authState)}&scope=${scopes}&auth_type=rerequest&display=popup`;
    window.location.href = authUrl;
  };

  
  const platformIcons: { [key: string]: React.ElementType } = {
    instagram: Instagram,
    facebook: Facebook,
    linkedin: Linkedin
  };

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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="shadow-lg border-none bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                     <LinkIcon className="w-5 h-5 text-gray-700" />
                    Contas Conectadas
                  </CardTitle>
                </CardHeader>
                 <CardContent className="p-4 border rounded-lg m-6 mt-0">
                  {loading ? (
                     <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                  ) : metaConnection?.isConnected ? (
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex -space-x-2">
                               <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-white" style={{ background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }}>
                                    <Instagram className="w-4 h-4 text-white" />
                                </div>
                                <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center text-white border-2 border-white">
                                    <Facebook className="w-4 h-4" />
                                </div>
                            </div>
                            <div>
                               <p className="font-semibold text-gray-800">{metaConnection.instagramAccountName || 'Instagram'}</p>
                               <p className="text-xs text-gray-500">{metaConnection.facebookPageName || 'Página do Facebook'}</p>
                            </div>
                        </div>
                        <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Conectado
                        </Badge>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className="flex -space-x-2">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 border-2 border-white">
                                <Instagram className="w-5 h-5" />
                            </div>
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 border-2 border-white">
                                <Facebook className="w-5 h-5" />
                            </div>
                        </div>
                         <div>
                            <p className="font-semibold text-gray-800">Conectar Contas Meta</p>
                            <p className="text-xs text-gray-500">Instagram & Facebook</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleConnectMeta} disabled={isConnecting}>
                            {isConnecting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LinkIcon className="w-4 h-4 mr-2" />}
                            Conectar
                        </Button>
                    </div>
                  )}
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
                {scheduledPosts
                  .filter(post => selectedDate && format(post.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd'))
                  .map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3">
                        {post.imageUrl ? 
                            <Image className="w-5 h-5 text-gray-500" /> :
                            <FileText className="w-5 h-5 text-gray-500" />
                        }
                        <div className="flex">
                          {post.platforms.map((platform, pIdx) => {
                            const PlatformIcon = platformIcons[platform as keyof typeof platformIcons];
                            return (
                              PlatformIcon && <PlatformIcon 
                                key={platform}
                                className={`w-5 h-5 text-blue-500 bg-white rounded-full p-0.5 border ${pIdx > 0 ? '-ml-2' : ''}`} 
                              />
                            );
                          })}
                        </div>
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
                {scheduledPosts.filter(post => selectedDate && format(post.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')).length === 0 && (
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
