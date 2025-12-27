
"use client";

import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { format, isFuture, isSameDay, startOfDay, startOfMonth, startOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import {
  AlertTriangle,
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  Edit,
  Facebook,
  Instagram,
  Link as LinkIcon,
  Loader2,
  LogOut,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { deletePost, getScheduledPosts, schedulePost, type PostDataInput } from "@/lib/services/posts-service";
import { getMetaConnection, updateMetaConnection, type MetaConnectionData } from "@/lib/services/meta-service";
import { getInstagramConnection, updateInstagramConnection, type InstagramConnectionData } from "@/lib/services/instagram-service";
import { config } from "@/lib/config";

/* -------------------------------------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------------------------------------- */

type PostStatus = "scheduled" | "publishing" | "published" | "failed";

interface DisplayPost {
  id: string;
  title: string;
  text: string;
  imageUrl?: string;
  status: PostStatus;
  date: Date;
  formattedDate: string;
  formattedTime: string;
  platforms: string[];
  pageName?: string;
  instagramUsername?: string;
}

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
}

type HistoryFilter = "last-7-days" | "this-month" | "this-year" | "all-time";
type RepublishScheduleType = "now" | "schedule";

/* -------------------------------------------------------------------------------------------------
 * Constants / Utils
 * ------------------------------------------------------------------------------------------------- */

const PLACEHOLDER_IMAGE = "https://placehold.co/400";

const META_OAUTH = {
  clientId: "826418333144156",
  scope:
    "pages_manage_engagement,pages_manage_posts,pages_read_engagement,pages_read_user_content,pages_show_list,business_management",
};

const STATUS_CONFIG: Record<
  PostStatus,
  { icon: React.ComponentType<{ className?: string }>; badgeClassName: string }
> = {
  published: { icon: CheckCircle, badgeClassName: "bg-green-100 text-green-700" },
  scheduled: { icon: Clock, badgeClassName: "bg-blue-100 text-blue-700" },
  failed: { icon: AlertTriangle, badgeClassName: "bg-red-100 text-red-700" },
  publishing: { icon: Loader2, badgeClassName: "bg-yellow-100 text-yellow-700 animate-spin" },
};

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getHistoryStartDate(filter: HistoryFilter) {
  const today = new Date();
  switch (filter) {
    case "last-7-days": {
      const last7 = new Date(today);
      last7.setDate(today.getDate() - 7);
      return startOfDay(last7);
    }
    case "this-month":
      return startOfMonth(today);
    case "this-year":
      return startOfYear(today);
    case "all-time":
    default:
      return null;
  }
}

function toDisplayPost(post: any): DisplayPost {
  const scheduledDate = new Date(post.scheduledAt);
  return {
    id: post.id,
    title: post.title,
    text: post.text,
    imageUrl: post.imageUrl,
    status: post.status as PostStatus,
    date: scheduledDate,
    formattedDate: format(scheduledDate, "dd 'de' LLLL", { locale: ptBR }),
    formattedTime: format(scheduledDate, "HH:mm"),
    platforms: post.platforms ?? [],
    pageName: post.pageName,
    instagramUsername: post.instagramUsername,
  };
}

const CALENDAR_DOT_STYLES = `
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
.rdp-day_selected::after { display: none; }
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
`;

/* -------------------------------------------------------------------------------------------------
 * Components
 * ------------------------------------------------------------------------------------------------- */

function PostItem({
  post,
  onRepublish,
  isRepublishing,
  onDelete,
}: {
  post: DisplayPost;
  onRepublish: (post: DisplayPost) => void;
  isRepublishing: boolean;
  onDelete: (postId: string) => void;
}) {
  const cfg = STATUS_CONFIG[post.status];
  const StatusIcon = cfg?.icon;
  const imageSrc = typeof post.imageUrl === "string" ? post.imageUrl : PLACEHOLDER_IMAGE;

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
            {StatusIcon ? <StatusIcon className="w-4 h-4" /> : null}
            <span>
              {post.formattedDate} às {post.formattedTime}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-500 mt-1.5">
            {post.platforms?.includes("facebook") ? (
              <div className="flex items-center gap-1.5">
                <Facebook className="w-3.5 h-3.5 text-blue-600" />
                {post.pageName ? <span className="font-medium">{post.pageName}</span> : null}
              </div>
            ) : null}
             {post.platforms?.includes('instagram') && (
                <div className="flex items-center gap-1.5">
                    <Instagram className="w-3.5 h-3.5" />
                    {post.instagramUsername ? (
                    <span className="font-medium">@{post.instagramUsername}</span>
                    ) : (
                    <span className="font-medium">Instagram</span>
                    )}
                </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <Badge variant="outline" className={cfg?.badgeClassName}>
          {post.status}
        </Badge>

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
              disabled={isRepublishing || post.status === "publishing"}
            >
              {isRepublishing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Republicar
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem className="text-red-600 focus:text-red-700" onClick={() => onDelete(post.id)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}

function PageSelectionModal({
  pages,
  isOpen,
  onSelect,
  onCancel,
}: {
  pages: FacebookPage[];
  isOpen: boolean;
  onSelect: (page: FacebookPage) => void;
  onCancel: () => void;
}) {
  const [selectedPageId, setSelectedPageId] = useState<string | null>(pages.length > 0 ? pages[0].id : null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // keep selection stable when pages list changes
    setSelectedPageId(pages.length > 0 ? pages[0].id : null);
  }, [pages]);

  const filteredPages = useMemo(() => {
    if (!searchQuery) return pages;
    const q = normalizeText(searchQuery);
    return pages.filter((p) => normalizeText(p.name).includes(q));
  }, [pages, searchQuery]);

  const handleSelect = () => {
    const page = pages.find((p) => p.id === selectedPageId);
    if (page) onSelect(page);
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
          <RadioGroup value={selectedPageId ?? ""} onValueChange={setSelectedPageId} className="space-y-3">
            {filteredPages.map((page) => (
              <Label
                key={page.id}
                htmlFor={page.id}
                className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 has-[:checked]:border-primary has-[:checked]:bg-blue-50"
              >
                <RadioGroupItem value={page.id} id={page.id} />
                <div>
                  <p className="font-semibold text-gray-800">{page.name}</p>
                </div>
              </Label>
            ))}
          </RadioGroup>

          {filteredPages.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-4">Nenhuma página encontrada com sua busca.</p>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSelect} disabled={!selectedPageId}>
            Conectar Página Selecionada
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConnectCard({
  platform,
  onConnect,
  isConnected,
  isLoading,
}: {
  platform: 'facebook' | 'instagram';
  onConnect: () => void;
  isConnected: boolean;
  isLoading: boolean;
}) {
  const content = {
    facebook: {
      title: "Conecte sua Página do Facebook",
      description: "Para publicar e agendar seus posts, você precisa conectar sua página.",
      buttonText: "Conectar ao Facebook",
      icon: <Facebook className="w-6 h-6 text-white" />,
      bgColor: "bg-blue-600",
    },
    instagram: {
      title: "Conecte seu Instagram",
      description: "Conecte seu perfil para publicar e agendar posts no Instagram.",
      buttonText: "Conectar ao Instagram",
      icon: <Instagram className="w-6 h-6 text-white" />,
      bgColor: "bg-gradient-to-br from-purple-500 to-indigo-500",
    }
  };

  const { title, description, buttonText, icon, bgColor } = content[platform];
  
  if (isConnected) return null;

  return (
    <Card className="shadow-lg border-dashed border-2 relative">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <LinkIcon className="w-6 h-6 text-gray-700" />
          {title}
        </CardTitle>
        <p className="text-gray-600 text-sm pt-2">{description}</p>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bgColor}`}>
              {icon}
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">{platform === 'facebook' ? "Facebook Login" : "Instagram API"}</h3>
              <p className="text-sm text-gray-500">{platform === 'facebook' ? 'Conecte sua página profissional' : 'Método novo'}</p>
            </div>
          </div>
          <Button variant="outline" onClick={onConnect} disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {buttonText}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ConnectionStatusCard({
  platform,
  pageName,
  onDisconnect,
}: {
  platform: 'facebook' | 'instagram';
  pageName?: string;
  onDisconnect: () => void;
}) {
  const content = {
      facebook: {
        title: "Página Conectada",
        icon: <Facebook className="w-6 h-6 text-blue-600" />
      },
      instagram: {
        title: "Instagram Conectado",
        icon: <Instagram className="w-6 h-6 text-pink-500" />
      }
  };
  const { title, icon } = content[platform];
  
  return (
    <Card className="shadow-lg border-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <LinkIcon className="w-5 h-5 text-gray-700" />
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="flex items-start justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white shadow-sm shrink-0">
              {icon}
            </div>
            <div>
              <h3 className="font-semibold text-green-900 leading-tight">Conectado</h3>
              <p className="text-sm text-green-800 font-medium truncate" title={pageName}>
                {pageName}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onDisconnect}
            className="text-red-600 hover:bg-red-100 shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CalendarCard({
  selectedDate,
  onSelect,
  month,
  onMonthChange,
  modifiers,
}: {
  selectedDate: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  month: Date;
  onMonthChange: (month: Date) => void;
  modifiers: Record<string, Date[]>;
}) {
  return (
    <Card className="shadow-lg border-none">
      <CardHeader>
        <CardTitle className="text-xl">Calendário de Conteúdo</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onSelect}
          month={month}
          onMonthChange={onMonthChange}
          className="p-0"
          locale={ptBR}
          modifiers={modifiers}
          modifiersClassNames={{
            published: "day-published",
            scheduled: "day-scheduled",
            failed: "day-failed",
          }}
        />

        <div className="w-full border-t pt-4 mt-6">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" /> Publicado
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" /> Agendado
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" /> Falhou
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------------------------------
 * Page
 * ------------------------------------------------------------------------------------------------- */

export default function Conteudo() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const effectRan = useRef(false);

  // Data
  const [loading, setLoading] = useState(true);
  const [allPosts, setAllPosts] = useState<DisplayPost[]>([]);
  const [metaConnection, setMetaConnection] = useState<MetaConnectionData>({ isConnected: false });
  const [instagramConnection, setInstagramConnection] = useState<InstagramConnectionData>({ isConnected: false });

  // Connection flow
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [pendingPages, setPendingPages] = useState<FacebookPage[]>([]);

  // Calendar modal
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [displayedMonth, setDisplayedMonth] = useState<Date>(new Date());

  // History filter
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("this-month");

  // Delete dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Republish modal
  const [isRepublishModalOpen, setIsRepublishModalOpen] = useState(false);
  const [postToRepublish, setPostToRepublish] = useState<DisplayPost | null>(null);
  const [republishScheduleType, setRepublishScheduleType] = useState<RepublishScheduleType>("now");
  const [republishScheduleDate, setRepublishScheduleDate] = useState(""); // datetime-local value
  const [isRepublishing, setIsRepublishing] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(true);

  const isLoadingInitial = loading && allPosts.length === 0;

  const fetchPageData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setCheckingConnection(true);

    try {
      const [postsResults, metaResult, instagramResult] = await Promise.all([
        getScheduledPosts(user.uid), 
        getMetaConnection(user.uid),
        getInstagramConnection(user.uid)
      ]);

      if (Array.isArray(postsResults) && !postsResults[0]?.error) {
        setAllPosts(postsResults.filter(r => r.success && r.post).map(r => toDisplayPost(r.post)).sort((a, b) => b.date.getTime() - a.date.getTime()));
      } else if (postsResults?.[0]?.error) {
        toast({ variant: "destructive", title: "Erro ao Carregar Posts", description: postsResults[0].error });
      } else {
        setAllPosts([]);
      }
      setMetaConnection(metaResult);
      setInstagramConnection(instagramResult);
    } catch (err) {
      console.error("Failed to fetch page data:", err);
      toast({ variant: "destructive", title: "Erro ao Carregar Dados", description: "Não foi possível carregar os dados da página." });
    } finally {
      setLoading(false);
      setCheckingConnection(false);
    }
  }, [toast, user]);

  const handlePageSelection = useCallback(async (page: FacebookPage) => {
    if (!user) return;

    setIsConnecting(true);
    setIsSelectionModalOpen(false);
    try {
        const currentConnection = await getMetaConnection(user.uid);
        if (!currentConnection.userAccessToken) {
            throw new Error("Token de usuário pendente não encontrado. Tente reconectar.");
        }

        await updateMetaConnection(user.uid, {
            isConnected: true,
            pageId: page.id,
            pageName: page.name,
            accessToken: page.access_token,
            userAccessToken: currentConnection.userAccessToken,
        });

        toast({ variant: "success", title: "Conexão Estabelecida!", description: `Página "${page.name}" conectada com sucesso.` });
        await fetchPageData();
    } catch (err: any) {
        toast({ variant: "destructive", title: "Falha ao Salvar Conexão", description: err?.message ?? "Erro" });
    } finally {
        setIsConnecting(false);
        setPendingPages([]);
    }
  }, [fetchPageData, toast, user]);

  useEffect(() => {
    if (typeof window === 'undefined' || !user || effectRan.current) {
      fetchPageData();
      return;
    }
  
    const code = searchParams.get("code");
    if (!code) {
      fetchPageData();
      return;
    }
  
    effectRan.current = true;
    setIsConnecting(true);
  
    const runConnectionFlow = async () => {
      try {
        const tokenResponse = await fetch("/api/meta/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, redirectUri: window.location.origin + window.location.pathname }),
        });
        const tokenResult = await tokenResponse.json();
        if (!tokenResult.success) throw new Error(tokenResult.error);
        const { userAccessToken } = tokenResult;
        
        await updateMetaConnection(user.uid, { userAccessToken, pending: true });
        router.replace('/dashboard/conteudo', undefined);
        
        const pagesResponse = await fetch("/api/meta/callback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userAccessToken }),
        });
        const pagesResult = await pagesResponse.json();
        if (!pagesResult.success) throw new Error(pagesResult.error);

        const pages: FacebookPage[] = pagesResult.pages || [];
        if (pages.length > 1) {
            setPendingPages(pages);
            setIsSelectionModalOpen(true);
        } else if (pages.length === 1) {
            await handlePageSelection(pages[0]);
        } else {
            throw new Error("Nenhuma página do Facebook foi encontrada para conectar.");
        }
      } catch (err: any) {
        toast({ variant: "destructive", title: "Falha na Conexão", description: err.message, duration: 9000 });
        setIsConnecting(false);
        router.replace('/dashboard/conteudo', undefined);
      }
    };

    const handleInstagramCallback = async () => {
        const instagramConnectionSuccess = searchParams.get("instagram_connection_success");
        if (instagramConnectionSuccess !== "true") return;

        const accessToken = searchParams.get("instagram_accessToken");
        const instagramId = searchParams.get("instagram_id");
        const instagramUsername = searchParams.get("instagram_username");
        const uidFromState = searchParams.get("user_id_from_state");

        if (uidFromState && uidFromState !== user.uid) {
            toast({ variant: "destructive", title: "Falha de Segurança", description: "Incompatibilidade de usuários na autenticação."});
            return;
        }

        if (accessToken && instagramId && instagramUsername) {
            await updateInstagramConnection(user.uid, {
                isConnected: true,
                accessToken,
                instagramId,
                instagramUsername,
            });
            toast({ variant: "success", title: "Instagram Conectado!", description: `Conexão com @${instagramUsername} estabelecida.`});
            await fetchPageData();
        } else {
            toast({ variant: "destructive", title: "Falha na Conexão", description: "Dados insuficientes retornados pelo Instagram."});
        }
        router.replace('/dashboard/conteudo', undefined);
    };
  
    if (searchParams.get("instagram_connection_success")) {
        handleInstagramCallback();
    } else {
        runConnectionFlow();
    }
  }, [user, searchParams, router, toast, handlePageSelection, fetchPageData]);


  const { scheduledPosts, pastPosts, calendarModifiers, postsForSelectedDay } = useMemo(() => {
    const scheduled = allPosts.filter((p) => p.status === "scheduled");
    const historyBase = allPosts.filter((p) => p.status === "published" || p.status === "failed" || p.status === "publishing");
    const startDate = getHistoryStartDate(historyFilter);
    const filteredHistory = startDate ? historyBase.filter((p) => p.date >= startDate) : historyBase;
    const modifiers = {
      published: allPosts.filter((p) => p.status === "published").map((p) => p.date),
      scheduled: allPosts.filter((p) => p.status === "scheduled" && isFuture(p.date)).map((p) => p.date),
      failed: allPosts.filter((p) => p.status === "failed").map((p) => p.date),
    };
    const postsOnDay = selectedDate ? allPosts.filter((p) => isSameDay(p.date, selectedDate)) : [];
    return { scheduledPosts: scheduled, pastPosts: filteredHistory, calendarModifiers: modifiers, postsForSelectedDay: postsOnDay };
  }, [allPosts, historyFilter, selectedDate]);

  useEffect(() => {
    if (selectedDate && postsForSelectedDay.length > 0) setIsDateModalOpen(true);
  }, [postsForSelectedDay.length, selectedDate]);

  const handleDateSelect = useCallback((date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    if (allPosts.some((p) => isSameDay(p.date, date))) setIsDateModalOpen(true);
  }, [allPosts]);

  const handleConnectMeta = useCallback(() => {
    const redirectUri = new URL("/dashboard/conteudo", window.location.origin).toString();
    const authUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${META_OAUTH.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${user?.uid}&scope=${META_OAUTH.scope}&response_type=code`;
    window.location.href = authUrl;
  }, [user?.uid]);

  const handleConnectInstagram = () => {
    const clientId = config.instagram.appId;
    const redirectUri = config.instagram.redirectUri;

    if (!clientId || !redirectUri) {
      toast({
        variant: "destructive",
        title: "Erro de Configuração",
        description: "As credenciais do Instagram não estão configuradas.",
      });
      return;
    }

    const state = user?.uid;
    const scope = "instagram_business_basic,instagram_business_content_publish";
    const responseType = "code";

    const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=${responseType}&state=${state}`;
    window.location.href = authUrl;
  };

  const handleDisconnectMeta = useCallback(async () => {
    if (!user) return;
    await updateMetaConnection(user.uid, { isConnected: false });
    await fetchPageData();
    toast({ title: "Desconectado", description: "A conexão com o Facebook foi removida." });
  }, [fetchPageData, toast, user]);

  const handleDisconnectInstagram = useCallback(async () => {
    if (!user) return;
    await updateInstagramConnection(user.uid, { isConnected: false });
    await fetchPageData();
    toast({ title: "Desconectado", description: "A conexão com o Instagram foi removida." });
  }, [fetchPageData, toast, user]);

  const handleDeleteRequest = useCallback((postId: string) => {
    setPostToDelete(postId);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!user || !postToDelete) return;
    setIsDeleting(true);
    try {
      await deletePost(user.uid, postToDelete);
      toast({ title: "Sucesso!", description: "A publicação foi excluída." });
      await fetchPageData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro ao Excluir", description: err?.message ?? "Erro" });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setPostToDelete(null);
    }
  }, [fetchPageData, postToDelete, toast, user]);

  const handleRepublish = useCallback((post: DisplayPost) => {
    if (!user) return;
    setPostToRepublish(post);
    setRepublishScheduleType("now");
    setRepublishScheduleDate("");
    setIsRepublishModalOpen(true);
  }, [user]);

 const handleConfirmRepublish = useCallback(async () => {
    if (!user || !postToRepublish || !postToRepublish.imageUrl) return;

    const useInstagram = postToRepublish.platforms.includes('instagram');
    const useFacebook = postToRepublish.platforms.includes('facebook');
    let connection: MetaConnectionData | InstagramConnectionData | undefined;
    let postInputPlatforms: Array<'instagram' | 'facebook'> = [];

    if (useInstagram) {
        if (!instagramConnection.isConnected) {
            toast({ variant: "destructive", title: "Instagram não conectado", description: "Conecte o Instagram para republicar."});
            return;
        }
        connection = instagramConnection;
        postInputPlatforms.push('instagram');
    } else if (useFacebook) {
         if (!metaConnection.isConnected) {
            toast({ variant: "destructive", title: "Facebook não conectado", description: "Conecte o Facebook para republicar."});
            return;
        }
        connection = metaConnection;
        postInputPlatforms.push('facebook');
    } else {
        toast({ variant: "destructive", title: "Nenhuma plataforma válida", description: "O post original não parece ser para Facebook ou Instagram."});
        return;
    }
    
    if (republishScheduleType === 'schedule' && !republishScheduleDate) {
      toast({ variant: "destructive", title: "Data inválida", description: "Por favor, selecione data e hora para o agendamento." });
      return;
    }
    
    setIsRepublishing(true);
    toast({ title: "Republicando...", description: "Enviando seu post para ser publicado novamente." });

    const input: PostDataInput = {
      title: postToRepublish.title,
      text: postToRepublish.text,
      media: postToRepublish.imageUrl,
      platforms: postInputPlatforms,
      scheduledAt: republishScheduleType === 'schedule' ? new Date(republishScheduleDate) : new Date(),
    };

    if (useInstagram) {
        input.instagramConnection = instagramConnection;
    } else {
        input.metaConnection = metaConnection;
    }
    
    const result = await schedulePost(user.uid, input);

    setIsRepublishing(false);
    setIsRepublishModalOpen(false);
    setPostToRepublish(null);
    await fetchPageData();

    if (result.success) {
      toast({ variant: "success", title: "Sucesso!", description: `Post ${republishScheduleType === "now" ? "publicado" : "agendado para republicação"}!` });
    } else {
      toast({ variant: "destructive", title: "Erro ao Republicar", description: result.error });
    }
  }, [fetchPageData, metaConnection, instagramConnection, postToRepublish, republishScheduleDate, republishScheduleType, toast, user]);


  return (
    <>
      <style>{CALENDAR_DOT_STYLES}</style>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita. Isso excluirá permanentemente a publicação do seu histórico.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={isDateModalOpen} onOpenChange={setIsDateModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Posts de {selectedDate ? format(selectedDate, "dd 'de' LLLL 'de' yyyy", { locale: ptBR }) : ""}</DialogTitle></DialogHeader>
          <div className="py-4 max-h-[60vh] overflow-y-auto space-y-3 pr-2">{postsForSelectedDay.length > 0 ? postsForSelectedDay.map((post) => <PostItem key={post.id} post={post} onRepublish={handleRepublish} isRepublishing={isRepublishing} onDelete={handleDeleteRequest} />) : <p className="text-sm text-gray-500 text-center py-8">Nenhum post para este dia.</p>}</div>
        </DialogContent>
      </Dialog>
      <Dialog open={isRepublishModalOpen} onOpenChange={setIsRepublishModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Republicar Post</DialogTitle>
            <DialogDescription>Escolha quando você quer republicar este conteúdo.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-6">
            <div>
              <Label className="font-semibold">Onde Publicar?</Label>
              <div className="grid grid-cols-1 gap-4 mt-2">
                 <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer peer-data-[state=checked]:border-primary" data-state="checked">
                   <Checkbox id="republish-platform" checked disabled />
                   <Label htmlFor="republish-platform" className="flex items-center gap-2 cursor-pointer">
                     {postToRepublish?.platforms.includes('instagram') ? <Instagram className="w-5 h-5 text-pink-500" /> : <Facebook className="w-5 h-5 text-blue-600" />}
                     {postToRepublish?.platforms.includes('instagram') ? 'Instagram' : 'Facebook'}
                   </Label>
                 </div>
              </div>
            </div>
            <div>
              <Label className="font-semibold">Quando publicar?</Label>
              <RadioGroup value={republishScheduleType} onValueChange={(v) => setRepublishScheduleType(v as RepublishScheduleType)} className="grid grid-cols-2 gap-4 mt-2">
                <div><RadioGroupItem value="now" id="republish-now" className="peer sr-only" /><Label htmlFor="republish-now" className="flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer peer-data-[state=checked]:border-primary"><Clock className="w-6 h-6 mb-2" />Publicar Agora</Label></div>
                <div><RadioGroupItem value="schedule" id="republish-schedule" className="peer sr-only" /><Label htmlFor="republish-schedule" className="flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer peer-data-[state=checked]:border-primary"><CalendarIcon className="w-6 h-6 mb-2" />Agendar</Label></div>
              </RadioGroup>
              {republishScheduleType === "schedule" ? <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-4"><Input type="datetime-local" value={republishScheduleDate} onChange={(e) => setRepublishScheduleDate(e.target.value)} /></motion.div> : null}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRepublishModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleConfirmRepublish} disabled={isRepublishing || (republishScheduleType === "schedule" && !republishScheduleDate)}>{isRepublishing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}{republishScheduleType === "now" ? "Republicar" : "Agendar"}</Button>
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
          setIsConnecting(false);
        }}
      />
      
      <div className="p-6 space-y-8 max-w-7xl mx-auto bg-gray-50/50">
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Conteúdo & Marketing</h1>
            <p className="text-gray-600 mt-1">Crie, agende e analise o conteúdo para suas redes sociais.</p>
          </div>
          <div className="flex gap-4 pt-2">
            <Button className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-md hover:shadow-lg transition-shadow" onClick={() => router.push("/dashboard/conteudo/gerar")} size="lg"><Sparkles className="w-5 h-5 mr-2" />Gerar Conteúdo com IA</Button>
            <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-shadow" onClick={() => router.push("/dashboard/conteudo/criar")} size="lg"><Plus className="w-5 h-5 mr-2" />Criar Conteúdo</Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
            <CalendarCard selectedDate={selectedDate} onSelect={handleDateSelect} month={displayedMonth} onMonthChange={setDisplayedMonth} modifiers={calendarModifiers} />
            <AnimatePresence>
                <motion.div key="connect-facebook" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                    {!metaConnection.isConnected && !loading && (
                        <ConnectCard platform="facebook" onConnect={handleConnectMeta} isConnected={metaConnection.isConnected} isLoading={isConnecting} />
                    )}
                </motion.div>
                {metaConnection.isConnected && (
                <motion.div key="status-facebook" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                    <ConnectionStatusCard platform="facebook" pageName={metaConnection.pageName} onDisconnect={handleDisconnectMeta} />
                </motion.div>
                )}
                
                <motion.div key="connect-instagram" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                    {!instagramConnection.isConnected && !loading && (
                        <ConnectCard platform="instagram" onConnect={handleConnectInstagram} isConnected={instagramConnection.isConnected} isLoading={checkingConnection} />
                    )}
                </motion.div>
                {instagramConnection.isConnected && (
                    <motion.div key="status-instagram" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                        <ConnectionStatusCard platform="instagram" pageName={`@${instagramConnection.instagramUsername}`} onDisconnect={handleDisconnectInstagram} />
                    </motion.div>
                )}
            </AnimatePresence>
          </div>
          <div className="lg:col-span-2 space-y-8">
            <Card className="shadow-lg border-none">
              <CardHeader><CardTitle className="text-xl">Publicações Agendadas</CardTitle></CardHeader>
              <CardContent>
                <div className="max-h-60 overflow-y-auto space-y-4 pr-3">
                  <AnimatePresence>
                    {isLoadingInitial ? <div className="flex justify-center items-center h-24"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
                      : scheduledPosts.length > 0 ? scheduledPosts.map((post) => <PostItem key={post.id} post={post} onRepublish={handleRepublish} isRepublishing={isRepublishing} onDelete={handleDeleteRequest} />)
                      : <div className="text-center text-gray-500 py-6"><Clock className="w-8 h-8 mx-auto text-gray-400 mb-2" /><p>Nenhuma publicação agendada.</p></div>
                    }
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-lg border-none">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl">Histórico de Publicações</CardTitle>
                <Select value={historyFilter} onValueChange={(v) => setHistoryFilter(v as HistoryFilter)}>
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filtrar por período" /></SelectTrigger>
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
                    {isLoadingInitial ? <div className="flex justify-center items-center h-40"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
                      : pastPosts.length > 0 ? pastPosts.map((post) => <PostItem key={post.id} post={post} onRepublish={handleRepublish} isRepublishing={isRepublishing} onDelete={handleDeleteRequest} />)
                      : <div className="text-center text-gray-500 py-10"><Facebook className="w-10 h-10 mx-auto text-gray-400 mb-2" /><p>Nenhuma publicação encontrada no histórico.</p></div>
                    }
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <Link href="#" className="hidden" aria-hidden="true">noop</Link>
      </div>
    </>
  );
}
