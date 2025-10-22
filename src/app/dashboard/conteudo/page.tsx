
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Plus,
  Edit,
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
  MoreVertical,
  Send,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { format, isFuture, isPast, startOfDay, startOfMonth, startOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getScheduledPosts, schedulePost, type PostDataOutput } from "@/lib/services/posts-service";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";


interface DisplayPost {
    id: string;
    title: string;
    imageUrl?: string;
    status: 'scheduled' | 'publishing' | 'published' | 'failed';
    date: Date;
    formattedDate: string;
    formattedTime: string;
    platforms: string[];
    instagramUsername?: string;
}

const PostItem = ({ post, onRepublish, isRepublishing }: { post: DisplayPost, onRepublish: (postId: string) => void, isRepublishing: boolean }) => {
    const statusConfig = {
        published: { icon: CheckCircle, className: "bg-green-100 text-green-700" },
        scheduled: { icon: Clock, className: "bg-blue-100 text-blue-700" },
        failed: { icon: AlertTriangle, className: "bg-red-100 text-red-700" },
        publishing: { icon: Loader2, className: "bg-yellow-100 text-yellow-700 animate-spin" },
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
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        {StatusIcon && <StatusIcon className="w-4 h-4" />}
                        <span>{post.formattedDate} às {post.formattedTime}</span>
                    </div>
                     <div className="flex items-center gap-2 text-xs text-gray-500 mt-1.5">
                        {post.platforms.includes('instagram') && (
                            <>
                                <Instagram className="w-3.5 h-3.5" />
                                <span className="font-medium">@{post.instagramUsername || '...'}</span>
                            </>
                        )}
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
                        <DropdownMenuItem disabled>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-blue-600 focus:text-blue-700"
                          onClick={() => onRepublish(post.id)}
                          disabled={isRepublishing}
                        >
                          {isRepublishing ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4 mr-2" />
                          )}
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
  const [connectionResult, setConnectionResult] = useState<{success: boolean, message: string} | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [historyFilter, setHistoryFilter] = useState('this-month');
  const [isRepublishing, setIsRepublishing] = useState(false);
  const [isSimplePublishing, setIsSimplePublishing] = useState(false);
  const [simpleTestState, setSimpleTestState] = useState({
    imageUrl: '',
    title: 'Post de Teste Rápido',
    text: 'Esta é a legenda do post de teste.',
  });
  
  const fetchPageData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    
    try {
        const [postsResults, metaResult] = await Promise.all([
          getScheduledPosts(user.uid),
          getMetaConnection(user.uid)
        ]);
        
        const displayPosts = postsResults
            .filter(result => result.success && result.post)
            .map((result) => {
                const post = result.post!;
                const scheduledDate = new Date(post.scheduledAt);
                return {
                    id: post.id,
                    title: post.title,
                    imageUrl: post.imageUrl,
                    status: post.status,
                    date: scheduledDate,
                    formattedDate: format(scheduledDate, "dd 'de' LLLL", { locale: ptBR }),
                    formattedTime: format(scheduledDate, 'HH:mm'),
                    platforms: post.platforms,
                    instagramUsername: post.instagramUsername, // Use username from post data
                };
            })
            .sort((a, b) => b.date.getTime() - a.date.getTime()); // Sort descending

        setAllPosts(displayPosts);
        setMetaConnection(metaResult);

    } catch (error) {
        console.error("Failed to fetch page data:", error);
        toast({ variant: 'destructive', title: "Erro ao Carregar Dados", description: "Não foi possível carregar as publicações e o status da conexão." });
    } finally {
        setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    const code = searchParams.get('code');
    
    const exchangeCodeForToken = async (codeToExchange: string) => {
        setIsConnecting(true);
        setConnectionResult(null);
        try {
            const response = await fetch('/api/meta/callback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: codeToExchange }),
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error);
            
            if (user) {
              await updateMetaConnection(user.uid, {
                  isConnected: true,
                  accessToken: result.accessToken,
                  pageId: result.pageId,
                  pageName: result.pageName,
                  instagramId: result.instagramId,
                  instagramUsername: result.instagramUsername,
              });
            }
            setConnectionResult({ success: true, message: `Conta @${result.instagramUsername} conectada!` });
            await fetchPageData();
        } catch (err: any) {
             setConnectionResult({ success: false, message: err.message || "Não foi possível completar a conexão." });
        } finally {
            setIsConnecting(false);
        }
    };

    if (code) {
        // Remove code from URL and then process it.
        router.replace('/dashboard/conteudo', undefined);
        exchangeCodeForToken(code);
    }
  }, [searchParams, user, router, fetchPageData]);

  useEffect(() => {
    if(user) {
        fetchPageData();
    }
  }, [user, fetchPageData]);

  const handleConnectMeta = () => {
    const clientId = "826418333144156";
    const redirectUri = `${window.location.origin}/dashboard/conteudo`;
    const state = user?.uid;
    const configId = "657201687223122";
    const scope = "public_profile,email,pages_show_list,instagram_basic,instagram_content_publish,pages_read_engagement,pages_manage_posts";
    if (!state) return;
    const authUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${scope}&response_type=code&config_id=${configId}`;
    window.location.href = authUrl;
  };
  
  const handleDisconnectMeta = async () => {
    if (!user) return;
    await updateMetaConnection(user.uid, { isConnected: false });
    fetchPageData();
    toast({ title: "Desconectado", description: "A conexão com a Meta foi removida." });
  };
  
  const handleRepublish = async (postId: string) => {
    if (!user) {
      toast({ variant: 'destructive', title: "Erro", description: "Usuário não encontrado."});
      return;
    }
    setIsRepublishing(true);
    toast({ title: "Republicando Post...", description: `Enviando post ${postId} para publicação.`});
    try {
      const response = await fetch('/api/instagram/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, postId }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Falha ao republicar o post.');
      }
      toast({ title: "Sucesso!", description: 'Seu post foi enviado para publicação novamente.'});
      fetchPageData();
    } catch(error: any) {
      toast({ variant: 'destructive', title: "Erro ao Republicar", description: error.message });
    } finally {
      setIsRepublishing(false);
    }
  }

  const handleSimpleTestPublish = async () => {
    if (!user || !metaConnection.isConnected) {
        toast({ variant: "destructive", title: "Erro", description: "Usuário não logado ou conta da Meta não conectada." });
        return;
    }
    if (!simpleTestState.imageUrl.trim()) {
        toast({ variant: "destructive", title: "URL da Imagem Obrigatória", description: "Por favor, insira uma URL de imagem válida." });
        return;
    }
    setIsSimplePublishing(true);
    toast({ title: "Iniciando Publicação de Teste...", description: "Enviando dados para a API." });
    
    const result = await schedulePost(user.uid, {
        title: simpleTestState.title,
        text: simpleTestState.text,
        media: simpleTestState.imageUrl, // Passando a URL como string
        platforms: ['instagram'],
        scheduledAt: new Date(), // Publicar agora
        metaConnection: metaConnection,
    });
    
    setIsSimplePublishing(false);

    if (result.success) {
        toast({ title: "Sucesso!", description: "Post de teste enviado para publicação." });
        // Atualiza a lista de posts para mostrar o novo post 'publishing'
        await fetchPageData();
    } else {
        toast({ variant: "destructive", title: "Erro na Publicação de Teste", description: result.error || "Ocorreu um erro desconhecido." });
    }
  };

  const handleSimpleTestChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSimpleTestState(prev => ({ ...prev, [name]: value }));
  };

  const { scheduledPosts, pastPosts, calendarModifiers } = useMemo(() => {
        const scheduled = allPosts.filter(p => p.status === 'scheduled' && isFuture(p.date));
        
        let historyBase = allPosts.filter(p => isPast(p.date) || p.status !== 'scheduled');

        const filterStartDate = (filter: string) => {
            const today = new Date();
            switch(filter) {
                case 'last-7-days':
                    const last7 = new Date(today);
                    last7.setDate(today.getDate() - 7);
                    return startOfDay(last7);
                case 'this-month':
                    return startOfMonth(today);
                case 'this-year':
                    return startOfYear(today);
                default:
                    return null; // All time
            }
        };

        const startDate = filterStartDate(historyFilter);
        if (startDate) {
            historyBase = historyBase.filter(p => p.date >= startDate);
        }

        const modifiers = {
            published: allPosts.filter(p => p.status === 'published').map(p => p.date),
            scheduled: allPosts.filter(p => p.status === 'scheduled' && isFuture(p.date)).map(p => p.date),
            failed: allPosts.filter(p => p.status === 'failed').map(p => p.date),
        };

        return { scheduledPosts: scheduled, pastPosts: historyBase, calendarModifiers: modifiers };
    }, [allPosts, historyFilter]);


  const isLoadingInitial = loading && allPosts.length === 0;

  const ConnectCard = () => (
    <Card className="shadow-lg border-dashed border-2 relative">
        {(isConnecting || connectionResult) && (
             <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-lg p-4 text-center">
                {!connectionResult ? (
                    <>
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="mt-4 text-sm font-medium text-gray-700">Conectando com a Meta...</p>
                        <p className="text-xs text-gray-500">Aguarde, estamos finalizando a conexão.</p>
                    </>
                ) : (
                     <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                        {connectionResult.success ? (
                             <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
                        ) : (
                             <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
                        )}
                        <h3 className={`text-lg font-bold mt-4 ${connectionResult.success ? 'text-gray-900' : 'text-destructive'}`}>
                            {connectionResult.success ? 'Conexão Estabelecida!' : 'Falha na Conexão'}
                        </h3>
                        <p className="text-sm text-gray-600 mt-2">{connectionResult.message}</p>
                        <Button variant="outline" size="sm" className="mt-6" onClick={() => setConnectionResult(null)}>Fechar</Button>
                    </motion.div>
                )}
            </div>
        )}
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
                    Conectar
                </Button>
            </div>
        </CardContent>
    </Card>
  );

  const ConnectionStatusCard = () => (
     <Card className="shadow-lg border-none mt-8">
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

  const CalendarCard = () => (
    <Card className="shadow-lg border-none">
        <CardHeader>
            <CardTitle className="text-xl">Calendário de Conteúdo</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
             <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="p-0"
                locale={ptBR}
                modifiers={calendarModifiers}
                modifiersClassNames={{
                    published: 'day-published',
                    scheduled: 'day-scheduled',
                    failed: 'day-failed',
                }}
            />
        </CardContent>
         <CardFooter className="flex flex-col items-start gap-4 text-sm">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"/> Publicado</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"/> Agendado</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"/> Falhou</div>
        </CardFooter>
    </Card>
  )

  const SimpleTestPublishCard = () => (
    <Card className="shadow-lg border-none">
      <CardHeader>
        <CardTitle className="text-xl">Publicação Rápida de Teste</CardTitle>
        <p className="text-sm text-gray-600">Use para depurar o fluxo de publicação rapidamente.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="simple-imageUrl">URL da Imagem</Label>
          <Input 
            id="simple-imageUrl" 
            name="imageUrl" 
            placeholder="https://sua-url-de-imagem.com/imagem.jpg"
            value={simpleTestState.imageUrl}
            onChange={handleSimpleTestChange}
          />
        </div>
        <div>
          <Label htmlFor="simple-title">Título</Label>
          <Input 
            id="simple-title" 
            name="title" 
            value={simpleTestState.title}
            onChange={handleSimpleTestChange}
          />
        </div>
        <div>
          <Label htmlFor="simple-text">Legenda</Label>
          <Textarea 
            id="simple-text" 
            name="text" 
            value={simpleTestState.text}
            onChange={handleSimpleTestChange}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSimpleTestPublish} 
          disabled={isSimplePublishing || !metaConnection.isConnected}
          className="w-full"
        >
          {isSimplePublishing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
          {isSimplePublishing ? 'Publicando Teste...' : 'Publicar Agora'}
        </Button>
      </CardFooter>
      {!metaConnection.isConnected && (
          <p className="text-xs text-red-600 text-center p-4 pt-0 flex items-center justify-center gap-1">
              <AlertTriangle className="w-4 h-4" /> 
              Conecte sua conta da Meta para usar esta função.
          </p>
      )}
    </Card>
  );
  
  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto bg-gray-50/50">
        <style>{`
            .day-published { position: relative; }
            .day-published::after { content: ''; display: block; position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%); width: 5px; height: 5px; border-radius: 50%; background-color: #22c55e; }
            .day-scheduled { position: relative; }
            .day-scheduled::after { content: ''; display: block; position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%); width: 5px; height: 5px; border-radius: 50%; background-color: #3b82f6; }
            .day-failed { position: relative; }
            .day-failed::after { content: ''; display: block; position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%); width: 5px; height: 5px; border-radius: 50%; background-color: #ef4444; }
        `}</style>
      
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
            Gerar Conteúdo com IA
          </Button>
          <Button 
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-shadow"
            onClick={() => router.push('/dashboard/conteudo/criar')}
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Criar Conteúdo
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {!metaConnection.isConnected && !loading && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <ConnectCard />
            </motion.div>
        )}
      </AnimatePresence>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
            <CalendarCard />
            <SimpleTestPublishCard />
        </div>
        <div className="lg:col-span-2 space-y-8">
            <Card className="shadow-lg border-none">
                <CardHeader>
                    <CardTitle className="text-xl">Publicações Agendadas</CardTitle>
                </CardHeader>
                <CardContent>
                     <div className="max-h-60 overflow-y-auto space-y-4 pr-3">
                         <AnimatePresence>
                            {isLoadingInitial ? (
                                <div className="flex justify-center items-center h-24"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
                            ) : scheduledPosts.length > 0 ? (
                                scheduledPosts.map((post) => <PostItem key={post.id} post={post} onRepublish={handleRepublish} isRepublishing={isRepublishing} />)
                            ) : (
                                <div className="text-center text-gray-500 py-6">
                                    <Clock className="w-8 h-8 mx-auto text-gray-400 mb-2"/>
                                    <p>Nenhuma publicação agendada.</p>
                                </div>
                            )}
                         </AnimatePresence>
                     </div>
                </CardContent>
            </Card>

            <Card className="shadow-lg border-none">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-xl">Histórico de Publicações</CardTitle>
                     <Select value={historyFilter} onValueChange={setHistoryFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filtrar por período" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="last-7-days">Últimos 7 dias</SelectItem>
                            <SelectItem value="this-month">Este mês</SelectItem>
                            <SelectItem value="this-year">Este ano</SelectItem>
                            <SelectItem value="all-time">Todo o período</SelectItem>
                        </SelectContent>
                    </Select>
                </CardHeader>
                <CardContent>
                    <div className="max-h-96 overflow-y-auto space-y-4 pr-3">
                         <AnimatePresence>
                            {isLoadingInitial ? (
                                 <div className="flex justify-center items-center h-40"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
                            ) : pastPosts.length > 0 ? (
                                pastPosts.map((post) => <PostItem key={post.id} post={post} onRepublish={handleRepublish} isRepublishing={isRepublishing} />)
                            ) : (
                                <div className="text-center text-gray-500 py-10">
                                    <Instagram className="w-10 h-10 mx-auto text-gray-400 mb-2"/>
                                    <p>Nenhuma publicação encontrada no histórico.</p>
                                </div>
                            )}
                         </AnimatePresence>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>

      {metaConnection.isConnected && (
         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <ConnectionStatusCard />
         </motion.div>
      )}

    </div>
  );
}

    