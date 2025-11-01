

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
  BarChart,
  Trash2,
  X,
} from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { format, isFuture, isPast, startOfDay, startOfMonth, startOfYear, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getScheduledPosts, deletePost, type PostDataOutput } from "@/lib/services/posts-service";
import { getMetaConnection, updateMetaConnection, type MetaConnectionData } from "@/lib/services/meta-service";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


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
    pageName?: string;
}

const PostItem = ({ post, onRepublish, isRepublishing, onDelete }: { post: DisplayPost, onRepublish: (postId: string) => void, isRepublishing: boolean, onDelete: (postId: string) => void }) => {
    const statusConfig = {
        published: { icon: CheckCircle, className: "bg-green-100 text-green-700" },
        scheduled: { icon: Clock, className: "bg-blue-100 text-blue-700" },
        failed: { icon: AlertTriangle, className: "bg-red-100 text-red-700" },
        publishing: { icon: Loader2, className: "bg-yellow-100 text-yellow-700 animate-spin" },
    };

    const currentStatus = post.status as keyof typeof statusConfig;
    const { icon: StatusIcon, className: statusClassName } = statusConfig[currentStatus] || {};
    
    // Safely determine the image source.
    const imageSrc = typeof post.imageUrl === 'string' ? post.imageUrl : "https://placehold.co/400";


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
                    src={imageSrc}
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
                     <div className="flex items-center gap-4 text-xs text-gray-500 mt-1.5">
                        {post.platforms?.includes('instagram') && (
                            <div className="flex items-center gap-1.5">
                                <Instagram className="w-3.5 h-3.5" />
                                {post.instagramUsername && <span className="font-medium">@{post.instagramUsername}</span>}
                            </div>
                        )}
                         {post.platforms?.includes('facebook') && (
                            <div className="flex items-center gap-1.5">
                                <Facebook className="w-3.5 h-3.5 text-blue-600" />
                                {post.pageName && <span className="font-medium">{post.pageName}</span>}
                            </div>
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
                          disabled={isRepublishing || post.status === 'publishing'}
                        >
                          {isRepublishing ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4 mr-2" />
                          )}
                          Republicar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600 focus:text-red-700"
                          onClick={() => onDelete(post.id)}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
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
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [displayedMonth, setDisplayedMonth] = useState<Date>(new Date());

  const [historyFilter, setHistoryFilter] = useState('this-month');
  const [isRepublishing, setIsRepublishing] = useState(false);
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  
  const fetchPageData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
        const postsResults = await getScheduledPosts(user.uid);
        if (Array.isArray(postsResults) && !postsResults[0]?.error) {
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
                        instagramUsername: post.instagramUsername,
                        pageName: post.pageName,
                    };
                })
                .sort((a, b) => b.date.getTime() - a.date.getTime());
            
            setAllPosts(displayPosts);
        } else if (postsResults[0]?.error) {
             toast({ variant: 'destructive', title: "Erro ao Carregar Posts", description: postsResults[0].error });
        } else {
            setAllPosts([]);
        }

    } catch (error: any) {
        console.error("Failed to fetch posts:", error);
        toast({ variant: 'destructive', title: "Erro ao Carregar Posts", description: "Não foi possível carregar as publicações." });
    }

    try {
        const metaResult = await getMetaConnection(user.uid);
        setMetaConnection(metaResult);
    } catch (error: any) {
        console.error("Failed to fetch meta connection:", error);
        setMetaConnection({ isConnected: false, error: "Falha ao buscar dados de conexão com a Meta." });
    }


    setLoading(false);
  }, [user, toast]);


  useEffect(() => {
    const code = searchParams.get('code');
    
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
            
            const connectedParts = [];
            if (result.instagramUsername) {
                connectedParts.push(`Instagram (@${result.instagramUsername})`);
            }
            if (result.pageName) {
                connectedParts.push(`Facebook (${result.pageName})`);
            }
            
            const description = connectedParts.length > 0
                ? `Contas conectadas: ${connectedParts.join(' e ')}.`
                : "Nenhuma conta nova foi conectada.";


            toast({
                variant: "success",
                title: "Conexão Estabelecida!",
                description: description,
            });
            await fetchPageData();
        } catch (err: any) {
             toast({
                variant: "destructive",
                title: "Falha na Conexão",
                description: err.message || "Não foi possível completar a conexão.",
             });
        } finally {
            setIsConnecting(false);
            // Remove code from URL after processing.
            router.replace('/dashboard/conteudo', undefined);
        }
    };

    if (code) {
        exchangeCodeForToken(code);
    }
  }, [searchParams, user, router, fetchPageData, toast]);

  useEffect(() => {
    if(user && !searchParams.get('code')) {
        fetchPageData();
    }
  }, [user, fetchPageData, searchParams]);
  
  const { scheduledPosts, pastPosts, calendarModifiers, postsForSelectedDay } = useMemo(() => {
        const scheduled = allPosts.filter(p => p.status === 'scheduled' && isFuture(p.date));
        
        let historyBase = allPosts.filter(p => p.status === 'published' || p.status === 'failed');

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
        
        const postsOnDay = selectedDate ? allPosts.filter(p => isSameDay(p.date, selectedDate)) : [];

        return { scheduledPosts: scheduled, pastPosts: historyBase, calendarModifiers: modifiers, postsForSelectedDay: postsOnDay };
    }, [allPosts, historyFilter, selectedDate]);
    
    // Abre o modal se houver posts no dia selecionado
    useEffect(() => {
        if (selectedDate && postsForSelectedDay.length > 0) {
            setIsDateModalOpen(true);
        }
    }, [selectedDate, postsForSelectedDay]);

    const handleDateSelect = (date: Date | undefined) => {
        if (!date) return;
        setSelectedDate(date);
        const postsOnDay = allPosts.filter(p => isSameDay(p.date, date));
        if (postsOnDay.length === 0) {
            // Se não houver posts, apenas seleciona o dia, não abre o modal.
            // Opcional: pode-se exibir um toast informando que não há posts.
        }
    }

  const handleConnectMeta = () => {
    const clientId = "826418333144156";
    const redirectUri = `${window.location.origin}/dashboard/conteudo`;
    const state = user?.uid;
    const configId = "657201687223122";
    const scope = "public_profile,email,pages_show_list,instagram_basic,instagram_content_publish,pages_read_engagement,pages_read_user_content,pages_manage_posts";
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

  const handleDeleteRequest = (postId: string) => {
    setPostToDelete(postId);
    setIsDeleteDialogOpen(true);
  };
  
  const handleConfirmDelete = async () => {
    if (!user || !postToDelete) return;

    setIsDeleting(true);
    try {
        await deletePost(user.uid, postToDelete);
        toast({ title: "Sucesso!", description: "A publicação foi excluída." });
        fetchPageData(); // Refresh the list
    } catch (error: any) {
        toast({ variant: 'destructive', title: "Erro ao Excluir", description: error.message });
    } finally {
        setIsDeleting(false);
        setIsDeleteDialogOpen(false);
        setPostToDelete(null);
    }
  }

  
  const handleRepublish = async (postId: string) => {
    if (!user) {
      toast({ variant: 'destructive', title: "Erro", description: "Usuário não encontrado."});
      return;
    }
    const postToRepublish = allPosts.find(p => p.id === postId);
    if (!postToRepublish || !postToRepublish.imageUrl || !metaConnection.isConnected) {
         toast({ variant: 'destructive', title: "Erro", description: "Dados do post ou conexão com a Meta ausentes para republicar."});
         return;
    }

    setIsRepublishing(true);
    toast({ title: "Republicando Post...", description: `Enviando post ${postId} para publicação.`});
    
     try {
        const payload = {
            postData: {
                title: postToRepublish.title,
                text: '', // Legenda pode ser extraída ou deixada em branco
                imageUrl: postToRepublish.imageUrl,
                metaConnection: {
                    accessToken: metaConnection.accessToken!,
                    instagramId: metaConnection.instagramId!,
                }
            }
        };

        const response = await fetch('/api/instagram/publish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
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


  const isLoadingInitial = loading && allPosts.length === 0;

  const ConnectCard = () => (
    <Card className="shadow-lg border-dashed border-2 relative">
        {isConnecting && (
             <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-lg p-4 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="mt-4 text-sm font-medium text-gray-700">Conectando com a Meta...</p>
                <p className="text-xs text-gray-500">Aguarde, estamos finalizando a conexão.</p>
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
  );

  const CalendarCard = () => (
    <Card className="shadow-lg border-none">
        <CardHeader>
            <CardTitle className="text-xl">Calendário de Conteúdo</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
             <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                month={displayedMonth}
                onMonthChange={setDisplayedMonth}
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
        <CardFooter className="flex flex-col items-start gap-4 text-sm border-t pt-4">
            <div className="flex flex-wrap items-start gap-x-4 gap-y-2 text-sm pt-4 border-t w-full">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"/> Publicado</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"/> Agendado</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"/> Falhou</div>
            </div>
        </CardFooter>
    </Card>
  )
  
  return (
    <>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente a
                        publicação do seu histórico.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirmDelete}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Excluir
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
      </AlertDialog>
        <Dialog open={isDateModalOpen} onOpenChange={setIsDateModalOpen}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Posts de {selectedDate ? format(selectedDate, "dd 'de' LLLL 'de' yyyy", { locale: ptBR }) : ''}</DialogTitle>
                </DialogHeader>
                <div className="py-4 max-h-[60vh] overflow-y-auto space-y-3 pr-2">
                    {postsForSelectedDay.length > 0 ? (
                        postsForSelectedDay.map(post => (
                           <PostItem key={post.id} post={post} onRepublish={handleRepublish} isRepublishing={isRepublishing} onDelete={handleDeleteRequest} />
                        ))
                    ) : (
                        <p className="text-sm text-gray-500 text-center py-8">Nenhum post para este dia.</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>

      <div className="p-6 space-y-8 max-w-7xl mx-auto bg-gray-50/50">
          <style>{`
              .day-published { position: relative; }
              .day-published::after { content: ''; display: block; position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%); width: 5px; height: 5px; border-radius: 50%; background-color: #22c55e; }
              .day-scheduled { position: relative; }
              .day-scheduled::after { content: ''; display: block; position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%); width: 5px; height: 5px; border-radius: 50%; background-color: #3b82f6; }
              .day-failed { position: relative; }
              .day-failed::after { content: ''; display: block; position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%); width: 5px; height: 5px; border-radius: 50%; background-color: #ef4444; }
              .rdp-day_today:not(.rdp-day_selected) { background-color: #f3f4f6; }
              .rdp-button:hover:not([disabled]):not(.rdp-day_selected):not(.rdp-day_today) { background-color: #f3f4f6; }
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
              {metaConnection.isConnected && (
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                    <ConnectionStatusCard />
                 </motion.div>
              )}
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
                                  scheduledPosts.map((post) => <PostItem key={post.id} post={post} onRepublish={handleRepublish} isRepublishing={isRepublishing} onDelete={handleDeleteRequest} />)
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
                                  pastPosts.map((post) => <PostItem key={post.id} post={post} onRepublish={handleRepublish} isRepublishing={isRepublishing} onDelete={handleDeleteRequest} />)
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
      </div>
    </>
  );
}



    