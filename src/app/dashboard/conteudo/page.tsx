"use client";

import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { format, isFuture, isSameDay, startOfDay, startOfMonth, startOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  Linkedin,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Trash2,
  History,
  Lightbulb,
  Camera,
  UploadCloud,
  MousePointer2,
  Image as ImageIcon,
  Store,
} from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import {
  deletePost,
  getScheduledPosts,
  schedulePost,
  type PostDataInput,
} from "@/lib/services/posts-service";
import {
  getMetaConnection,
  updateMetaConnection,
  type MetaConnectionData,
} from "@/lib/services/meta-service";
import {
  getInstagramConnection,
  updateInstagramConnection,
  type InstagramConnectionData,
} from "@/lib/services/instagram-service";
import { getGoogleConnection, type GoogleConnectionData } from "@/lib/services/google-service";
import {
  getLinkedInConnection,
  updateLinkedInConnection,
  type LinkedInConnectionData,
} from "@/lib/services/linkedin-service";
import { config } from "@/lib/config";

import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------------------------------------- */

type PostStatus = "scheduled" | "publishing" | "published" | "failed";

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

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
}

type HistoryFilter = "last-7-days" | "this-month" | "this-year" | "all-time";
type RepublishScheduleType = "now" | "schedule";
type Platform = "instagram" | "facebook" | "linkedin" | "google";

/* -------------------------------------------------------------------------------------------------
 * Constants / Utils
 * ------------------------------------------------------------------------------------------------- */

const PLACEHOLDER_IMAGE = "https://placehold.co/400";

