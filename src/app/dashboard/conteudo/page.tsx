
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
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from 'date-fns';
import { getScheduledPosts, PostDataOutput } from "@/lib/services/posts-service";
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
  const [scheduledPosts, setScheduledPosts] = useState<DisplayPost[]>([]);

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');

    if (connected === 'true') {
      toast({
        title: "Sucesso!",
        description: "Conectado com a Meta (Instagram/Facebook).",
        variant: "default",
      });
      // Limpa os parâmetros da URL
      router.replace('/dashboard/conteudo');
    } else if (error) {
      toast({
        title: "Erro na Conexão",
        description: error,
        variant: "destructive",
      });
      // Limpa os parâmetros da URL
      router.replace('/dashboard/conteudo');
    }
  }, [searchParams, router, toast]);

  const fetchPageData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
        const postsResult = await getScheduledPosts(user.uid);

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

    } catch (error) {
        console.error("Failed to fetch page data:", error);
        toast({ variant: 'destructive', title: "Erro ao carregar dados", description: "Não foi possível carregar os posts agendados." });
    } finally {
        setLoading(false);
    }
  }, [user, toast]);


  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const handleConnectMeta = () => {
    const clientId = process.env.NEXT_PUBLIC_META_APP_ID;
    if (!clientId) {
        toast({
            variant: "destructive",
            title: "Erro de Configuração",
            description: "O ID do aplicativo da Meta não foi configurado. Adicione NEXT_PUBLIC_META_APP_ID ao seu arquivo .env",
        });
        return;
    }

    // Hardcoded redirect URI to match the Meta App configuration exactly.
    const redirectUri = "https://9000-firebase-studio-1757951248950.cluster-57i2ylwve5fskth4xb2kui2ow2.cloudworkstations.dev/api/meta/callback";
    const state = 'flowup-auth-state';
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
                                <Button variant="outline" onClick={handleConnectMeta}>
                                    Conectar
                                </Button>
                            </div>
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
                            <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden">
                                <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
                            </div>
                             :
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
