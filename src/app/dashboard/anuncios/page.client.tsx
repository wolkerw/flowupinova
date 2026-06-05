"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Megaphone,
  TrendingUp,
  Sparkles,
  Target,
  DollarSign,
  Calendar,
  MapPin,
  Users,
  Check,
  Loader2,
  Eye,
  ArrowRight,
  Info,
  AlertCircle,
  HelpCircle,
  X,
  Play,
  Pause,
  Trash2,
  ChevronDown,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { BusinessProfileData } from "@/lib/services/business-profile-service";
import { getScheduledPosts } from "@/lib/services/posts-service";
import { getMetaConnection, updateMetaConnection } from "@/lib/services/meta-service";
import {
  createAdCampaign,
  getUserAdCampaigns,
  updateAdCampaignStatus,
  deleteAdCampaign,
  estimateReach,
  type AdCampaignData,
} from "@/lib/services/anuncios-service";
import Image from "next/image";
import { Timestamp } from "firebase/firestore";

interface SearchableSelectProps {
  options: { id: string; name: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
}

function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyMessage,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) setSearch("");
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.id === value);
  const filteredOptions = options.filter(
    (opt) =>
      opt.name.toLowerCase().includes(search.toLowerCase()) ||
      opt.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 shadow-sm hover:bg-slate-50 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all duration-200"
      >
        <span className="truncate font-medium text-slate-700">
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-500 shrink-0 ml-2 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1.5 max-h-64 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl flex flex-col animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="p-2 border-b border-slate-100 bg-slate-50 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-md border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-48 py-1 scrollbar-thin">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-3 text-xs text-slate-500 text-center italic">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.id === value;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onChange(opt.id);
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs hover:bg-slate-50 transition-colors ${
                      isSelected ? "bg-primary/5 text-primary font-semibold" : "text-slate-700"
                    }`}
                  >
                    <div className="flex flex-col truncate pr-2">
                      <span className="truncate">{opt.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal mt-0.5">ID: {opt.id}</span>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-primary shrink-0 ml-1" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface AnunciosPageClientProps {
  initialProfile: BusinessProfileData | null;
}

export default function AnunciosPageClient({ initialProfile }: AnunciosPageClientProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  // Dados principais
  const [publishedPosts, setPublishedPosts] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<AdCampaignData[]>([]);
  const [activeDashboardTab, setActiveDashboardTab] = useState<"active" | "history">("active");
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfileData | null>(initialProfile);
  const [adAccountId, setAdAccountId] = useState<string>("");
  const [adAccountName, setAdAccountName] = useState<string>("");

  // Conexão Meta Ads Pago
  const [metaConnection, setMetaConnection] = useState<any>({ isConnected: false });
  const [isConnectingMeta, setIsConnectingMeta] = useState(false);
  const [metaPages, setMetaPages] = useState<any[]>([]);
  const [metaAdAccounts, setMetaAdAccounts] = useState<any[]>([]);
  const [selectedPageId, setSelectedPageId] = useState("");
  const [selectedAdAccountIdState, setSelectedAdAccountIdState] = useState("");
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [exchangeToken, setExchangeToken] = useState("");
  const [pageSearchTerm, setPageSearchTerm] = useState("");
  const [adAccountSearchTerm, setAdAccountSearchTerm] = useState("");

  const effectRan = useRef(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Estados do Wizard/Criação
  const [isCreating, setIsCreating] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isChoosePostModalOpen, setIsChoosePostModalOpen] = useState(false);

  // Inputs do Formulário
  const [adName, setAdName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [ctaType, setCtaType] = useState<any>("WHATSAPP");
  const [platforms, setPlatforms] = useState<Array<"instagram" | "facebook">>(["instagram", "facebook"]);
  const [radius, setRadius] = useState<number>(5);
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 55]);
  const [gender, setGender] = useState<"all" | "male" | "female">("all");
  const [dailyBudget, setDailyBudget] = useState<number>(15);
  const [duration, setDuration] = useState<number>(7);
  const [addressInput, setAddressInput] = useState("");
  const [customDestination, setCustomDestination] = useState("");
  const [campaignObjective, setCampaignObjective] = useState<"REACH" | "TRAFFIC">("REACH");
  const [hasDestination, setHasDestination] = useState(false);
  const [metaLocationsSuggestions, setMetaLocationsSuggestions] = useState<any[]>([]);
  const [selectedCoords, setSelectedCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedLocType, setSelectedLocType] = useState<string | null>(null);
  const [isSearchingLocations, setIsSearchingLocations] = useState(false);
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false);
  const mapInstanceRef = useRef<any>(null);
  const mapMarkerRef = useRef<any>(null);
  const mapCircleRef = useRef<any>(null);

  const handleAddressInputChange = (val: string) => {
    setAddressInput(val);
    setSelectedCoords(null);
    setSelectedLocType(null);
    if (val.length < 3) {
      setMetaLocationsSuggestions([]);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearchingLocations(true);
      try {
        const res = await fetch(`/api/ads/locations?q=${encodeURIComponent(val)}`);
        const data = await res.json();
        if (data.success) {
          setMetaLocationsSuggestions(data.locations || []);
        }
      } catch (err) {
        console.warn("Erro ao buscar localizações:", err);
      } finally {
        setIsSearchingLocations(false);
      }
    }, 400); // 400ms debounce
  };

  useEffect(() => {
    if (businessProfile && !customDestination) {
      setCustomDestination(businessProfile.website || businessProfile.instagram || "");
    }
  }, [businessProfile, customDestination]);

  // 1. Carrega scripts e estilos do Leaflet dinamicamente para o Mapa Visual
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ((window as any).L) {
      setIsLeafletLoaded(true);
      return;
    }

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    if (!document.getElementById("leaflet-js")) {
      const script = document.createElement("script");
      script.id = "leaflet-js";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = () => {
        setIsLeafletLoaded(true);
      };
      document.head.appendChild(script);
    } else {
      setIsLeafletLoaded(true);
    }
  }, []);

  // 2. Tenta geocodificar o endereço do perfil de negócios quando o Passo 3 inicia sem coordenadas selecionadas
  useEffect(() => {
    if (currentStep === 3 && !selectedCoords && businessProfile?.address) {
      const geocodeProfileAddress = async () => {
        try {
          const res = await fetch(`/api/ads/locations?q=${encodeURIComponent(businessProfile.address)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.locations && data.locations.length > 0) {
              const loc = data.locations[0];
              setSelectedCoords({ latitude: loc.latitude, longitude: loc.longitude });
              setSelectedLocType(loc.type);
              setAddressInput(loc.name);
            }
          }
        } catch (err) {
          console.warn("Erro ao geocodificar endereço inicial do perfil:", err);
        }
      };
      geocodeProfileAddress();
    }
  }, [currentStep, businessProfile, selectedCoords]);

  // 3. Inicializa e sincroniza o mapa Leaflet
  useEffect(() => {
    if (!isLeafletLoaded || currentStep !== 3 || typeof window === "undefined") return;

    const L = (window as any).L;
    if (!L) return;

    let initialLat = selectedCoords?.latitude || -30.0346;
    let initialLng = selectedCoords?.longitude || -51.2177;
    let zoomLevel = selectedCoords ? 14 : 12;

    const mapContainer = document.getElementById("targeting-map");
    if (!mapContainer) return;

    if (mapInstanceRef.current) {
      if (selectedCoords) {
        const newLatLng = new L.LatLng(selectedCoords.latitude, selectedCoords.longitude);
        mapInstanceRef.current.setView(newLatLng, mapInstanceRef.current.getZoom());

        if (mapMarkerRef.current) {
          mapMarkerRef.current.setLatLng(newLatLng);
        }
        if (mapCircleRef.current) {
          mapCircleRef.current.setLatLng(newLatLng);
          mapCircleRef.current.setRadius(radius * 1000);
        }
      }
      return;
    }

    const map = L.map("targeting-map", {
      center: [initialLat, initialLng],
      zoom: zoomLevel,
      zoomControl: true,
    });
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const pinSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#0284c7" width="36" height="36"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
    const customPinIcon = L.icon({
      iconUrl: 'data:image/svg+xml;base64,' + btoa(pinSvg),
      iconSize: [36, 36],
      iconAnchor: [18, 36],
    });

    const marker = L.marker([initialLat, initialLng], {
      icon: customPinIcon,
      draggable: true,
    }).addTo(map);
    mapMarkerRef.current = marker;

    const circle = L.circle([initialLat, initialLng], {
      color: "#0284c7",
      fillColor: "#0284c7",
      fillOpacity: 0.15,
      radius: radius * 1000,
    }).addTo(map);
    mapCircleRef.current = circle;

    const updateLocationFromCoords = async (lat: number, lng: number) => {
      setSelectedCoords({ latitude: lat, longitude: lng });
      setSelectedLocType("Endereço");

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          {
            headers: {
              "User-Agent": "NumVaptAdsApp/1.0",
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          if (data && data.display_name) {
            let cleanAddress = data.display_name.replace(", Brasil", "").replace(", Brazil", "");
            setAddressInput(cleanAddress);
          }
        }
      } catch (err) {
        console.warn("Falha ao geocodificar reversamente:", err);
        setAddressInput(`Pin no Mapa: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
    };

    marker.on("dragend", async (e: any) => {
      const position = e.target.getLatLng();
      circle.setLatLng(position);
      await updateLocationFromCoords(position.lat, position.lng);
    });

    map.on("click", async (e: any) => {
      const position = e.latlng;
      marker.setLatLng(position);
      circle.setLatLng(position);
      await updateLocationFromCoords(position.lat, position.lng);
    });

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        mapMarkerRef.current = null;
        mapCircleRef.current = null;
      }
    };
  }, [isLeafletLoaded, currentStep, selectedCoords]);

  // 4. Atualiza o círculo do mapa quando o raio é alterado no slider
  useEffect(() => {
    if (mapCircleRef.current) {
      mapCircleRef.current.setRadius(radius * 1000);
    }
  }, [radius]);

  // Estados de IA e Carregamento
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Carrega campanhas e posts publicados
  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setLoadingPosts(true);
    try {
      // Buscar posts e filtrar apenas publicados
      const postsResult = await getScheduledPosts(user.uid);
      const filteredPosts = postsResult
        .filter((r: any) => r.success && r.post && r.post.status === "published")
        .map((r: any) => r.post);
      setPublishedPosts(filteredPosts);
      setLoadingPosts(false);

      // Buscar conexão da Meta
      const metaConn = await getMetaConnection(user.uid);
      setMetaConnection(metaConn);
      if (metaConn.userAccessToken) {
        setExchangeToken(metaConn.userAccessToken);
      }
      if (metaConn.isConnected && metaConn.adAccountId) {
        setAdAccountId(metaConn.adAccountId);
        setAdAccountName(metaConn.adAccountName || "");

        // Buscar campanhas reais e insights diretamente da Meta Ads API em tempo real
        const campaignsRes = await fetch("/api/ads/campaigns");
        const campaignsData = await campaignsRes.json();
        if (campaignsData.success) {
          setCampaigns(campaignsData.campaigns || []);
        } else {
          console.warn("Falha ao buscar campanhas reais da Meta:", campaignsData.error);
        }
      } else {
        setCampaigns([]);
      }
    } catch (err) {
      console.error("Erro ao carregar dados da página:", err);
      toast({
        variant: "destructive",
        title: "Erro de Carregamento",
        description: "Não conseguimos sincronizar seus posts ou anúncios pagos.",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fluxo de conexão autônomo Meta Ads (Vendas/Pago)
  const handleConnectMetaAds = () => {
    const clientId = process.env.NEXT_PUBLIC_META_APP_ID || "826418333144156";
    const configId = process.env.NEXT_PUBLIC_META_CONFIG_ID;
    const origin = window.location.origin;
    const redirectUri = `${origin}/dashboard/anuncios`;
    
    let authUrl = "";
    if (configId) {
      // Usando Facebook Login para Empresas com ID de Configuração
      authUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${user?.uid}&config_id=${configId}&response_type=code&override_default_response_type=true`;
    } else {
      // Fallback para Login tradicional com escopos manuais
      const scope = [
        "pages_show_list",
        "pages_read_engagement",
        "ads_management",
        "ads_read",
        "business_management"
      ].join(",");
      authUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${user?.uid}&scope=${scope}&response_type=code`;
    }
    
    window.location.href = authUrl;
  };

  const runMetaAdsConnectionFlow = async (code: string) => {
    if (!user) return;
    setIsConnectingMeta(true);
    try {
      toast({
        title: "Autenticando com a Meta",
        description: "Obtendo chaves de acesso com segurança.",
      });

      // 1. Trocar código por Token de Longo Prazo
      const tokenResponse = await fetch("/api/meta/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          code, 
          origin: `${window.location.origin}/dashboard/anuncios`,
          redirectUri: `${window.location.origin}/dashboard/anuncios`
        }),
      });
      const tokenResult = await tokenResponse.json();
      if (!tokenResult.success) throw new Error(tokenResult.error);
      const { userAccessToken } = tokenResult;

      setExchangeToken(userAccessToken);

      // 2. Salvar estado temporário/pending no Firestore connections/meta
      await updateMetaConnection(user.uid, {
        userAccessToken,
        pending: true,
      });

      // 3. Buscar Páginas Comerciais
      const pagesResponse = await fetch("/api/meta/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userAccessToken }),
      });
      const pagesResult = await pagesResponse.json();
      if (!pagesResult.success) throw new Error(pagesResult.error);
      const pages = pagesResult.pages || [];
      setMetaPages(pages);
      if (pages.length > 0) setSelectedPageId(pages[0].id);

      // 4. Buscar Contas de Anúncios (usa o userAccessToken salvo no pending)
      const accountsResponse = await fetch("/api/ads/accounts");
      const accountsResult = await accountsResponse.json();
      if (!accountsResult.success) throw new Error(accountsResult.error);
      const accounts = accountsResult.accounts || [];
      setMetaAdAccounts(accounts);
      if (accounts.length > 0) setSelectedAdAccountIdState(accounts[0].id);

      // Limpar parâmetros da URL
      window.history.replaceState({}, document.title, window.location.pathname);

      // Abrir o Modal Unificado de Configuração
      setIsSetupModalOpen(true);

    } catch (err: any) {
      console.error("Erro na conexão Meta Ads:", err);
      toast({
        variant: "destructive",
        title: "Erro na Conexão Meta Ads",
        description: err.message || "Tente novamente mais tarde.",
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    } finally {
      setIsConnectingMeta(false);
    }
  };

  const handleSaveMetaAdsConnection = async () => {
    if (!user || !exchangeToken || !selectedPageId || !selectedAdAccountIdState) {
      toast({
        variant: "destructive",
        title: "Seleção Incompleta",
        description: "Selecione uma página comercial e uma conta de anúncios ativa.",
      });
      return;
    }

    setIsConnectingMeta(true);
    try {
      const selectedPage = metaPages.find((p) => p.id === selectedPageId);
      const selectedAcc = metaAdAccounts.find((a) => a.id === selectedAdAccountIdState);

      if (!selectedPage || !selectedAcc) {
        throw new Error("Seleções inválidas. Tente novamente.");
      }

      // Salvar conexão definitiva no Firestore
      await updateMetaConnection(user.uid, {
        isConnected: true,
        userAccessToken: exchangeToken,
        accessToken: selectedPage.access_token,
        pageId: selectedPage.id,
        pageName: selectedPage.name,
        adAccountId: selectedAcc.id,
        adAccountName: selectedAcc.name,
      });

      toast({
        title: "Integração Concluída",
        description: `Conectado com sucesso à página "${selectedPage.name}" e conta de anúncios "${selectedAcc.name}".`,
      });

      setIsSetupModalOpen(false);
      fetchData();

    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro ao Salvar Integração",
        description: err.message || "Tente novamente mais tarde.",
      });
    } finally {
      setIsConnectingMeta(false);
    }
  };

  const handleDisconnectMetaAds = async () => {
    if (!user) return;
    if (confirm("Tem certeza que deseja desconectar a conta de anúncios da Meta? Isso removerá a visualização das métricas.")) {
      await updateMetaConnection(user.uid, { isConnected: false });
      setAdAccountId("");
      setAdAccountName("");
      setMetaConnection({ isConnected: false });
      fetchData();
      toast({ title: "Desconectado", description: "A integração com o Meta Ads foi removida." });
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && user) {
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get("code");
      if (code && !effectRan.current) {
        effectRan.current = true;
        runMetaAdsConnectionFlow(code);
      }
    }
  }, [user]);

  // Função para chamar o Ad Copilot (Gemini)
  const handleGenerateAICopy = async () => {
    if (!selectedPost) return;
    setIsGeneratingCopy(true);
    setAiSuggestions([]);

    try {
      const response = await fetch("/api/anuncios/gerar-copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segmento: businessProfile?.category || "Comércio Geral",
          descricaoNegocio: businessProfile?.description || "",
          textoPost: selectedPost.text,
          objetivo: campaignObjective === "TRAFFIC" ? "LINK_CLICKS" : "ENGAGEMENT",
        }),
      });

      if (!response.ok) throw new Error("Falha na chamada de IA.");
      const data = await response.json();
      if (data && data.sugestoes) {
        setAiSuggestions(data.sugestoes);
        toast({
          title: "Sugestões Prontas",
          description: "O Gemini gerou 3 excelentes sugestões de anúncios para você.",
        });
      }
    } catch (err) {
      console.error("Erro ao gerar sugestões de copy:", err);
      toast({
        variant: "destructive",
        title: "Erro do Ad Copilot",
        description: "Não conseguimos gerar sugestões personalizadas de IA no momento.",
      });
    } finally {
      setIsGeneratingCopy(false);
    }
  };

  // Preenche dados ao selecionar um post para impulsionar
  const handleSelectPostToBoost = (post: any) => {
    setSelectedPost(post);
    setHeadline("Aproveite nossa oferta especial!");
    setBodyText(post.text);
    const cleanText = post.text.replace(/[\n\r]+/g, " ");
    const startDesc = cleanText.length > 25 ? `${cleanText.substring(0, 25)}...` : cleanText;
    setAdName(`[NUMVAPT] ${startDesc}`);
    setAiSuggestions([]);
    setCurrentStep(1);
    setIsCreating(true);
    setIsChoosePostModalOpen(false);
  };

  // Confirma e envia para o Firestore
  const handleActivateCampaign = async () => {
    if (!user || !selectedPost) return;

    if (!adAccountId) {
      toast({
        variant: "destructive",
        title: "Conta de Anúncios Requerida",
        description: "Selecione uma conta de anúncios ativa nas configurações antes de ativar o anúncio.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Nomenclatura dinâmica automática baseada no início da descrição se o nome estiver vazio
      const finalAdName = adName || (bodyText ? (bodyText.length > 25 ? `${bodyText.substring(0, 25)}...` : bodyText) : "Impulsionamento Rápido Meta");

      // Mapeia e prepara o link de destino e tipo de CTA para compatibilidade total Meta Ads
      let backendCtaType = "NONE";
      let backendCtaLink = "";

      if (hasDestination) {
        backendCtaType = "LEARN_MORE"; // Padronizado em Saiba Mais
        backendCtaLink = customDestination;
        if (backendCtaLink && !/^https?:\/\//i.test(backendCtaLink)) {
          backendCtaLink = `https://${backendCtaLink}`;
        }
      }

      // 1. Chamar API de Orquestração Real na Meta
      const publishRes = await fetch("/api/ads/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: finalAdName,
          postId: selectedPost.id,
          campaignObjective, // Envia REACH ou TRAFFIC para o backend
          creative: {
            headline,
            bodyText,
            imageUrl: selectedPost.imageUrl || selectedPost.imageUrls?.[0] || "",
            ctaType: backendCtaType,
            ctaLink: backendCtaLink,
          },
          budget: {
            amount: dailyBudget,
          },
          durationDays: duration,
          targeting: {
            address: addressInput || "Centro Comercial Local",
            radiusKm: radius,
            ageMin: ageRange[0],
            ageMax: ageRange[1],
            gender,
            latitude: selectedCoords?.latitude || null,
            longitude: selectedCoords?.longitude || null,
          },
        }),
      });

      const publishData = await publishRes.json();
      if (!publishRes.ok || !publishData.success) {
        throw new Error(publishData.error || "Erro ao publicar anúncio na API da Meta.");
      }

      // 2. Salvar dados finais com IDs reais no Firestore
      const campaignData: Omit<AdCampaignData, "userId" | "createdAt" | "updatedAt"> = {
        postId: selectedPost.id,
        name: finalAdName,
        status: "active",
        platforms,
        metaCampaignId: publishData.metaCampaignId,
        metaAdSetId: publishData.metaAdSetId,
        metaAdId: publishData.metaAdId,
        adAccountId: publishData.adAccountId,
        creative: {
          headline,
          bodyText,
          imageUrl: selectedPost.imageUrl || selectedPost.imageUrls?.[0] || "",
          ctaType: backendCtaType as any,
          ctaLink: backendCtaLink,
        },
        budget: {
          type: "daily",
          amount: dailyBudget,
          currency: "BRL",
        },
        durationDays: duration,
        startDate: Timestamp.now(),
        endDate: Timestamp.fromMillis(Date.now() + duration * 24 * 60 * 60 * 1000),
        targeting: {
          address: addressInput || "Centro Comercial Local",
          radiusKm: radius,
          ageMin: ageRange[0],
          ageMax: ageRange[1],
          gender,
        },
        metrics: {
          impressions: 0,
          clicks: 0,
          actions: 0,
          amountSpent: 0,
          lastSyncedAt: Timestamp.now(),
        },
      };

      const result = await createAdCampaign(user.uid, campaignData);
      if (result.success) {
        toast({
          title: "Anúncio Publicado com Sucesso",
          description: "Seu post foi impulsionado! A Meta já está veiculando sua campanha.",
        });
        setIsCreating(false);
        fetchData();
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      console.error("Erro ao ativar campanha:", err);
      toast({
        variant: "destructive",
        title: "Erro ao Publicar na Meta",
        description: err.message || "Não conseguimos enviar os criativos para a Meta. Tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Alterna o status da campanha (Pausar / Ativar) na Meta Ads API
  const handleToggleStatus = async (campaign: AdCampaignData) => {
    if (!user || !campaign.metaCampaignId) return;
    const newStatus = campaign.status === "active" ? "paused" : "active";
    try {
      const res = await fetch("/api/ads/campaigns", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: campaign.id,
          metaCampaignId: campaign.metaCampaignId,
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: newStatus === "active" ? "Anúncio Ativado!" : "Anúncio Pausado!",
          description: `O anúncio foi ${newStatus === "active" ? "ativado" : "pausado"} na Meta com sucesso.`,
        });
        fetchData();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro ao alterar status",
        description: err.message || "Não foi possível atualizar o status do anúncio na Meta.",
      });
    }
  };

  // Exclui a campanha de anúncio na Meta e no Firestore
  const handleDeleteCampaign = async (campaign: AdCampaignData) => {
    if (!user || !campaign.metaCampaignId) return;
    if (confirm("Tem certeza que deseja remover esta campanha de anúncio da Meta e do seu histórico?")) {
      try {
        const res = await fetch(`/api/ads/campaigns?campaignId=${campaign.id}&metaCampaignId=${campaign.metaCampaignId}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (data.success) {
          toast({
            title: "Campanha Removida",
            description: "A campanha foi deletada com sucesso da sua conta de anúncios da Meta.",
          });
          fetchData();
        } else {
          throw new Error(data.error);
        }
      } catch (err: any) {
        toast({
          variant: "destructive",
          title: "Erro ao excluir",
          description: err.message || "Não foi possível remover a campanha na Meta.",
        });
      }
    }
  };

  // Cálculos dinâmicos da estimativa
  const reach = estimateReach(dailyBudget, duration, radius);

  // Tradução simples de status para leigos
  const getStatusBadge = (status: AdCampaignData["status"]) => {
    const configs = {
      active: { label: "Veiculando", color: "bg-green-500 text-white" },
      paused: { label: "Pausado", color: "bg-yellow-500 text-white" },
      draft: { label: "Rascunho", color: "bg-slate-400 text-white" },
      completed: { label: "Concluído", color: "bg-blue-500 text-white" },
      failed: { label: "Rejeitado", color: "bg-red-500 text-white" },
      pending_payment: { label: "Aguardando", color: "bg-orange-500 text-white" },
    };
    const c = configs[status] || { label: status, color: "bg-slate-500 text-white" };
    return <Badge className={`${c.color} border-none font-semibold px-2 py-0.5`}>{c.label}</Badge>;
  };

  // Nome abreviado do avatar fallback
  const getAvatarFallback = () => {
    if (businessProfile?.name) return businessProfile.name.substring(0, 2).toUpperCase();
    return "NV";
  };

  // Tradutor de CTAs
  const getCtaLabel = (cta: string, link?: string) => {
    if (link && link.includes("wa.me")) {
      return "Falar no WhatsApp";
    }
    const ctas: Record<string, string> = {
      SEND_MESSAGE: "Enviar Mensagem (WhatsApp)",
      LEARN_MORE: "Saiba Mais (Site/Instagram)",
      CALL_NOW: "Ligar Agora",
      GET_DIRECTIONS: "Como Chegar (Mapa)",
      SHOP_NOW: "Comprar Agora",
    };
    return ctas[cta] || "Saiba Mais";
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl font-sans text-slate-800">
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          {metaConnection.isConnected && metaConnection.adAccountId ? (
            <>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-poppins flex items-center gap-3">
                <Megaphone className="h-8 w-8 text-primary" />
                Seus Impulsionamentos
              </h1>
              <p className="text-slate-500 mt-1 max-w-2xl font-inter text-sm">
                Gerencie anúncios locais e acompanhe seus resultados reais no Instagram e Facebook.
              </p>
              <div className="flex items-center gap-2 mt-2.5 text-xs text-slate-400 font-medium">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-650 font-semibold border border-slate-200/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                  Conta: {adAccountName} ({adAccountId})
                </span>
                <button
                  onClick={handleDisconnectMetaAds}
                  className="text-slate-400 hover:text-red-500 transition-colors ml-1 font-bold underline decoration-dotted"
                >
                  Desconectar
                </button>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-poppins flex items-center gap-3">
                <Megaphone className="h-8 w-8 text-primary" />
                Anúncios Pagos (Meta Ads)
              </h1>
              <p className="text-slate-500 mt-1 max-w-2xl font-inter text-sm">
                Atraia clientes ideais na sua vizinhança! Impulsione suas melhores publicações no Instagram e Facebook de forma descomplicada, inteligente e sem jargões complexos.
              </p>
            </>
          )}
        </div>
        {!isCreating &&
          metaConnection.isConnected &&
          metaConnection.adAccountId &&
          publishedPosts.length > 0 &&
          (campaigns.filter((c) => c.status === "active").length > 0 || activeDashboardTab === "history") && (
            <Button
              onClick={() => setIsChoosePostModalOpen(true)}
              className="bg-primary hover:bg-primary/95 text-white font-bold px-6 py-3 rounded-lg shadow-sm font-poppins text-sm transition-transform duration-200 active:scale-95 shrink-0"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Impulsionar Post
            </Button>
          )}
      </div>

      {/* ONBOARDING / CONFIGURAÇÃO DE CONEXÃO META ADS */}
      {!isCreating && user && (
        <div className="mb-8">
          {isConnectingMeta ? (
            <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-sm font-semibold text-slate-600">Processando conexão com a Meta...</span>
            </div>
          ) : metaConnection.isConnected && metaConnection.adAccountId ? null : metaConnection.isConnected ? (
            <div className="p-6 rounded-xl border border-blue-500/15 bg-blue-50/10 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all duration-300 hover:shadow-lg">
              <div className="flex items-start md:items-center gap-4">
                <div className="bg-blue-500/10 text-blue-600 p-3 rounded-xl animate-pulse">
                  <Megaphone className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-900 leading-tight">Facebook Conectado</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
                    Sua conta do Facebook está conectada. Agora, selecione qual conta de anúncios ativa receberá as cobranças e os seus impulsionamentos.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => {
                  setIsSetupModalOpen(true);
                  if (metaPages.length === 0 || metaAdAccounts.length === 0) {
                    setIsConnectingMeta(true);
                    fetch("/api/meta/callback", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ userAccessToken: metaConnection.userAccessToken || metaConnection.accessToken })
                    })
                    .then(res => res.json())
                    .then(pagesResult => {
                      if (pagesResult.success) {
                        setMetaPages(pagesResult.pages || []);
                        if (pagesResult.pages?.length > 0) setSelectedPageId(pagesResult.pages[0].id);
                      }
                      return fetch("/api/ads/accounts");
                    })
                    .then(res => res.json())
                    .then(accountsResult => {
                      if (accountsResult.success) {
                        setMetaAdAccounts(accountsResult.accounts || []);
                        if (accountsResult.accounts?.length > 0) setSelectedAdAccountIdState(accountsResult.accounts[0].id);
                      }
                    })
                    .catch(e => console.error("Erro ao buscar ativos:", e))
                    .finally(() => setIsConnectingMeta(false));
                  }
                }}
                className="bg-primary hover:bg-primary/95 text-white font-bold text-xs px-6 py-3 rounded-lg shadow-sm font-poppins transition-transform duration-200 active:scale-95 flex items-center gap-2"
              >
                Configurar Conta de Cobrança
              </Button>
            </div>
          ) : (
            <div className="p-6 rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/50 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all duration-300 hover:shadow-lg">
              <div className="flex items-start md:items-center gap-4">
                <div className="bg-primary/10 text-primary p-3 rounded-xl">
                  <Megaphone className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-900 leading-tight">Anúncios e Impulsionamento (Meta Ads)</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
                    Deseja atrair mais clientes e aumentar suas vendas? Conecte sua conta do Facebook para anúncios para começar a impulsionar seus melhores posts no Instagram e Facebook com segmentação precisa.
                  </p>
                </div>
              </div>
              <Button
                onClick={handleConnectMetaAds}
                className="bg-primary hover:bg-primary/95 text-white font-bold text-xs px-6 py-3 rounded-lg shadow-sm font-poppins transition-transform duration-200 active:scale-95 flex items-center gap-2"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Conectar Conta de Anúncios
              </Button>
            </div>
          )}
        </div>
      )}

      {/* MODAL UNIFICADO DE CONFIGURAÇÃO META ADS */}
      <Dialog open={isSetupModalOpen} onOpenChange={setIsSetupModalOpen}>
        <DialogContent className="max-w-md font-sans">
          <DialogHeader>
            <DialogTitle className="font-poppins font-bold text-slate-900 text-lg flex items-center gap-2">
              Configurar Conta do Meta Ads
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Conexão com a Meta realizada! Agora selecione a página e a conta de anúncios que você deseja usar para promover seus posts.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 my-4">
            {/* Seletor de Página */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">1. Selecione a Página comercial do Facebook</Label>
              {metaPages.length === 0 ? (
                <p className="text-xs text-red-500 bg-red-50 p-2.5 rounded-lg">
                  Nenhuma página comercial encontrada. Certifique-se de que você é administrador de alguma página no Facebook.
                </p>
              ) : (
                <SearchableSelect
                  options={metaPages}
                  value={selectedPageId}
                  onChange={setSelectedPageId}
                  placeholder="Selecione uma Página..."
                  searchPlaceholder="🔍 Buscar página por nome..."
                  emptyMessage="Nenhuma página encontrada"
                />
              )}
            </div>

            {/* Seletor de Ad Account */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">2. Selecione a sua Conta de Anúncios (Cobrança)</Label>
              {metaAdAccounts.length === 0 ? (
                <p className="text-xs text-red-500 bg-red-50 p-2.5 rounded-lg">
                  Nenhuma conta de anúncios encontrada. Você precisa criar uma conta de anúncios no Gerenciador de Anúncios do Facebook antes de prosseguir.
                </p>
              ) : (
                <SearchableSelect
                  options={metaAdAccounts}
                  value={selectedAdAccountIdState}
                  onChange={setSelectedAdAccountIdState}
                  placeholder="Selecione uma Conta..."
                  searchPlaceholder="🔍 Buscar conta por nome ou ID..."
                  emptyMessage="Nenhuma conta encontrada"
                />
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsSetupModalOpen(false)}
              className="rounded-lg text-xs font-bold"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveMetaAdsConnection}
              disabled={isConnectingMeta || metaPages.length === 0 || metaAdAccounts.length === 0}
              className="bg-primary hover:bg-primary/95 text-white font-bold text-xs px-5 py-2 rounded-lg"
            >
              {isConnectingMeta ? "Salvando..." : "Concluir Integração"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TELA DE CRIAÇÃO (WIZARD GUIADO) */}
      {isCreating && selectedPost && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-8">
          
          {/* Cabeçalho do Wizard */}
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="bg-primary/10 text-primary h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm">
                {currentStep}
              </span>
              <div>
                <h3 className="font-bold text-slate-900 font-poppins text-base">Impulsionando Post</h3>
                <p className="text-xs text-slate-500">Passo {currentStep} de 4</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCreating(false)}
              className="text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Barra de Progresso Visível e Sutil */}
          <div className="h-1 bg-slate-100 w-full">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12">
            
            {/* COLUNA ESQUERDA: FORMULÁRIO (7 colunas) */}
            <div className="lg:col-span-7 p-6 border-r border-slate-200">
              
              {/* PASSO 1: ESCOLHER OBJETIVO PRINCIPAL */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 font-poppins flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      1. Qual é o objetivo do seu impulsionamento?
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Selecione o principal resultado desejado. O NumVapt otimizará as configurações técnicas de forma personalizada.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 mt-2">
                    {/* Opção Alcance */}
                    <div
                      onClick={() => setCampaignObjective("REACH")}
                      className={`p-5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between text-left group relative overflow-hidden shadow-sm ${
                        campaignObjective === "REACH"
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-slate-200 bg-white hover:border-primary/50 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="flex gap-4 items-start z-10">
                        <div className={`p-3 rounded-xl ${campaignObjective === "REACH" ? "bg-primary/20 text-primary" : "bg-slate-100 text-slate-600"}`}>
                          <Megaphone className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-extrabold text-slate-900 group-hover:text-primary transition-colors">
                              Mais Visualizações (Alcance)
                            </span>
                            {campaignObjective === "REACH" && (
                              <Badge className="bg-primary hover:bg-primary text-white text-[9px] scale-90 py-0 font-medium">Ativo</Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed max-w-lg">
                            Exiba seu anúncio para o maior número possível de pessoas, aumentando a visibilidade e o reconhecimento do seu negócio ou marca na região selecionada.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Opção Tráfego */}
                    <div
                      onClick={() => setCampaignObjective("TRAFFIC")}
                      className={`p-5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between text-left group relative overflow-hidden shadow-sm ${
                        campaignObjective === "TRAFFIC"
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-slate-200 bg-white hover:border-primary/50 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="flex gap-4 items-start z-10">
                        <div className={`p-3 rounded-xl ${campaignObjective === "TRAFFIC" ? "bg-primary/20 text-primary" : "bg-slate-100 text-slate-600"}`}>
                          <TrendingUp className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-extrabold text-slate-900 group-hover:text-primary transition-colors">
                              Mais Cliques no Link (Tráfego)
                            </span>
                            {campaignObjective === "TRAFFIC" && (
                              <Badge className="bg-primary hover:bg-primary text-white text-[9px] scale-90 py-0 font-medium">Ativo</Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed max-w-lg">
                            Otimizado para gerar o máximo de cliques qualificados no seu anúncio. Ideal para direcionar potenciais clientes para o seu site, WhatsApp ou perfil.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* PASSO 2: EDITAR CONTEÚDO E ASSISTENTE DE IA */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 font-poppins flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      2. O que seu anúncio vai dizer?
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Escreva ou use nossa inteligência artificial para criar legendas de alta performance que engajam moradores locais!
                    </p>
                  </div>

                  {/* Nome Interno */}
                  <div className="space-y-2">
                    <Label htmlFor="ad-name" className="text-sm font-bold text-slate-700">Nome da Campanha (Apenas para seu controle)</Label>
                    <Input
                      id="ad-name"
                      value={adName}
                      onChange={(e) => setAdName(e.target.value)}
                      onFocus={() => setFocusedField("adName")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Ex: [NUMVAPT] Promoção de Inverno"
                      className="rounded-lg border-slate-200 text-sm focus:ring-primary focus:border-primary"
                    />
                    <p className="text-[10px] text-slate-400">
                      Este nome é 100% interno e não aparecerá para os clientes nas redes sociais.
                    </p>
                  </div>

                  {/* Legenda (Texto Principal) */}
                  <div className="space-y-2">
                    <Label htmlFor="ad-body" className="text-sm font-bold text-slate-700">Texto Principal do Anúncio (Legenda)</Label>
                    <Textarea
                      id="ad-body"
                      value={bodyText}
                      onChange={(e) => setBodyText(e.target.value)}
                      onFocus={() => setFocusedField("bodyText")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Escreva a legenda atrativa que aparecerá acima da imagem do anúncio..."
                      rows={5}
                      className="rounded-lg border-slate-200 text-sm resize-none focus:ring-primary focus:border-primary"
                    />
                  </div>



                  {/* Link de Destino Opcional (Alcance) ou Obrigatório (Tráfego) */}
                  <div className="space-y-4 pt-2">
                    {campaignObjective === "REACH" ? (
                      <div className="space-y-2 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="toggle-destination"
                            checked={hasDestination}
                            onChange={(e) => setHasDestination(e.target.checked)}
                            className="h-4.5 w-4.5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                          />
                          <Label htmlFor="toggle-destination" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                            Adicionar link do seu site
                          </Label>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-normal pl-7.5">
                          Ao ativar, adicionamos o botão <strong>"Saiba mais"</strong> no seu anúncio para levar as pessoas diretamente ao seu site. Se preferir deixar desativado, o anúncio será exibido sem botão, focando exclusivamente em alcançar e ser visto pelo maior número possível de pessoas na sua região.
                        </p>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-lg bg-blue-50/20 border border-blue-500/10">
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          O link do seu site é obrigatório nesta campanha para habilitar o botão <strong>"Saiba mais"</strong> e direcionar os potenciais clientes.
                        </p>
                      </div>
                    )}

                    {/* Input de URL de Destino */}
                    {(hasDestination || campaignObjective === "TRAFFIC") && (
                      <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-1 duration-200">
                        <Label htmlFor="destination-url" className="text-xs font-bold text-slate-800">
                          Link do seu site
                        </Label>
                        <Input
                          id="destination-url"
                          value={customDestination}
                          onChange={(e) => setCustomDestination(e.target.value)}
                          onFocus={() => setFocusedField("destinationUrl")}
                          onBlur={() => setFocusedField(null)}
                          placeholder="seusite.com.br"
                          className="bg-white border-slate-200 text-sm focus:ring-primary focus:border-primary"
                        />
                      </div>
                    )}
                  </div>

                  {/* Título Chamativo (Exibido apenas quando tem destino/botão ativo) */}
                  {(hasDestination || campaignObjective === "TRAFFIC") && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="ad-headline" className="text-sm font-bold text-slate-700">Título do Anúncio (Fica abaixo da imagem)</Label>
                        <span className="text-[10px] text-slate-400">
                          {headline.length}/40 caracteres
                        </span>
                      </div>
                      <Input
                        id="ad-headline"
                        value={headline}
                        onChange={(e) => setHeadline(e.target.value)}
                        onFocus={() => setFocusedField("headline")}
                        onBlur={() => setFocusedField(null)}
                        placeholder="Ex: Hambúrguer Artesanal Perto de Você!"
                        maxLength={40}
                        className="rounded-lg border-slate-200 text-sm focus:ring-primary focus:border-primary"
                      />
                      <p className="text-[10px] text-slate-400">
                        Este título será exibido em destaque no anúncio, ao lado do botão <strong>"Saiba mais"</strong>.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* PASSO 3: TARGETING E SEGMENTAÇÃO LOCAL */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 font-poppins flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      3. Onde seu anúncio vai aparecer?
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Moradores próximos do seu negócio físico são os que mais geram vendas! Defina o raio ao redor da sua loja.
                    </p>
                  </div>

                  <div className="space-y-4">
                    
                    {/* Localização Híbrida (Qualquer endereço, rua, bairro, cidade ou estado) */}
                    <div className="space-y-2 relative">
                      <Label className="text-sm font-bold text-slate-700 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-poppins">
                          <MapPin className="h-4 w-4 text-primary" /> Onde seu anúncio vai aparecer? (Região ou Endereço)
                        </span>
                      </Label>
                      <p className="text-[11px] text-slate-500 leading-normal mb-1">
                        Você pode digitar um <strong>endereço exato (rua/avenida)</strong>, <strong>bairro</strong>, <strong>cidade</strong> ou <strong>estado</strong> e selecionar na lista recomendada.
                      </p>
                      <div className="relative">
                        <Input
                          value={addressInput}
                          onChange={(e) => handleAddressInputChange(e.target.value)}
                          placeholder="Digite a rua, bairro, cidade ou estado (Ex: Copacabana, Rio de Janeiro)..."
                          className={`bg-white border-slate-200 text-sm focus:ring-primary focus:border-primary pr-9 ${selectedCoords ? 'border-green-300 ring-green-100' : ''}`}
                        />
                        <div className="absolute right-3 top-3 flex items-center gap-1 text-slate-400">
                          {isSearchingLocations ? (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          ) : selectedCoords ? (
                            <Check className="h-4 w-4 text-green-500 font-extrabold" />
                          ) : (
                            <Search className="h-4 w-4 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {/* Dropdown flutuante de sugestões */}
                      {metaLocationsSuggestions.length > 0 && (
                        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl flex flex-col animate-in fade-in slide-in-from-top-1 duration-200">
                          <div className="p-1.5 border-b border-slate-100 bg-slate-50 text-[10px] text-slate-500 font-bold px-3 uppercase tracking-wider shrink-0">
                            Localidades Recomendadas
                          </div>
                          <div className="overflow-y-auto max-h-48 py-1 scrollbar-thin">
                            {metaLocationsSuggestions.map((loc) => (
                              <button
                                key={loc.key}
                                type="button"
                                onClick={() => {
                                  setAddressInput(loc.name);
                                  setSelectedCoords({ latitude: loc.latitude, longitude: loc.longitude });
                                  setSelectedLocType(loc.type);
                                  setMetaLocationsSuggestions([]);
                                  toast({
                                    title: "Endereço Selecionado",
                                    description: `O anúncio será exibido ao redor de: ${loc.name}`,
                                  });
                                }}
                                className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-b-0"
                              >
                                <div className="flex flex-col truncate pr-2">
                                  <span className="truncate font-bold text-slate-700">{loc.name}</span>
                                  <span className="text-[10px] text-slate-400 font-normal mt-0.5 capitalize">
                                    Tipo: {loc.type} • {loc.region || "Brasil"}
                                  </span>
                                </div>
                                <Badge className="bg-slate-100 hover:bg-slate-100 text-slate-500 font-semibold text-[9px] scale-90 border-none shrink-0 ml-1 capitalize">
                                  {loc.type}
                                </Badge>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {addressInput.length > 0 && !selectedCoords && (
                        <p className="text-[11px] text-amber-600 font-semibold mt-1 flex items-center gap-1">
                          Digite o endereço e selecione uma das opções recomendadas da lista.
                        </p>
                      )}
                    </div>

                    {/* MAPA VISUAL INTERATIVO */}
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 block">Mapa de Segmentação Geográfica</Label>
                      <div className="text-[11px] text-slate-500 leading-normal flex items-start gap-1.5 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100/30">
                        <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                        <span>
                          Arraste o <strong>marcador azul</strong> ou clique no mapa para definir o centro do seu anúncio. O círculo azul mostra onde o anúncio aparecerá.
                        </span>
                      </div>
                      <div 
                        id="targeting-map" 
                        className="h-72 w-full rounded-xl border border-slate-200/80 shadow-xs relative overflow-hidden z-10 bg-slate-50"
                        style={{ minHeight: '280px' }}
                      />
                    </div>

                    {/* Lógica de Área de Cobertura Inteligente e Condicional */}
                    {selectedCoords && selectedLocType && (
                      <div className="animate-in fade-in duration-300">
                        {/* Se selecionou um Território Inteiro (País ou Estado) */}
                        {selectedLocType === "País" || selectedLocType === "Estado" ? (
                          <div className="mt-2 p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 shadow-sm">
                            <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <div className="text-[12px] text-slate-600 leading-relaxed">
                              <strong>Cobertura Ampla ({selectedLocType}):</strong> O seu anúncio será veiculado em todo o território de <strong>{addressInput}</strong>. Ideal para negócios que buscam o máximo de visibilidade estadual ou nacional.
                            </div>
                          </div>
                        ) : (
                          /* Se selecionou Cidade, Bairro, Rua/Avenida ou Endereço exato */
                          <div className="space-y-4 pt-2">
                            <div className="space-y-3 p-4 rounded-lg bg-slate-50 border border-slate-200">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-slate-700">Área de Cobertura do Anúncio</span>
                                <span className="text-base font-extrabold text-primary font-poppins">{radius} km</span>
                              </div>
                              <Slider
                                defaultValue={[radius]}
                                max={20}
                                min={1}
                                step={1}
                                onValueChange={(val) => setRadius(val[0])}
                                className="py-2"
                              />
                              <div className="flex justify-between text-[10px] text-slate-400">
                                <span>1 km (Foco próximo)</span>
                                <span>10 km</span>
                                <span>20 km (Área ampla)</span>
                              </div>

                              {/* Caixa de Recomendação Contextual Inteligente baseada no Tipo de Local */}
                              <div className="mt-3 flex items-start gap-2 bg-white rounded p-2.5 border border-slate-100 shadow-xs">
                                <Info className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                <p className="text-[11px] text-slate-500 leading-normal">
                                  {selectedLocType === "Cidade" ? (
                                    radius <= 4 ? (
                                      <span><strong>Foco na Cidade:</strong> O anúncio focará principalmente nas áreas centrais e bairros mais populosos de <strong>{addressInput}</strong> em um raio inicial de <strong>{radius} km</strong>.</span>
                                    ) : radius <= 10 ? (
                                      <span><strong>Cidade e arredores:</strong> O anúncio alcançará a cidade de <strong>{addressInput}</strong> e áreas vizinhas imediatas em um raio de <strong>{radius} km</strong>.</span>
                                    ) : (
                                      <span><strong>Expansão regional:</strong> Excelente para expandir o alcance da campanha para municípios vizinhos e cidades ao redor de <strong>{addressInput}</strong> em um raio amplo de <strong>{radius} km</strong>.</span>
                                    )
                                  ) : (
                                    /* Bairro, Rua, Avenida ou Endereço Exato */
                                    <span><strong>Indicado para negócios locais:</strong> Perfeito para atrair clientes da vizinhança e focar o anúncio em alcançar pessoas bem próximas a <strong>{addressInput}</strong>.</span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Demografia Básica */}
                    <div className="space-y-4">
                      <Label className="text-sm font-bold text-slate-700">Quem deve ver seu anúncio?</Label>
                      
                      {/* Gênero */}
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          type="button"
                          variant={gender === "all" ? "default" : "outline"}
                          onClick={() => setGender("all")}
                          className={`text-xs py-2 h-auto rounded-lg font-medium border-slate-200 ${gender === "all" ? "bg-primary text-white" : "bg-white text-slate-600"}`}
                        >
                          Todos
                        </Button>
                        <Button
                          type="button"
                          variant={gender === "male" ? "default" : "outline"}
                          onClick={() => setGender("male")}
                          className={`text-xs py-2 h-auto rounded-lg font-medium border-slate-200 ${gender === "male" ? "bg-primary text-white" : "bg-white text-slate-600"}`}
                        >
                          Homens
                        </Button>
                        <Button
                          type="button"
                          variant={gender === "female" ? "default" : "outline"}
                          onClick={() => setGender("female")}
                          className={`text-xs py-2 h-auto rounded-lg font-medium border-slate-200 ${gender === "female" ? "bg-primary text-white" : "bg-white text-slate-600"}`}
                        >
                          Mulheres
                        </Button>
                      </div>

                      {/* Idades Seletores Dropdowns Lado a Lado */}
                      <div className="space-y-3 p-4 rounded-lg bg-slate-50 border border-slate-200">
                        <Label className="text-xs font-bold text-slate-700 block">Faixa Etária Recomendada</Label>
                        <div className="grid grid-cols-2 gap-4">
                          {/* Idade Mínima */}
                          <div className="space-y-1.5">
                            <Label htmlFor="age-min" className="text-[11px] font-bold text-slate-500">Mínima (Anos)</Label>
                            <select
                              id="age-min"
                              value={ageRange[0]}
                              onChange={(e) => {
                                const newMin = parseInt(e.target.value);
                                const newMax = ageRange[1] < newMin ? newMin : ageRange[1];
                                setAgeRange([newMin, newMax]);
                              }}
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary font-medium"
                            >
                              {Array.from({ length: 48 }, (_, i) => 18 + i).map((age) => (
                                <option key={age} value={age}>
                                  {age} anos
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Idade Máxima */}
                          <div className="space-y-1.5">
                            <Label htmlFor="age-max" className="text-[11px] font-bold text-slate-500">Máxima (Anos)</Label>
                            <select
                              id="age-max"
                              value={ageRange[1]}
                              onChange={(e) => {
                                const newMax = parseInt(e.target.value);
                                const newMin = ageRange[0] > newMax ? newMax : ageRange[0];
                                setAgeRange([newMin, newMax]);
                              }}
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary font-medium"
                            >
                              {Array.from({ length: 48 }, (_, i) => 18 + i).map((age) => (
                                <option key={age} value={age} disabled={age < ageRange[0]}>
                                  {age === 65 ? "65+ anos" : `${age} anos`}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-normal">
                          * Meta Ads exige idade mínima de pelo menos 18 anos para campanhas
                        </p>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* PASSO 4: ORÇAMENTO E SIMULAÇÃO DINÂMICA */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 font-poppins flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      4. Quanto deseja investir?
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Defina seu orçamento diário. Quanto mais você investe, para mais pessoas próximas a Meta exibirá seu post!
                    </p>
                  </div>

                  <div className="space-y-5">
                    
                    {/* Investimento Diário */}
                    <div className="space-y-3 p-4 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-700">Investimento Diário</span>
                          <span className="text-[10px] text-slate-400 font-normal">Valor diário debitado do seu saldo Meta</span>
                        </div>
                        <div className="text-right">
                          <span className="text-base font-extrabold text-primary font-poppins">R$ {dailyBudget} / dia</span>
                          <span className="text-xs text-slate-500 font-bold block mt-0.5">Total: R$ {(dailyBudget * duration).toFixed(2)}</span>
                        </div>
                      </div>
                      <Slider
                        defaultValue={[dailyBudget]}
                        max={100}
                        min={10}
                        step={5}
                        onValueChange={(val) => setDailyBudget(val[0])}
                        className="py-2"
                      />
                    </div>

                    {/* Duração da Campanha */}
                    <div className="space-y-3 p-4 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-700">Duração dos Anúncios</span>
                          <span className="text-[10px] text-slate-400 font-normal">Período de veiculação da campanha</span>
                        </div>
                        <span className="text-base font-extrabold text-primary font-poppins">{duration} dias</span>
                      </div>
                      <Slider
                        defaultValue={[duration]}
                        max={30}
                        min={3}
                        step={1}
                        onValueChange={(val) => setDuration(val[0])}
                        className="py-2"
                      />
                    </div>

                    {/* WIDGET DE RESULTADO DITÁDICO (WOW FACTOR) */}
                    <div className="p-5 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-2 border-orange-500/20 rounded-xl relative overflow-hidden">
                      <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-5 pointer-events-none">
                        <Megaphone className="h-32 w-32" />
                      </div>
                      <h5 className="text-xs font-bold text-orange-600 font-poppins uppercase tracking-wide flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" /> Resultados Estimados na Sua Região
                      </h5>
                      
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg p-3 border border-orange-500/10 shadow-sm">
                          <span className="text-[10px] text-slate-400 block font-medium">Pessoas que verão o anúncio:</span>
                          <span className="text-lg font-extrabold text-orange-600 font-poppins mt-0.5 block">
                            {reach.minReach.toLocaleString("pt-BR")} a {reach.maxReach.toLocaleString("pt-BR")}
                          </span>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-orange-500/10 shadow-sm">
                          <span className="text-[10px] text-slate-400 block font-medium">Cliques de interesse gerados:</span>
                          <span className="text-lg font-extrabold text-orange-600 font-poppins mt-0.5 block">
                            {reach.minClicks.toLocaleString("pt-BR")} a {reach.maxClicks.toLocaleString("pt-BR")}
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500 leading-relaxed mt-4 italic">
                        * Com base em históricos de anúncios na Meta para negócios locais no raio de {radius}km. O valor total a ser investido é de **R$ {dailyBudget * duration}** durante o período.
                      </p>
                    </div>



                  </div>
                </div>
              )}

              {/* Botões de Ação do Wizard */}
              <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
                    else setIsCreating(false);
                  }}
                  className="rounded-lg text-xs font-bold border-slate-200"
                >
                  {currentStep === 1 ? "Cancelar" : "Voltar"}
                </Button>

                {currentStep < 4 ? (
                  <Button
                    type="button"
                    onClick={() => {
                      if (currentStep === 3 && !selectedCoords) {
                        toast({
                          variant: "destructive",
                          title: "Selecione uma localização oficial",
                          description: "Digite o endereço e selecione uma das opções sugeridas na lista flutuante da Meta.",
                        });
                        return;
                      }
                      setCurrentStep((prev) => prev + 1);
                    }}
                    className="bg-primary hover:bg-primary/95 text-white font-bold text-xs px-6 py-2 rounded-lg"
                  >
                    Próximo Passo
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleActivateCampaign}
                    disabled={isSubmitting}
                    className="bg-primary hover:bg-primary/95 text-white font-bold text-xs px-8 py-2.5 rounded-lg active:scale-95 transition-all shadow-sm"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Ativando Anúncio...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Confirmar e Ativar Anúncio (Meta)
                      </>
                    )}
                  </Button>
                )}
              </div>

            </div>

            {/* COLUNA DIREITA: PREVIEW DO FEED REAL (5 colunas) */}
            <div className="lg:col-span-5 p-6 bg-slate-50 flex flex-col justify-start items-center">
              <div className="sticky top-6 w-full max-w-[340px]">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block text-center">
                  📱 Prévia em tempo real (Meta Feed)
                </p>

                {/* Card de Simulação Meta */}
                <div className="relative">
                  {/* Alerta de Nome da Campanha Interno e Privado */}
                  {focusedField === "adName" && (
                    <div className="mb-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 font-medium flex items-start gap-2 shadow-sm animate-in slide-in-from-top-2 duration-200">
                      <span>
                        O <strong>Nome da Campanha</strong> é 100% privado. Ele serve apenas para você se organizar e nunca será visto pelos seus clientes nas redes sociais.
                      </span>
                    </div>
                  )}

                  <div className="bg-white rounded-lg border border-slate-200 shadow-md overflow-hidden text-left">
                    {/* Topo do Post */}
                    <div className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-9 w-9 border border-slate-100">
                          <AvatarImage src={businessProfile?.logo?.url || ""} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                            {getAvatarFallback()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="text-xs font-bold text-slate-900 block leading-tight">
                            {businessProfile?.name || "Meu Negócio"}
                          </span>
                          <span className="text-[10px] text-primary font-semibold block leading-tight mt-0.5">
                            Patrocinado
                          </span>
                        </div>
                      </div>
                      <span className="text-slate-400 text-sm font-bold cursor-default">•••</span>
                    </div>

                    {/* Foto do Post */}
                    <div className="relative aspect-square w-full bg-slate-100 border-y border-slate-100">
                      {(selectedPost.imageUrl || selectedPost.imageUrls?.[0]) ? (
                        <Image
                          src={selectedPost.imageUrl || selectedPost.imageUrls?.[0]}
                          alt="Criativo Anúncio"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-slate-300">
                          <Eye className="h-10 w-10" />
                        </div>
                      )}
                    </div>

                    {/* Barra de Ação de Conversão (CTA) */}
                    {(hasDestination || campaignObjective === "TRAFFIC") && (
                      <div className={`px-3.5 py-2.5 bg-[#F2F4F7] border-b border-slate-100 flex justify-between items-center gap-3 relative transition-all duration-300 ${focusedField === 'headline' || focusedField === 'destinationUrl' ? 'bg-primary/5 ring-2 ring-primary/50 scale-[1.01] z-10' : ''}`}>
                        {focusedField === 'headline' && (
                          <span className="absolute -top-2.5 right-3 bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow animate-bounce">
                            Título do Anúncio
                          </span>
                        )}
                        {focusedField === 'destinationUrl' && (
                          <span className="absolute -top-2.5 right-3 bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow animate-bounce">
                            Link do Site (Botão)
                          </span>
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="text-[9px] text-slate-500 uppercase tracking-wide font-semibold block truncate leading-none">
                            {customDestination ? customDestination.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0].toUpperCase() : "SEUSITE.COM.BR"}
                          </span>
                          <span className="text-xs font-bold text-slate-800 truncate block mt-1 leading-snug">
                            {headline || "Aproveite nossa oferta local!"}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          className="bg-primary hover:bg-primary text-white text-[10px] font-bold h-7 px-3 rounded pointer-events-none"
                        >
                          Saiba Mais
                        </Button>
                      </div>
                    )}

                    {/* Legenda/Corpo */}
                    <div className={`p-3 relative transition-all duration-300 ${focusedField === 'bodyText' ? 'bg-primary/5 ring-2 ring-primary/50 scale-[1.01] z-10' : ''}`}>
                      {focusedField === 'bodyText' && (
                        <span className="absolute -top-2.5 right-3 bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow animate-bounce">
                          Texto Principal (Legenda)
                        </span>
                      )}
                      <p className="text-xs text-slate-700 leading-relaxed font-inter line-clamp-4">
                        <span className="font-bold text-slate-900 mr-1.5">{businessProfile?.name || "Meu Negócio"}</span>
                        {bodyText || selectedPost.text}
                      </p>
                    </div>
                  </div>
                </div>


              </div>
            </div>

          </div>
        </div>
      )}

      {/* DASHBOARD PRINCIPAL (MÉTRICAS E LISTAS) */}
      {!isCreating && metaConnection.isConnected && metaConnection.adAccountId && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* PAINEL DE MÉTRICAS GERAIS SIMPLIFICADAS (TOPO) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs flex items-center gap-5 hover:shadow-sm transition-all duration-300">
              <div className="bg-primary/5 p-3.5 rounded-xl text-primary shrink-0">
                <DollarSign className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-slate-500 block">Valor Investido</span>
                <span className="text-3xl font-bold tracking-tight text-slate-900 font-poppins mt-0.5 block truncate">
                  R$ {campaigns.reduce((acc, curr) => acc + (curr.metrics?.amountSpent || 0), 0).toFixed(2)}
                </span>
                <span className="text-xs text-slate-400 block truncate mt-0.5">Valor usado nos últimos 30 dias</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs flex items-center gap-5 hover:shadow-sm transition-all duration-300">
              <div className="bg-emerald-500/5 p-3.5 rounded-xl text-emerald-600 shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-slate-500 block">Visualizações</span>
                <span className="text-3xl font-bold tracking-tight text-slate-900 font-poppins mt-0.5 block truncate">
                  {campaigns.reduce((acc, curr) => acc + (curr.metrics?.impressions || 0), 0).toLocaleString("pt-BR")}
                </span>
                <span className="text-xs text-slate-400 block truncate mt-0.5">Visualizações nos últimos 30 dias</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs flex items-center gap-5 hover:shadow-sm transition-all duration-300">
              <div className="bg-blue-500/5 p-3.5 rounded-xl text-blue-600 shrink-0">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-slate-500 block">Cliques</span>
                <span className="text-3xl font-bold tracking-tight text-slate-900 font-poppins mt-0.5 block truncate">
                  {campaigns.reduce((acc, curr) => acc + (curr.metrics?.clicks || 0), 0).toLocaleString("pt-BR")}
                </span>
                <span className="text-xs text-slate-400 block truncate mt-0.5">Cliques (todos) nos últimos 30 dias</span>
              </div>
            </div>
          </div>

          {/* GERENCIAMENTO DE CAMPANHAS EM VEICULAÇÃO OU HISTÓRICO */}
          <div className="space-y-5">
            {/* SELETOR DE ABAS SEGMENT CONTROL */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b border-slate-100 pb-3">
              <div className="bg-slate-100/80 p-1 rounded-xl inline-flex gap-1 border border-slate-200/50">
                <button
                  type="button"
                  onClick={() => setActiveDashboardTab("active")}
                  className={`py-1.5 px-4 text-xs font-bold rounded-lg transition-all duration-200 font-poppins flex items-center gap-2 ${
                    activeDashboardTab === "active"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <span>Em Veiculação</span>
                  <span className={`text-[10px] py-0 px-2 rounded-full font-bold ${
                    activeDashboardTab === "active" ? "bg-primary/10 text-primary" : "bg-slate-200 text-slate-500"
                  }`}>
                    {campaigns.filter((c) => c.status === "active").length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDashboardTab("history")}
                  className={`py-1.5 px-4 text-xs font-bold rounded-lg transition-all duration-200 font-poppins flex items-center gap-2 ${
                    activeDashboardTab === "history"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <span>Histórico de Anúncios</span>
                  <span className={`text-[10px] py-0 px-2 rounded-full font-bold ${
                    activeDashboardTab === "history" ? "bg-primary/10 text-primary" : "bg-slate-200 text-slate-500"
                  }`}>
                    {campaigns.filter((c) => c.status !== "active").length}
                  </span>
                </button>
              </div>
              <span className="text-xs text-slate-400 font-medium font-inter flex items-center gap-1.5 self-end sm:self-center">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Relatórios considerando os últimos 30 dias
              </span>
            </div>

            {/* LISTA EM TABELA PREMIUM */}
            {loading ? (
              <div className="flex justify-center items-center py-12 bg-white rounded-xl border border-slate-200/80">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              (() => {
                const filteredCampaigns = campaigns.filter((c) => {
                  return activeDashboardTab === "active" ? c.status === "active" : c.status !== "active";
                });

                if (filteredCampaigns.length === 0) {
                  return (
                    <div className="bg-slate-50 border border-slate-200/80 border-dashed rounded-xl p-10 text-center text-slate-400 animate-in fade-in duration-300">
                      <Megaphone className="h-10 w-10 text-slate-300 mx-auto mb-3 animate-pulse" />
                      <p className="text-xs font-semibold text-slate-500">
                        {activeDashboardTab === "active"
                          ? "Você não possui nenhuma campanha ativa no momento."
                          : "Nenhum anúncio finalizado ou pausado no histórico."}
                      </p>
                      {activeDashboardTab === "active" && (
                        <div className="mt-3.5 flex flex-col items-center gap-4">
                          <p className="text-[11.5px] text-slate-400 max-w-md mx-auto leading-relaxed">
                            Selecione um de seus posts publicados e configure o raio e orçamento do seu anúncio local para começar a atrair novos clientes na sua região.
                          </p>
                          {publishedPosts.length > 0 ? (
                            <Button
                              onClick={() => setIsChoosePostModalOpen(true)}
                              className="bg-primary hover:bg-primary/95 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-sm font-poppins transition-transform active:scale-95 flex items-center gap-1.5"
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                              Impulsionar um Post
                            </Button>
                          ) : (
                            <p className="text-[11px] text-amber-600 font-medium bg-amber-50 border border-amber-100/60 rounded-lg px-3 py-1.5">
                              Crie e programe um post na aba <strong>Conteúdo</strong> antes de impulsioná-lo!
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200/60 bg-slate-50/50 text-xs text-slate-500 font-semibold normal-case tracking-normal font-poppins">
                            <th className="px-5 py-3.5 font-semibold">Anúncio</th>
                            <th className="px-5 py-3.5 font-semibold">Status</th>
                            <th className="px-5 py-3.5 font-semibold">Duração</th>
                            <th className="px-5 py-3.5 font-semibold">Verba</th>
                            <th className="px-5 py-3.5 font-semibold text-primary">Investido</th>
                            <th className="px-5 py-3.5 font-semibold">Visualizações</th>
                            <th className="px-5 py-3.5 font-semibold">Cliques</th>
                            <th className="px-5 py-3.5 font-semibold text-right">Gerenciar</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150/40 text-xs font-inter text-slate-650">
                          {filteredCampaigns.map((c) => {
                            const totalDays = c.durationDays || 7;
                            let daysPassed = 1;
                            if (c.createdAt) {
                              const createdDate = (c.createdAt as any).toDate ? (c.createdAt as any).toDate() : new Date(c.createdAt as any);
                              const diffTime = Math.abs(Date.now() - createdDate.getTime());
                              daysPassed = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            }
                            if (daysPassed > totalDays) daysPassed = totalDays;
                            if (daysPassed < 1) daysPassed = 1;
                            const progressPercentage = Math.round((daysPassed / totalDays) * 100);

                            return (
                              <tr key={c.id} className="hover:bg-slate-50/30 transition-colors">
                                {/* ANÚNCIO (FOTO + NOME) */}
                                <td className="px-5 py-3.5">
                                  <div className="flex items-center gap-3">
                                    {c.creative.imageUrl && (
                                      <div className="relative h-14 w-14 rounded-lg border border-slate-150 overflow-hidden flex-shrink-0 bg-slate-50 shadow-xs">
                                        <Image src={c.creative.imageUrl} alt="creative thumb" fill className="object-cover" />
                                      </div>
                                    )}
                                    <div className="min-w-0">
                                      <span className="block font-bold text-slate-900 text-xs leading-snug truncate max-w-[220px]">
                                        {c.name}
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                {/* STATUS BADGE */}
                                <td className="px-5 py-3.5">
                                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                    c.status === "active"
                                      ? "bg-emerald-50/50 text-emerald-700 border-emerald-100"
                                      : "bg-slate-50 text-slate-500 border-slate-100"
                                  }`}>
                                    {c.status === "active" && (
                                      <span className="relative flex h-1.5 w-1.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                      </span>
                                    )}
                                    {c.status === "active" ? "No Ar" : c.status === "paused" ? "Pausado" : "Concluído"}
                                  </span>
                                </td>

                                {/* DURAÇÃO PROGRESSO */}
                                <td className="px-5 py-3.5">
                                  {c.status === "active" ? (
                                    <div className="min-w-[120px] max-w-[150px] space-y-1">
                                      <div className="flex justify-between text-[10px] text-slate-500 font-medium leading-none">
                                        <span>Dia {daysPassed}/{totalDays}</span>
                                        <span>{progressPercentage}%</span>
                                      </div>
                                      <div className="w-full bg-slate-100/70 rounded-full h-1 overflow-hidden">
                                        <div className="bg-primary h-1 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 font-medium font-poppins text-xs px-2">-</span>
                                  )}
                                </td>

                                {/* VERBA / ORÇAMENTO */}
                                <td className="px-5 py-3.5">
                                  <span className="font-semibold text-slate-800 text-xs">R$ {c.budget.amount.toFixed(2)}/dia</span>
                                </td>

                                {/* INVESTIDO */}
                                <td className="px-5 py-3.5">
                                  <span className="font-bold text-slate-900 text-xs">R$ {(c.metrics?.amountSpent || 0).toFixed(2)}</span>
                                </td>

                                {/* VISUALIZAÇÕES */}
                                <td className="px-5 py-3.5">
                                  <span className="font-semibold text-slate-800 text-xs">
                                    {c.metrics?.impressions?.toLocaleString("pt-BR") || 0}
                                  </span>
                                </td>

                                {/* CLIQUES */}
                                <td className="px-5 py-3.5">
                                  <span className="font-semibold text-slate-800 text-xs">
                                    {c.metrics?.clicks?.toLocaleString("pt-BR") || 0}
                                  </span>
                                </td>

                                {/* GERENCIAR (AÇÕES) */}
                                <td className="px-5 py-3.5 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {c.status === "active" ? (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleToggleStatus(c)}
                                        className="h-8 border-slate-200 text-yellow-600 hover:bg-yellow-50 font-bold text-[10px] rounded-lg px-2.5 flex items-center gap-1 transition-all duration-200 shadow-xs"
                                        title="Pausar anúncio na Meta"
                                      >
                                        <Pause className="h-3 w-3" />
                                        Pausar
                                      </Button>
                                    ) : c.status === "paused" ? (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleToggleStatus(c)}
                                        className="h-8 border-slate-200 text-green-600 hover:bg-green-50 font-bold text-[10px] rounded-lg px-2.5 flex items-center gap-1 transition-all duration-200 shadow-xs"
                                        title="Ativar anúncio na Meta"
                                      >
                                        <Play className="h-3 w-3" />
                                        Ativar
                                      </Button>
                                    ) : null}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDeleteCampaign(c)}
                                      className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-650 rounded-lg transition-colors"
                                      title="Excluir campanha da Meta"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()
            )}
          </div>

          {/* O grid de posts foi movido para o Dialog de seleção */}

        </div>
      )}

      {/* MODAL DE SELEÇÃO DE PUBLICIDADE (CHOOSE POST) */}
      <Dialog open={isChoosePostModalOpen} onOpenChange={setIsChoosePostModalOpen}>
        <DialogContent className="max-w-4xl font-sans max-h-[85vh] flex flex-col p-6">
          <DialogHeader className="pb-3 border-b border-slate-100">
            <DialogTitle className="font-poppins font-bold text-slate-900 text-lg flex items-center gap-2">
              Escolher Publicação para Impulsionar
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Selecione uma de suas publicações abaixo para iniciar o processo de impulsionamento local.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 scrollbar-thin">
            {loadingPosts ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : publishedPosts.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200/80 border-dashed rounded-xl p-10 text-center text-slate-400">
                <p className="text-xs font-semibold text-slate-500">Nenhum post publicado encontrado no feed do Instagram/Facebook.</p>
                <p className="text-[11px] text-slate-400 mt-1">Crie e programe um post na aba Conteúdo antes de impulsioná-lo!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {publishedPosts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col group hover:border-primary/40 hover:shadow transition-all duration-300"
                  >
                    <div className="relative aspect-square w-full bg-slate-50 overflow-hidden">
                      {(post.imageUrl || post.imageUrls?.[0]) ? (
                        <Image
                          src={post.imageUrl || post.imageUrls?.[0]}
                          alt="Thumbnail post"
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-slate-300">
                          <Eye className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between gap-3 bg-white">
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed font-inter">
                        {post.text}
                      </p>
                      
                      <div className="border-t border-slate-100 pt-3.5 flex justify-between items-center mt-auto">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 leading-none">
                          Pronto
                        </span>
                        <Button
                          size="sm"
                          onClick={() => handleSelectPostToBoost(post)}
                          className="bg-primary hover:bg-primary/95 text-white font-extrabold text-[11px] h-8 px-3 rounded-lg shadow-sm font-poppins"
                        >
                          <Sparkles className="mr-1 h-3.5 w-3.5" />
                          Impulsionar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}