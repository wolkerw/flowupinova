"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { getOnboardingProfile, updateOnboardingProfile, OnboardingProfileData } from "@/lib/services/onboarding-service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Palette,
  Sparkles,
  Download,
  CheckCircle2,
  RefreshCw,
  Layers,
  FileText,
  CreditCard,
  Mail,
  Store,
  Eye,
  Check,
  Copy,
  Upload,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { BusinessCardStudio } from "@/components/dashboard/stationery/BusinessCardStudio";
import { EmailSignatureStudio } from "@/components/dashboard/stationery/EmailSignatureStudio";
import { LetterheadStudio } from "@/components/dashboard/stationery/LetterheadStudio";
import { PdvStudio } from "@/components/dashboard/stationery/PdvStudio";
import { generateTransparentLogoBlob } from "@/lib/services/logo-transparency";

export interface GeneratedLogoOption {
  id: string;
  url: string;
  label: string;
  style: string;
  iteration: number;
  modelUsed?: string;
  createdAt: string;
}

export interface AvailableBrandLogo {
  id: string;
  label: string;
  url: string;
  type: string;
  badge?: string;
}

export default function BrandStudioPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileData, setProfileData] = useState<OnboardingProfileData | null>(null);
  const [selectedLogoId, setSelectedLogoId] = useState<string>("");

  // Extrair todas as logomarcas cadastradas no Cérebro do Negócio
  const availableLogos = React.useMemo<AvailableBrandLogo[]>(() => {
    if (!profileData) return [];
    const list: AvailableBrandLogo[] = [];
    const seenUrls = new Set<string>();

    const addLogo = (id: string, label: string, url?: string, type = "padrao", badge?: string) => {
      if (!url || typeof url !== "string" || !url.trim() || seenUrls.has(url)) return;
      seenUrls.add(url);
      list.push({ id, label, url, type, badge });
    };

    const logos = profileData.logos;
    // 1. Horizontal (principal recomendada)
    addLogo("horizontal", "Horizontal", logos?.horizontal?.url, "horizontal", "Principal");
    // 2. Vertical
    addLogo("vertical", "Vertical", logos?.vertical?.url, "vertical");
    // 3. Símbolo / Ícone
    addLogo("symbol", "Símbolo / Ícone", logos?.symbol?.url, "symbol");
    // 4. Avatar 1:1
    addLogo("avatar", "Avatar / Perfil", logos?.avatar?.url, "avatar");
    // 5. Versão Clara / Fundo Escuro
    addLogo("light", "Versão Clara", logos?.light?.url, "light", "Fundo Escuro");
    // 6. Versão Escura / Fundo Claro
    addLogo("dark", "Versão Escura", logos?.dark?.url, "dark", "Fundo Claro");
    // 7. Secundária
    addLogo("secondary", "Secundária", logos?.secondary?.url, "secondary");
    // 8. Variações Extras
    if (Array.isArray(logos?.extraLogos)) {
      logos.extraLogos.forEach((extra, idx) => {
        addLogo(extra.id || `extra-${idx}`, extra.name || `Variação ${idx + 1}`, extra.url, "extra");
      });
    }
    // 9. Legado profileData.logo.url (se ainda não adicionada)
    if (profileData.logo?.url) {
      addLogo("legacy-logo", "Logo Padrão", profileData.logo.url, "legacy");
    }

    return list;
  }, [profileData]);

  // Estados do Logo Studio (Fase 1)
  const [mode, setMode] = useState<"create" | "redesign">("create");
  const [brandName, setBrandName] = useState("");
  const [niche, setNiche] = useState("");
  const [slogan, setSlogan] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#0083C7");
  const [secondaryColor, setSecondaryColor] = useState("#FA6305");
  const [selectedStyle, setSelectedStyle] = useState<"minimalist" | "emblem" | "typography" | "abstract" | "organic">("minimalist");
  const [iconIdea, setIconIdea] = useState("");
  const [existingLogoFile, setExistingLogoFile] = useState<string | null>(null);

  // Estados de Geração e Histórico de Opções
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLogoUrl, setGeneratedLogoUrl] = useState<string | null>(null);
  const [generatedOptions, setGeneratedOptions] = useState<GeneratedLogoOption[]>([]);
  const [activeOptionId, setActiveOptionId] = useState<string | null>(null);
  const [activeModelUsed, setActiveModelUsed] = useState<string>("gpt-image-2.5");
  const [variationsList, setVariationsList] = useState<any[]>([]);
  const [activeBackground, setActiveBackground] = useState<"white" | "dark" | "brand" | "transparent">("white");
  const [isSavingToBrain, setIsSavingToBrain] = useState(false);
  const [isProcessingTransparent, setIsProcessingTransparent] = useState(false);

  // Sub-aba ativa na Fase 2 (Papelaria & Digital)
  const [mainTab, setMainTab] = useState("logo-studio");
  const [stationerySubTab, setStationerySubTab] = useState<"cartao" | "assinatura" | "timbrado">("cartao");

  // Carregar dados existentes do Cérebro do Negócio
  useEffect(() => {
    async function loadData() {
      if (!user?.uid) return;
      try {
        setLoadingProfile(true);
        const data = await getOnboardingProfile(user.uid);
        if (data) {
          setProfileData(data);
          setBrandName(data.name || "");
          setNiche(data.category || "");
          setSlogan(data.slogan || "");
          if (data.primaryColor) setPrimaryColor(data.primaryColor);
          if (data.secondaryColor) setSecondaryColor(data.secondaryColor);
          const defaultUrl =
            data.logos?.horizontal?.url ||
            data.logo?.url ||
            data.logos?.vertical?.url ||
            data.logos?.symbol?.url;
          if (defaultUrl) {
            setExistingLogoFile(defaultUrl);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar dados do Cérebro do Negócio:", err);
      } finally {
        setLoadingProfile(false);
      }
    }
    loadData();
  }, [user]);

  // Logo selecionada ativa no Estúdio
  const selectedLogoObj = availableLogos.find((l) => l.id === selectedLogoId);
  const effectiveLogoUrl =
    selectedLogoObj?.url ||
    availableLogos[0]?.url ||
    generatedLogoUrl ||
    profileData?.logo?.url ||
    undefined;
  const effectiveLightLogoUrl =
    profileData?.logos?.light?.url ||
    (selectedLogoObj?.type === "light" ? selectedLogoObj.url : undefined);

  // Upload manual de logotipo para modernização
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Formato Inválido",
        description: "Por favor, selecione uma imagem válida (PNG, JPG, WebP ou SVG).",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Arquivo Muito Grande",
        description: "O tamanho máximo do arquivo de logotipo é 10 MB.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setExistingLogoFile(base64);
        toast({
          title: "Logotipo Inserido com Sucesso! 🎯",
          description: "Sua logomarca foi carregada e será usada como base para a remodelação com IA.",
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Handler de Geração do Logo com IA GPT-2.5 (suporta nova opção se não gostar)
  const handleGenerateLogo = async (forceNewOption = false) => {
    if (!brandName.trim() || !niche.trim()) {
      toast({
        title: "Campos Obrigatórios",
        description: "Por favor, preencha o nome da sua marca e o nicho de mercado.",
        variant: "destructive",
      });
      return;
    }

    const nextIteration = generatedOptions.length + 1;

    setIsGenerating(true);
    try {
      const response = await fetch("/api/brand-studio/logo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: brandName.trim(),
          niche: niche.trim(),
          slogan: slogan.trim(),
          style: selectedStyle,
          primaryColor,
          secondaryColor,
          iconIdea: iconIdea.trim(),
          mode,
          existingLogoBase64: existingLogoFile,
          iteration: nextIteration,
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Falha ao gerar o logotipo.");
      }

      const modelName = resData.modelUsed || "gpt-image-2.5";
      setActiveModelUsed(modelName);

      const newOption: GeneratedLogoOption = {
        id: `opt-${Date.now()}-${nextIteration}`,
        url: resData.imageUrl,
        label: `Opção ${nextIteration}`,
        style: selectedStyle,
        iteration: nextIteration,
        modelUsed: modelName,
        createdAt: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      };

      setGeneratedOptions((prev) => [...prev, newOption]);
      setActiveOptionId(newOption.id);
      setGeneratedLogoUrl(resData.imageUrl);
      setVariationsList(resData.variations || []);

      if (generatedOptions.length === 0) {
        toast({
          title: "Conceito de Marca Criado com Sucesso! 🎨",
          description: "Explore o mockup em diferentes fundos e salve diretamente no seu Cérebro do Negócio.",
        });
      } else {
        toast({
          title: `Nova Opção Criada (#${nextIteration})! 🎲`,
          description: "Você pode alternar livremente entre as opções geradas e escolher a sua favorita.",
        });
      }
    } catch (err: any) {
      toast({
        title: "Erro na Geração",
        description: err.message || "Não foi possível gerar a logo neste momento.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Selecionar uma opção do histórico
  const handleSelectOption = (option: GeneratedLogoOption) => {
    setActiveOptionId(option.id);
    setGeneratedLogoUrl(option.url);
    if (option.modelUsed) setActiveModelUsed(option.modelUsed);
  };

  // Descartar uma opção que não gostou
  const handleRemoveOption = (optionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setGeneratedOptions((prev) => {
      const updated = prev.filter((o) => o.id !== optionId);
      if (activeOptionId === optionId) {
        const nextActive = updated[updated.length - 1];
        if (nextActive) {
          setActiveOptionId(nextActive.id);
          setGeneratedLogoUrl(nextActive.url);
          if (nextActive.modelUsed) setActiveModelUsed(nextActive.modelUsed);
        } else {
          setActiveOptionId(null);
          setGeneratedLogoUrl(null);
        }
      }
      return updated;
    });
    toast({
      title: "Opção Descartada",
      description: "A versão foi removida da sua lista de alternativas.",
    });
  };

  // Salvar o Logo Gerado como Oficial no Cérebro do Negócio
  const handleSaveToBrain = async () => {
    if (!user?.uid || !generatedLogoUrl) return;

    setIsSavingToBrain(true);
    try {
      const current = profileData || {
        name: brandName,
        category: niche,
        slogan,
        primaryColor,
        secondaryColor,
      };

      const updated = {
        ...current,
        logo: {
          url: generatedLogoUrl,
          width: 500,
          height: 500,
        },
        logos: {
          ...((current as any).logos || {}),
          symbol: { url: generatedLogoUrl, width: 500, height: 500 },
          avatar: { url: generatedLogoUrl, width: 500, height: 500 },
          light: { url: generatedLogoUrl, width: 500, height: 500 },
        },
        primaryColor,
        secondaryColor,
      };

      await updateOnboardingProfile(user.uid, updated as any);
      setProfileData(updated as any);

      toast({
        title: "Logotipo Homologado com Sucesso! 🚀",
        description: "Seu novo logo e cores foram integrados ao Cérebro do Negócio e serão usados em todos os posts!",
      });
    } catch (err: any) {
      toast({
        title: "Erro ao Salvar",
        description: err.message || "Falha ao salvar no Cérebro do Negócio.",
        variant: "destructive",
      });
    } finally {
      setIsSavingToBrain(false);
    }
  };

  // Download do Logo (Original ou com Fundo Transparente)
  const handleDownloadLogo = async (transparent: boolean = false) => {
    if (!generatedLogoUrl) return;

    const baseSlug = (brandName || "marca").toLowerCase().replace(/\s+/g, "-");

    if (!transparent) {
      const link = document.createElement("a");
      link.href = generatedLogoUrl;
      link.download = `logotipo-${baseSlug}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Download Iniciado",
        description: "O arquivo em alta resolução foi baixado com sucesso.",
      });
      return;
    }

    try {
      setIsProcessingTransparent(true);
      toast({
        title: "Gerando PNG Transparente...",
        description: "Isolando a marca e aplicando canal alfa com preservação das cores.",
      });

      const transparentBlob = await generateTransparentLogoBlob(generatedLogoUrl);
      const url = URL.createObjectURL(transparentBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `logotipo-${baseSlug}-transparente.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 10000);

      toast({
        variant: "success",
        title: "PNG Transparente Baixado! 🎯",
        description: "Seu arquivo com fundo transparente foi salvo com sucesso.",
      });
    } catch (err: any) {
      console.error("Erro ao gerar PNG transparente:", err);
      toast({
        variant: "destructive",
        title: "Falha na Transparência",
        description: err.message || "Não foi possível gerar a transparência automaticamente. Baixando arquivo original.",
      });
      const link = document.createElement("a");
      link.href = generatedLogoUrl;
      link.download = `logotipo-${baseSlug}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsProcessingTransparent(false);
    }
  };

  // Copiar Paleta HEX
  const handleCopyPalette = () => {
    const text = `Paleta Oficial ${brandName}:\nPrimária: ${primaryColor}\nSecundária: ${secondaryColor}`;
    navigator.clipboard.writeText(text);
    toast({
      title: "Paleta Copiada!",
      description: "Códigos HEX copiados para a área de transferência.",
    });
  };

  return (
    <div className="space-y-8 p-4 sm:p-8 max-w-7xl mx-auto">
      {/* Cabeçalho da Mini Agência */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-[#0083C7] text-white hover:bg-[#0083C7]/90 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
              Mini Agência NumVapt
            </Badge>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Identidade Visual & Papelaria
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Estúdio de Marca & Papelaria
          </h1>
          <p className="text-slate-600 text-sm mt-1 max-w-2xl leading-relaxed">
            Crie e modernize a identidade visual completa do seu negócio: da criação do logotipo
            vetorial com IA até cartões de visita digitais, assinaturas de e-mail e materiais de credibilidade.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyPalette}
            className="text-xs font-semibold text-slate-700 border-slate-300"
          >
            <Copy className="mr-1.5 h-3.5 w-3.5" />
            Copiar Paleta de Cores
          </Button>
        </div>
      </div>

      {/* SELETOR DE MODELOS DE LOGOMARCA (QUANDO HOUVER MÚLTIPLOS MODELOS NO CÉREBRO DO NEGÓCIO) */}
      {availableLogos.length > 1 && (
        <Card className="border border-blue-200 bg-gradient-to-r from-blue-50/60 via-white to-slate-50 p-4 rounded-2xl shadow-2xs print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-[#0083C7]/10 flex items-center justify-center text-[#0083C7] shrink-0">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  Modelos de Logomarca do Negócio
                  <Badge variant="secondary" className="text-[10px] font-bold bg-blue-100 text-[#0083C7]">
                    {availableLogos.length} disponíveis
                  </Badge>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Selecione o modelo que deseja aplicar nas peças de papelaria, PDV ou usar como base no Logo Studio:
                </p>
              </div>
            </div>

            <a
              href="/dashboard/configuracoes"
              className="text-[11px] font-bold text-[#0083C7] hover:underline flex items-center gap-1 self-start sm:self-auto shrink-0"
            >
              Gerenciar no Cérebro do Negócio
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {availableLogos.map((item) => {
              const isSelected = (selectedLogoId || availableLogos[0]?.id) === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedLogoId(item.id);
                    setExistingLogoFile(item.url);
                    toast({
                      title: `Logotipo Selecionado: ${item.label}`,
                      description: "Todas as peças de papelaria, PDV e estúdio foram atualizadas com este modelo.",
                    });
                  }}
                  className={`group relative p-2.5 rounded-xl border text-left transition-all flex flex-col items-center justify-between gap-2 ${
                    isSelected
                      ? "border-[#0083C7] bg-white ring-2 ring-[#0083C7]/20 shadow-xs"
                      : "border-slate-200 bg-white/70 hover:bg-white hover:border-slate-300"
                  }`}
                >
                  {/* Miniatura do Logo */}
                  <div className="w-full h-12 rounded-lg bg-slate-50 border border-slate-100 p-1 flex items-center justify-center overflow-hidden">
                    <img src={item.url} alt={item.label} className="max-h-full max-w-full object-contain" />
                  </div>

                  <div className="w-full flex items-center justify-between gap-1">
                    <span className="text-[11px] font-bold text-slate-800 truncate">
                      {item.label}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#0083C7] shrink-0" />
                    )}
                  </div>

                  {item.badge && (
                    <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 rounded-full text-[8px] font-black bg-blue-600 text-white shadow-2xs">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {/* Abas Principais do Módulo */}
      <Tabs value={mainTab} onValueChange={setMainTab} className="space-y-6">
        <TabsList className="grid grid-cols-1 sm:grid-cols-3 w-full max-w-2xl bg-slate-100 p-1 rounded-xl print:hidden">
          <TabsTrigger
            value="logo-studio"
            className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 py-2.5"
          >
            <Palette className="h-4 w-4 text-[#0083C7]" />
            1. Logo Studio
            <Badge className="bg-emerald-500 text-white text-[9px] px-1.5 py-0 uppercase">Fase 1</Badge>
          </TabsTrigger>

          <TabsTrigger
            value="papelaria"
            className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 py-2.5"
          >
            <CreditCard className="h-4 w-4 text-[#FA6305]" />
            2. Papelaria & Digital
            <Badge className="bg-emerald-500 text-white text-[9px] px-1.5 py-0 uppercase">Fase 2</Badge>
          </TabsTrigger>

          <TabsTrigger
            value="pdv"
            className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 py-2.5"
          >
            <Store className="h-4 w-4 text-purple-600" />
            3. PDV & Credibilidade
            <Badge variant="outline" className="border-slate-300 text-slate-500 text-[9px] px-1.5 py-0">Fase 3</Badge>
          </TabsTrigger>
        </TabsList>

        {/* ========================================================================= */}
        {/* ABA 1: LOGO STUDIO (FASE 1) */}
        {/* ========================================================================= */}
        <TabsContent value="logo-studio" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Painel de Configuração e Criação (Esquerda: 5 colunas) */}
            <Card className="lg:col-span-5 border border-slate-200 shadow-sm bg-white rounded-2xl">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#0083C7]" />
                      Gerador de Logomarca com IA
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 mt-0.5">
                      Crie um novo símbolo ou modernize a identidade existente.
                    </CardDescription>
                  </div>
                </div>

                {/* Alternador de Modo: Criar vs Remodelar */}
                <div className="flex rounded-lg bg-slate-200/70 p-1 mt-3">
                  <button
                    type="button"
                    onClick={() => setMode("create")}
                    className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-all ${
                      mode === "create" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    🪄 Criar do Zero
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("redesign")}
                    className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-all ${
                      mode === "redesign" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    🔄 Modernizar / Remodelar
                  </button>
                </div>
              </CardHeader>

              <CardContent className="p-5 space-y-4">
                {/* Nome da Marca */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Nome da Empresa / Marca *</Label>
                  <Input
                    placeholder="Ex: NumVapt Marketing"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>

                {/* Nicho de Atuação */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Nicho de Mercado / Categoria *</Label>
                  <Input
                    placeholder="Ex: Clínica Odontológica, Advocacia, Restaurante"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>

                {/* Slogan ou Subtítulo */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Slogan ou Tagline (Opcional)</Label>
                  <Input
                    placeholder="Ex: Excelência em cada detalhe"
                    value={slogan}
                    onChange={(e) => setSlogan(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>

                {/* Seletor de Cores da Marca */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Cor Primária</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="h-9 w-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                      />
                      <Input
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="h-9 text-xs font-mono uppercase"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Cor Secundária</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="h-9 w-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                      />
                      <Input
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="h-9 text-xs font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>

                {/* Seleção de Estilo Visual */}
                <div className="space-y-1.5 pt-1">
                  <Label className="text-xs font-bold text-slate-700">Estilo Visual do Design</Label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { id: "minimalist", label: "Minimalista & Vetorial", desc: "Geométrico, limpo e atemporal" },
                      { id: "emblem", label: "Emblema / Selo", desc: "Clássico, autoridade e tradição" },
                      { id: "typography", label: "Monograma / Tipográfico", desc: "Iniciais elegantes e modernas" },
                      { id: "abstract", label: "Abstrato & Tech", desc: "Formas fluidas e tecnológicas" },
                      { id: "organic", label: "Orgânico & Acolhedor", desc: "Curvas suaves e naturais" },
                    ].map((style) => (
                      <div
                        key={style.id}
                        onClick={() => setSelectedStyle(style.id as any)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                          selectedStyle === style.id
                            ? "border-[#0083C7] bg-[#0083C7]/5 text-slate-900 font-bold"
                            : "border-slate-200 hover:border-slate-300 text-slate-600"
                        }`}
                      >
                        <p className="font-semibold leading-tight">{style.label}</p>
                        <p className="text-[10px] text-slate-500 font-normal mt-0.5 leading-tight">{style.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ideia de Ícone ou Upload Funcional se for Redesign */}
                {mode === "create" ? (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">
                      Ideia do Símbolo / Ícone Desejado (Opcional)
                    </Label>
                    <Textarea
                      placeholder="Ex: Uma folha com traços geométricos, escudo sutil com iniciais, raio de luz moderno..."
                      value={iconIdea}
                      onChange={(e) => setIconIdea(e.target.value)}
                      rows={2}
                      className="text-xs resize-none"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-slate-700">
                        Logotipo Atual (Para Modernização / Vetorização)
                      </Label>
                      {existingLogoFile && (
                        <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Imagem Pronta
                        </span>
                      )}
                    </div>

                    {/* Input de arquivo invisível ativado pelos botões e clique no card */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                      className="hidden"
                    />

                    {existingLogoFile ? (
                      <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/80">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-12 w-12 rounded-lg border border-slate-200 bg-white p-1 flex items-center justify-center shrink-0 shadow-2xs">
                            <img
                              src={existingLogoFile}
                              alt="Logotipo para Modernização"
                              className="max-h-full max-w-full object-contain rounded"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">Logotipo Carregado</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              A IA usará este símbolo como base para modernizar traços e resolução.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            className="h-8 text-xs font-semibold text-slate-700 hover:bg-slate-100 px-2.5"
                          >
                            <Upload className="h-3.5 w-3.5 mr-1" />
                            Trocar
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setExistingLogoFile(null)}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600"
                            title="Remover logotipo"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 hover:border-[#0083C7] rounded-xl p-5 text-center bg-slate-50/60 hover:bg-[#0083C7]/5 transition-all cursor-pointer group"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 shadow-2xs mx-auto mb-2 text-slate-500 group-hover:text-[#0083C7] group-hover:scale-105 transition-all">
                          <Upload className="h-5 w-5" />
                        </div>
                        <p className="text-xs font-bold text-slate-800 group-hover:text-[#0083C7]">
                          Clique para enviar a imagem da sua logo antiga
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Suporta PNG, JPG, WebP ou SVG (mesmo em baixa resolução)
                        </p>
                        {profileData?.logo?.url && (
                          <div className="mt-3 pt-2 border-t border-slate-200/80">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExistingLogoFile(profileData.logo.url);
                                toast({
                                  title: "Logo Restaurado",
                                  description: "Logotipo salvo no Cérebro do Negócio foi carregado.",
                                });
                              }}
                              className="text-[11px] font-bold text-[#0083C7] hover:underline flex items-center justify-center gap-1 mx-auto"
                            >
                              <RefreshCw className="h-3 w-3" /> Usar a logo salva no Cérebro do Negócio
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Botão de Geração */}
                <Button
                  type="button"
                  onClick={() => handleGenerateLogo(false)}
                  disabled={isGenerating}
                  className="w-full bg-[#0083C7] hover:bg-[#0083C7]/90 text-white font-bold h-11 text-sm rounded-xl shadow-xs"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Criando Identidade com IA...
                    </>
                  ) : generatedOptions.length > 0 ? (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Gerar Outra Opção ({generatedOptions.length + 1}ª Variação)
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      {mode === "create" ? "Gerar Nova Logomarca" : "Modernizar e Vetorizar Logomarca"}
                    </>
                  )}
                </Button>

                {generatedOptions.length > 0 && (
                  <p className="text-[11px] text-slate-500 text-center">
                    💡 Você tem {generatedOptions.length} {generatedOptions.length === 1 ? "opção gerada" : "opções geradas"} para comparar no painel ao lado.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Painel de Visualização & Brand Kit Mockups (Direita: 7 colunas) */}
            <div className="lg:col-span-7 space-y-6">
              <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Eye className="h-4 w-4 text-[#0083C7]" />
                      Visualizador de Marca & Mockup de Aplicações
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 mt-0.5">
                      Teste seu logo em diferentes contrastes e confira a simulação em tempo real.
                    </CardDescription>
                  </div>

                  {/* Seletor de Contraste / Fundo */}
                  <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-lg self-start sm:self-auto">
                    {[
                      { id: "white", label: "Claro", bg: "bg-white" },
                      { id: "dark", label: "Escuro", bg: "bg-slate-950" },
                      { id: "brand", label: "Azul Marca", bg: "bg-[#0083C7]" },
                      { id: "transparent", label: "Grid", bg: "bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:8px_8px]" },
                    ].map((bgItem) => (
                      <button
                        key={bgItem.id}
                        type="button"
                        onClick={() => setActiveBackground(bgItem.id as any)}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                          activeBackground === bgItem.id
                            ? "bg-white text-slate-900 shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {bgItem.label}
                      </button>
                    ))}
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  {/* Carrossel / Seletor de Opções Geradas para Comparação */}
                  {generatedOptions.length > 0 && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5 text-[#0083C7]" />
                          Opções Criadas para Comparar ({generatedOptions.length})
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Clique para alternar o mockup
                        </span>
                      </div>

                      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
                        {generatedOptions.map((opt) => {
                          const isActive = activeOptionId === opt.id;
                          return (
                            <div
                              key={opt.id}
                              onClick={() => handleSelectOption(opt)}
                              className={`group relative flex items-center gap-2.5 px-3 py-2 rounded-xl border cursor-pointer transition-all shrink-0 ${
                                isActive
                                  ? "bg-white border-[#0083C7] shadow-sm ring-2 ring-[#0083C7]/20"
                                  : "bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white"
                              }`}
                            >
                              <div className="h-7 w-7 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center p-0.5 shrink-0">
                                <img src={opt.url} alt={opt.label} className="h-full w-full object-contain" />
                              </div>
                              <div className="text-left">
                                <p className={`text-xs font-bold ${isActive ? "text-[#0083C7]" : "text-slate-800"}`}>
                                  {opt.label}
                                </p>
                                <p className="text-[10px] text-slate-500 capitalize">{opt.style}</p>
                              </div>

                              {isActive && (
                                <Badge className="bg-[#0083C7] text-white text-[9px] px-1.5 py-0 h-4">
                                  Ativa
                                </Badge>
                              )}

                              {generatedOptions.length > 1 && (
                                <button
                                  type="button"
                                  onClick={(e) => handleRemoveOption(opt.id, e)}
                                  title="Descartar esta opção"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 p-1 text-slate-400 hover:text-rose-600 rounded"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          );
                        })}

                        <button
                          type="button"
                          onClick={() => handleGenerateLogo(true)}
                          disabled={isGenerating}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-slate-300 text-slate-600 hover:text-[#0083C7] hover:border-[#0083C7] hover:bg-[#0083C7]/5 text-xs font-bold transition-all shrink-0"
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${isGenerating ? "animate-spin text-[#0083C7]" : ""}`} />
                          <span>+ Gerar Outra Opção</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Área Central de Exibição do Logo Ativo */}
                  <div
                    className={`rounded-2xl border border-slate-200 min-h-[300px] sm:min-h-[360px] flex items-center justify-center p-8 transition-all ${
                      activeBackground === "white"
                        ? "bg-white"
                        : activeBackground === "dark"
                        ? "bg-slate-950"
                        : activeBackground === "brand"
                        ? "bg-[#0083C7]"
                        : "bg-slate-100 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:12px_12px]"
                    }`}
                  >
                    {generatedLogoUrl ? (
                      <div className="flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
                        <img
                          src={generatedLogoUrl}
                          alt="Logotipo Criado"
                          className="max-h-56 max-w-full object-contain drop-shadow-md rounded-xl"
                        />
                        <div className="mt-4">
                          <p
                            className={`text-base font-extrabold tracking-wider ${
                              activeBackground === "dark" || activeBackground === "brand"
                                ? "text-white"
                                : "text-slate-900"
                            }`}
                          >
                            {brandName.toUpperCase()}
                          </p>
                          {slogan?.trim() ? (
                            <p
                              className={`text-xs font-medium tracking-widest uppercase mt-0.5 ${
                                activeBackground === "dark" || activeBackground === "brand"
                                  ? "text-slate-200"
                                  : "text-slate-500"
                              }`}
                            >
                              {slogan.trim()}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center space-y-3 max-w-xs">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-[#0083C7] mx-auto border border-indigo-100">
                          <Palette className="h-7 w-7" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-800">
                          Seu Novo Logo Aparecerá Aqui
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Preencha as informações da marca ao lado e clique em &ldquo;Gerar Nova Logomarca&rdquo; para visualizar o conceito em alta resolução.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Barra de Ações Rápidas quando o Logo está gerado */}
                  {generatedLogoUrl && (
                    <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-slate-100">
                      <Button
                        type="button"
                        onClick={handleSaveToBrain}
                        disabled={isSavingToBrain}
                        className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 text-xs rounded-xl shadow-xs"
                      >
                        {isSavingToBrain ? (
                          <>
                            <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />
                            Salvando no Cérebro do Negócio...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Definir Opção Ativa como Logo Oficial no Cérebro
                          </>
                        )}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleGenerateLogo(true)}
                        disabled={isGenerating}
                        className="w-full sm:w-auto text-xs font-bold text-amber-700 border-amber-300 hover:bg-amber-50 h-10 rounded-xl"
                      >
                        <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isGenerating ? "animate-spin" : ""}`} />
                        Não gostei, gerar outra opção 🎲
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleDownloadLogo(false)}
                        className="w-full sm:w-auto text-xs font-bold text-slate-700 border-slate-300 h-10 rounded-xl hover:bg-slate-50"
                      >
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        Baixar PNG
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleDownloadLogo(true)}
                        disabled={isProcessingTransparent}
                        className="w-full sm:w-auto text-xs font-bold text-[#0083C7] border-blue-200 bg-blue-50/60 hover:bg-blue-100 hover:text-[#0083C7] h-10 rounded-xl shadow-2xs"
                        title="Baixar em formato PNG com fundo 100% transparente para estampas, sites e documentos"
                      >
                        {isProcessingTransparent ? (
                          <>
                            <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            Recortando Fundo...
                          </>
                        ) : (
                          <>
                            <Download className="mr-1.5 h-3.5 w-3.5 text-[#0083C7]" />
                            Baixar PNG (Transparente) ✨
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Grid de Mockups do Brand Kit: Favicon, Avatar e Cartão */}
              {generatedLogoUrl && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in-50 duration-300">
                  {/* Mockup 1: Avatar Redondo de Rede Social */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs text-center space-y-2">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Foto de Perfil (Instagram)
                    </p>
                    <div className="flex justify-center">
                      <div className="h-20 w-20 rounded-full border-2 border-[#0083C7] p-1 overflow-hidden bg-white shadow-xs flex items-center justify-center">
                        <img
                          src={generatedLogoUrl}
                          alt="Avatar Instagram"
                          className="h-full w-full object-contain rounded-full"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-600">Encaixe 1:1 perfeito para redes sociais</p>
                  </div>

                  {/* Mockup 2: Favicon no Navegador */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-2">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">
                      Favicon (Aba do Navegador)
                    </p>
                    <div className="bg-slate-100 rounded-lg p-2 border border-slate-200 flex items-center gap-2">
                      <div className="h-4 w-4 rounded-sm bg-white p-0.5 flex items-center justify-center border shadow-2xs">
                        <img src={generatedLogoUrl} alt="Favicon" className="h-full w-full object-contain" />
                      </div>
                      <span className="text-[11px] font-medium text-slate-700 truncate">{brandName} — Início</span>
                    </div>
                    <p className="text-[10px] text-slate-600 text-center">Ícone 32x32 para abas e favoritos</p>
                  </div>

                  {/* Mockup 3: Aplicação em Cartão de Visitas */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-2">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">
                      Prévia no Cartão Físico
                    </p>
                    <div className="h-20 rounded-lg bg-gradient-to-br from-slate-900 to-slate-800 p-2.5 flex flex-col justify-between text-white shadow-xs">
                      <div className="flex items-center gap-1.5">
                        <img src={generatedLogoUrl} alt="Logo Cartão" className="h-5 w-5 object-contain bg-white/20 rounded p-0.5" />
                        <span className="text-[10px] font-bold truncate">{brandName}</span>
                      </div>
                      <div className="text-[8px] text-slate-300 flex justify-between items-end">
                        <span>Cartão Corporativo</span>
                        <span className="text-[#FA6305] font-bold">Fase 2</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-600 text-center">Pronto para exportação gráfica 300 DPI</p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* ABA 2: PAPELARIA & ATIVOS DIGITAIS (FASE 2) */}
        {/* ========================================================================= */}
        <TabsContent value="papelaria" className="space-y-6">
          {/* Sub-navegação da Fase 2 */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs print:hidden">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setStationerySubTab("cartao")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  stationerySubTab === "cartao"
                    ? "bg-[#0083C7] text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <Smartphone className="h-4 w-4" />
                Cartão de Visitas (Digital & Físico)
              </button>

              <button
                type="button"
                onClick={() => setStationerySubTab("assinatura")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  stationerySubTab === "assinatura"
                    ? "bg-[#0083C7] text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <Mail className="h-4 w-4" />
                Assinatura de E-mail
              </button>

              <button
                type="button"
                onClick={() => setStationerySubTab("timbrado")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  stationerySubTab === "timbrado"
                    ? "bg-[#0083C7] text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <FileText className="h-4 w-4" />
                Papel Timbrado A4
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500 text-white text-[10px] font-bold">
                ✓ Sincronizado com Cérebro
              </Badge>
            </div>
          </div>

          {/* Renderização Condicional dos Sub-módulos da Fase 2 */}
          {(() => {
            const anyProfile = profileData as any;
            return (
              <>
                {stationerySubTab === "cartao" && (
                  <BusinessCardStudio
                    brandName={brandName || "Sua Marca"}
                    slogan={slogan}
                    primaryColor={primaryColor}
                    secondaryColor={secondaryColor}
                    logoUrl={effectiveLogoUrl}
                    lightLogoUrl={effectiveLightLogoUrl}
                    initialPhone={anyProfile?.whatsapp || anyProfile?.phone || ""}
                    initialInstagram={anyProfile?.instagramUsername || anyProfile?.instagram || ""}
                    initialWebsite={anyProfile?.website || ""}
                    initialEmail={anyProfile?.email || user?.email || ""}
                  />
                )}

                {stationerySubTab === "assinatura" && (
                  <EmailSignatureStudio
                    brandName={brandName || "Sua Marca"}
                    slogan={slogan}
                    primaryColor={primaryColor}
                    secondaryColor={secondaryColor}
                    logoUrl={effectiveLogoUrl}
                    initialName={anyProfile?.ownerName || user?.displayName || "Seu Nome"}
                    initialRole="Diretoria / Gestão"
                    initialPhone={anyProfile?.whatsapp || anyProfile?.phone || ""}
                    initialEmail={anyProfile?.email || user?.email || ""}
                    initialWebsite={anyProfile?.website || ""}
                    initialInstagram={anyProfile?.instagramUsername || anyProfile?.instagram || ""}
                  />
                )}

                {stationerySubTab === "timbrado" && (
                  <LetterheadStudio
                    brandName={brandName || "Sua Marca"}
                    slogan={slogan}
                    primaryColor={primaryColor}
                    secondaryColor={secondaryColor}
                    logoUrl={effectiveLogoUrl}
                    initialPhone={anyProfile?.whatsapp || anyProfile?.phone || ""}
                    initialEmail={anyProfile?.email || user?.email || ""}
                    initialWebsite={anyProfile?.website || ""}
                    initialAddress={
                      anyProfile?.address || (anyProfile?.city ? `${anyProfile.city} - ${anyProfile.state || "Brasil"}` : "")
                    }
                  />
                )}
              </>
            );
          })()}
        </TabsContent>

        {/* ========================================================================= */}
        {/* ABA 3: PONTO DE VENDA (PDV) & CREDIBILIDADE (FASE 3) */}
        {/* ========================================================================= */}
        <TabsContent value="pdv" className="space-y-6">
          {(() => {
            const anyProfile = profileData as any;
            return (
              <PdvStudio
                brandName={brandName || "Sua Marca"}
                slogan={slogan}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                logoUrl={effectiveLogoUrl}
                phone={anyProfile?.whatsapp || anyProfile?.phone || ""}
                instagram={anyProfile?.instagramUsername || anyProfile?.instagram || ""}
                website={anyProfile?.website || ""}
                email={anyProfile?.email || user?.email || ""}
                address={
                  anyProfile?.address ||
                  (anyProfile?.city ? `${anyProfile.city} - ${anyProfile.state || "Brasil"}` : "")
                }
                initialMockups={anyProfile?.brandKit?.brandMockups || {}}
                onMockupSaved={(key, url) => {
                  setProfileData((prev: any) => ({
                    ...prev,
                    brandKit: {
                      ...(prev?.brandKit || {}),
                      brandMockups: {
                        ...(prev?.brandKit?.brandMockups || {}),
                        [key]: url,
                      },
                    },
                  }));
                }}
              />
            );
          })()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
