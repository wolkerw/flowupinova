"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Layers,
  Video,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isVideoMedia } from "@/lib/utils";

export interface DisplayPostLike {
  id: string;
  text: string;
  date: Date;
  imageUrl?: string;
  imageUrls?: string[];
  mediaFiles?: Array<{ url: string; type?: string }>;
  isCarousel?: boolean;
  status: string;
}

interface EditScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: DisplayPostLike | null;
  onSave: (postId: string, updates: { scheduledAt: Date; text: string }) => Promise<void>;
}

const PEAK_HOURS = [
  { label: "09:00", desc: "Manhã" },
  { label: "12:00", desc: "Almoço" },
  { label: "18:30", desc: "Pico Tarde" },
  { label: "20:00", desc: "Noite" },
];

function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTimeForInput(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function EditScheduleModal({ isOpen, onClose, post, onSave }: EditScheduleModalProps) {
  const { toast } = useToast();

  const [dateStr, setDateStr] = useState<string>("");
  const [timeStr, setTimeStr] = useState<string>("");
  const [text, setText] = useState<string>("");
  const [carouselIndex, setCarouselIndex] = useState<number>(0);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Inicializa valores ao abrir
  useEffect(() => {
    if (post && isOpen) {
      const initialDate =
        post.date instanceof Date && !isNaN(post.date.getTime()) ? post.date : new Date();

      setDateStr(formatDateForInput(initialDate));
      setTimeStr(formatTimeForInput(initialDate));
      setText(post.text || "");
      setCarouselIndex(0);
    }
  }, [post, isOpen]);

  // Lista de imagens/mídias para exibição
  const mediaList = useMemo(() => {
    if (!post) return [];
    if (Array.isArray(post.imageUrls) && post.imageUrls.length > 0) {
      return post.imageUrls;
    }
    if (Array.isArray(post.mediaFiles) && post.mediaFiles.length > 0) {
      return post.mediaFiles.map((m) => m.url).filter(Boolean);
    }
    if (post.imageUrl) return [post.imageUrl];
    return [];
  }, [post]);

  const currentMediaUrl = mediaList[carouselIndex] || "";
  const isVideo = isVideoMedia(currentMediaUrl);

  const todayStr = useMemo(() => formatDateForInput(new Date()), []);

  const handleSave = async () => {
    if (!post) return;

    if (!dateStr || !timeStr) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione a data e o horário para o agendamento.",
        variant: "destructive",
      });
      return;
    }

    const [year, month, day] = dateStr.split("-").map(Number);
    const [hours, minutes] = timeStr.split(":").map(Number);

    const targetDate = new Date(year, month - 1, day, hours, minutes, 0, 0);

    if (isNaN(targetDate.getTime())) {
      toast({
        title: "Data inválida",
        description: "A data ou horário selecionados são inválidos.",
        variant: "destructive",
      });
      return;
    }

    // Permitir uma margem de segurança de 2 minutos para evitar erro se selecionar o minuto atual
    const nowWithBuffer = new Date(Date.now() - 2 * 60 * 1000);
    if (targetDate < nowWithBuffer) {
      toast({
        title: "Horário no passado",
        description: "Escolha uma data e horário futuros para a publicação.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await onSave(post.id, {
        scheduledAt: targetDate,
        text: text.trim(),
      });
      toast({
        title: "Agendamento Atualizado! 🗓️",
        description: "O novo cronograma e legenda foram salvos com sucesso.",
      });
      onClose();
    } catch (err: any) {
      console.error("Erro ao salvar agendamento:", err);
      toast({
        title: "Falha ao salvar",
        description: err.message || "Não foi possível atualizar o agendamento.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto rounded-lg border-slate-800 bg-slate-900 p-6 font-['Inter'] text-slate-100">
        <DialogHeader>
          <div className="mb-1 flex items-center gap-2">
            <span className="rounded-lg border border-[#0083C7]/20 bg-[#0083C7]/10 p-2 text-[#0083C7]">
              <CalendarIcon className="h-4 w-4" />
            </span>
            <DialogTitle className="font-['Poppins'] text-xl font-bold text-white">
              Editar Agendamento
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-400">
            Ajuste a data, horário de publicação ou refine a legenda do seu post.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-3">
          {/* Prévia da Mídia */}
          {mediaList.length > 0 && (
            <div className="relative flex items-center justify-center overflow-hidden rounded-lg border border-slate-800 bg-slate-950 p-2.5">
              <div className="relative flex aspect-square w-full max-w-[280px] items-center justify-center overflow-hidden rounded-md bg-slate-900">
                {isVideo ? (
                  <video
                    src={currentMediaUrl}
                    className="h-full w-full object-cover"
                    controls
                    playsInline
                  />
                ) : (
                  <Image
                    src={currentMediaUrl}
                    alt="Prévia do post"
                    fill
                    className="object-cover"
                    sizes="280px"
                  />
                )}

                {/* Badges de Formato */}
                <div className="absolute left-2 top-2 flex items-center gap-1.5">
                  {mediaList.length > 1 && (
                    <span className="inline-flex items-center gap-1 rounded bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
                      <Layers className="h-3 w-3 text-[#0083C7]" />
                      {carouselIndex + 1}/{mediaList.length}
                    </span>
                  )}
                  {isVideo && (
                    <span className="inline-flex items-center gap-1 rounded bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
                      <Video className="h-3 w-3 text-[#FA6305]" />
                      Vídeo
                    </span>
                  )}
                </div>

                {/* Controles de Carrossel */}
                {mediaList.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setCarouselIndex((prev) => (prev > 0 ? prev - 1 : mediaList.length - 1))
                      }
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-1.5 text-white transition-colors hover:bg-black/80"
                      title="Slide anterior"
                      aria-label="Slide anterior"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCarouselIndex((prev) => (prev < mediaList.length - 1 ? prev + 1 : 0))
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-1.5 text-white transition-colors hover:bg-black/80"
                      title="Próximo slide"
                      aria-label="Próximo slide"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Seletores de Data e Horário */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="schedule-date"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-200"
              >
                <CalendarIcon className="h-3.5 w-3.5 text-[#0083C7]" />
                Data da Publicação
              </Label>
              <Input
                id="schedule-date"
                type="date"
                min={todayStr}
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="h-10 rounded-lg border-slate-800 bg-slate-950 text-xs text-slate-100 focus:border-[#0083C7]"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="schedule-time"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-200"
              >
                <Clock className="h-3.5 w-3.5 text-[#0083C7]" />
                Horário da Publicação
              </Label>
              <Input
                id="schedule-time"
                type="time"
                value={timeStr}
                onChange={(e) => setTimeStr(e.target.value)}
                className="h-10 rounded-lg border-slate-800 bg-slate-950 text-xs text-slate-100 focus:border-[#0083C7]"
              />
            </div>
          </div>

          {/* Atalhos de Horários de Pico */}
          <div className="space-y-1.5">
            <span className="block text-[11px] font-medium text-slate-400">
              Sugestões de Horários com Maior Engajamento:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {PEAK_HOURS.map((ph) => (
                <button
                  key={ph.label}
                  type="button"
                  onClick={() => setTimeStr(ph.label)}
                  className={`rounded border px-2.5 py-1 text-xs font-semibold transition-all ${
                    timeStr === ph.label
                      ? "border-[#0083C7] bg-[#0083C7] text-white"
                      : "border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700 hover:text-white"
                  }`}
                >
                  {ph.label} <span className="text-[10px] opacity-75">({ph.desc})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Edição da Legenda */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="post-caption" className="text-xs font-semibold text-slate-200">
                Legenda do Post
              </Label>
              <span className="text-[11px] text-slate-500">{text.length} caracteres</span>
            </div>
            <Textarea
              id="post-caption"
              rows={5}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escreva ou ajuste a legenda da sua publicação aqui..."
              className="resize-none rounded-lg border-slate-800 bg-slate-950 text-xs leading-relaxed text-slate-100 focus:border-[#0083C7] focus:ring-1 focus:ring-[#0083C7]"
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col items-center justify-end gap-2 border-t border-slate-800 pt-2 sm:flex-row">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSaving}
            className="h-9 w-full rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white sm:w-auto"
          >
            Cancelar
          </Button>

          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex h-9 w-full items-center gap-2 rounded-lg bg-[#0083C7] px-5 text-xs font-medium text-white shadow-sm hover:bg-[#0072ad] sm:w-auto"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <span>Salvar Alterações</span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
