
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CalendarIcon,
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
  Facebook,
  RefreshCw,
  MoreVertical
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { format, isFuture, isPast, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getScheduledPosts, type PostDataOutput } from "@/lib/services/posts-service";
import { getMetaConnection, updateMetaConnection, type MetaConnectionData } from "@/lib/services/meta-service";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DisplayPost extends PostDataOutput {
    date: Date;
    formattedDate: string;
    formattedTime: string;
}

const PostItem = ({ post }: { post: DisplayPost }) => {
    const platformIcons: { [key: string]: React.ElementType } = {
        instagram: Instagram,
        facebook: Facebook,
    };

    const statusConfig = {
        published: { icon: CheckCircle, className: "bg-green-100 text-green-700" },
        scheduled: { icon: Clock, className: "bg-blue-100 text-blue-700" },
        failed: { icon: AlertTriangle, className: "bg-red-100 text-red-700" },
    };

    const currentStatus = post.status as keyof typeof statusConfig;
    const { icon: StatusIcon, className: statusClassName } = statusConfig[currentStatus] || {};

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow bg-white"
        >
            <div className="flex items-center gap-4 overflow-hidden">
                <Image
                    src={post.imageUrl || "https://placehold.co/400"}
                    alt={post.title}
                    width={56}
                    height={56}
                    className="w-14 h-14 object-cover rounded-md bg-gray-100"
                />
                <div className="overflow-hidden">
                    <h4 className="font-medium text-gray-900 truncate">{post.title}</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        {StatusIcon && <StatusIcon className="w-4 h-4" />}
                        <span>{post.formattedDate} às {post.formattedTime}</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
                <Badge variant="outline" className={statusClassName}>{post.status}</Badge>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-blue-600">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Republicar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </motion.div>
    );
}

