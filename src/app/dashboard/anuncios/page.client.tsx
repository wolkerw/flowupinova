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
  CreditCard,
  Settings,
  RefreshCw,
  Plus,
  MessageSquare,
  ExternalLink,
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

const CATEGORY_PRESETS: Record<string, Array<{ id: string; name: string; type?: string }>> = {
  alimentacao: [
    { id: "6003325727945", name: "Hambúrguer", type: "interests" },
    { id: "6003668857118", name: "Pizza", type: "interests" },
    { id: "6003435096731", name: "Churrasco", type: "interests" },
    { id: "6003436950375", name: "Restaurantes", type: "interests" },
    { id: "6003626773307", name: "Café", type: "interests" },
  ],
  beleza: [
    { id: "6003088846792", name: "Salão de beleza", type: "interests" },
    { id: "6002839660079", name: "Cosméticos", type: "interests" },
    { id: "6003058986332", name: "Cabelo", type: "interests" },
    { id: "6003254590688", name: "Spa", type: "interests" },
  ],
  moda: [
    { id: "6003456388203", name: "Roupas", type: "interests" },
    { id: "6003348453981", name: "Calçados", type: "interests" },
    { id: "6003348604581", name: "Acessórios de moda", type: "interests" },
    { id: "6003346592981", name: "Compras online", type: "interests" },
  ],
};

const DEFAULT_PRESETS = [
  { id: "6003346592981", name: "Compras online", type: "interests" },
  { id: "6004160395895", name: "Viagens", type: "interests" },
  { id: "6003415019460", name: "Gastronomia", type: "interests" },
  { id: "6003349442621", name: "Entretenimento", type: "interests" },
];

const getCategoryPresets = (category?: string) => {
  const cat = String(category || "").toLowerCase().trim();
  if (cat.includes("alimento") || cat.includes("restaurante") || cat.includes("comida")) {
    return CATEGORY_PRESETS.alimentacao;
  }
  if (cat.includes("beleza") || cat.includes("estetica") || cat.includes("salao")) {
    return CATEGORY_PRESETS.beleza;
  }
  if (cat.includes("moda") || cat.includes("roupa") || cat.includes("vestu")) {
    return CATEGORY_PRESETS.moda;
  }
  return DEFAULT_PRESETS;
};

interface AnunciosPageClientProps {
  initialProfile: BusinessProfileData | null;
}

