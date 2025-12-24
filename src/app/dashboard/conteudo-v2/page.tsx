
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  RefreshCw,
  MoreVertical,
  Trash2,
  Send,
  Calendar as CalendarIcon,
  LogOut,
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
import {
  format,
  isFuture,
  startOfDay,
  startOfMonth,
  startOfYear,
  isSameDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  getScheduledPosts,
  deletePost,
  schedulePost,
  PostDataInput,
} from "@/lib/services/posts-service";
import {
  getInstagramConnection,
  updateInstagramConnection,
  InstagramConnectionData,
} from "@/lib/services/instagram-service";
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
import { config } from "@/lib/config";

interface DisplayPost {
  id: string;
  title: string;
  text: string;
  imageUrl?: string;
  status: "scheduled" | "publishing" | "published" | "failed";
  date: Date;
  formattedDate: string;
  formattedTime: string;
  platforms: string[];
  instagramUsername?: string;
}

const maskToken = (v: string) => `${v.slice(0, 6)}...${v.slice(-6)}`;

const PostItem = ({
  post,
  onRepublish,
  isRepublishing,
  onDelete,
}: {
  post: DisplayPost;
  onRepublish: (post: DisplayPost) => void;
  isRepublishing: boolean;
  onDelete: (postId: string) => void;
}) => {
  const statusConfig = {
    published: { icon: CheckCircle, className: "bg-green-100 text-green-700" },
    scheduled: { icon: Clock, className: "bg-blue-100 text-blue-700" },
    failed: { icon: AlertTriangle, className: "bg-red-100 text-red-700" },
    publishing: { icon: Loader2, className: "bg-yellow-100 text-yellow-700 animate-spin" },
  };

  const currentStatus = post.status as keyof typeof statusConfig;
  const { icon: StatusIcon, className: statusClassName } = statusConfig[currentStatus] || {};
  const imageSrc = typeof post.imageUrl === "string" && post.imageUrl ? post.imageUrl : "https://placehold.co/400";

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
            <span>
              {post.formattedDate} às {post.formattedTime}
            </span>
          </div>

          {post.platforms?.includes('instagram') && (
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1.5">
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

      <div className="flex items-center gap-3 shrink-0">
        <Badge variant="outline" className={statusClassName}>
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
};

export default function ConteudoV2() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [allPosts, setAllPosts] = useState<DisplayPost[]>([]);
  const [instagramConnection, setInstagramConnection] = useState<InstagramConnectionData>({ isConnected: false });

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [displayedMonth, setDisplayedMonth] = useState<Date>(new Date());

  const [historyFilter, setHistoryFilter] = useState("this-month");
  const [isRepublishing, setIsRepublishing] = useState(false);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isRepublishModalOpen, setIsRepublishModalOpen] = useState(false);
  const [postToRepublish, setPostToRepublish] = useState<DisplayPost | null>(null);
  const [republishPlatforms, setRepublishPlatforms] = useState<Array<"instagram">>(["instagram"]);
  const [republishScheduleType, setRepublishScheduleType] = useState<"now" | "schedule">("now");
  const [republishScheduleDate, setRepublishScheduleDate] = useState("");

  const [checkingConnection, setCheckingConnection] = useState(true);

  const fetchPageData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setCheckingConnection(true);

    try {
      const [postsResults, instagramResult] = await Promise.all([
        getScheduledPosts(user.uid),
        getInstagramConnection(user.uid),
      ]);

      if (Array.isArray(postsResults) && !postsResults[0]?.error) {
        const displayPosts = postsResults
          .filter((result) => result.success && result.post)
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
              formattedTime: format(scheduledDate, "HH:mm"),
              platforms: post.platforms,
              instagramUsername: post.instagramUsername,
            };
          })
          .sort((a, b) => b.date.getTime() - a.date.getTime());

        setAllPosts(displayPosts);
      } else if (postsResults[0]?.error) {
        toast({ variant: "destructive", title: "Erro ao Carregar Posts", description: postsResults[0].error });
      } else {
        setAllPosts([]);
      }

      setInstagramConnection(instagramResult);
    } catch (error: any) {
      console.error("Failed to fetch page data:", error);
      toast({
        variant: "destructive",
        title: "Erro ao Carregar Dados",
        description: "Não foi possível carregar os dados da página.",
      });
    }

    setLoading(false);
    setCheckingConnection(false);
  }, [user, toast]);

  /**
   * Callback do NOVO método (Instagram-only)
   * URL exemplo:
   * ?instagram_connection_success=true&instagram_accessToken=...&instagram_id=...&instagram_username=...&user_id_from_state=...
   */
  useEffect(() => {
    const instagramConnectionSuccess = searchParams.get("instagram_connection_success");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (error) {
      toast({
        variant: "destructive",
        title: `Erro na Conexão (${error})`,
        description: decodeURIComponent(errorDescription || "Ocorreu um erro desconhecido."),
      });
    }

    if (instagramConnectionSuccess === "true") {
      const accessToken =
        searchParams.get("instagram_accessToken") || searchParams.get("instagram_accessToken"); // (mantém compatível)
      const instagramId = searchParams.get("instagram_id");
      const instagramUsername = searchParams.get("instagram_username");
      const uidFromState = searchParams.get("user_id_from_state");

      console.log("Instagram connection successful! Parameters found in URL.");
      console.log("[PASSO 2 OK] Extracted:", {
        accessToken: accessToken ? maskToken(accessToken) : null,
        instagramId,
        instagramUsername,
        uidFromState,
      });

      (async () => {
        try {
          if (!user?.uid) {
            console.warn("[PASSO 3 SKIP] user não disponível ainda.");
            return;
          }

          if (uidFromState && uidFromState !== user.uid) {
            console.error("[PASSO 3 BLOCK] uid do state não bate com user.uid", {
              uidFromState,
              userUid: user.uid,
            });
            toast({
              variant: "destructive",
              title: "Falha na Conexão",
              description: "O usuário da sessão não corresponde ao state recebido.",
            });
            return;
          }

          if (!accessToken || !instagramId || !instagramUsername) {
            console.error("[PASSO 3 BLOCK] Faltando params obrigatórios", {
              accessToken: !!accessToken,
              instagramId,
              instagramUsername,
            });
            toast({
              variant: "destructive",
              title: "Falha na Conexão",
              description: "Faltaram parâmetros obrigatórios retornados pelo Instagram.",
            });
            return;
          }

          await updateInstagramConnection(user.uid, {
            isConnected: true,
            accessToken,
            instagramId,
            instagramUsername,
          });

          console.log("[PASSO 3 OK] Salvamento concluído no Firestore.");

          toast({
            variant: "success",
            title: "Instagram conectado!",
            description: `Conexão estabelecida com @${instagramUsername}.`,
          });

          await fetchPageData();
        } catch (err) {
          console.error("[PASSO 3 FAIL] Erro ao salvar no Firestore:", err);
          toast({
            variant: "destructive",
            title: "Erro ao Salvar Dados",
            description: "Não foi possível salvar os dados da conexão.",
          });
        } finally {
          // Limpa a URL depois de processar
          router.replace("/dashboard/conteudo-v2", undefined);
        }
      })();
    }

    if (user) {
      fetchPageData();
    }
  }, [user, fetchPageData, searchParams, router, toast]);

  const { scheduledPosts, pastPosts, calendarModifiers, postsForSelectedDay } = useMemo(() => {
    const scheduled = allPosts.filter((p) => p.status === "scheduled");

    let historyBase = allPosts.filter(
      (p) => p.status === "published" || p.status === "failed" || p.status === "publishing"
    );

    const filterStartDate = (filter: string) => {
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
        default:
          return null;
      }
    };

    const startDate = filterStartDate(historyFilter);
    if (startDate) historyBase = historyBase.filter((p) => p.date >= startDate);

    const modifiers = {
      published: allPosts.filter((p) => p.status === "published").map((p) => p.date),
      scheduled: allPosts.filter((p) => p.status === "scheduled" && isFuture(p.date)).map((p) => p.date),
      failed: allPosts.filter((p) => p.status === "failed").map((p) => p.date),
    };

    const postsOnDay = selectedDate ? allPosts.filter((p) => isSameDay(p.date, selectedDate)) : [];

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
  };

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

    // sua URL já está funcionando — mantém
    const authUrl = `https://www.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=${responseType}&state=${state}`;
    window.location.href = authUrl;
  };

  const handleDisconnectInstagram = async () => {
    if (!user) return;
    await updateInstagramConnection(user.uid, { isConnected: false });
    await fetchPageData();
    toast({ title: "Desconectado", description: "A conexão com o Instagram foi removida." });
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
      await fetchPageData();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao Excluir", description: error.message });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setPostToDelete(null);
    }
  };

  const handleRepublish = (post: DisplayPost) => {
    if (!user) {
      toast({ variant: "destructive", title: "Erro", description: "Usuário não encontrado." });
      return;
    }

    setPostToRepublish(post);
    setRepublishPlatforms(["instagram"]);
    setRepublishScheduleType("now");
    setRepublishScheduleDate("");
    setIsRepublishModalOpen(true);
  };

  const handleConfirmRepublish = async () => {
    if (!user || !postToRepublish || !postToRepublish.imageUrl) {
        toast({ variant: 'destructive', title: "Erro", description: "Dados insuficientes para republicar. O post precisa ter uma imagem."});
        return;
    }

    if (!instagramConnection.isConnected) {
        toast({ variant: "destructive", title: "Instagram não conectado", description: "Conecte o Instagram para republicar."});
        return;
    }

    if (republishScheduleType === 'schedule' && !republishScheduleDate) {
        toast({ variant: "destructive", title: "Data inválida", description: "Selecione data e hora para o agendamento."});
        return;
    }

    setIsRepublishing(true);
    toast({ title: "Republicando...", description: "Enviando seu post para ser publicado novamente."});

    const postInput: PostDataInput = {
      title: postToRepublish.title,
      text: postToRepublish.text,
      media: postToRepublish.imageUrl,
      platforms: ["instagram"],
      scheduledAt: republishScheduleType === "schedule" ? new Date(republishScheduleDate) : new Date(),
      instagramConnection: instagramConnection,
    };

    const result = await schedulePost(user.uid, postInput);

    setIsRepublishing(false);
    setIsRepublishModalOpen(false);
    setPostToRepublish(null);

    await fetchPageData();

    if (result.success) {
      toast({
        variant: "success",
        title: "Sucesso!",
        description: `Post ${republishScheduleType === "now" ? "publicado" : "agendado para republicação"}!`,
      });
    } else {
      toast({ variant: "destructive", title: "Erro ao Republicar", description: result.error });
    }
  };

  const isLoadingInitial = loading && allPosts.length === 0;

  const ConnectCardInstagramOnly = () => (
    <Card className="shadow-lg border-dashed border-2 relative">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <LinkIcon className="w-6 h-6 text-gray-700" />
          Conecte seu Instagram
        </CardTitle>
        <p className="text-gray-600 text-sm pt-2">
          Conecte seu perfil para publicar e agendar posts no Instagram.
        </p>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-500">
              <Instagram className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Instagram API</h3>
              <p className="text-sm text-gray-500">Método novo</p>
            </div>
          </div>

          {checkingConnection ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : instagramConnection.isConnected ? (
            <div className="flex items-center gap-2 text-sm text-green-600 font-semibold">
              <CheckCircle className="w-4 h-4" />
              @{instagramConnection.instagramUsername}
            </div>
          ) : (
            <Button variant="secondary" onClick={handleConnectInstagram}>
              Conectar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const ConnectionStatusCardInstagram = () => (
    <Card className="shadow-lg border-none mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <LinkIcon className="w-5 h-5 text-gray-700" />
          Instagram Conectado
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
              <p className="text-sm text-green-800 font-medium truncate">
                @{instagramConnection.instagramUsername}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleDisconnectInstagram}
            className="text-red-600 hover:bg-red-100 shrink-0"
            title="Desconectar"
          >
            <LogOut className="w-4 h-4" />
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

  return (
    <>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a publicação do seu histórico.
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
            <DialogTitle>
              Posts de {selectedDate ? format(selectedDate, "dd 'de' LLLL 'de' yyyy", { locale: ptBR }) : ""}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 max-h-[60vh] overflow-y-auto space-y-3 pr-2">
            {postsForSelectedDay.length > 0 ? (
              postsForSelectedDay.map((post) => (
                <PostItem
                  key={post.id}
                  post={post}
                  onRepublish={handleRepublish}
                  isRepublishing={isRepublishing}
                  onDelete={handleDeleteRequest}
                />
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
            <DialogTitle>Republicar Post</DialogTitle>
            <DialogDescription>Escolha quando você quer republicar este conteúdo no Instagram.</DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-6">
            <div>
              <Label className="font-semibold">Onde publicar?</Label>
              <div className="grid grid-cols-1 gap-4 mt-2">
                <div
                  className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer peer-data-[state=checked]:border-primary"
                  data-state={republishPlatforms.includes("instagram") ? "checked" : "unchecked"}
                >
                  <Checkbox id="republish-instagram" checked disabled />
                  <Label htmlFor="republish-instagram" className="flex items-center gap-2 cursor-pointer">
                    <Instagram className="w-5 h-5 text-pink-500" />
                    Instagram
                  </Label>
                </div>
              </div>
            </div>

            <div>
              <Label className="font-semibold">Quando publicar?</Label>
              <RadioGroup
                value={republishScheduleType}
                onValueChange={(v) => setRepublishScheduleType(v as "now" | "schedule")}
                className="grid grid-cols-2 gap-4 mt-2"
              >
                <div>
                  <RadioGroupItem value="now" id="republish-now" className="peer sr-only" />
                  <Label
                    htmlFor="republish-now"
                    className="flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer peer-data-[state=checked]:border-primary"
                  >
                    <Clock className="w-6 h-6 mb-2" />
                    Publicar Agora
                  </Label>
                </div>

                <div>
                  <RadioGroupItem value="schedule" id="republish-schedule" className="peer sr-only" />
                  <Label
                    htmlFor="republish-schedule"
                    className="flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer peer-data-[state=checked]:border-primary"
                  >
                    <CalendarIcon className="w-6 h-6 mb-2" />
                    Agendar
                  </Label>
                </div>
              </RadioGroup>

              {republishScheduleType === "schedule" && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                  <Input
                    type="datetime-local"
                    value={republishScheduleDate}
                    onChange={(e) => setRepublishScheduleDate(e.target.value)}
                  />
                </motion.div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRepublishModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmRepublish}
              disabled={isRepublishing || (republishScheduleType === "schedule" && !republishScheduleDate)}
            >
              {isRepublishing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              {republishScheduleType === "now" ? "Republicar" : "Agendar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
        `}</style>

        {/* Cabeçalho */}
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Conteúdo & Marketing (V2)</h1>
            <p className="text-gray-600 mt-1">Instagram-only: crie, agende e analise o conteúdo.</p>
          </div>

          <div className="flex gap-4 pt-2">
            <Button
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-md hover:shadow-lg transition-shadow"
              onClick={() => router.push("/dashboard/conteudo-v2/gerar")}
              size="lg"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Gerar Conteúdo com IA
            </Button>

            <Button
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-shadow"
              onClick={() => router.push("/dashboard/conteudo-v2/criar")}
              size="lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Criar Conteúdo
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {!instagramConnection.isConnected && !loading && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <ConnectCardInstagramOnly />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
            <CalendarCard />
            {instagramConnection.isConnected && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                <ConnectionStatusCardInstagram />
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
                      <div className="flex justify-center items-center h-24">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                      </div>
                    ) : scheduledPosts.length > 0 ? (
                      scheduledPosts.map((post) => (
                        <PostItem
                          key={post.id}
                          post={post}
                          onRepublish={handleRepublish}
                          isRepublishing={isRepublishing}
                          onDelete={handleDeleteRequest}
                        />
                      ))
                    ) : (
                      <div className="text-center text-gray-500 py-6">
                        <Clock className="w-8 h-8 mx-auto text-gray-400 mb-2" />
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
                      <div className="flex justify-center items-center h-40">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                      </div>
                    ) : pastPosts.length > 0 ? (
                      pastPosts.map((post) => (
                        <PostItem
                          key={post.id}
                          post={post}
                          onRepublish={handleRepublish}
                          isRepublishing={isRepublishing}
                          onDelete={handleDeleteRequest}
                        />
                      ))
                    ) : (
                      <div className="text-center text-gray-500 py-10">
                        <Instagram className="w-10 h-10 mx-auto text-gray-400 mb-2" />
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

    