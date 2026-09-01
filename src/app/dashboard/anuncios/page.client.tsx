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
import Link from "next/link";
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
  ArrowUpRight,
  BarChart3,
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
  Globe,
  Instagram,
  ArrowLeft,
  CheckCircle2,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import "leaflet/dist/leaflet.css";
import type { BusinessProfileData } from "@/lib/services/business-profile-service";
import { getScheduledPosts } from "@/lib/services/posts-service";
import { getMetaConnection, updateMetaConnection } from "@/lib/services/meta-service";
import {
  getGoogleAdsConnection,
  updateGoogleAdsConnection,
  type GoogleAdsConnectionData,
} from "@/lib/services/google-ads-service";
import {
  getGoogleAdsCampaigns,
  updateGoogleAdsCampaignStatus,
} from "@/lib/services/google-ads-service-admin";
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
        className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 shadow-sm transition-all duration-200 hover:bg-slate-50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      >
        <span className="truncate font-medium text-slate-700">
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <ChevronDown
          className={`ml-2 h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1.5 flex max-h-64 w-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl duration-200 animate-in fade-in slide-in-from-top-1">
          <div className="shrink-0 border-b border-slate-100 bg-slate-50 p-2">
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
          <div className="scrollbar-thin max-h-48 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-3 text-center text-xs italic text-slate-500">
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
                    className={`flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs transition-colors hover:bg-slate-50 ${
                      isSelected ? "bg-primary/5 font-semibold text-primary" : "text-slate-700"
                    }`}
                  >
                    <div className="flex flex-col truncate pr-2">
                      <span className="truncate">{opt.name}</span>
                      <span className="mt-0.5 text-[10px] font-normal text-slate-400">
                        ID: {opt.id}
                      </span>
                    </div>
                    {isSelected && <Check className="ml-1 h-4 w-4 shrink-0 text-primary" />}
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
  const cat = String(category || "")
    .toLowerCase()
    .trim();
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
  const [instagramFeedPosts, setInstagramFeedPosts] = useState<any[]>([]);
  const [loadingInstagramPosts, setLoadingInstagramPosts] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<"numvapt" | "instagram">("numvapt");
  const [campaigns, setCampaigns] = useState<AdCampaignData[]>([]);
  const [activeDashboardTab, setActiveDashboardTab] = useState<"active" | "history">("active");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfileData | null>(
    initialProfile
  );
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

  // Conexão Google Ads Pago
  const [googleAdsConnection, setGoogleAdsConnection] = useState<GoogleAdsConnectionData>({
    isConnected: false,
  });
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [googleAccounts, setGoogleAccounts] = useState<Array<{ id: string; name: string; managerCustomerId?: string }>>([]);
  const [isGoogleAccountModalOpen, setIsGoogleAccountModalOpen] = useState(false);
  const [googleAccountSearchQuery, setGoogleAccountSearchQuery] = useState("");
  const [googleCampaigns, setGoogleCampaigns] = useState<any[]>([]);
  const [activePlatformTab, setActivePlatformTab] = useState<"meta" | "google">("meta");
  const [isSubmittingGoogle, setIsSubmittingGoogle] = useState(false);

  // Estados do Wizard do Google Ads
  const [isCreatingGoogleAd, setIsCreatingGoogleAd] = useState(false);
  const [googleWizardStep, setGoogleWizardStep] = useState<1 | 2 | 3>(1);
  const [googleHeadlines, setGoogleHeadlines] = useState<string[]>(["", "", ""]);
  const [googleDescriptions, setGoogleDescriptions] = useState<string[]>(["", ""]);
  const [googleKeywords, setGoogleKeywords] = useState<string[]>([]);
  const [newKeywordInput, setNewKeywordInput] = useState("");
  const [googleDailyBudget, setGoogleDailyBudget] = useState(15);
  const [googleDurationDays, setGoogleDurationDays] = useState(7);
  const [googleAdName, setGoogleAdName] = useState("");
  const [googleWebsiteUrl, setGoogleWebsiteUrl] = useState("");

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
  const [platforms, setPlatforms] = useState<Array<"instagram" | "facebook">>([
    "instagram",
    "facebook",
  ]);
  const [radius, setRadius] = useState<number>(5);
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 55]);
  const [gender, setGender] = useState<"all" | "male" | "female">("all");
  const [dailyBudget, setDailyBudget] = useState<number>(15);
  const [duration, setDuration] = useState<number>(7);
  const [addressInput, setAddressInput] = useState("");
  const [customDestination, setCustomDestination] = useState("");
  const [campaignObjective, setCampaignObjective] = useState<"REACH" | "TRAFFIC" | "WHATSAPP">(
    "REACH"
  );
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
  const mapInstanceRef = useRef<any>(null);

  // Estados para Faturamento / Cobrança
  const [billingStatus, setBillingStatus] = useState<any>(null);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [billingGuideActive, setBillingGuideActive] = useState(false);
  const [billingGuideStep, setBillingGuideStep] = useState(1);

  // Estados para Interesses e Público
  const [selectedInterests, setSelectedInterests] = useState<
    Array<{ id: string; name: string; type?: string }>
  >([]);
  const [interestsSearchQuery, setInterestsSearchQuery] = useState("");
  const [searchedInterests, setSearchedInterests] = useState<any[]>([]);
  const [isLoadingInterests, setIsLoadingInterests] = useState(false);

  const addLocation = (newLoc: any) => {
    setSelectedLocations((prev) => {
      const isDuplicate = prev.some(
        (l) =>
          (l.key && l.key === newLoc.key && l.key !== "") ||
          (typeof l.latitude === "number" &&
            l.latitude === newLoc.latitude &&
            l.longitude === newLoc.longitude)
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
        let suggestions = data.success ? data.locations || [] : [];

        // Fallback Client-side Nominatim if server returned few or no results
        if (suggestions.length === 0) {
          try {
            const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val.toLowerCase().includes("brasil") || val.toLowerCase().includes("brazil") ? val : val + ", Brasil")}&format=json&limit=5&countrycodes=br&addressdetails=1`;
            const nomRes = await fetch(nomUrl, {
              headers: { "Accept-Language": "pt-BR,pt;q=0.9" },
            });
            if (nomRes.ok) {
              const nomData = await nomRes.json();
              const nomSuggestions = nomData
                .filter((item: any) => item.type !== "postcode" && item.class !== "postcode")
                .map((item: any, index: number) => {
                  const address = item.address || {};
                  let displayName = item.display_name
                    .replace(", Brasil", "")
                    .replace(", Brazil", "");
                  let ptType = "Endereço";
                  if (
                    address.country &&
                    !address.state &&
                    !address.city &&
                    !address.suburb &&
                    !address.road
                  )
                    ptType = "País";
                  else if (address.state && !address.city && !address.suburb && !address.road)
                    ptType = "Estado";
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
                    boundingBox: item.boundingbox
                      ? [
                          parseFloat(item.boundingbox[0]),
                          parseFloat(item.boundingbox[1]),
                          parseFloat(item.boundingbox[2]),
                          parseFloat(item.boundingbox[3]),
                        ]
                      : undefined,
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
    if (businessProfile) {
      if (!customDestination) {
        setCustomDestination(businessProfile.website || businessProfile.instagram || "");
      }
      if (!googleWebsiteUrl) {
        setGoogleWebsiteUrl(businessProfile.website || businessProfile.instagram || "");
      }
    }
  }, [businessProfile, customDestination, googleWebsiteUrl]);

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

  // 1. Tenta geocodificar o endereço do perfil de negócios quando o Passo 3 inicia sem coordenadas selecionadas
  useEffect(() => {
    if (currentStep === 3 && selectedLocations.length === 0 && businessProfile?.address) {
      const geocodeProfileAddress = async () => {
        try {
          const res = await fetch(
            `/api/ads/locations?q=${encodeURIComponent(businessProfile.address)}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data.locations && data.locations.length > 0) {
              const loc = data.locations[0];
              setSelectedLocations([
                {
                  name: loc.name,
                  type: loc.type,
                  key: loc.key || "",
                  latitude: loc.latitude,
                  longitude: loc.longitude,
                  boundingBox: loc.boundingBox || null,
                  geoJson: null,
                },
              ]);
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

  // 2. Inicializa e sincroniza o mapa Leaflet de forma autônoma e local
  useEffect(() => {
    if (currentStep !== 3 || typeof window === "undefined") return;

    let isMounted = true;

    const initMap = async () => {
      const L = (await import("leaflet")).default;
      if (!isMounted) return;

      const mapContainer = document.getElementById("targeting-map");
      if (!mapContainer) return;

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

      const syncMapElements = (map: any) => {
        if (mapLayersRef.current) {
          mapLayersRef.current.forEach((layer) => {
            try {
              map.removeLayer(layer);
            } catch {}
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
                  weight: 2,
                },
              }).addTo(map);
              mapLayersRef.current.push(geoJsonLayer);
              bounds.extend(geoJsonLayer.getBounds());
              hasLayers = true;
            } else if (loc.boundingBox) {
              const b: [[number, number], [number, number]] = [
                [loc.boundingBox[0], loc.boundingBox[2]],
                [loc.boundingBox[1], loc.boundingBox[3]],
              ];
              const rect = L.rectangle(b, {
                color: "#0284c7",
                fillColor: "#0284c7",
                fillOpacity: 0.2,
                weight: 2,
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
                iconUrl: "data:image/svg+xml;base64," + btoa(pinSvg),
                iconSize: [36, 36],
                iconAnchor: [18, 36],
              });
              const marker = L.marker(latLng, {
                icon: customPinIcon,
                draggable: false,
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
        setTimeout(() => {
          mapInstanceRef.current?.invalidateSize();
        }, 100);
        return;
      }

      if ((mapContainer as any)._leaflet_id) {
        delete (mapContainer as any)._leaflet_id;
      }

      try {
        const map = L.map("targeting-map", {
          center: [initialLat, initialLng],
          zoom: zoomLevel,
          zoomControl: true,
        });
        mapInstanceRef.current = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        syncMapElements(map);

        setTimeout(() => {
          if (isMounted && mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        }, 100);
        setTimeout(() => {
          if (isMounted && mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        }, 350);
      } catch (err) {
        console.warn("[LEAFLET_MAP_INIT_ERROR]", err);
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {}
        mapInstanceRef.current = null;
        mapLayersRef.current = [];
      }
    };
  }, [currentStep, selectedLocations, radius]);

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

  const fetchInstagramPosts = useCallback(async () => {
    if (!userId) return;
    setLoadingInstagramPosts(true);
    try {
      const res = await fetch("/api/ads/instagram-posts");
      const data = await res.json();
      if (data.success && Array.isArray(data.posts)) {
        setInstagramFeedPosts(data.posts);
      } else {
        console.warn("Nenhum post retornado do Instagram:", data?.error || data?.message);
        setInstagramFeedPosts([]);
      }
    } catch (e) {
      console.error("Erro ao buscar posts do Instagram:", e);
      setInstagramFeedPosts([]);
    } finally {
      setLoadingInstagramPosts(false);
    }
  }, [userId]);

  // Carrega campanhas e posts publicados em paralelo
  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setLoadingPosts(true);
    try {
      // 1. Buscar conexões e posts em paralelo de forma ultra rápida
      const [postsResult, metaConn, googleAdsConn] = await Promise.all([
        getScheduledPosts(userId),
        getMetaConnection(userId),
        getGoogleAdsConnection(userId),
      ]);

      // Atualizar conexões imediatamente para a UI não dar flash
      setMetaConnection(metaConn);
      if (metaConn.userAccessToken) {
        setExchangeToken(metaConn.userAccessToken);
      }
      if (metaConn.isConnected && metaConn.adAccountId) {
        setAdAccountId(metaConn.adAccountId);
        setAdAccountName(metaConn.adAccountName || "");
        fetchBillingStatus();
      }

      setGoogleAdsConnection(googleAdsConn);

      // Posts publicados
      const filteredPosts = postsResult
        .filter((r: any) => r.success && r.post && r.post.status === "published")
        .map((r: any) => r.post);
      setPublishedPosts(filteredPosts);
      setLoadingPosts(false);

      // 2. Buscar campanhas de ambas as plataformas em paralelo
      const campaignPromises: Promise<any>[] = [];

      if (metaConn.isConnected && metaConn.adAccountId) {
        campaignPromises.push(
          fetch("/api/ads/campaigns")
            .then((r) => r.json())
            .then((campaignsData) => {
              if (campaignsData.success) {
                setCampaigns(campaignsData.campaigns || []);
              } else {
                console.warn("Falha ao buscar campanhas reais da Meta:", campaignsData.error);
                setCampaigns([]);
              }
            })
            .catch((err) => {
              console.warn("Erro ao buscar campanhas Meta:", err);
              setCampaigns([]);
            })
        );
      } else {
        setCampaigns([]);
      }

      if (googleAdsConn.isConnected && googleAdsConn.adAccountId) {
        campaignPromises.push(
          getGoogleAdsCampaigns(userId, googleAdsConn.adAccountId)
            .then((googleCampaignsResult) => {
              setGoogleCampaigns(googleCampaignsResult || []);
            })
            .catch((err) => {
              console.warn("Erro ao buscar campanhas Google:", err);
              setGoogleCampaigns([]);
            })
        );
      } else {
        setGoogleCampaigns([]);
      }

      await Promise.all(campaignPromises);
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
        "ads_read",
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
          redirectUri: `${window.location.origin}/dashboard/anuncios`,
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
            description:
              "Certifique-se de que concluiu a criação da conta na Meta antes de tentar atualizar.",
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
    if (
      confirm(
        "Tem certeza que deseja desconectar a conta de anúncios da Meta? Isso removerá a visualização das métricas."
      )
    ) {
      await updateMetaConnection(user.uid, { isConnected: false });
      setAdAccountId("");
      setAdAccountName("");
      setMetaConnection({ isConnected: false });
      fetchData();
      toast({ title: "Desconectado", description: "A integração com o Meta Ads foi removida." });
    }
  };

  // Conexão Google Ads
  const handleConnectGoogleAds = () => {
    const clientId =
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      "569130702994-a9gjs7gopkquehcui77s58umbdrupql5.apps.googleusercontent.com";
    const origin = window.location.origin;
    const redirectUri = `${origin}/dashboard/anuncios`;

    const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    googleAuthUrl.searchParams.append("client_id", clientId);
    googleAuthUrl.searchParams.append("redirect_uri", redirectUri);
    googleAuthUrl.searchParams.append("response_type", "code");
    googleAuthUrl.searchParams.append("scope", "https://www.googleapis.com/auth/adwords");
    googleAuthUrl.searchParams.append("access_type", "offline");
    googleAuthUrl.searchParams.append("prompt", "consent");
    googleAuthUrl.searchParams.append("state", `google_ads:${user?.uid}`);

    window.location.href = googleAuthUrl.toString();
  };

  const runGoogleAdsConnectionFlow = async (code: string, state: string) => {
    if (!user) return;
    setIsConnectingGoogle(true);
    try {
      toast({
        title: "Autenticando com o Google",
        description: "Buscando contas de anúncios qualificadas.",
      });

      const response = await fetch("/api/google-ads/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          state,
          origin: window.location.origin,
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Erro desconhecido ao conectar com Google Ads.");
      }

      if (result.accounts && result.accounts.length > 0) {
        setGoogleAccounts(result.accounts);
        if (result.accounts.length === 1) {
          await handleSelectGoogleAdsAccount(
            result.accounts[0].id,
            result.accounts[0].name,
            result.accounts[0].managerCustomerId
          );
        } else {
          setIsGoogleAccountModalOpen(true);
        }
      } else {
        throw new Error("Nenhuma conta de anúncios vinculada a este perfil Google.");
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Falha de Conexão",
        description: err.message,
      });
    } finally {
      setIsConnectingGoogle(false);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const handleSelectGoogleAdsAccount = async (
    accountId: string,
    accountName: string,
    managerCustomerId?: string
  ) => {
    if (!user) return;
    try {
      await updateGoogleAdsConnection(user.uid, {
        isConnected: true,
        adAccountId: accountId,
        adAccountName: accountName,
        managerCustomerId: managerCustomerId || "",
      });
      toast({
        title: "Conectado!",
        description: `Sua conta "${accountName}" foi associada com sucesso.`,
      });
      setIsGoogleAccountModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro ao Selecionar Conta",
        description: err.message,
      });
    }
  };

  const handleDisconnectGoogleAds = async () => {
    if (!user) return;
    if (
      confirm(
        "Tem certeza que deseja desconectar o Google Ads? Isso ocultará o painel de campanhas locais."
      )
    ) {
      await updateGoogleAdsConnection(user.uid, { isConnected: false });
      setGoogleCampaigns([]);
      setGoogleAdsConnection({ isConnected: false });
      fetchData();
      toast({ title: "Desconectado", description: "A integração com o Google Ads foi removida." });
    }
  };

  // Handlers para Títulos dinâmicos do Google Ads (Mínimo 3, Máximo 15)
  const handleAddGoogleHeadline = () => {
    if (googleHeadlines.length < 15) {
      setGoogleHeadlines([...googleHeadlines, ""]);
    }
  };

  const handleRemoveGoogleHeadline = (index: number) => {
    if (googleHeadlines.length > 3) {
      setGoogleHeadlines(googleHeadlines.filter((_, i) => i !== index));
    }
  };

  const handleUpdateGoogleHeadline = (index: number, value: string) => {
    const updated = [...googleHeadlines];
    updated[index] = value;
    setGoogleHeadlines(updated);
  };

  // Handlers para Descrições dinâmicas do Google Ads (Mínimo 2, Máximo 4)
  const handleAddGoogleDescription = () => {
    if (googleDescriptions.length < 4) {
      setGoogleDescriptions([...googleDescriptions, ""]);
    }
  };

  const handleRemoveGoogleDescription = (index: number) => {
    if (googleDescriptions.length > 2) {
      setGoogleDescriptions(googleDescriptions.filter((_, i) => i !== index));
    }
  };

  const handleUpdateGoogleDescription = (index: number, value: string) => {
    const updated = [...googleDescriptions];
    updated[index] = value;
    setGoogleDescriptions(updated);
  };

  // Sugestões inteligentes de Títulos com 1 clique
  const handleApplyHeadlineSuggestion = (suggestion: string) => {
    const emptyIndex = googleHeadlines.findIndex((h) => !h.trim());
    if (emptyIndex !== -1) {
      handleUpdateGoogleHeadline(emptyIndex, suggestion);
    } else if (googleHeadlines.length < 15) {
      setGoogleHeadlines([...googleHeadlines, suggestion]);
    }
  };

  // Sugestões inteligentes de Descrições com 1 clique
  const handleApplyDescriptionSuggestion = (suggestion: string) => {
    const emptyIndex = googleDescriptions.findIndex((d) => !d.trim());
    if (emptyIndex !== -1) {
      handleUpdateGoogleDescription(emptyIndex, suggestion);
    } else if (googleDescriptions.length < 4) {
      setGoogleDescriptions([...googleDescriptions, suggestion]);
    }
  };

  // Sugestão de Palavra-chave com 1 clique
  const handleAddKeywordSuggestion = (keyword: string) => {
    if (!googleKeywords.includes(keyword)) {
      setGoogleKeywords([...googleKeywords, keyword]);
    }
  };

  // Validação da Etapa 1
  const validateGoogleStep1 = () => {
    if (!googleAdName.trim()) {
      toast({
        variant: "destructive",
        title: "Nome da Campanha Obrigatório",
        description: "Por favor, defina um nome para a sua campanha.",
      });
      return false;
    }
    if (!googleWebsiteUrl.trim()) {
      toast({
        variant: "destructive",
        title: "Link de Destino Obrigatório",
        description: "Por favor, insira o link de destino (site ou WhatsApp).",
      });
      return false;
    }
    return true;
  };

  // Validação da Etapa 2
  const validateGoogleStep2 = () => {
    const validHeadlines = googleHeadlines.map((h) => h.trim()).filter(Boolean);
    if (validHeadlines.length < 3) {
      toast({
        variant: "destructive",
        title: "Mínimo de 3 Títulos Obrigatórios",
        description: "O Google Ads exige pelo menos 3 títulos preenchidos.",
      });
      return false;
    }

    for (let i = 0; i < googleHeadlines.length; i++) {
      const h = googleHeadlines[i].trim();
      if (!h) continue;
      if (h.includes("!")) {
        toast({
          variant: "destructive",
          title: "Regra do Google Ads",
          description: `O Título ${i + 1} não pode conter pontos de exclamação (!). O Google proíbe exclamações em títulos.`,
        });
        return false;
      }
      if (h === h.toUpperCase() && /[A-Z]/.test(h) && h.length > 3) {
        toast({
          variant: "destructive",
          title: "Regra do Google Ads",
          description: `O Título ${i + 1} não deve ser escrito inteiramente em MAIÚSCULAS.`,
        });
        return false;
      }
    }

    const validDescriptions = googleDescriptions.map((d) => d.trim()).filter(Boolean);
    if (validDescriptions.length < 2) {
      toast({
        variant: "destructive",
        title: "Mínimo de 2 Descrições Obrigatórias",
        description: "O Google Ads exige pelo menos 2 descrições preenchidas.",
      });
      return false;
    }

    for (let i = 0; i < googleDescriptions.length; i++) {
      const d = googleDescriptions[i].trim();
      if (!d) continue;
      const exclamations = (d.match(/!/g) || []).length;
      if (exclamations > 1) {
        toast({
          variant: "destructive",
          title: "Regra do Google Ads",
          description: `A Descrição ${i + 1} pode conter no máximo um (1) único ponto de exclamação (!).`,
        });
        return false;
      }
      if (d.includes("!!")) {
        toast({
          variant: "destructive",
          title: "Regra do Google Ads",
          description: `A Descrição ${i + 1} não pode conter exclamações repetidas (ex: !!).`,
        });
        return false;
      }
      if (d === d.toUpperCase() && /[A-Z]/.test(d) && d.length > 5) {
        toast({
          variant: "destructive",
          title: "Regra do Google Ads",
          description: `A Descrição ${i + 1} não deve ser escrita inteiramente em MAIÚSCULAS.`,
        });
        return false;
      }
    }

    return true;
  };

  // Validação da Etapa 3
  const validateGoogleStep3 = () => {
    if (googleKeywords.length === 0) {
      toast({
        variant: "destructive",
        title: "Palavras-chave Obrigatórias",
        description: "Por favor, adicione pelo menos uma palavra-chave para os clientes encontrarem seu anúncio.",
      });
      return false;
    }

    if (!googleDailyBudget || googleDailyBudget <= 0) {
      toast({
        variant: "destructive",
        title: "Orçamento Obrigatório",
        description: "Por favor, defina um orçamento diário válido maior que zero.",
      });
      return false;
    }

    return true;
  };

  const handlePublishGoogleCampaign = async () => {
    if (!user || !googleAdsConnection.adAccountId) return;
    
    if (!validateGoogleStep1() || !validateGoogleStep2() || !validateGoogleStep3()) {
      return;
    }

    let websiteUrl = googleWebsiteUrl.trim();
    if (websiteUrl && !/^https?:\/\//i.test(websiteUrl)) {
      websiteUrl = `https://${websiteUrl}`;
    }

    setIsSubmittingGoogle(true);
    try {
      const activeHeadlines = googleHeadlines.map((h) => h.trim()).filter(Boolean);
      const activeDescriptions = googleDescriptions.map((d) => d.trim()).filter(Boolean);

      const response = await fetch("/api/google-ads/campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          customerId: googleAdsConnection.adAccountId,
          name: googleAdName,
          dailyBudget: googleDailyBudget,
          durationDays: googleDurationDays,
          headline1: activeHeadlines[0] || googleAdName,
          headline2: activeHeadlines[1] || "",
          headline3: activeHeadlines[2] || "",
          headlines: activeHeadlines,
          description1: activeDescriptions[0] || "",
          description2: activeDescriptions[1] || "",
          descriptions: activeDescriptions,
          keywords: googleKeywords,
          finalUrl: websiteUrl,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Falha ao publicar anúncio no Google Ads.");
      }

      toast({
        title: "Campanha Publicada no Google Ads!",
        description: "Seu anúncio de pesquisa local já foi configurado e enviado com sucesso.",
      });

      setIsCreatingGoogleAd(false);
      setGoogleWizardStep(1);
      // Limpa formulário
      setGoogleAdName("");
      setGoogleHeadlines(["", "", ""]);
      setGoogleDescriptions(["", ""]);
      setGoogleKeywords([]);
      setNewKeywordInput("");
      setGoogleWebsiteUrl("");

      fetchData();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro ao Publicar Campanha",
        description: err.message,
      });
    } finally {
      setIsSubmittingGoogle(false);
    }
  };

  const handleToggleGoogleStatus = async (campaign: any) => {
    if (!user || !googleAdsConnection.adAccountId || !campaign.id) return;
    const originalStatus = campaign.status;
    const newStatus = originalStatus === "active" ? "PAUSED" : "ENABLED";
    try {
      toast({
        title: "Atualizando status...",
        description: "Enviando alteração para o Google Ads.",
      });

      const success = await updateGoogleAdsCampaignStatus(
        user.uid,
        googleAdsConnection.adAccountId,
        campaign.id,
        newStatus
      );

      if (success && (success as any).success) {
        toast({
          title: "Status Atualizado",
          description: `A campanha foi ${newStatus === "ENABLED" ? "ativada" : "pausada"} no Google Ads.`,
        });
        fetchData();
      } else {
        throw new Error((success as any).error || "Falha ao sincronizar status.");
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro ao Atualizar",
        description: err.message,
      });
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && user) {
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      if (code && !effectRan.current) {
        effectRan.current = true;
        if (state && state.startsWith("google_ads:")) {
          runGoogleAdsConnectionFlow(code, state);
        } else {
          runMetaAdsConnectionFlow(code);
        }
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

  // Carrega posts do Instagram ao alternar para a aba correspondente
  useEffect(() => {
    if (
      activeModalTab === "instagram" &&
      instagramFeedPosts.length === 0 &&
      isChoosePostModalOpen
    ) {
      fetchInstagramPosts();
    }
  }, [activeModalTab, instagramFeedPosts.length, isChoosePostModalOpen, fetchInstagramPosts]);

  // Reseta a aba selecionada no modal ao fechar o modal
  useEffect(() => {
    if (!isChoosePostModalOpen) {
      setActiveModalTab("numvapt");
    }
  }, [isChoosePostModalOpen]);

  const addInterest = (interest: { id: string; name: string; type?: string }) => {
    if (selectedInterests.length >= 5) {
      toast({
        variant: "destructive",
        title: "Limite de interesses atingido",
        description:
          "Você pode selecionar no máximo 5 interesses para manter o público qualificado.",
      });
      return;
    }
    if (selectedInterests.some((i) => i.id === interest.id)) {
      return;
    }
    setSelectedInterests((prev) => [...prev, interest]);
    setInterestsSearchQuery("");
    setSearchedInterests([]);
  };

  const removeInterest = (id: string) => {
    setSelectedInterests((prev) => prev.filter((i) => i.id !== id));
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

  // Abre o modal de escolha de post validando previamente se há forma de pagamento ativa
  const handleOpenChoosePostModal = () => {
    if (billingStatus && !billingStatus.hasPaymentMethod) {
      setIsBillingModalOpen(true);
      setBillingGuideActive(false);
      toast({
        variant: "destructive",
        title: "Forma de pagamento necessária",
        description:
          "Sua conta de anúncios da Meta ainda não possui uma forma de pagamento ativa (cartão, Pix ou boleto). Configure o faturamento para poder impulsionar.",
      });
      return;
    }
    setIsChoosePostModalOpen(true);
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
        description:
          "Selecione uma conta de anúncios ativa nas configurações antes de ativar o anúncio.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Nomenclatura dinâmica automática baseada no início da descrição se o nome estiver vazio
      const finalAdName =
        adName ||
        (bodyText
          ? bodyText.length > 25
            ? `${bodyText.substring(0, 25)}...`
            : bodyText
          : "Impulsionamento Rápido Meta");

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
            address: selectedLocations.map((l) => l.name).join(", ") || "Centro Comercial Local",
            radiusKm: radius,
            ageMin: ageRange[0],
            ageMax: ageRange[1],
            gender,
            interests: selectedInterests.map((i) => ({
              id: i.id,
              name: i.name,
              type: i.type || "",
            })),
            locations: selectedLocations.map((l) => ({
              name: l.name,
              type: l.type,
              key: l.key,
              latitude: l.latitude || null,
              longitude: l.longitude || null,
            })),
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
          address: selectedLocations.map((l) => l.name).join(", ") || "Centro Comercial Local",
          radiusKm: radius,
          ageMin: ageRange[0],
          ageMax: ageRange[1],
          gender,
          interests: selectedInterests.map((i) => ({ id: i.id, name: i.name, type: i.type || "" })),
          locations: selectedLocations.map((l) => ({
            name: l.name,
            type: l.type,
            key: l.key,
            latitude: l.latitude || null,
            longitude: l.longitude || null,
          })),
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
        description:
          err.message || "Não conseguimos enviar os criativos para a Meta. Tente novamente.",
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
    if (
      confirm("Tem certeza que deseja remover esta campanha de anúncio da Meta e do seu histórico?")
    ) {
      try {
        const res = await fetch(
          `/api/ads/campaigns?campaignId=${campaign.id}&metaCampaignId=${campaign.metaCampaignId}`,
          {
            method: "DELETE",
          }
        );
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
    return <Badge className={`${c.color} border-none px-2 py-0.5 font-semibold`}>{c.label}</Badge>;
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
  const isMetaActive = !!(metaConnection.isConnected && (metaConnection.adAccountId || adAccountId));
  const isGoogleActive = !!(googleAdsConnection.isConnected && googleAdsConnection.adAccountId);
  const isAnyActive = isMetaActive || isGoogleActive;

  useEffect(() => {
    if (isMetaActive && !isGoogleActive) {
      setActivePlatformTab("meta");
    } else if (isGoogleActive && !isMetaActive) {
      setActivePlatformTab("google");
    }
  }, [isMetaActive, isGoogleActive]);

  const dateRangeText = (() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);

    const format = (date: Date) => {
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    return `de ${format(start)} até ${format(end)}`;
  })();

  const filteredGoogleAccounts = googleAccounts.filter(
    (acc) =>
      acc.name.toLowerCase().includes(googleAccountSearchQuery.toLowerCase()) ||
      acc.id.toLowerCase().includes(googleAccountSearchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto max-w-7xl p-6 font-sans text-slate-800">
      {(isConnectingGoogle || isConnectingMeta) && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="flex flex-col items-center gap-4 rounded-lg bg-white p-8 shadow-2xl max-w-xs w-full mx-4 border border-slate-100 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-slate-900">
                {isConnectingGoogle ? "Conectando ao Google Ads..." : "Conectando ao Facebook Meta..."}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Aguarde enquanto sincronizamos as suas contas e permissões em tempo real.
              </p>
            </div>
          </div>
        </div>
      )}
      {/* HEADER PRINCIPAL */}
      <div className="mb-8 flex flex-col items-start justify-between gap-6 border-b border-slate-100 pb-6 md:flex-row md:items-center">
        <div className="max-w-3xl text-left">
          <h1 className="font-poppins flex items-center gap-2.5 text-2xl font-extrabold tracking-tight text-slate-900">
            <Megaphone className="h-7 w-7 text-primary" />
            Central de Anúncios
          </h1>
          <p className="font-inter mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
            Atraia novos clientes para o seu negócio impulsionando publicações no Instagram/Facebook
            ou aparecendo no topo das buscas do Google.
          </p>

          {/* Status compactos de conexões */}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {isMetaActive ? (
              <div className="shadow-2xs inline-flex items-center gap-2 rounded-xl border border-blue-100/50 bg-blue-50/50 px-3 py-1.5 text-xs font-bold text-[#1877F2]">
                <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-500"></span>
                <span>Meta Ads Conectado: </span>
                <span className="font-inter font-semibold text-slate-600">{adAccountName}</span>
                <button
                  onClick={handleDisconnectMetaAds}
                  className="font-inter ml-1.5 text-[10px] font-semibold text-slate-400 underline decoration-dotted transition-colors hover:text-red-500"
                  title="Desconectar conta da Meta"
                >
                  (desconectar)
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnectMetaAds}
                className="shadow-2xs inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50"
              >
                🔌 Conectar Meta Ads
              </button>
            )}

            {isGoogleActive ? (
              <div className="shadow-2xs inline-flex items-center gap-2 rounded-xl border border-blue-100/50 bg-blue-50/50 px-3 py-1.5 text-xs font-bold text-[#4285F4]">
                <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-500"></span>
                <span>Google Ads Conectado: </span>
                <span className="font-inter font-semibold text-slate-600">
                  {googleAdsConnection.adAccountName || "Conta Local"}
                </span>
                <button
                  onClick={handleDisconnectGoogleAds}
                  className="font-inter ml-1.5 text-[10px] font-semibold text-slate-400 underline decoration-dotted transition-colors hover:text-red-500"
                  title="Desconectar conta do Google"
                >
                  (desconectar)
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnectGoogleAds}
                className="shadow-2xs inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50"
              >
                🔌 Conectar Google Ads
              </button>
            )}
          </div>
        </div>
      </div>

      {/* BANNER DE PREVENÇÃO DE COBRANÇA PENDENTE */}
      {!isCreating &&
        isMetaActive &&
        billingStatus &&
        !billingStatus.hasPaymentMethod && (
          <div className="mb-6 flex flex-col justify-between gap-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 duration-300 animate-in fade-in slide-in-from-top-2 md:flex-row md:items-center">
            <div className="flex items-start gap-3 text-left">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
              <div>
                <h5 className="font-poppins text-xs font-bold text-slate-900">
                  Forma de pagamento pendente
                </h5>
                <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                  Você precisa configurar uma forma de faturamento (cartão, Pix ou boleto) na Meta
                  para ativar novos anúncios. Seus anúncios atuais podem ser pausados se não houver
                  saldo.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center">
              <Button
                onClick={() => {
                  setBillingGuideActive(false);
                  setIsBillingModalOpen(true);
                }}
                size="sm"
                className="h-8 rounded-lg bg-amber-600 px-4 text-[11px] font-bold text-white shadow-xs transition-colors hover:bg-amber-700 active:scale-95"
              >
                Configurar Faturamento
              </Button>
            </div>
          </div>
        )}

      {/* ONBOARDING / CONFIGURAÇÃO DE CONEXÃO META ADS */}
      {!isCreating && user && !isMetaActive && !isGoogleActive && (
        <div className="mb-8">
          {isConnectingMeta ? (
            <div className="flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-sm font-semibold text-slate-600">
                Processando conexão com a Meta...
              </span>
            </div>
          ) : metaConnection.isConnected &&
            metaConnection.adAccountId ? null : metaConnection.isConnected ? (
            <div className="flex flex-col items-start justify-between gap-6 rounded-xl border border-blue-500/15 bg-blue-50/10 p-6 shadow-md transition-all duration-300 hover:shadow-lg md:flex-row md:items-center">
              <div className="flex items-start gap-4 md:items-center">
                <div className="animate-pulse rounded-xl bg-blue-500/10 p-3 text-blue-600">
                  <Megaphone className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold leading-tight text-slate-900">
                    Facebook Conectado
                  </h4>
                  <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-500">
                    Sua conta do Facebook está conectada. Agora, selecione qual conta de anúncios
                    ativa receberá as cobranças e os seus impulsionamentos.
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
                      body: JSON.stringify({
                        userAccessToken:
                          metaConnection.userAccessToken || metaConnection.accessToken,
                      }),
                    })
                      .then((res) => res.json())
                      .then((pagesResult) => {
                        if (pagesResult.success) {
                          setMetaPages(pagesResult.pages || []);
                          if (pagesResult.pages?.length > 0)
                            setSelectedPageId(pagesResult.pages[0].id);
                        }
                        return fetch("/api/ads/accounts");
                      })
                      .then((res) => res.json())
                      .then((accountsResult) => {
                        if (accountsResult.success) {
                          setMetaAdAccounts(accountsResult.accounts || []);
                          if (accountsResult.accounts?.length > 0)
                            setSelectedAdAccountIdState(accountsResult.accounts[0].id);
                        }
                      })
                      .catch((e) => console.error("Erro ao buscar ativos:", e))
                      .finally(() => setIsConnectingMeta(false));
                  }
                }}
                className="font-poppins flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-xs font-bold text-white shadow-sm transition-transform duration-200 hover:bg-primary/95 active:scale-95"
              >
                Configurar Conta de Cobrança
              </Button>
            </div>
          ) : (
            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2">
              {/* Card Meta Ads (Vendas/Pago) */}
              <div className="flex flex-col justify-between gap-6 rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:shadow-md">
                <div className="space-y-4">
                  <div className="w-fit rounded-xl bg-primary/10 p-3 text-primary">
                    <Megaphone className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold leading-tight text-slate-900">
                      Impulsionar no Instagram e Facebook
                    </h4>
                    <p className="mt-2 text-xs leading-relaxed text-slate-500">
                      Atraia mais clientes e aumente suas vendas! Promova seus melhores posts e
                      interaja com moradores da sua região com segmentação precisa.
                    </p>
                  </div>
                </div>
                <div className="mt-5 border-t border-slate-100 pt-5">
                  <Button
                    onClick={handleConnectMetaAds}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-xs font-bold text-white hover:bg-primary/95"
                  >
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    Conectar Facebook e Instagram
                  </Button>
                </div>
              </div>

              {/* Card Google Ads */}
              <div className="flex flex-col justify-between gap-6 rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:shadow-md">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-fit rounded-xl bg-[#4285F4]/10 p-3 text-[#4285F4]">
                      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold leading-tight text-slate-900">
                      Anúncios no Google Ads
                    </h4>
                    <p className="mt-2 text-xs leading-relaxed text-slate-500">
                      Apareça no topo das buscas locais e no Google Mapas para quem já está
                      procurando ativamente seus serviços na vizinhança.
                    </p>
                  </div>
                </div>
                <div className="mt-5 border-t border-slate-100 pt-5">
                  <Button
                    onClick={handleConnectGoogleAds}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#4285F4] px-6 py-4 text-xs font-bold text-white hover:bg-[#4285F4]/95"
                  >
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    </svg>
                    Conectar Google Ads
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
            <DialogTitle className="font-poppins flex items-center gap-2 text-lg font-bold text-slate-900">
              Configurar Conta do Meta Ads
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Conexão com a Meta realizada! Agora selecione a página e a conta de anúncios que você
              deseja usar para promover seus posts.
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 space-y-5">
            {/* Seletor de Página */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">
                1. Selecione a Página comercial do Facebook
              </Label>
              {metaPages.length === 0 ? (
                <p className="rounded-lg bg-red-50 p-2.5 text-xs text-red-500">
                  Nenhuma página comercial encontrada. Certifique-se de que você é administrador de
                  alguma página no Facebook.
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
              <Label className="text-xs font-bold text-slate-700">
                2. Selecione a sua Conta de Anúncios (Cobrança)
              </Label>
              {metaAdAccounts.length === 0 ? (
                <div className="space-y-3 rounded-xl border border-blue-100/70 bg-blue-50/40 p-3.5 text-left">
                  <div className="flex items-start gap-2 text-blue-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <h6 className="text-[11.5px] font-bold">
                        Crie sua Conta de Anúncios na Meta
                      </h6>
                      <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500">
                        Sua página foi conectada com sucesso, mas não encontramos nenhuma conta de
                        faturamento ativa associada ao seu perfil.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 pl-6 text-[10px] text-slate-600">
                    <p className="leading-relaxed">
                      1. Acesse o painel de criação da Meta:
                      <a
                        href="https://business.facebook.com/settings/ad-accounts"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-1 inline-flex items-center gap-0.5 font-bold text-primary hover:underline"
                      >
                        Abrir Configurações Meta ↗
                      </a>
                    </p>
                    <p className="leading-relaxed">
                      2. No painel, clique em <strong>Adicionar</strong> e depois em{" "}
                      <strong>Criar uma nova conta de anúncios</strong>.
                    </p>
                    <p className="leading-relaxed">
                      3. Configure a moeda como <strong>Real Brasileiro (BRL)</strong> e o fuso
                      horário como <strong>São Paulo (GMT-3)</strong>.
                    </p>
                  </div>

                  <div className="pl-6 pt-1">
                    <Button
                      size="sm"
                      onClick={handleRefreshAdAccounts}
                      disabled={isRefreshingAccounts}
                      className="flex h-7 items-center gap-1.5 rounded-lg bg-primary px-3 text-[9.5px] font-bold text-white hover:bg-primary/95"
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
              className="rounded-lg bg-primary px-5 py-2 text-xs font-bold text-white hover:bg-primary/95"
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
            <DialogTitle className="font-poppins flex items-center gap-2 text-lg font-bold text-slate-900">
              <CreditCard className="h-5 w-5 text-primary" />
              Faturamento e Cobrança
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Gerencie as formas de pagamento ou adicione saldo para veicular seus anúncios locais.
            </DialogDescription>
          </DialogHeader>

          {billingGuideActive ? (
            /* Guia Passo a Passo de Pix / Boleto */
            <div className="my-4 space-y-4 text-center">
              <div className="flex min-h-[160px] flex-col justify-center rounded-xl border border-slate-200/60 bg-slate-50 p-4">
                {billingGuideStep === 1 && (
                  <div className="space-y-3">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 p-3 text-primary">
                      <Megaphone className="h-5 w-5" />
                    </div>
                    <h5 className="text-sm font-bold text-slate-800">
                      1. Acessar Configurações de Pagamento
                    </h5>
                    <p className="mx-auto max-w-sm text-xs leading-relaxed text-slate-500">
                      Clique no botão abaixo para abrir a página oficial de faturamento da sua conta
                      de anúncios da Meta em uma nova aba.
                    </p>
                    <Button
                      onClick={() => {
                        const cleanId = adAccountId.replace("act_", "");
                        const businessId =
                          billingStatus?.businessId || metaConnection?.businessId || "";
                        const url = businessId
                          ? `https://business.facebook.com/billing_hub/accounts/details/?business_id=${businessId}&asset_id=${cleanId}`
                          : `https://adsmanager.facebook.com/adsmanager/manage/billing?act=${cleanId}`;
                        window.open(url, "_blank");
                      }}
                      className="mx-auto mt-2 flex items-center gap-1.5 rounded-lg bg-primary px-6 py-2 text-xs font-bold text-white hover:bg-primary/95"
                    >
                      Abrir Página da Meta ↗
                    </Button>
                  </div>
                )}

                {billingGuideStep === 2 && (
                  <div className="space-y-3">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 p-3 text-primary">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <h5 className="text-sm font-bold text-slate-800">2. Adicionar Fundos</h5>
                    <p className="mx-auto max-w-sm text-xs leading-relaxed text-slate-500">
                      Na página da Meta que acabou de abrir, localize e clique no botão **Adicionar
                      Fundos** (Add Funds) na seção de saldo.
                    </p>
                  </div>
                )}

                {billingGuideStep === 3 && (
                  <div className="space-y-3">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 p-3 text-primary">
                      <Check className="h-5 w-5" />
                    </div>
                    <h5 className="text-sm font-bold text-slate-800">3. Escolher Pix ou Boleto</h5>
                    <p className="mx-auto max-w-sm text-xs leading-relaxed text-slate-500">
                      Selecione a opção **Pix** ou **Boleto Bancário**, defina o valor que deseja
                      recarregar e gere o QR Code Pix ou boleto.
                    </p>
                  </div>
                )}

                {billingGuideStep === 4 && (
                  <div className="space-y-3">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 p-3 text-primary">
                      <RefreshCw className="h-5 w-5 animate-pulse" />
                    </div>
                    <h5 className="text-sm font-bold text-slate-800">4. Concluir Recarga</h5>
                    <p className="mx-auto max-w-sm text-xs leading-relaxed text-slate-500">
                      Realize o pagamento do QR Code Pix gerado. Quando terminar, clique no botão
                      abaixo para atualizar seu saldo aqui no NumVapt!
                    </p>
                    <Button
                      onClick={async () => {
                        await fetchBillingStatus();
                        setBillingGuideActive(false);
                        setIsBillingModalOpen(false);
                      }}
                      className="mx-auto mt-2 rounded-lg bg-primary px-6 py-2 text-xs font-bold text-white hover:bg-primary/95"
                    >
                      Pronto, já paguei!
                    </Button>
                  </div>
                )}
              </div>

              {/* Controles de Navegação do Guia */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="outline"
                  disabled={billingGuideStep === 1}
                  onClick={() => setBillingGuideStep((prev) => prev - 1)}
                  className="h-auto rounded-lg border-slate-200 px-4 py-1.5 text-xs font-bold"
                >
                  Anterior
                </Button>
                <span className="text-[11px] font-bold text-slate-400">
                  Passo {billingGuideStep} de 4
                </span>
                {billingGuideStep < 4 ? (
                  <Button
                    onClick={() => setBillingGuideStep((prev) => prev + 1)}
                    className="h-auto rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-primary/95"
                  >
                    Próximo
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={() => setBillingGuideActive(false)}
                    className="h-auto rounded-lg px-4 py-1.5 text-xs font-bold text-slate-400"
                  >
                    Sair do Guia
                  </Button>
                )}
              </div>
            </div>
          ) : (
            /* Menu Inicial de Escolha */
            <div className="my-4 space-y-4">
              <div className="text-slate-650 rounded-xl border border-slate-200/60 bg-slate-50 p-4 text-left text-xs leading-relaxed">
                Selecione uma das opções abaixo para gerenciar como você pagará pelos
                impulsionamentos. Suas cobranças serão feitas diretamente pela Meta Ads.
              </div>

              <div className="grid grid-cols-1 gap-3">
                {/* Opção Cartão de Crédito */}
                <button
                  onClick={() => {
                    const cleanId = adAccountId.replace("act_", "");
                    const businessId =
                      billingStatus?.businessId || metaConnection?.businessId || "";
                    const url = businessId
                      ? `https://business.facebook.com/billing_hub/accounts/details/?business_id=${businessId}&asset_id=${cleanId}`
                      : `https://adsmanager.facebook.com/adsmanager/manage/billing?act=${cleanId}`;
                    window.open(url, "_blank");
                  }}
                  className="shadow-xs flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:bg-slate-50/50 active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <h6 className="text-xs font-bold text-slate-800">
                        Cartão de Crédito (Meta Ads)
                      </h6>
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        Cadastre ou edite cartões na página de cobrança oficial da Meta.
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="text-slate-350 h-4 w-4" />
                </button>

                {/* Opção Pix / Boleto (Guia) */}
                <button
                  onClick={() => {
                    setBillingGuideActive(true);
                    setBillingGuideStep(1);
                  }}
                  className="shadow-xs flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:bg-slate-50/50 active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <RefreshCw className="h-5 w-5" />
                    </div>
                    <div>
                      <h6 className="text-xs font-bold text-slate-800">
                        Adicionar Saldo com Pix / Boleto
                      </h6>
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        Veja o passo a passo para gerar Pix ou Boleto no painel de anúncios.
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="text-slate-350 h-4 w-4" />
                </button>
              </div>

              <DialogFooter className="border-t border-slate-100 pt-2">
                <Button
                  onClick={() => setIsBillingModalOpen(false)}
                  className="rounded-lg bg-primary px-5 py-2 text-xs font-bold text-white hover:bg-primary/95"
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
        <DialogContent className="max-w-xl rounded-2xl border-slate-800 bg-[#18191a] font-sans text-slate-800 text-white">
          <DialogHeader className="text-left">
            <DialogTitle className="font-poppins flex items-center gap-2 text-lg font-bold text-white">
              <Sparkles className="h-5 w-5 animate-pulse text-amber-500" />
              Apareceu a tela errada no Facebook?
            </DialogTitle>
            <DialogDescription className="text-slate-455 text-xs leading-relaxed">
              Se você caiu em uma tela com configurações pessoais e sem a opção do WhatsApp, você
              precisa alternar para o perfil da sua Página comercial no topo do Facebook. Veja
              abaixo como fazer:
            </DialogDescription>
          </DialogHeader>

          {/* SIMULAÇÃO ANIMADA CSS */}
          <div className="relative my-4 select-none overflow-hidden rounded-xl border border-[#3e4042]/50 bg-[#18191a] shadow-2xl">
            {/* ESTILOS INLINE DE ANIMAÇÃO */}
            <style
              dangerouslySetInnerHTML={{
                __html: `
              @keyframes cursorMovement {
                0% { left: 40%; top: 110px; }
                18% { left: calc(100% - 24px); top: 20px; } /* Move para a foto do perfil */
                20% { left: calc(100% - 24px); top: 20px; transform: scale(0.85); } /* Clique */
                22% { left: calc(100% - 24px); top: 20px; transform: scale(1); } /* Solta */
                45% { left: calc(100% - 112px); top: 92px; } /* Move para selecionar a página */
                47% { left: calc(100% - 112px); top: 92px; transform: scale(0.85); } /* Clique */
                49% { left: calc(100% - 112px); top: 92px; transform: scale(1); } /* Solta */
                52% { left: calc(100% - 112px); top: 92px; } /* Pausa na página ativa */
                57% { left: 50%; top: 140px; } /* Descanso */
                88% { left: 50%; top: 140px; } /* Espera */
                93% { left: 40%; top: 110px; } /* Volta */
                100% { left: 40%; top: 110px; }
              }

              @keyframes dropdownToggle {
                0%, 20% { opacity: 0; transform: translateY(-8px) scale(0.95); visibility: hidden; pointer-events: none; }
                22%, 47% { opacity: 1; transform: translateY(0) scale(1); visibility: visible; }
                49%, 100% { opacity: 0; transform: translateY(-8px) scale(0.95); visibility: hidden; pointer-events: none; }
              }

              @keyframes clickRing {
                0%, 18%, 22%, 45%, 49%, 100% { opacity: 0; transform: scale(0.5); }
                20%, 47% { opacity: 0.8; transform: scale(1.6); }
              }

              @keyframes switchEffect {
                0%, 47% { filter: brightness(1); }
                49% { filter: brightness(0.05); }
                53%, 100% { filter: brightness(1); }
              }

              @keyframes personalViewFade {
                0%, 47% { opacity: 1; pointer-events: auto; }
                49%, 88% { opacity: 0; pointer-events: none; }
                92%, 100% { opacity: 1; pointer-events: auto; }
              }

              @keyframes whatsAppViewFade {
                0%, 48% { opacity: 0; pointer-events: none; }
                52%, 87% { opacity: 1; pointer-events: auto; }
                91%, 100% { opacity: 0; pointer-events: none; }
              }

              .sim-cursor {
                animation: cursorMovement 11s infinite ease-in-out;
              }
              .sim-dropdown {
                animation: dropdownToggle 11s infinite ease-in-out;
              }
              .sim-click-ring {
                animation: clickRing 11s infinite ease-in-out;
              }
              .sim-switch-page {
                animation: switchEffect 11s infinite ease-in-out;
              }
              .sim-personal-view {
                animation: personalViewFade 11s infinite ease-in-out;
              }
              .sim-whatsapp-view {
                animation: whatsAppViewFade 11s infinite ease-in-out;
              }
            `,
              }}
            />

            {/* Simulação da Barra Superior do Facebook */}
            <div className="sim-switch-page relative z-30 flex h-10 items-center justify-between border-b border-[#393a3b] bg-[#242526] px-3 text-white">
              {/* Logo e Busca */}
              <div className="flex shrink-0 items-center gap-1.5">
                <div className="flex h-6 w-6 select-none items-center justify-center rounded-full bg-[#1877f2] text-sm font-bold text-white">
                  f
                </div>
                <div className="flex h-5 w-28 items-center gap-1 rounded-full bg-[#3a3b3c] px-2.5 text-[8px] text-[#b0b3b8] max-sm:w-20">
                  <span>🔍</span>
                  <span className="truncate">Pesquisar no Facebook</span>
                </div>
              </div>

              {/* Ícones de Navegação */}
              <div className="flex items-center gap-4 text-[10px] text-slate-400 max-sm:hidden">
                <div className="flex h-7 items-center justify-center border-b-2 border-[#1877f2] px-2 text-[#1877f2]">
                  🏠
                </div>
                <div className="flex h-7 items-center justify-center px-2">📺</div>
                <div className="flex h-7 items-center justify-center px-2">🏪</div>
                <div className="flex h-7 items-center justify-center px-2">👥</div>
                <div className="flex h-7 items-center justify-center px-2">🎮</div>
              </div>

              {/* Botões da Direita */}
              <div className="flex shrink-0 items-center gap-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#3a3b3c] text-[9px] text-[#e4e6eb]">
                  💬
                </div>
                <div className="relative flex h-6 w-6 items-center justify-center rounded-full bg-[#3a3b3c] text-[9px] text-[#e4e6eb]">
                  🔔
                  <div className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[6px] font-bold text-white">
                    2
                  </div>
                </div>
                {/* Foto do perfil na barra superior (Alterna entre Pessoal e Página) */}
                <div className="relative h-6 w-6 shrink-0 cursor-pointer overflow-hidden rounded-full">
                  {/* Avatar Pessoal (Fase 1 e 2) */}
                  <div className="sim-personal-view absolute inset-0 z-10">
                    <img
                      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=80"
                      alt="Perfil"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full border border-white bg-green-500"></div>
                  </div>
                  {/* Avatar Página (Fase 3) */}
                  <div className="sim-whatsapp-view absolute inset-0 z-20">
                    <div className="flex h-full w-full items-center justify-center rounded-full border border-white/10 bg-[#0083C7] text-[8px] font-bold text-white">
                      PN
                    </div>
                    <div className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full border border-white bg-green-500"></div>
                  </div>
                </div>
              </div>

              {/* Dropdown de Perfis Simulado */}
              <div className="sim-dropdown absolute right-2 top-9 z-50 w-52 space-y-1.5 rounded-lg border border-[#393a3b] bg-[#242526] p-2 text-left shadow-2xl">
                {/* Perfil Pessoal */}
                <div className="rounded-md p-1 transition-colors hover:bg-[#3a3b3c]/50">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full">
                      <img
                        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=80"
                        alt="Perfil"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[9px] font-bold text-white">Seu Perfil</p>
                      <p className="text-[7px] text-[#b0b3b8]">Perfil pessoal</p>
                    </div>
                  </div>
                </div>
                <div className="my-1 border-b border-[#393a3b]"></div>

                {/* Páginas do Usuário */}
                <div className="space-y-1">
                  {/* Página Comercial Principal */}
                  <div className="flex cursor-pointer items-center justify-between rounded-md border border-[#4e4f50] bg-[#3a3b3c] p-1.5">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#0083C7] text-[8px] font-bold text-white shadow-sm">
                        PN
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[9px] font-bold text-white">Página Numvapt</p>
                        <p className="flex items-center gap-0.5 text-[7px] font-semibold text-[#1877f2]">
                          <span>🔄</span> Alternar para Página
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="my-1 border-b border-[#393a3b]"></div>
                <div className="w-full cursor-pointer select-none rounded-md bg-[#3a3b3c]/50 py-1 text-center text-[8px] font-bold text-white hover:bg-[#3a3b3c]/80">
                  👥 Ver todos os perfis
                </div>

                {/* Links Adicionais */}
                <div className="space-y-1.5 pt-1.5 text-[8px] text-slate-300">
                  <div className="flex items-center justify-between px-1">
                    <span className="flex items-center gap-1.5">
                      ⚙️ Configurações e privacidade
                    </span>
                    <span>❯</span>
                  </div>
                  <div className="flex items-center justify-between px-1">
                    <span className="flex items-center gap-1.5">❓ Ajuda e suporte</span>
                    <span>❯</span>
                  </div>
                  <div className="flex items-center justify-between px-1">
                    <span className="flex items-center gap-1.5">🚪 Sair</span>
                    <span>❯</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Simulação do Corpo do Facebook */}
            <div className="sim-switch-page relative flex h-44 overflow-hidden bg-[#18191a]">
              {/* === VIEW 1: CONFIGURAÇÕES PESSOAIS === */}
              <div className="sim-personal-view absolute inset-0 z-10 flex h-full w-full bg-[#18191a]">
                {/* Sidebar Lateral */}
                <div className="flex w-1/3 shrink-0 select-none flex-col gap-1.5 overflow-hidden border-r border-[#393a3b] bg-[#18191a] p-2 text-left text-[8px]">
                  <p className="text-[10px] font-bold text-white">Configurações</p>
                  <div className="mb-1 flex h-5 w-full items-center rounded-full bg-[#3a3b3c] px-2 text-[7px] text-[#b0b3b8]">
                    🔍 Pesquisar configurações
                  </div>
                  <p className="text-[8px] font-semibold text-slate-300">
                    Configurações e privacidade
                  </p>

                  {/* Meta Accounts Center */}
                  <div className="space-y-1 rounded-lg border border-[#3e4042] bg-[#242526] p-1.5">
                    <div className="flex items-center gap-1 text-[7px] font-bold text-white">
                      <span className="text-[8px] font-extrabold text-blue-400">∞</span> Meta
                    </div>
                    <p className="text-[7px] font-bold text-white">Central de Contas</p>
                    <p className="text-[6px] leading-tight text-slate-400">
                      Gerencie suas experiências conectadas e configurações de conta nas tecnologias
                      da Meta.
                    </p>
                    <div className="space-y-0.5 pt-0.5 text-[6px] text-slate-300">
                      <p>🪪 Dados pessoais</p>
                      <p>🔒 Senha e segurança</p>
                      <p>📢 Preferências de anúncios</p>
                      <p>✔️ Verificação</p>
                    </div>
                    <p className="cursor-pointer pt-0.5 text-[6px] font-semibold text-[#1877f2]">
                      Ver mais na Central de Contas
                    </p>
                  </div>

                  <p className="text-slate-450 border-t border-[#393a3b] pt-1 font-semibold">
                    Ferramentas e recursos
                  </p>
                  <p className="text-slate-400">🛡️ Checkup de Privacidade</p>
                  <p className="text-slate-400">👨‍👩‍👦 Central da Família</p>
                </div>

                {/* Painel Central */}
                <div className="flex w-2/3 flex-col gap-2 overflow-hidden bg-[#18191a] p-3 text-left">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-extrabold text-white">
                      Encontre a configuração de que você precisa
                    </p>
                    <div className="flex h-6 w-full items-center rounded-md border border-[#393a3b] bg-[#242526] px-2 text-[8px] text-[#b0b3b8]">
                      🔍 Pesquisar configurações
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <p className="text-slate-350 text-[8px] font-bold">
                      Configurações mais acessadas
                    </p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {/* Card 1 */}
                      <div className="h-18 flex flex-col items-center justify-center rounded-md border border-[#393a3b] bg-[#242526] p-1.5 text-center">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/10 text-[10px] font-bold text-amber-500">
                          🚫
                        </div>
                        <p className="mt-1 w-full truncate text-[7px] font-bold text-white">
                          Bloqueio
                        </p>
                        <p className="mt-0.5 w-full truncate text-[5px] leading-none text-slate-400">
                          Veja quem bloqueou
                        </p>
                      </div>

                      {/* Card 2 */}
                      <div className="h-18 flex flex-col items-center justify-center rounded-md border border-[#393a3b] bg-[#242526] p-1.5 text-center">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/10 text-[10px] font-bold text-blue-400">
                          📝
                        </div>
                        <p className="mt-1 w-full truncate text-[7px] font-bold text-white">
                          Atividades
                        </p>
                        <p className="mt-0.5 w-full truncate text-[5px] leading-none text-slate-400">
                          Gerencie histórico
                        </p>
                      </div>

                      {/* Card 3 */}
                      <div className="h-18 flex flex-col items-center justify-center rounded-md border border-[#393a3b] bg-[#242526] p-1.5 text-center">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-500/10 text-[10px] font-bold text-slate-300">
                          💡
                        </div>
                        <p className="mt-1 w-full truncate text-[7px] font-bold text-white">
                          Modo escuro
                        </p>
                        <p className="mt-0.5 w-full truncate text-[5px] leading-none text-slate-400">
                          Tema de tela
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* === VIEW 2: TELA DE CONEXÃO DO WHATSAPP === */}
              <div className="sim-whatsapp-view absolute inset-0 z-20 flex h-full w-full bg-[#18191a]">
                {/* Sidebar Lateral Página */}
                <div className="flex w-1/3 shrink-0 select-none flex-col gap-1 overflow-hidden border-r border-[#393a3b] bg-[#18191a] p-2 text-left text-[7px]">
                  <p className="text-[9px] font-bold text-white">Configurações da Página</p>
                  <p className="mt-0.5 border-t border-[#393a3b] pt-1 font-bold text-slate-300">
                    Preferências
                  </p>
                  <p className="text-slate-400">⭐ Preferências de reação</p>
                  <p className="text-slate-400">🔔 Notificações</p>
                  <p className="text-slate-400">♿ Acessibilidade</p>
                  <p className="text-slate-400">🎬 Mídia</p>
                  <p className="text-slate-400">🌙 Modo escuro</p>

                  <p className="mt-0.5 border-t border-[#393a3b] pt-1 font-bold text-slate-300">
                    Público e visibilidade
                  </p>
                  <p className="text-slate-400">📄 Detalhes da Página</p>
                  <p className="rounded bg-[#1877f2]/10 p-0.5 font-semibold text-[#1877f2]">
                    💬 WhatsApp Conectado
                  </p>
                  <p className="text-slate-400">📝 Posts e Stories</p>
                </div>

                {/* Painel Central WhatsApp */}
                <div className="relative flex w-2/3 flex-col items-center justify-start overflow-hidden bg-[#18191a] p-3 text-left">
                  {/* Ícone de WhatsApp grande */}
                  <div className="mb-1 flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border border-white/10 bg-[#25d366] shadow-md">
                    <svg viewBox="0 0 32 32" className="h-5 w-5 text-white" fill="currentColor">
                      <path d="M16 3C9.373 3 4 8.373 4 15c0 2.127.553 4.174 1.604 5.99L4 29l8.187-1.574A12.94 12.94 0 0016 28c6.627 0 12-5.373 12-12S22.627 3 16 3zm6.39 17.39c-.27.76-1.59 1.45-2.18 1.49-.56.04-1.08.26-3.65-.76-3.11-1.23-5.08-4.43-5.24-4.64-.15-.2-1.26-1.67-1.26-3.19s.79-2.26 1.08-2.57c.27-.3.6-.37.8-.37s.4.01.57.01c.19.01.44-.07.68.52.27.63.9 2.2.98 2.36.08.16.13.35.03.55-.11.21-.16.33-.32.51-.15.18-.33.4-.47.53-.15.15-.31.31-.13.61.18.3.78 1.28 1.67 2.08 1.15 1.03 2.12 1.35 2.42 1.5.3.15.47.13.65-.08.18-.21.75-.87.95-1.17.2-.3.4-.25.67-.15.27.1 1.74.82 2.04.97.3.15.5.22.57.35.08.12.08.72-.19 1.42z" />
                    </svg>
                  </div>

                  <p className="mb-1 max-w-[210px] select-none text-center text-[7px] leading-tight text-[#b0b3b8]">
                    Insira o número do WhatsApp de <strong>Página Numvapt</strong> e depois veja se
                    você recebeu um código de confirmação.
                  </p>

                  {/* Form Simulador */}
                  <div className="mb-1 flex w-full max-w-[210px] shrink-0 select-none items-center justify-center gap-1">
                    <div className="flex h-5 shrink-0 items-center rounded-md border border-[#393a3b] bg-[#242526] px-1.5 text-[7px] font-medium text-white">
                      BR +55 ▾
                    </div>
                    <div className="flex h-5 flex-1 items-center rounded-md border border-[#393a3b] bg-[#242526] px-1.5 text-[7px] text-slate-500">
                      Número do WhatsApp
                    </div>
                  </div>

                  <div className="mb-1.5 flex h-5 w-full max-w-[210px] shrink-0 cursor-not-allowed select-none items-center justify-center rounded-md border-0 bg-[#3a3b3c] px-4 text-[7px] font-bold text-[#727477]">
                    Enviar código do WhatsApp
                  </div>

                  {/* Benefícios */}
                  <div className="w-full space-y-1 border-t border-[#393a3b] pt-1.5 text-left">
                    <p className="text-[7.5px] font-extrabold text-white">
                      Conecte sua Página do Facebook ao WhatsApp
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-[6px]">
                      <div className="flex items-start gap-1">
                        <span className="mt-0.5 shrink-0 text-[8px] leading-none text-[#25d366]">
                          💬
                        </span>
                        <div>
                          <p className="font-bold text-white">Receber mais mensagens</p>
                          <p className="text-slate-450 leading-tight">
                            Adicione um botão do WhatsApp à sua página comercial.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-1">
                        <span className="mt-0.5 shrink-0 text-[8px] leading-none text-blue-400">
                          📢
                        </span>
                        <div>
                          <p className="font-bold text-white">Criar anúncios do WhatsApp</p>
                          <p className="text-slate-450 leading-tight">
                            Redirecione as pessoas para o seu WhatsApp nos anúncios.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cursor Simulado */}
            <div className="sim-cursor pointer-events-none absolute left-0 top-0 z-50">
              {/* Círculo do clique */}
              <div className="sim-click-ring absolute -left-3.5 -top-3.5 h-8 w-8 rounded-full border border-red-400 bg-red-500"></div>
              {/* Ícone de cursor de mouse */}
              <svg
                className="h-5 w-5 text-white drop-shadow-md filter"
                viewBox="0 0 24 24"
                fill="black"
                stroke="white"
                strokeWidth="1.5"
              >
                <path d="M5.5 3.5l14 7-6 1.5 4 5.5-2.5 1.5-4-5.5-5.5 4v-14z" />
              </svg>
            </div>
          </div>

          {/* Passos do Tutorial */}
          <div className="text-slate-350 space-y-3 text-left">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                1
              </span>
              <p className="text-xs leading-relaxed">
                No canto superior direito da tela de configurações, clique na{" "}
                <strong>foto do seu perfil pessoal</strong>.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                2
              </span>
              <p className="text-xs leading-relaxed">
                No menu que se abrir, clique sobre a <strong>Página Numvapt</strong> para alternar o
                perfil de acesso.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="text-green-450 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/20 font-sans text-xs font-bold">
                ✓
              </span>
              <p className="text-xs leading-relaxed">
                A página recarregará automaticamente e mostrará a tela certa para você{" "}
                <strong>conectar o WhatsApp Business</strong>.
              </p>
            </div>
          </div>

          <DialogFooter className="items-center justify-end gap-2 border-t border-slate-800 pt-2">
            <div className="flex shrink-0 gap-2">
              <Button
                variant="ghost"
                onClick={() => setIsProfileSwitchTutorialOpen(false)}
                className="rounded-lg px-4 py-2 text-xs font-bold text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                Voltar
              </Button>
              <Button
                onClick={() => {
                  window.open(tutorialRedirectUrl, "_blank");
                  setIsProfileSwitchTutorialOpen(false);
                }}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border-0 bg-green-600 px-5 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-green-700 active:scale-95"
              >
                Prosseguir para o Facebook ↗
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TELA DE CRIAÇÃO (WIZARD GUIADO) */}
      {isCreating && selectedPost && (
        <div className="mb-8 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          {/* Cabeçalho do Wizard */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {currentStep}
              </span>
              <div>
                <h3 className="font-poppins text-base font-bold text-slate-900">
                  Impulsionando Post
                </h3>
                <p className="text-xs text-slate-500">Passo {currentStep} de 5</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCreating(false)}
              className="rounded-full text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Barra de Progresso Visível e Sutil */}
          <div className="h-1 w-full bg-slate-100">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(currentStep / 5) * 100}%` }}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* COLUNA ESQUERDA: FORMULÁRIO (7 colunas) */}
            <div className="border-r border-slate-200 p-6 lg:col-span-7">
              {/* PASSO 1: ESCOLHER OBJETIVO PRINCIPAL */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-poppins flex items-center gap-2 text-lg font-bold text-slate-900">
                      <Target className="h-5 w-5 text-primary" />
                      1. Qual é o objetivo do seu impulsionamento?
                    </h4>
                    <p className="mt-1 text-xs text-slate-500">
                      Selecione o principal resultado desejado. O NumVapt otimizará as configurações
                      técnicas de forma personalizada.
                    </p>
                  </div>

                  <div className="mt-2 grid grid-cols-1 gap-4">
                    {/* Opção Alcance */}
                    <div
                      onClick={() => setCampaignObjective("REACH")}
                      className={`group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-xl border p-5 text-left shadow-sm transition-all ${
                        campaignObjective === "REACH"
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-slate-200 bg-white hover:border-primary/50 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="z-10 flex items-start gap-4">
                        <div
                          className={`rounded-xl p-3 ${campaignObjective === "REACH" ? "bg-primary/20 text-primary" : "bg-slate-100 text-slate-600"}`}
                        >
                          <Megaphone className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-extrabold text-slate-900 transition-colors group-hover:text-primary">
                              Mais Visualizações (Alcance)
                            </span>
                            {campaignObjective === "REACH" && (
                              <Badge className="scale-90 bg-primary py-0 text-[9px] font-medium text-white hover:bg-primary">
                                Ativo
                              </Badge>
                            )}
                          </div>
                          <p className="max-w-lg text-xs leading-relaxed text-slate-500">
                            Exiba seu anúncio para o maior número possível de pessoas, aumentando a
                            visibilidade e o reconhecimento do seu negócio ou marca na região
                            selecionada.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Opção Tráfego */}
                    <div
                      onClick={() => setCampaignObjective("TRAFFIC")}
                      className={`group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-xl border p-5 text-left shadow-sm transition-all ${
                        campaignObjective === "TRAFFIC"
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-slate-200 bg-white hover:border-primary/50 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="z-10 flex items-start gap-4">
                        <div
                          className={`rounded-xl p-3 ${campaignObjective === "TRAFFIC" ? "bg-primary/20 text-primary" : "bg-slate-100 text-slate-600"}`}
                        >
                          <TrendingUp className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-extrabold text-slate-900 transition-colors group-hover:text-primary">
                              Mais Cliques no Link (Tráfego)
                            </span>
                            {campaignObjective === "TRAFFIC" && (
                              <Badge className="scale-90 bg-primary py-0 text-[9px] font-medium text-white hover:bg-primary">
                                Ativo
                              </Badge>
                            )}
                          </div>
                          <p className="max-w-lg text-xs leading-relaxed text-slate-500">
                            Otimizado para gerar o máximo de cliques qualificados no seu anúncio.
                            Ideal para direcionar potenciais clientes para o seu site ou perfil.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Opção WhatsApp */}
                    <div
                      onClick={() => setCampaignObjective("WHATSAPP")}
                      className={`group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-xl border p-5 text-left shadow-sm transition-all ${
                        campaignObjective === "WHATSAPP"
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-slate-200 bg-white hover:border-primary/50 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="z-10 flex items-start gap-4">
                        <div
                          className={`rounded-xl p-3 ${campaignObjective === "WHATSAPP" ? "bg-primary/20 text-primary" : "bg-slate-100 text-slate-600"}`}
                        >
                          <MessageSquare className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-extrabold text-slate-900 transition-colors group-hover:text-primary">
                              Mensagens no WhatsApp
                            </span>
                            {campaignObjective === "WHATSAPP" && (
                              <Badge className="scale-90 bg-primary py-0 text-[9px] font-medium text-white hover:bg-primary">
                                Ativo
                              </Badge>
                            )}
                          </div>
                          <p className="max-w-lg text-xs leading-relaxed text-slate-500">
                            Otimizado para direcionar potenciais clientes diretamente para o
                            WhatsApp comercial da sua empresa para iniciar conversas.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {campaignObjective === "WHATSAPP" && (
                    <div className="mt-4 border-t border-slate-100 pt-4 duration-200 animate-in fade-in">
                      {isCheckingWhatsApp ? (
                        <div className="flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-5">
                          <Loader2 className="h-5 w-5 animate-spin text-green-500" />
                          <span className="text-sm font-medium text-slate-600">
                            Verificando vinculação do WhatsApp...
                          </span>
                        </div>
                      ) : hasWhatsAppConnected === true ? (
                        <div className="overflow-hidden rounded-xl border border-green-200 bg-gradient-to-br from-green-50/80 to-emerald-50/50">
                          {/* Header */}
                          <div className="flex items-center justify-between border-b border-green-200/60 bg-green-500/10 px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 shadow-sm">
                                <Check className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <h6 className="text-sm font-bold text-green-800">
                                  WhatsApp Conectado
                                </h6>
                                <p className="text-[10px] font-medium text-green-600/80">
                                  Pronto para receber mensagens de anúncios
                                </p>
                              </div>
                            </div>
                            <Badge className="border-0 bg-green-500/15 py-0.5 text-[9px] font-bold text-green-700 hover:bg-green-500/15">
                              Ativo
                            </Badge>
                          </div>

                          {/* Body */}
                          <div className="space-y-3 p-4">
                            {/* Page info with real logo */}
                            <div className="flex items-center gap-3 rounded-lg border border-green-100 bg-white/70 p-3">
                              {whatsAppPageId || metaConnection?.pageId ? (
                                <img
                                  src={`https://graph.facebook.com/${whatsAppPageId || metaConnection.pageId}/picture?type=small${metaConnection?.accessToken || metaConnection?.userAccessToken ? `&access_token=${metaConnection.accessToken || metaConnection.userAccessToken}` : ""}`}
                                  alt={whatsAppPageName || "Página"}
                                  className="h-9 w-9 rounded-full border border-green-100 object-cover shadow-sm"
                                />
                              ) : (
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-xs font-bold text-white shadow-sm">
                                  {whatsAppPageName?.charAt(0)?.toUpperCase() || "P"}
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-bold text-slate-800">
                                  {whatsAppPageName || "Página do Facebook"}
                                </p>
                                <p className="text-[10px] text-slate-500">
                                  Página comercial do Facebook
                                </p>
                              </div>
                            </div>

                            {/* Phone number with WhatsApp icon + inline change link */}
                            <div className="flex items-center gap-3 rounded-lg border border-green-100 bg-white/70 p-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#25D366] shadow-sm">
                                <svg
                                  viewBox="0 0 32 32"
                                  className="h-5 w-5 text-white"
                                  fill="currentColor"
                                >
                                  <path d="M16 3C9.373 3 4 8.373 4 15c0 2.127.553 4.174 1.604 5.99L4 29l8.187-1.574A12.94 12.94 0 0016 28c6.627 0 12-5.373 12-12S22.627 3 16 3zm6.39 17.39c-.27.76-1.59 1.45-2.18 1.49-.56.04-1.08.26-3.65-.76-3.11-1.23-5.08-4.43-5.24-4.64-.15-.2-1.26-1.67-1.26-3.19s.79-2.26 1.08-2.57c.27-.3.6-.37.8-.37s.4.01.57.01c.19.01.44-.07.68.52.27.63.9 2.2.98 2.36.08.16.13.35.03.55-.11.21-.16.33-.32.51-.15.18-.33.4-.47.53-.15.15-.31.31-.13.61.18.3.78 1.28 1.67 2.08 1.15 1.03 2.12 1.35 2.42 1.5.3.15.47.13.65-.08.18-.21.75-.87.95-1.17.2-.3.4-.25.67-.15.27.1 1.74.82 2.04.97.3.15.5.22.57.35.08.12.08.72-.19 1.42z" />
                                </svg>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-slate-800">
                                  WhatsApp Business
                                </p>
                                <p className="text-[10px] text-slate-500">
                                  WhatsApp conectado à página
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setTutorialRedirectUrl(
                                    "https://www.facebook.com/settings/?tab=linked_whatsapp"
                                  );
                                  setIsProfileSwitchTutorialOpen(true);
                                }}
                                className="shrink-0 whitespace-nowrap text-[10px] font-semibold text-green-600 underline decoration-green-300 underline-offset-2 transition-colors hover:text-green-700 hover:decoration-green-500"
                              >
                                Alterar número →
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="overflow-hidden rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50/80 to-orange-50/30">
                          {/* Header */}
                          <div className="flex items-center gap-2.5 border-b border-amber-200/60 bg-amber-500/10 px-4 py-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 shadow-sm">
                              <AlertCircle className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <h6 className="text-sm font-bold text-amber-800">
                                WhatsApp Não Vinculado
                              </h6>
                              <p className="text-[10px] font-medium text-amber-600/80">
                                Vincule um número para criar anúncios
                              </p>
                            </div>
                          </div>

                          {/* Body */}
                          <div className="space-y-3 p-4">
                            <div className="space-y-2.5 rounded-lg border border-amber-100 bg-white/80 p-3.5">
                              <p className="text-xs font-bold text-slate-700">
                                Como conectar em 1 minuto:
                              </p>
                              <ol className="list-decimal space-y-1.5 pl-4 text-[11px] font-medium leading-relaxed text-slate-600">
                                <li>
                                  Clique em <strong>"Vincular no Facebook"</strong> abaixo para
                                  abrir as configurações.
                                </li>
                                <li>
                                  Digite seu número de WhatsApp Business e envie o código de
                                  verificação.
                                </li>
                                <li>
                                  Confirme o código recebido no celular e clique em{" "}
                                  <strong>"Verificar conexão"</strong> aqui.
                                </li>
                              </ol>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <Button
                                type="button"
                                onClick={() => {
                                  setTutorialRedirectUrl(
                                    whatsAppSettingsUrl ||
                                      (metaConnection?.pageId
                                        ? `https://www.facebook.com/${metaConnection.pageId}/settings/?tab=whatsapp`
                                        : "https://www.facebook.com")
                                  );
                                  setIsProfileSwitchTutorialOpen(true);
                                }}
                                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border-0 bg-amber-500 px-4 text-[11px] font-bold text-white shadow-sm transition-all hover:bg-amber-600 active:scale-95"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Vincular no Facebook
                              </Button>
                              <Button
                                type="button"
                                onClick={checkWhatsAppConnection}
                                variant="outline"
                                className="h-8 gap-1.5 rounded-lg px-3 text-[11px] font-bold"
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
                    <h4 className="font-poppins flex items-center gap-2 text-lg font-bold text-slate-900">
                      <Sparkles className="h-5 w-5 text-primary" />
                      2. O que seu anúncio vai dizer?
                    </h4>
                    <p className="mt-1 text-xs text-slate-500">
                      Escreva ou use nossa inteligência artificial para criar legendas de alta
                      performance que engajam moradores locais!
                    </p>
                  </div>

                  {/* Nome Interno */}
                  <div className="space-y-2">
                    <Label htmlFor="ad-name" className="text-sm font-bold text-slate-700">
                      Nome da Campanha (Apenas para seu controle)
                    </Label>
                    <Input
                      id="ad-name"
                      value={adName}
                      onChange={(e) => setAdName(e.target.value)}
                      onFocus={() => setFocusedField("adName")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Ex: [NUMVAPT] Promoção de Inverno"
                      className="rounded-lg border-slate-200 text-sm focus:border-primary focus:ring-primary"
                    />
                    <p className="text-[10px] text-slate-400">
                      Este nome é 100% interno e não aparecerá para os clientes nas redes sociais.
                    </p>
                  </div>

                  {/* Legenda (Texto Principal) */}
                  <div className="space-y-2">
                    <Label htmlFor="ad-body" className="text-sm font-bold text-slate-700">
                      Texto Principal do Anúncio (Legenda)
                    </Label>
                    <Textarea
                      id="ad-body"
                      value={bodyText}
                      onChange={(e) => setBodyText(e.target.value)}
                      onFocus={() => setFocusedField("bodyText")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Escreva a legenda atrativa que aparecerá acima da imagem do anúncio..."
                      rows={5}
                      className="resize-none rounded-lg border-slate-200 text-sm focus:border-primary focus:ring-primary"
                    />
                  </div>

                  {/* Link de Destino Opcional (Alcance), Obrigatório (Tráfego), ou WhatsApp (automático) */}
                  <div className="space-y-4 pt-2">
                    {campaignObjective === "WHATSAPP" ? (
                      <div className="rounded-lg border border-green-200 bg-green-50/50 p-3.5">
                        <div className="mb-1 flex items-center gap-2">
                          <svg
                            viewBox="0 0 24 24"
                            className="h-4 w-4 text-green-600"
                            fill="currentColor"
                          >
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                            <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" />
                          </svg>
                          <span className="text-xs font-bold text-green-700">
                            Destino: WhatsApp
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-green-600/80">
                          O anúncio incluirá automaticamente o botão{" "}
                          <strong>"Enviar mensagem pelo WhatsApp"</strong> que direcionará os
                          clientes para uma conversa no WhatsApp vinculado à sua Página do Facebook.
                        </p>
                      </div>
                    ) : campaignObjective === "REACH" ? (
                      <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="toggle-destination"
                            checked={hasDestination}
                            onChange={(e) => setHasDestination(e.target.checked)}
                            className="h-4.5 w-4.5 cursor-pointer rounded border-slate-300 text-primary focus:ring-primary"
                          />
                          <Label
                            htmlFor="toggle-destination"
                            className="cursor-pointer select-none text-xs font-bold text-slate-700"
                          >
                            Adicionar link do seu site
                          </Label>
                        </div>
                        <p className="pl-7.5 text-[11px] leading-normal text-slate-500">
                          Ao ativar, adicionamos o botão <strong>"Saiba mais"</strong> no seu
                          anúncio para levar as pessoas diretamente ao seu site. Se preferir deixar
                          desativado, o anúncio será exibido sem botão, focando exclusivamente em
                          alcançar e ser visto pelo maior número possível de pessoas na sua região.
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-blue-500/10 bg-blue-50/20 p-3.5">
                        <p className="text-[11px] leading-relaxed text-slate-500">
                          O link do seu site é obrigatório nesta campanha para habilitar o botão{" "}
                          <strong>"Saiba mais"</strong> e direcionar os potenciais clientes.
                        </p>
                      </div>
                    )}

                    {/* Input de URL de Destino (não exibido para WhatsApp) */}
                    {campaignObjective !== "WHATSAPP" &&
                      (hasDestination || campaignObjective === "TRAFFIC") && (
                        <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm duration-200 animate-in fade-in slide-in-from-top-1">
                          <Label
                            htmlFor="destination-url"
                            className="text-xs font-bold text-slate-800"
                          >
                            Link do seu site
                          </Label>
                          <Input
                            id="destination-url"
                            value={customDestination}
                            onChange={(e) => setCustomDestination(e.target.value)}
                            onFocus={() => setFocusedField("destinationUrl")}
                            onBlur={() => setFocusedField(null)}
                            placeholder="seusite.com.br"
                            className="border-slate-200 bg-white text-sm focus:border-primary focus:ring-primary"
                          />
                        </div>
                      )}
                  </div>

                  {/* Título Chamativo (Exibido quando tem destino/botão ativo ou WhatsApp) */}
                  {(hasDestination ||
                    campaignObjective === "TRAFFIC" ||
                    campaignObjective === "WHATSAPP") && (
                    <div className="space-y-2 duration-200 animate-in fade-in slide-in-from-top-1">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="ad-headline" className="text-sm font-bold text-slate-700">
                          Título do Anúncio (Fica abaixo da imagem)
                        </Label>
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
                        placeholder={
                          campaignObjective === "WHATSAPP"
                            ? "Ex: Fale conosco agora pelo WhatsApp!"
                            : "Ex: Hambúrguer Artesanal Perto de Você!"
                        }
                        maxLength={40}
                        className="rounded-lg border-slate-200 text-sm focus:border-primary focus:ring-primary"
                      />
                      <p className="text-[10px] text-slate-400">
                        Este título será exibido em destaque no anúncio, ao lado do botão{" "}
                        <strong>
                          {campaignObjective === "WHATSAPP" ? '"Enviar mensagem"' : '"Saiba mais"'}
                        </strong>
                        .
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* PASSO 3: TARGETING E SEGMENTAÇÃO LOCAL */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-poppins flex items-center gap-2 text-lg font-bold text-slate-900">
                      <Target className="h-5 w-5 text-primary" />
                      3. Onde seu anúncio vai aparecer?
                    </h4>
                    <p className="mt-1 text-xs text-slate-500">
                      Moradores próximos do seu negócio físico são os que mais geram vendas! Defina
                      o raio ao redor da sua loja.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Localização Híbrida (Qualquer endereço, rua, bairro, cidade ou estado) */}
                    <div className="relative space-y-2">
                      <Label className="flex items-center justify-between text-sm font-bold text-slate-700">
                        <span className="font-poppins flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-primary" /> Onde seu anúncio vai aparecer?
                          (Região ou Endereço)
                        </span>
                      </Label>
                      <p className="mb-1 text-[11px] leading-normal text-slate-500">
                        Você pode digitar um <strong>endereço exato (rua/avenida)</strong>,{" "}
                        <strong>bairro</strong>, <strong>cidade</strong> ou <strong>estado</strong>{" "}
                        e selecionar na lista recomendada.
                      </p>
                      <div className="relative">
                        <Input
                          value={addressInput}
                          onChange={(e) => handleAddressInputChange(e.target.value)}
                          placeholder="Digite a rua, bairro, cidade ou estado (Ex: Copacabana, Rio de Janeiro)..."
                          className={`border-slate-200 bg-white pr-9 text-sm focus:border-primary focus:ring-primary ${selectedLocations.length > 0 ? "border-green-300 ring-green-100" : ""}`}
                        />
                        <div className="absolute right-3 top-3 flex items-center gap-1 text-slate-400">
                          {isSearchingLocations ? (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          ) : selectedLocations.length > 0 ? (
                            <Check className="h-4 w-4 font-extrabold text-green-500" />
                          ) : (
                            <Search className="h-4 w-4 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {/* Dropdown flutuante de sugestões */}
                      {metaLocationsSuggestions.length > 0 && (
                        <div className="absolute z-50 mt-1 flex w-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl duration-200 animate-in fade-in slide-in-from-top-1">
                          <div className="shrink-0 border-b border-slate-100 bg-slate-50 p-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Localidades Recomendadas
                          </div>
                          <div className="scrollbar-thin max-h-48 overflow-y-auto py-1">
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
                                      if (
                                        !lowerName.includes("brasil") &&
                                        !lowerName.includes("brazil")
                                      ) {
                                        searchQ = `${loc.name}, Brasil`;
                                      }
                                      const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQ)}&format=json&limit=1&polygon_geojson=1&polygon_threshold=0.01`;
                                      const nomRes = await fetch(nomUrl, {
                                        headers: {
                                          "User-Agent": "NumVaptAdsApp/1.0",
                                          "Accept-Language": "pt-BR,pt;q=0.9",
                                        },
                                      });
                                      if (nomRes.ok) {
                                        const nomData = await nomRes.json();
                                        if (nomData && nomData.length > 0) {
                                          const lat = parseFloat(nomData[0].lat);
                                          const lng = parseFloat(nomData[0].lon);
                                          const bbox = nomData[0].boundingbox
                                            ? [
                                                parseFloat(nomData[0].boundingbox[0]),
                                                parseFloat(nomData[0].boundingbox[1]),
                                                parseFloat(nomData[0].boundingbox[2]),
                                                parseFloat(nomData[0].boundingbox[3]),
                                              ]
                                            : null;

                                          addLocation({
                                            name: loc.name,
                                            type: loc.type,
                                            key: loc.key || "",
                                            latitude: lat,
                                            longitude: lng,
                                            boundingBox: bbox,
                                            geoJson: nomData[0].geojson || null,
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
                                        geoJson: null,
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
                                        geoJson: null,
                                      });
                                    } else {
                                      // Geocodificação sob demanda no cliente para endereços/regiões sem coordenadas nativas
                                      setIsSearchingLocations(true);
                                      try {
                                        const lowerName = loc.name.toLowerCase();
                                        let searchQ = loc.name;
                                        if (
                                          !lowerName.includes("brasil") &&
                                          !lowerName.includes("brazil")
                                        ) {
                                          searchQ = `${loc.name}, Brasil`;
                                        }
                                        const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQ)}&format=json&limit=1`;
                                        const nomRes = await fetch(nomUrl, {
                                          headers: {
                                            "User-Agent": "NumVaptAdsApp/1.0",
                                            "Accept-Language": "pt-BR,pt;q=0.9",
                                          },
                                        });
                                        if (nomRes.ok) {
                                          const nomData = await nomRes.json();
                                          if (nomData && nomData.length > 0) {
                                            const lat = parseFloat(nomData[0].lat);
                                            const lng = parseFloat(nomData[0].lon);
                                            const bbox = nomData[0].boundingbox
                                              ? [
                                                  parseFloat(nomData[0].boundingbox[0]),
                                                  parseFloat(nomData[0].boundingbox[1]),
                                                  parseFloat(nomData[0].boundingbox[2]),
                                                  parseFloat(nomData[0].boundingbox[3]),
                                                ]
                                              : null;

                                            addLocation({
                                              name: loc.name,
                                              type: loc.type,
                                              key: loc.key || "",
                                              latitude: lat,
                                              longitude: lng,
                                              boundingBox: bbox,
                                              geoJson: null,
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
                                          description:
                                            "Não conseguimos obter o ponto exato no mapa para esta região.",
                                        });
                                      } finally {
                                        setIsSearchingLocations(false);
                                      }
                                    }
                                  }
                                }}
                                className="flex w-full items-center justify-between border-b border-slate-50 px-3.5 py-2.5 text-left text-xs transition-colors last:border-b-0 hover:bg-slate-50"
                              >
                                <div className="flex flex-col truncate pr-2">
                                  <span className="truncate font-bold text-slate-700">
                                    {loc.name}
                                  </span>
                                  <span className="mt-0.5 text-[10px] font-normal capitalize text-slate-400">
                                    Tipo: {loc.type} • {loc.region || "Brasil"}
                                  </span>
                                </div>
                                <Badge className="ml-1 shrink-0 scale-90 border-none bg-slate-100 text-[9px] font-semibold capitalize text-slate-500 hover:bg-slate-100">
                                  {loc.type}
                                </Badge>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Lista de Localidades Selecionadas */}
                      {selectedLocations.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2 rounded-xl border border-slate-200/50 bg-slate-50 p-3">
                          {selectedLocations.map((loc, idx) => (
                            <div
                              key={`${loc.key || "loc"}_${idx}`}
                              className="shadow-xs inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 duration-200 animate-in zoom-in"
                            >
                              <MapPin className="h-3 w-3 text-primary" />
                              <span>{loc.name}</span>
                              <span className="ml-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                ({loc.type})
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedLocations((prev) => prev.filter((_, i) => i !== idx));
                                }}
                                className="ml-1 text-slate-400 transition-colors hover:text-red-500 focus:outline-none"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {addressInput.length > 0 && selectedLocations.length === 0 && (
                        <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                          Digite o endereço e selecione uma das opções recomendadas da lista.
                        </p>
                      )}
                    </div>

                    {/* MAPA VISUAL INTERATIVO */}
                    <div className="space-y-2">
                      <Label className="block text-xs font-bold text-slate-500">
                        Mapa de Segmentação Geográfica
                      </Label>
                      <div className="flex items-start gap-1.5 rounded-lg border border-blue-100/30 bg-blue-50/50 p-2.5 text-[11px] leading-normal text-slate-500">
                        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                        <span>
                          O mapa exibe visualmente todas as regiões, cidades ou endereços que você
                          adicionou acima.
                        </span>
                      </div>
                      <div
                        id="targeting-map"
                        className="shadow-xs relative z-10 h-72 w-full overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50"
                        style={{ minHeight: "280px" }}
                      />
                    </div>

                    {/* Lógica de Área de Cobertura Inteligente e Condicional */}
                    {selectedLocations.length > 0 && (
                      <div className="space-y-4 duration-300 animate-in fade-in">
                        {selectedLocations.some(
                          (l) => l.type === "País" || l.type === "Estado"
                        ) && (
                          <div className="mt-2 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                            <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                            <div className="text-[12px] leading-relaxed text-slate-600">
                              <strong>Cobertura Ampla (País/Estado):</strong> O seu anúncio será
                              veiculado em todo o território das regiões selecionadas.
                            </div>
                          </div>
                        )}

                        {selectedLocations.some(
                          (l) => l.type !== "País" && l.type !== "Estado"
                        ) && (
                          <div className="space-y-4 pt-2">
                            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-slate-700">
                                  Área de Cobertura do Anúncio (Raio ao redor de locais)
                                </span>
                                <span className="font-poppins text-base font-extrabold text-primary">
                                  {radius} km
                                </span>
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

                              <div className="shadow-xs mt-3 flex items-start gap-2 rounded border border-slate-100 bg-white p-2.5">
                                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                                <p className="text-[11px] leading-normal text-slate-500">
                                  <span>
                                    <strong>Indicado para negócios locais:</strong> O raio de{" "}
                                    <strong>{radius} km</strong> será aplicado ao redor das cidades
                                    e endereços selecionados para atrair clientes da vizinhança.
                                  </span>
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
                <div className="space-y-6 duration-300 animate-in fade-in">
                  <div>
                    <h4 className="font-poppins flex items-center gap-2 text-lg font-bold text-slate-900">
                      <Users className="h-5 w-5 text-primary" />
                      4. Quem deve ver seu anúncio?
                    </h4>
                    <p className="mt-1 text-xs text-slate-500">
                      Refine o público demográfico e adicione interesses de alta relevância para
                      direcionar seu anúncio.
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
                          className={`h-auto rounded-lg border-slate-200 py-2 text-xs font-medium ${gender === "all" ? "bg-primary text-white" : "text-slate-650 bg-white"}`}
                        >
                          Todos
                        </Button>
                        <Button
                          type="button"
                          variant={gender === "male" ? "default" : "outline"}
                          onClick={() => setGender("male")}
                          className={`h-auto rounded-lg border-slate-200 py-2 text-xs font-medium ${gender === "male" ? "bg-primary text-white" : "text-slate-650 bg-white"}`}
                        >
                          Homens
                        </Button>
                        <Button
                          type="button"
                          variant={gender === "female" ? "default" : "outline"}
                          onClick={() => setGender("female")}
                          className={`h-auto rounded-lg border-slate-200 py-2 text-xs font-medium ${gender === "female" ? "bg-primary text-white" : "text-slate-650 bg-white"}`}
                        >
                          Mulheres
                        </Button>
                      </div>
                    </div>

                    {/* Idades Seletores Dropdowns Lado a Lado */}
                    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <Label className="block text-xs font-bold text-slate-700">
                        Faixa Etária Recomendada
                      </Label>
                      <div className="grid grid-cols-2 gap-4">
                        {/* Idade Mínima */}
                        <div className="space-y-1.5">
                          <Label htmlFor="age-min" className="text-[11px] font-bold text-slate-500">
                            Mínima (Anos)
                          </Label>
                          <select
                            id="age-min"
                            value={ageRange[0]}
                            onChange={(e) => {
                              const newMin = parseInt(e.target.value);
                              const newMax = ageRange[1] < newMin ? newMin : ageRange[1];
                              setAgeRange([newMin, newMax]);
                            }}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
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
                          <Label htmlFor="age-max" className="text-[11px] font-bold text-slate-500">
                            Máxima (Anos)
                          </Label>
                          <select
                            id="age-max"
                            value={ageRange[1]}
                            onChange={(e) => {
                              const newMax = parseInt(e.target.value);
                              const newMin = ageRange[0] > newMax ? newMax : ageRange[0];
                              setAgeRange([newMin, newMax]);
                            }}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
                          >
                            {Array.from({ length: 48 }, (_, i) => 18 + i).map((age) => (
                              <option key={age} value={age} disabled={age < ageRange[0]}>
                                {age === 65 ? "65+ anos" : `${age} anos`}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <p className="text-[10px] leading-normal text-slate-400">
                        * Meta Ads exige idade mínima de pelo menos 18 anos para campanhas
                      </p>
                    </div>

                    {/* Campo de Interesses por Autocomplete */}
                    <div className="relative space-y-2">
                      <Label
                        htmlFor="interests-search"
                        className="text-sm font-bold text-slate-700"
                      >
                        Interesses Recomendados (Opcional)
                      </Label>
                      <p className="text-[11px] leading-normal text-slate-500">
                        Adicione palavras-chave relacionadas ao seu público para encontrar pessoas
                        com maior potencial de compra (ex: hambúrguer, pizza, cosméticos).
                      </p>

                      <div className="relative">
                        <Input
                          id="interests-search"
                          value={interestsSearchQuery}
                          onChange={(e) => setInterestsSearchQuery(e.target.value)}
                          placeholder="Digite para buscar interesses... (Ex: Pizza, Beleza, Moda)"
                          className="border-slate-200 bg-white pr-9 text-sm focus:border-primary focus:ring-primary"
                        />
                        <div className="text-slate-450 absolute right-3 top-3">
                          {isLoadingInterests ? (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          ) : (
                            <Search className="h-4 w-4 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {/* Sugestões do Autocomplete da Meta */}
                      {searchedInterests.length > 0 && (
                        <div className="z-55 absolute mt-1 flex w-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl duration-200 animate-in fade-in">
                          <div className="scrollbar-thin max-h-48 overflow-y-auto py-1">
                            {searchedInterests.map((interest) => (
                              <button
                                key={interest.id}
                                type="button"
                                onClick={() =>
                                  addInterest({
                                    id: interest.id,
                                    name: interest.name,
                                    type: interest.type,
                                  })
                                }
                                className="flex w-full items-center justify-between border-b border-slate-50 px-3.5 py-2.5 text-left text-xs transition-colors last:border-b-0 hover:bg-slate-50"
                              >
                                <div className="flex flex-col truncate pr-2">
                                  <span className="text-slate-755 font-bold">{interest.name}</span>
                                  {interest.path && (
                                    <span className="mt-0.5 truncate text-[10px] font-normal text-slate-400">
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
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedInterests.map((interest) => (
                            <div
                              key={interest.id}
                              className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary duration-150 animate-in zoom-in"
                            >
                              <span>{interest.name}</span>
                              <button
                                type="button"
                                onClick={() => removeInterest(interest.id)}
                                className="ml-1 text-primary/70 transition-colors hover:text-red-500 focus:outline-none"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Chips de Sugestão Estática Baseada na Categoria do Perfil */}
                      <div className="mt-3 space-y-1.5">
                        <span className="font-poppins block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Sugestões Rápidas:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {getCategoryPresets(initialProfile?.category).map((preset) => {
                            const isSelected = selectedInterests.some((i) => i.id === preset.id);
                            return (
                              <button
                                key={preset.id}
                                type="button"
                                disabled={isSelected}
                                onClick={() => addInterest(preset)}
                                className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all ${
                                  isSelected
                                    ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                                    : "active:scale-98 border-slate-200 bg-white text-slate-600 hover:border-primary/40 hover:bg-slate-50/50"
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
                        <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 text-left animate-in slide-in-from-top-1">
                          <AlertCircle className="h-4.5 w-4.5 mt-0.5 shrink-0 text-amber-500" />
                          <p className="text-slate-650 text-[11px] leading-relaxed">
                            <strong>Público muito restrito:</strong> Você selecionou interesses
                            específicos com um raio de apenas {radius} km. Isso pode reduzir muito a
                            entrega do seu anúncio. Considere aumentar o raio ou remover os
                            interesses se o anúncio demorar para rodar.
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
                    <h4 className="font-poppins flex items-center gap-2 text-lg font-bold text-slate-900">
                      <DollarSign className="h-5 w-5 text-primary" />
                      5. Quanto deseja investir?
                    </h4>
                    <p className="mt-1 text-xs text-slate-500">
                      Defina seu orçamento diário. Quanto mais você investe, para mais pessoas
                      próximas a Meta exibirá seu post!
                    </p>
                  </div>

                  {/* Alerta de Cobrança Pendente no Wizard */}
                  {billingStatus && !billingStatus.hasPaymentMethod && (
                    <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-left animate-in slide-in-from-top-1">
                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                      <div className="space-y-1">
                        <h6 className="font-poppins text-xs font-bold text-slate-800">
                          Forma de pagamento obrigatória
                        </h6>
                        <p className="text-[11px] leading-relaxed text-slate-500">
                          Sua conta de anúncios da Meta ainda não possui uma forma de pagamento
                          cadastrada. Adicione um cartão de crédito ou realize uma recarga via
                          Pix/Boleto para poder ativar este anúncio.
                        </p>
                        <Button
                          type="button"
                          onClick={() => {
                            setBillingGuideActive(false);
                            setIsBillingModalOpen(true);
                          }}
                          className="mt-1 h-8 rounded-lg bg-primary px-3 text-[10px] font-bold text-white hover:bg-primary/95"
                        >
                          Configurar Faturamento
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-5">
                    {/* Investimento Diário */}
                    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-700">
                            Investimento Diário
                          </span>
                          <span className="text-[10px] font-normal text-slate-400">
                            Valor diário debitado do seu saldo Meta
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-poppins text-base font-extrabold text-primary">
                            R$ {dailyBudget} / dia
                          </span>
                          <span className="mt-0.5 block text-xs font-bold text-slate-500">
                            Total: R$ {(dailyBudget * duration).toFixed(2)}
                          </span>
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
                    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-700">
                            Duração dos Anúncios
                          </span>
                          <span className="text-[10px] font-normal text-slate-400">
                            Período de veiculação da campanha
                          </span>
                        </div>
                        <span className="font-poppins text-base font-extrabold text-primary">
                          {duration} dias
                        </span>
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
                    <div className="relative overflow-hidden rounded-xl border-2 border-orange-500/20 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-5">
                      <div className="pointer-events-none absolute right-0 top-0 -translate-y-4 translate-x-4 opacity-5">
                        <Megaphone className="h-32 w-32" />
                      </div>
                      <h5 className="font-poppins flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-orange-600">
                        <TrendingUp className="h-4 w-4" /> Resultados Estimados na Sua Região
                      </h5>

                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div className="rounded-lg border border-orange-500/10 bg-white p-3 shadow-sm">
                          <span className="block text-[10px] font-medium text-slate-400">
                            Pessoas que verão o anúncio:
                          </span>
                          <span className="font-poppins mt-0.5 block text-lg font-extrabold text-orange-600">
                            {reach.minReach.toLocaleString("pt-BR")} a{" "}
                            {reach.maxReach.toLocaleString("pt-BR")}
                          </span>
                        </div>
                        <div className="rounded-lg border border-orange-500/10 bg-white p-3 shadow-sm">
                          <span className="block text-[10px] font-medium text-slate-400">
                            Cliques de interesse gerados:
                          </span>
                          <span className="font-poppins mt-0.5 block text-lg font-extrabold text-orange-600">
                            {reach.minClicks.toLocaleString("pt-BR")} a{" "}
                            {reach.maxClicks.toLocaleString("pt-BR")}
                          </span>
                        </div>
                      </div>

                      <p className="mt-4 text-[11px] italic leading-relaxed text-slate-500">
                        Essas estimativas são baseadas em históricos de anúncios na Meta e podem
                        variar
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Botões de Ação do Wizard */}
              <div className="mt-8 flex justify-between border-t border-slate-200 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
                    else setIsCreating(false);
                  }}
                  className="rounded-lg border-slate-200 text-xs font-bold"
                >
                  {currentStep === 1 ? "Cancelar" : "Voltar"}
                </Button>

                {currentStep < 5 ? (
                  <Button
                    type="button"
                    onClick={() => {
                      if (
                        currentStep === 1 &&
                        campaignObjective === "WHATSAPP" &&
                        !hasWhatsAppConnected
                      ) {
                        toast({
                          variant: "destructive",
                          title: "WhatsApp não conectado",
                          description:
                            "Por favor, vincule seu WhatsApp comercial e atualize a conexão antes de prosseguir.",
                        });
                        return;
                      }
                      if (currentStep === 3 && selectedLocations.length === 0) {
                        toast({
                          variant: "destructive",
                          title: "Selecione uma localização oficial",
                          description:
                            "Digite o endereço e selecione uma das opções sugeridas na lista flutuante.",
                        });
                        return;
                      }
                      setCurrentStep((prev) => prev + 1);
                    }}
                    disabled={
                      currentStep === 1 &&
                      campaignObjective === "WHATSAPP" &&
                      hasWhatsAppConnected !== true
                    }
                    className={`rounded-lg px-6 py-2 text-xs font-bold ${
                      currentStep === 1 &&
                      campaignObjective === "WHATSAPP" &&
                      hasWhatsAppConnected !== true
                        ? "cursor-not-allowed border-none bg-slate-200 text-slate-400"
                        : "active:scale-98 bg-primary text-white shadow-sm hover:bg-primary/95"
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
                              description:
                                "Por favor, cadastre uma forma de pagamento para poder ativar a campanha.",
                            });
                          }
                        : handleActivateCampaign
                    }
                    disabled={isSubmitting}
                    className="rounded-lg bg-primary px-8 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-primary/95 active:scale-95"
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
            <div className="flex flex-col items-center justify-start bg-slate-50 p-6 lg:col-span-5">
              <div className="sticky top-6 w-full max-w-[340px]">
                <p className="mb-3 block text-center text-xs font-bold uppercase tracking-wider text-slate-400">
                  📱 Prévia em tempo real (Meta Feed)
                </p>

                {/* Card de Simulação Meta */}
                <div className="relative">
                  {/* Alerta de Nome da Campanha Interno e Privado */}
                  {focusedField === "adName" && (
                    <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-[11px] font-medium text-amber-800 shadow-sm duration-200 animate-in slide-in-from-top-2">
                      <span>
                        O <strong>Nome da Campanha</strong> é 100% privado. Ele serve apenas para
                        você se organizar e nunca será visto pelos seus clientes nas redes sociais.
                      </span>
                    </div>
                  )}

                  <div className="overflow-hidden rounded-lg border border-slate-200 bg-white text-left shadow-md">
                    {/* Topo do Post */}
                    <div className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-9 w-9 border border-slate-100">
                          <AvatarImage src={businessProfile?.logo?.url || ""} />
                          <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                            {getAvatarFallback()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="block text-xs font-bold leading-tight text-slate-900">
                            {businessProfile?.name || "Meu Negócio"}
                          </span>
                          <span className="mt-0.5 block text-[10px] font-semibold leading-tight text-primary">
                            Patrocinado
                          </span>
                        </div>
                      </div>
                      <span className="cursor-default text-sm font-bold text-slate-400">•••</span>
                    </div>

                    {/* Foto do Post */}
                    <div className="relative aspect-square w-full border-y border-slate-100 bg-slate-100">
                      {selectedPost.imageUrl || selectedPost.imageUrls?.[0] ? (
                        <Image
                          src={selectedPost.imageUrl || selectedPost.imageUrls?.[0]}
                          alt="Criativo Anúncio"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-300">
                          <Eye className="h-10 w-10" />
                        </div>
                      )}
                    </div>

                    {/* Barra de Ação de Conversão (CTA) */}
                    {(hasDestination ||
                      campaignObjective === "TRAFFIC" ||
                      campaignObjective === "WHATSAPP") && (
                      <div
                        className={`relative flex items-center justify-between gap-3 border-b border-slate-100 bg-[#F2F4F7] px-3.5 py-2.5 transition-all duration-300 ${focusedField === "headline" || focusedField === "destinationUrl" ? "z-10 scale-[1.01] bg-primary/5 ring-2 ring-primary/50" : ""}`}
                      >
                        {focusedField === "headline" && (
                          <span className="absolute -top-2.5 right-3 animate-bounce rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold text-white shadow">
                            Título do Anúncio
                          </span>
                        )}
                        {focusedField === "destinationUrl" && (
                          <span className="absolute -top-2.5 right-3 animate-bounce rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold text-white shadow">
                            Link do Site (Botão)
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <span className="block truncate text-[9px] font-semibold uppercase leading-none tracking-wide text-slate-500">
                            {campaignObjective === "WHATSAPP"
                              ? "WHATSAPP"
                              : customDestination
                                ? customDestination
                                    .replace(/^(https?:\/\/)?(www\.)?/, "")
                                    .split("/")[0]
                                    .toUpperCase()
                                : "SEUSITE.COM.BR"}
                          </span>
                          <span className="mt-1 block truncate text-xs font-bold leading-snug text-slate-800">
                            {headline ||
                              (campaignObjective === "WHATSAPP"
                                ? "Fale conosco pelo WhatsApp!"
                                : "Aproveite nossa oferta local!")}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          className={`${campaignObjective === "WHATSAPP" ? "bg-green-500 hover:bg-green-600" : "bg-primary hover:bg-primary"} pointer-events-none h-7 rounded px-3 text-[10px] font-bold text-white`}
                        >
                          {campaignObjective === "WHATSAPP" ? "Enviar mensagem" : "Saiba Mais"}
                        </Button>
                      </div>
                    )}

                    {/* Legenda/Corpo */}
                    <div
                      className={`relative p-3 transition-all duration-300 ${focusedField === "bodyText" ? "z-10 scale-[1.01] bg-primary/5 ring-2 ring-primary/50" : ""}`}
                    >
                      {focusedField === "bodyText" && (
                        <span className="absolute -top-2.5 right-3 animate-bounce rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold text-white shadow">
                          Texto Principal (Legenda)
                        </span>
                      )}
                      <p className="font-inter line-clamp-4 text-xs leading-relaxed text-slate-700">
                        <span className="mr-1.5 font-bold text-slate-900">
                          {businessProfile?.name || "Meu Negócio"}
                        </span>
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
      {!isCreating && (isMetaActive || isGoogleActive) && (
        <div className="space-y-8 duration-300 animate-in fade-in">
          {/* Seletor de Plataforma se ambas estiverem conectadas */}
          {isMetaActive && isGoogleActive && (
            <div className="shadow-xs mb-6 flex w-full flex-col gap-3 rounded-2xl border border-slate-200/60 bg-slate-100/40 p-1.5 sm:w-fit sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setActivePlatformTab("meta");
                  setActiveDashboardTab("active");
                  setCurrentPage(1);
                }}
                className={`font-poppins flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-xs font-extrabold transition-all duration-300 ${
                  activePlatformTab === "meta"
                    ? "scale-105 bg-[#1877F2] text-white shadow-md shadow-blue-500/10"
                    : "text-slate-500 hover:bg-slate-200/50 hover:text-slate-800"
                }`}
              >
                <Megaphone className="h-4 w-4" />
                Meta (Instagram e Facebook)
              </button>
              <button
                type="button"
                onClick={() => {
                  setActivePlatformTab("google");
                  setActiveDashboardTab("active");
                  setCurrentPage(1);
                }}
                className={`font-poppins flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-xs font-extrabold transition-all duration-300 ${
                  activePlatformTab === "google"
                    ? "scale-105 bg-[#4285F4] text-white shadow-md shadow-blue-600/10"
                    : "text-slate-500 hover:bg-slate-200/50 hover:text-slate-800"
                }`}
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                </svg>
                Google Ads
              </button>
            </div>
          )}

          {/* Banner auxiliar se apenas uma plataforma estiver conectada */}
          {!isMetaActive && (
            <div className="mb-6 flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-left sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <Megaphone className="h-5 w-5 text-slate-400" />
                <div>
                  <h6 className="text-xs font-bold text-slate-800">
                    Impulsione também no Instagram e Facebook
                  </h6>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    Conecte sua página do Facebook para criar campanhas sociais locais com
                    facilidade.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={handleConnectMetaAds}
                className="h-8 rounded-lg bg-primary px-4 text-[10px] font-bold text-white"
              >
                Conectar Meta Ads
              </Button>
            </div>
          )}
          {!isGoogleActive && (
            <div className="mb-6 flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-left sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                </svg>
                <div>
                  <h6 className="text-xs font-bold text-slate-800">Anuncie também no Google Ads</h6>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    Apareça no topo das buscas locais e no Google Mapas para clientes na sua região.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={handleConnectGoogleAds}
                className="h-8 rounded-lg bg-[#4285F4] px-4 text-[10px] font-bold text-white hover:bg-[#4285F4]/95"
              >
                Conectar Google Ads
              </Button>
            </div>
          )}

          {/* GERENCIAMENTO DE CAMPANHAS EM VEICULAÇÃO OU HISTÓRICO */}
          <div className="space-y-5 text-left">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="rounded-r-lg border-l-4 border-slate-200 bg-slate-50/50 p-1 pl-3 transition-all duration-300">
                <h3 className="font-poppins text-xs font-extrabold uppercase tracking-wider text-slate-800">
                  Histórico de Campanhas
                </h3>
              </div>

              {/* Botão de Ação Primária Padronizado e Próximo às Campanhas */}
              <div>
                {activePlatformTab === "meta" && isMetaActive && (
                  <Button
                    onClick={handleOpenChoosePostModal}
                    className="font-poppins flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-xs transition-transform duration-200 hover:bg-primary/95 active:scale-95"
                  >
                    <Plus className="h-4 w-4" />
                    Impulsionar Publicação
                  </Button>
                )}
                {activePlatformTab === "google" && isGoogleActive && (
                  <Button
                    onClick={() => setIsCreatingGoogleAd(true)}
                    className="font-poppins flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-xs transition-transform duration-200 hover:bg-primary/95 active:scale-95"
                  >
                    <Plus className="h-4 w-4" />
                    Criar Anúncio no Google
                  </Button>
                )}
              </div>
            </div>
            {/* SELETOR DE ABAS SEGMENT CONTROL */}
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="inline-flex gap-1 rounded-xl border border-slate-200/50 bg-slate-100/80 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveDashboardTab("active");
                    setCurrentPage(1);
                  }}
                  className={`font-poppins flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-bold transition-all duration-200 ${
                    activeDashboardTab === "active"
                      ? "shadow-xs bg-white text-slate-900"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <span>Em Veiculação</span>
                  <span
                    className={`rounded-full px-2 py-0 text-[10px] font-bold ${
                      activeDashboardTab === "active"
                        ? "bg-primary/10 text-primary"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {
                      (activePlatformTab === "meta" ? campaigns : googleCampaigns).filter(
                        (c) => c.status === "active"
                      ).length
                    }
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveDashboardTab("history");
                    setCurrentPage(1);
                  }}
                  className={`font-poppins flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-bold transition-all duration-200 ${
                    activeDashboardTab === "history"
                      ? "shadow-xs bg-white text-slate-900"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <span>Histórico de Anúncios</span>
                  <span
                    className={`rounded-full px-2 py-0 text-[10px] font-bold ${
                      activeDashboardTab === "history"
                        ? "bg-primary/10 text-primary"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {
                      (activePlatformTab === "meta" ? campaigns : googleCampaigns).filter(
                        (c) => c.status !== "active"
                      ).length
                    }
                  </span>
                </button>
              </div>
              <span className="font-inter flex items-center gap-1.5 self-end text-xs font-medium text-slate-400 sm:self-center">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Relatórios considerando os últimos 30 dias ({dateRangeText})
              </span>
            </div>

            {/* LISTA EM TABELA PREMIUM */}
            {loading ? (
              <div className="flex items-center justify-center rounded-xl border border-slate-200/80 bg-white py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              (() => {
                const currentPlatformCampaigns =
                  activePlatformTab === "meta" ? campaigns : googleCampaigns;
                const filteredCampaigns = currentPlatformCampaigns.filter((c) => {
                  return activeDashboardTab === "active"
                    ? c.status === "active"
                    : c.status !== "active";
                });
                const totalPages = Math.ceil(filteredCampaigns.length / ITEMS_PER_PAGE) || 1;
                const safeCurrentPage = Math.min(currentPage, totalPages);
                const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
                const paginatedCampaigns = filteredCampaigns.slice(
                  startIndex,
                  startIndex + ITEMS_PER_PAGE
                );

                if (filteredCampaigns.length === 0) {
                  return (
                    <div className="rounded-xl border border-dashed border-slate-200/80 bg-slate-50 p-10 text-center text-slate-400 duration-300 animate-in fade-in">
                      <Megaphone className="mx-auto mb-3 h-10 w-10 animate-pulse text-slate-300" />
                      <p className="text-xs font-semibold text-slate-500">
                        {activeDashboardTab === "active"
                          ? "Você não possui nenhuma campanha ativa no momento."
                          : "Nenhum anúncio finalizado ou pausado no histórico."}
                      </p>
                      {activeDashboardTab === "active" && (
                        <div className="mt-3.5 flex flex-col items-center gap-4">
                          <p className="mx-auto max-w-md text-[11.5px] leading-relaxed text-slate-400">
                            {activePlatformTab === "meta"
                              ? "Selecione um de seus posts publicados e configure o raio e orçamento do seu anúncio local para começar a atrair novos clientes na sua região."
                              : "Crie campanhas de busca qualificadas para posicionar o seu negócio no topo dos resultados do Google Ads."}
                          </p>
                          {activePlatformTab === "meta" ? (
                            publishedPosts.length > 0 ? (
                              <Button
                                onClick={handleOpenChoosePostModal}
                                className="font-poppins flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-transform hover:bg-primary/95 active:scale-95"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                Impulsionar Publicação
                              </Button>
                            ) : (
                              <p className="rounded-lg border border-amber-100/60 bg-amber-50 px-3 py-1.5 text-[11px] font-medium text-amber-600">
                                Crie e programe um post na aba <strong>Conteúdo</strong> antes de
                                impulsioná-lo!
                              </p>
                            )
                          ) : (
                            <Button
                              onClick={() => setIsCreatingGoogleAd(true)}
                              className="font-poppins flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-transform hover:bg-primary/95 active:scale-95"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Criar Anúncio no Google
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div className="shadow-xs overflow-hidden rounded-xl border border-slate-200/80 bg-white duration-300 animate-in fade-in slide-in-from-bottom-2">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr className="font-poppins border-b border-slate-200/60 bg-slate-50/50 text-xs font-semibold normal-case tracking-normal text-slate-500">
                            <th className="px-5 py-3.5 font-semibold">Anúncio</th>
                            <th className="px-5 py-3.5 font-semibold">Status</th>
                            <th className="px-5 py-3.5 font-semibold">Duração</th>
                            <th className="px-5 py-3.5 font-semibold">Orçamento</th>
                            <th className="px-5 py-3.5 font-semibold text-primary">Investido</th>
                            <th className="px-5 py-3.5 text-right font-semibold">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-slate-150/40 font-inter text-slate-650 divide-y text-xs">
                          {paginatedCampaigns.map((c) => {
                            const totalDays = c.durationDays || 7;
                            let daysPassed = 1;
                            if (c.createdAt) {
                              const createdDate = (c.createdAt as any).toDate
                                ? (c.createdAt as any).toDate()
                                : new Date(c.createdAt as any);
                              const diffTime = Math.abs(Date.now() - createdDate.getTime());
                              daysPassed = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            }
                            if (daysPassed > totalDays) daysPassed = totalDays;
                            if (daysPassed < 1) daysPassed = 1;
                            const progressPercentage = Math.round((daysPassed / totalDays) * 100);

                            return (
                              <tr key={c.id} className="transition-colors hover:bg-slate-50/30">
                                {/* ANÚNCIO (FOTO + NOME) */}
                                <td className="px-5 py-3.5">
                                  <div className="flex items-center gap-3 text-left">
                                    <div className="relative shrink-0">
                                      {c.creative?.imageUrl ? (
                                        <div className="border-slate-150 shadow-xs relative h-14 w-14 overflow-hidden rounded-lg border bg-slate-50">
                                          <Image
                                            src={c.creative.imageUrl}
                                            alt="creative thumb"
                                            fill
                                            className="object-cover"
                                          />
                                        </div>
                                      ) : (
                                        <div className="border-slate-150 flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg border bg-slate-50">
                                          <svg
                                            className="h-6 w-6 text-[#4285F4]"
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                          >
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                          </svg>
                                        </div>
                                      )}

                                      {/* Platform badge overlay */}
                                      <span
                                        className={`shadow-xs absolute -left-1.5 -top-1.5 rounded-md p-0.5 text-white ${
                                          activePlatformTab === "meta"
                                            ? "bg-[#1877F2]"
                                            : "bg-[#4285F4]"
                                        }`}
                                      >
                                        {activePlatformTab === "meta" ? (
                                          <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24">
                                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                          </svg>
                                        ) : (
                                          <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                          </svg>
                                        )}
                                      </span>
                                    </div>
                                    <div className="min-w-0">
                                      <span className="block max-w-[220px] truncate text-xs font-bold leading-snug text-slate-900">
                                        {c.name}
                                      </span>
                                      <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                                        {activePlatformTab === "meta"
                                          ? "Meta Ads (Sociais)"
                                          : "Google Ads (Pesquisa)"}
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                {/* STATUS BADGE */}
                                <td className="px-5 py-3.5">
                                  <span
                                    className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                                      c.status === "active"
                                        ? "border-emerald-100 bg-emerald-50/50 text-emerald-700"
                                        : "border-slate-100 bg-slate-50 text-slate-500"
                                    }`}
                                  >
                                    {c.status === "active" && (
                                      <span className="relative flex h-1.5 w-1.5">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                      </span>
                                    )}
                                    {c.status === "active"
                                      ? "No Ar"
                                      : c.status === "paused"
                                        ? "Pausado"
                                        : "Concluído"}
                                  </span>
                                </td>

                                {/* DURAÇÃO PROGRESSO */}
                                <td className="px-5 py-3.5">
                                  {c.status === "active" ? (
                                    <div className="min-w-[120px] max-w-[150px] space-y-1">
                                      <div className="flex justify-between text-[10px] font-medium leading-none text-slate-500">
                                        <span>
                                          Dia {daysPassed}/{totalDays}
                                        </span>
                                        <span>{progressPercentage}%</span>
                                      </div>
                                      <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100/70">
                                        <div
                                          className={`h-1 rounded-full transition-all duration-500 ${
                                            activePlatformTab === "meta"
                                              ? "bg-[#1877F2]"
                                              : "bg-[#4285F4]"
                                          }`}
                                          style={{ width: `${progressPercentage}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="font-poppins px-2 text-xs font-medium text-slate-400">
                                      -
                                    </span>
                                  )}
                                </td>

                                {/* VERBA / ORÇAMENTO */}
                                <td className="px-5 py-3.5">
                                  <span className="text-xs font-semibold text-slate-800">
                                    R$ {c.budget?.amount?.toFixed(2) || "0.00"}/
                                    {c.budget?.type === "daily" ? "dia" : "total"}
                                  </span>
                                </td>

                                {/* INVESTIDO */}
                                <td className="px-5 py-3.5">
                                  <span className="text-xs font-bold text-slate-900">
                                    R$ {(c.metrics?.amountSpent || 0).toFixed(2)}
                                  </span>
                                </td>

                                {/* GERENCIAR (AÇÕES) */}
                                <td className="px-5 py-3.5 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Link
                                      href={`/dashboard/relatorios?tab=${activePlatformTab === "meta" ? "meta" : "google"}`}
                                      className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[10px] font-bold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 hover:text-primary"
                                      title="Ver relatório detalhado com criativos e quebras"
                                    >
                                      <BarChart3 className="h-3 w-3 text-primary" />
                                      Relatório
                                    </Link>
                                    {c.status === "active" ? (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          activePlatformTab === "meta"
                                            ? handleToggleStatus(c)
                                            : handleToggleGoogleStatus(c)
                                        }
                                        className="shadow-xs flex h-8 items-center gap-1 rounded-lg border-slate-200 px-2.5 text-[10px] font-bold text-yellow-600 transition-all duration-200 hover:border-yellow-200 hover:bg-yellow-50 hover:text-yellow-700"
                                        title={
                                          activePlatformTab === "meta"
                                            ? "Pausar anúncio na Meta"
                                            : "Pausar anúncio no Google"
                                        }
                                      >
                                        <Pause className="h-3 w-3" />
                                        Pausar
                                      </Button>
                                    ) : c.status === "paused" ? (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          activePlatformTab === "meta"
                                            ? handleToggleStatus(c)
                                            : handleToggleGoogleStatus(c)
                                        }
                                        className="shadow-xs flex h-8 items-center gap-1 rounded-lg border-slate-200 px-2.5 text-[10px] font-bold text-green-600 transition-all duration-200 hover:border-green-200 hover:bg-green-50 hover:text-green-700"
                                        title={
                                          activePlatformTab === "meta"
                                            ? "Ativar anúncio na Meta"
                                            : "Ativar anúncio no Google"
                                        }
                                      >
                                        <Play className="h-3 w-3" />
                                        Ativar
                                      </Button>
                                    ) : null}
                                    {activePlatformTab === "meta" && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteCampaign(c)}
                                        className="hover:text-red-650 h-8 w-8 rounded-lg text-red-500 transition-colors hover:bg-red-50"
                                        title="Excluir campanha da Meta"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* PAGINAÇÃO (5 ITENS POR PÁGINA) */}
                    {filteredCampaigns.length > ITEMS_PER_PAGE && (
                      <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-3 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500 font-inter">
                        <div>
                          Mostrando <span className="font-bold text-slate-800">{startIndex + 1}</span> a{" "}
                          <span className="font-bold text-slate-800">
                            {Math.min(startIndex + ITEMS_PER_PAGE, filteredCampaigns.length)}
                          </span>{" "}
                          de <span className="font-bold text-slate-800">{filteredCampaigns.length}</span> anúncios
                        </div>
                        <div className="flex items-center gap-1.5 self-end sm:self-auto">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={safeCurrentPage === 1}
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            className="h-7 px-2.5 text-xs font-semibold text-slate-700 hover:bg-white"
                          >
                            Anterior
                          </Button>
                          <span className="px-2 text-xs font-medium text-slate-600">
                            Página {safeCurrentPage} de {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={safeCurrentPage >= totalPages}
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            className="h-7 px-2.5 text-xs font-semibold text-slate-700 hover:bg-white"
                          >
                            Próxima
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()
            )}
          </div>

          {/* BANNER OPERACIONAL & ATALHO PARA RELATÓRIOS DETALHADOS (ABAIXO DAS CAMPANHAS) */}
          <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-r from-slate-50 via-white to-sky-50/40 p-5 shadow-xs transition-all">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3.5">
                <div className="rounded-xl bg-[#0083C7]/10 p-3 text-[#0083C7] shrink-0">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-poppins text-sm font-bold text-slate-900">
                    Relatórios de Performance
                  </h4>
                  <p className="mt-1 max-w-xl text-xs text-slate-500 leading-relaxed">
                    Acompanhe o desempenho detalhado, criativos e métricas de conversão das suas campanhas.
                  </p>
                </div>
              </div>

              <Link
                href={`/dashboard/relatorios?tab=${activePlatformTab === "meta" ? "meta" : "google"}`}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0083C7] hover:bg-[#006ca7] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all active:scale-95 shrink-0"
              >
                Ver Relatório Completo <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* O grid de posts foi movido para o Dialog de seleção */}
        </div>
      )}

      {/* MODAL DE SELEÇÃO DE PUBLICIDADE (CHOOSE POST) */}
      <Dialog open={isChoosePostModalOpen} onOpenChange={setIsChoosePostModalOpen}>
        <DialogContent className="flex max-h-[85vh] max-w-4xl flex-col p-6 font-sans">
          <DialogHeader className="border-b border-slate-100 pb-3">
            <DialogTitle className="font-poppins flex items-center gap-2 text-lg font-bold text-slate-900">
              Escolher Publicação para Impulsionar
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Selecione uma de suas publicações abaixo para iniciar o processo de impulsionamento
              local.
            </DialogDescription>
          </DialogHeader>

          {/* ABAS DO MODAL */}
          <div className="flex border-b border-slate-100 pb-2">
            <button
              onClick={() => setActiveModalTab("numvapt")}
              className={`font-poppins -mb-[9px] border-b-2 px-4 py-2 text-xs font-bold transition-all ${
                activeModalTab === "numvapt"
                  ? "border-primary font-extrabold text-primary"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              Criados no NumVapt
            </button>
            <button
              onClick={() => setActiveModalTab("instagram")}
              className={`font-poppins -mb-[9px] border-b-2 px-4 py-2 text-xs font-bold transition-all ${
                activeModalTab === "instagram"
                  ? "border-primary font-extrabold text-primary"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              Do Feed do Instagram
            </button>
          </div>

          <div className="scrollbar-thin flex-1 overflow-y-auto py-4">
            {activeModalTab === "numvapt" ? (
              loadingPosts ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : publishedPosts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200/80 bg-slate-50 p-10 text-center text-slate-400">
                  <p className="text-xs font-semibold text-slate-500">
                    Nenhum post publicado encontrado no feed do Instagram/Facebook.
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Crie e programe um post na aba Conteúdo antes de impulsioná-lo!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
                  {publishedPosts.map((post) => (
                    <div
                      key={post.id}
                      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:border-primary/40 hover:shadow"
                    >
                      <div className="relative aspect-square w-full overflow-hidden bg-slate-50">
                        {post.imageUrl || post.imageUrls?.[0] ? (
                          <Image
                            src={post.imageUrl || post.imageUrls?.[0]}
                            alt="Thumbnail post"
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-slate-300">
                            <Eye className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col justify-between gap-3 bg-white p-4">
                        <p className="font-inter line-clamp-3 text-xs leading-relaxed text-slate-600">
                          {post.text}
                        </p>

                        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3.5">
                          <span className="flex items-center gap-1 text-[10px] font-bold uppercase leading-none tracking-wider text-slate-400">
                            Pronto
                          </span>
                          <Button
                            size="sm"
                            onClick={() => handleSelectPostToBoost(post)}
                            className="font-poppins h-8 rounded-lg bg-primary px-3 text-[11px] font-extrabold text-white shadow-sm hover:bg-primary/95"
                          >
                            <Sparkles className="mr-1 h-3.5 w-3.5" />
                            Impulsionar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : // ABA DO INSTAGRAM FEED
            loadingInstagramPosts ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : instagramFeedPosts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200/80 bg-slate-50 p-8 text-center text-slate-400">
                <Instagram className="mx-auto mb-2.5 h-8 w-8 text-pink-500/70" />
                <p className="text-xs font-bold text-slate-700">
                  Instagram não conectado
                </p>
                <p className="mx-auto mt-1 max-w-md text-[11.5px] leading-relaxed text-slate-500">
                  Para carregar e impulsionar publicações diretamente do feed do seu Instagram, conecte sua conta na página <strong>Posts</strong>.
                </p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Link href="/dashboard/posts">
                    <Button
                      size="sm"
                      className="font-poppins h-8.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 text-xs font-bold text-white shadow-sm hover:opacity-90 active:scale-95"
                    >
                      <Instagram className="mr-1.5 h-3.5 w-3.5" />
                      Conectar Instagram na página Posts
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
                {instagramFeedPosts.map((post) => (
                  <div
                    key={post.id}
                    className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:border-primary/40 hover:shadow"
                  >
                    <div className="relative aspect-square w-full overflow-hidden bg-slate-50">
                      {post.imageUrl ? (
                        <Image
                          src={post.imageUrl}
                          alt="Thumbnail post Instagram"
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-300">
                          <Eye className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-between gap-3 bg-white p-4">
                      <p className="font-inter line-clamp-3 text-xs leading-relaxed text-slate-600">
                        {post.text}
                      </p>

                      <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3.5">
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span className="flex items-center gap-0.5">❤️ {post.likes}</span>
                          <span className="flex items-center gap-0.5">💬 {post.comments}</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleSelectPostToBoost(post)}
                          className="font-poppins h-8 rounded-lg bg-primary px-3 text-[11px] font-extrabold text-white shadow-sm hover:bg-primary/95"
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

      {/* MODAL DE SELEÇÃO DE CONTA DO GOOGLE ADS */}
      <Dialog
        open={isGoogleAccountModalOpen}
        onOpenChange={(open) => {
          setIsGoogleAccountModalOpen(open);
          if (!open) setGoogleAccountSearchQuery("");
        }}
      >
        <DialogContent className="max-w-md font-sans">
          <DialogHeader>
            <DialogTitle className="font-poppins flex items-center gap-2 text-lg font-bold text-slate-900">
              <Target className="h-5 w-5 text-primary" />
              Selecionar Conta do Google Ads
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Selecione qual conta de anúncios do Google Ads você deseja vincular para gerenciar
              suas campanhas locais.
            </DialogDescription>
          </DialogHeader>

          {/* Campo de pesquisa */}
          <div className="relative my-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={googleAccountSearchQuery}
              onChange={(e) => setGoogleAccountSearchQuery(e.target.value)}
              placeholder="Buscar conta por nome ou ID..."
              className="w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="my-2 max-h-[300px] space-y-3 overflow-y-auto pr-1">
            {filteredGoogleAccounts.length === 0 ? (
              <div className="py-8 text-center text-xs italic text-slate-400">
                Nenhuma conta encontrada.
              </div>
            ) : (
              filteredGoogleAccounts.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => {
                    handleSelectGoogleAdsAccount(acc.id, acc.name, acc.managerCustomerId);
                    setGoogleAccountSearchQuery("");
                  }}
                  className="group flex w-full items-center justify-between rounded-xl border border-slate-200 p-4 text-left transition-all duration-200 hover:border-primary hover:bg-primary/5 active:scale-[0.98]"
                >
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-slate-800 transition-colors group-hover:text-primary">
                      {acc.name}
                    </span>
                    <span className="mt-0.5 block text-[10px] font-medium text-slate-400">
                      ID da Conta: {acc.id}
                    </span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* WIZARD DE CRIAÇÃO DE ANÚNCIO GOOGLE ADS EM 3 ETAPAS */}
      <Dialog
        open={isCreatingGoogleAd}
        onOpenChange={(open) => {
          setIsCreatingGoogleAd(open);
          if (open) setGoogleWizardStep(1);
        }}
      >
        <DialogContent className="flex max-h-[88vh] max-w-4xl flex-col p-6 font-sans overflow-hidden">
          <DialogHeader className="border-b border-slate-100 pb-3">
            <div className="flex items-center justify-between pr-6">
              <DialogTitle className="font-poppins flex items-center gap-2 text-lg font-bold text-slate-900">
                <svg className="h-5 w-5 fill-[#4285F4]" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                </svg>
                Criar Campanha no Google Ads
              </DialogTitle>
              <Badge className="bg-blue-50 text-[#4285F4] border-blue-200 text-[10px] font-bold">
                Pesquisa Local
              </Badge>
            </div>

            {/* STEPPER DE NAVEGAÇÃO DO WIZARD */}
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setGoogleWizardStep(1)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  googleWizardStep === 1
                    ? "bg-[#4285F4] text-white shadow-2xs"
                    : googleWizardStep > 1
                    ? "bg-blue-50 text-[#4285F4] hover:bg-blue-100"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[10px]">
                  1
                </span>
                Destino
              </button>

              <div className="h-0.5 w-4 bg-slate-200" />

              <button
                type="button"
                onClick={() => {
                  if (validateGoogleStep1()) setGoogleWizardStep(2);
                }}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  googleWizardStep === 2
                    ? "bg-[#4285F4] text-white shadow-2xs"
                    : googleWizardStep > 2
                    ? "bg-blue-50 text-[#4285F4] hover:bg-blue-100"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[10px]">
                  2
                </span>
                Anúncio
              </button>

              <div className="h-0.5 w-4 bg-slate-200" />

              <button
                type="button"
                onClick={() => {
                  if (validateGoogleStep1() && validateGoogleStep2()) setGoogleWizardStep(3);
                }}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  googleWizardStep === 3
                    ? "bg-[#4285F4] text-white shadow-2xs"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[10px]">
                  3
                </span>
                Orçamento & Busca
              </button>
            </div>
          </DialogHeader>

          {/* CORPO EM GRID: ETAPAS DO FORMULÁRIO (ESQ) + LIVE PREVIEW (DIR) */}
          <div className="flex-1 overflow-y-auto py-3 pr-1">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
              {/* COLUNA DO FORMULÁRIO (7 COLUNAS) */}
              <div className="space-y-4 lg:col-span-7 text-left">
                {/* ETAPA 1: OBJETIVO E DESTINO */}
                {googleWizardStep === 1 && (
                  <div className="space-y-4 animate-in fade-in-50 duration-200">
                    <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3.5 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <Lightbulb className="h-4 w-4 text-[#4285F4]" />
                        Etapa 1: Onde seus clientes vão chegar?
                      </div>
                      <p className="text-[11.5px] text-slate-500">
                        Quando um cliente pesquisar pelo seu negócio no Google e clicar no anúncio, ele será redirecionado para este endereço.
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-3.5 shadow-2xs">
                      {/* Nome da Campanha */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="g-campaign-name" className="text-xs font-bold text-slate-700">
                            Nome da Campanha *
                          </Label>
                          {businessProfile?.name && (
                            <button
                              type="button"
                              onClick={() =>
                                setGoogleAdName(`${businessProfile.name} - Pesquisa Local`)
                              }
                              className="text-[10px] font-semibold text-primary hover:underline"
                            >
                              ✨ Usar nome da empresa
                            </button>
                          )}
                        </div>
                        <Input
                          id="g-campaign-name"
                          placeholder="Ex: Promoção Almoço Executivo, Atendimento Dental..."
                          value={googleAdName}
                          onChange={(e) => setGoogleAdName(e.target.value)}
                          className="h-9 rounded-lg text-xs"
                        />
                        <p className="text-[10px] text-slate-400">
                          Nome apenas para sua identificação e controle no painel.
                        </p>
                      </div>

                      {/* Link de Destino */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="g-website-url" className="text-xs font-bold text-slate-700">
                            Link de Destino *
                          </Label>
                          {businessProfile?.website && (
                            <button
                              type="button"
                              onClick={() => setGoogleWebsiteUrl(businessProfile.website || "")}
                              className="text-[10px] font-semibold text-primary hover:underline"
                            >
                              Usar site cadastrado
                            </button>
                          )}
                        </div>
                        <Input
                          id="g-website-url"
                          placeholder="Ex: www.seusite.com.br ou link do seu WhatsApp"
                          value={googleWebsiteUrl}
                          onChange={(e) => setGoogleWebsiteUrl(e.target.value)}
                          className="h-9 rounded-lg text-xs"
                        />
                        <p className="text-[10px] text-slate-400">
                          Pode ser o site da sua empresa, página de agendamento ou link direto do WhatsApp.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ETAPA 2: TEXTOS E CRIATIVOS DO ANÚNCIO (TÍTULOS E DESCRIÇÕES) */}
                {googleWizardStep === 2 && (
                  <div className="space-y-4 animate-in fade-in-50 duration-200">
                    <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3.5 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <Sparkles className="h-4 w-4 text-[#4285F4]" />
                        Etapa 2: Textos do Anúncio (Pesquisa Responsiva)
                      </div>
                      <p className="text-[11.5px] text-slate-500">
                        O Google combina seus títulos e descrições para encontrar a melhor combinação para cada busca do usuário.
                      </p>
                    </div>

                    {/* TÍTULOS DO ANÚNCIO */}
                    <div className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-slate-800">
                            Títulos do Anúncio
                          </span>
                          <span className="block text-[10.5px] text-slate-400">
                            Mínimo 3 obrigatórios (Adicione até 15 para melhor performance)
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500">
                          {googleHeadlines.filter((h) => h.trim()).length}/15 adicionados
                        </span>
                      </div>

                      <div className="space-y-2">
                        {googleHeadlines.map((headline, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <Input
                                placeholder={`Título ${idx + 1} ${
                                  idx === 0
                                    ? `(Ex: ${businessProfile?.name || "Nome da Empresa"})`
                                    : idx === 1
                                    ? "(Ex: Atendimento de Excelência)"
                                    : idx === 2
                                    ? "(Ex: Peça Online com Desconto)"
                                    : "(Ex: Destaque ou Oferta)"
                                }`}
                                maxLength={30}
                                value={headline}
                                onChange={(e) => handleUpdateGoogleHeadline(idx, e.target.value)}
                                className="h-8.5 rounded-lg pr-12 text-xs"
                              />
                              <span className="absolute right-2.5 top-2.5 text-[9px] font-bold text-slate-400">
                                {headline.length}/30
                              </span>
                            </div>
                            {googleHeadlines.length > 3 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveGoogleHeadline(idx)}
                                className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                                title="Remover título"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {googleHeadlines.length < 15 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddGoogleHeadline}
                          className="h-8 w-full border-dashed border-slate-300 text-[11px] font-bold text-slate-600 hover:border-primary hover:text-primary"
                        >
                          <Plus className="mr-1.5 h-3.5 w-3.5" />
                          Adicionar mais um título ({googleHeadlines.length}/15)
                        </Button>
                      )}

                      {/* Sugestões de Títulos com 1 clique */}
                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                          💡 Ideias rápidas (Clique para preencher):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            businessProfile?.name ? `${businessProfile.name}` : null,
                            "Melhor Preço da Região",
                            "Atendimento Imediato",
                            "Peça pelo WhatsApp",
                            "Qualidade Garantida",
                            "Faça seu Orçamento Grátis",
                          ]
                            .filter(Boolean)
                            .map((idea, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => handleApplyHeadlineSuggestion(idea as string)}
                                className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600 transition-colors hover:border-[#4285F4] hover:bg-blue-50 hover:text-[#4285F4]"
                              >
                                + {idea}
                              </button>
                            ))}
                        </div>
                      </div>
                    </div>

                    {/* DESCRIÇÕES DO ANÚNCIO */}
                    <div className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-slate-800">
                            Descrições do Anúncio
                          </span>
                          <span className="block text-[10.5px] text-slate-400">
                            Mínimo 2 obrigatórias (Adicione até 4)
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500">
                          {googleDescriptions.filter((d) => d.trim()).length}/4 adicionadas
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {googleDescriptions.map((desc, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <div className="relative flex-1">
                              <Textarea
                                placeholder={`Descrição ${idx + 1} ${
                                  idx === 0
                                    ? "(Ex: Venha conhecer nossos produtos e serviços de alta qualidade no centro da cidade.)"
                                    : "(Ex: Aberto de segunda a sábado. Faça seu pedido ou tire dúvidas pelo WhatsApp.)"
                                }`}
                                maxLength={90}
                                rows={2}
                                value={desc}
                                onChange={(e) => handleUpdateGoogleDescription(idx, e.target.value)}
                                className="min-h-[50px] resize-none rounded-lg pr-12 text-xs"
                              />
                              <span className="absolute bottom-2 right-2.5 text-[9px] font-bold text-slate-400">
                                {desc.length}/90
                              </span>
                            </div>
                            {googleDescriptions.length > 2 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveGoogleDescription(idx)}
                                className="mt-1 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                                title="Remover descrição"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {googleDescriptions.length < 4 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddGoogleDescription}
                          className="h-8 w-full border-dashed border-slate-300 text-[11px] font-bold text-slate-600 hover:border-primary hover:text-primary"
                        >
                          <Plus className="mr-1.5 h-3.5 w-3.5" />
                          Adicionar mais uma descrição ({googleDescriptions.length}/4)
                        </Button>
                      )}

                      {/* Sugestões de Descrições com 1 clique */}
                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                          💡 Ideias de descrição (Clique para preencher):
                        </span>
                        <div className="flex flex-col gap-1.5">
                          {[
                            `Atendimento especializado e produtos de primeira linha. Fale conosco!`,
                            `Faça seu pedido hoje mesmo e aproveite nossas condições exclusivas.`,
                          ].map((idea, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleApplyDescriptionSuggestion(idea)}
                              className="text-left rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-[10.5px] font-medium text-slate-600 transition-colors hover:border-[#4285F4] hover:bg-blue-50 hover:text-[#4285F4]"
                            >
                              + {idea}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ETAPA 3: PALAVRAS-CHAVE E ORÇAMENTO */}
                {googleWizardStep === 3 && (
                  <div className="space-y-4 animate-in fade-in-50 duration-200">
                    <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3.5 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <Target className="h-4 w-4 text-[#4285F4]" />
                        Etapa 3: Quem vai ver seu anúncio e quanto investir?
                      </div>
                      <p className="text-[11.5px] text-slate-500">
                        Defina os termos de busca que ativarão o seu anúncio e o orçamento diário da sua campanha.
                      </p>
                    </div>

                    {/* PALAVRAS-CHAVE */}
                    <div className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-3 shadow-2xs">
                      <Label className="text-xs font-bold text-slate-800">
                        Palavras-chave de Busca *
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Ex: restaurante no centro, marmitex entrega (Enter para adicionar)"
                          value={newKeywordInput}
                          onChange={(e) => setNewKeywordInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const val = newKeywordInput.trim();
                              if (val && !googleKeywords.includes(val)) {
                                setGoogleKeywords([...googleKeywords, val]);
                                setNewKeywordInput("");
                              }
                            }
                          }}
                          className="h-9 rounded-lg text-xs flex-1"
                        />
                        <Button
                          type="button"
                          onClick={() => {
                            const val = newKeywordInput.trim();
                            if (val && !googleKeywords.includes(val)) {
                              setGoogleKeywords([...googleKeywords, val]);
                              setNewKeywordInput("");
                            }
                          }}
                          className="h-9 rounded-lg px-4 bg-primary text-xs font-bold text-white hover:bg-primary/95"
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Adicionar
                        </Button>
                      </div>

                      {/* Sugestões de Palavras-chave com 1 clique */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          💡 Sugestões baseadas no seu perfil (Clique para adicionar):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            businessProfile?.category
                              ? `${businessProfile.category.toLowerCase()} perto de mim`
                              : "serviço perto de mim",
                            businessProfile?.name
                              ? `${businessProfile.name.toLowerCase()}`
                              : "comércio local",
                            "melhor atendimento da região",
                            "pedir online",
                            "atendimento rápido",
                            "comprar com desconto",
                          ].map((kw, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleAddKeywordSuggestion(kw)}
                              disabled={googleKeywords.includes(kw)}
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                                googleKeywords.includes(kw)
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                                  : "border-slate-200 bg-slate-50 text-slate-600 hover:border-[#4285F4] hover:bg-blue-50 hover:text-[#4285F4]"
                              }`}
                            >
                              {googleKeywords.includes(kw) ? "✓ " : "+ "}
                              {kw}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Lista de tags de palavras-chave adicionadas */}
                      {googleKeywords.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2 max-h-[80px] overflow-y-auto p-2 bg-slate-50 border border-slate-200/60 rounded-lg">
                          {googleKeywords.map((kw, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs"
                            >
                              #{kw}
                              <button
                                type="button"
                                onClick={() =>
                                  setGoogleKeywords(googleKeywords.filter((_, i) => i !== idx))
                                }
                                className="text-slate-400 hover:text-red-500 font-bold ml-0.5 text-xs transition-colors"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* ORÇAMENTO E DURAÇÃO */}
                    <div className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-3 shadow-2xs">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-slate-700">
                            Orçamento Diário (R$) *
                          </Label>
                          <Input
                            type="number"
                            min={5}
                            value={googleDailyBudget}
                            onChange={(e) => setGoogleDailyBudget(Number(e.target.value))}
                            className="h-9 rounded-lg text-xs"
                          />
                          <p className="text-[10px] text-slate-400">
                            Cobrado apenas quando clicarem no anúncio.
                          </p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-slate-700">
                            Duração (Dias) *
                          </Label>
                          <Input
                            type="number"
                            min={1}
                            value={googleDurationDays}
                            onChange={(e) => setGoogleDurationDays(Number(e.target.value))}
                            className="h-9 rounded-lg text-xs"
                          />
                          <p className="text-[10px] text-slate-400">
                            Pode pausar a campanha quando quiser.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* COLUNA DIREITA: PRÉVIA AO VIVO NO GOOGLE SEARCH (5 COLUNAS) */}
              <div className="hidden lg:flex lg:col-span-5 flex-col gap-3 text-left sticky top-0">
                <div className="rounded-xl border border-slate-200/90 bg-slate-50/80 p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-[#4285F4]" />
                      Prévia do Google Search
                    </span>
                    <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                      Ao Vivo
                    </span>
                  </div>

                  {/* CARD DE RESULTADO REALISTA DO GOOGLE */}
                  <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <Globe className="h-3 w-3 text-slate-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="block truncate text-[11px] font-bold text-slate-800 leading-tight">
                          {businessProfile?.name || "Meu Negócio"}
                        </span>
                        <span className="block truncate text-[9.5px] text-slate-400 leading-none">
                          {googleWebsiteUrl
                            ? googleWebsiteUrl.replace(/^https?:\/\//, "")
                            : "www.seusite.com.br"}
                        </span>
                      </div>
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                        Patrocinado
                      </span>
                    </div>

                    <a
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className="block text-[13px] font-semibold text-[#1a0dab] leading-snug line-clamp-2 hover:underline"
                    >
                      {googleHeadlines.filter((h) => h.trim()).slice(0, 3).join(" | ") ||
                        "Título 1 | Título 2 | Título 3"}
                    </a>

                    <p className="text-[11px] text-[#4d5156] leading-relaxed line-clamp-3">
                      {googleDescriptions.filter((d) => d.trim()).join(" ") ||
                        "As descrições do seu anúncio aparecerão aqui exatamente como os clientes verão nos resultados de busca do Google."}
                    </p>

                    {googleKeywords.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                        {googleKeywords.slice(0, 4).map((kw, i) => (
                          <span
                            key={i}
                            className="text-[9px] bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded border border-slate-150"
                          >
                            #{kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Resumo do Investimento */}
                  <div className="rounded-lg border border-sky-100 bg-sky-50/60 p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-600">Total Estimado:</span>
                      <span className="font-extrabold text-[#0083C7] text-sm">
                        R$ {(Number(googleDailyBudget || 0) * Number(googleDurationDays || 1)).toFixed(2)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      R$ {Number(googleDailyBudget || 0).toFixed(2)}/dia durante {googleDurationDays || 1} dias
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-slate-100 pt-3 flex flex-row items-center justify-between">
            <div className="text-left">
              <span className="text-[11px] text-slate-400">
                Etapa {googleWizardStep} de 3 •{" "}
              </span>
              <span className="text-xs font-bold text-slate-900">
                Total: R${" "}
                {(Number(googleDailyBudget || 0) * Number(googleDurationDays || 1)).toFixed(2)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {googleWizardStep === 1 ? (
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsCreatingGoogleAd(false)}
                  className="h-9 rounded-lg border-slate-200 px-4 text-xs font-bold"
                >
                  Cancelar
                </Button>
              ) : (
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setGoogleWizardStep((prev) => (prev > 1 ? ((prev - 1) as any) : 1))}
                  className="h-9 rounded-lg border-slate-200 px-3 text-xs font-bold"
                >
                  <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                  Voltar
                </Button>
              )}

              {googleWizardStep === 1 && (
                <Button
                  type="button"
                  onClick={() => {
                    if (validateGoogleStep1()) setGoogleWizardStep(2);
                  }}
                  className="h-9 rounded-lg bg-primary px-5 text-xs font-bold text-white shadow-xs"
                >
                  Continuar para Anúncio
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              )}

              {googleWizardStep === 2 && (
                <Button
                  type="button"
                  onClick={() => {
                    if (validateGoogleStep2()) setGoogleWizardStep(3);
                  }}
                  className="h-9 rounded-lg bg-primary px-5 text-xs font-bold text-white shadow-xs"
                >
                  Continuar para Orçamento
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              )}

              {googleWizardStep === 3 && (
                <Button
                  type="button"
                  onClick={handlePublishGoogleCampaign}
                  disabled={isSubmittingGoogle}
                  className="h-9 rounded-lg bg-primary px-5 text-xs font-bold text-white shadow-xs"
                >
                  {isSubmittingGoogle ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Publicando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                      Publicar Campanha
                    </>
                  )}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
