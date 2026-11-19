"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import {
  CalendarClock,
  Clock,
  Calendar as CalendarIcon,
  Edit,
  Pencil,
  Eye,
  Trash2,
  Send,
  Loader2,
  Layers,
  Video,
  Instagram,
  Facebook,
  Linkedin,
  Store,
  LayoutGrid,
  List,
  Search,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { EditScheduleModal, DisplayPostLike } from "./EditScheduleModal";
import { cn, isVideoMedia } from "@/lib/utils";

// Ícone do TikTok
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.68 6.34 6.34 0 0 0 9.34 22a6.34 6.34 0 0 0 6.34-6.32V8.2a8.3 8.3 0 0 0 4.79 1.54V6.29a4.85 4.85 0 0 1-.88-.4z" />
    </svg>
  );
}

export interface PlannerPostItem extends DisplayPostLike {
  platforms?: string[];
  pageName?: string;
  instagramUsername?: string;
  formattedDate?: string;
  formattedTime?: string;
  mediaFiles?: Array<{ url: string; type?: string }>;
}

interface ScheduledPostsPlannerProps {
  posts: PlannerPostItem[];
  isLoading: boolean;
  onUpdateSchedule: (postId: string, updates: { scheduledAt: Date; text: string }) => Promise<void>;
  onPublishNow: (post: PlannerPostItem) => Promise<void>;
  onDeletePost: (postId: string) => void;
  onRepublish?: (post: any) => void;
  isRepublishing?: boolean;
}

// Helper para tempo relativo do agendamento
function getRelativeTimeLabel(targetDate: Date): { label: string; badgeClass: string } {
  const now = new Date();
  const diffMs = targetDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const isToday =
    targetDate.getDate() === now.getDate() &&
    targetDate.getMonth() === now.getMonth() &&
    targetDate.getFullYear() === now.getFullYear();

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow =
    targetDate.getDate() === tomorrow.getDate() &&
    targetDate.getMonth() === tomorrow.getMonth() &&
    targetDate.getFullYear() === tomorrow.getFullYear();

  if (diffMs < 0) {
    return {
      label: "Pendente / Em fila",
      badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    };
  }
  if (isToday) {
    return {
      label: "Hoje",
      badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/30 font-bold",
    };
  }
  if (isTomorrow) {
    return {
      label: "Amanhã",
      badgeClass: "bg-[#0083C7]/15 text-[#0083C7] border-[#0083C7]/30 font-semibold",
    };
  }
  if (diffDays <= 7) {
    return {
      label: `Em ${diffDays} dias`,
      badgeClass: "bg-slate-800 text-slate-300 border-slate-700",
    };
  }
  return {
    label: targetDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
    badgeClass: "bg-slate-800 text-slate-400 border-slate-700",
  };
}

