"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { format, startOfDay, startOfMonth, startOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle,
  Clock,
  Edit,
  Facebook,
  History,
  Instagram,
  Linkedin,
  Loader2,
  MoreVertical,
  Plus,
  RefreshCw,
  Store,
  Trash2,
} from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import {
  deletePost,
  getScheduledPosts,
  publishScheduledPostNow,
  schedulePost,
  updateScheduledPost,
  type PostDataInput,
} from "@/lib/services/posts-service";
import { getMetaConnection, type MetaConnectionData } from "@/lib/services/meta-service";
import {
  getInstagramConnection,
  type InstagramConnectionData,
} from "@/lib/services/instagram-service";
import { getGoogleConnection, type GoogleConnectionData } from "@/lib/services/google-service";
import {
  getLinkedInConnection,
  type LinkedInConnectionData,
} from "@/lib/services/linkedin-service";
import { getTikTokConnection, type TikTokConnectionData } from "@/lib/services/tiktok-service";
import { TikTokIcon } from "@/components/icons/tiktok-icon";

import {
  ScheduledPostsPlanner,
  type PlannerPostItem,
} from "@/components/dashboard/posts/ScheduledPostsPlanner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PostStatus = "scheduled" | "publishing" | "published" | "failed";
type HistoryFilter = "last-7-days" | "this-month" | "this-year" | "all-time";
type RepublishScheduleType = "now" | "schedule";
type Platform = "instagram" | "facebook" | "linkedin" | "google" | "tiktok";

interface DisplayPost {
  id: string;
  text: string;
  imageUrl?: string;
  imageUrls?: string[];
  isCarousel?: boolean;
  status: PostStatus;
  date: Date;
  formattedDate: string;
  formattedTime: string;
  platforms: string[];
  pageName?: string;
  instagramUsername?: string;
}

const PLACEHOLDER_IMAGE = "https://placehold.co/400";

const STATUS_CONFIG: Record<
  PostStatus,
  { icon: React.ComponentType<{ className?: string }>; badgeClassName: string; label: string }
> = {
  published: {
    icon: CheckCircle,
    badgeClassName: "bg-green-100 text-green-700 border-green-200",
    label: "Publicado",
  },
  scheduled: {
    icon: Clock,
    badgeClassName: "bg-blue-100 text-blue-700 border-blue-200",
    label: "Agendado",
  },
  failed: {
    icon: AlertTriangle,
    badgeClassName: "bg-red-100 text-red-700 border-red-200",
    label: "Falhou",
  },
  publishing: {
    icon: Loader2,
    badgeClassName: "bg-yellow-100 text-yellow-700 border-yellow-200 animate-spin",
    label: "Publicando",
  },
};

function getHistoryStartDate(filter: HistoryFilter): Date | null {
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
  const scheduledAt = post.scheduledAt?.toDate?.() || post.scheduledAt;
  const scheduledDate = scheduledAt ? new Date(scheduledAt) : new Date();
  const isValidDate = !isNaN(scheduledDate.getTime());

  return {
    id: post.id,
    text: post.text || "",
    imageUrl: post.imageUrl || (post.imageUrls && post.imageUrls[0]),
    imageUrls: post.imageUrls || [],
    isCarousel: post.isCarousel || false,
    status: (post.status as PostStatus) || "scheduled",
    date: isValidDate ? scheduledDate : new Date(),
    formattedDate: isValidDate
      ? format(scheduledDate, "dd 'de' LLLL", { locale: ptBR })
      : "Data pendente",
    formattedTime: isValidDate ? format(scheduledDate, "HH:mm") : "--:--",
    platforms: post.platforms ?? [],
    pageName: post.pageName,
    instagramUsername: post.instagramUsername,
  };
}

