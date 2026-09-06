"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { db, storage } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from "firebase/firestore";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, isVideoMedia } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

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
  isPublished?: boolean;
  publishedPlatforms?: string[];
  publishedAt?: any;
  type?: "image" | "video";
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
  const [selectedImageToView, setSelectedImageToView] = useState<string | null>(null);

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

      // 2. Classificar cada item da galeria
      const existingUrls = new Set<string>();
      const processedGalleryItems: GalleryMediaItem[] = rawGalleryItems.map((item) => {
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

        const isVideo = isVideoMedia(item.url) || item.fileName?.toLowerCase().endsWith(".mp4");

        return {
          ...item,
          usedInPostId: isItemPub ? item.usedInPostId || postMeta?.postId || "published" : null,
          isPublished: isItemPub,
          publishedPlatforms: postMeta?.platforms,
          publishedAt: postMeta?.scheduledAt,
          caption: item.caption || postMeta?.text || null,
          type: isVideo ? "video" : "image",
          fileName: item.fileName || (isVideo ? "video.mp4" : "imagem.jpg"),
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

          urls.forEach((u, idx) => {
            if (u && !existingUrls.has(u) && !u.startsWith("blob:") && !u.startsWith("data:")) {
              existingUrls.add(u);
              const isVideo = isVideoMedia(u) || post.type === "story" && isVideoMedia(u) || post.type === "video";
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
          return {
            id: docSnap.id,
            url: data.url,
            storagePath: data.storagePath,
            source: data.source || "wizard_generation",
            prompt: data.prompt || null,
            createdAt: data.createdAt,
            usedInPostId: data.usedInPostId || null,
            fileName: data.fileName || "imagem.jpg",
            caption: data.caption || null,
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
    // Salvar informações da imagem/vídeo na sessionStorage para carregar diretamente na tela de manual
    try {
      const isVideo = isVideoMedia(item.url) || item.type === "video";
      sessionStorage.setItem(
        "preloaded_gallery_image",
        JSON.stringify({
          url: item.url,
          storagePath: item.storagePath,
          prompt: item.prompt,
          caption: item.caption || null,
          type: isVideo ? "video" : "image",
        })
      );
      toast({
        title: isVideo ? "Carregando vídeo..." : "Carregando imagem...",
        description: "Redirecionando você para o Criador de Post Manual.",
      });
      router.push("/dashboard/posts/criar?from_gallery=true");
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteItem = async (item: GalleryMediaItem) => {
    if (!user) return;

    if (
      !confirm(
        "Tem certeza que deseja excluir esta mídia da sua galeria? Esta ação é definitiva e removerá o arquivo do armazenamento."
      )
    ) {
      return;
    }

    toast({
      title: "Excluindo mídia...",
      description: "Removendo do banco de dados e do armazenamento do Firebase.",
    });

    try {
      // 1. Deletar o documento do Firestore se for da subcoleção mediaGallery
      if (!item.id.startsWith("post_media_")) {
        const docRef = doc(db, "users", user.uid, "mediaGallery", item.id);
        await deleteDoc(docRef);
      }

      // 2. Deletar o arquivo físico no Firebase Storage se existir storagePath
      if (item.storagePath) {
        const fileStorageRef = ref(storage, item.storagePath);
        await deleteObject(fileStorageRef);
      }

      toast({
        variant: "success",
        title: "Sucesso!",
        description: "Mídia excluída da sua galeria com sucesso.",
      });
    } catch (error: any) {
      console.error("Erro ao excluir item da galeria:", error);
      toast({
        variant: "destructive",
        title: "Erro ao Excluir",
        description: "Ocorreu uma falha ao tentar deletar o arquivo: " + error.message,
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
                    {/* Mídia do Card (Vídeo ou Imagem) */}
                    <div className="relative aspect-square w-full overflow-hidden bg-slate-950">
                      {isVideoMedia(item.url) || item.type === "video" ? (
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
                      <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="flex items-center gap-1.5 rounded-full text-xs font-bold shadow-md hover:bg-white"
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
                          onClick={() => setSelectedImageToView(item.url)}
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
                      <div className="flex w-full gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-gray-200 text-xs font-semibold transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                          onClick={() => handleCreatePost(item)}
                        >
                          <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                          Usar em Post
                        </Button>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-9 w-9 shrink-0 border-gray-200 text-gray-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                                disabled={isDownloading === item.url}
                                onClick={() => handleDownloadImage(item.url, item.fileName)}
                              >
                                {isDownloading === item.url ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                ) : (
                                  <Download className="h-4 w-4" />
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
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedImageToView} onOpenChange={(open) => !open && setSelectedImageToView(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none shadow-2xl">
          <DialogTitle className="sr-only">Visualizar Mídia</DialogTitle>
          <DialogDescription className="sr-only">
            Visualização em tamanho grande da mídia selecionada.
          </DialogDescription>
          {selectedImageToView && (
            <div className="relative w-full h-[80vh] flex items-center justify-center bg-black/90 rounded-lg backdrop-blur-sm overflow-hidden p-4">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4 z-50 h-10 w-10 rounded-full bg-black/60 text-white hover:bg-black/80 hover:text-white"
                onClick={() => setSelectedImageToView(null)}
              >
                <X className="h-5 w-5" />
              </Button>
              {isVideoMedia(selectedImageToView) ? (
                <video
                  src={selectedImageToView}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-full max-w-full rounded-md object-contain shadow-2xl"
                />
              ) : (
                <Image
                  src={selectedImageToView}
                  alt="Mídia em tamanho grande"
                  layout="fill"
                  objectFit="contain"
                  unoptimized
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