export default function Conteudo() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [allPosts, setAllPosts] = useState<DisplayPost[]>([]);
  const [metaConnection, setMetaConnection] = useState<MetaConnectionData>({ isConnected: false });
  const [isConnecting, setIsConnecting] = useState(false);
  const [timeFilter, setTimeFilter] = useState("all");

  const fetchPageData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    
    try {
        const [postsResult, metaResult] = await Promise.all([
          getScheduledPosts(user.uid),
          getMetaConnection(user.uid)
        ]);
        
        const displayPosts = postsResult.map((post: PostDataOutput) => {
            const scheduledDate = new Date(post.scheduledAt);
            return {
                ...post,
                date: scheduledDate,
                formattedDate: format(scheduledDate, "dd 'de' LLLL", { locale: ptBR }),
                formattedTime: format(scheduledDate, 'HH:mm'),
            };
        }).sort((a, b) => b.date.getTime() - a.date.getTime()); // Sort descending

        setAllPosts(displayPosts);
        setMetaConnection(metaResult);

    } catch (error) {
        console.error("Failed to fetch page data:", error);
        toast({ variant: 'destructive', title: "Erro ao carregar dados", description: "Não foi possível carregar as publicações e o status da conexão." });
    } finally {
        setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    const code = searchParams.get('code');
    if (code && user && !isConnecting) {
        const exchangeCodeForToken = async (codeToExchange: string) => {
            setIsConnecting(true);
            try {
                const response = await fetch('/api/meta/callback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code: codeToExchange }),
                });
                const result = await response.json();
                if (!response.ok || !result.success) throw new Error(result.error);
                await updateMetaConnection(user.uid, {
                    isConnected: true,
                    accessToken: result.accessToken,
                    pageId: result.pageId,
                    pageName: result.pageName,
                    instagramId: result.instagramId,
                    instagramUsername: result.instagramUsername,
                });
                toast({ title: "Sucesso!", description: `Conectado com a página ${result.pageName}.` });
                await fetchPageData();
            } catch (err: any) {
                toast({ variant: "destructive", title: "Falha na Conexão", description: err.message });
            } finally {
                setIsConnecting(false);
                router.replace('/dashboard/conteudo', undefined);
            }
        };
        exchangeCodeForToken(code);
    }
  }, [searchParams, user, isConnecting, router, toast, fetchPageData]);

  useEffect(() => {
    if(user) {
        fetchPageData();
    }
  }, [user, fetchPageData]);

  const handleConnectMeta = () => {
    const clientId = "826418333144156";
    const redirectUri = "https://9000-firebase-studio-1757951248950.cluster-57i2ylwve5fskth4xb2kui2ow2.cloudworkstations.dev/dashboard/conteudo";
    const state = user?.uid;
    const scope = "public_profile,email,pages_show_list,instagram_basic,instagram_content_publish,pages_read_engagement,pages_manage_posts,business_management";
    if (!state) return;
    const authUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${scope}&response_type=code`;
    window.location.href = authUrl;
  };
  
  const handleDisconnectMeta = async () => {
    if (!user) return;
    await updateMetaConnection(user.uid, { isConnected: false });
    fetchPageData();
    toast({ title: "Desconectado", description: "A conexão com a Meta foi removida." });
  };

  const { scheduledPosts, pastPosts } = useMemo(() => {
    const now = new Date();
    const scheduled = allPosts.filter(p => isFuture(p.date) && p.status === 'scheduled');
    let past = allPosts.filter(p => isPast(p.date) || p.status !== 'scheduled');

    if (timeFilter !== 'all') {
        const filterDate = subDays(now, parseInt(timeFilter, 10));
        past = past.filter(p => p.date >= filterDate);
    }

    return { scheduledPosts: scheduled, pastPosts: past };
  }, [allPosts, timeFilter]);

  const isLoadingInitial = loading && allPosts.length === 0;

  const ConnectCard = () => (
    <Card className="shadow-lg border-dashed border-2">
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
                <LinkIcon className="w-6 h-6 text-gray-700" />
                Conecte suas contas
            </CardTitle>
            <p className="text-gray-600 text-sm pt-2">Para publicar e agendar seus posts, você precisa conectar seu perfil do Instagram e página do Facebook.</p>
        </CardHeader>
        <CardContent>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500">
                        <Instagram className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-800">Instagram & Facebook</h3>
                        <p className="text-sm text-gray-500">Publique seus conteúdos.</p>
                    </div>
                </div>
                <Button variant="outline" onClick={handleConnectMeta} disabled={isConnecting}>
                    {isConnecting ? <Loader2 className="w-4 h-4 animate-spin"/> : "Conectar"}
                </Button>
            </div>
        </CardContent>
    </Card>
  );

  const ConnectionStatusCard = () => (
     <Card className="shadow-lg border-none">
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
                <LinkIcon className="w-5 h-5 text-gray-700" />
                Contas Conectadas
            </CardTitle>
        </CardHeader>
        <CardContent>
             <div className="flex items-start justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-4">
                     <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white shadow-sm shrink-0">
                        <Instagram className="w-6 h-6 text-pink-500" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-green-900 leading-tight">Conectado</h3>
                        <p className="text-sm text-green-800 font-medium truncate" title={metaConnection.instagramUsername}>
                            @{metaConnection.instagramUsername}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-1" title={metaConnection.pageName}>
                            <Facebook className="w-3 h-3"/> {metaConnection.pageName}
                        </p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={handleDisconnectMeta} className="text-red-600 hover:bg-red-100 shrink-0">
                    <LogOut className="w-4 h-4"/>
                </Button>
            </div>
        </CardContent>
    </Card>
  )

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto bg-gray-50/50">
      {/* Cabeçalho */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Conteúdo & Marketing</h1>
          <p className="text-gray-600 mt-1">Crie, agende e analise o conteúdo para suas redes sociais.</p>
        </div>
        
        <div className="flex gap-4 pt-2">
          <Button 
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-md hover:shadow-lg transition-shadow"
            onClick={() => router.push('/dashboard/conteudo/gerar')}
            size="lg"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Gerar com IA
          </Button>
          <Button 
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-shadow"
            onClick={() => router.push('/dashboard/conteudo/criar')}
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Criar do Zero
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {!metaConnection.isConnected && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <ConnectCard />
            </motion.div>
        )}
      </AnimatePresence>
      
      {/* Seção de Publicações Agendadas */}
      <Card className="shadow-lg border-none">
        <CardHeader>
            <CardTitle className="text-xl">Publicações Agendadas</CardTitle>
        </CardHeader>
        <CardContent>
             <div className="max-h-96 overflow-y-auto space-y-4 pr-3">
                 <AnimatePresence>
                    {isLoadingInitial ? (
                        <div className="flex justify-center items-center h-40"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
                    ) : scheduledPosts.length > 0 ? (
                        scheduledPosts.map((post) => <PostItem key={post.id} post={post} />)
                    ) : (
                        <div className="text-center text-gray-500 py-10">
                            <Clock className="w-10 h-10 mx-auto text-gray-400 mb-2"/>
                            <p>Nenhuma publicação agendada.</p>
                        </div>
                    )}
                 </AnimatePresence>
             </div>
        </CardContent>
      </Card>

      {/* Seção de Histórico */}
      <Card className="shadow-lg border-none">
        <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle className="text-xl">Histórico de Publicações</CardTitle>
            <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por período" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todo o período</SelectItem>
                    <SelectItem value="7">Últimos 7 dias</SelectItem>
                    <SelectItem value="30">Últimos 30 dias</SelectItem>
                    <SelectItem value="90">Últimos 90 dias</SelectItem>
                </SelectContent>
            </Select>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                 <AnimatePresence>
                    {isLoadingInitial ? (
                         <div className="flex justify-center items-center h-40"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
                    ) : pastPosts.length > 0 ? (
                        pastPosts.map((post) => <PostItem key={post.id} post={post} />)
                    ) : (
                        <div className="text-center text-gray-500 py-10">
                             <FileText className="w-10 h-10 mx-auto text-gray-400 mb-2"/>
                            <p>Nenhuma publicação encontrada no histórico.</p>
                        </div>
                    )}
                 </AnimatePresence>
            </div>
        </CardContent>
      </Card>

      {metaConnection.isConnected && (
         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <ConnectionStatusCard />
         </motion.div>
      )}

    </div>
  );
}