export default function AnunciosPageClient({ initialProfile }: AnunciosPageClientProps) {
  const { user } = useAuth();
  const userId = user?.uid;
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
  const [isRefreshingAccounts, setIsRefreshingAccounts] = useState(false);
  const [isProfileSwitchTutorialOpen, setIsProfileSwitchTutorialOpen] = useState(false);
  const [tutorialRedirectUrl, setTutorialRedirectUrl] = useState("");
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
  const [campaignObjective, setCampaignObjective] = useState<"REACH" | "TRAFFIC" | "WHATSAPP">("REACH");
  const [isCheckingWhatsApp, setIsCheckingWhatsApp] = useState(false);
  const [hasWhatsAppConnected, setHasWhatsAppConnected] = useState<boolean | null>(null);
  const [whatsAppPageId, setWhatsAppPageId] = useState("");
  const [whatsAppPageName, setWhatsAppPageName] = useState("");
  const [whatsAppBusinessPhone, setWhatsAppBusinessPhone] = useState("");
  const [whatsAppSettingsUrl, setWhatsAppSettingsUrl] = useState("");
  const [hasDestination, setHasDestination] = useState(false);
  const [metaLocationsSuggestions, setMetaLocationsSuggestions] = useState<any[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<any[]>([]);
  const [isSearchingLocations, setIsSearchingLocations] = useState(false);
  const mapLayersRef = useRef<any[]>([]);
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false);
  const mapInstanceRef = useRef<any>(null);

  // Estados para Faturamento / Cobrança
  const [billingStatus, setBillingStatus] = useState<any>(null);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [billingGuideActive, setBillingGuideActive] = useState(false);
  const [billingGuideStep, setBillingGuideStep] = useState(1);

  // Estados para Interesses e Público
  const [selectedInterests, setSelectedInterests] = useState<Array<{ id: string; name: string; type?: string }>>([]);
  const [interestsSearchQuery, setInterestsSearchQuery] = useState("");
  const [searchedInterests, setSearchedInterests] = useState<any[]>([]);
  const [isLoadingInterests, setIsLoadingInterests] = useState(false);

  const addLocation = (newLoc: any) => {
    setSelectedLocations((prev) => {
      const isDuplicate = prev.some(
        (l) =>
          (l.key && l.key === newLoc.key && l.key !== "") ||
          (typeof l.latitude === "number" && l.latitude === newLoc.latitude && l.longitude === newLoc.longitude)
      );
      if (isDuplicate) return prev;
      return [...prev, newLoc];
    });
    setAddressInput("");
    setMetaLocationsSuggestions([]);
  };

  const handleAddressInputChange = (val: string) => {
    setAddressInput(val);
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
        let suggestions = data.success ? (data.locations || []) : [];

        // Fallback Client-side Nominatim if server returned few or no results
        if (suggestions.length === 0) {
          try {
            const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val.toLowerCase().includes("brasil") || val.toLowerCase().includes("brazil") ? val : val + ", Brasil")}&format=json&limit=5&countrycodes=br&addressdetails=1`;
            const nomRes = await fetch(nomUrl, {
              headers: { "Accept-Language": "pt-BR,pt;q=0.9" }
            });
            if (nomRes.ok) {
              const nomData = await nomRes.json();
              const nomSuggestions = nomData
                .filter((item: any) => item.type !== "postcode" && item.class !== "postcode")
                .map((item: any, index: number) => {
                  const address = item.address || {};
                  let displayName = item.display_name.replace(", Brasil", "").replace(", Brazil", "");
                  let ptType = "Endereço";
                  if (address.country && !address.state && !address.city && !address.suburb && !address.road) ptType = "País";
                  else if (address.state && !address.city && !address.suburb && !address.road) ptType = "Estado";
                  else if (address.city || address.town || address.village) {
                    if (!address.suburb && !address.road) ptType = "Cidade";
                    else if (address.suburb && !address.road) ptType = "Bairro";
                  } else if (address.suburb) ptType = "Bairro";
                  else if (address.road) ptType = "Rua/Avenida";

                  return {
                    key: `nom_client_${index}_${item.osm_id}`,
                    name: displayName,
                    type: ptType,
                    latitude: parseFloat(item.lat),
                    longitude: parseFloat(item.lon),
                    region: address.state || "",
                    boundingBox: item.boundingbox ? [
                      parseFloat(item.boundingbox[0]),
                      parseFloat(item.boundingbox[1]),
                      parseFloat(item.boundingbox[2]),
                      parseFloat(item.boundingbox[3])
                    ] : undefined,
                  };
                });
              suggestions = [...suggestions, ...nomSuggestions];
            }
          } catch (err) {
            console.warn("Falha no client-side Nominatim:", err);
          }
        }

        setMetaLocationsSuggestions(suggestions);
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

  const checkWhatsAppConnection = async () => {
    setIsCheckingWhatsApp(true);
    try {
      const res = await fetch("/api/meta/page-whatsapp");
      const data = await res.json();
      if (data.success) {
        setHasWhatsAppConnected(!!data.hasWhatsApp);
        setWhatsAppPageId(data.pageId || "");
        setWhatsAppPageName(data.pageName || "");
        setWhatsAppBusinessPhone(data.businessPhone || "");
        setWhatsAppSettingsUrl(data.settingsUrl || "");
      } else {
        setHasWhatsAppConnected(false);
        console.error("Erro ao verificar WhatsApp da página:", data.error);
      }
    } catch (e) {
      setHasWhatsAppConnected(false);
      console.error("Falha de rede ao verificar WhatsApp da página:", e);
    } finally {
      setIsCheckingWhatsApp(false);
    }
  };

  useEffect(() => {
    if (campaignObjective === "WHATSAPP" && hasWhatsAppConnected === null) {
      checkWhatsAppConnection();
    }
  }, [campaignObjective, hasWhatsAppConnected]);

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
    if (currentStep === 3 && selectedLocations.length === 0 && businessProfile?.address) {
      const geocodeProfileAddress = async () => {
        try {
          const res = await fetch(`/api/ads/locations?q=${encodeURIComponent(businessProfile.address)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.locations && data.locations.length > 0) {
              const loc = data.locations[0];
              setSelectedLocations([{
                name: loc.name,
                type: loc.type,
                key: loc.key || "",
                latitude: loc.latitude,
                longitude: loc.longitude,
                boundingBox: loc.boundingBox || null,
                geoJson: null
              }]);
              setAddressInput("");
            }
          }
        } catch (err) {
          console.warn("Erro ao geocodificar endereço inicial do perfil:", err);
        }
      };
      geocodeProfileAddress();
    }
  }, [currentStep, businessProfile, selectedLocations]);

  // 3. Inicializa e sincroniza o mapa Leaflet
  useEffect(() => {
    if (!isLeafletLoaded || currentStep !== 3 || typeof window === "undefined") return;

    const L = (window as any).L;
    if (!L) return;

    let initialLat = -30.0346;
    let initialLng = -51.2177;
    let zoomLevel = 12;

    if (selectedLocations.length > 0) {
      const firstLoc = selectedLocations[0];
      if (typeof firstLoc.latitude === "number" && typeof firstLoc.longitude === "number") {
        initialLat = firstLoc.latitude;
        initialLng = firstLoc.longitude;
        zoomLevel = firstLoc.type === "País" || firstLoc.type === "Estado" ? 4 : 14;
      }
    }

    const mapContainer = document.getElementById("targeting-map");
    if (!mapContainer) return;

    const syncMapElements = (map: any) => {
      // Remove todos os elementos anteriores do mapa
      if (mapLayersRef.current) {
        mapLayersRef.current.forEach((layer) => {
          map.removeLayer(layer);
        });
        mapLayersRef.current = [];
      }

      if (selectedLocations.length === 0) return;

      const bounds = L.latLngBounds([]);
      let hasLayers = false;

      selectedLocations.forEach((loc) => {
        const isArea = loc.type === "País" || loc.type === "Estado";
        if (isArea) {
          if (loc.geoJson) {
            const geoJsonLayer = L.geoJSON(loc.geoJson, {
              style: {
                color: "#0284c7",
                fillColor: "#0284c7",
                fillOpacity: 0.15,
                weight: 2
              }
            }).addTo(map);
            mapLayersRef.current.push(geoJsonLayer);
            bounds.extend(geoJsonLayer.getBounds());
            hasLayers = true;
          } else if (loc.boundingBox) {
            const b = [
              [loc.boundingBox[0], loc.boundingBox[2]],
              [loc.boundingBox[1], loc.boundingBox[3]]
            ];
            const rect = L.rectangle(b, {
              color: "#0284c7",
              fillColor: "#0284c7",
              fillOpacity: 0.2,
              weight: 2
            }).addTo(map);
            mapLayersRef.current.push(rect);
            bounds.extend(b);
            hasLayers = true;
          }
        } else {
          if (typeof loc.latitude === "number" && typeof loc.longitude === "number") {
            const latLng = new L.LatLng(loc.latitude, loc.longitude);
            const pinSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#0284c7" width="36" height="36"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
            const customPinIcon = L.icon({
              iconUrl: 'data:image/svg+xml;base64,' + btoa(pinSvg),
              iconSize: [36, 36],
              iconAnchor: [18, 36],
            });
            const marker = L.marker(latLng, {
              icon: customPinIcon,
              draggable: false, // Desativa pin arrastável
            }).addTo(map);
            mapLayersRef.current.push(marker);

            const circle = L.circle(latLng, {
              color: "#0284c7",
              fillColor: "#0284c7",
              fillOpacity: 0.15,
              radius: radius * 1000,
            }).addTo(map);
            mapLayersRef.current.push(circle);

            bounds.extend(latLng);
            bounds.extend(circle.getBounds());
            hasLayers = true;
          }
        }
      });

      if (hasLayers) {
        map.fitBounds(bounds, { padding: [30, 30] });
      }
    };

    if (mapInstanceRef.current) {
      syncMapElements(mapInstanceRef.current);
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

    syncMapElements(map);

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        mapLayersRef.current = [];
      }
    };
  }, [isLeafletLoaded, currentStep, selectedLocations, radius]);

  // Estados de IA e Carregamento
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBillingStatus = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch("/api/ads/billing-status");
      const data = await res.json();
      if (data.success && data.billing) {
        setBillingStatus(data.billing);
      }
    } catch (e) {
      console.error("Erro ao buscar status de cobrança:", e);
    }
  }, [userId]);

  // Carrega campanhas e posts publicados
  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setLoadingPosts(true);
    try {
      // Buscar posts e filtrar apenas publicados
      const postsResult = await getScheduledPosts(userId);
      const filteredPosts = postsResult
        .filter((r: any) => r.success && r.post && r.post.status === "published")
        .map((r: any) => r.post);
      setPublishedPosts(filteredPosts);
      setLoadingPosts(false);

      // Buscar conexão da Meta
      const metaConn = await getMetaConnection(userId);
      setMetaConnection(metaConn);
      if (metaConn.userAccessToken) {
        setExchangeToken(metaConn.userAccessToken);
      }
      if (metaConn.isConnected && metaConn.adAccountId) {
        setAdAccountId(metaConn.adAccountId);
        setAdAccountName(metaConn.adAccountName || "");
        fetchBillingStatus();

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
  }, [userId, toast, fetchBillingStatus]);

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
        "pages_manage_engagement",
        "pages_manage_posts",
        "pages_read_engagement",
        "pages_read_user_content",
        "pages_show_list",
        "business_management",
        "ads_management",
        "ads_read"
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

  const handleRefreshAdAccounts = async () => {
    setIsRefreshingAccounts(true);
    try {
      const response = await fetch("/api/ads/accounts");
      const result = await response.json();
      if (result.success) {
        const accounts = result.accounts || [];
        setMetaAdAccounts(accounts);
        if (accounts.length > 0) {
          setSelectedAdAccountIdState(accounts[0].id);
          toast({
            title: "Contas Atualizadas!",
            description: `Encontramos ${accounts.length} conta(s) de anúncios associada(s) ao seu perfil.`,
          });
        } else {
          toast({
            variant: "destructive",
            title: "Nenhuma conta de anúncios encontrada",
            description: "Certifique-se de que concluiu a criação da conta na Meta antes de tentar atualizar.",
          });
        }
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      console.error("Erro ao atualizar contas de anúncios:", err);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar contas",
        description: err.message || "Não foi possível carregar as contas de anúncios atualizadas.",
      });
    } finally {
      setIsRefreshingAccounts(false);
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

  // Efeito de busca autocomplete para interesses (Meta)
  useEffect(() => {
    if (!interestsSearchQuery || interestsSearchQuery.trim().length < 2) {
      setSearchedInterests([]);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setIsLoadingInterests(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/ads/interests?q=${encodeURIComponent(interestsSearchQuery)}`);
        const data = await res.json();
        if (data.success) {
          setSearchedInterests(data.interests || []);
        }
      } catch (err) {
        console.error("Erro ao buscar interesses:", err);
      } finally {
        setIsLoadingInterests(false);
      }
    }, 400);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [interestsSearchQuery]);

  const addInterest = (interest: { id: string; name: string; type?: string }) => {
    if (selectedInterests.length >= 5) {
      toast({
        variant: "destructive",
        title: "Limite de interesses atingido",
        description: "Você pode selecionar no máximo 5 interesses para manter o público qualificado."
      });
      return;
    }
    if (selectedInterests.some(i => i.id === interest.id)) {
      return;
    }
    setSelectedInterests(prev => [...prev, interest]);
    setInterestsSearchQuery("");
    setSearchedInterests([]);
  };

  const removeInterest = (id: string) => {
    setSelectedInterests(prev => prev.filter(i => i.id !== id));
  };

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

      // WhatsApp: sobrescreve CTA independente do estado de hasDestination
      // O backend trata o CTA real (WHATSAPP_MESSAGE), mas precisa receber algo diferente de NONE
      if (campaignObjective === "WHATSAPP") {
        backendCtaType = "WHATSAPP_MESSAGE";
        backendCtaLink = "";
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
            address: selectedLocations.map(l => l.name).join(", ") || "Centro Comercial Local",
            radiusKm: radius,
            ageMin: ageRange[0],
            ageMax: ageRange[1],
            gender,
            interests: selectedInterests.map(i => ({ id: i.id, name: i.name, type: i.type || "" })),
            locations: selectedLocations.map(l => ({
              name: l.name,
              type: l.type,
              key: l.key,
              latitude: l.latitude || null,
              longitude: l.longitude || null
            }))
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
          address: selectedLocations.map(l => l.name).join(", ") || "Centro Comercial Local",
          radiusKm: radius,
          ageMin: ageRange[0],
          ageMax: ageRange[1],
          gender,
          interests: selectedInterests.map(i => ({ id: i.id, name: i.name, type: i.type || "" })),
          locations: selectedLocations.map(l => ({
            name: l.name,
            type: l.type,
            key: l.key,
            latitude: l.latitude || null,
            longitude: l.longitude || null
          }))
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
              <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-3xl text-left">
                <div className="flex flex-wrap items-center gap-4">
                  {/* Informação da Conta */}
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 bg-primary/10 text-primary rounded-lg flex items-center justify-center shrink-0">
                      <Megaphone className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Conta de Anúncios</span>
                      <span className="text-xs font-bold text-slate-700 block mt-0.5">
                        {adAccountName}
                      </span>
                    </div>
                  </div>

                  {/* Divisor vertical no desktop */}
                  <div className="hidden sm:block h-8 w-px bg-slate-200"></div>

                  {/* Informação de Cobrança */}
                  {billingStatus && (
                    <button 
                      onClick={() => {
                        setBillingGuideActive(false);
                        setIsBillingModalOpen(true);
                      }}
                      className="group flex items-center gap-3 text-left transition-all active:scale-98 duration-100"
                    >
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                        billingStatus.hasPaymentMethod && billingStatus.accountStatus === 1
                          ? "bg-green-50 text-green-600 border border-green-200/20"
                          : "bg-amber-50 text-amber-600 border border-amber-200/20"
                      }`}>
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                          Status Financeiro
                          <Settings className="h-3 w-3 opacity-60 group-hover:rotate-45 transition-transform duration-200" />
                        </span>
                        <span className="text-xs font-bold text-slate-700 block mt-0.5 flex items-center gap-1.5 font-inter">
                          <span className="relative flex h-1.5 w-1.5">
                            {!(billingStatus.hasPaymentMethod && billingStatus.accountStatus === 1) && (
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            )}
                            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                              billingStatus.hasPaymentMethod && billingStatus.accountStatus === 1 ? "bg-green-500" : "bg-amber-500"
                            }`}></span>
                          </span>
                          {billingStatus.hasPaymentMethod 
                            ? (billingStatus.isPrepaid && billingStatus.balance > 0 
                                ? `Saldo R$ ${billingStatus.balance.toFixed(2)}` 
                                : `Ativa (${billingStatus.fundingSourceDetails?.display_string || "Cartão"})`) 
                            : "Pendente"}
                        </span>
                      </div>
                    </button>
                  )}
                </div>

                <button
                  onClick={handleDisconnectMetaAds}
                  className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors underline decoration-dotted"
                >
                  Desconectar Conta
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

      {/* BANNER DE PREVENÇÃO DE COBRANÇA PENDENTE */}
      {!isCreating && metaConnection.isConnected && metaConnection.adAccountId && billingStatus && !billingStatus.hasPaymentMethod && (
        <div className="mb-6 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start gap-3 text-left">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-xs font-bold text-slate-900 font-poppins">Forma de pagamento pendente</h5>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Você precisa configurar uma forma de faturamento (cartão, Pix ou boleto) na Meta para ativar novos anúncios. Seus anúncios atuais podem ser pausados se não houver saldo.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={() => {
                setBillingGuideActive(false);
                setIsBillingModalOpen(true);
              }}
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] h-8 rounded-lg"
            >
              Configurar Faturamento
            </Button>
            <Button
              onClick={() => {
                setBillingGuideActive(true);
                setBillingGuideStep(1);
                setIsBillingModalOpen(true);
              }}
              size="sm"
              variant="outline"
              className="border-amber-200 hover:bg-amber-50 text-amber-700 font-bold text-[10px] h-8 rounded-lg"
            >
              Recarregar Saldo
            </Button>
          </div>
        </div>
      )}

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
              {/* Card Meta Ads (Vendas/Pago) */}
              <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between gap-6 transition-all duration-300 hover:shadow-md text-left">
                <div className="space-y-4">
                  <div className="bg-primary/10 text-primary p-3 rounded-xl w-fit">
                    <Megaphone className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-slate-900 leading-tight">Impulsionar no Instagram e Facebook</h4>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                      Atraia mais clientes e aumente suas vendas! Promova seus melhores posts e interaja com moradores da sua região com segmentação precisa.
                    </p>
                  </div>
                </div>
                <div className="pt-5 mt-5 border-t border-slate-100">
                  <Button
                    onClick={handleConnectMetaAds}
                    className="bg-primary hover:bg-primary/95 text-white font-bold text-xs py-4 px-6 rounded-xl w-full flex items-center justify-center gap-2"
                  >
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Conectar Facebook e Instagram
                  </Button>
                </div>
              </div>

              {/* Card Google Ads (Em Breve) */}
              <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 shadow-sm flex flex-col justify-between gap-6 transition-all duration-300 opacity-90 text-left">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="bg-slate-200 text-slate-650 p-2.5 rounded-xl">
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                    </div>
                    <Badge className="bg-slate-200/80 hover:bg-slate-200/80 text-slate-500 font-bold text-[9px] scale-90 border-none shrink-0 ml-1 uppercase tracking-wider">
                      Em Breve
                    </Badge>
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-slate-700 leading-tight">Anúncios no Google Ads</h4>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                      Apareça no topo das buscas locais e no Google Mapas para quem já está procurando ativamente seus serviços na vizinhança.
                    </p>
                  </div>
                </div>
                <div className="pt-5 mt-5 border-t border-slate-200/60">
                  <Button
                    disabled
                    variant="outline"
                    className="border-slate-200 text-slate-400 font-bold text-xs py-4 px-6 rounded-xl w-full cursor-not-allowed bg-slate-100/50"
                  >
                    Em Breve
                  </Button>
                </div>
              </div>
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
                <div className="bg-blue-50/40 border border-blue-100/70 rounded-xl p-3.5 space-y-3 text-left">
                  <div className="flex items-start gap-2 text-blue-700">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <h6 className="text-[11.5px] font-bold">Crie sua Conta de Anúncios na Meta</h6>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                        Sua página foi conectada com sucesso, mas não encontramos nenhuma conta de faturamento ativa associada ao seu perfil.
                      </p>
                    </div>
                  </div>
                  
                  <div className="pl-6 space-y-1.5 text-[10px] text-slate-600">
                    <p className="leading-relaxed">1. Acesse o painel de criação da Meta: 
                      <a 
                        href="https://business.facebook.com/settings/ad-accounts" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary font-bold hover:underline inline-flex items-center gap-0.5 ml-1"
                      >
                        Abrir Configurações Meta ↗
                      </a>
                    </p>
                    <p className="leading-relaxed">2. No painel, clique em <strong>Adicionar</strong> e depois em <strong>Criar uma nova conta de anúncios</strong>.</p>
                    <p className="leading-relaxed">3. Configure a moeda como <strong>Real Brasileiro (BRL)</strong> e o fuso horário como <strong>São Paulo (GMT-3)</strong>.</p>
                  </div>

                  <div className="pt-1 pl-6">
                    <Button
                      size="sm"
                      onClick={handleRefreshAdAccounts}
                      disabled={isRefreshingAccounts}
                      className="bg-primary hover:bg-primary/95 text-white font-bold text-[9.5px] h-7 rounded-lg px-3 flex items-center gap-1.5"
                    >
                      {isRefreshingAccounts ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Buscando nova conta...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-3 w-3" />
                          Já criei, atualizar lista
                        </>
                      )}
                    </Button>
                  </div>
                </div>
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

      {/* MODAL DE FATURAMENTO E COBRANÇA */}
      <Dialog open={isBillingModalOpen} onOpenChange={setIsBillingModalOpen}>
        <DialogContent className="max-w-md font-sans">
          <DialogHeader>
            <DialogTitle className="font-poppins font-bold text-slate-900 text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Faturamento e Cobrança
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Gerencie as formas de pagamento ou adicione saldo para veicular seus anúncios locais.
            </DialogDescription>
          </DialogHeader>

          {billingGuideActive ? (
            /* Guia Passo a Passo de Pix / Boleto */
            <div className="my-4 space-y-4 text-center">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 min-h-[160px] flex flex-col justify-center">
                {billingGuideStep === 1 && (
                  <div className="space-y-3">
                    <div className="bg-primary/10 text-primary p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                      <Megaphone className="h-5 w-5" />
                    </div>
                    <h5 className="font-bold text-slate-800 text-sm">1. Acessar Configurações de Pagamento</h5>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                      Clique no botão abaixo para abrir a página oficial de faturamento da sua conta de anúncios da Meta em uma nova aba.
                    </p>
                    <Button
                      onClick={() => {
                        const cleanId = adAccountId.replace("act_", "");
                        const businessId = billingStatus?.businessId || metaConnection?.businessId || "";
                        const url = businessId
                          ? `https://business.facebook.com/billing_hub/accounts/details/?business_id=${businessId}&asset_id=${cleanId}`
                          : `https://adsmanager.facebook.com/adsmanager/manage/billing?act=${cleanId}`;
                        window.open(url, "_blank");
                      }}
                      className="bg-primary hover:bg-primary/95 text-white font-bold text-xs px-6 py-2 rounded-lg mt-2 mx-auto flex items-center gap-1.5"
                    >
                      Abrir Página da Meta ↗
                    </Button>
                  </div>
                )}

                {billingGuideStep === 2 && (
                  <div className="space-y-3">
                    <div className="bg-primary/10 text-primary p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <h5 className="font-bold text-slate-800 text-sm">2. Adicionar Fundos</h5>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                      Na página da Meta que acabou de abrir, localize e clique no botão **Adicionar Fundos** (Add Funds) na seção de saldo.
                    </p>
                  </div>
                )}

                {billingGuideStep === 3 && (
                  <div className="space-y-3">
                    <div className="bg-primary/10 text-primary p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                      <Check className="h-5 w-5" />
                    </div>
                    <h5 className="font-bold text-slate-800 text-sm">3. Escolher Pix ou Boleto</h5>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                      Selecione a opção **Pix** ou **Boleto Bancário**, defina o valor que deseja recarregar e gere o QR Code Pix ou boleto.
                    </p>
                  </div>
                )}

                {billingGuideStep === 4 && (
                  <div className="space-y-3">
                    <div className="bg-primary/10 text-primary p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                      <RefreshCw className="h-5 w-5 animate-pulse" />
                    </div>
                    <h5 className="font-bold text-slate-800 text-sm">4. Concluir Recarga</h5>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                      Realize o pagamento do QR Code Pix gerado. Quando terminar, clique no botão abaixo para atualizar seu saldo aqui no NumVapt!
                    </p>
                    <Button
                      onClick={async () => {
                        await fetchBillingStatus();
                        setBillingGuideActive(false);
                        setIsBillingModalOpen(false);
                      }}
                      className="bg-primary hover:bg-primary/95 text-white font-bold text-xs px-6 py-2 rounded-lg mt-2 mx-auto"
                    >
                      Pronto, já paguei!
                    </Button>
                  </div>
                )}
              </div>

              {/* Controles de Navegação do Guia */}
              <div className="flex justify-between items-center pt-2">
                <Button
                  variant="outline"
                  disabled={billingGuideStep === 1}
                  onClick={() => setBillingGuideStep((prev) => prev - 1)}
                  className="text-xs font-bold border-slate-200 px-4 py-1.5 h-auto rounded-lg"
                >
                  Anterior
                </Button>
                <span className="text-[11px] font-bold text-slate-400">Passo {billingGuideStep} de 4</span>
                {billingGuideStep < 4 ? (
                  <Button
                    onClick={() => setBillingGuideStep((prev) => prev + 1)}
                    className="bg-primary hover:bg-primary/95 text-white text-xs font-bold px-4 py-1.5 h-auto rounded-lg"
                  >
                    Próximo
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={() => setBillingGuideActive(false)}
                    className="text-xs font-bold text-slate-400 px-4 py-1.5 h-auto rounded-lg"
                  >
                    Sair do Guia
                  </Button>
                )}
              </div>
            </div>
          ) : (
            /* Menu Inicial de Escolha */
            <div className="my-4 space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 text-xs text-slate-650 leading-relaxed text-left">
                Selecione uma das opções abaixo para gerenciar como você pagará pelos impulsionamentos. Suas cobranças serão feitas diretamente pela Meta Ads.
              </div>

              <div className="grid grid-cols-1 gap-3">
                {/* Opção Cartão de Crédito */}
                <button
                  onClick={() => {
                    const cleanId = adAccountId.replace("act_", "");
                    const businessId = billingStatus?.businessId || metaConnection?.businessId || "";
                    const url = businessId
                      ? `https://business.facebook.com/billing_hub/accounts/details/?business_id=${businessId}&asset_id=${cleanId}`
                      : `https://adsmanager.facebook.com/adsmanager/manage/billing?act=${cleanId}`;
                    window.open(url, "_blank");
                  }}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/50 shadow-xs flex items-center justify-between text-left transition-all active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-primary/10 text-primary rounded-lg flex items-center justify-center shrink-0">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <h6 className="text-xs font-bold text-slate-800">Cartão de Crédito (Meta Ads)</h6>
                      <p className="text-[10px] text-slate-400 mt-0.5">Cadastre ou edite cartões na página de cobrança oficial da Meta.</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-350" />
                </button>

                {/* Opção Pix / Boleto (Guia) */}
                <button
                  onClick={() => {
                    setBillingGuideActive(true);
                    setBillingGuideStep(1);
                  }}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/50 shadow-xs flex items-center justify-between text-left transition-all active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-primary/10 text-primary rounded-lg flex items-center justify-center shrink-0">
                      <RefreshCw className="h-5 w-5" />
                    </div>
                    <div>
                      <h6 className="text-xs font-bold text-slate-800">Adicionar Saldo com Pix / Boleto</h6>
                      <p className="text-[10px] text-slate-400 mt-0.5">Veja o passo a passo para gerar Pix ou Boleto no painel de anúncios.</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-350" />
                </button>
              </div>

              <DialogFooter className="pt-2 border-t border-slate-100">
                <Button
                  onClick={() => setIsBillingModalOpen(false)}
                  className="bg-primary hover:bg-primary/95 text-white font-bold text-xs px-5 py-2 rounded-lg"
                >
                  Fechar
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL DE TUTORIAL: COMO ALTERNAR PERFIL NO FACEBOOK */}
      <Dialog open={isProfileSwitchTutorialOpen} onOpenChange={setIsProfileSwitchTutorialOpen}>
        <DialogContent className="max-w-xl font-sans text-slate-800 bg-[#18191a] border-slate-800 text-white rounded-2xl">
          <DialogHeader className="text-left">
            <DialogTitle className="font-poppins font-bold text-white text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Apareceu a tela errada no Facebook?
            </DialogTitle>
            <DialogDescription className="text-slate-450 text-xs leading-relaxed">
              Se você caiu em uma tela com configurações pessoais e sem a opção do WhatsApp, você precisa alternar para o perfil da sua Página comercial no topo do Facebook. Veja abaixo como fazer:
            </DialogDescription>
          </DialogHeader>

          {/* SIMULAÇÃO ANIMADA CSS */}
          <div className="relative border border-[#3e4042]/50 rounded-xl overflow-hidden bg-[#18191a] my-4 shadow-2xl select-none">
            {/* ESTILOS INLINE DE ANIMAÇÃO */}
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes cursorMovement {
                0% { transform: translate(180px, 120px); }
                15% { transform: translate(480px, 16px); } /* Move para a foto do perfil */
                20% { transform: translate(480px, 16px) scale(0.8); } /* Clique */
                25% { transform: translate(480px, 16px) scale(1); } /* Solta */
                45% { transform: translate(440px, 140px); } /* Move para selecionar a página */
                50% { transform: translate(440px, 140px) scale(0.8); } /* Clique */
                55% { transform: translate(440px, 140px) scale(1); } /* Solta */
                75% { transform: translate(440px, 140px); } /* Pausa na página ativa */
                85% { transform: translate(180px, 120px); } /* Volta */
                100% { transform: translate(180px, 120px); }
              }

              @keyframes dropdownToggle {
                0%, 20% { opacity: 0; transform: translateY(-10px) scale(0.95); visibility: hidden; }
                25%, 50% { opacity: 1; transform: translateY(0) scale(1); visibility: visible; }
                55%, 100% { opacity: 0; transform: translateY(-10px) scale(0.95); visibility: hidden; }
              }

              @keyframes clickRing {
                0%, 18%, 22%, 48%, 52%, 100% { opacity: 0; transform: scale(0.5); }
                20%, 50% { opacity: 0.8; transform: scale(1.8); }
              }

              @keyframes switchEffect {
                0%, 50% { filter: brightness(1); }
                52% { filter: brightness(0.2); }
                56%, 100% { filter: brightness(1); }
              }

              .sim-cursor {
                animation: cursorMovement 8s infinite ease-in-out;
              }
              .sim-dropdown {
                animation: dropdownToggle 8s infinite ease-in-out;
              }
              .sim-click-ring {
                animation: clickRing 8s infinite ease-in-out;
              }
              .sim-switch-page {
                animation: switchEffect 8s infinite ease-in-out;
              }
            `}} />

            {/* Simulação da Barra Superior do Facebook */}
            <div className="bg-[#242526] h-12 border-b border-[#3e4042] px-4 flex items-center justify-between text-white relative sim-switch-page">
              {/* Logo e Busca */}
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-[#1877f2] rounded-full flex items-center justify-center font-bold text-lg text-white">f</div>
                <div className="bg-[#3a3b3c] h-7 w-28 rounded-full hidden sm:block"></div>
              </div>
              
              {/* Ícones de Navegação */}
              <div className="flex items-center gap-6 text-slate-400">
                <div className="h-5 w-5 bg-transparent border-b-2 border-[#1877f2] text-[#1877f2] flex items-center justify-center">🏠</div>
                <div className="h-5 w-5">📺</div>
                <div className="h-5 w-5">👥</div>
              </div>

              {/* Botões da Direita */}
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-[#3a3b3c] flex items-center justify-center text-xs">💬</div>
                <div className="h-8 w-8 rounded-full bg-[#3a3b3c] flex items-center justify-center text-xs">🔔</div>
                {/* Foto do perfil pessoal simulada */}
                <div className="h-8 w-8 rounded-full bg-slate-500 border border-slate-600 overflow-hidden cursor-pointer relative flex items-center justify-center font-bold text-[10px] text-white">
                  VO
                  <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 rounded-full border border-white"></div>
                </div>
              </div>

              {/* Dropdown de Perfis Simulado */}
              <div className="absolute top-11 right-4 bg-[#242526] w-64 border border-[#3e4042] rounded-lg shadow-xl p-3 z-50 text-left space-y-3.5 sim-dropdown">
                {/* Cabeçalho */}
                <div className="border-b border-[#3e4042] pb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-slate-500 flex items-center justify-center font-bold text-[10px]">VO</div>
                    <div>
                      <p className="text-[11px] font-bold text-white">Seu Perfil Pessoal</p>
                      <p className="text-[9px] text-slate-400">Clique para ver todos</p>
                    </div>
                  </div>
                </div>

                {/* Linha da Página comercial (Para onde alternar) */}
                <div className="p-2 rounded-lg bg-[#3a3b3c] hover:bg-[#3a3b3c]/80 flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center font-bold text-white text-[10px] shadow-sm">
                      {whatsAppPageName ? whatsAppPageName.substring(0, 2).toUpperCase() : "NV"}
                    </div>
                    <div>
                      <p className="text-[11px] font-extrabold text-white truncate max-w-[130px]">{whatsAppPageName || "Pizzaria Teste"}</p>
                      <p className="text-[9px] text-[#1877f2] font-semibold">Alternar para esta Página</p>
                    </div>
                  </div>
                  <div className="h-5 w-5 bg-primary/20 text-primary rounded-full flex items-center justify-center text-[10px]">🔄</div>
                </div>

                <div className="text-[9px] text-slate-400 text-center font-medium">
                  Selecione sua página comercial para abrir as configurações certas.
                </div>
              </div>
            </div>

            {/* Simulação do Corpo da Página */}
            <div className="bg-[#18191a] h-36 p-4 flex flex-col justify-center items-center text-slate-450 text-xs font-poppins sim-switch-page">
              <div className="text-center space-y-2 w-full max-w-[280px]">
                <div className="h-2 w-20 bg-slate-800 rounded mx-auto"></div>
                <div className="h-3 w-40 bg-slate-800 rounded mx-auto"></div>
                <div className="h-7 w-24 bg-[#3a3b3c] rounded mx-auto mt-4"></div>
              </div>
            </div>

            {/* Cursor Simulado */}
            <div className="absolute top-0 left-0 pointer-events-none z-50 sim-cursor">
              {/* Círculo do clique */}
              <div className="absolute -top-3.5 -left-3.5 w-8 h-8 rounded-full bg-red-500 border border-red-400 sim-click-ring"></div>
              {/* Ícone de cursor de mouse */}
              <svg className="w-5 h-5 text-white filter drop-shadow-md" viewBox="0 0 24 24" fill="black" stroke="white" strokeWidth="1.5">
                <path d="M5.5 3.5l14 7-6 1.5 4 5.5-2.5 1.5-4-5.5-5.5 4v-14z" />
              </svg>
            </div>
          </div>

          {/* Passos do Tutorial */}
          <div className="space-y-3 text-sm text-slate-300 pr-1 text-left">
            <div className="flex items-start gap-2.5">
              <span className="h-5 w-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</span>
              <p className="text-xs">No canto superior direito do Facebook, clique na sua <strong>foto de perfil</strong>.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="h-5 w-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</span>
              <p className="text-xs">Clique no card com o <strong>logo e nome da sua Página Comercial</strong> para alternar para o perfil da empresa.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="h-5 w-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">✓</span>
              <p className="text-xs">Pronto! O Facebook recarregará e abrirá exatamente a tela de inserção do WhatsApp conectada à sua página.</p>
            </div>
          </div>

          <DialogFooter className="pt-2 border-t border-slate-800 gap-2">
            <Button
              variant="ghost"
              onClick={() => setIsProfileSwitchTutorialOpen(false)}
              className="text-slate-400 hover:text-white hover:bg-slate-850 font-bold text-xs px-4 py-2 rounded-lg"
            >
              Voltar
            </Button>
            <Button
              onClick={() => {
                window.open(tutorialRedirectUrl, "_blank");
                setIsProfileSwitchTutorialOpen(false);
              }}
              className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs px-5 py-2 rounded-lg flex items-center gap-1.5 border-0"
            >
              Prosseguir para o Facebook ↗
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
                <p className="text-xs text-slate-500">Passo {currentStep} de 5</p>
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
              style={{ width: `${(currentStep / 5) * 100}%` }}
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
                            Otimizado para gerar o máximo de cliques qualificados no seu anúncio. Ideal para direcionar potenciais clientes para o seu site ou perfil.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Opção WhatsApp */}
                    <div
                      onClick={() => setCampaignObjective("WHATSAPP")}
                      className={`p-5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between text-left group relative overflow-hidden shadow-sm ${
                        campaignObjective === "WHATSAPP"
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-slate-200 bg-white hover:border-primary/50 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="flex gap-4 items-start z-10">
                        <div className={`p-3 rounded-xl ${campaignObjective === "WHATSAPP" ? "bg-primary/20 text-primary" : "bg-slate-100 text-slate-600"}`}>
                          <MessageSquare className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-extrabold text-slate-900 group-hover:text-primary transition-colors">
                              Mensagens no WhatsApp
                            </span>
                            {campaignObjective === "WHATSAPP" && (
                              <Badge className="bg-primary hover:bg-primary text-white text-[9px] scale-90 py-0 font-medium">Ativo</Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed max-w-lg">
                            Otimizado para direcionar potenciais clientes diretamente para o WhatsApp comercial da sua empresa para iniciar conversas.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {campaignObjective === "WHATSAPP" && (
                    <div className="mt-4 border-t border-slate-100 pt-4 animate-in fade-in duration-200">
                      {isCheckingWhatsApp ? (
                        <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/80 flex items-center justify-center gap-3">
                          <Loader2 className="h-5 w-5 animate-spin text-green-500" />
                          <span className="text-sm text-slate-600 font-medium">Verificando vinculação do WhatsApp...</span>
                        </div>
                      ) : hasWhatsAppConnected === true ? (
                        <div className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50/80 to-emerald-50/50 overflow-hidden">
                          {/* Header */}
                          <div className="px-4 py-3 bg-green-500/10 border-b border-green-200/60 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
                                <Check className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <h6 className="text-sm font-bold text-green-800">WhatsApp Conectado</h6>
                                <p className="text-[10px] text-green-600/80 font-medium">Pronto para receber mensagens de anúncios</p>
                              </div>
                            </div>
                            <Badge className="bg-green-500/15 hover:bg-green-500/15 text-green-700 text-[9px] font-bold border-0 py-0.5">Ativo</Badge>
                          </div>

                          {/* Body */}
                          <div className="p-4 space-y-3">
                            {/* Page info with real logo */}
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/70 border border-green-100">
                              {(whatsAppPageId || metaConnection?.pageId) ? (
                                <img
                                  src={`https://graph.facebook.com/${whatsAppPageId || metaConnection.pageId}/picture?type=small${(metaConnection?.accessToken || metaConnection?.userAccessToken) ? `&access_token=${metaConnection.accessToken || metaConnection.userAccessToken}` : ""}`}
                                  alt={whatsAppPageName || "Página"}
                                  className="h-9 w-9 rounded-full object-cover shadow-sm border border-green-100"
                                />
                              ) : (
                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                  {whatsAppPageName?.charAt(0)?.toUpperCase() || "P"}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-800 truncate">{whatsAppPageName || "Página do Facebook"}</p>
                                <p className="text-[10px] text-slate-500">Página comercial do Facebook</p>
                              </div>
                            </div>

                            {/* Phone number with WhatsApp icon + inline change link */}
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/70 border border-green-100">
                              <div className="h-9 w-9 rounded-full bg-[#25D366] flex items-center justify-center shadow-sm shrink-0">
                                <svg viewBox="0 0 32 32" className="h-5 w-5 text-white" fill="currentColor">
                                  <path d="M16 3C9.373 3 4 8.373 4 15c0 2.127.553 4.174 1.604 5.99L4 29l8.187-1.574A12.94 12.94 0 0016 28c6.627 0 12-5.373 12-12S22.627 3 16 3zm6.39 17.39c-.27.76-1.59 1.45-2.18 1.49-.56.04-1.08.26-3.65-.76-3.11-1.23-5.08-4.43-5.24-4.64-.15-.2-1.26-1.67-1.26-3.19s.79-2.26 1.08-2.57c.27-.3.6-.37.8-.37s.4.01.57.01c.19.01.44-.07.68.52.27.63.9 2.2.98 2.36.08.16.13.35.03.55-.11.21-.16.33-.32.51-.15.18-.33.4-.47.53-.15.15-.31.31-.13.61.18.3.78 1.28 1.67 2.08 1.15 1.03 2.12 1.35 2.42 1.5.3.15.47.13.65-.08.18-.21.75-.87.95-1.17.2-.3.4-.25.67-.15.27.1 1.74.82 2.04.97.3.15.5.22.57.35.08.12.08.72-.19 1.42z"/>
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-800">WhatsApp Business</p>
                                <p className="text-[10px] text-slate-500">WhatsApp conectado à página</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setTutorialRedirectUrl("https://www.facebook.com/settings/?tab=linked_whatsapp");
                                  setIsProfileSwitchTutorialOpen(true);
                                }}
                                className="text-[10px] text-green-600 hover:text-green-700 font-semibold underline underline-offset-2 decoration-green-300 hover:decoration-green-500 transition-colors whitespace-nowrap shrink-0"
                              >
                                Alterar número →
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50/80 to-orange-50/30 overflow-hidden">
                          {/* Header */}
                          <div className="px-4 py-3 bg-amber-500/10 border-b border-amber-200/60 flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center shadow-sm">
                              <AlertCircle className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <h6 className="text-sm font-bold text-amber-800">WhatsApp Não Vinculado</h6>
                              <p className="text-[10px] text-amber-600/80 font-medium">Vincule um número para criar anúncios</p>
                            </div>
                          </div>

                          {/* Body */}
                          <div className="p-4 space-y-3">
                            <div className="bg-white/80 border border-amber-100 rounded-lg p-3.5 space-y-2.5">
                              <p className="text-xs font-bold text-slate-700">Como conectar em 1 minuto:</p>
                              <ol className="text-[11px] text-slate-600 list-decimal pl-4 space-y-1.5 font-medium leading-relaxed">
                                <li>Clique em <strong>"Vincular no Facebook"</strong> abaixo para abrir as configurações.</li>
                                <li>Digite seu número de WhatsApp Business e envie o código de verificação.</li>
                                <li>Confirme o código recebido no celular e clique em <strong>"Verificar conexão"</strong> aqui.</li>
                              </ol>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <Button
                                type="button"
                                onClick={() => {
                                  setTutorialRedirectUrl(whatsAppSettingsUrl || (metaConnection?.pageId ? `https://www.facebook.com/${metaConnection.pageId}/settings/?tab=whatsapp` : "https://www.facebook.com"));
                                  setIsProfileSwitchTutorialOpen(true);
                                }}
                                className="inline-flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] h-8 px-4 rounded-lg active:scale-95 transition-all shadow-sm gap-1.5 border-0"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Vincular no Facebook
                              </Button>
                              <Button
                                type="button"
                                onClick={checkWhatsAppConnection}
                                variant="outline"
                                className="font-bold text-[11px] h-8 px-3 rounded-lg gap-1.5"
                              >
                                <RefreshCw className="h-3 w-3" />
                                Verificar conexão
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
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



                  {/* Link de Destino Opcional (Alcance), Obrigatório (Tráfego), ou WhatsApp (automático) */}
                  <div className="space-y-4 pt-2">
                    {campaignObjective === "WHATSAPP" ? (
                      <div className="p-3.5 rounded-lg bg-green-50/50 border border-green-200">
                        <div className="flex items-center gap-2 mb-1">
                          <svg viewBox="0 0 24 24" className="h-4 w-4 text-green-600" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                            <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
                          </svg>
                          <span className="text-xs font-bold text-green-700">Destino: WhatsApp</span>
                        </div>
                        <p className="text-[11px] text-green-600/80 leading-relaxed">
                          O anúncio incluirá automaticamente o botão <strong>"Enviar mensagem pelo WhatsApp"</strong> que direcionará os clientes para uma conversa no WhatsApp vinculado à sua Página do Facebook.
                        </p>
                      </div>
                    ) : campaignObjective === "REACH" ? (
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

                    {/* Input de URL de Destino (não exibido para WhatsApp) */}
                    {campaignObjective !== "WHATSAPP" && (hasDestination || campaignObjective === "TRAFFIC") && (
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

                  {/* Título Chamativo (Exibido quando tem destino/botão ativo ou WhatsApp) */}
                  {(hasDestination || campaignObjective === "TRAFFIC" || campaignObjective === "WHATSAPP") && (
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
                        placeholder={campaignObjective === "WHATSAPP" ? "Ex: Fale conosco agora pelo WhatsApp!" : "Ex: Hambúrguer Artesanal Perto de Você!"}
                        maxLength={40}
                        className="rounded-lg border-slate-200 text-sm focus:ring-primary focus:border-primary"
                      />
                      <p className="text-[10px] text-slate-400">
                        Este título será exibido em destaque no anúncio, ao lado do botão <strong>{campaignObjective === "WHATSAPP" ? "\"Enviar mensagem\"" : "\"Saiba mais\""}</strong>.
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
                          className={`bg-white border-slate-200 text-sm focus:ring-primary focus:border-primary pr-9 ${selectedLocations.length > 0 ? 'border-green-300 ring-green-100' : ''}`}
                        />
                        <div className="absolute right-3 top-3 flex items-center gap-1 text-slate-400">
                          {isSearchingLocations ? (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          ) : selectedLocations.length > 0 ? (
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
                                onClick={async () => {
                                  const isAreaTarget = loc.type === "País" || loc.type === "Estado";

                                  if (isAreaTarget) {
                                    setIsSearchingLocations(true);
                                    try {
                                      const lowerName = loc.name.toLowerCase();
                                      let searchQ = loc.name;
                                      if (!lowerName.includes("brasil") && !lowerName.includes("brazil")) {
                                        searchQ = `${loc.name}, Brasil`;
                                      }
                                      const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQ)}&format=json&limit=1&polygon_geojson=1&polygon_threshold=0.01`;
                                      const nomRes = await fetch(nomUrl, {
                                        headers: {
                                          "User-Agent": "NumVaptAdsApp/1.0",
                                          "Accept-Language": "pt-BR,pt;q=0.9",
                                        }
                                      });
                                      if (nomRes.ok) {
                                        const nomData = await nomRes.json();
                                        if (nomData && nomData.length > 0) {
                                          const lat = parseFloat(nomData[0].lat);
                                          const lng = parseFloat(nomData[0].lon);
                                          const bbox = nomData[0].boundingbox ? [
                                            parseFloat(nomData[0].boundingbox[0]),
                                            parseFloat(nomData[0].boundingbox[1]),
                                            parseFloat(nomData[0].boundingbox[2]),
                                            parseFloat(nomData[0].boundingbox[3])
                                          ] : null;

                                          addLocation({
                                            name: loc.name,
                                            type: loc.type,
                                            key: loc.key || "",
                                            latitude: lat,
                                            longitude: lng,
                                            boundingBox: bbox,
                                            geoJson: nomData[0].geojson || null
                                          });
                                        } else {
                                          throw new Error("Dados da região não encontrados.");
                                        }
                                      } else {
                                        throw new Error("Erro de resposta do Nominatim.");
                                      }
                                    } catch (err) {
                                      console.warn("Erro ao buscar GeoJSON para região:", err);
                                      // Fallback para as coordenadas e bounding box originais da sugestão se disponíveis
                                      addLocation({
                                        name: loc.name,
                                        type: loc.type,
                                        key: loc.key || "",
                                        latitude: loc.latitude,
                                        longitude: loc.longitude,
                                        boundingBox: loc.boundingBox || null,
                                        geoJson: null
                                      });
                                    } finally {
                                      setIsSearchingLocations(false);
                                    }
                                  } else {
                                    // Se não for área grande (Cidade, Bairro, Endereço etc.)
                                    if (loc.latitude !== undefined && loc.longitude !== undefined) {
                                      addLocation({
                                        name: loc.name,
                                        type: loc.type,
                                        key: loc.key || "",
                                        latitude: loc.latitude,
                                        longitude: loc.longitude,
                                        boundingBox: loc.boundingBox || null,
                                        geoJson: null
                                      });
                                    } else {
                                      // Geocodificação sob demanda no cliente para endereços/regiões sem coordenadas nativas
                                      setIsSearchingLocations(true);
                                      try {
                                        const lowerName = loc.name.toLowerCase();
                                        let searchQ = loc.name;
                                        if (!lowerName.includes("brasil") && !lowerName.includes("brazil")) {
                                          searchQ = `${loc.name}, Brasil`;
                                        }
                                        const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQ)}&format=json&limit=1`;
                                        const nomRes = await fetch(nomUrl, {
                                          headers: {
                                            "User-Agent": "NumVaptAdsApp/1.0",
                                            "Accept-Language": "pt-BR,pt;q=0.9",
                                          }
                                        });
                                        if (nomRes.ok) {
                                          const nomData = await nomRes.json();
                                          if (nomData && nomData.length > 0) {
                                            const lat = parseFloat(nomData[0].lat);
                                            const lng = parseFloat(nomData[0].lon);
                                            const bbox = nomData[0].boundingbox ? [
                                              parseFloat(nomData[0].boundingbox[0]),
                                              parseFloat(nomData[0].boundingbox[1]),
                                              parseFloat(nomData[0].boundingbox[2]),
                                              parseFloat(nomData[0].boundingbox[3])
                                            ] : null;

                                            addLocation({
                                              name: loc.name,
                                              type: loc.type,
                                              key: loc.key || "",
                                              latitude: lat,
                                              longitude: lng,
                                              boundingBox: bbox,
                                              geoJson: null
                                            });
                                          } else {
                                            throw new Error("Coordenadas não encontradas.");
                                          }
                                        } else {
                                          throw new Error("Erro na geocodificação.");
                                        }
                                      } catch (err) {
                                        console.warn("Erro ao geocodificar no cliente:", err);
                                        toast({
                                          variant: "destructive",
                                          title: "Erro de Localização",
                                          description: "Não conseguimos obter o ponto exato no mapa para esta região.",
                                        });
                                      } finally {
                                        setIsSearchingLocations(false);
                                      }
                                    }
                                  }
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
                      {/* Lista de Localidades Selecionadas */}
                      {selectedLocations.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200/50">
                          {selectedLocations.map((loc, idx) => (
                            <div 
                              key={`${loc.key || 'loc'}_${idx}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-xs text-xs text-slate-700 font-medium animate-in zoom-in duration-200"
                            >
                              <MapPin className="h-3 w-3 text-primary" />
                              <span>{loc.name}</span>
                              <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold ml-0.5">({loc.type})</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedLocations(prev => prev.filter((_, i) => i !== idx));
                                }}
                                className="ml-1 text-slate-400 hover:text-red-500 focus:outline-none transition-colors"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {addressInput.length > 0 && selectedLocations.length === 0 && (
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
                          O mapa exibe visualmente todas as regiões, cidades ou endereços que você adicionou acima.
                        </span>
                      </div>
                      <div 
                        id="targeting-map" 
                        className="h-72 w-full rounded-xl border border-slate-200/80 shadow-xs relative overflow-hidden z-10 bg-slate-50"
                        style={{ minHeight: '280px' }}
                      />
                    </div>

                    {/* Lógica de Área de Cobertura Inteligente e Condicional */}
                    {selectedLocations.length > 0 && (
                      <div className="animate-in fade-in duration-300 space-y-4">
                        {selectedLocations.some((l) => l.type === "País" || l.type === "Estado") && (
                          <div className="mt-2 p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 shadow-sm">
                            <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <div className="text-[12px] text-slate-600 leading-relaxed">
                              <strong>Cobertura Ampla (País/Estado):</strong> O seu anúncio será veiculado em todo o território das regiões selecionadas.
                            </div>
                          </div>
                        )}
                        
                        {selectedLocations.some((l) => l.type !== "País" && l.type !== "Estado") && (
                          <div className="space-y-4 pt-2">
                            <div className="space-y-3 p-4 rounded-lg bg-slate-50 border border-slate-200">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-slate-700">Área de Cobertura do Anúncio (Raio ao redor de locais)</span>
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

                              <div className="mt-3 flex items-start gap-2 bg-white rounded p-2.5 border border-slate-100 shadow-xs">
                                <Info className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                <p className="text-[11px] text-slate-500 leading-normal">
                                  <span><strong>Indicado para negócios locais:</strong> O raio de <strong>{radius} km</strong> será aplicado ao redor das cidades e endereços selecionados para atrair clientes da vizinhança.</span>
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* PASSO 4: PÚBLICO-ALVO E INTERESSES */}
              {currentStep === 4 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 font-poppins flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      4. Quem deve ver seu anúncio?
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Refine o público demográfico e adicione interesses de alta relevância para direcionar seu anúncio.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Gênero */}
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-slate-700">Gênero</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          type="button"
                          variant={gender === "all" ? "default" : "outline"}
                          onClick={() => setGender("all")}
                          className={`text-xs py-2 h-auto rounded-lg font-medium border-slate-200 ${gender === "all" ? "bg-primary text-white" : "bg-white text-slate-650"}`}
                        >
                          Todos
                        </Button>
                        <Button
                          type="button"
                          variant={gender === "male" ? "default" : "outline"}
                          onClick={() => setGender("male")}
                          className={`text-xs py-2 h-auto rounded-lg font-medium border-slate-200 ${gender === "male" ? "bg-primary text-white" : "bg-white text-slate-650"}`}
                        >
                          Homens
                        </Button>
                        <Button
                          type="button"
                          variant={gender === "female" ? "default" : "outline"}
                          onClick={() => setGender("female")}
                          className={`text-xs py-2 h-auto rounded-lg font-medium border-slate-200 ${gender === "female" ? "bg-primary text-white" : "bg-white text-slate-650"}`}
                        >
                          Mulheres
                        </Button>
                      </div>
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

                    {/* Campo de Interesses por Autocomplete */}
                    <div className="space-y-2 relative">
                      <Label htmlFor="interests-search" className="text-sm font-bold text-slate-700">Interesses Recomendados (Opcional)</Label>
                      <p className="text-[11px] text-slate-500 leading-normal">
                        Adicione palavras-chave relacionadas ao seu público para encontrar pessoas com maior potencial de compra (ex: hambúrguer, pizza, cosméticos).
                      </p>
                      
                      <div className="relative">
                        <Input
                          id="interests-search"
                          value={interestsSearchQuery}
                          onChange={(e) => setInterestsSearchQuery(e.target.value)}
                          placeholder="Digite para buscar interesses... (Ex: Pizza, Beleza, Moda)"
                          className="bg-white border-slate-200 text-sm focus:ring-primary focus:border-primary pr-9"
                        />
                        <div className="absolute right-3 top-3 text-slate-450">
                          {isLoadingInterests ? (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          ) : (
                            <Search className="h-4 w-4 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {/* Sugestões do Autocomplete da Meta */}
                      {searchedInterests.length > 0 && (
                        <div className="absolute z-55 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl flex flex-col animate-in fade-in duration-200">
                          <div className="overflow-y-auto max-h-48 py-1 scrollbar-thin">
                            {searchedInterests.map((interest) => (
                              <button
                                key={interest.id}
                                type="button"
                                onClick={() => addInterest({ id: interest.id, name: interest.name, type: interest.type })}
                                className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-b-0"
                              >
                                <div className="flex flex-col truncate pr-2">
                                  <span className="font-bold text-slate-755">{interest.name}</span>
                                  {interest.path && (
                                    <span className="text-[10px] text-slate-400 font-normal mt-0.5 truncate">
                                      {interest.path.join(" > ")}
                                    </span>
                                  )}
                                </div>
                                <Plus className="h-3.5 w-3.5 text-slate-400" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Lista de Interesses Selecionados (Tags) */}
                      {selectedInterests.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedInterests.map((interest) => (
                            <div 
                              key={interest.id}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-medium animate-in zoom-in duration-150"
                            >
                              <span>{interest.name}</span>
                              <button
                                type="button"
                                onClick={() => removeInterest(interest.id)}
                                className="ml-1 text-primary/70 hover:text-red-500 focus:outline-none transition-colors"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Chips de Sugestão Estática Baseada na Categoria do Perfil */}
                      <div className="mt-3 space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-poppins">Sugestões Rápidas:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {getCategoryPresets(initialProfile?.category).map((preset) => {
                            const isSelected = selectedInterests.some(i => i.id === preset.id);
                            return (
                              <button
                                key={preset.id}
                                type="button"
                                disabled={isSelected}
                                onClick={() => addInterest(preset)}
                                className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all ${
                                  isSelected 
                                    ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed" 
                                    : "bg-white text-slate-600 border-slate-200 hover:border-primary/40 hover:bg-slate-50/50 active:scale-98"
                                }`}
                              >
                                + {preset.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Alerta de Público Muito Restrito */}
                      {selectedInterests.length > 0 && radius <= 5 && (
                        <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-start gap-2.5 text-left mt-3 animate-in slide-in-from-top-1">
                          <AlertCircle className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-slate-650 leading-relaxed">
                            <strong>Público muito restrito:</strong> Você selecionou interesses específicos com um raio de apenas {radius} km. Isso pode reduzir muito a entrega do seu anúncio. Considere aumentar o raio ou remover os interesses se o anúncio demorar para rodar.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* PASSO 5: ORÇAMENTO E SIMULAÇÃO DINÂMICA */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 font-poppins flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      5. Quanto deseja investir?
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Defina seu orçamento diário. Quanto mais você investe, para mais pessoas próximas a Meta exibirá seu post!
                    </p>
                  </div>

                  {/* Alerta de Cobrança Pendente no Wizard */}
                  {billingStatus && !billingStatus.hasPaymentMethod && (
                    <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-start gap-3 text-left animate-in slide-in-from-top-1">
                      <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h6 className="text-xs font-bold text-slate-800 font-poppins">Forma de pagamento obrigatória</h6>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          Sua conta de anúncios da Meta ainda não possui uma forma de pagamento cadastrada. Adicione um cartão de crédito ou realize uma recarga via Pix/Boleto para poder ativar este anúncio.
                        </p>
                        <Button
                          type="button"
                          onClick={() => {
                            setBillingGuideActive(false);
                            setIsBillingModalOpen(true);
                          }}
                          className="bg-primary hover:bg-primary/95 text-white font-bold text-[10px] h-8 px-3 rounded-lg mt-1"
                        >
                          Configurar Faturamento
                        </Button>
                      </div>
                    </div>
                  )}

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
                        Essas estimativas são baseadas em históricos de anúncios na Meta e podem variar
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

                {currentStep < 5 ? (
                  <Button
                    type="button"
                    onClick={() => {
                      if (currentStep === 1 && campaignObjective === "WHATSAPP" && !hasWhatsAppConnected) {
                        toast({
                          variant: "destructive",
                          title: "WhatsApp não conectado",
                          description: "Por favor, vincule seu WhatsApp comercial e atualize a conexão antes de prosseguir.",
                        });
                        return;
                      }
                      if (currentStep === 3 && selectedLocations.length === 0) {
                        toast({
                          variant: "destructive",
                          title: "Selecione uma localização oficial",
                          description: "Digite o endereço e selecione uma das opções sugeridas na lista flutuante.",
                        });
                        return;
                      }
                      setCurrentStep((prev) => prev + 1);
                    }}
                    disabled={currentStep === 1 && campaignObjective === "WHATSAPP" && hasWhatsAppConnected !== true}
                    className={`font-bold text-xs px-6 py-2 rounded-lg ${
                      currentStep === 1 && campaignObjective === "WHATSAPP" && hasWhatsAppConnected !== true
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed border-none"
                        : "bg-primary hover:bg-primary/95 text-white shadow-sm active:scale-98"
                    }`}
                  >
                    Próximo Passo
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={
                      billingStatus && !billingStatus.hasPaymentMethod
                        ? () => {
                            setIsBillingModalOpen(true);
                            setBillingGuideActive(false);
                            toast({
                              variant: "destructive",
                              title: "Faturamento necessário",
                              description: "Por favor, cadastre uma forma de pagamento para poder ativar a campanha.",
                            });
                          }
                        : handleActivateCampaign
                    }
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
                    {(hasDestination || campaignObjective === "TRAFFIC" || campaignObjective === "WHATSAPP") && (
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
                            {campaignObjective === "WHATSAPP" 
                              ? "WHATSAPP" 
                              : (customDestination ? customDestination.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0].toUpperCase() : "SEUSITE.COM.BR")}
                          </span>
                          <span className="text-xs font-bold text-slate-800 truncate block mt-1 leading-snug">
                            {headline || (campaignObjective === "WHATSAPP" ? "Fale conosco pelo WhatsApp!" : "Aproveite nossa oferta local!")}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          className={`${campaignObjective === "WHATSAPP" ? 'bg-green-500 hover:bg-green-600' : 'bg-primary hover:bg-primary'} text-white text-[10px] font-bold h-7 px-3 rounded pointer-events-none`}
                        >
                          {campaignObjective === "WHATSAPP" ? "Enviar mensagem" : "Saiba Mais"}
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
                                        className="h-8 border-slate-200 text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700 hover:border-yellow-200 font-bold text-[10px] rounded-lg px-2.5 flex items-center gap-1 transition-all duration-200 shadow-xs"
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
                                        className="h-8 border-slate-200 text-green-600 hover:bg-green-50 hover:text-green-700 hover:border-green-200 font-bold text-[10px] rounded-lg px-2.5 flex items-center gap-1 transition-all duration-200 shadow-xs"
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