const META_OAUTH = {
  clientId: process.env.NEXT_PUBLIC_META_APP_ID || "826418333144156",
  scope:
    "pages_manage_engagement,pages_manage_posts,pages_read_engagement,pages_read_user_content,pages_show_list,business_management,ads_management,ads_read",
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
  const imageSrc = post.imageUrl || PLACEHOLDER_IMAGE;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-between rounded-lg border bg-white p-4 transition-shadow hover:shadow-sm"
    >
      <div className="flex items-center gap-4 overflow-hidden">
        <Image
          src={imageSrc}
          alt={post.text.substring(0, 50) || "Imagem do post"}
          width={56}
          height={56}
          className="h-14 w-14 rounded-md bg-gray-100 object-cover"
        />
        <div className="overflow-hidden">
          <h4 className="truncate text-base font-medium text-gray-900">
            {post.text.length > 50 ? post.text.substring(0, 50) + "..." : post.text}
          </h4>

          <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
            {StatusIcon ? <StatusIcon className="h-4 w-4" /> : null}
            <span>
              {post.formattedDate} às {post.formattedTime}
            </span>
          </div>

          <div className="mt-1.5 flex items-center gap-4 text-xs text-gray-500">
            {post.platforms?.includes("facebook") ? (
              <div className="flex items-center gap-1.5">
                <Facebook className="h-3.5 w-3.5 text-blue-600" />
                {post.pageName ? <span className="font-medium">{post.pageName}</span> : null}
              </div>
            ) : null}
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
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <Badge variant="outline" className={cfg?.badgeClassName}>
          {post.status}
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
              className="text-blue-600 focus:text-blue-700"
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
  const [selectedPageId, setSelectedPageId] = useState<string | null>(
    pages.length > 0 ? pages[0].id : null
  );
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
            Encontramos {pages.length} página(s). Por favor, escolha a que você deseja conectar à
            NumVapt.
          </DialogDescription>
        </DialogHeader>

        <div className="relative my-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por nome..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="max-h-80 overflow-y-auto pr-2">
          <RadioGroup
            value={selectedPageId ?? ""}
            onValueChange={setSelectedPageId}
            className="space-y-3"
          >
            {filteredPages.map((page) => (
              <Label
                key={page.id}
                htmlFor={page.id}
                className="flex cursor-pointer items-center gap-4 rounded-lg border p-4 hover:bg-gray-50 has-[:checked]:border-primary has-[:checked]:bg-blue-50"
              >
                <RadioGroupItem value={page.id} id={page.id} />
                <div>
                  <p className="font-semibold text-gray-800">{page.name}</p>
                </div>
              </Label>
            ))}
          </RadioGroup>

          {filteredPages.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-500">
              Nenhuma página encontrada com sua busca.
            </p>
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

function LinkedInOrgSelectionModal({
  organizations,
  isOpen,
  onSelect,
  onCancel,
}: {
  organizations: { urn: string; name: string }[];
  isOpen: boolean;
  onSelect: (org: { urn: string; name: string }) => void;
  onCancel: () => void;
}) {
  const [selectedOrgUrn, setSelectedOrgUrn] = useState<string | null>(
    organizations.length > 0 ? organizations[0].urn : null
  );
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setSelectedOrgUrn(organizations.length > 0 ? organizations[0].urn : null);
  }, [organizations]);

  const filteredOrgs = useMemo(() => {
    if (!searchQuery) return organizations;
    const q = normalizeText(searchQuery);
    return organizations.filter((org) => normalizeText(org.name).includes(q));
  }, [organizations, searchQuery]);

  const handleSelect = () => {
    const org = organizations.find((o) => o.urn === selectedOrgUrn);
    if (org) onSelect(org);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Selecione uma Página do LinkedIn</DialogTitle>
          <DialogDescription>
            Encontramos {organizations.length} página(s) corporativa(s). Por favor, escolha a que
            você deseja conectar à NumVapt.
          </DialogDescription>
        </DialogHeader>

        <div className="relative my-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por nome..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="max-h-80 overflow-y-auto pr-2">
          <RadioGroup
            value={selectedOrgUrn ?? ""}
            onValueChange={setSelectedOrgUrn}
            className="space-y-3"
          >
            {filteredOrgs.map((org) => (
              <Label
                key={org.urn}
                htmlFor={org.urn}
                className="flex cursor-pointer items-center gap-4 rounded-lg border p-4 hover:bg-gray-50 has-[:checked]:border-primary has-[:checked]:bg-blue-50"
              >
                <RadioGroupItem value={org.urn} id={org.urn} />
                <div>
                  <p className="font-semibold text-gray-800">{org.name}</p>
                </div>
              </Label>
            ))}
          </RadioGroup>

          {filteredOrgs.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-500">
              Nenhuma página encontrada com sua busca.
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSelect} disabled={!selectedOrgUrn}>
            Conectar Página Selecionada
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConnectionStatus({
  platform,
  isConnected,
  accountName,
  onConnect,
  onDisconnect,
  isLoading,
}: {
  platform: "facebook" | "instagram" | "linkedin";
  isConnected: boolean;
  accountName?: string;
  onConnect: () => void;
  onDisconnect: () => void;
  isLoading: boolean;
}) {
  const platformConfig = {
    facebook: {
      icon: Facebook,
      name: "Facebook",
      color: "text-blue-600",
    },
    instagram: {
      icon: Instagram,
      name: "Instagram",
      color: "text-pink-600",
    },
    linkedin: {
      icon: Linkedin,
      name: "LinkedIn",
      color: "text-blue-700",
    },
  };

  const { icon: Icon, name, color } = platformConfig[platform];

  return (
    <div className="flex items-center justify-between rounded-lg p-3 hover:bg-gray-50/50">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm`}
        >
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-800">{name}</h4>
          {isConnected ? (
            <p className="truncate text-xs font-medium text-green-700" title={accountName}>
              Conectado como {accountName}
            </p>
          ) : (
            <p className="text-xs text-red-600">Não conectado</p>
          )}
        </div>
      </div>

      {isConnected ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDisconnect}
          className="text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      ) : (
        <Button variant="outline" size="sm" onClick={onConnect} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Conectar"}
        </Button>
      )}
    </div>
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
  const [instagramConnection, setInstagramConnection] = useState<InstagramConnectionData>({
    isConnected: false,
  });
  const [googleConnection, setGoogleConnection] = useState<GoogleConnectionData>({
    isConnected: false,
  });
  const [linkedinConnection, setLinkedinConnection] = useState<LinkedInConnectionData>({
    isConnected: false,
  });

  // Connection flow
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [pendingPages, setPendingPages] = useState<FacebookPage[]>([]);
  const [pendingLinkedInOrgs, setPendingLinkedInOrgs] = useState<{ urn: string; name: string }[]>(
    []
  );
  const [isLinkedInSelectionModalOpen, setIsLinkedInSelectionModalOpen] = useState(false);

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
  const [republishPlatforms, setRepublishPlatforms] = useState<Platform[]>([]);

  const isLoadingInitial = loading && allPosts.length === 0;

  const fetchPageData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setCheckingConnection(true);

    try {
      const [postsResults, metaResult, instagramResult, googleResult, linkedinResult] =
        await Promise.all([
          getScheduledPosts(user.uid),
          getMetaConnection(user.uid),
          getInstagramConnection(user.uid),
          getGoogleConnection(user.uid),
          getLinkedInConnection(user.uid),
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
      // Community Management API só suporta org como owner — força publishTarget = "organization"
      // sempre que houver uma org selecionada, independente do personUrn
      if (
        linkedinResult.isConnected &&
        linkedinResult.selectedOrganizationUrn &&
        linkedinResult.publishTarget !== "organization"
      ) {
        updateLinkedInConnection(user.uid, { publishTarget: "organization" });
        linkedinResult.publishTarget = "organization";
      } else if (
        linkedinResult.isConnected &&
        (!linkedinResult.personUrn || !linkedinResult.personUrn.startsWith("urn:li:person:")) &&
        linkedinResult.publishTarget !== "organization"
      ) {
        updateLinkedInConnection(user.uid, { publishTarget: "organization" });
        linkedinResult.publishTarget = "organization";
      }
      setLinkedinConnection(linkedinResult);
    } catch (err) {
      console.error("Failed to fetch page data:", err);
      toast({
        variant: "destructive",
        title: "Erro ao Carregar Dados",
        description: "Não foi possível carregar os dados da página.",
      });
    } finally {
      setLoading(false);
      setCheckingConnection(false);
    }
  }, [toast, user]);

  const handlePageSelection = useCallback(
    async (page: FacebookPage) => {
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
          description: err?.message ?? "Erro",
        });
      } finally {
        setIsConnecting(false);
        setPendingPages([]);
      }
    },
    [fetchPageData, toast, user]
  );

  const handleLinkedInOrgSelection = useCallback(
    async (org: { urn: string; name: string }) => {
      if (!user) return;

      setIsConnecting(true);
      setIsLinkedInSelectionModalOpen(false);
      try {
        await updateLinkedInConnection(user.uid, {
          selectedOrganizationUrn: org.urn,
          selectedOrganizationName: org.name,
          publishTarget: "organization",
        });

        toast({
          variant: "success",
          title: "Conexão Estabelecida!",
          description: `Página do LinkedIn "${org.name}" conectada com sucesso.`,
        });
        await fetchPageData();
      } catch (err: any) {
        toast({
          variant: "destructive",
          title: "Falha ao Salvar Conexão do LinkedIn",
          description: err?.message ?? "Erro",
        });
      } finally {
        setIsConnecting(false);
        setPendingLinkedInOrgs([]);
      }
    },
    [fetchPageData, toast, user]
  );

  useEffect(() => {
    if (typeof window === "undefined" || !user) {
      fetchPageData();
      return;
    }

    // Evita loop de re-execução em dev mode
    if (effectRan.current && process.env.NODE_ENV === "development") {
      return;
    }

    const isFacebookAuth = searchParams.has("code");
    const isInstagramAuth = searchParams.has("instagram_connection_success");
    const isLinkedInAuth = searchParams.has("linkedin_connection_success");
    const isLinkedInError = searchParams.has("linkedin_error");

    if (isLinkedInError) {
      effectRan.current = true;
      const errorDesc = searchParams.get("linkedin_error_description");
      toast({
        variant: "destructive",
        title: "Erro no LinkedIn",
        description: decodeURIComponent(errorDesc || "Falha na autenticação"),
      });
      router.replace("/dashboard/conteudo", undefined);
      return;
    }

    const runFacebookFlow = async () => {
      const code = searchParams.get("code");
      if (!code) return;
      effectRan.current = true;
      setIsConnecting(true);

      try {
        const tokenResponse = await fetch("/api/meta/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, origin: window.location.origin }),
        });
        const tokenResult = await tokenResponse.json();
        if (!tokenResult.success) throw new Error(tokenResult.error);
        const { userAccessToken } = tokenResult;

        await updateMetaConnection(user.uid, { userAccessToken, pending: true });
        router.replace("/dashboard/conteudo", undefined);

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
        toast({
          variant: "destructive",
          title: "Falha na Conexão",
          description: err.message,
          duration: 9000,
        });
        setIsConnecting(false);
        router.replace("/dashboard/conteudo", undefined);
      }
    };

    const handleInstagramCallback = async () => {
      effectRan.current = true;
      const accessToken = searchParams.get("instagram_accessToken");
      const instagramId = searchParams.get("instagram_id");
      const instagramUsername = searchParams.get("instagram_username");
      const uidFromState = searchParams.get("user_id_from_state");

      if (uidFromState && uidFromState !== user.uid) {
        toast({
          variant: "destructive",
          title: "Falha de Segurança",
          description: "Incompatibilidade de usuários na autenticação.",
        });
        router.replace("/dashboard/conteudo", undefined);
        return;
      }

      if (accessToken && instagramId && instagramUsername) {
        await updateInstagramConnection(user.uid, {
          isConnected: true,
          accessToken,
          instagramId,
          instagramUsername,
        });
        toast({
          variant: "success",
          title: "Instagram Conectado!",
          description: `Conexão com @${instagramUsername} estabelecida.`,
        });
        await fetchPageData();
      } else {
        toast({
          variant: "destructive",
          title: "Falha na Conexão",
          description: "Dados insuficientes retornados pelo Instagram.",
        });
      }
      router.replace("/dashboard/conteudo", undefined);
    };

    const handleLinkedInCallback = async () => {
      effectRan.current = true;
      const linkedinName = searchParams.get("linkedin_name");
      const uidFromState = searchParams.get("user_id_from_state");

      if (uidFromState && uidFromState !== user.uid) {
        toast({
          variant: "destructive",
          title: "Falha de Segurança",
          description: "Incompatibilidade de usuários na autenticação.",
        });
        router.replace("/dashboard/conteudo", undefined);
        return;
      }

      router.replace("/dashboard/conteudo", undefined);

      try {
        const linkedinResult = await getLinkedInConnection(user.uid);
        if (
          linkedinResult.isConnected &&
          linkedinResult.organizations &&
          linkedinResult.organizations.length > 1
        ) {
          setPendingLinkedInOrgs(linkedinResult.organizations);
          setIsLinkedInSelectionModalOpen(true);
        } else {
          toast({
            variant: "success",
            title: "LinkedIn Conectado!",
            description: `Conexão com ${linkedinName || "LinkedIn"} estabelecida.`,
          });
        }
      } catch (err: any) {
        console.error("Erro ao processar callback do LinkedIn:", err);
      }

      await fetchPageData();
    };

    if (isInstagramAuth) {
      handleInstagramCallback();
    } else if (isLinkedInAuth) {
      handleLinkedInCallback();
    } else if (isFacebookAuth) {
      runFacebookFlow();
    } else {
      fetchPageData();
    }
  }, [user, searchParams, router, toast, handlePageSelection, fetchPageData]);

  const { scheduledPosts, pastPosts, calendarModifiers, postsForSelectedDay } = useMemo(() => {
    const scheduled = allPosts.filter((p) => p.status === "scheduled");
    const historyBase = allPosts.filter(
      (p) => p.status === "published" || p.status === "failed" || p.status === "publishing"
    );
    const startDate = getHistoryStartDate(historyFilter);
    const filteredHistory = startDate
      ? historyBase.filter((p) => p.date >= startDate)
      : historyBase;
    const modifiers = {
      published: allPosts.filter((p) => p.status === "published").map((p) => p.date),
      scheduled: allPosts
        .filter((p) => p.status === "scheduled" && isFuture(p.date))
        .map((p) => p.date),
      failed: allPosts.filter((p) => p.status === "failed").map((p) => p.date),
    };
    const postsOnDay = selectedDate ? allPosts.filter((p) => isSameDay(p.date, selectedDate)) : [];
    return {
      scheduledPosts: scheduled,
      pastPosts: filteredHistory,
      calendarModifiers: modifiers,
      postsForSelectedDay: postsOnDay,
    };
  }, [allPosts, historyFilter, selectedDate]);

  useEffect(() => {
    if (selectedDate && postsForSelectedDay.length > 0) setIsDateModalOpen(true);
  }, [postsForSelectedDay.length, selectedDate]);

  const handleDateSelect = useCallback(
    (date: Date | undefined) => {
      if (!date) return;
      setSelectedDate(date);
      if (allPosts.some((p) => isSameDay(p.date, date))) setIsDateModalOpen(true);
    },
    [allPosts]
  );

  const handleConnectMeta = useCallback(() => {
    const origin = window.location.origin;
    const redirectUri = `${origin}/dashboard/conteudo`;
    const authUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${META_OAUTH.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${user?.uid}&scope=${META_OAUTH.scope}&response_type=code`;
    window.location.href = authUrl;
  }, [user?.uid]);

  const handleConnectInstagram = () => {
    const clientId = config.instagram.appId;
    const origin = window.location.origin;
    const redirectUri = `${origin}/api/instagram/callback`;

    if (!clientId) {
      toast({
        variant: "destructive",
        title: "Erro de Configuração",
        description: "As credenciais do Instagram não estão configuradas.",
      });
      return;
    }

    const state = user?.uid;
    const scope =
      "instagram_business_basic,instagram_business_content_publish,instagram_business_manage_insights";
    const responseType = "code";

    const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=${responseType}&state=${state}`;
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

  const handleConnectLinkedIn = useCallback(() => {
    const origin = window.location.origin;
    const redirectUri = `${origin}/api/linkedin/callback`;
    const clientId = config.linkedin.clientId;
    if (!clientId) {
      toast({
        variant: "destructive",
        title: "Configuração Ausente",
        description: "Credenciais do LinkedIn não encontradas no servidor.",
      });
      return;
    }
    const state = user?.uid || "";
    const scope =
      "r_organization_social w_organization_social rw_organization_admin r_basicprofile";
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${encodeURIComponent(scope)}`;
    window.location.href = authUrl;
  }, [user?.uid, toast]);

  const handleDisconnectLinkedIn = useCallback(async () => {
    if (!user) return;
    try {
      await updateLinkedInConnection(user.uid, { isConnected: false });
      await fetchPageData();
      toast({ title: "Desconectado", description: "A conexão com o LinkedIn foi removida." });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro ao Desconectar",
        description: err.message || "Erro desconhecido.",
      });
    }
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
      toast({
        variant: "destructive",
        title: "Erro ao Excluir",
        description: err?.message ?? "Erro",
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
      setRepublishPlatforms(post.platforms as Platform[]); // Set initial platforms
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
        description: "Conecte o Instagram para republicar.",
      });
      return;
    }
    if (republishPlatforms.includes("facebook") && !metaConnection.isConnected) {
      toast({
        variant: "destructive",
        title: "Facebook não conectado",
        description: "Conecte o Facebook para republicar.",
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
          description: "Conecte o LinkedIn para republicar.",
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
            "Selecione uma Página Corporativa na aba 'Conexões' para poder publicar no LinkedIn.",
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

    if (republishPlatforms.includes("instagram")) {
      input.instagramConnection = instagramConnection;
    }

    if (republishPlatforms.includes("facebook")) {
      input.metaConnection = metaConnection;
    }

    if (republishPlatforms.includes("google")) {
      input.googleConnection = googleConnection;
    }

    if (republishPlatforms.includes("linkedin")) {
      input.linkedinConnection = linkedinConnection;
    }

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
          republishScheduleType === "now"
            ? "Seu post foi republicado com sucesso."
            : "Seu post foi agendado para republicação.",
      });
    } else {
      toast({ variant: "destructive", title: "Erro ao Republicar", description: result.error });
    }
  }, [
    fetchPageData,
    metaConnection,
    instagramConnection,
    googleConnection,
    postToRepublish,
    republishScheduleDate,
    republishScheduleType,
    toast,
    user,
    republishPlatforms,
  ]);

  const handleRepublishPlatformChange = (platform: Platform) => {
    setRepublishPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  return (
    <>
      <style>{CALENDAR_DOT_STYLES}</style>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a publicação do seu
              histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <span className="flex items-center gap-2">
                {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Excluir</span>
              </span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={isDateModalOpen} onOpenChange={setIsDateModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Posts de{" "}
              {selectedDate ? format(selectedDate, "dd 'de' LLLL 'de' yyyy", { locale: ptBR }) : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-3 overflow-y-auto py-4 pr-2">
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
              <p className="py-8 text-center text-sm text-gray-500">Nenhum post para este dia.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={isRepublishModalOpen} onOpenChange={setIsRepublishModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Republicar Post</DialogTitle>
            <DialogDescription>
              Escolha quando e onde você quer republicar este conteúdo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div>
              <Label className="font-semibold">Onde Publicar?</Label>
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div
                  className={cn(
                    "flex cursor-pointer items-center space-x-3 rounded-lg border p-4 transition-all duration-200",
                    republishPlatforms.includes("instagram") && instagramConnection?.isConnected
                      ? "border-[#0083C7] bg-blue-50/50 shadow-sm"
                      : "border-gray-200 hover:bg-gray-50",
                    !instagramConnection?.isConnected &&
                      "cursor-not-allowed bg-gray-100 opacity-60 hover:bg-gray-100"
                  )}
                >
                  <Checkbox
                    id="republish-instagram"
                    checked={republishPlatforms.includes("instagram")}
                    onCheckedChange={() => handleRepublishPlatformChange("instagram")}
                    disabled={!instagramConnection?.isConnected}
                  />
                  <Label
                    htmlFor="republish-instagram"
                    className={cn(
                      "flex flex-1 cursor-pointer items-center gap-3 font-semibold text-gray-700",
                      !instagramConnection?.isConnected && "cursor-not-allowed"
                    )}
                  >
                    <Instagram className="h-5 w-5 text-pink-500" />
                    Instagram
                  </Label>
                </div>
                <div
                  className={cn(
                    "flex cursor-pointer items-center space-x-3 rounded-lg border p-4 transition-all duration-200",
                    republishPlatforms.includes("facebook") && metaConnection?.isConnected
                      ? "border-[#0083C7] bg-blue-50/50 shadow-sm"
                      : "border-gray-200 hover:bg-gray-50",
                    !metaConnection?.isConnected &&
                      "cursor-not-allowed bg-gray-100 opacity-60 hover:bg-gray-100"
                  )}
                >
                  <Checkbox
                    id="republish-facebook"
                    checked={republishPlatforms.includes("facebook")}
                    onCheckedChange={() => handleRepublishPlatformChange("facebook")}
                    disabled={!metaConnection?.isConnected}
                  />
                  <Label
                    htmlFor="republish-facebook"
                    className={cn(
                      "flex flex-1 cursor-pointer items-center gap-3 font-semibold text-gray-700",
                      !metaConnection?.isConnected && "cursor-not-allowed"
                    )}
                  >
                    <Facebook className="h-5 w-5 text-blue-600" />
                    Facebook
                  </Label>
                </div>
                <div
                  className={cn(
                    "flex cursor-pointer items-center space-x-3 rounded-lg border p-4 transition-all duration-200",
                    republishPlatforms.includes("google") && googleConnection?.isConnected
                      ? "border-[#0083C7] bg-blue-50/50 shadow-sm"
                      : "border-gray-200 hover:bg-gray-50",
                    !googleConnection?.isConnected &&
                      "cursor-not-allowed bg-gray-100 opacity-60 hover:bg-gray-100"
                  )}
                >
                  <Checkbox
                    id="republish-google"
                    checked={republishPlatforms.includes("google")}
                    onCheckedChange={() => handleRepublishPlatformChange("google")}
                    disabled={!googleConnection?.isConnected}
                  />
                  <Label
                    htmlFor="republish-google"
                    className={cn(
                      "flex flex-1 cursor-pointer items-center gap-3 font-semibold text-gray-700",
                      !googleConnection?.isConnected && "cursor-not-allowed"
                    )}
                  >
                    <Store className="h-5 w-5 text-blue-500" />
                    Google Meu Negócio
                  </Label>
                </div>
                <div
                  className={cn(
                    "flex cursor-pointer items-center space-x-3 rounded-lg border p-4 transition-all duration-200",
                    republishPlatforms.includes("linkedin") &&
                      linkedinConnection?.isConnected &&
                      (linkedinConnection.personUrn?.startsWith("urn:li:person:") ||
                        !!linkedinConnection.selectedOrganizationUrn)
                      ? "border-[#0083C7] bg-blue-50/50 shadow-sm"
                      : "border-gray-200 hover:bg-gray-50",
                    (!linkedinConnection?.isConnected ||
                      !(
                        linkedinConnection.personUrn?.startsWith("urn:li:person:") ||
                        !!linkedinConnection.selectedOrganizationUrn
                      )) &&
                      "cursor-not-allowed bg-gray-100 opacity-60 hover:bg-gray-100"
                  )}
                >
                  <Checkbox
                    id="republish-linkedin"
                    checked={republishPlatforms.includes("linkedin")}
                    onCheckedChange={() => handleRepublishPlatformChange("linkedin")}
                    disabled={
                      !linkedinConnection?.isConnected ||
                      !(
                        linkedinConnection.personUrn?.startsWith("urn:li:person:") ||
                        !!linkedinConnection.selectedOrganizationUrn
                      )
                    }
                  />
                  <Label
                    htmlFor="republish-linkedin"
                    className={cn(
                      "flex flex-1 cursor-pointer items-center gap-3 font-semibold text-gray-700",
                      (!linkedinConnection?.isConnected ||
                        !(
                          linkedinConnection.personUrn?.startsWith("urn:li:person:") ||
                          !!linkedinConnection.selectedOrganizationUrn
                        )) &&
                        "cursor-not-allowed"
                    )}
                  >
                    <Linkedin className="h-5 w-5 text-blue-700" />
                    LinkedIn
                  </Label>
                </div>
              </div>
            </div>
            <div>
              <Label className="font-semibold">Quando publicar?</Label>
              <RadioGroup
                value={republishScheduleType}
                onValueChange={(v) => setRepublishScheduleType(v as RepublishScheduleType)}
                className="mt-2 grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem value="now" id="republish-now" className="peer sr-only" />
                  <Label
                    htmlFor="republish-now"
                    className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 p-4 peer-data-[state=checked]:border-primary"
                  >
                    <Clock className="mb-2 h-6 w-6" />
                    Publicar Agora
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="schedule"
                    id="republish-schedule"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="republish-schedule"
                    className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 p-4 peer-data-[state=checked]:border-primary"
                  >
                    <CalendarIcon className="mb-2 h-6 w-6" />
                    Agendar
                  </Label>
                </div>
              </RadioGroup>
              {republishScheduleType === "schedule" ? (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4"
                >
                  <Input
                    type="datetime-local"
                    value={republishScheduleDate}
                    onChange={(e) => setRepublishScheduleDate(e.target.value)}
                  />
                </motion.div>
              ) : null}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRepublishModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmRepublish}
              disabled={
                isRepublishing ||
                republishPlatforms.length === 0 ||
                (republishScheduleType === "schedule" && !republishScheduleDate)
              }
            >
              <span className="flex items-center gap-2">
                {isRepublishing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span>{republishScheduleType === "now" ? "Republicar" : "Agendar"}</span>
              </span>
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
          setIsConnecting(false);
        }}
      />
      <LinkedInOrgSelectionModal
        isOpen={isLinkedInSelectionModalOpen}
        organizations={pendingLinkedInOrgs}
        onSelect={handleLinkedInOrgSelection}
        onCancel={() => {
          setIsLinkedInSelectionModalOpen(false);
          setPendingLinkedInOrgs([]);
          setIsConnecting(false);
        }}
      />

      <div className="mx-auto max-w-7xl space-y-8 bg-gray-50/50 p-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content Area */}
          <div className="space-y-8 lg:col-span-2">
            <div className="space-y-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Conteúdo & Marketing</h1>
                <p className="mt-1 text-gray-600">
                  Crie, agende e analise posts e conteúdos para suas redes sociais.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 pt-2 md:grid-cols-2">
                {/* Botão 1 - Conceito com IA */}
                <button
                  onClick={() => router.push("/dashboard/conteudo/gerar?mode=concept")}
                  className="group relative flex flex-col items-start overflow-hidden rounded-[24px] bg-gradient-to-br from-violet-600 to-indigo-700 p-6 text-left text-white shadow-xl shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="absolute right-[-20px] top-[-20px] opacity-10 transition-transform duration-500 group-hover:scale-110">
                    <Lightbulb size={120} />
                  </div>
                  <div className="mb-4 rounded-2xl bg-white/20 p-3 transition-colors group-hover:bg-white/30">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="mb-2 text-xl font-black leading-tight">
                    Criar Post
                  </h3>
                  <p className="text-sm font-medium leading-relaxed text-white/80">
                    Dê uma ideia e a IA gera imagens relevantes ao seu negócio e ao objetivo do post.
                  </p>
                </button>

                {/* Botão 2 - Referência Foto com IA */}
                <button
                  onClick={() => router.push("/dashboard/conteudo/gerar?mode=reference-photo")}
                  className="group relative flex flex-col items-start overflow-hidden rounded-[24px] bg-gradient-to-br from-rose-500 to-pink-600 p-6 text-left text-white shadow-xl shadow-pink-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="absolute right-[-20px] top-[-20px] opacity-10 transition-transform duration-500 group-hover:scale-110">
                    <Camera size={120} />
                  </div>
                  <div className="mb-4 rounded-2xl bg-white/20 p-3 transition-colors group-hover:bg-white/30">
                    <ImageIcon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="mb-2 text-xl font-black leading-tight">
                    Criar Post Enviando Foto de Produto
                  </h3>
                  <p className="text-sm font-medium leading-relaxed text-white/80">
                    Mande uma foto do seu produto e a IA gera imagem e texto profissionais para você usar.
                  </p>
                </button>

                {/* Botão 3 - Gerar Híbrido (Pessoa + Produto) */}
                <button
                  onClick={() => router.push("/dashboard/conteudo/gerar?mode=reference-hybrid")}
                  className="group relative flex flex-col items-start overflow-hidden rounded-[24px] bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-left text-white shadow-xl shadow-orange-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="absolute right-[-20px] top-[-20px] opacity-10 transition-transform duration-500 group-hover:scale-110">
                    <RefreshCw size={120} />
                  </div>
                  <div className="mb-4 rounded-2xl bg-white/20 p-3 transition-colors group-hover:bg-white/30">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="mb-2 text-xl font-black leading-tight">
                    Criar Post Enviando Imagem de Pessoa e Produto/Projeto
                  </h3>
                  <p className="text-sm font-medium leading-relaxed text-white/80">
                    Gere uma imagem juntando uma pessoa com um produto ou projeto em cenários de alta qualidade.
                  </p>
                </button>

                {/* Botão 4 - Conteúdo Manual */}
                <button
                  onClick={() => router.push("/dashboard/conteudo/criar")}
                  className="group relative flex flex-col items-start overflow-hidden rounded-[24px] bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-left text-white shadow-xl shadow-emerald-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="absolute right-[-20px] top-[-20px] opacity-10 transition-transform duration-500 group-hover:scale-110">
                    <UploadCloud size={120} />
                  </div>
                  <div className="mb-4 rounded-2xl bg-white/20 p-3 transition-colors group-hover:bg-white/30">
                    <Plus className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="mb-2 text-xl font-black leading-tight">Criar Post Manual</h3>
                  <p className="text-sm font-medium leading-relaxed text-white/80">
                    Envie sua própria imagem a ser postada, escreva sua legenda livremente e agende para as redes sociais.
                  </p>
                </button>
              </div>
            </div>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Clock className="h-5 w-5 text-blue-500" />
                  Publicações Agendadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-60 space-y-4 overflow-y-auto pr-3">
                  <AnimatePresence>
                    {isLoadingInitial ? (
                      <div className="flex h-24 items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
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
                      <div className="py-6 text-center text-gray-500">
                        <Clock className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                        <p>Nenhuma publicação agendada.</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <History className="h-5 w-5 text-purple-500" />
                  Histórico de Publicações
                </CardTitle>
                <Select
                  value={historyFilter}
                  onValueChange={(v) => setHistoryFilter(v as HistoryFilter)}
                >
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
                <div className="max-h-96 space-y-4 overflow-y-auto pr-3">
                  <AnimatePresence>
                    {isLoadingInitial ? (
                      <div className="flex h-40 items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
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
                      <div className="py-10 text-center text-gray-500">
                        <Facebook className="mx-auto mb-2 h-10 w-10 text-gray-400" />
                        <p>Nenhuma publicação encontrada no histórico.</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Sidebar Area */}
          <div className="space-y-8 lg:col-span-1">
            <Card className="border-none shadow-lg">
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

                <div className="mt-6 w-full border-t pt-4">
                  <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-green-500" /> Publicado
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-blue-500" /> Agendado
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-500" /> Falhou
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Conexões</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <ConnectionStatus
                  platform="facebook"
                  isConnected={metaConnection.isConnected}
                  accountName={metaConnection.pageName}
                  onConnect={handleConnectMeta}
                  onDisconnect={handleDisconnectMeta}
                  isLoading={isConnecting}
                />
                <Separator />
                <ConnectionStatus
                  platform="instagram"
                  isConnected={instagramConnection.isConnected}
                  accountName={
                    instagramConnection.instagramUsername
                      ? `@${instagramConnection.instagramUsername}`
                      : undefined
                  }
                  onConnect={handleConnectInstagram}
                  onDisconnect={handleDisconnectInstagram}
                  isLoading={checkingConnection}
                />
                <Separator />
                <ConnectionStatus
                  platform="linkedin"
                  isConnected={linkedinConnection.isConnected}
                  accountName={
                    linkedinConnection.publishTarget === "organization"
                      ? linkedinConnection.selectedOrganizationName || "Página corporativa"
                      : linkedinConnection.personName || "Perfil pessoal"
                  }
                  onConnect={handleConnectLinkedIn}
                  onDisconnect={handleDisconnectLinkedIn}
                  isLoading={checkingConnection}
                />
                {linkedinConnection.isConnected &&
                  linkedinConnection.organizations &&
                  linkedinConnection.organizations.length > 1 && (
                    <div className="ml-12 mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setPendingLinkedInOrgs(linkedinConnection.organizations || []);
                          setIsLinkedInSelectionModalOpen(true);
                        }}
                        className="text-xs font-medium text-[#0083C7] hover:underline"
                      >
                        Alterar Página do LinkedIn
                      </button>
                    </div>
                  )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