export function ScheduledPostsPlanner({
  posts,
  isLoading,
  onUpdateSchedule,
  onPublishNow,
  onDeletePost,
}: ScheduledPostsPlannerProps) {
  const [viewMode, setViewMode] = useState<"timeline" | "grid">("timeline");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");

  // Estado para o modal de edição de data/hora/legenda
  const [editingPost, setEditingPost] = useState<PlannerPostItem | null>(null);

  // Estado para o modal de prévia completa
  const [previewPost, setPreviewPost] = useState<PlannerPostItem | null>(null);

  // Estado para confirmação de publicação imediata (antecipar)
  const [postToPublishNow, setPostToPublishNow] = useState<PlannerPostItem | null>(null);
  const [isPublishingNow, setIsPublishingNow] = useState(false);

  // Filtra os posts agendados
  const filteredPosts = useMemo(() => {
    let result = [...posts];

    // Ordenar cronologicamente por data de agendamento crescente (o mais próximo primeiro)
    result.sort((a, b) => {
      const timeA = a.date instanceof Date ? a.date.getTime() : 0;
      const timeB = b.date instanceof Date ? b.date.getTime() : 0;
      return timeA - timeB;
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          (p.text && p.text.toLowerCase().includes(q)) ||
          (p.pageName && p.pageName.toLowerCase().includes(q)) ||
          (p.instagramUsername && p.instagramUsername.toLowerCase().includes(q))
      );
    }

    if (selectedPlatform !== "all") {
      result = result.filter((p) => p.platforms?.includes(selectedPlatform));
    }

    return result;
  }, [posts, searchQuery, selectedPlatform]);

  const handleConfirmPublishNow = async () => {
    if (!postToPublishNow) return;
    setIsPublishingNow(true);
    try {
      await onPublishNow(postToPublishNow);
      setPostToPublishNow(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPublishingNow(false);
    }
  };

  return (
    <div className="space-y-6 rounded-xl border border-slate-200/80 bg-white p-5 font-['Inter'] shadow-sm transition-all">
      {/* Header do Planner */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-xl border border-[#0083C7]/20 bg-[#0083C7]/10 p-2.5 text-[#0083C7]">
            <CalendarClock className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="font-['Poppins'] text-xl font-bold tracking-tight text-slate-900">
                Planner de Agendamentos
              </h2>
              <span className="rounded-full border border-[#0083C7]/20 bg-[#0083C7]/10 px-2.5 py-0.5 text-xs font-semibold text-[#0083C7]">
                {posts.length} {posts.length === 1 ? "publicação na fila" : "publicações na fila"}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Visualize seu cronograma futuro, altere horários e datas com 1 clique ou refine
              legendas antes do envio.
            </p>
          </div>
        </div>

        {/* Controles de Busca e Visualização */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Seletor de modo de visualização */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setViewMode("timeline")}
              className={cn(
                "flex items-center gap-1.5 rounded-md p-1.5 text-xs font-medium transition-all",
                viewMode === "timeline"
                  ? "shadow-xs bg-white text-slate-900"
                  : "text-slate-500 hover:text-slate-900"
              )}
              title="Modo Linha do Tempo"
            >
              <List className="h-4 w-4" />
              <span className="hidden md:inline">Linha do Tempo</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "flex items-center gap-1.5 rounded-md p-1.5 text-xs font-medium transition-all",
                viewMode === "grid"
                  ? "shadow-xs bg-white text-slate-900"
                  : "text-slate-500 hover:text-slate-900"
              )}
              title="Modo Grade Visual"
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden md:inline">Grade</span>
            </button>
          </div>
        </div>
      </div>

      {/* Barra de Filtros Rápidos (quando houver posts) */}
      {posts.length > 0 && (
        <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Buscar agendamento por legenda..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 rounded-lg border-slate-200 bg-slate-50 pl-9 text-xs focus:border-[#0083C7]"
            />
          </div>

          {/* Chips de Plataforma */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setSelectedPlatform("all")}
              className={cn(
                "whitespace-nowrap rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all",
                selectedPlatform === "all"
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
              )}
            >
              Todas as Redes
            </button>
            <button
              type="button"
              onClick={() => setSelectedPlatform("instagram")}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all",
                selectedPlatform === "instagram"
                  ? "border-transparent bg-gradient-to-r from-amber-500 to-rose-600 text-white"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
              )}
            >
              <Instagram className="h-3.5 w-3.5" />
              Instagram
            </button>
            <button
              type="button"
              onClick={() => setSelectedPlatform("facebook")}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all",
                selectedPlatform === "facebook"
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
              )}
            >
              <Facebook className="h-3.5 w-3.5" />
              Facebook
            </button>
            <button
              type="button"
              onClick={() => setSelectedPlatform("linkedin")}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all",
                selectedPlatform === "linkedin"
                  ? "border-blue-700 bg-blue-700 text-white"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
              )}
            >
              <Linkedin className="h-3.5 w-3.5" />
              LinkedIn
            </button>
          </div>
        </div>
      )}

      {/* Conteúdo Principal do Planner */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <Loader2 className="mb-2.5 h-7 w-7 animate-spin text-[#0083C7]" />
          <p className="text-xs">Carregando cronograma de agendamentos...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-14 text-center">
          <Clock className="mx-auto mb-2.5 h-10 w-10 text-slate-300" />
          <h3 className="font-['Poppins'] text-sm font-bold text-slate-700">
            {posts.length === 0
              ? "Nenhum post agendado no momento"
              : "Nenhuma publicação encontrada para o filtro selecionado"}
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
            {posts.length === 0
              ? "Crie uma publicação manual ou gere um carrossel completo com IA para programar seus conteúdos."
              : "Tente limpar os filtros ou digitar outro termo na busca."}
          </p>
        </div>
      ) : viewMode === "timeline" ? (
        /* Visualização em Linha do Tempo (Lista Rica) */
        <div className="space-y-3.5">
          {filteredPosts.map((post) => {
            const relTime = getRelativeTimeLabel(post.date);
            const mediaUrl =
              post.imageUrl ||
              (post.imageUrls && post.imageUrls[0]) ||
              (post.mediaFiles && post.mediaFiles[0]?.url) ||
              "";
            const isVideo = isVideoMedia(mediaUrl);
            const isCarousel =
              post.isCarousel || (Array.isArray(post.imageUrls) && post.imageUrls.length > 1);
            const totalSlides = post.imageUrls?.length || post.mediaFiles?.length || 1;

            return (
              <div
                key={post.id}
                className="group relative flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-[#0083C7]/40 hover:shadow-md md:flex-row md:items-center"
              >
                {/* Lado Esquerdo: Mídia + Detalhes do Post */}
                <div className="flex min-w-0 flex-1 items-start gap-3.5 sm:items-center">
                  {/* Thumbnail com indicador de tipo */}
                  <div
                    onClick={() => setPreviewPost(post)}
                    className="shadow-xs relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-slate-100 transition-transform group-hover:scale-[1.02] sm:h-20 sm:w-20"
                    title="Clique para ampliar"
                  >
                    {mediaUrl ? (
                      isVideo ? (
                        <video
                          src={mediaUrl}
                          className="h-full w-full object-cover"
                          muted
                          playsInline
                        />
                      ) : (
                        <Image
                          src={mediaUrl}
                          alt={post.text || "Arte do post"}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      )
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400">
                        <Clock className="h-6 w-6" />
                      </div>
                    )}

                    {/* Badge do formato sobreposto */}
                    <div className="absolute left-1 top-1">
                      {isCarousel && (
                        <span className="backdrop-blur-xs inline-flex items-center gap-0.5 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          <Layers className="h-2.5 w-2.5 text-[#0083C7]" />
                          {totalSlides}
                        </span>
                      )}
                      {isVideo && (
                        <span className="backdrop-blur-xs inline-flex items-center gap-0.5 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          <Video className="h-2.5 w-2.5 text-[#FA6305]" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Informações de Texto e Agendamento */}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    {/* Linha 1: Data, Horário e Tempo Relativo */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 font-['Poppins'] text-xs font-bold text-slate-900">
                        <CalendarIcon className="h-3.5 w-3.5 text-[#0083C7]" />
                        {post.date.toLocaleDateString("pt-BR", {
                          weekday: "short",
                          day: "2-digit",
                          month: "short",
                        })}{" "}
                        às{" "}
                        {post.date.toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>

                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[11px] capitalize",
                          relTime.badgeClass
                        )}
                      >
                        {relTime.label}
                      </span>
                    </div>

                    {/* Linha 2: Trecho da Legenda */}
                    <p className="line-clamp-2 text-xs leading-relaxed text-slate-600">
                      {post.text || "Sem legenda cadastrada para esta publicação."}
                    </p>

                    {/* Linha 3: Chips de Plataformas */}
                    <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px] text-slate-500">
                      {post.platforms?.includes("instagram") && (
                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                          <Instagram className="h-3 w-3 text-pink-600" />
                          {post.instagramUsername ? `@${post.instagramUsername}` : "Instagram"}
                        </span>
                      )}
                      {post.platforms?.includes("facebook") && (
                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                          <Facebook className="h-3 w-3 text-blue-600" />
                          {post.pageName || "Facebook"}
                        </span>
                      )}
                      {post.platforms?.includes("linkedin") && (
                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                          <Linkedin className="h-3 w-3 text-blue-700" />
                          LinkedIn
                        </span>
                      )}
                      {post.platforms?.includes("tiktok") && (
                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                          <TikTokIcon className="h-3 w-3 text-black" />
                          TikTok
                        </span>
                      )}
                      {post.platforms?.includes("google") && (
                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                          <Store className="h-3 w-3 text-emerald-600" />
                          Google
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lado Direito: Ações Diretas no Card */}
                <div className="flex w-full shrink-0 items-center justify-end gap-1.5 self-end border-t border-slate-100 pt-2 md:w-auto md:self-center md:border-t-0 md:pt-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingPost(post)}
                    className="h-8 gap-1.5 rounded-lg border-slate-200 px-2.5 text-xs text-slate-700 transition-all hover:border-[#0083C7] hover:bg-[#0083C7] hover:text-white"
                    title="Editar data, horário ou legenda"
                  >
                    <Edit className="h-3.5 w-3.5 text-[#0083C7] group-hover:text-white" />
                    <span>Editar</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewPost(post)}
                    className="h-8 gap-1.5 rounded-lg border-slate-200 px-2.5 text-xs text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    title="Ver prévia ampliada"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Prévia</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPostToPublishNow(post)}
                    className="h-8 gap-1.5 rounded-lg border-emerald-200 px-2.5 text-xs text-emerald-700 transition-all hover:border-emerald-600 hover:bg-emerald-600 hover:text-white"
                    title="Publicar agora mesmo sem esperar o horário"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span className="hidden lg:inline">Publicar Agora</span>
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeletePost(post.id)}
                    className="h-8 rounded-lg px-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    title="Cancelar e excluir agendamento"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Visualização em Grade (Cards Visuais) */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post) => {
            const relTime = getRelativeTimeLabel(post.date);
            const mediaUrl =
              post.imageUrl ||
              (post.imageUrls && post.imageUrls[0]) ||
              (post.mediaFiles && post.mediaFiles[0]?.url) ||
              "";
            const isVideo = isVideoMedia(mediaUrl);
            const isCarousel =
              post.isCarousel || (Array.isArray(post.imageUrls) && post.imageUrls.length > 1);
            const totalSlides = post.imageUrls?.length || post.mediaFiles?.length || 1;

            return (
              <div
                key={post.id}
                className="flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white transition-all hover:border-[#0083C7]/40 hover:shadow-md"
              >
                {/* Imagem Superior */}
                <div
                  onClick={() => setPreviewPost(post)}
                  className="group relative aspect-video w-full cursor-pointer overflow-hidden bg-slate-900"
                >
                  {mediaUrl ? (
                    isVideo ? (
                      <video
                        src={mediaUrl}
                        className="h-full w-full object-cover"
                        muted
                        playsInline
                      />
                    ) : (
                      <Image
                        src={mediaUrl}
                        alt="Arte do post"
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    )
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-500">
                      <Clock className="h-8 w-8" />
                    </div>
                  )}

                  {/* Badges superiores */}
                  <div className="absolute left-2 top-2 flex items-center gap-1">
                    {isCarousel && (
                      <span className="backdrop-blur-xs inline-flex items-center gap-1 rounded bg-black/75 px-2 py-0.5 text-[10px] font-bold text-white">
                        <Layers className="h-3 w-3 text-[#0083C7]" />
                        {totalSlides} slides
                      </span>
                    )}
                    {isVideo && (
                      <span className="backdrop-blur-xs inline-flex items-center gap-1 rounded bg-black/75 px-2 py-0.5 text-[10px] font-bold text-white">
                        <Video className="h-3 w-3 text-[#FA6305]" />
                        Vídeo
                      </span>
                    )}
                  </div>

                  <div className="absolute right-2 top-2">
                    <span
                      className={cn(
                        "shadow-xs backdrop-blur-xs rounded-full px-2 py-0.5 text-[10px] font-bold capitalize",
                        relTime.badgeClass
                      )}
                    >
                      {relTime.label}
                    </span>
                  </div>
                </div>

                {/* Informações e Legenda */}
                <div className="flex flex-1 flex-col justify-between space-y-2.5 p-3.5">
                  <div>
                    <div className="flex items-center gap-1.5 font-['Poppins'] text-xs font-bold text-slate-900">
                      <CalendarIcon className="h-3.5 w-3.5 text-[#0083C7]" />
                      <span>
                        {post.date.toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                        })}{" "}
                        às{" "}
                        {post.date.toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-slate-600">
                      {post.text || "Sem legenda."}
                    </p>
                  </div>

                  {/* Plataformas e Ações */}
                  <div className="space-y-2.5 border-t border-slate-100 pt-2">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                      {post.platforms?.map((pl) => (
                        <span
                          key={pl}
                          className="rounded bg-slate-100 px-1.5 py-0.5 font-medium capitalize"
                        >
                          {pl}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingPost(post)}
                        className="h-8 flex-1 gap-1 border-slate-200 px-2.5 text-xs text-slate-700 hover:border-[#0083C7] hover:bg-[#0083C7] hover:text-white"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        <span>Editar</span>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPostToPublishNow(post)}
                        className="h-8 border-emerald-200 px-2.5 text-xs text-emerald-700 hover:bg-emerald-600 hover:text-white"
                        title="Publicar agora"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeletePost(post.id)}
                        className="h-8 px-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Edição de Agendamento */}
      <EditScheduleModal
        isOpen={Boolean(editingPost)}
        onClose={() => setEditingPost(null)}
        post={editingPost}
        onSave={onUpdateSchedule}
      />

      {/* Modal de Prévia Ampliada */}
      {previewPost && (
        <Dialog open={Boolean(previewPost)} onOpenChange={() => setPreviewPost(null)}>
          <DialogContent className="max-w-lg rounded-lg border-slate-800 bg-slate-900 p-6 font-['Inter'] text-slate-100">
            <DialogHeader>
              <DialogTitle className="font-['Poppins'] text-lg font-bold text-white">
                Prévia da Publicação Agendada
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Programada para{" "}
                {previewPost.date.toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                })}{" "}
                às{" "}
                {previewPost.date.toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
                {previewPost.imageUrl && isVideoMedia(previewPost.imageUrl) ? (
                  <video
                    src={previewPost.imageUrl}
                    controls
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <Image
                    src={previewPost.imageUrl || "/placeholder-image.jpg"}
                    alt="Prévia"
                    fill
                    className="object-contain"
                  />
                )}
              </div>

              <div className="space-y-1 rounded-lg border border-slate-800 bg-slate-950 p-3.5">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Legenda Formatada
                </span>
                <p className="max-h-40 overflow-y-auto whitespace-pre-wrap pr-1 text-xs leading-relaxed text-slate-200">
                  {previewPost.text}
                </p>
              </div>
            </div>

            <DialogFooter className="flex items-center justify-between gap-2 border-t border-slate-800 pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const post = previewPost;
                  setPreviewPost(null);
                  setEditingPost(post);
                }}
                className="h-9 gap-1.5 rounded-lg border-slate-700 bg-slate-800 text-xs text-slate-200 hover:bg-[#0083C7] hover:text-white"
              >
                <Edit className="h-3.5 w-3.5" />
                <span>Editar Data / Horário</span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPreviewPost(null)}
                className="h-9 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Diálogo de Confirmação para Publicar Agora (Antecipar) */}
      {postToPublishNow && (
        <Dialog open={Boolean(postToPublishNow)} onOpenChange={() => setPostToPublishNow(null)}>
          <DialogContent className="max-w-md rounded-lg border-slate-800 bg-slate-900 p-6 font-['Inter'] text-slate-100">
            <DialogHeader>
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-400">
                  <Send className="h-4 w-4" />
                </span>
                <DialogTitle className="font-['Poppins'] text-lg font-bold text-white">
                  Publicar Imediatamente?
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-slate-400">
                Esta publicação estava programada para{" "}
                <strong className="text-slate-200">
                  {postToPublishNow.date.toLocaleDateString("pt-BR")} às{" "}
                  {postToPublishNow.date.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </strong>
                . Deseja antecipar e disparar o envio para as redes sociais agora mesmo?
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPostToPublishNow(null)}
                disabled={isPublishingNow}
                className="h-9 text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </Button>

              <Button
                type="button"
                onClick={handleConfirmPublishNow}
                disabled={isPublishingNow}
                className="flex h-9 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-xs font-medium text-white hover:bg-emerald-700"
              >
                {isPublishingNow ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Publicando...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Confirmar e Publicar Agora</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
