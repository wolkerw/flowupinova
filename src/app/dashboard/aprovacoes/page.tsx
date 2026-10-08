"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, Timestamp, doc } from "firebase/firestore";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  MessageSquare,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  CheckCheck,
  Instagram,
  Facebook,
  ExternalLink,
  ShieldCheck,
  Crown,
  FileCheck2,
  UserPlus,
  Key,
  Copy,
  Check,
  Maximize2,
  X,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  approvePostByClient,
  requestPostChangesByClient,
  resubmitPostByCreator,
  updatePostImageByCreator,
  type PostData,
} from "@/lib/services/posts-service";
import type { ClientApproverAccount } from "@/lib/types/concierge";
import { cn, isVideoMedia } from "@/lib/utils";
import { ImageAiEditorModal } from "@/components/dashboard/ImageAiEditorModal";

type TabType = "pending" | "changes" | "approved" | "published";

interface ClientPostItem extends PostData {
  id: string;
}

export default function ClientApprovalsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [posts, setPosts] = useState<ClientPostItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [effectiveWorkspaceId, setEffectiveWorkspaceId] = useState<string | null>(null);
  const [isApproverRole, setIsApproverRole] = useState<boolean>(false);

  // Estados para gerenciar o acesso do Cliente Aprovador (pelo Gestor)
  const [approverData, setApproverData] = useState<ClientApproverAccount | null>(null);
  const [isApproverModalOpen, setIsApproverModalOpen] = useState<boolean>(false);
  const [approverForm, setApproverForm] = useState({ name: "", email: "", password: "" });
  const [savingApprover, setSavingApprover] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [selectedImageToView, setSelectedImageToView] = useState<string | null>(null);
  const [aiEditorState, setAiEditorState] = useState<{
    post: ClientPostItem;
    imageUrl: string;
    imageIndex: number;
  } | null>(null);

  // Buscar aprovador vinculado
  const fetchApprover = React.useCallback(async () => {
    try {
      const res = await fetch("/api/concierge/approver");
      if (res.ok) {
        const json = await res.json();
        if (json.approver) {
          setApproverData(json.approver);
          setApproverForm((prev) => ({
            ...prev,
            name: json.approver.approverName || "",
            email: json.approver.approverEmail || "",
          }));
        }
      }
    } catch (err) {
      console.warn("Erro ao buscar aprovador:", err);
    }
  }, []);

  React.useEffect(() => {
    if (user && !isApproverRole) {
      fetchApprover();
    }
  }, [user, isApproverRole, fetchApprover]);

  const handleSaveApprover = async () => {
    if (!approverForm.email || !approverForm.password) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha e-mail e senha para gerar o acesso do cliente.",
        variant: "destructive",
      });
      return;
    }
    setSavingApprover(true);
    try {
      const res = await fetch("/api/concierge/approver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(approverForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao salvar acesso.");

      setApproverData(data.approver);
      toast({
        title: "Acesso Criado com Sucesso!",
        description: "O cliente agora pode entrar com essas credenciais e aprovar os posts.",
      });
      setIsApproverModalOpen(false);
    } catch (err: any) {
      toast({
        title: "Erro ao criar acesso",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSavingApprover(false);
    }
  };

  const handleCopyWhatsappText = () => {
    const text = `Olá ${approverForm.name || "Cliente"}! Segue seu acesso exclusivo para aprovar as postagens da nossa empresa na plataforma NumVapt:\n\n🔗 Acesso: ${typeof window !== "undefined" ? window.location.origin : ""}/acesso/login\n📧 E-mail: ${approverForm.email}\n🔑 Senha: ${approverForm.password || "(sua senha definida)"}\n\nAo entrar, você verá a fila de postagens prontas para validar e agendar!`;
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
    toast({
      title: "Mensagem Copiada!",
      description: "Cole no WhatsApp do seu cliente para enviar as credenciais de acesso.",
    });
  };

  // Estado para modal de solicitação de ajuste
  const [selectedPostForChanges, setSelectedPostForChanges] = useState<ClientPostItem | null>(null);
  const [changeNotes, setChangeNotes] = useState<string>("");
  const [submittingAction, setSubmittingAction] = useState<string | null>(null);
  const [bulkApproving, setBulkApproving] = useState<boolean>(false);

  // Índices de carrossel por post
  const [carouselIndexes, setCarouselIndexes] = useState<Record<string, number>>({});

  // Busca segura de posts via API (Admin SDK) garantindo entrega mesmo para o aprovador
  const fetchPostsViaApi = React.useCallback(async () => {
    try {
      const res = await fetch("/api/concierge/posts");
      if (res.ok) {
        const json = await res.json();
        if (json.posts && Array.isArray(json.posts)) {
          setPosts(json.posts);
          if (json.targetWorkspaceId) setEffectiveWorkspaceId(json.targetWorkspaceId);
          if (typeof json.isApprover === "boolean") setIsApproverRole(json.isApprover);
          setLoading(false);
        }
      }
    } catch (err) {
      console.warn("[ClientApprovalsPage] Falha na busca via API, usando Firestore:", err);
    }
  }, []);

  // Carregar posts em tempo real do workspace correto
  useEffect(() => {
    if (!user || !user.uid) {
      setLoading(false);
      return;
    }

    // Busca imediata e garantida via API
    fetchPostsViaApi();

    try {
      let unsubscribePosts: (() => void) | null = null;
      const userDocRef = doc(db, "users", user.uid);

      const unsubscribeUser = onSnapshot(userDocRef, (userSnap) => {
        const uData = userSnap.data();
        const workspaceId = uData?.linkedWorkspaceId || user.uid;
        const isApprover = Boolean(
          uData?.conciergeRole === "client_approver" ||
          uData?.plan === "client_approver" ||
          uData?.role === "client_approver" ||
          String(uData?.plan || "").toLowerCase() === "client_approver"
        );
        setEffectiveWorkspaceId(workspaceId);
        setIsApproverRole(isApprover);

        if (unsubscribePosts) unsubscribePosts();

        const postsCol = collection(db, "users", workspaceId, "posts");

        unsubscribePosts = onSnapshot(
          postsCol,
          (snapshot) => {
            const loadedPosts: ClientPostItem[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as PostData;
              loadedPosts.push({
                ...data,
                id: docSnap.id,
              });
            });
            loadedPosts.sort((a, b) => {
              const timeA = new Date(a.scheduledAt || a.createdAt || 0).getTime();
              const timeB = new Date(b.scheduledAt || b.createdAt || 0).getTime();
              return timeB - timeA;
            });
            if (loadedPosts.length > 0 || !isApprover) {
              setPosts(loadedPosts);
            }
            setLoading(false);
          },
          (error) => {
            console.warn("Listener do Firestore limitado, usando posts da API:", error);
            // Em caso de restrição do Firestore, a API garante os dados
            fetchPostsViaApi();
          }
        );
      });

      return () => {
        if (typeof unsubscribeUser === "function") unsubscribeUser();
        if (typeof unsubscribePosts === "function") unsubscribePosts();
      };
    } catch (err) {
      console.error("Erro ao conectar listener:", err);
      fetchPostsViaApi();
    }
  }, [user, fetchPostsViaApi]);

  // Contadores por aba
  const pendingPosts = useMemo(() => {
    return posts.filter(
      (p) =>
        (p.status === "pending_approval" ||
          p.approval?.status === "pending" ||
          p.approval?.status === "pending_approval") &&
        p.approval?.status !== "approved" &&
        p.status !== "approved" &&
        p.status !== "scheduled" &&
        p.status !== "published" &&
        p.status !== "changes_requested" &&
        p.approval?.status !== "changes_requested"
    );
  }, [posts]);

  const changesPosts = useMemo(() => {
    return posts.filter(
      (p) =>
        (p.status === "changes_requested" ||
          p.approval?.status === "changes_requested") &&
        p.approval?.status !== "approved" &&
        p.status !== "approved" &&
        p.status !== "scheduled" &&
        p.status !== "published"
    );
  }, [posts]);

  const approvedPosts = useMemo(() => {
    return posts.filter(
      (p) =>
        (p.approval?.status === "approved" ||
          p.status === "approved" ||
          p.status === "scheduled") &&
        p.status !== "published" &&
        p.approval?.status !== "pending" &&
        p.approval?.status !== "pending_approval" &&
        p.approval?.status !== "changes_requested" &&
        p.status !== "changes_requested"
    );
  }, [posts]);

  const publishedPosts = useMemo(() => {
    return posts.filter((p) => p.status === "published");
  }, [posts]);

  // Posts da aba ativa
  const currentTabPosts = useMemo(() => {
    switch (activeTab) {
      case "pending":
        return pendingPosts;
      case "changes":
        return changesPosts;
      case "approved":
        return approvedPosts;
      case "published":
        return publishedPosts;
      default:
        return [];
    }
  }, [activeTab, pendingPosts, changesPosts, approvedPosts, publishedPosts]);

  // Ação de aprovação individual
  const handleApprove = async (post: ClientPostItem) => {
    if (!user?.uid) return;
    const targetWorkspaceId = effectiveWorkspaceId || user.uid;
    setSubmittingAction(`approve-${post.id}`);

    // Atualização otimista imediata para mover para Aprovados & Agendados
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? {
              ...p,
              status: "scheduled",
              approval: {
                ...(p.approval || {}),
                status: "approved",
                reviewedAt: new Date().toISOString(),
                reviewedBy: user.email || user.uid,
              },
            }
          : p
      )
    );

    try {
      await approvePostByClient(targetWorkspaceId, post.id);
      toast({
        title: "Postagem Aprovada!",
        description: "A postagem foi confirmada e movida para Aprovados & Agendados.",
      });
      fetchPostsViaApi();
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao aprovar",
        description: "Não foi possível aprovar a postagem. Tente novamente.",
        variant: "destructive",
      });
      fetchPostsViaApi();
    } finally {
      setSubmittingAction(null);
    }
  };

  // Ação de aprovação em lote
  const handleApproveAll = async () => {
    if (!user?.uid || pendingPosts.length === 0) return;
    const targetWorkspaceId = effectiveWorkspaceId || user.uid;
    setBulkApproving(true);

    const pendingIds = new Set(pendingPosts.map((p) => p.id));
    setPosts((prev) =>
      prev.map((p) =>
        pendingIds.has(p.id)
          ? {
              ...p,
              status: "scheduled",
              approval: {
                ...(p.approval || {}),
                status: "approved",
                reviewedAt: new Date().toISOString(),
                reviewedBy: user.email || user.uid,
              },
            }
          : p
      )
    );

    try {
      for (const post of pendingPosts) {
        await approvePostByClient(targetWorkspaceId, post.id);
      }
      toast({
        title: "Todas as postagens foram aprovadas!",
        description: `${pendingPosts.length} postagens foram confirmadas no seu cronograma.`,
      });
      fetchPostsViaApi();
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro na aprovação em lote",
        description: "Algumas postagens podem não ter sido aprovadas.",
        variant: "destructive",
      });
      fetchPostsViaApi();
    } finally {
      setBulkApproving(false);
    }
  };

  // Enviar solicitação de alteração
  const handleConfirmChanges = async () => {
    if (!user?.uid || !selectedPostForChanges) return;
    const targetWorkspaceId = effectiveWorkspaceId || user.uid;
    if (!changeNotes.trim()) {
      toast({
        title: "Descreva o ajuste",
        description: "Por favor, informe quais alterações você gostaria que fossem feitas.",
        variant: "destructive",
      });
      return;
    }

    setSubmittingAction(`changes-${selectedPostForChanges.id}`);
    try {
      await requestPostChangesByClient(targetWorkspaceId, selectedPostForChanges.id, changeNotes.trim());
      toast({
        title: "Solicitação Enviada",
        description: "Seu feedback foi registrado e o gestor fará as alterações solicitadas.",
      });
      setSelectedPostForChanges(null);
      setChangeNotes("");
      fetchPostsViaApi();
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao enviar solicitação",
        description: "Não foi possível registrar o ajuste. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSubmittingAction(null);
    }
  };

  const handleResubmitPost = async (post: ClientPostItem) => {
    const targetWorkspaceId = effectiveWorkspaceId || user?.uid;
    if (!targetWorkspaceId) return;

    setSubmittingAction(`resubmit-${post.id}`);
    try {
      await resubmitPostByCreator(targetWorkspaceId, post.id);
      toast({
        title: "Post Reenviado com Sucesso!",
        description: "A postagem foi devolvida para a lista de aprovação do cliente.",
      });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? {
                ...p,
                status: "pending_approval",
                approval: {
                  ...(p.approval || { status: "pending" }),
                  status: "pending",
                },
              }
            : p
        )
      );
      fetchPostsViaApi();
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Erro ao reenviar post",
        description: error.message || "Não foi possível reenviar a postagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSubmittingAction(null);
    }
  };

  const handleSaveAiEditedImage = async (newImageUrl: string) => {
    if (!aiEditorState) return;
    const { post, imageIndex } = aiEditorState;
    const targetWorkspaceId = effectiveWorkspaceId || user?.uid;
    if (!targetWorkspaceId) return;

    try {
      await updatePostImageByCreator(targetWorkspaceId, post.id, newImageUrl, imageIndex);
      toast({
        title: "Arte Atualizada!",
        description: "A imagem foi editada com sucesso no editor GPT. Agora você pode reenviar para o cliente quando desejar.",
      });
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== post.id) return p;
          const currentImages = Array.isArray(p.imageUrls) && p.imageUrls.length > 0 ? [...p.imageUrls] : (p.imageUrl ? [p.imageUrl] : []);
          if (currentImages.length > 0 && imageIndex >= 0 && imageIndex < currentImages.length) {
            currentImages[imageIndex] = newImageUrl;
          } else {
            currentImages[0] = newImageUrl;
          }
          return {
            ...p,
            imageUrl: imageIndex === 0 ? newImageUrl : (p.imageUrl || newImageUrl),
            imageUrls: currentImages,
          };
        })
      );
      setAiEditorState(null);
      fetchPostsViaApi();
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Erro ao salvar nova arte",
        description: error.message || "Não foi possível salvar a imagem editada. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const getImages = (post: ClientPostItem): string[] => {
    if (post.imageUrls && post.imageUrls.length > 0) return post.imageUrls;
    if (post.imageUrl) return [post.imageUrl];
    if (post.videoUrl) return [post.videoUrl];
    if (post.mediaFiles && post.mediaFiles.length > 0) {
      return post.mediaFiles.map((m: any) => m.url || m).filter(Boolean);
    }
    return [];
  };

  const nextImage = (postId: string, total: number) => {
    setCarouselIndexes((prev) => ({
      ...prev,
      [postId]: ((prev[postId] || 0) + 1) % total,
    }));
  };

  const prevImage = (postId: string, total: number) => {
    setCarouselIndexes((prev) => ({
      ...prev,
      [postId]: ((prev[postId] || 0) - 1 + total) % total,
    }));
  };

  const formatScheduledDate = (timestamp: Timestamp | any) => {
    try {
      const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString("pt-BR", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Data a definir";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-8">
      {/* Header Executivo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FA6305]/10 text-[#FA6305] border border-[#FA6305]/30">
              <Crown className="w-3.5 h-3.5" />
              NumVapt Concierge
            </span>
            <span className="text-xs text-slate-400">
              {isApproverRole ? "• Portal de Aprovação do Cliente" : "• Painel do Gestor de Conteúdo"}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white font-['Poppins']">
            Central de Aprovações
          </h1>
          {isApproverRole ? (
            <p className="text-sm text-slate-400 mt-1 max-w-2xl font-['Inter']">
              Revise e valide com 1 clique as postagens preparadas pelo seu gestor de marketing antes de serem publicadas nas suas redes sociais.
            </p>
          ) : (
            <p className="text-sm text-slate-400 mt-1 max-w-2xl font-['Inter']">
              Acompanhe em tempo real o que o seu cliente contratante já aprovou ou se solicitou ajustes antes da publicação oficial.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Botão para o Gestor gerenciar o acesso do Cliente Aprovador */}
          {!isApproverRole && (
            <Button
              onClick={() => setIsApproverModalOpen(true)}
              variant="outline"
              className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 text-xs h-10 rounded-lg gap-2"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#FA6305]" />
              <span>{approverData ? "Acesso do Cliente (Ativo)" : "Criar Acesso do Cliente"}</span>
            </Button>
          )}

          {/* Botão de aprovação em lote para pendentes (Exclusivo do Cliente Aprovador) */}
          {activeTab === "pending" && pendingPosts.length > 0 && isApproverRole && (
            <Button
              onClick={handleApproveAll}
              disabled={bulkApproving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 h-10 rounded-lg shadow-sm flex items-center gap-2 transition-all"
            >
              {bulkApproving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCheck className="w-4 h-4" />
              )}
              <span>Aprovar Todos ({pendingPosts.length})</span>
            </Button>
          )}
        </div>
      </div>

      {/* Abas de Navegação */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab("pending")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
            activeTab === "pending"
              ? "bg-[#0083C7] text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          )}
        >
          <Clock className="w-4 h-4" />
          <span>Aguardando Aprovação</span>
          {pendingPosts.length > 0 && (
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-xs font-bold",
                activeTab === "pending"
                  ? "bg-white text-[#0083C7]"
                  : "bg-[#FA6305] text-white"
              )}
            >
              {pendingPosts.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("changes")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
            activeTab === "changes"
              ? "bg-[#0083C7] text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          )}
        >
          <AlertCircle className="w-4 h-4" />
          <span>Em Ajuste</span>
          {changesPosts.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {changesPosts.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("approved")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
            activeTab === "approved"
              ? "bg-[#0083C7] text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          )}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Aprovados & Agendados</span>
          {approvedPosts.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium text-slate-400">
              {approvedPosts.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("published")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
            activeTab === "published"
              ? "bg-[#0083C7] text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          )}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Publicados</span>
          {publishedPosts.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium text-slate-400">
              {publishedPosts.length}
            </span>
          )}
        </button>
      </div>

      {/* Conteúdo Principal */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-[#0083C7] mb-3" />
          <p className="text-sm">Carregando postagens para aprovação...</p>
        </div>
      ) : currentTabPosts.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-12 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-400">
            {activeTab === "pending" ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            ) : activeTab === "changes" ? (
              <AlertCircle className="w-6 h-6 text-amber-400" />
            ) : (
              <Calendar className="w-6 h-6 text-[#0083C7]" />
            )}
          </div>
          <h3 className="text-lg font-bold text-white mb-2">
            {activeTab === "pending"
              ? "Tudo em dia!"
              : activeTab === "changes"
              ? "Nenhum post em ajuste"
              : activeTab === "approved"
              ? "Nenhum post agendado no momento"
              : "Nenhum histórico publicado ainda"}
          </h3>
          <p className="text-sm text-slate-400">
            {activeTab === "pending"
              ? "Você não possui postagens pendentes de aprovação neste momento. Assim que seu gestor criar novos conteúdos, eles aparecerão aqui."
              : activeTab === "changes"
              ? "Não há solicitações de alteração em andamento."
              : "As postagens aprovadas e publicadas serão listadas nesta área."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {currentTabPosts.map((post) => {
            const images = getImages(post);
            const currentImgIndex = carouselIndexes[post.id] || 0;
            const isSingle = images.length <= 1;

            return (
              <div
                key={post.id}
                className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden flex flex-col shadow-sm transition-all hover:border-slate-700"
              >
                {/* Cabeçalho do Card */}
                <div className="p-3 border-b border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-[#0083C7]" />
                      <span className="font-medium text-slate-200 text-xs">
                        {formatScheduledDate(post.scheduledAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {post.platforms?.includes("instagram") && (
                      <Instagram className="w-4 h-4 text-pink-400" />
                    )}
                    {post.platforms?.includes("facebook") && (
                      <Facebook className="w-4 h-4 text-blue-400" />
                    )}
                  </div>
                </div>

                {/* Visualizador de Imagem / Carrossel (aspect-square proporcional à galeria) */}
                <div className="relative w-full aspect-square bg-slate-950 flex items-center justify-center overflow-hidden group">
                  {images.length > 0 ? (
                    <>
                      {isVideoMedia(images[currentImgIndex]) ? (
                        <video
                          src={images[currentImgIndex]}
                          controls
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <img
                          src={images[currentImgIndex]}
                          alt="Arte do post"
                          className="w-full h-full object-contain select-none cursor-pointer transition-transform duration-200 hover:scale-[1.01]"
                          onClick={() => setSelectedImageToView(images[currentImgIndex])}
                        />
                      )}

                      {/* Botão de Expandir / Ver Imagem Completa */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImageToView(images[currentImgIndex]);
                        }}
                        className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10"
                        title="Visualizar imagem completa em tamanho real"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>

                      {/* Botão de Atalho para o Editor GPT se houver ajustes solicitados */}
                      {!isApproverRole && (post.status === "changes_requested" || post.approval?.status === "changes_requested") && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAiEditorState({
                              post,
                              imageUrl: images[currentImgIndex],
                              imageIndex: currentImgIndex,
                            });
                          }}
                          className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-slate-900/90 hover:bg-[#0083C7] text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-md z-10 transition-colors border border-slate-700"
                          title="Abrir no Editor Inteligente GPT"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>Editor GPT</span>
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="text-slate-600 text-xs flex flex-col items-center gap-2">
                      <Sparkles className="w-6 h-6" />
                      <span>Sem imagem anexada</span>
                    </div>
                  )}

                  {/* Controles de Carrossel */}
                  {!isSingle && (
                    <>
                      <button
                        onClick={() => prevImage(post.id, images.length)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors z-10"
                        aria-label="Imagem anterior"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => nextImage(post.id, images.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors z-10"
                        aria-label="Próxima imagem"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-black/60 text-[11px] font-semibold text-white z-10">
                        {currentImgIndex + 1} / {images.length}
                      </div>
                    </>
                  )}
                </div>

                {/* Conteúdo / Legenda com roll vertical (sem expandir no hover) */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Legenda do Post
                    </p>
                    <div className="h-20 max-h-20 overflow-y-auto pr-1 text-xs text-slate-200 whitespace-pre-line leading-relaxed scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                      {post.text || "Sem legenda informada."}
                    </div>
                  </div>

                  {/* Alerta de solicitação de ajuste anterior */}
                  {post.approval?.reviewNotes && (
                    <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2.5 text-xs text-amber-200">
                      <p className="font-semibold flex items-center gap-1.5 mb-1 text-amber-400 text-[11px]">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Ajuste Solicitado ao Gestor:
                      </p>
                      <div className="max-h-16 overflow-y-auto pr-1 italic text-[11px] leading-snug scrollbar-thin scrollbar-thumb-amber-600/50">
                        {post.approval.reviewNotes}
                      </div>
                    </div>
                  )}

                  {/* Ações do Card */}
                  <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                    {post.status === "pending_approval" || post.approval?.status === "pending" ? (
                      isApproverRole ? (
                        <>
                          <Button
                            onClick={() => handleApprove(post)}
                            disabled={submittingAction === `approve-${post.id}`}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs h-9 rounded-lg gap-1.5"
                          >
                            {submittingAction === `approve-${post.id}` ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            <span>Aprovar Post</span>
                          </Button>

                          <Button
                            onClick={() => {
                              setSelectedPostForChanges(post);
                              setChangeNotes(post.approval?.reviewNotes || "");
                            }}
                            disabled={submittingAction === `approve-${post.id}`}
                            variant="outline"
                            className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs h-9 rounded-lg gap-1.5"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-[#FA6305]" />
                            <span>Pedir Ajuste</span>
                          </Button>
                        </>
                      ) : (
                        <div className="w-full py-2.5 px-3 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-medium flex items-center justify-between">
                          <span className="flex items-center gap-1.5 font-semibold">
                            <Clock className="w-3.5 h-3.5 text-sky-400" />
                            Aguardando Aprovação do Cliente
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Ação exclusiva do cliente
                          </span>
                        </div>
                      )
                    ) : post.status === "changes_requested" || post.approval?.status === "changes_requested" ? (
                      isApproverRole ? (
                        <div className="w-full py-2 px-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium text-center">
                          ⏳ Aguardando revisão do Gestor
                        </div>
                      ) : (
                        <div className="w-full flex flex-col gap-2">
                          <div className="w-full py-1.5 px-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium flex items-center justify-between">
                            <span className="flex items-center gap-1.5 font-semibold">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                              Ajustes Solicitados pelo Cliente
                            </span>
                            <span className="text-[10px] text-amber-300">Ação necessária</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              onClick={() => {
                                const currentImages = getImages(post);
                                const idx = carouselIndexes[post.id] || 0;
                                const targetUrl = currentImages[idx] || post.imageUrl || "";
                                setAiEditorState({
                                  post,
                                  imageUrl: targetUrl,
                                  imageIndex: idx,
                                });
                              }}
                              className="flex-1 bg-[#0083C7] hover:bg-[#0070a8] text-white font-medium text-xs h-9 rounded-lg gap-1.5 shadow-sm"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                              <span>Editar no Editor GPT</span>
                            </Button>
                            <Button
                              onClick={() => handleResubmitPost(post)}
                              disabled={submittingAction === `resubmit-${post.id}`}
                              className="bg-[#FA6305] hover:bg-[#e05804] text-white font-medium text-xs h-9 rounded-lg gap-1.5 shadow-sm"
                            >
                              {submittingAction === `resubmit-${post.id}` ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Send className="w-3.5 h-3.5" />
                              )}
                              <span>Reenviar ao Cliente</span>
                            </Button>
                          </div>
                        </div>
                      )
                    ) : post.status === "scheduled" || post.status === "approved" || post.approval?.status === "approved" ? (
                      <div className="w-full py-2 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium text-center flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Aprovado e Agendado</span>
                      </div>
                    ) : (
                      <div className="w-full py-2 px-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-medium text-center">
                        ✓ Publicado com Sucesso
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Solicitação de Ajustes */}
      <Dialog
        open={!!selectedPostForChanges}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPostForChanges(null);
            setChangeNotes("");
          }
        }}
      >
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#FA6305]" />
              Solicitar Ajuste ao Gestor
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Escreva o que você gostaria de mudar na arte, na legenda ou no horário antes de aprovar este post.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-3">
            <Textarea
              value={changeNotes}
              onChange={(e) => setChangeNotes(e.target.value)}
              placeholder="Exemplo: Por favor, altere o valor para R$ 99 na arte e inclua o telefone na legenda..."
              className="min-h-[120px] bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500 text-sm focus:border-[#FA6305]"
            />
          </div>

          <DialogFooter className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedPostForChanges(null);
                setChangeNotes("");
              }}
              className="text-slate-400 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmChanges}
              disabled={submittingAction?.startsWith("changes-")}
              className="bg-[#FA6305] hover:bg-[#e05804] text-white font-medium gap-1.5"
            >
              {submittingAction?.startsWith("changes-") ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>Enviar Pedido de Ajuste</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Gerenciamento do Acesso do Cliente Aprovador */}
      <Dialog open={isApproverModalOpen} onOpenChange={setIsApproverModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#FA6305]" />
              Acesso Exclusivo do Cliente Aprovador
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Cadastre ou atualize os dados de login para que o dono da empresa acesse apenas a Central de Aprovações.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Nome do Cliente</Label>
              <Input
                value={approverForm.name}
                onChange={(e) => setApproverForm({ ...approverForm, name: e.target.value })}
                placeholder="Ex: Carlos Silva"
                className="bg-slate-950 border-slate-700 text-sm text-slate-100 placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">E-mail de Login do Cliente</Label>
              <Input
                type="email"
                value={approverForm.email}
                onChange={(e) => setApproverForm({ ...approverForm, email: e.target.value })}
                placeholder="cliente@empresa.com.br"
                className="bg-slate-950 border-slate-700 text-sm text-slate-100 placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Senha de Acesso</Label>
              <Input
                type="password"
                value={approverForm.password}
                onChange={(e) => setApproverForm({ ...approverForm, password: e.target.value })}
                placeholder="Defina uma senha (mínimo 6 dígitos)"
                className="bg-slate-950 border-slate-700 text-sm text-slate-100 placeholder:text-slate-500"
              />
            </div>

            {approverData && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-300 space-y-2">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Acesso Ativo no Sistema</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  E-mail atual: <strong className="text-white">{approverData.approverEmail}</strong>
                </p>
                <Button
                  type="button"
                  onClick={handleCopyWhatsappText}
                  variant="outline"
                  className="w-full text-xs h-8 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 gap-1.5 mt-1"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? "Copiado!" : "Copiar Dados para WhatsApp"}</span>
                </Button>
              </div>
            )}
          </div>

          <DialogFooter className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => setIsApproverModalOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              Fechar
            </Button>
            <Button
              onClick={handleSaveApprover}
              disabled={savingApprover}
              className="bg-[#FA6305] hover:bg-[#e05804] text-white font-medium gap-1.5"
            >
              {savingApprover ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Key className="w-4 h-4" />
              )}
              <span>{approverData ? "Atualizar Acesso" : "Criar Acesso"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Visualização da Imagem/Vídeo em Tela Cheia */}
      <Dialog open={!!selectedImageToView} onOpenChange={(open) => !open && setSelectedImageToView(null)}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden bg-transparent border-none shadow-2xl">
          <DialogTitle className="sr-only">Visualizar Imagem Completa</DialogTitle>
          <DialogDescription className="sr-only">
            Visualização em alta resolução da mídia completa com todos os textos e títulos.
          </DialogDescription>
          {selectedImageToView && (
            <div className="relative w-full h-[88vh] flex items-center justify-center bg-black/95 rounded-xl backdrop-blur-md overflow-hidden p-4">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4 z-50 h-10 w-10 rounded-full bg-black/60 text-white hover:bg-black/80"
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
                <img
                  src={selectedImageToView}
                  alt="Arte completa em alta resolução"
                  className="max-h-full max-w-full object-contain rounded-md shadow-2xl"
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal do Editor Inteligente de Imagens com GPT */}
      {aiEditorState && (
        <ImageAiEditorModal
          isOpen={!!aiEditorState}
          onClose={() => setAiEditorState(null)}
          imageUrl={aiEditorState.imageUrl}
          format="portrait"
          title={
            aiEditorState.post.approval?.reviewNotes
              ? `Ajustar Arte - "${aiEditorState.post.approval.reviewNotes}"`
              : "Editor Inteligente de Imagens GPT"
          }
          onSuccess={(newImageUrl) => handleSaveAiEditedImage(newImageUrl)}
        />
      )}
    </div>
  );
}
