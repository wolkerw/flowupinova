"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  Instagram,
  Facebook,
  Linkedin,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Calendar as CalendarIcon,
  Clock,
  Video,
  Layers,
  Image as ImageIcon,
  MessageSquare,
  Copy,
  ArrowRight,
  Flame,
  Rocket,
  Award,
  MapPin,
  Wand2,
  Trash2,
  ExternalLink,
  Eye,
  Heart,
  Bookmark,
  Send,
  Share2,
  Check,
  Loader2,
  ListChecks,
  Target,
  Zap,
} from "lucide-react";
import {
  getInstagramConnection,
  type InstagramConnectionData,
} from "@/lib/services/instagram-service";
import { getMetaConnection, type MetaConnectionData } from "@/lib/services/meta-service";
import {
  getLinkedInConnection,
  type LinkedInConnectionData,
} from "@/lib/services/linkedin-service";
import {
  getLatestSocialAudit,
  getSocialCampaigns,
  updateCampaignPostItemStatus,
  deleteSocialCampaign,
} from "@/lib/services/social-media-campaign-service";
import {
  type SocialMediaAuditReport,
  type SocialMediaCampaign,
  type CampaignPostItem,
  type CampaignObjective,
  type CampaignFrequency,
  type CampaignItemStatus,
  CAMPAIGN_OBJECTIVE_LABELS,
  CAMPAIGN_FORMAT_LABELS,
  FUNNEL_STAGE_LABELS,
} from "@/lib/types/social-media";
import { cn } from "@/lib/utils";

const ALL_WEEK_DAYS = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo",
];

const DEFAULT_DAYS_BY_FREQ: Record<CampaignFrequency, string[]> = {
  2: ["Terça-feira", "Quinta-feira"],
  3: ["Terça-feira", "Quinta-feira", "Sábado"],
  5: ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira"],
};

function getReadySpokenScript(item: CampaignPostItem, brandName: string = "NumVapt"): string {
  const currentBody = item.reelsScript?.body?.trim() || "";
  const isInstructionOnly =
    /^(mostre|apresente|explique|destaque|fa[çc]a|grave|demonstre|compartilhe)\s+/i.test(currentBody) ||
    currentBody.length < 130;

  if (!isInstructionOnly && currentBody.includes("\n")) {
    return currentBody;
  }

  const title = item.title || "";
  const brand = brandName || "NumVapt";

  if (/segredo|dica|erro|motivo|passo/i.test(title)) {
    return `Se você ainda perde horas tentando resolver tudo no braço, você está jogando tempo e dinheiro fora.\n\nPresta atenção nesses 3 pontos essenciais que quase ninguém te conta:\n\n1️⃣ Primeiro: você não precisa começar do zero todos os dias. Ter uma estrutura inteligente te economiza horas de esforço e garante um padrão profissional.\n\n2️⃣ Segundo: o que atrai clientes de verdade é a constância com a mensagem certa, e não tentar inventar a roda a cada postagem.\n\n3️⃣ E terceiro: quem atende rápido e direciona o cliente no momento certo fecha muito mais negócios.\n\nCom a ${brand}, você tem essa estrutura pronta e validada para acelerar os seus resultados todos os dias.`;
  }

  if (/como escolher|passo a passo|guia/i.test(title)) {
    return `Na hora de escolher a melhor solução para o seu negócio, muita gente comete o erro de olhar só para o preço e esquece da praticidade no dia a dia.\n\nSe você quer acertar de primeira, olha esse passo a passo rápido:\n\n1️⃣ Passo um: escolha ferramentas que simplifiquem a sua rotina em vez de adicionar mais trabalho complexo.\n\n2️⃣ Passo dois: garanta uma comunicação padronizada que transmita autoridade e confiança imediata para quem chega.\n\n3️⃣ Passo três: tenha processos automáticos para transformar seguidores em oportunidades reais de venda.\n\nÉ exatamente assim que nós na ${brand} ajudamos você a crescer com solidez.`;
  }

  return `Você já reparou por que os negócios que mais crescem parecem ter tudo organizado e profissional o tempo todo?\n\nNão é mágica, é método. Enquanto a maioria perde tempo com tarefas repetitivas, quem tem visão adota soluções inteligentes.\n\nNa ${brand}, nós entregamos o caminho mais rápido para você se destacar no mercado, manter uma presença impecável e atrair quem realmente valoriza o seu trabalho.\n\nO resultado? Mais autoridade, mais clientes e muito mais tempo livre para cuidar do que realmente importa no seu negócio.`;
}

export default function SocialMediaOrchestratorPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  // Conexões
  const [igConnection, setIgConnection] = useState<InstagramConnectionData | null>(null);
  const [metaConnection, setMetaConnection] = useState<MetaConnectionData | null>(null);
  const [linkedinConnection, setLinkedinConnection] = useState<LinkedInConnectionData | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Auditoria & Campanhas
  const [auditReport, setAuditReport] = useState<SocialMediaAuditReport | null>(null);
  const [campaigns, setCampaigns] = useState<SocialMediaCampaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  // Estados de Ação IA
  const [isAuditing, setIsAuditing] = useState(false);
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("audit");

  // Formulário do Orquestrador
  const [objective, setObjective] = useState<CampaignObjective>("engagement");
  const [frequencyPerWeek, setFrequencyPerWeek] = useState<CampaignFrequency>(3);
  const [durationWeeks, setDurationWeeks] = useState<number>(2);
  const [preferredDays, setPreferredDays] = useState<string[]>([
    "Terça-feira",
    "Quinta-feira",
    "Sábado",
  ]);
  const [customThemeOrOffer, setCustomThemeOrOffer] = useState<string>("");

  // Filtros do Cronograma e Modal de Kit de Produção
  const [selectedWeekFilter, setSelectedWeekFilter] = useState<string>("all");
  const [activeKitItem, setActiveKitItem] = useState<CampaignPostItem | null>(null);
  const [activeKitTab, setActiveKitTab] = useState<string>("copy");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoadingInitial(true);
    try {
      const [igConn, metaConn, liConn, latestAudit, savedCampaigns] = await Promise.all([
        getInstagramConnection(user.uid),
        getMetaConnection(user.uid),
        getLinkedInConnection(user.uid),
        getLatestSocialAudit(user.uid),
        getSocialCampaigns(user.uid),
      ]);

      setIgConnection(igConn);
      setMetaConnection(metaConn);
      setLinkedinConnection(liConn);
      setAuditReport(latestAudit);
      setCampaigns(savedCampaigns);

      if (savedCampaigns.length > 0) {
        setSelectedCampaignId((prev) => prev || savedCampaigns[0].id);
      }

      if (latestAudit) {
        if (latestAudit.recommendedObjective) {
          setObjective(latestAudit.recommendedObjective);
        }
        if (latestAudit.recommendedFrequency) {
          setFrequencyPerWeek(latestAudit.recommendedFrequency);
        }
        if (
          Array.isArray(latestAudit.metrics?.bestDaysToPost) &&
          latestAudit.metrics.bestDaysToPost.length >= 2
        ) {
          const targetFreq = latestAudit.recommendedFrequency || 3;
          const baseDays = latestAudit.metrics.bestDaysToPost.slice(0, targetFreq);
          if (baseDays.length === targetFreq) {
            setPreferredDays(baseDays);
          }
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados do Social Media:", error);
    } finally {
      setLoadingInitial(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
    const handleRefresh = () => {
      loadData();
    };
    window.addEventListener("focus", handleRefresh);
    window.addEventListener("pageshow", handleRefresh);
    return () => {
      window.removeEventListener("focus", handleRefresh);
      window.removeEventListener("pageshow", handleRefresh);
    };
  }, [loadData]);

  const hasSocialConnected = Boolean(igConnection?.isConnected || metaConnection?.isConnected);

  const selectedCampaign = useMemo(() => {
    if (!campaigns.length) return null;
    return campaigns.find((c) => c.id === selectedCampaignId) || campaigns[0];
  }, [campaigns, selectedCampaignId]);

  const handleFrequencyChange = (freq: CampaignFrequency) => {
    setFrequencyPerWeek(freq);
    setPreferredDays(DEFAULT_DAYS_BY_FREQ[freq]);
  };

  const togglePreferredDay = (day: string) => {
    setPreferredDays((prev) => {
      if (prev.includes(day)) {
        if (prev.length <= 1) return prev;
        return prev.filter((d) => d !== day);
      }
      if (prev.length >= frequencyPerWeek) {
        return [...prev.slice(1), day];
      }
      return [...prev, day];
    });
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast({
      title: "Copiado para a área de transferência!",
      description: `${label} copiado com sucesso.`,
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleRunAudit = async () => {
    if (!user) return;
    setIsAuditing(true);
    try {
      const token = await user.getIdToken().catch(() => null);
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/social-media/audit", {
        method: "POST",
        headers,
        body: JSON.stringify({ userId: user.uid }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Não foi possível concluir a auditoria via API.");
      }

      setAuditReport(data.report);
      if (data.report?.recommendedObjective) {
        setObjective(data.report.recommendedObjective);
      }
      if (data.report?.recommendedFrequency) {
        setFrequencyPerWeek(data.report.recommendedFrequency);
        setPreferredDays(
          DEFAULT_DAYS_BY_FREQ[data.report.recommendedFrequency as CampaignFrequency] ||
            DEFAULT_DAYS_BY_FREQ[3]
        );
      }

      toast({
        title: "Diagnóstico concluído via API! ✨",
        description: `Analisamos ${data.report?.metrics?.totalAnalyzedPosts || 0} publicações do perfil ${data.report?.username || ""}.`,
      });
      setActiveTab("audit");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Atenção na Auditoria",
        description: error.message,
      });
    } finally {
      setIsAuditing(false);
    }
  };

  const handleOrchestrateCampaign = async () => {
    if (!user) return;
    setIsOrchestrating(true);
    try {
      const token = await user.getIdToken().catch(() => null);
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/social-media/orchestrate", {
        method: "POST",
        headers,
        body: JSON.stringify({
          userId: user.uid,
          objective,
          frequencyPerWeek,
          durationWeeks,
          preferredDays,
          customThemeOrOffer,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Falha ao orquestrar a campanha.");
      }

      const newCampaign: SocialMediaCampaign = data.campaign;
      setCampaigns((prev) => [newCampaign, ...prev]);
      setSelectedCampaignId(newCampaign.id);
      setSelectedWeekFilter("all");
      setActiveTab("campaign");

      toast({
        title: "Campanha Orquestrada com Sucesso! 🚀",
        description: `${newCampaign.posts.length} publicações planejadas com roteiros de Reels, Carrosséis, Stories e Direct.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao criar campanha",
        description: error.message,
      });
    } finally {
      setIsOrchestrating(false);
    }
  };

  const handleStatusChange = async (item: CampaignPostItem, newStatus: CampaignItemStatus) => {
    if (!user || !selectedCampaign) return;
    const updated = await updateCampaignPostItemStatus(
      user.uid,
      selectedCampaign.id,
      item.id,
      newStatus
    );
    if (updated) {
      setCampaigns((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      if (activeKitItem?.id === item.id) {
        setActiveKitItem({ ...item, status: newStatus });
      }
      toast({
        title: "Status atualizado",
        description: `"${item.title}" marcado como ${
          newStatus === "published"
            ? "Publicado"
            : newStatus === "scheduled"
              ? "Agendado"
              : newStatus === "in_production"
                ? "Em Produção"
                : "Pendente"
        }.`,
      });
    }
  };

  const handleOpenKitModal = (item: CampaignPostItem) => {
    setActiveKitTab(item.format === "reels_organic" ? "reels" : "copy");
    setActiveKitItem(item);
  };

  const handleScheduleOrganicVideo = (item: CampaignPostItem) => {
    const fullCaption = `${item.caption.trim()}${
      Array.isArray(item.hashtags) && item.hashtags.length > 0
        ? `\n\n${item.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}`
        : ""
    }`;
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "preloaded_gallery_image",
        JSON.stringify({
          caption: fullCaption,
          type: "reels",
          isReels: true,
          scheduledDate:
            item.scheduledDate && item.suggestedTime
              ? `${item.scheduledDate}T${item.suggestedTime}`
              : undefined,
          campaignId: selectedCampaign?.id,
          campaignItemId: item.id,
        })
      );
    }
    router.push("/dashboard/posts/criar?from_campaign_video=true");
  };

  const handleSendToPostWizard = (item: CampaignPostItem) => {
    if (!selectedCampaign) return;
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "social_campaign_draft",
        JSON.stringify({
          campaignId: selectedCampaign.id,
          campaignName: selectedCampaign.name,
          campaignObjective: selectedCampaign.objective,
          item,
        })
      );
    }
    router.push(
      `/dashboard/imagens/gerar?fromCampaign=1&campaignId=${encodeURIComponent(
        selectedCampaign.id
      )}&itemId=${encodeURIComponent(item.id)}`
    );
  };

  const handleScheduleExistingArt = (item: CampaignPostItem) => {
    if (!selectedCampaign || !item.generatedImageUrl) {
      handleSendToPostWizard(item);
      return;
    }
    const fullCaption = `${item.caption.trim()}${
      Array.isArray(item.hashtags) && item.hashtags.length > 0
        ? `\n\n${item.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}`
        : ""
    }`;
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "preloaded_gallery_image",
        JSON.stringify({
          url: item.generatedImageUrl,
          prompt: item.aiImagePrompt || item.title,
          caption: fullCaption,
          type: "image",
          hasPrintedLogo: true,
          skipAutoLogo: true,
          scheduledDate:
            item.scheduledDate && item.suggestedTime
              ? `${item.scheduledDate}T${item.suggestedTime}`
              : undefined,
          campaignId: selectedCampaign.id,
          campaignItemId: item.id,
        })
      );
    }
    router.push("/dashboard/posts/criar?from_gallery=true");
  };

  const handleDeleteCurrentCampaign = async () => {
    if (!user || !selectedCampaign) return;
    const ok = await deleteSocialCampaign(user.uid, selectedCampaign.id);
    if (ok) {
      const remaining = campaigns.filter((c) => c.id !== selectedCampaign.id);
      setCampaigns(remaining);
      setSelectedCampaignId(remaining[0]?.id || null);
      toast({
        title: "Campanha removida",
        description: "O cronograma foi excluído com sucesso.",
      });
    }
  };

  const campaignProgress = useMemo(() => {
    if (!selectedCampaign || !selectedCampaign.posts.length) {
      return { done: 0, artsCreated: 0, total: 0, pct: 0 };
    }
    const total = selectedCampaign.posts.length;
    const done = selectedCampaign.posts.filter(
      (p) => p.status === "scheduled" || p.status === "published"
    ).length;
    const artsCreated = selectedCampaign.posts.filter(
      (p) =>
        Boolean(p.generatedImageUrl) ||
        p.status === "in_production" ||
        p.status === "scheduled" ||
        p.status === "published"
    ).length;
    return {
      done,
      artsCreated,
      total,
      pct: Math.round((artsCreated / total) * 100),
    };
  }, [selectedCampaign]);

  const filteredPosts = useMemo(() => {
    if (!selectedCampaign) return [];
    if (selectedWeekFilter === "all") return selectedCampaign.posts;
    const weekNum = Number(selectedWeekFilter);
    return selectedCampaign.posts.filter((p) => p.weekNumber === weekNum);
  }, [selectedCampaign, selectedWeekFilter]);

  const availableWeeks = useMemo(() => {
    if (!selectedCampaign) return [];
    const weeks = new Set<number>();
    selectedCampaign.posts.forEach((p) => weeks.add(p.weekNumber));
    return Array.from(weeks).sort((a, b) => a - b);
  }, [selectedCampaign]);

  if (loadingInitial) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium text-slate-600">
          Carregando inteligência das suas redes sociais...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-8">
      {/* Cabeçalho Estratégico */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 text-white shadow-lg md:flex-row md:items-center">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border-amber-400/30">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              IA Estrategista & Copywriter Sênior
            </Badge>
            {igConnection?.isConnected && (
              <Badge className="bg-pink-500/20 text-pink-200 border-pink-400/30">
                <Instagram className="mr-1 h-3 w-3" />
                {igConnection.instagramUsername
                  ? `@${igConnection.instagramUsername.replace(/^@/, "")}`
                  : "Instagram Conectado"}
              </Badge>
            )}
            {metaConnection?.isConnected && (
              <Badge className="bg-blue-500/20 text-blue-200 border-blue-400/30">
                <Facebook className="mr-1 h-3 w-3" />
                {metaConnection.pageName || "Facebook Conectado"}
              </Badge>
            )}
            {linkedinConnection?.isConnected && (
              <Badge className="bg-sky-500/20 text-sky-200 border-sky-400/30">
                <Linkedin className="mr-1 h-3 w-3" />
                LinkedIn Ativo
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Social Media • Orquestrador de Campanhas
          </h1>
          <p className="max-w-2xl text-sm text-slate-300">
            Auditoria 100% automática via API oficial (sem envio de prints), diagnóstico de
            engajamento e planejamento completo de Posts IA, Reels, Carrosséis, Stories e Direct.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={handleRunAudit}
            disabled={isAuditing || !hasSocialConnected}
            variant="secondary"
            className="bg-white/10 text-white hover:bg-white/20 border border-white/20"
          >
            {isAuditing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analisando via API...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                {auditReport ? "Atualizar Auditoria API" : "Auditar Meu Instagram"}
              </>
            )}
          </Button>
          <Button
            onClick={() => setActiveTab("orchestrator")}
            className="bg-gradient-to-r from-pink-600 to-orange-500 text-white hover:from-pink-700 hover:to-orange-600 shadow-md"
          >
            <Wand2 className="mr-2 h-4 w-4" />
            Nova Campanha IA
          </Button>
        </div>
      </div>

      {/* Alerta caso nenhuma conta esteja conectada via API */}
      {!hasSocialConnected && (
        <Card className="border-amber-300 bg-amber-50/80">
          <CardContent className="flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-950">
                  Conecte seu Instagram ou Facebook para ativar a leitura automática via API
                </h3>
                <p className="mt-1 text-sm text-amber-800">
                  Para que a IA analise suas métricas reais, melhores horários, bio e formatos sem
                  precisar enviar prints, conecte sua conta na central de Posts.
                </p>
              </div>
            </div>
            <Button asChild className="shrink-0 bg-amber-600 text-white hover:bg-amber-700">
              <Link href="/dashboard/posts">
                Conectar Redes Sociais
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Abas Principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-1 gap-2 bg-slate-100 p-1.5 sm:grid-cols-3 h-auto rounded-xl">
          <TabsTrigger
            value="audit"
            className="flex items-center justify-center gap-2 py-2.5 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-xs rounded-lg"
          >
            <TrendingUp className="h-4 w-4 text-pink-600" />
            1. Diagnóstico do Perfil (API)
            {auditReport && (
              <Badge variant="secondary" className="ml-1 bg-pink-100 text-pink-700">
                Score {auditReport.overallScore}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="orchestrator"
            className="flex items-center justify-center gap-2 py-2.5 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-xs rounded-lg"
          >
            <Wand2 className="h-4 w-4 text-indigo-600" />
            2. Orquestrar Campanha
          </TabsTrigger>
          <TabsTrigger
            value="campaign"
            className="flex items-center justify-center gap-2 py-2.5 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-xs rounded-lg"
          >
            <CalendarIcon className="h-4 w-4 text-emerald-600" />
            3. Cronograma & Kits de Posts
            {selectedCampaign && (
              <Badge variant="secondary" className="ml-1 bg-emerald-100 text-emerald-700">
                {selectedCampaign.posts.length} posts
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* =====================================================================
            ABA 1: DIAGNÓSTICO E AUDITORIA AUTOMÁTICA VIA API
           ===================================================================== */}
        <TabsContent value="audit" className="space-y-6">
          {!auditReport ? (
            <Card className="border-dashed border-2 border-slate-300 bg-white">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-pink-50 text-pink-600">
                  <Instagram className="h-8 w-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  Pronto para auditar seu Instagram via API Oficial
                </h2>
                <p className="mt-2 max-w-lg text-sm text-slate-600">
                  Nossa IA vai ler automaticamente suas últimas publicações, calcular sua frequência
                  atual, descobrir quais formatos geram mais salvamentos e propor melhorias para sua
                  Bio e linha editorial.
                </p>
                <Button
                  size="lg"
                  onClick={handleRunAudit}
                  disabled={isAuditing || !hasSocialConnected}
                  className="mt-6 bg-gradient-to-r from-pink-600 to-orange-500 text-white hover:from-pink-700 hover:to-orange-600"
                >
                  {isAuditing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Lendo métricas e legendas na API...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Executar Diagnóstico Agora
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Score + Resumo Executivo */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Card className="border-slate-200 bg-white shadow-xs">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Saúde & Engajamento do Perfil
                    </CardDescription>
                    <CardTitle className="flex items-center justify-between text-lg">
                      <span>{auditReport.username}</span>
                      <Badge
                        className={cn(
                          "font-semibold",
                          auditReport.overallScore >= 75
                            ? "bg-emerald-100 text-emerald-700"
                            : auditReport.overallScore >= 50
                              ? "bg-amber-100 text-amber-700"
                              : "bg-rose-100 text-rose-700"
                        )}
                      >
                        {auditReport.scoreClassification}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-baseline gap-3">
                      <span className="text-5xl font-extrabold text-slate-900">
                        {auditReport.overallScore}
                      </span>
                      <span className="text-sm font-medium text-slate-500">/ 100 pontos</span>
                    </div>
                    <Progress value={auditReport.overallScore} className="h-2.5" />
                    <p className="text-xs text-slate-500">
                      Baseado em {auditReport.metrics.totalAnalyzedPosts} publicações sincronizadas
                      diretamente via API.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 bg-white shadow-xs lg:col-span-2">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                      Parecer Executivo do Estrategista IA
                    </CardDescription>
                    <CardTitle className="text-lg">
                      Diagnóstico de Posicionamento e Algoritmo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm leading-relaxed text-slate-700">
                      {auditReport.executiveSummary}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700 border border-slate-200">
                        <span className="font-semibold text-slate-900">Constância Sugerida:</span>{" "}
                        {auditReport.recommendedFrequency}x por semana
                      </div>
                      <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700 border border-slate-200">
                        <span className="font-semibold text-slate-900">Foco Recomendado:</span>{" "}
                        {CAMPAIGN_OBJECTIVE_LABELS[auditReport.recommendedObjective]?.label}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setActiveTab("orchestrator")}
                        className="ml-auto bg-indigo-600 text-white hover:bg-indigo-700"
                      >
                        Montar Campanha Recomendada
                        <ArrowRight className="ml-1.5 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 4 KPIs Reais da API */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-slate-200 bg-white">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase text-slate-500">
                        Frequência Atual
                      </span>
                      <CalendarIcon className="h-4 w-4 text-pink-600" />
                    </div>
                    <div className="mt-2 text-2xl font-bold text-slate-900">
                      {auditReport.metrics.postsPerWeekLast30Days} posts / sem
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Maior hiato recente: {auditReport.metrics.longestGapDays} dias
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 bg-white">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase text-slate-500">
                        Engajamento Médio
                      </span>
                      <Zap className="h-4 w-4 text-amber-500" />
                    </div>
                    <div className="mt-2 text-2xl font-bold text-slate-900">
                      {auditReport.metrics.avgEngagementRate}%
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Média: {auditReport.metrics.avgLikes} curtidas •{" "}
                      {auditReport.metrics.avgComments} coment. • {auditReport.metrics.avgSaved}{" "}
                      salvos
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 bg-white">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase text-slate-500">
                        Formato Campeão
                      </span>
                      <Video className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div className="mt-2 text-2xl font-bold text-slate-900">
                      {auditReport.metrics.bestPerformingFormat}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Mix: {auditReport.metrics.formatBreakdown.video} Vídeos •{" "}
                      {auditReport.metrics.formatBreakdown.carousel} Carrosséis •{" "}
                      {auditReport.metrics.formatBreakdown.image} Fotos
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 bg-white">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase text-slate-500">
                        Melhores Janelas
                      </span>
                      <Clock className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="mt-2 text-lg font-bold text-slate-900 truncate">
                      {auditReport.metrics.bestDaysToPost.slice(0, 2).join(" & ")}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Horários pico: {auditReport.metrics.bestHoursToPost.join(" e ")}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Otimização de Biografia + Pontos Fortes e Gargalos */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card className="border-slate-200 bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Sparkles className="h-4 w-4 text-pink-600" />
                      Auditoria e Otimização da Biografia (Bio)
                    </CardTitle>
                    <CardDescription>{auditReport.bioAnalysis.currentStatus}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                      <span className="text-[11px] font-semibold uppercase text-slate-400">
                        Bio Atual Lida via API
                      </span>
                      <p className="mt-1 whitespace-pre-line text-xs text-slate-600">
                        {auditReport.biography || "Nenhuma biografia detectada na conta."}
                      </p>
                    </div>

                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-emerald-800">
                          Nova Bio Magnética Sugerida pela IA
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-emerald-700 hover:bg-emerald-100"
                          onClick={() =>
                            handleCopyText(
                              `${auditReport.bioAnalysis.suggestedBio}\n${auditReport.bioAnalysis.suggestedCta}`,
                              "Sugestão de Bio"
                            )
                          }
                        >
                          {copiedField === "Sugestão de Bio" ? (
                            <Check className="mr-1 h-3.5 w-3.5" />
                          ) : (
                            <Copy className="mr-1 h-3.5 w-3.5" />
                          )}
                          Copiar Bio
                        </Button>
                      </div>
                      <p className="mt-2 whitespace-pre-line text-sm font-medium text-slate-800">
                        {auditReport.bioAnalysis.suggestedBio}
                      </p>
                      <p className="mt-2 text-xs font-semibold text-emerald-700">
                        {auditReport.bioAnalysis.suggestedCta}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Target className="h-4 w-4 text-indigo-600" />
                      Pontos Fortes vs. Gargalos de Engajamento
                    </CardTitle>
                    <CardDescription>
                      O que a análise dos seus últimos posts revelou
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <span className="text-xs font-bold uppercase text-emerald-700">
                        Pontos Fortes Atuais
                      </span>
                      {auditReport.strengths.map((str, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2.5 rounded-lg bg-emerald-50/60 p-2.5 text-xs text-slate-700"
                        >
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          <span>{str}</span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2 pt-2">
                      <span className="text-xs font-bold uppercase text-rose-700">
                        Gargalos que Travam seu Alcance
                      </span>
                      {auditReport.bottlenecks.map((bot, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2.5 rounded-lg bg-rose-50/60 p-2.5 text-xs text-slate-700"
                        >
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                          <span>{bot}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recomendações Estratégicas */}
              <Card className="border-slate-200 bg-white">
                <CardHeader>
                  <CardTitle className="text-base">
                    Plano de Ação Recomendado para as Próximas Semanas
                  </CardTitle>
                  <CardDescription>
                    Melhorias diretas que nosso Orquestrador aplicará na sua campanha
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {auditReport.strategicRecommendations.map((rec, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col justify-between rounded-xl border border-slate-200 p-4 hover:border-indigo-200 transition-colors"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <Badge variant="outline" className="text-xs">
                              {rec.category}
                            </Badge>
                            <Badge
                              className={
                                rec.impact === "Alto"
                                  ? "bg-indigo-100 text-indigo-700"
                                  : "bg-slate-100 text-slate-700"
                              }
                            >
                              Impacto {rec.impact}
                            </Badge>
                          </div>
                          <h4 className="font-semibold text-slate-900">{rec.title}</h4>
                          <p className="text-xs leading-relaxed text-slate-600">
                            {rec.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Posts Analisados na API */}
              {auditReport.metrics.topPosts.length > 0 && (
                <Card className="border-slate-200 bg-white">
                  <CardHeader>
                    <CardTitle className="text-base">
                      Publicações de Maior Engajamento Lidas na API
                    </CardTitle>
                    <CardDescription>
                      Referências reais do seu perfil que servem de base para os novos roteiros
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {auditReport.metrics.topPosts.map((post) => (
                        <div
                          key={post.id}
                          className="flex flex-col justify-between rounded-xl border border-slate-200 p-3.5 text-xs"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Badge variant="secondary" className="text-[10px]">
                                {post.mediaType}
                              </Badge>
                              {post.permalink && (
                                <a
                                  href={post.permalink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 hover:underline flex items-center gap-1"
                                >
                                  Ver post <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                            <p className="line-clamp-3 text-slate-700">
                              {post.caption || "Sem legenda"}
                            </p>
                          </div>
                          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-slate-500">
                            <span className="flex items-center gap-1">
                              <Heart className="h-3.5 w-3.5 text-rose-500" /> {post.likes}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3.5 w-3.5 text-blue-500" />{" "}
                              {post.comments}
                            </span>
                            <span className="flex items-center gap-1">
                              <Bookmark className="h-3.5 w-3.5 text-amber-500" /> {post.saved}
                            </span>
                            {post.reach > 0 && (
                              <span className="flex items-center gap-1">
                                <Eye className="h-3.5 w-3.5 text-emerald-500" /> {post.reach}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* =====================================================================
            ABA 2: CONFIGURADOR E ORQUESTRADOR DE CAMPANHA IA
           ===================================================================== */}
        <TabsContent value="orchestrator" className="space-y-6">
          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Wand2 className="h-5 w-5 text-indigo-600" />
                Configurar Nova Campanha de Redes Sociais
              </CardTitle>
              <CardDescription>
                Escolha o objetivo e a constância desejada. Nossa IA criará o calendário completo
                com Posts IA, Roteiros de Reels, Carrosséis, Sequências de Stories e Scripts de
                Direct.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Passo 1: Objetivo */}
              <div className="space-y-3">
                <Label className="text-sm font-bold text-slate-900">
                  1. Qual é o objetivo principal desta campanha?
                </Label>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {(
                    [
                      {
                        id: "engagement",
                        icon: Flame,
                        ...CAMPAIGN_OBJECTIVE_LABELS.engagement,
                      },
                      {
                        id: "sales_launch",
                        icon: Rocket,
                        ...CAMPAIGN_OBJECTIVE_LABELS.sales_launch,
                      },
                      {
                        id: "authority",
                        icon: Award,
                        ...CAMPAIGN_OBJECTIVE_LABELS.authority,
                      },
                      {
                        id: "local_social_selling",
                        icon: MapPin,
                        ...CAMPAIGN_OBJECTIVE_LABELS.local_social_selling,
                      },
                    ] as const
                  ).map((item) => {
                    const Icon = item.icon;
                    const isSelected = objective === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setObjective(item.id)}
                        className={cn(
                          "flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all",
                          isSelected
                            ? "border-indigo-600 bg-indigo-50/40 shadow-xs"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        )}
                      >
                        <div
                          className={cn(
                            "rounded-xl p-2.5",
                            isSelected
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-100 text-slate-600"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{item.label}</span>
                            {auditReport?.recommendedObjective === item.id && (
                              <Badge className="bg-amber-100 text-amber-800 text-[10px]">
                                Recomendado pela Auditoria
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-600">{item.subtitle}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Passo 2: Constância e Duração */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <Label className="text-sm font-bold text-slate-900">
                    2. Constância Semanal Pré-determinada
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    {([2, 3, 5] as CampaignFrequency[]).map((freq) => (
                      <button
                        key={freq}
                        type="button"
                        onClick={() => handleFrequencyChange(freq)}
                        className={cn(
                          "flex flex-col items-center justify-center rounded-xl border-2 p-4 text-center transition-all",
                          frequencyPerWeek === freq
                            ? "border-indigo-600 bg-indigo-50/50 text-indigo-950 font-bold"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                        )}
                      >
                        <span className="text-2xl font-extrabold">{freq}x</span>
                        <span className="text-xs text-slate-500">na semana</span>
                        {freq === 3 && (
                          <Badge className="mt-1.5 bg-emerald-100 text-emerald-700 text-[10px]">
                            Ideal
                          </Badge>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-bold text-slate-900">
                    3. Duração do Cronograma
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { weeks: 2, label: "2 Semanas (Sprint Rápido)" },
                      { weeks: 4, label: "4 Semanas (Mês Completo)" },
                    ].map((opt) => (
                      <button
                        key={opt.weeks}
                        type="button"
                        onClick={() => setDurationWeeks(opt.weeks)}
                        className={cn(
                          "flex flex-col items-center justify-center rounded-xl border-2 p-4 text-center transition-all",
                          durationWeeks === opt.weeks
                            ? "border-indigo-600 bg-indigo-50/50 text-indigo-950 font-bold"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                        )}
                      >
                        <span className="text-xl font-extrabold">
                          {opt.weeks * frequencyPerWeek} Posts
                        </span>
                        <span className="text-xs text-slate-500">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Passo 3: Dias da Semana */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-bold text-slate-900">
                    4. Dias Preferenciais de Publicação ({preferredDays.length} de{" "}
                    {frequencyPerWeek} selecionados)
                  </Label>
                  {auditReport?.metrics?.bestDaysToPost && (
                    <span className="text-xs text-emerald-700 font-medium">
                      Melhores dias na sua API: {auditReport.metrics.bestDaysToPost.join(", ")}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {ALL_WEEK_DAYS.map((day) => {
                    const active = preferredDays.includes(day);
                    return (
                      <Button
                        key={day}
                        type="button"
                        variant={active ? "default" : "outline"}
                        size="sm"
                        onClick={() => togglePreferredDay(day)}
                        className={cn(
                          "rounded-full",
                          active
                            ? "bg-indigo-600 text-white hover:bg-indigo-700"
                            : "text-slate-600"
                        )}
                      >
                        {day}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Passo 4: Tema / Oferta específica opcional */}
              <div className="space-y-2">
                <Label htmlFor="customOffer" className="text-sm font-bold text-slate-900">
                  5. Deseja destacar algum produto, serviço, promoção ou tema específico nesta
                  campanha? (Opcional)
                </Label>
                <Textarea
                  id="customOffer"
                  placeholder="Ex: Quero focar no nosso novo serviço X, destacar o atendimento pelo WhatsApp e quebrar a objeção de preço..."
                  value={customThemeOrOffer}
                  onChange={(e) => setCustomThemeOrOffer(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/60 p-6 sm:flex-row">
              <div className="text-xs text-slate-600">
                Serão gerados{" "}
                <strong className="text-slate-900">
                  {frequencyPerWeek * durationWeeks} kits completos de publicação
                </strong>{" "}
                (Reels, Carrosséis, Posts IA, Stories e Scripts de Direct).
              </div>
              <Button
                size="lg"
                onClick={handleOrchestrateCampaign}
                disabled={isOrchestrating}
                className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white hover:opacity-95 shadow-md"
              >
                {isOrchestrating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Orquestrando Campanha Completa com IA...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Gerar Campanha de {frequencyPerWeek * durationWeeks} Publicações
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* =====================================================================
            ABA 3: CRONOGRAMA INTERATIVO & KITS DE PRODUÇÃO
           ===================================================================== */}
        <TabsContent value="campaign" className="space-y-6">
          {!selectedCampaign ? (
            <Card className="border-dashed border-2 border-slate-300 bg-white">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <CalendarIcon className="mb-4 h-12 w-12 text-slate-400" />
                <h3 className="text-lg font-bold text-slate-900">
                  Nenhuma campanha orquestrada ainda
                </h3>
                <p className="mt-1 max-w-md text-sm text-slate-500">
                  Configure sua constância semanal (2x, 3x ou 5x na semana) na aba &ldquo;Orquestrar
                  Campanha&rdquo; para gerar seu calendário completo.
                </p>
                <Button
                  onClick={() => setActiveTab("orchestrator")}
                  className="mt-5 bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  Criar Minha Primeira Campanha
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Barra Superior da Campanha Ativa */}
              <Card className="border-slate-200 bg-white">
                <CardContent className="p-6 space-y-5">
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          className={
                            CAMPAIGN_OBJECTIVE_LABELS[selectedCampaign.objective]?.badgeColor
                          }
                        >
                          {CAMPAIGN_OBJECTIVE_LABELS[selectedCampaign.objective]?.label}
                        </Badge>
                        <Badge variant="outline">
                          Constância: {selectedCampaign.frequencyPerWeek}x / semana
                        </Badge>
                        <Badge variant="outline">
                          {selectedCampaign.durationWeeks} semanas ({selectedCampaign.posts.length}{" "}
                          posts)
                        </Badge>
                      </div>
                      <h2 className="text-xl font-bold text-slate-900">{selectedCampaign.name}</h2>
                      <p className="text-xs text-slate-600">{selectedCampaign.strategySummary}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {campaigns.length > 1 && (
                        <Select
                          value={selectedCampaign.id}
                          onValueChange={(val) => setSelectedCampaignId(val)}
                        >
                          <SelectTrigger className="w-[240px]">
                            <SelectValue placeholder="Trocar campanha" />
                          </SelectTrigger>
                          <SelectContent>
                            {campaigns.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDeleteCurrentCampaign}
                        className="text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="mr-1.5 h-4 w-4" />
                        Excluir
                      </Button>
                    </div>
                  </div>

                  {/* Progresso da Constância */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <ListChecks className="h-4 w-4 text-emerald-600" />
                        Progresso de Execução & Constância da Campanha
                      </span>
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[11px] font-bold">
                          🎨 {campaignProgress.artsCreated} de {campaignProgress.total} artes criadas
                        </Badge>
                        <span className="font-bold text-slate-900">
                          📅 {campaignProgress.done} agendados/publicados ({campaignProgress.pct}%)
                        </span>
                      </div>
                    </div>
                    <Progress value={campaignProgress.pct} className="h-2" />
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[11px] font-semibold text-slate-500">
                        Pilares Editoriais:
                      </span>
                      {selectedCampaign.editorialPillars.map((pilar, i) => (
                        <Badge key={i} variant="secondary" className="text-[11px]">
                          {pilar}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Filtro de Semanas */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant={selectedWeekFilter === "all" ? "default" : "outline"}
                      onClick={() => setSelectedWeekFilter("all")}
                    >
                      Todas as Semanas ({selectedCampaign.posts.length})
                    </Button>
                    {availableWeeks.map((w) => (
                      <Button
                        key={w}
                        size="sm"
                        variant={selectedWeekFilter === String(w) ? "default" : "outline"}
                        onClick={() => setSelectedWeekFilter(String(w))}
                      >
                        Semana {w}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Grid de Publicações da Campanha */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {filteredPosts.map((item) => {
                  const formatMeta =
                    CAMPAIGN_FORMAT_LABELS[item.format] || CAMPAIGN_FORMAT_LABELS.static_ai;
                  const funnelMeta =
                    FUNNEL_STAGE_LABELS[item.funnelStage] || FUNNEL_STAGE_LABELS.top_attraction;
                  const hasCreatedArt =
                    Boolean(item.generatedImageUrl) ||
                    (typeof window !== "undefined" &&
                      Boolean(sessionStorage?.getItem(`campaign_art_generated_${item.id}`))) ||
                    item.status === "in_production" ||
                    item.status === "scheduled" ||
                    item.status === "published";

                  return (
                    <Card
                      key={item.id}
                      className={cn(
                        "flex flex-col justify-between transition-all hover:shadow-md relative overflow-hidden rounded-xl",
                        hasCreatedArt
                          ? "border-2 border-emerald-500 bg-emerald-50/15 shadow-sm shadow-emerald-100 ring-1 ring-emerald-400/30"
                          : "border border-slate-200 bg-white"
                      )}
                    >
                      {hasCreatedArt && (
                        <div className="flex items-center justify-between bg-emerald-600 px-3.5 py-1.5 text-white">
                          <span className="flex items-center gap-1.5 text-[11px] font-bold">
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                            {item.status === "published"
                              ? "Arte Criada & Publicada"
                              : item.status === "scheduled"
                                ? "Arte Criada & Agendada"
                                : "Arte IA Criada"}
                          </span>
                          {item.generatedImageAt && (
                            <span className="text-[10px] font-medium text-emerald-100">
                              {new Date(item.generatedImageAt).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                              })}
                            </span>
                          )}
                        </div>
                      )}

                      <CardHeader className="space-y-3 pb-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                            <CalendarIcon className="h-3.5 w-3.5 text-indigo-600" />
                            <span>
                              {item.dayOfWeekLabel} •{" "}
                              {item.scheduledDate.split("-").reverse().join("/")} às{" "}
                              {item.suggestedTime}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-[10px]">
                            Sem. {item.weekNumber}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge className={cn("text-[11px]", formatMeta.color)}>
                            {formatMeta.label}
                          </Badge>
                          <Badge variant="outline" className={cn("text-[10px]", funnelMeta.color)}>
                            {funnelMeta.label}
                          </Badge>
                        </div>

                        <CardTitle className="text-base leading-snug text-slate-900">
                          {item.title}
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="space-y-3 pb-4">
                        {item.generatedImageUrl && (
                          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-2.5">
                            <a
                              href={item.generatedImageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-emerald-300 bg-white shadow-xs group"
                              title="Clique para abrir a arte criada em tamanho real"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.generatedImageUrl}
                                alt={item.title}
                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                              />
                            </a>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                                <Sparkles className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                Arte pronta na Galeria
                              </p>
                              <p className="text-[11px] text-emerald-700 leading-tight mt-0.5">
                                Esta proposta já possui arte gerada pela IA. Clique na miniatura para ver ou agende abaixo.
                              </p>
                            </div>
                          </div>
                        )}

                        <p className="line-clamp-3 text-xs leading-relaxed text-slate-600">
                          {item.caption}
                        </p>

                        {/* Resumo dos entregáveis inclusos no card */}
                        <div className="grid grid-cols-2 gap-1.5 rounded-lg bg-slate-50 p-2.5 text-[11px] text-slate-600 border border-slate-100">
                          <span className="flex items-center gap-1">
                            <Video className="h-3 w-3 text-rose-500" /> Roteiro Reels
                          </span>
                          <span className="flex items-center gap-1">
                            <Layers className="h-3 w-3 text-purple-500" />{" "}
                            {item.carouselSlides?.length || 4} Slides Carrossel
                          </span>
                          <span className="flex items-center gap-1">
                            <ImageIcon className="h-3 w-3 text-orange-500" />{" "}
                            {item.storiesSequence?.length || 4} Stories do Dia
                          </span>
                          <span className="flex items-center gap-1">
                            <Send className="h-3 w-3 text-emerald-600" /> Script Direct (
                            {item.directSellingScript?.triggerKeyword || "QUERO"})
                          </span>
                        </div>

                        {/* Status Selector */}
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs font-medium text-slate-500">Status:</span>
                          <Select
                            value={item.status}
                            onValueChange={(val) =>
                              handleStatusChange(item, val as CampaignItemStatus)
                            }
                          >
                            <SelectTrigger className="h-8 w-[160px] text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">⏳ Pendente</SelectItem>
                              <SelectItem value="in_production">🎨 Arte Criada / Produção</SelectItem>
                              <SelectItem value="scheduled">📅 Agendado</SelectItem>
                              <SelectItem value="published">✅ Publicado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>

                      <CardFooter className="flex flex-col gap-2 border-t border-slate-100 pt-3">
                        {item.format === "static_ai" || item.format === "carousel_ai" ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-xs font-semibold"
                              onClick={() => handleOpenKitModal(item)}
                            >
                              <Eye className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
                              Abrir Kit Completo (Roteiro, Stories & Direct)
                            </Button>
                            {item.generatedImageUrl ? (
                              <div className="flex w-full items-center gap-2">
                                <Button
                                  size="sm"
                                  className="flex-1 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
                                  onClick={() => handleScheduleExistingArt(item)}
                                >
                                  <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                                  Agendar com Arte Criada
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="shrink-0 text-xs font-semibold border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                  onClick={() => handleSendToPostWizard(item)}
                                  title="Gerar uma nova versão da arte no Fluxo Geral"
                                >
                                  <RefreshCw className="mr-1 h-3.5 w-3.5" />
                                  Nova Arte
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                className="w-full text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700"
                                onClick={() => handleSendToPostWizard(item)}
                              >
                                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                                {hasCreatedArt ? "Gerar Nova Arte IA & Agendar" : "Gerar Arte IA & Agendar Post"}
                              </Button>
                            )}
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              className="w-full text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-xs"
                              onClick={() => handleOpenKitModal(item)}
                            >
                              <Video className="mr-1.5 h-3.5 w-3.5" />
                              Abrir Roteiro de Gravação do Reels
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50"
                              onClick={() => handleScheduleOrganicVideo(item)}
                            >
                              <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
                              Agendar Publicação do Reels
                            </Button>
                          </>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* =====================================================================
          MODAL DO KIT COMPLETO DE PRODUÇÃO DO POST
         ===================================================================== */}
      <Dialog open={Boolean(activeKitItem)} onOpenChange={(open) => !open && setActiveKitItem(null)}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          {activeKitItem && (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={CAMPAIGN_FORMAT_LABELS[activeKitItem.format]?.color}>
                    {CAMPAIGN_FORMAT_LABELS[activeKitItem.format]?.label}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={FUNNEL_STAGE_LABELS[activeKitItem.funnelStage]?.color}
                  >
                    {FUNNEL_STAGE_LABELS[activeKitItem.funnelStage]?.label}
                  </Badge>
                  <span className="text-xs text-slate-500">
                    {activeKitItem.dayOfWeekLabel} •{" "}
                    {activeKitItem.scheduledDate.split("-").reverse().join("/")} às{" "}
                    {activeKitItem.suggestedTime}
                  </span>
                </div>
                <DialogTitle className="text-xl font-bold text-slate-900 pt-1">
                  {activeKitItem.title}
                </DialogTitle>
                <DialogDescription>
                  Kit completo de produção gerado pela IA para execução imediata.
                </DialogDescription>
              </DialogHeader>

              <Tabs value={activeKitTab} onValueChange={setActiveKitTab} className="mt-2">
                <TabsList className="grid w-full grid-cols-2 gap-1 sm:grid-cols-5 h-auto bg-slate-100 p-1">
                  <TabsTrigger value="copy" className="text-xs py-2">
                    {activeKitItem.format === "static_ai" || activeKitItem.format === "carousel_ai"
                      ? "Legenda & Arte IA"
                      : "Legenda & Hashtags"}
                  </TabsTrigger>
                  <TabsTrigger value="reels" className="text-xs py-2">
                    Roteiro Reels
                  </TabsTrigger>
                  <TabsTrigger value="carousel" className="text-xs py-2">
                    Carrossel
                  </TabsTrigger>
                  <TabsTrigger value="stories" className="text-xs py-2">
                    Stories (4x)
                  </TabsTrigger>
                  <TabsTrigger value="direct" className="text-xs py-2">
                    Direct & Multi-Rede
                  </TabsTrigger>
                </TabsList>

                {/* Sub-aba 1: Legenda, Hashtags e Prompt Visual */}
                <TabsContent value="copy" className="space-y-4 pt-4">
                  <div className="rounded-xl border border-slate-200 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-slate-500">
                        Legenda Pronta para o Feed / Reels
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleCopyText(
                            `${activeKitItem.caption}\n\n${activeKitItem.hashtags.join(" ")}`,
                            "Legenda"
                          )
                        }
                      >
                        <Copy className="mr-1.5 h-3.5 w-3.5" />
                        Copiar Legenda + Hashtags
                      </Button>
                    </div>
                    <p className="whitespace-pre-line text-sm text-slate-800 leading-relaxed">
                      {activeKitItem.caption}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {activeKitItem.hashtags.map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs text-indigo-700">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {(activeKitItem.format === "static_ai" || activeKitItem.format === "carousel_ai") && (
                    <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-indigo-900">
                          Prompt Visual Otimizado para Geração de Imagem IA
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyText(activeKitItem.aiImagePrompt, "Prompt IA")}
                        >
                          <Copy className="mr-1.5 h-3.5 w-3.5" />
                          Copiar Prompt
                        </Button>
                      </div>
                      <p className="text-xs text-slate-700">{activeKitItem.aiImagePrompt}</p>
                    </div>
                  )}
                </TabsContent>

                {/* Sub-aba 2: Roteiro de Reels / Vídeo Orgânico */}
                <TabsContent value="reels" className="space-y-4 pt-4">
                  {activeKitItem.reelsScript && (
                    <div className="space-y-3">
                      <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4">
                        <span className="text-xs font-bold uppercase text-rose-800">
                          ⚡ Gancho Inicial (Primeiros 3 Segundos - Trava Scroll)
                        </span>
                        <p className="mt-1 text-base font-bold text-slate-900">
                          &ldquo;{activeKitItem.reelsScript.hook}&rdquo;
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase text-slate-500">
                            🗣️ Desenvolvimento / Roteiro Falado Pronto ({activeKitItem.reelsScript.durationSeconds}s)
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleCopyText(
                                getReadySpokenScript(activeKitItem, igConnection?.accountName || "NumVapt"),
                                "Roteiro Falado"
                              )
                            }
                          >
                            <Copy className="mr-1.5 h-3.5 w-3.5" />
                            Copiar Fala
                          </Button>
                        </div>
                        <p className="text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                          {getReadySpokenScript(activeKitItem, igConnection?.accountName || "NumVapt")}
                        </p>
                      </div>

                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
                        <span className="text-xs font-bold uppercase text-emerald-800">
                          🎯 Chamada para Ação (CTA Final)
                        </span>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          &ldquo;{activeKitItem.reelsScript.cta}&rdquo;
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                          <span className="text-xs font-bold uppercase text-slate-500">
                            🎥 Direção de Cena e Gravação
                          </span>
                          <p className="mt-1 text-xs text-slate-700">
                            {activeKitItem.reelsScript.visualDirection}
                          </p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                          <span className="text-xs font-bold uppercase text-slate-500">
                            🎵 Áudio e Edição Sugerida
                          </span>
                          <p className="mt-1 text-xs text-slate-700">
                            {activeKitItem.reelsScript.audioSuggestion}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Sub-aba 3: Estrutura de Carrossel */}
                <TabsContent value="carousel" className="space-y-3 pt-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {(activeKitItem.carouselSlides || []).map((slide) => (
                      <div
                        key={slide.slideNumber}
                        className="rounded-xl border border-slate-200 bg-white p-4 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <Badge className="bg-purple-100 text-purple-800">
                            Slide {slide.slideNumber}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[11px]"
                            onClick={() =>
                              handleCopyText(
                                `${slide.headline}\n${slide.bodyText}`,
                                `Slide ${slide.slideNumber}`
                              )
                            }
                          >
                            <Copy className="mr-1 h-3 w-3" /> Copiar
                          </Button>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900">{slide.headline}</h4>
                        <p className="text-xs text-slate-600">{slide.bodyText}</p>
                        <p className="text-[11px] italic text-slate-400 pt-1">
                          Dica visual: {slide.visualHint}
                        </p>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* Sub-aba 4: Sequência de Stories do Dia */}
                <TabsContent value="stories" className="space-y-3 pt-4">
                  <p className="text-xs text-slate-600">
                    Publique esta sequência nos Stories ao longo do dia para aquecer sua audiência e
                    multiplicar o alcance do post no Feed:
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {(activeKitItem.storiesSequence || []).map((st) => (
                      <div
                        key={st.frameNumber}
                        className="rounded-xl border border-orange-200 bg-orange-50/30 p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <Badge className="bg-orange-100 text-orange-800">
                            Story #{st.frameNumber}
                          </Badge>
                          <span className="text-[11px] font-semibold uppercase text-orange-700">
                            {st.type}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-900">
                          &ldquo;{st.scriptText}&rdquo;
                        </p>
                        <p className="text-xs text-slate-600">
                          <strong>Visual:</strong> {st.visualSuggestion}
                        </p>
                        <div className="rounded-lg bg-white p-2 text-xs font-semibold text-orange-700 border border-orange-200">
                          ✨ Figurinha Interativa: {st.interactiveSticker}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* Sub-aba 5: Script de Direct (Social Selling) & Multiplicação Omnichannel */}
                <TabsContent value="direct" className="space-y-5 pt-4">
                  {activeKitItem.directSellingScript && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold uppercase text-emerald-800">
                            💬 Script de Vendas no Direct (Social Selling)
                          </span>
                          <p className="text-xs text-slate-600">
                            Quando um seguidor comentar a palavra-chave{" "}
                            <strong className="text-emerald-900">
                              &ldquo;{activeKitItem.directSellingScript.triggerKeyword}&rdquo;
                            </strong>
                            , envie esta sequência:
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleCopyText(
                              `1) Abertura: ${activeKitItem.directSellingScript.openingMessage}\n\n2) Qualificação: ${activeKitItem.directSellingScript.qualificationQuestion}\n\n3) Fechamento: ${activeKitItem.directSellingScript.closingCtaMessage}`,
                              "Script de Direct"
                            )
                          }
                        >
                          <Copy className="mr-1.5 h-3.5 w-3.5" />
                          Copiar Sequência DM
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3 text-xs">
                        <div className="rounded-lg bg-white p-3 border border-emerald-100">
                          <span className="font-bold text-emerald-700">1. Mensagem de Abertura</span>
                          <p className="mt-1 text-slate-700">
                            {activeKitItem.directSellingScript.openingMessage}
                          </p>
                        </div>
                        <div className="rounded-lg bg-white p-3 border border-emerald-100">
                          <span className="font-bold text-emerald-700">
                            2. Pergunta de Qualificação
                          </span>
                          <p className="mt-1 text-slate-700">
                            {activeKitItem.directSellingScript.qualificationQuestion}
                          </p>
                        </div>
                        <div className="rounded-lg bg-white p-3 border border-emerald-100">
                          <span className="font-bold text-emerald-700">
                            3. Convite / Fechamento
                          </span>
                          <p className="mt-1 text-slate-700">
                            {activeKitItem.directSellingScript.closingCtaMessage}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Multiplicador Omnichannel */}
                  {activeKitItem.omnichannel && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Share2 className="h-4 w-4 text-indigo-600" />
                        Multiplicação Omnichannel (Adaptação Automática para Outras Redes)
                      </h4>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        {activeKitItem.omnichannel.linkedin && (
                          <div className="rounded-xl border border-slate-200 p-3.5 space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sky-700 flex items-center gap-1">
                                <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-[11px]"
                                onClick={() =>
                                  handleCopyText(
                                    `${activeKitItem.omnichannel?.linkedin?.headline}\n\n${activeKitItem.omnichannel?.linkedin?.postText}`,
                                    "Post LinkedIn"
                                  )
                                }
                              >
                                <Copy className="mr-1 h-3 w-3" /> Copiar
                              </Button>
                            </div>
                            <p className="font-semibold text-slate-900">
                              {activeKitItem.omnichannel.linkedin.headline}
                            </p>
                            <p className="text-slate-600 whitespace-pre-line line-clamp-5">
                              {activeKitItem.omnichannel.linkedin.postText}
                            </p>
                          </div>
                        )}

                        {activeKitItem.omnichannel.tiktok && (
                          <div className="rounded-xl border border-slate-200 p-3.5 space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 flex items-center gap-1">
                                <Video className="h-3.5 w-3.5" /> TikTok
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-[11px]"
                                onClick={() =>
                                  handleCopyText(
                                    `Gancho: ${activeKitItem.omnichannel?.tiktok?.hook}\nRoteiro: ${activeKitItem.omnichannel?.tiktok?.script}\nLegenda: ${activeKitItem.omnichannel?.tiktok?.caption}`,
                                    "Roteiro TikTok"
                                  )
                                }
                              >
                                <Copy className="mr-1 h-3 w-3" /> Copiar
                              </Button>
                            </div>
                            <p className="font-semibold text-slate-900">
                              {activeKitItem.omnichannel.tiktok.hook}
                            </p>
                            <p className="text-slate-600 whitespace-pre-line">
                              {activeKitItem.omnichannel.tiktok.script}
                            </p>
                          </div>
                        )}

                        {activeKitItem.omnichannel.facebook && (
                          <div className="rounded-xl border border-slate-200 p-3.5 space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-blue-700 flex items-center gap-1">
                                <Facebook className="h-3.5 w-3.5" /> Facebook
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-[11px]"
                                onClick={() =>
                                  handleCopyText(
                                    activeKitItem.omnichannel?.facebook?.postText || "",
                                    "Post Facebook"
                                  )
                                }
                              >
                                <Copy className="mr-1 h-3 w-3" /> Copiar
                              </Button>
                            </div>
                            <p className="text-slate-600 whitespace-pre-line">
                              {activeKitItem.omnichannel.facebook.postText}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Button variant="outline" onClick={() => setActiveKitItem(null)}>
                  Fechar
                </Button>
                {activeKitItem.format === "static_ai" || activeKitItem.format === "carousel_ai" ? (
                  <Button
                    onClick={() => {
                      const itemToProcess = activeKitItem;
                      setActiveKitItem(null);
                      handleSendToPostWizard(itemToProcess);
                    }}
                    className="bg-indigo-600 text-white hover:bg-indigo-700 font-semibold"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Gerar Arte IA & Agendar Post
                  </Button>
                ) : activeKitTab === "reels" ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="secondary"
                      onClick={() =>
                        handleCopyText(
                          `GANCHO (3s): "${activeKitItem.reelsScript?.hook}"\n\nROTEIRO:\n${activeKitItem.reelsScript?.body}\n\nCTA:\n"${activeKitItem.reelsScript?.cta}"\n\nDIREÇÃO VISUAL: ${activeKitItem.reelsScript?.visualDirection}`,
                          "Roteiro de Gravação"
                        )
                      }
                      className="text-xs font-semibold"
                    >
                      <Copy className="mr-1.5 h-3.5 w-3.5" />
                      Copiar Roteiro de Gravação
                    </Button>
                    <Button
                      onClick={() => {
                        const itemToProcess = activeKitItem;
                        setActiveKitItem(null);
                        handleScheduleOrganicVideo(itemToProcess);
                      }}
                      className="bg-rose-600 text-white hover:bg-rose-700 text-xs font-semibold"
                    >
                      <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                      Agendar Publicação do Reels
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => {
                      const itemToProcess = activeKitItem;
                      setActiveKitItem(null);
                      handleScheduleOrganicVideo(itemToProcess);
                    }}
                    className="bg-rose-600 text-white hover:bg-rose-700 text-xs font-semibold"
                  >
                    <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                    Agendar Publicação do Reels
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
