
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Plus,
  Edit,
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
  Trash2,
  X,
  Send,
  Calendar as CalendarIcon,
  Search,
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
    DialogFooter,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { format, isFuture, isPast, startOfDay, startOfMonth, startOfYear, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getScheduledPosts, deletePost, schedulePost, type PostDataOutput, PostDataInput } from "@/lib/services/posts-service";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import Link from "next/link";


interface DisplayPost {
    id: string;
    title: string;
    text: string;
    imageUrl?: string;
    status: 'scheduled' | 'publishing' | 'published' | 'failed';
    date: Date;
    formattedDate: string;
    formattedTime: string;
    platforms: string[];
    pageName?: string;
}

const PostItem = ({ post, onRepublish, isRepublishing, onDelete }: { post: DisplayPost, onRepublish: (post: DisplayPost) => void, isRepublishing: boolean, onDelete: (postId: string) => void }) => {
    const statusConfig = {
        published: { icon: CheckCircle, className: "bg-green-100 text-green-700" },
        scheduled: { icon: Clock, className: "bg-blue-100 text-blue-700" },
        failed: { icon: AlertTriangle, className: "bg-red-100 text-red-700" },
        publishing: { icon: Loader2, className: "bg-yellow-100 text-yellow-700 animate-spin" },
    };

    const currentStatus = post.status as keyof typeof statusConfig;
    const { icon: StatusIcon, className: statusClassName } = statusConfig[currentStatus] || {};
    
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
                          onClick={() => onRepublish(post)}
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

const PageSelectionModal = ({ pages, isOpen, onSelect, onCancel }: { pages: any[], isOpen: boolean, onSelect: (page: any) => void, onCancel: () => void }) => {
    const [selectedPageId, setSelectedPageId] = useState<string | null>(pages.length > 0 ? pages[0].id : null);
    const [searchQuery, setSearchQuery] = useState('');

    const normalizeText = (text: string) => {
        return text
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    };
    
    const filteredPages = useMemo(() => {
        if (!searchQuery) return pages;
        const normalizedQuery = normalizeText(searchQuery);
        return pages.filter(p => 
            normalizeText(p.name).includes(normalizedQuery)
        );
    }, [pages, searchQuery]);

    const handleSelect = () => {
        const page = pages.find(p => p.id === selectedPageId);
        if (page) {
            onSelect(page);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Selecione uma Página do Facebook</DialogTitle>
                    <DialogDescription>
                        Encontramos {pages.length} página(s). Por favor, escolha a que você deseja conectar à FlowUp.
                    </DialogDescription>
                </DialogHeader>
                <div className="relative my-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Pesquisar por nome..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="max-h-80 overflow-y-auto pr-2">
                    <RadioGroup value={selectedPageId ?? ''} onValueChange={setSelectedPageId} className="space-y-3">
                        {filteredPages.map(page => (
                            <Label key={page.id} htmlFor={page.id} className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 has-[:checked]:border-primary has-[:checked]:bg-blue-50">
                                <RadioGroupItem value={page.id} id={page.id} />
                                <div>
                                    <p className="font-semibold text-gray-800">{page.name}</p>
                                </div>
                            </Label>
                        ))}
                    </RadioGroup>
                    {filteredPages.length === 0 && (
                        <p className="text-center text-sm text-gray-500 py-4">Nenhuma página encontrada com sua busca.</p>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onCancel}>Cancelar</Button>
                    <Button onClick={handleSelect} disabled={!selectedPageId}>Conectar Página Selecionada</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


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

  const [isRepublishModalOpen, setIsRepublishModalOpen] = useState(false);
  const [postToRepublish, setPostToRepublish] = useState<DisplayPost | null>(null);
  const [republishScheduleType, setRepublishScheduleType] = useState<'now' | 'schedule'>('now');
  const [republishScheduleDate, setRepublishScheduleDate] = useState('');
  
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [pendingPages, setPendingPages] = useState<any[]>([]);


  const fetchPageData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
        const [postsResults, metaResult] = await Promise.all([
            getScheduledPosts(user.uid),
            getMetaConnection(user.uid),
        ]);

        if (Array.isArray(postsResults) && !postsResults[0]?.error) {
            const displayPosts = postsResults
                .filter(result => result.success && result.post)
                .map((result) => {
                    const post = result.post!;
                    const scheduledDate = new Date(post.scheduledAt);
                    return {
                        id: post.id,
                        title: post.title,
                        text: post.text,
                        imageUrl: post.imageUrl,
                        status: post.status,
                        date: scheduledDate,
                        formattedDate: format(scheduledDate, "dd 'de' LLLL", { locale: ptBR }),
                        formattedTime: format(scheduledDate, 'HH:mm'),
                        platforms: post.platforms,
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
        
        setMetaConnection(metaResult);

    } catch (error: any) {
        console.error("Failed to fetch page data:", error);
        toast({ variant: 'destructive', title: "Erro ao Carregar Dados", description: "Não foi possível carregar os dados da página." });
    }

    setLoading(false);
  }, [user, toast]);


  useEffect(() => {
    const handleConnectionCallback = async () => {
      const code = searchParams.get('code');
      // Adicionamos a verificação `!isConnecting` para evitar o loop
      if (!code || isConnecting || !user) return;

      setIsConnecting(true);
      // Limpamos a URL imediatamente para evitar re-gatilhos
      router.replace('/dashboard/conteudo', undefined); 

      try {
        // Etapa 1: Obter o userAccessToken
        const tokenResponse = await fetch('/api/meta/callback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
        });
        const tokenResult = await tokenResponse.json();
        if (!tokenResponse.ok || !tokenResult.success || !tokenResult.userAccessToken) {
            throw new Error(tokenResult.error || "Falha ao obter o token de acesso do usuário.");
        }
        const userAccessToken = tokenResult.userAccessToken;

        // Etapa 2: Salvar o token no Firestore em estado pendente
        await updateMetaConnection(user.uid, {
            isConnected: false,
            pending: true,
            userAccessToken: userAccessToken,
        });

        // Etapa 3: Buscar as páginas usando o token salvo
        const pagesResponse = await fetch('/api/meta/callback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userAccessToken: userAccessToken }),
        });
        const pagesResult = await pagesResponse.json();
        if (!pagesResponse.ok || !pagesResult.success) {
            throw new Error(pagesResult.error || "Falha ao buscar as páginas do usuário.");
        }

        if (pagesResult.pages && pagesResult.pages.length > 1) {
            setPendingPages(pagesResult.pages);
            setIsSelectionModalOpen(true);
        } else if (pagesResult.pages && pagesResult.pages.length === 1) {
            await handlePageSelection(pagesResult.pages[0]);
        } else {
            throw new Error("Nenhuma página do Facebook foi encontrada para conectar.");
        }

      } catch (err: any) {
        toast({
            variant: "destructive",
            title: "Falha na Conexão",
            description: err.message,
        });
        setIsConnecting(false);
      }
    };

    if (searchParams.get('code')) {
        handleConnectionCallback();
    }
  }, [searchParams, user, isConnecting, router, toast]);

  const handlePageSelection = async (page: any) => {
    if (!user) return;

    setIsConnecting(true); 
    setIsSelectionModalOpen(false);

    try {
        const connectionDoc = await getMetaConnection(user.uid);
        if (!connectionDoc.userAccessToken) {
            throw new Error("Token de usuário pendente não encontrado. Tente reconectar.");
        }

        await updateMetaConnection(user.uid, {
            isConnected: true,
            pageId: page.id,
            pageName: page.name,
            accessToken: page.access_token,
            userAccessToken: connectionDoc.userAccessToken, 
            pending: false,
        });

        toast({
            variant: "success",
            title: "Conexão Estabelecida!",
            description: `Página "${page.name}" conectada com sucesso.`,
        });
        await fetchPageData();
    } catch (err: any) {
         toast({
            variant: "destructive",
            title: "Falha ao Salvar Conexão",
            description: err.message,
        });
    } finally {
        setIsConnecting(false);
        setPendingPages([]);
    }
  };


  useEffect(() => {
    if(user && !searchParams.get('code')) {
        fetchPageData();
    }
  }, [user, fetchPageData, searchParams]);
  
    const { scheduledPosts, pastPosts, calendarModifiers, postsForSelectedDay } = useMemo(() => {
        const scheduled = allPosts.filter(p => p.status === 'scheduled');
        
        let historyBase = allPosts.filter(p => p.status === 'published' || p.status === 'failed' || p.status === 'publishing');

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
                    return null;
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
    
    useEffect(() => {
        if (selectedDate && postsForSelectedDay.length > 0) {
            setIsDateModalOpen(true);
        }
    }, [selectedDate, postsForSelectedDay]);

    const handleDateSelect = (date: Date | undefined) => {
        if (!date) return;
        setSelectedDate(date);
        const postsOnDay = allPosts.filter(p => isSameDay(p.date, date));
        if (postsOnDay.length > 0) {
            setIsDateModalOpen(true);
        }
    }

    const handleConnectMeta = () => {
        const clientId = '826418333144156';
        const redirectUri = new URL('/dashboard/conteudo', window.location.origin).toString();
        const scope = 'pages_manage_engagement,pages_manage_posts,pages_read_engagement,pages_read_user_content,pages_show_list,business_management';
        const authUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${user?.uid}&scope=${scope}&response_type=code`;
        window.location.href = authUrl;
  };
  
  const handleDisconnectMeta = async () => {
    if (!user) return;
    await updateMetaConnection(user.uid, { isConnected: false });
    fetchPageData();
    toast({ title: "Desconectado", description: "A conexão com o Facebook foi removida." });
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
        fetchPageData();
    } catch (error: any) {
        toast({ variant: 'destructive', title: "Erro ao Excluir", description: error.message });
    } finally {
        setIsDeleting(false);
        setIsDeleteDialogOpen(false);
        setPostToDelete(null);
    }
  }

  
  const handleRepublish = (post: DisplayPost) => {
    if (!user) {
      toast({ variant: 'destructive', title: "Erro", description: "Usuário não encontrado."});
      return;
    }
    setPostToRepublish(post);
    setRepublishScheduleType('now');
    setRepublishScheduleDate('');
    setIsRepublishModalOpen(true);
  };

  const handleConfirmRepublish = async () => {
    if (!user || !postToRepublish || !metaConnection.isConnected || !postToRepublish.imageUrl) {
        toast({ variant: 'destructive', title: "Erro", description: "Dados insuficientes para republicar."});
        return;
    }
    if (republishScheduleType === 'schedule' && !republishScheduleDate) {
        toast({ variant: "destructive", title: "Data inválida", description: "Por favor, selecione data e hora para o agendamento."});
        return;
    }

    setIsRepublishing(true);
    toast({ title: "Republicando...", description: "Enviando seu post para ser publicado novamente."});

    const postInput: PostDataInput = {
        title: postToRepublish.title,
        text: postToRepublish.text,
        media: postToRepublish.imageUrl,
        platforms: ['facebook'], // Hardcoded to facebook
        scheduledAt: republishScheduleType === 'schedule' ? new Date(republishScheduleDate) : new Date(),
        metaConnection: metaConnection,
    };

    const result = await schedulePost(user.uid, postInput);

    setIsRepublishing(false);
    setIsRepublishModalOpen(false);
    setPostToRepublish(null);

    await fetchPageData();

    if (result.success) {
        toast({ variant: 'success', title: "Sucesso!", description: `Post ${republishScheduleType === 'now' ? 'publicado' : 'agendado para republicação'}!` });
    } else {
        toast({ variant: 'destructive', title: "Erro ao Republicar", description: result.error });
    }
  };

  const isLoadingInitial = loading && allPosts.length === 0;

  const ConnectCard = () => (
    <Card className="shadow-lg border-dashed border-2 relative">
        {(isConnecting) && (
             <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-lg p-4 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="mt-4 text-sm font-medium text-gray-700">Conectando com a Meta...</p>
                <p className="text-xs text-gray-500">Aguarde, estamos finalizando a conexão.</p>
            </div>
        )}
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
                <LinkIcon className="w-6 h-6 text-gray-700" />
                Conecte sua Página do Facebook
            </CardTitle>
            <p className="text-gray-600 text-sm pt-2">Para publicar e agendar seus posts, você precisa conectar sua página do Facebook.</p>
        </CardHeader>
        <CardContent>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-600">
                        <Facebook className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-800">Facebook Login for Business</h3>
                        <p className="text-sm text-gray-500">Conecte sua página profissional</p>
                    </div>
                </div>
                <Button variant="outline" onClick={handleConnectMeta} disabled={isConnecting}>
                    Conectar ao Facebook
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
                Página Conectada
            </CardTitle>
        </CardHeader>
        <CardContent>
             <div className="flex items-start justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-4">
                     <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white shadow-sm shrink-0">
                        <Facebook className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-green-900 leading-tight">Conectado</h3>
                        <p className="text-sm text-green-800 font-medium truncate" title={metaConnection.pageName}>
                            {metaConnection.pageName}
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
          <CardContent className="flex flex-col items-center justify-center">
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
               <div className="w-full border-t pt-4 mt-6">
                  <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"/> Publicado</div>
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"/> Agendado</div>
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"/> Falhou</div>
                  </div>
              </div>
          </CardContent>
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
      <Dialog open={isRepublishModalOpen} onOpenChange={setIsRepublishModalOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Republicar Post no Facebook</DialogTitle>
                <DialogDescription>Escolha quando você quer republicar este conteúdo.</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-6">
                <div>
                    <Label className="font-semibold">Onde Publicar?</Label>
                    <div className="grid grid-cols-1 gap-4 mt-2">
                        <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer peer-data-[state=checked]:border-primary" data-state="checked">
                            <Checkbox id="republish-facebook" checked disabled />
                            <Label htmlFor="republish-facebook" className="flex items-center gap-2 cursor-pointer">
                                <Facebook className="w-5 h-5 text-blue-600" />
                                Facebook
                            </Label>
                        </div>
                    </div>
                </div>
                <div>
                    <Label className="font-semibold">Quando publicar?</Label>
                    <RadioGroup value={republishScheduleType} onValueChange={(v) => setRepublishScheduleType(v as 'now' | 'schedule')} className="grid grid-cols-2 gap-4 mt-2">
                        <div>
                            <RadioGroupItem value="now" id="republish-now" className="peer sr-only" />
                            <Label htmlFor="republish-now" className="flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer peer-data-[state=checked]:border-primary">
                                <Clock className="w-6 h-6 mb-2" />
                                Publicar Agora
                            </Label>
                        </div>
                        <div>
                            <RadioGroupItem value="schedule" id="republish-schedule" className="peer sr-only" />
                            <Label htmlFor="republish-schedule" className="flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer peer-data-[state=checked]:border-primary">
                                <CalendarIcon className="w-6 h-6 mb-2" />
                                Agendar
                            </Label>
                        </div>
                    </RadioGroup>
                    {republishScheduleType === 'schedule' && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                            <Input type="datetime-local" value={republishScheduleDate} onChange={(e) => setRepublishScheduleDate(e.target.value)} />
                        </motion.div>
                    )}
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsRepublishModalOpen(false)}>Cancelar</Button>
                <Button onClick={handleConfirmRepublish} disabled={isRepublishing || (republishScheduleType === 'schedule' && !republishScheduleDate)}>
                    {isRepublishing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                    {republishScheduleType === 'now' ? 'Republicar' : 'Agendar'}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <PageSelectionModal
        isOpen={isSelectionModalOpen}
        pages={pendingPages}
        onSelect={handlePageSelection}
        onCancel={() => {
            setIsSelectionModalOpen(false);
            setPendingPages([]);
        }}
      />

      <div className="p-6 space-y-8 max-w-7xl mx-auto bg-gray-50/50">
          <style>{`
              .day-published::after, .day-scheduled::after, .day-failed::after {
                  content: '';
                  position: absolute;
                  bottom: 4px;
                  left: 50%;
                  transform: translateX(-50%);
                  width: 6px;
                  height: 6px;
                  border-radius: 50%;
              }
              .rdp-day_selected::after {
                display: none;
              }
              .day-published::after { background-color: #22c55e; }
              .day-scheduled::after { background-color: #3b82f6; }
              .day-failed::after { background-color: #ef4444; }
              .rdp-day_today:not([aria-selected=true]) { 
                  background-color: #f3f4f6; 
                  border-radius: 0.375rem; 
              }
              .rdp-button:hover:not([disabled]):not(.rdp-day_today):not([aria-selected=true]) {
                  background-color: #f3f4f6;
              }
          `}</style>
        
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Conteúdo & Marketing</h1>
            <p className="text-gray-600 mt-1">Crie, agende e analise o conteúdo para sua Página do Facebook.</p>
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
                                      <Facebook className="w-10 h-10 mx-auto text-gray-400 mb-2"/>
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