function HistoryPostItem({
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
  const imageSrc = post.imageUrl || PLACEHOLDER_IMAGE;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className="flex items-center justify-between rounded-lg border bg-white p-4 transition-shadow hover:shadow-sm"
    >
      <div className="flex items-center gap-4 overflow-hidden">
        {imageSrc.match(/\.(mp4|mov|webm)(\?|$)/i) ? (
          <video
            src={imageSrc}
            className="h-14 w-14 shrink-0 rounded-md bg-gray-100 object-cover"
            muted
            playsInline
            preload="metadata"
          />
        ) : (
          <Image
            src={imageSrc}
            alt={post.text.substring(0, 50) || "Imagem do post"}
            width={56}
            height={56}
            className="h-14 w-14 shrink-0 rounded-md bg-gray-100 object-cover"
          />
        )}
        <div className="overflow-hidden">
          <h4 className="truncate text-base font-medium text-gray-900">
            {post.text.length > 70
              ? post.text.substring(0, 70) + "..."
              : post.text || "Sem legenda"}
          </h4>

          <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
            {StatusIcon ? <StatusIcon className="h-4 w-4" /> : null}
            <span>
              {post.formattedDate} às {post.formattedTime}
            </span>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-4 text-xs text-gray-500">
            {post.platforms?.includes("facebook") && (
              <div className="flex items-center gap-1.5">
                <Facebook className="h-3.5 w-3.5 text-blue-600" />
                {post.pageName ? (
                  <span className="font-medium">{post.pageName}</span>
                ) : (
                  <span>Facebook</span>
                )}
              </div>
            )}
            {post.platforms?.includes("instagram") && (
              <div className="flex items-center gap-1.5">
                <Instagram className="h-3.5 w-3.5" />
                {post.instagramUsername ? (
                  <span className="font-medium">@{post.instagramUsername}</span>
                ) : (
                  <span className="font-medium">Instagram</span>
                )}
              </div>
            )}
            {post.platforms?.includes("tiktok") && (
              <div className="flex items-center gap-1.5">
                <TikTokIcon className="h-3.5 w-3.5 text-black" />
                <span className="font-medium">TikTok</span>
              </div>
            )}
            {post.platforms?.includes("linkedin") && (
              <div className="flex items-center gap-1.5">
                <Linkedin className="h-3.5 w-3.5 text-blue-700" />
                <span className="font-medium">LinkedIn</span>
              </div>
            )}
            {post.platforms?.includes("google") && (
              <div className="flex items-center gap-1.5">
                <Store className="h-3.5 w-3.5 text-green-600" />
                <span className="font-medium">Google</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <Badge variant="outline" className={cfg?.badgeClassName}>
          {cfg?.label || post.status}
        </Badge>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>

            <DropdownMenuItem
              className="text-[#0083C7] focus:text-[#0083C7]"
              onClick={() => onRepublish(post)}
              disabled={isRepublishing || post.status === "publishing"}
            >
              <span className="flex items-center gap-2">
                {isRepublishing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span>Republicar</span>
              </span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="text-red-600 focus:text-red-700"
              onClick={() => onDelete(post.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}

export default function PlannerPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [allPosts, setAllPosts] = useState<DisplayPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("this-month");

  // Conexões para suportar republicação do histórico
  const [metaConnection, setMetaConnection] = useState<MetaConnectionData>({ isConnected: false });
  const [instagramConnection, setInstagramConnection] = useState<InstagramConnectionData>({
    isConnected: false,
  });
  const [googleConnection, setGoogleConnection] = useState<GoogleConnectionData>({
    isConnected: false,
  });
  const [linkedinConnection, setLinkedinConnection] = useState<LinkedInConnectionData>({
    isConnected: false,
  });
  const [tiktokConnection, setTiktokConnection] = useState<TikTokConnectionData>({
    isConnected: false,
  });

  // Delete state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Republish state
  const [isRepublishModalOpen, setIsRepublishModalOpen] = useState(false);
  const [postToRepublish, setPostToRepublish] = useState<DisplayPost | null>(null);
  const [republishScheduleType, setRepublishScheduleType] = useState<RepublishScheduleType>("now");
  const [republishScheduleDate, setRepublishScheduleDate] = useState("");
  const [isRepublishing, setIsRepublishing] = useState(false);
  const [republishPlatforms, setRepublishPlatforms] = useState<Platform[]>([]);

  const isLoadingInitial = loading && allPosts.length === 0;

  const fetchPageData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [
        postsResults,
        metaResult,
        instagramResult,
        googleResult,
        linkedinResult,
        tiktokResult,
      ] = await Promise.all([
        getScheduledPosts(user.uid),
        getMetaConnection(user.uid),
        getInstagramConnection(user.uid),
        getGoogleConnection(user.uid),
        getLinkedInConnection(user.uid),
        getTikTokConnection(user.uid),
      ]);

      if (Array.isArray(postsResults) && !postsResults[0]?.error) {
        setAllPosts(
          postsResults
            .filter((r) => r.success && r.post)
            .map((r) => toDisplayPost(r.post!))
            .sort((a, b) => b.date.getTime() - a.date.getTime())
        );
      } else if (postsResults?.[0]?.error) {
        toast({
          variant: "destructive",
          title: "Erro ao Carregar Posts",
          description: postsResults[0].error,
        });
      } else {
        setAllPosts([]);
      }

      setMetaConnection(metaResult);
      setInstagramConnection(instagramResult);
      setGoogleConnection(googleResult);
      setLinkedinConnection(linkedinResult);
      setTiktokConnection(tiktokResult);
    } catch (err) {
      console.error("Failed to fetch planner data:", err);
      toast({
        variant: "destructive",
        title: "Erro ao Carregar Dados",
        description: "Não foi possível carregar os agendamentos e o histórico.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, user]);

  useEffect(() => {
    if (user) {
      fetchPageData();
    }
  }, [user, fetchPageData]);

  const { scheduledPosts, pastPosts } = useMemo(() => {
    const scheduled = allPosts.filter((p) => p.status === "scheduled");
    const historyBase = allPosts.filter(
      (p) => p.status === "published" || p.status === "failed" || p.status === "publishing"
    );
    const startDate = getHistoryStartDate(historyFilter);
    const filteredHistory = startDate
      ? historyBase.filter((p) => p.date >= startDate)
      : historyBase;

    return {
      scheduledPosts: scheduled,
      pastPosts: filteredHistory,
    };
  }, [allPosts, historyFilter]);

  const handleUpdateSchedule = useCallback(
    async (postId: string, updates: { scheduledAt: Date; text: string }) => {
      if (!user) return;
      try {
        await updateScheduledPost(user.uid, postId, updates);
        toast({
          title: "Agendamento atualizado!",
          description: "Data/horário e conteúdo salvos com sucesso.",
        });
        await fetchPageData();
      } catch (err: any) {
        toast({
          variant: "destructive",
          title: "Erro ao atualizar",
          description: err?.message || "Não foi possível atualizar o agendamento.",
        });
        throw err;
      }
    },
    [fetchPageData, toast, user]
  );

  const handlePublishNow = useCallback(
    async (post: PlannerPostItem) => {
      if (!user) return;
      try {
        await publishScheduledPostNow(user.uid, post.id);
        toast({
          title: "Publicação iniciada!",
          description: "O post foi enviado para publicação imediata.",
        });
        await fetchPageData();
      } catch (err: any) {
        toast({
          variant: "destructive",
          title: "Erro ao antecipar",
          description: err?.message || "Não foi possível antecipar a publicação.",
        });
        throw err;
      }
    },
    [fetchPageData, toast, user]
  );

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
      toast({
        variant: "destructive",
        title: "Erro ao Excluir",
        description: err?.message ?? "Erro ao excluir a publicação.",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setPostToDelete(null);
    }
  }, [fetchPageData, postToDelete, toast, user]);

  const handleRepublish = useCallback(
    (post: DisplayPost) => {
      if (!user) return;
      setPostToRepublish(post);
      setRepublishPlatforms(post.platforms as Platform[]);
      setRepublishScheduleType("now");
      setRepublishScheduleDate("");
      setIsRepublishModalOpen(true);
    },
    [user]
  );

  const handleConfirmRepublish = useCallback(async () => {
    if (
      !user ||
      !postToRepublish ||
      !(
        postToRepublish.imageUrl ||
        (postToRepublish.imageUrls && postToRepublish.imageUrls.length > 0)
      )
    )
      return;

    if (republishPlatforms.length === 0) {
      toast({
        variant: "destructive",
        title: "Nenhuma plataforma",
        description: "Selecione ao menos uma plataforma para republicar.",
      });
      return;
    }

    if (republishPlatforms.includes("instagram") && !instagramConnection.isConnected) {
      toast({
        variant: "destructive",
        title: "Instagram não conectado",
        description: "Conecte o Instagram na página de Posts para republicar.",
      });
      return;
    }
    if (republishPlatforms.includes("facebook") && !metaConnection.isConnected) {
      toast({
        variant: "destructive",
        title: "Facebook não conectado",
        description: "Conecte o Facebook na página de Posts para republicar.",
      });
      return;
    }
    if (republishPlatforms.includes("tiktok") && !tiktokConnection.isConnected) {
      toast({
        variant: "destructive",
        title: "TikTok não conectado",
        description: "Conecte o TikTok na página de Posts para republicar.",
      });
      return;
    }
    if (republishPlatforms.includes("google") && !googleConnection.isConnected) {
      toast({
        variant: "destructive",
        title: "Google Meu Negócio não conectado",
        description: "Conecte o Google Meu Negócio para republicar.",
      });
      return;
    }
    if (republishPlatforms.includes("linkedin")) {
      if (!linkedinConnection.isConnected) {
        toast({
          variant: "destructive",
          title: "LinkedIn não conectado",
          description: "Conecte o LinkedIn na página de Posts para republicar.",
        });
        return;
      }
      const hasValidTarget =
        linkedinConnection.personUrn?.startsWith("urn:li:person:") ||
        !!linkedinConnection.selectedOrganizationUrn;
      if (!hasValidTarget) {
        toast({
          variant: "destructive",
          title: "LinkedIn sem Destino",
          description:
            "Selecione uma Página Corporativa na aba 'Conexões' da página de Posts para publicar no LinkedIn.",
        });
        return;
      }
    }
    if (republishPlatforms.includes("google") && !postToRepublish.text.trim()) {
      toast({
        variant: "destructive",
        title: "Texto Obrigatório",
        description: "O texto da publicação é obrigatório para publicar no Google Meu Negócio.",
      });
      return;
    }

    if (republishScheduleType === "schedule" && !republishScheduleDate) {
      toast({
        variant: "destructive",
        title: "Data inválida",
        description: "Por favor, selecione data e hora para o agendamento.",
      });
      return;
    }

    setIsRepublishing(true);
    toast({
      title: "Republicando...",
      description: "Enviando seu post para ser publicado novamente.",
    });

    const mediaUrls =
      postToRepublish.imageUrls && postToRepublish.imageUrls.length > 0
        ? postToRepublish.imageUrls
        : [postToRepublish.imageUrl!];

    const input: PostDataInput = {
      text: postToRepublish.text,
      media: mediaUrls.map((url) => ({ file: new File([], ""), publicUrl: url })),
      isCarousel: postToRepublish.isCarousel || false,
      platforms: republishPlatforms as any,
      scheduledAt:
        republishScheduleType === "schedule" ? new Date(republishScheduleDate) : new Date(),
    };

    if (republishPlatforms.includes("instagram")) input.instagramConnection = instagramConnection;
    if (republishPlatforms.includes("facebook")) input.metaConnection = metaConnection;
    if (republishPlatforms.includes("google")) input.googleConnection = googleConnection;
    if (republishPlatforms.includes("linkedin")) input.linkedinConnection = linkedinConnection;

    const result = await schedulePost(user.uid, input);

    setIsRepublishing(false);
    setIsRepublishModalOpen(false);
    setPostToRepublish(null);
    await fetchPageData();

    if (result.success) {
      toast({
        variant: "success",
        title: "Publicação realizada com sucesso!",
        description:
          republishScheduleType === "schedule"
            ? "Seu post foi agendado novamente."
            : "Seu post foi enviado para publicação.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Erro ao Republicar",
        description: result.error || "Não foi possível republicar o post.",
      });
    }
  }, [
    fetchPageData,
    googleConnection,
    instagramConnection,
    linkedinConnection,
    metaConnection,
    postToRepublish,
    republishPlatforms,
    republishScheduleDate,
    republishScheduleType,
    tiktokConnection.isConnected,
    toast,
    user,
  ]);

  const toggleRepublishPlatform = (platform: Platform) => {
    setRepublishPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 md:p-8">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2.5 font-['Poppins'] text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0083C7] text-white">
              <CalendarClock className="h-5 w-5" />
            </span>
            Planner de Agendamentos
          </h1>
          <p className="mt-1 font-['Inter'] text-sm text-slate-500">
            Gerencie seus agendamentos futuros, edite horários e acompanhe o histórico de
            publicações.
          </p>
        </div>

        <Button
          asChild
          className="rounded-lg bg-[#FA6305] font-semibold text-white hover:bg-[#e05804]"
        >
          <Link href="/dashboard/posts" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Criar Novo Post
          </Link>
        </Button>
      </div>

      {/* Planner de Agendamentos */}
      <ScheduledPostsPlanner
        posts={scheduledPosts}
        isLoading={isLoadingInitial}
        onUpdateSchedule={handleUpdateSchedule}
        onPublishNow={handlePublishNow}
        onDeletePost={handleDeleteRequest}
        onRepublish={handleRepublish}
        isRepublishing={isRepublishing}
      />

      {/* Histórico de Posts */}
      <Card className="rounded-lg border border-slate-200/80 shadow-sm">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 font-['Poppins'] text-xl text-slate-900">
            <History className="h-5 w-5 text-[#0083C7]" />
            Histórico de Posts
          </CardTitle>
          <Select value={historyFilter} onValueChange={(v) => setHistoryFilter(v as HistoryFilter)}>
            <SelectTrigger className="w-full rounded-lg sm:w-[190px]">
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
          <div className="max-h-[32rem] space-y-4 overflow-y-auto pr-2">
            <AnimatePresence>
              {isLoadingInitial ? (
                <div className="flex h-40 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : pastPosts.length > 0 ? (
                pastPosts.map((post) => (
                  <HistoryPostItem
                    key={post.id}
                    post={post}
                    onRepublish={handleRepublish}
                    isRepublishing={isRepublishing}
                    onDelete={handleDeleteRequest}
                  />
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center text-slate-500">
                  <History className="mx-auto mb-2.5 h-10 w-10 text-slate-300" />
                  <p className="font-medium text-slate-700">
                    Nenhuma publicação encontrada no histórico.
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Altere o filtro de período ou publique novos conteúdos para visualizá-los aqui.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A publicação será excluída permanentemente da fila ou
              do histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Republicação */}
      <Dialog open={isRepublishModalOpen} onOpenChange={setIsRepublishModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-['Poppins']">Republicar Post</DialogTitle>
            <DialogDescription>
              Escolha as redes sociais e defina se deseja publicar agora ou agendar uma nova data.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Plataformas de Destino</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["instagram", "facebook", "linkedin", "tiktok", "google"] as Platform[]).map(
                  (platform) => (
                    <label
                      key={platform}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-sm hover:bg-slate-50"
                    >
                      <Checkbox
                        checked={republishPlatforms.includes(platform)}
                        onCheckedChange={() => toggleRepublishPlatform(platform)}
                      />
                      <span className="capitalize">{platform}</span>
                    </label>
                  )
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Quando publicar?</Label>
              <RadioGroup
                value={republishScheduleType}
                onValueChange={(v) => setRepublishScheduleType(v as RepublishScheduleType)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="now" id="repub-now" />
                  <Label htmlFor="repub-now" className="cursor-pointer font-normal">
                    Publicar Agora
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="schedule" id="repub-schedule" />
                  <Label htmlFor="repub-schedule" className="cursor-pointer font-normal">
                    Agendar Data
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {republishScheduleType === "schedule" && (
              <div className="space-y-1.5">
                <Label htmlFor="repub-date" className="text-sm font-medium">
                  Data e Horário
                </Label>
                <Input
                  id="repub-date"
                  type="datetime-local"
                  value={republishScheduleDate}
                  onChange={(e) => setRepublishScheduleDate(e.target.value)}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRepublishModalOpen(false)}
              disabled={isRepublishing}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmRepublish}
              disabled={isRepublishing}
              className="bg-[#0083C7] text-white hover:bg-[#006da6]"
            >
              {isRepublishing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Confirmar Republicação"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
