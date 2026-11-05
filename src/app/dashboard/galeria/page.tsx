"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { db, storage } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, addDoc, Timestamp } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles,
  Trash2,
  Send,
  Copy,
  Calendar,
  Image as ImageIcon,
  ExternalLink,
  Loader2,
  Eye,
  CheckCircle,
  HelpCircle,
  Download,
  Maximize2,
  X,
  Play,
  Film,
  Video,
  CheckSquare,
  Instagram,
  Facebook,
  Layers,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, isVideoMedia } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface GalleryMediaItem {
  id: string;
  url: string;
  storagePath: string;
  source: string;
  prompt: string | null;
  createdAt: any;
  usedInPostId: string | null;
  fileName: string;
  caption?: string | null;
  originalUrl?: string;
  isPublished?: boolean;
  publishedPlatforms?: string[];
  publishedAt?: any;
  type?: "image" | "video" | "carousel";
  hasPrintedLogo?: boolean;
  skipAutoLogo?: boolean;
  brandKitApplied?: boolean;
  mediaUrls?: string[];
  itemCount?: number;
  groupedDocIds?: string[];
}

export default function GaleriaPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [mediaItems, setMediaItems] = useState<GalleryMediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "unused" | "used">("unused");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [selectedItemToView, setSelectedItemToView] = useState<GalleryMediaItem | null>(null);
  const [modalSlideIndex, setModalSlideIndex] = useState<number>(0);
  const [cardSlideIndices, setCardSlideIndices] = useState<Record<string, number>>({});

  const getSlideIndex = (id: string) => cardSlideIndices[id] || 0;
  const handlePrevSlide = (id: string, total: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCardSlideIndices((prev) => ({
      ...prev,
      [id]: ((prev[id] || 0) - 1 + total) % total,
    }));
  };
  const handleNextSlide = (id: string, total: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCardSlideIndices((prev) => ({
      ...prev,
      [id]: ((prev[id] || 0) + 1) % total,
    }));
  };

  // Estados para envio de mídia para aprovação do cliente
  const [selectedItemForApproval, setSelectedItemForApproval] = useState<GalleryMediaItem | null>(null);
  const [approvalCaption, setApprovalCaption] = useState<string>("");
  const [approvalScheduleDate, setApprovalScheduleDate] = useState<string>("");
  const [approvalPlatforms, setApprovalPlatforms] = useState<string[]>(["instagram", "facebook"]);
  const [isSubmittingApproval, setIsSubmittingApproval] = useState<boolean>(false);

  // Escutar tanto a subcoleção mediaGallery quanto os posts publicados do usuário em tempo real
  useEffect(() => {
    if (!user) return;

    setIsLoading(true);
    const galleryRef = collection(db, "users", user.uid, "mediaGallery");
    const galleryQuery = query(galleryRef, orderBy("createdAt", "desc"));

    const postsRef = collection(db, "users", user.uid, "posts");
    const postsQuery = query(postsRef, orderBy("scheduledAt", "desc"));

    let rawGalleryItems: GalleryMediaItem[] = [];
    let rawPosts: any[] = [];

    const syncItems = () => {
      // 1. Mapear todas as URLs e IDs de posts que foram efetivamente publicados ou agendados
      const publishedUrls = new Set<string>();
      const publishedPostIds = new Set<string>();
      const postMetaByUrl = new Map<
        string,
        { postId: string; platforms: string[]; scheduledAt: any; text?: string }
      >();

      rawPosts.forEach((post) => {
        const isPostPublished =
          post.status === "published" ||
          post.status === "scheduled" ||
          Boolean(post.publishedMediaId);

        if (isPostPublished) {
          publishedPostIds.add(post.id);
          const urls: string[] = [];
          if (post.videoUrl) urls.push(post.videoUrl);
          if (post.imageUrl) urls.push(post.imageUrl);
          if (Array.isArray(post.imageUrls)) urls.push(...post.imageUrls);
          if (Array.isArray(post.mediaFiles)) {
            urls.push(...post.mediaFiles.map((m: any) => m.url).filter(Boolean));
          }
          if (Array.isArray(post.slides)) {
            urls.push(...post.slides.map((s: any) => s.imageUrl).filter(Boolean));
          }

          urls.forEach((u) => {
            if (u) {
              publishedUrls.add(u);
              postMetaByUrl.set(u, {
                postId: post.id,
                platforms: post.platforms || [],
                scheduledAt: post.scheduledAt || post.createdAt,
                text: post.text || post.caption || "",
              });
            }
          });
        }
      });

      // 2. Agrupar itens legados avulsos salvos juntos que pertencem ao mesmo carrossel
      const groupedGalleryMap = new Map<string, GalleryMediaItem[]>();
      const standaloneGalleryItems: GalleryMediaItem[] = [];

      rawGalleryItems.forEach((item) => {
        if (item.type === "carousel" || (item.mediaUrls && item.mediaUrls.length > 1)) {
          standaloneGalleryItems.push(item);
          return;
        }

        const timeSec = item.createdAt?.seconds
          ? item.createdAt.seconds
          : Math.floor(new Date(item.createdAt || 0).getTime() / 1000);
        const normCaption = (item.caption || "").trim();

        if (normCaption.length > 10 && timeSec > 0) {
          const timeSlot = Math.floor(timeSec / 120);
          const groupKey = `${normCaption.slice(0, 50)}_${timeSlot}`;
          if (!groupedGalleryMap.has(groupKey)) {
            groupedGalleryMap.set(groupKey, []);
          }
          groupedGalleryMap.get(groupKey)!.push(item);
        } else {
          standaloneGalleryItems.push(item);
        }
      });

      const unifiedGalleryItems: GalleryMediaItem[] = [...standaloneGalleryItems];

      groupedGalleryMap.forEach((group) => {
        if (group.length > 1) {
          // Ordenar itens do grupo rigorosamente na ordem original enviada (ascendente)
          group.sort((a, b) => {
            const matchA = a.fileName?.match(/_(\d+)\.[a-zA-Z0-9]+$/);
            const matchB = b.fileName?.match(/_(\d+)\.[a-zA-Z0-9]+$/);
            if (matchA && matchB) {
              return parseInt(matchA[1], 10) - parseInt(matchB[1], 10);
            }
            const timeA = a.createdAt?.seconds
              ? a.createdAt.seconds
              : new Date(a.createdAt || 0).getTime();
            const timeB = b.createdAt?.seconds
              ? b.createdAt.seconds
              : new Date(b.createdAt || 0).getTime();
            return timeA - timeB;
          });

          const first = group[0];
          const allUrls = group.map((g) => g.url).filter(Boolean);
          const allIds = group.map((g) => g.id);
          unifiedGalleryItems.push({
            ...first,
            id: `carousel_${first.id}`,
            type: "carousel",
            url: allUrls[0], // Capa é sempre a primeira imagem enviada
            mediaUrls: allUrls,
            itemCount: allUrls.length,
            groupedDocIds: allIds,
            fileName: `carrossel_${group.length}_fotos.jpg`,
          });
        } else {
          unifiedGalleryItems.push(...group);
        }
      });

      const existingUrls = new Set<string>();
      const processedGalleryItems: GalleryMediaItem[] = unifiedGalleryItems.map((item) => {
        if (item.mediaUrls) {
          item.mediaUrls.forEach((u) => existingUrls.add(u));
        } else {
          existingUrls.add(item.url);
        }
        existingUrls.add(item.url);

        let isItemPub = Boolean(
          item.usedInPostId &&
            item.usedInPostId !== "" &&
            item.usedInPostId !== "null" &&
            publishedPostIds.has(item.usedInPostId)
        );
        let postMeta = postMetaByUrl.get(item.url);

        if (!isItemPub) {
          if (publishedUrls.has(item.url)) {
            isItemPub = true;
            postMeta = postMetaByUrl.get(item.url);
          } else if (item.fileName) {
            for (const pubUrl of publishedUrls) {
              if (pubUrl.includes(item.fileName)) {
                isItemPub = true;
                postMeta = postMetaByUrl.get(pubUrl);
                break;
              }
            }
          }
        }

        // Se o item for uma imagem editada, herda a legenda da mídia original se disponível
        let resolvedCaption = item.caption || postMeta?.text || null;
        const isTechnical = (txt: string | null | undefined) =>
          Boolean(
            txt &&
              (txt.includes("área selecionada") ||
                txt.includes("Remova e apague") ||
                txt.includes("Altere o título") ||
                txt.includes("Atualize o texto/dado") ||
                txt.includes("Altere o valor") ||
                txt.includes("Ajuste os tons") ||
                txt.includes("substitua o conteúdo atual") ||
                txt.includes("inpainting"))
          );

        if ((!resolvedCaption || isTechnical(resolvedCaption)) && item.originalUrl) {
          const origPostMeta = postMetaByUrl.get(item.originalUrl);
          const origItem = rawGalleryItems.find((g) => g.url === item.originalUrl);
          const candidate = origItem?.caption || origPostMeta?.text || null;
          if (candidate && !isTechnical(candidate)) {
            resolvedCaption = candidate;
          }
        }

        const isCarousel = item.type === "carousel" || (Array.isArray(item.mediaUrls) && item.mediaUrls.length > 1);
        const isVideo = !isCarousel && (isVideoMedia(item.url) || item.fileName?.toLowerCase().endsWith(".mp4"));

        return {
          ...item,
          usedInPostId: isItemPub ? item.usedInPostId || postMeta?.postId || "published" : null,
          isPublished: isItemPub,
          publishedPlatforms: postMeta?.platforms,
          publishedAt: postMeta?.scheduledAt,
          caption: resolvedCaption,
          type: isCarousel ? "carousel" : isVideo ? "video" : "image",
          fileName: item.fileName || (isCarousel ? "carrossel.jpg" : isVideo ? "video.mp4" : "imagem.jpg"),
        };
      });

      // 3. Incluir também posts publicados do Firestore cujas imagens/vídeos ainda não estejam catalogados na galeria
      rawPosts.forEach((post) => {
        const isPostPublished =
          post.status === "published" ||
          post.status === "scheduled" ||
          Boolean(post.publishedMediaId);

        if (isPostPublished) {
          const urls: string[] = [];
          if (post.videoUrl) urls.push(post.videoUrl);
          if (post.imageUrl) urls.push(post.imageUrl);
          if (Array.isArray(post.imageUrls)) urls.push(...post.imageUrls);
          if (Array.isArray(post.mediaFiles)) {
            urls.push(...post.mediaFiles.map((m: any) => m.url).filter(Boolean));
          }
          if (Array.isArray(post.slides)) {
            urls.push(...post.slides.map((s: any) => s.imageUrl).filter(Boolean));
          }

          const validUrls = urls.filter(
            (u) => u && !u.startsWith("blob:") && !u.startsWith("data:")
          );

          if (post.type === "carousel" || validUrls.length > 1) {
            const firstUrl = validUrls[0];
            if (firstUrl && !existingUrls.has(firstUrl)) {
              validUrls.forEach((u) => existingUrls.add(u));
              processedGalleryItems.push({
                id: `post_media_${post.id}`,
                url: firstUrl,
                storagePath: "",
                source: "published_post",
                prompt: null,
                createdAt: post.scheduledAt || post.createdAt || new Date(),
                usedInPostId: post.id,
                fileName: `carrossel_${post.id}.jpg`,
                caption: post.text || post.caption || null,
                isPublished: true,
                publishedPlatforms: post.platforms || [],
                publishedAt: post.scheduledAt || post.createdAt,
                type: "carousel",
                mediaUrls: validUrls,
                itemCount: validUrls.length,
              });
            }
          } else {
            validUrls.forEach((u, idx) => {
              if (u && !existingUrls.has(u)) {
                existingUrls.add(u);
                const isVideo = isVideoMedia(u) || (post.type === "story" && isVideoMedia(u)) || post.type === "video";
                processedGalleryItems.push({
                  id: `post_media_${post.id}_${idx}`,
                  url: u,
                  storagePath: "",
                  source: "published_post",
                  prompt: null,
                  createdAt: post.scheduledAt || post.createdAt || new Date(),
                  usedInPostId: post.id,
                  fileName: isVideo ? `video_${idx + 1}.mp4` : `publicacao_${idx + 1}.jpg`,
                  caption: post.text || null,
                  isPublished: true,
                  publishedPlatforms: post.platforms || [],
                  publishedAt: post.scheduledAt || post.createdAt,
                  type: isVideo ? "video" : "image",
                });
              }
            });
          }
        }
      });

      // Ordenar por data mais recente
      processedGalleryItems.sort((a, b) => {
        const dateA = a.createdAt?.seconds
          ? a.createdAt.seconds * 1000
          : new Date(a.createdAt || 0).getTime();
        const dateB = b.createdAt?.seconds
          ? b.createdAt.seconds * 1000
          : new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      setMediaItems(processedGalleryItems);
      setIsLoading(false);
    };

    const unsubGallery = onSnapshot(
      galleryQuery,
      (snapshot) => {
        rawGalleryItems = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const isCar = data.type === "carousel" || (Array.isArray(data.mediaUrls) && data.mediaUrls.length > 1);
          const hasLogo = Boolean(
            data.hasPrintedLogo ||
            data.skipAutoLogo ||
            data.brandKitApplied ||
            (data.source === "ai_image_general" && data.brandKitApplied !== false)
          );
          return {
            id: docSnap.id,
            url: data.url,
            storagePath: data.storagePath || "",
            source: data.source || "wizard_generation",
            prompt: data.prompt || null,
            createdAt: data.createdAt,
            usedInPostId: data.usedInPostId || null,
            fileName: data.fileName || (isCar ? "carrossel.jpg" : "imagem.jpg"),
            caption: data.caption || null,
            type: isCar ? "carousel" : data.type || "image",
            mediaUrls: Array.isArray(data.mediaUrls) ? data.mediaUrls : undefined,
            itemCount: data.itemCount || (Array.isArray(data.mediaUrls) ? data.mediaUrls.length : 1),
            hasPrintedLogo: hasLogo,
            skipAutoLogo: hasLogo,
            brandKitApplied: Boolean(data.brandKitApplied),
          };
        });
        syncItems();
      },
      (err) => {
        console.error("Erro ao escutar mediaGallery:", err);
        setIsLoading(false);
      }
    );

    const unsubPosts = onSnapshot(
      postsQuery,
      (snapshot) => {
        rawPosts = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        syncItems();
      },
      (err) => {
        console.error("Erro ao escutar posts:", err);
      }
    );

    return () => {
      unsubGallery();
      unsubPosts();
    };
  }, [user]);

  // Filtrar com precisão os itens conforme a aba ativa
  const filteredItems = useMemo(() => {
    return mediaItems.filter((item) => {
      if (activeTab === "all") return true;
      if (activeTab === "unused") return !item.isPublished;
      if (activeTab === "used") return item.isPublished === true;
      return true;
    });
  }, [mediaItems, activeTab]);

  const unusedCount = useMemo(() => mediaItems.filter((i) => !i.isPublished).length, [mediaItems]);
  const usedCount = useMemo(() => mediaItems.filter((i) => i.isPublished).length, [mediaItems]);

  const handleCopyText = (text: string | null, id: string, isCaption: boolean = true) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({
      title: isCaption ? "Conteúdo Copiado!" : "Prompt Copiado!",
      description: isCaption
        ? "O conteúdo gerado foi copiado para a sua área de transferência."
        : "O prompt de geração foi copiado para a sua área de transferência.",
    });
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCreatePost = (item: GalleryMediaItem) => {
    try {
      const isCarousel = item.type === "carousel" && item.mediaUrls && item.mediaUrls.length > 0;
      const isVideo = !isCarousel && (isVideoMedia(item.url) || item.type === "video");
      sessionStorage.setItem(
        "preloaded_gallery_image",
        JSON.stringify({
          url: item.url,
          storagePath: item.storagePath,
          prompt: item.prompt,
          caption: item.caption || null,
          type: isCarousel ? "carousel" : isVideo ? "video" : "image",
          mediaUrls: isCarousel ? item.mediaUrls : undefined,
          hasPrintedLogo: Boolean(item.hasPrintedLogo || item.skipAutoLogo),
          skipAutoLogo: Boolean(item.hasPrintedLogo || item.skipAutoLogo),
        })
      );
      toast({
        title: isCarousel ? "Carregando carrossel..." : isVideo ? "Carregando vídeo..." : "Carregando imagem...",
        description: isCarousel
          ? `Redirecionando com as ${item.mediaUrls?.length} fotos para o Criador de Post.`
          : "Redirecionando você para o Criador de Post Manual.",
      });
      router.push("/dashboard/posts/criar?from_gallery=true");
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenApprovalModal = (item: GalleryMediaItem) => {
    setSelectedItemForApproval(item);

    const isTechnical = (txt: string | null | undefined) =>
      Boolean(
        txt &&
          (txt.includes("área selecionada") ||
            txt.includes("Remova e apague") ||
            txt.includes("Altere o título") ||
            txt.includes("Atualize o texto/dado") ||
            txt.includes("Altere o valor") ||
            txt.includes("Ajuste os tons") ||
            txt.includes("substitua o conteúdo atual") ||
            txt.includes("inpainting"))
      );

    let initialCaption = item.caption || "";
    if (isTechnical(initialCaption)) {
      initialCaption = "";
    }

    // Se ainda não tiver legenda e o item veio de uma edição, tenta buscar a legenda da mídia original
    if (!initialCaption && item.originalUrl) {
      const origItem = mediaItems.find((m) => m.url === item.originalUrl);
      if (origItem?.caption && !isTechnical(origItem.caption)) {
        initialCaption = origItem.caption;
      }
    }

    // Se ainda não tiver legenda e o prompt não for técnico (for prompt de geração de conteúdo), usa o prompt
    if (!initialCaption && item.prompt && !isTechnical(item.prompt)) {
      initialCaption = item.prompt;
    }

    setApprovalCaption(initialCaption);

    // Data padrão: amanhã às 10:00 local
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const day = String(tomorrow.getDate()).padStart(2, "0");
    const hours = String(tomorrow.getHours()).padStart(2, "0");
    const minutes = String(tomorrow.getMinutes()).padStart(2, "0");
    setApprovalScheduleDate(`${year}-${month}-${day}T${hours}:${minutes}`);
    setApprovalPlatforms(["instagram", "facebook"]);
  };

  const handleSendToApproval = async () => {
    if (!user) return;
    if (!selectedItemForApproval) return;

    if (!approvalCaption.trim()) {
      toast({
        variant: "destructive",
        title: "Legenda necessária",
        description: "Por favor, preencha ou revise a legenda antes de enviar para aprovação.",
      });
      return;
    }

    if (!approvalScheduleDate) {
      toast({
        variant: "destructive",
        title: "Data e horário necessários",
        description: "Selecione a data e o horário previstos para a publicação.",
      });
      return;
    }

    if (approvalPlatforms.length === 0) {
      toast({
        variant: "destructive",
        title: "Selecione uma rede",
        description: "Escolha pelo menos uma rede social para a publicação.",
      });
      return;
    }

    try {
      setIsSubmittingApproval(true);
      const isVideo = selectedItemForApproval.type === "video" || isVideoMedia(selectedItemForApproval.url);
      const scheduledDateTime = new Date(approvalScheduleDate);

      const postDocData = {
        text: approvalCaption.trim(),
        caption: approvalCaption.trim(),
        imageUrl: isVideo ? null : selectedItemForApproval.url,
        videoUrl: isVideo ? selectedItemForApproval.url : null,
        imageUrls: isVideo ? [] : [selectedItemForApproval.url],
        mediaFiles: [{ url: selectedItemForApproval.url, type: isVideo ? "video" : "image" }],
        mediaType: isVideo ? "video" : "image",
        platforms: approvalPlatforms,
        scheduledAt: Timestamp.fromDate(scheduledDateTime),
        status: "pending_approval",
        approval: {
          status: "pending",
          requestedAt: Timestamp.now(),
          requestedBy: user.email || user.uid,
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const postsCol = collection(db, "users", user.uid, "posts");
      await addDoc(postsCol, postDocData);

      toast({
        variant: "success",
        title: "Enviado para Aprovação!",
        description: "O post foi enviado com sucesso para a Central de Aprovações do seu cliente.",
      });

      setSelectedItemForApproval(null);
    } catch (err: any) {
      console.error("Erro ao enviar post para aprovação:", err);
      toast({
        variant: "destructive",
        title: "Erro ao Enviar",
        description: "Não foi possível enviar para aprovação: " + (err?.message || "Tente novamente"),
      });
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const handleDeleteItem = async (item: GalleryMediaItem) => {
    if (!user) return;

    const isCarousel = item.type === "carousel" || (item.mediaUrls && item.mediaUrls.length > 1);
    const confirmMessage = isCarousel
      ? `Tem certeza que deseja excluir este carrossel com ${item.itemCount || item.mediaUrls?.length || 1} fotos da sua galeria? Esta ação é definitiva.`
      : "Tem certeza que deseja excluir esta mídia da sua galeria? Esta ação é definitiva e removerá o arquivo do armazenamento.";

    if (!confirm(confirmMessage)) {
      return;
    }

    toast({
      title: isCarousel ? "Excluindo carrossel..." : "Excluindo mídia...",
      description: "Removendo do banco de dados e do armazenamento.",
    });

    try {
      // 1. Deletar documentos no Firestore (todos os IDs se for carrossel agrupado ou id direto)
      if (item.groupedDocIds && item.groupedDocIds.length > 0) {
        await Promise.all(
          item.groupedDocIds.map((docId) =>
            deleteDoc(doc(db, "users", user.uid, "mediaGallery", docId)).catch((e) => {
              console.warn("Falha ao deletar documento agrupado:", docId, e);
            })
          )
        );
      } else if (!item.id.startsWith("post_media_")) {
        const docRef = doc(db, "users", user.uid, "mediaGallery", item.id);
        await deleteDoc(docRef).catch((e) => {
          console.warn("Falha ao deletar documento:", item.id, e);
        });
      }

      // 2. Tentar deletar o arquivo no Firebase Storage (sem travar se o arquivo já não existir)
      if (item.storagePath) {
        try {
          const fileStorageRef = ref(storage, item.storagePath);
          await deleteObject(fileStorageRef);
        } catch (storageError: any) {
          // Se o arquivo já não existe no Storage, ignora sem quebrar o fluxo
          console.warn("[GALERIA_DELETE] Arquivo já ausente no Storage:", storageError?.message);
        }
      }

      // 3. Atualizar o estado local imediatamente para feedback visual instantâneo
      setMediaItems((prev) => prev.filter((m) => m.id !== item.id));

      toast({
        variant: "success",
        title: "Sucesso!",
        description: isCarousel
          ? "Carrossel excluído da sua galeria com sucesso."
          : "Mídia excluída da sua galeria com sucesso.",
      });
    } catch (error: any) {
      console.error("Erro ao excluir item da galeria:", error);
      toast({
        variant: "destructive",
        title: "Erro ao Excluir",
        description: "Ocorreu uma falha ao tentar deletar: " + (error?.message || "Tente novamente"),
      });
    }
  };

  const handleDownloadImage = async (url: string, fileName: string) => {
    try {
      setIsDownloading(url);
      const isVideo = isVideoMedia(url);
      toast({
        title: "Iniciando download...",
        description: isVideo ? "Preparando o vídeo para download." : "Preparando a imagem para download.",
      });

      const proxyUrl = `/api/conteudo/gerar-referencia?action=proxy&url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error("Falha na resposta da rede");
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName || (isVideo ? "numvapt-video.mp4" : "numvapt-imagem.jpg");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      toast({
        variant: "success",
        title: "Download Concluído!",
        description: isVideo ? "Seu vídeo foi baixado com sucesso." : "Sua imagem foi baixada com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao baixar mídia por blob, tentando fallback de nova aba:", error);
      window.open(url, "_blank");
      toast({
        title: "Download Iniciado",
        description: "O arquivo foi aberto em uma nova aba para você salvá-lo.",
      });
    } finally {
      setIsDownloading(null);
    }
  };

  const formatItemDate = (timestamp: any) => {
    if (!timestamp) return "Recentemente";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-900">
            <Sparkles className="h-8 w-8 animate-pulse text-blue-500" />
            Minha Galeria NumVapt
          </h1>
          <p className="mt-1 text-gray-600">
            Gerencie todas as imagens criadas por Inteligência Artificial e reutilize-as de
            imediato.
          </p>
        </div>

        <Button
          onClick={() => router.push("/dashboard/imagens/gerar?mode=general")}
          className="bg-gradient-to-r from-blue-600 to-[#FA6305] hover:opacity-90 text-white font-bold rounded-xl text-xs h-10 px-5 shadow-md flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
        >
          <Sparkles className="h-4 w-4" />
          Criar com IA
        </Button>
      </div>

      <Card className="border-none bg-white/70 shadow-lg backdrop-blur-md">
        <CardHeader className="pb-0">
          <Tabs
            defaultValue="unused"
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as any)}
            className="w-full"
          >
            <div className="flex flex-col items-start justify-between gap-4 border-b pb-4 sm:flex-row sm:items-center">
              <TabsList className="grid w-full max-w-md grid-cols-3 bg-gray-100/80 p-1">
                <TabsTrigger value="unused" className="rounded-md py-1.5 text-xs font-medium">
                  Não Publicadas ({unusedCount})
                </TabsTrigger>
                <TabsTrigger value="used" className="rounded-md py-1.5 text-xs font-medium">
                  Já Publicadas ({usedCount})
                </TabsTrigger>
                <TabsTrigger value="all" className="rounded-md py-1.5 text-xs font-medium">
                  Todas ({mediaItems.length})
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
                <ImageIcon className="h-4 w-4" />
                Total no acervo: <span className="font-bold">{mediaItems.length} imagens</span>
              </div>
            </div>
          </Tabs>
        </CardHeader>

        <CardContent className="min-h-[350px] pt-6">
          {isLoading ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2">
              <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
              <p className="text-sm font-medium text-gray-500">
                Carregando seu acervo de imagens...
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
              <div className="rounded-full bg-gray-100 p-4">
                <ImageIcon className="h-12 w-12 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {activeTab === "unused" && "Nenhuma imagem disponível para publicação"}
                  {activeTab === "used" && "Nenhum post publicado com imagens do acervo"}
                  {activeTab === "all" && "Sua galeria está vazia"}
                </h3>
                <p className="mt-1 max-w-sm text-sm text-gray-600">
                  {activeTab === "unused" &&
                    "Todas as imagens geradas já foram publicadas! Crie novos posts para gerar novas imagens."}
                  {activeTab === "used" &&
                    "As imagens que você usar e publicar aparecerão marcadas aqui."}
                  {activeTab === "all" &&
                    "Gere ideias com o assistente de IA. Todos os conceitos gerados serão salvos aqui automaticamente!"}
                </p>
              </div>
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            >
              <AnimatePresence mode="popLayout">
                {filteredItems.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    {/* Mídia do Card (Vídeo, Carrossel ou Imagem) */}
                    <div className="relative aspect-square w-full overflow-hidden bg-slate-950">
                      {item.type === "carousel" && item.mediaUrls && item.mediaUrls.length > 1 ? (
                        <div className="relative h-full w-full">
                          <Image
                            src={item.mediaUrls[getSlideIndex(item.id)] || item.url}
                            alt={`Slide ${getSlideIndex(item.id) + 1}`}
                            layout="fill"
                            objectFit="cover"
                            unoptimized
                            className="transition-all duration-300 ease-out"
                          />

                          {/* Badge de Carrossel no topo direito */}
                          <div className="pointer-events-none absolute top-3 right-3 z-10 flex items-center gap-1.5 rounded-full bg-black/75 px-2.5 py-1 text-[11px] font-bold text-white shadow-md backdrop-blur-sm">
                            <Layers className="h-3.5 w-3.5 text-cyan-400" />
                            <span>{getSlideIndex(item.id) + 1}/{item.mediaUrls.length}</span>
                          </div>

                          {/* Setas de navegação direta no card */}
                          <button
                            type="button"
                            aria-label="Foto anterior"
                            onClick={(e) => handlePrevSlide(item.id, item.mediaUrls!.length, e)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white shadow-md hover:bg-black/90 transition-opacity opacity-0 group-hover:opacity-100"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            aria-label="Próxima foto"
                            onClick={(e) => handleNextSlide(item.id, item.mediaUrls!.length, e)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white shadow-md hover:bg-black/90 transition-opacity opacity-0 group-hover:opacity-100"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>

                          {/* Mini dots indicadores no rodapé da imagem */}
                          <div className="pointer-events-none absolute bottom-2 inset-x-0 z-10 flex justify-center items-center gap-1">
                            {item.mediaUrls.slice(0, 8).map((_, dotIdx) => (
                              <div
                                key={dotIdx}
                                className={cn(
                                  "h-1.5 rounded-full transition-all",
                                  dotIdx === getSlideIndex(item.id)
                                    ? "w-3 bg-white shadow-sm"
                                    : "w-1.5 bg-white/50"
                                )}
                              />
                            ))}
                            {item.mediaUrls.length > 8 && (
                              <span className="text-[9px] font-bold text-white drop-shadow">
                                +{item.mediaUrls.length - 8}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : isVideoMedia(item.url) || item.type === "video" ? (
                        <div className="relative h-full w-full">
                          <video
                            src={item.url}
                            className="h-full w-full object-cover opacity-90 transition-transform duration-500 ease-out group-hover:scale-105"
                            muted
                            playsInline
                            preload="metadata"
                          />
                          <div className="pointer-events-none absolute bottom-2 left-2 z-10 flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white shadow backdrop-blur-sm">
                            <Film className="h-3 w-3 text-pink-400" />
                            <span>Vídeo</span>
                          </div>
                          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white shadow-md backdrop-blur-sm transition-transform group-hover:scale-110">
                              <Play className="h-5 w-5 fill-white text-white translate-x-0.5" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <Image
                          src={item.url}
                          alt="Imagem da galeria"
                          layout="fill"
                          objectFit="cover"
                          unoptimized
                          className="transition-transform duration-500 ease-out group-hover:scale-105"
                        />
                      )}

                      {/* Badge de Status */}
                      <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-1">
                        {!item.isPublished ? (
                          <Badge className="flex items-center gap-1 rounded-full border-none bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm hover:bg-emerald-600">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                            Disponível
                          </Badge>
                        ) : (
                          <Badge className="rounded-full border-none bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm hover:bg-blue-700">
                            Publicada
                          </Badge>
                        )}
                      </div>

                      {/* Overlays rápidos de Hover */}
                      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100 p-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="flex items-center gap-1.5 rounded-full text-xs font-bold shadow-md hover:bg-white h-8 px-3"
                          onClick={() => handleCreatePost(item)}
                        >
                          <Send className="h-3.5 w-3.5" />
                          Publicar
                        </Button>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-8 w-8 rounded-full shadow-md transition-colors hover:bg-white hover:text-blue-600"
                          disabled={isDownloading === item.url}
                          onClick={() => handleDownloadImage(item.url, item.fileName)}
                        >
                          {isDownloading === item.url ? (
                            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-8 w-8 rounded-full shadow-md transition-colors hover:bg-white hover:text-gray-900"
                          title="Visualizar em tamanho grande"
                          aria-label="Visualizar em tamanho grande"
                          onClick={() => {
                            setSelectedItemToView(item);
                            setModalSlideIndex(getSlideIndex(item.id));
                          }}
                        >
                          <Maximize2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          className="h-8 w-8 rounded-full shadow-md"
                          onClick={() => handleDeleteItem(item)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Conteúdo Informativo */}
                    <div className="flex flex-1 flex-col justify-between space-y-3 bg-white p-4">
                      <div className="space-y-1.5">
                        <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                          <Calendar className="h-3 w-3" />
                          {formatItemDate(item.createdAt)}
                        </span>

                        {/* Box de Conteúdo/Legenda Gerada */}
                        {item.caption && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="group/prompt relative line-clamp-2 cursor-help rounded-lg border border-gray-100 bg-gray-50 p-2.5 pr-8 text-xs text-gray-600">
                                  <p className="whitespace-normal leading-relaxed">
                                    {item.caption}
                                  </p>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopyText(item.caption ?? null, item.id, true);
                                    }}
                                    className="absolute right-2 top-2 rounded p-1 text-gray-400 opacity-0 transition-opacity hover:bg-gray-200 hover:text-gray-800 group-hover/prompt:opacity-100"
                                  >
                                    {copiedId === item.id ? (
                                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                                    ) : (
                                      <Copy className="h-3.5 w-3.5" />
                                    )}
                                  </button>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs rounded-lg border-none bg-slate-900 p-3 text-xs leading-relaxed text-white shadow-lg">
                                <p className="mb-1 text-[10px] font-semibold text-blue-400">
                                  CONTEÚDO GERADO:
                                </p>
                                <p>{item.caption}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>

                      {/* Botões de Ação na base */}
                      <div className="flex flex-col w-full gap-2 pt-1">
                        <Button
                          size="sm"
                          className="w-full bg-[#0083C7] hover:bg-[#0072ad] text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 rounded-lg h-9 transition-colors"
                          onClick={() => handleOpenApprovalModal(item)}
                        >
                          <CheckSquare className="h-4 w-4 text-white" />
                          Enviar para Aprovação
                        </Button>

                        <div className="flex w-full gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 border-gray-200 text-xs font-semibold transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 h-8"
                            onClick={() => handleCreatePost(item)}
                          >
                            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                            Criar Post
                          </Button>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 shrink-0 border-gray-200 text-gray-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                                  disabled={isDownloading === item.url}
                                  onClick={() => handleDownloadImage(item.url, item.fileName)}
                                >
                                  {isDownloading === item.url ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                  ) : (
                                    <Download className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="rounded border-none bg-slate-950 px-2 py-1 text-[10px] text-white shadow">
                                Baixar imagem
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedItemToView}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedItemToView(null);
            setModalSlideIndex(0);
          }
        }}
      >
        <DialogContent className="max-w-5xl p-0 overflow-hidden bg-slate-950/95 border-slate-800 shadow-2xl text-white">
          <DialogTitle className="sr-only">Visualizar Mídia</DialogTitle>
          <DialogDescription className="sr-only">
            Visualização em tamanho grande da mídia selecionada.
          </DialogDescription>
          {selectedItemToView && (
            <div className="relative w-full h-[85vh] flex flex-col justify-between overflow-hidden">
              {/* Header do modal com informações do Carrossel */}
              <div className="absolute top-0 inset-x-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
                <div className="flex items-center gap-2">
                  {selectedItemToView.type === "carousel" && selectedItemToView.mediaUrls && selectedItemToView.mediaUrls.length > 1 ? (
                    <Badge className="bg-cyan-500/90 text-white font-bold flex items-center gap-1.5 px-3 py-1 rounded-full text-xs shadow">
                      <Layers className="h-3.5 w-3.5" />
                      Carrossel ({modalSlideIndex + 1} de {selectedItemToView.mediaUrls.length})
                    </Badge>
                  ) : selectedItemToView.type === "video" || isVideoMedia(selectedItemToView.url) ? (
                    <Badge className="bg-pink-500/90 text-white font-bold flex items-center gap-1.5 px-3 py-1 rounded-full text-xs shadow">
                      <Film className="h-3.5 w-3.5" />
                      Vídeo
                    </Badge>
                  ) : (
                    <Badge className="bg-blue-500/90 text-white font-bold flex items-center gap-1.5 px-3 py-1 rounded-full text-xs shadow">
                      <ImageIcon className="h-3.5 w-3.5" />
                      Imagem
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="bg-[#0083C7] hover:bg-[#0072ad] text-white text-xs font-bold rounded-lg shadow h-8 px-3 flex items-center gap-1.5"
                    onClick={() => {
                      const item = selectedItemToView;
                      setSelectedItemToView(null);
                      handleCreatePost(item);
                    }}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Criar Post
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full bg-black/60 text-white hover:bg-black/90 hover:text-white"
                    onClick={() => setSelectedItemToView(null)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Área Central de Visualização */}
              <div className="relative flex-1 flex items-center justify-center p-4">
                {selectedItemToView.type === "carousel" && selectedItemToView.mediaUrls && selectedItemToView.mediaUrls.length > 1 ? (
                  <div className="relative h-full w-full flex items-center justify-center">
                    <Image
                      src={selectedItemToView.mediaUrls[modalSlideIndex] || selectedItemToView.url}
                      alt={`Slide ${modalSlideIndex + 1}`}
                      layout="fill"
                      objectFit="contain"
                      unoptimized
                      className="transition-all duration-300"
                    />

                    {/* Setas de navegação grandes no modal */}
                    <button
                      type="button"
                      aria-label="Foto anterior no modal"
                      onClick={() =>
                        setModalSlideIndex(
                          (prev) =>
                            (prev - 1 + selectedItemToView.mediaUrls!.length) %
                            selectedItemToView.mediaUrls!.length
                        )
                      }
                      className="absolute left-4 top-1/2 -translate-y-1/2 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-black/70 text-white shadow-xl hover:bg-black/95 transition-all"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      type="button"
                      aria-label="Próxima foto no modal"
                      onClick={() =>
                        setModalSlideIndex(
                          (prev) => (prev + 1) % selectedItemToView.mediaUrls!.length
                        )
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-black/70 text-white shadow-xl hover:bg-black/95 transition-all"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </div>
                ) : selectedItemToView.type === "video" || isVideoMedia(selectedItemToView.url) ? (
                  <video
                    src={selectedItemToView.url}
                    controls
                    autoPlay
                    playsInline
                    className="max-h-full max-w-full rounded-md object-contain shadow-2xl"
                  />
                ) : (
                  <Image
                    src={selectedItemToView.url}
                    alt="Mídia em tamanho grande"
                    layout="fill"
                    objectFit="contain"
                    unoptimized
                  />
                )}
              </div>

              {/* Rodapé do Modal com Dots */}
              {selectedItemToView.type === "carousel" && selectedItemToView.mediaUrls && selectedItemToView.mediaUrls.length > 1 && (
                <div className="z-50 flex flex-col items-center gap-2 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                  <div className="flex items-center gap-1.5">
                    {selectedItemToView.mediaUrls.map((_, dotIdx) => (
                      <button
                        key={dotIdx}
                        type="button"
                        onClick={() => setModalSlideIndex(dotIdx)}
                        className={cn(
                          "h-2 rounded-full transition-all",
                          dotIdx === modalSlideIndex ? "w-6 bg-cyan-400 shadow-md" : "w-2 bg-white/40 hover:bg-white/70"
                        )}
                        aria-label={`Ir para foto ${dotIdx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Envio para Aprovação do Cliente */}
      <Dialog
        open={!!selectedItemForApproval}
        onOpenChange={(open) => !open && setSelectedItemForApproval(null)}
      >
        <DialogContent className="max-w-lg bg-white border border-slate-200 rounded-xl shadow-xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <CheckSquare className="h-5 w-5 text-[#0083C7]" />
              Enviar para Aprovação do Cliente
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Configure a legenda e a data prevista. O cliente verá este post na Central de Aprovações dele para revisar e aprovar.
            </DialogDescription>
          </DialogHeader>

          {selectedItemForApproval && (
            <div className="space-y-4 py-2">
              {/* Prévia da mídia selecionada */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="relative w-16 h-16 rounded-md overflow-hidden bg-slate-200 shrink-0">
                  {selectedItemForApproval.type === "video" || isVideoMedia(selectedItemForApproval.url) ? (
                    <video src={selectedItemForApproval.url} className="w-full h-full object-cover" />
                  ) : (
                    <Image
                      src={selectedItemForApproval.url}
                      alt="Prévia da imagem"
                      layout="fill"
                      objectFit="cover"
                      unoptimized
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    {selectedItemForApproval.fileName || "Mídia selecionada"}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {selectedItemForApproval.type === "video" || isVideoMedia(selectedItemForApproval.url)
                      ? "Vídeo da Galeria"
                      : "Imagem da Galeria"}
                  </p>
                  <Badge variant="secondary" className="mt-1 text-[10px] bg-blue-50 text-[#0083C7] border-blue-200 font-medium">
                    Ficará com status Pendente de Aprovação
                  </Badge>
                </div>
              </div>

              {/* Legenda da Publicação */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Legenda da Publicação</Label>
                <Textarea
                  value={approvalCaption}
                  onChange={(e) => setApprovalCaption(e.target.value)}
                  placeholder="Escreva ou ajuste a legenda da postagem que o cliente irá avaliar..."
                  rows={4}
                  className="text-xs resize-none"
                />
              </div>

              {/* Data e Horário Previstos */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Data e Horário Previstos</Label>
                <Input
                  type="datetime-local"
                  value={approvalScheduleDate}
                  onChange={(e) => setApprovalScheduleDate(e.target.value)}
                  className="text-xs"
                />
              </div>

              {/* Redes Sociais */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Canais de Publicação</Label>
                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={approvalPlatforms.includes("instagram")}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setApprovalPlatforms([...approvalPlatforms, "instagram"]);
                        } else {
                          setApprovalPlatforms(approvalPlatforms.filter((p) => p !== "instagram"));
                        }
                      }}
                      className="rounded border-slate-300 text-[#0083C7] focus:ring-[#0083C7]"
                    />
                    <Instagram className="h-4 w-4 text-pink-600" />
                    Instagram
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={approvalPlatforms.includes("facebook")}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setApprovalPlatforms([...approvalPlatforms, "facebook"]);
                        } else {
                          setApprovalPlatforms(approvalPlatforms.filter((p) => p !== "facebook"));
                        }
                      }}
                      className="rounded border-slate-300 text-[#0083C7] focus:ring-[#0083C7]"
                    />
                    <Facebook className="h-4 w-4 text-blue-600" />
                    Facebook
                  </label>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedItemForApproval(null)}
              disabled={isSubmittingApproval}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              className="bg-[#0083C7] hover:bg-[#0072ad] text-white font-bold"
              onClick={handleSendToApproval}
              disabled={isSubmittingApproval}
            >
              {isSubmittingApproval ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                  Enviar para Aprovação
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
