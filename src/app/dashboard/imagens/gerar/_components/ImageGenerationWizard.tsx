"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/components/auth/auth-provider";
import { db, storage } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Sparkles,
  Wand2,
  Image as ImageIcon,
  Layers,
  CheckCircle2,
  RefreshCw,
  Edit3,
  Download,
  Send,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Plus,
  Info,
  SlidersHorizontal,
  Scissors,
  Share2,
  Check,
  AlertCircle,
  ExternalLink,
  UploadCloud,
  ChevronDown,
  HelpCircle,
  RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  type AIImageObjective,
  type AIImageFormat,
  type AIImageStyle,
  type AIImageTextOverlayMode,
  type AIImageAssetDoc,
  FORMAT_DIMENSIONS,
} from "@/lib/types/ai-image-general";

// Opções de Objetivo com linguagem acessível para baixa maturidade digital
const OBJECTIVE_OPTIONS: {
  id: AIImageObjective;
  label: string;
  icon: string;
  desc: string;
  badge?: string;
}[] = [
  {
    id: "commercial",
    label: "Vender Produto",
    icon: "🛍️",
    desc: "Mostrar seus produtos com qualidade profissional para atrair clientes e vendas",
    badge: "Mais Usado",
  },
  {
    id: "social",
    label: "Post para Redes",
    icon: "📱",
    desc: "Publicações para engajar seguidores, dar dicas e divulgar novidades no Instagram",
  },
  {
    id: "ad",
    label: "Anúncio / Oferta",
    icon: "🎯",
    desc: "Imagens chamativas com alto poder de conversão para tráfego e promoções",
  },
  {
    id: "presentation",
    label: "Empresa & Serviços",
    icon: "💼",
    desc: "Apresentação institucional e serviços para passar autoridade e credibilidade",
  },
  {
    id: "concept",
    label: "Conceito Criativo",
    icon: "🎨",
    desc: "Ideias livres, datas comemorativas, ilustrações conceituais e temas artísticos",
  },
  {
    id: "personal",
    label: "Foto de Perfil",
    icon: "👤",
    desc: "Retratos profissionais para foto de perfil e fortalecimento da marca pessoal",
  },
];

// Opções de Formato com representação visual de proporção de tela
const FORMAT_OPTIONS: {
  id: AIImageFormat;
  title: string;
  ratioLabel: string;
  subtitle: string;
  badge?: string;
  aspectClass: string;
}[] = [
  {
    id: "portrait",
    title: "Feed Retrato",
    ratioLabel: "4:5",
    subtitle: "Ocupa a tela toda no celular. Formato mais recomendado para o Instagram.",
    badge: "Recomendado",
    aspectClass: "w-6 h-8", // Proporção 4:5
  },
  {
    id: "square",
    title: "Feed Quadrado",
    ratioLabel: "1:1",
    subtitle: "Formato clássico e simétrico para postagens normais no feed.",
    aspectClass: "w-7 h-7", // Proporção 1:1
  },
  {
    id: "story",
    title: "Stories & Reels",
    ratioLabel: "9:16",
    subtitle: "Tela cheia na vertical para Stories, Reels, TikTok e status do WhatsApp.",
    aspectClass: "w-5 h-9", // Proporção 9:16
  },
  {
    id: "landscape",
    title: "Horizontal / Banner",
    ratioLabel: "16:9",
    subtitle: "Formato deitado para banners de site, computadores e apresentações.",
    aspectClass: "w-9 h-5", // Proporção 16:9
  },
];

// Helper para proporção dinâmica do container de preview adaptada ao formato
export function getFormatAspectClass(fmt: AIImageFormat): string {
  switch (fmt) {
    case "portrait": // 4:5 (Feed vertical Instagram)
      return "aspect-[4/5] max-h-[620px]";
    case "story": // 9:16 (Stories, Reels, TikTok)
      return "aspect-[9/16] max-h-[680px]";
    case "landscape": // 16:9 (Horizontal / Banner)
      return "aspect-[16/9] max-h-[420px]";
    case "banner": // 1200x630
      return "aspect-[1200/630] max-h-[380px]";
    case "square": // 1:1 (Quadrado)
    default:
      return "aspect-square max-h-[540px]";
  }
}

// Opções de Diagramação e Textos na Imagem (Infográfico Completo como padrão e primeira opção)
const TEXT_OVERLAY_OPTIONS: {
  id: AIImageTextOverlayMode;
  title: string;
  subtitle: string;
  badge?: string;
  icon: string;
}[] = [
  {
    id: "INFOGRAPHIC",
    title: "Infográfico Completo",
    subtitle: "Cartaz comercial completo: título de destaque, selo de qualidade, cards com ícones de diferenciais e rodapé.",
    badge: "Recomendado para Anúncios",
    icon: "📊",
  },
  {
    id: "TITLE_ONLY",
    title: "Título Comercial / Slogan",
    subtitle: "Adiciona uma frase de impacto, slogan ou chamada promocional em destaque no topo da arte.",
    icon: "✨",
  },
  {
    id: "NONE",
    title: "Fotografia Pura",
    subtitle: "Apenas a foto realista limpa em alta qualidade, sem letras ou textos desenhados.",
    icon: "🖼️",
  },
];

const PLACEHOLDER_PROMPTS = [
  "Crie uma foto publicitária de um bolo de chocolate em uma mesa elegante.",
  "Transforme esta foto de celular em uma imagem profissional para vender no Instagram.",
  "Crie uma foto de estúdio de uma xícara de café especial com vapor e grãos ao redor.",
  "Foto de tênis esportivo moderno sobre fundo clean com iluminação de estúdio.",
];

export function ImageGenerationWizard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Etapa atual (1 a 3)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Estados do Briefing (Etapa 1)
  const [brief, setBrief] = useState<string>("");
  const [objective, setObjective] = useState<AIImageObjective>("commercial");
  const [format, setFormat] = useState<AIImageFormat>("portrait");
  const [style, setStyle] = useState<AIImageStyle>("automatic");
  const quantity = 1;
  const [textOverlayMode, setTextOverlayMode] = useState<AIImageTextOverlayMode>("INFOGRAPHIC");
  const [productHeadline, setProductHeadline] = useState<string>("");
  const [useBrandKit, setUseBrandKit] = useState<boolean>(true);
  const [textMode, setTextMode] = useState<"none" | "editable_layers" | "rasterized">("none");
  const [negativeInstructions, setNegativeInstructions] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Arquivos anexos do Briefing
  const [referenceImages, setReferenceImages] = useState<{ file?: File; url: string }[]>([]);
  const [sourceImage, setSourceImage] = useState<{ file?: File; url: string } | null>(null);
  const [isUploadingFiles, setIsUploadingFiles] = useState<boolean>(false);

  // BrandKit carregado do negócio
  const [businessProfile, setBusinessProfile] = useState<any>(null);

  // Estados da Geração (Etapa 2)
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [assets, setAssets] = useState<AIImageAssetDoc[]>([]);
  const [retryingAssetId, setRetryingAssetId] = useState<string | null>(null);
  const [removingBgAssetId, setRemovingBgAssetId] = useState<string | null>(null);

  // Placeholder rotativo com proteção para ambiente de testes
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined" || process.env.NODE_ENV === "test") return;
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDER_PROMPTS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // 1. Carregar perfil de BrandKit do negócio (lê tanto de onboarding quanto de profile)
  useEffect(() => {
    if (!user) return;

    Promise.all([
      getDoc(doc(db, "users", user.uid, "business", "onboarding")),
      getDoc(doc(db, "users", user.uid, "business", "profile")),
    ]).then(([onboardingSnap, profileSnap]) => {
      const onboardingData = onboardingSnap.exists() ? onboardingSnap.data() : {};
      const profileData = profileSnap.exists() ? profileSnap.data() : {};
      const merged = { ...profileData, ...onboardingData };
      if (onboardingSnap.exists() || profileSnap.exists()) {
        setBusinessProfile(merged);
      }
    }).catch((err) => {
      console.warn("[IMAGE_WIZARD] Erro ao carregar perfil de marca:", err);
    });
  }, [user]);

  // Função para resetar todos os campos e garantir uma nova solicitação limpa
  const handleResetForm = useCallback(() => {
    setBrief("");
    setProductHeadline("");
    setNegativeInstructions("");
    setReferenceImages([]);
    setSourceImage(null);
    setAssets([]);
    setGenerationId(null);
    setObjective("commercial");
    setFormat("portrait");
    setStyle("automatic");
    setTextOverlayMode("INFOGRAPHIC");
    setTextMode("none");
    setUseBrandKit(true);
    setShowAdvanced(false);
    setCurrentStep(1);
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage?.removeItem("numvapt_image_generation_draft");
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // Sempre que entrar no fluxo geral, resetar as informações da geração anterior
  useEffect(() => {
    handleResetForm();
  }, [handleResetForm]);

  // Suporte a colar imagens com Ctrl+V diretamente na página
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            const url = URL.createObjectURL(file);
            // Se ainda não tiver produto/sujeito, adiciona nele
            if (!sourceImage) {
              setSourceImage({ file, url });
              toast({ title: "Foto colada com sucesso!", description: "Adicionada como foto do sujeito/produto." });
            } else {
              setReferenceImages((prev) => [...prev, { file, url }]);
              toast({ title: "Foto colada com sucesso!", description: "Adicionada como referência de estilo." });
            }
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [sourceImage, toast]);

  // Upload de arquivos locais para o Storage
  const handleUploadImageFile = async (file: File): Promise<string> => {
    if (!user) throw new Error("Usuário não autenticado.");
    const storageRef = ref(storage, `users/${user.uid}/temp_uploads/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  };

  // -------------------------------------------------------------
  // Ações do Fluxo
  // -------------------------------------------------------------

  // Avançar diretamente da Ideia (Etapa 1) para a Geração de Imagens (Etapa 2)
  const handleStartGenerationDirect = async () => {
    if (!brief.trim()) {
      toast({
        variant: "destructive",
        title: "Conte sua ideia primeiro",
        description: "Por favor, digite o que você deseja criar antes de continuar.",
      });
      return;
    }

    setIsGenerating(true);
    setCurrentStep(2);

    const initialSlots: AIImageAssetDoc[] = Array.from({ length: quantity }).map((_, idx) => ({
      id: `temp_slot_${idx}`,
      generationId: "pending",
      userId: user?.uid || "",
      order: idx,
      status: "processing",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    setAssets(initialSlots);

    try {
      const uploadedRefUrls: string[] = [];
      for (const item of referenceImages) {
        if (item.file) {
          const url = await handleUploadImageFile(item.file);
          uploadedRefUrls.push(url);
        } else if (item.url) {
          uploadedRefUrls.push(item.url);
        }
      }

      let uploadedSourceUrl = sourceImage?.url || "";
      if (sourceImage?.file) {
        uploadedSourceUrl = await handleUploadImageFile(sourceImage.file);
      }

      const dimensions = FORMAT_DIMENSIONS[format];
      const res = await fetch("/api/imagens/gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "general_image",
          brief,
          objective,
          format,
          width: dimensions.width,
          height: dimensions.height,
          quantity,
          style,
          useBrandKit,
          textMode: textOverlayMode === "NONE" ? "none" : "editable_layers",
          textOverlayMode,
          productHeadline,
          negativeInstructions,
          referenceAssetUrls: uploadedRefUrls,
          sourceAssetUrls: uploadedSourceUrl ? [uploadedSourceUrl] : [],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Falha ao gerar imagens.");
      }

      setGenerationId(data.generationId);
      if (Array.isArray(data.assets)) {
        setAssets(data.assets);
      }

      toast({
        title: "Suas imagens estão prontas! ✨",
        description: "Imagens geradas e salvas com sucesso na sua Galeria.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro ao gerar",
        description: err.message || "Tente novamente em instantes.",
      });
      setAssets((prev) =>
        prev.map((a) => (a.status === "processing" ? { ...a, status: "failed", error: err.message } : a))
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Retry individual de uma variação
  const handleRetryVariation = async (assetId: string) => {
    setRetryingAssetId(assetId);
    setAssets((prev) =>
      prev.map((a) => (a.id === assetId ? { ...a, status: "processing", error: null } : a))
    );

    try {
      const dimensions = FORMAT_DIMENSIONS[format];
      const res = await fetch("/api/imagens/gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "general_image",
          brief,
          objective,
          format,
          width: dimensions.width,
          height: dimensions.height,
          quantity: 1,
          style,
          useBrandKit,
          textMode: textOverlayMode === "NONE" ? "none" : "editable_layers",
          textOverlayMode,
          productHeadline,
          retryAssetId: assetId,
          existingGenerationId: generationId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao regerar variação.");

      if (data.assets && data.assets[0]) {
        setAssets((prev) => prev.map((a) => (a.id === assetId ? data.assets[0] : a)));
      }
      toast({
        title: "Nova versão gerada! ✨",
      });
    } catch (err: any) {
      setAssets((prev) =>
        prev.map((a) =>
          a.id === assetId ? { ...a, status: "failed", error: "Falha ao tentar novamente." } : a
        )
      );
      toast({
        variant: "destructive",
        title: "Erro na geração",
        description: err.message || "Tente novamente.",
      });
    } finally {
      setRetryingAssetId(null);
    }
  };

  // Remoção de fundo em uma imagem específica
  const handleRemoveBackground = async (asset: AIImageAssetDoc) => {
    if (!asset.originalUrl) return;

    setRemovingBgAssetId(asset.id);
    try {
      const res = await fetch("/api/imagens/remover-fundo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: asset.originalUrl,
          assetId: asset.id,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Falha ao remover o fundo da imagem.");
      }

      setAssets((prev) =>
        prev.map((a) =>
          a.id === asset.id
            ? { ...a, originalUrl: data.url, previewUrl: data.url, derivedFromAssetId: asset.id }
            : a
        )
      );

      toast({
        title: "Fundo removido com sucesso! ✂️",
        description: "Versão com fundo transparente salva na sua Galeria.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Falha ao remover fundo",
        description: err.message || "Tente novamente.",
      });
    } finally {
      setRemovingBgAssetId(null);
    }
  };

  // Ação: Usar em Post
  const handleUseInPost = (asset: AIImageAssetDoc) => {
    if (!asset.originalUrl) return;
    try {
      if (typeof window !== "undefined") {
        window.sessionStorage?.setItem(
          "preloaded_gallery_image",
          JSON.stringify({
            url: asset.originalUrl,
            prompt: brief,
            caption: brief.slice(0, 100),
            type: "image",
          })
        );
      }
      toast({
        title: "Imagem selecionada!",
        description: "Abrindo o criador de post com sua imagem...",
      });
      router.push("/dashboard/posts/criar?from_gallery=true");
    } catch (e) {
      console.error(e);
    }
  };

  // Download da imagem
  const handleDownload = async (url?: string, filename?: string) => {
    if (!url) return;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename || `numvapt_ia_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
      toast({ title: "Download iniciado!" });
    } catch (e) {
      window.open(url, "_blank");
    }
  };

  // Lista de etapas do Stepper (Padrão NumVapt - 3 Etapas Diretas)
  const wizardSteps = [
    { number: 1, label: "Ideia" },
    { number: 2, label: "Imagens" },
    { number: 3, label: "Concluir" },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 pb-16">
      {/* Cabeçalho Centralizado Padronizado */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Geração de Imagens com IA
        </h1>
        <p className="mx-auto max-w-2xl text-sm sm:text-base text-gray-600">
          {currentStep === 1 &&
            "Etapa 1: Conte o que você quer criar e personalize as opções para o seu negócio."}
          {currentStep === 2 &&
            "Etapa 2: Veja o resultado gerado pela IA e use como desejar."}
          {currentStep === 3 &&
            "Etapa 3: Suas imagens foram salvas na galeria e estão prontas para usar!"}
        </p>
      </div>

      {/* Stepper Interativo (Idêntico ao padrão dos demais fluxos) */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 md:gap-4">
        {wizardSteps.map((s) => (
          <button
            key={s.number}
            onClick={() => {
              if (s.number <= currentStep) {
                setCurrentStep(s.number);
              }
            }}
            disabled={s.number > currentStep}
            className={`flex items-center gap-2 rounded-2xl px-3.5 py-1.5 transition-all duration-300 md:px-5 md:py-2 ${
              currentStep === s.number
                ? "scale-105 border-2 border-accent bg-accent text-white shadow-lg shadow-orange-100 font-bold"
                : s.number < currentStep
                  ? "border-2 border-primary/20 bg-white text-primary hover:border-primary/40 hover:bg-primary/5 font-semibold"
                  : "cursor-not-allowed border-2 border-gray-100 bg-white text-gray-300 opacity-50"
            }`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                currentStep === s.number
                  ? "bg-white text-accent"
                  : s.number < currentStep
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-300"
              }`}
            >
              {s.number}
            </span>
            <span className="hidden sm:inline text-xs sm:text-sm">{s.label}</span>
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* ETAPA 1 — IDEIA & BRIEFING LIVRE                                          */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card className="relative mx-auto w-full max-w-4xl overflow-hidden border-none shadow-lg bg-white rounded-2xl">
            <CardHeader className="bg-slate-50/70 border-b border-slate-100 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2 text-gray-900">
                  <Sparkles className="h-6 w-6 text-accent" />
                  Etapa 1: O que você quer criar?
                </CardTitle>
                <CardDescription className="text-sm text-gray-600 mt-1">
                  Conte sua ideia em palavras simples ou escolha um dos nossos modelos prontos. Você não precisa saber termos técnicos.
                </CardDescription>
              </div>

              {(brief || productHeadline || referenceImages.length > 0 || sourceImage) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetForm}
                  className="text-xs text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl gap-1.5 self-start sm:self-auto shrink-0"
                  title="Limpar todos os campos e começar uma nova solicitação"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Limpar campos
                </Button>
              )}
            </CardHeader>

            <CardContent className="p-6 sm:p-8 space-y-8">
              {/* 1. Campo Principal de Texto */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="briefInput" className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-1.5">
                    <span>1. Descreva a imagem que deseja</span>
                    <span className="text-rose-500">*</span>
                  </Label>
                  <span className="text-xs text-gray-400 font-medium">
                    Quanto mais detalhes, melhor!
                  </span>
                </div>

                <Textarea
                  id="briefInput"
                  rows={4}
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  placeholder={PLACEHOLDER_PROMPTS[placeholderIndex]}
                  className="rounded-2xl p-4 text-sm leading-relaxed border-gray-200 focus:border-accent focus:ring-accent resize-none shadow-inner"
                />
              </div>

              {/* 2. Seleção de Formato de Tela (Visual e Claro) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm sm:text-base font-bold text-gray-900">
                    2. Onde você vai usar essa imagem? (Formato da Tela)
                  </Label>
                  <span className="text-xs text-gray-400">Clique para selecionar</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {FORMAT_OPTIONS.map((fOpt) => {
                    const isSelected = format === fOpt.id;
                    return (
                      <div
                        key={fOpt.id}
                        onClick={() => setFormat(fOpt.id)}
                        className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer relative text-left ${
                          isSelected
                            ? "border-accent bg-orange-50/40 shadow-sm"
                            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-slate-50/50"
                        }`}
                      >
                        {/* Miniatura visual de proporção */}
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-xl shrink-0 transition-colors ${
                            isSelected ? "bg-orange-100" : "bg-slate-100"
                          }`}
                        >
                          <div
                            className={`rounded-xs border-2 shadow-2xs ${
                              isSelected
                                ? "border-accent bg-accent/30"
                                : "border-slate-500 bg-white"
                            } ${fOpt.aspectClass}`}
                          />
                        </div>

                        {/* Textos */}
                        <div className="flex-1 min-w-0 pr-6">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-900 truncate">
                              {fOpt.title}
                            </span>
                            <span className="text-[11px] font-semibold text-gray-400">
                              ({fOpt.ratioLabel})
                            </span>
                            {fOpt.badge && (
                              <Badge className="bg-orange-500 text-white text-[10px] font-bold border-none px-2 py-0">
                                {fOpt.badge}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                            {fOpt.subtitle}
                          </p>
                        </div>

                        {/* Indicador de Seleção */}
                        <div className="absolute top-4 right-4">
                          {isSelected ? (
                            <CheckCircle2 className="h-5 w-5 text-accent" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Seleção de Objetivo da Imagem */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm sm:text-base font-bold text-gray-900">
                    3. Qual é o objetivo principal da imagem?
                  </Label>
                  <span className="text-xs text-gray-400">Ajuda a IA a definir o foco</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {OBJECTIVE_OPTIONS.map((opt) => {
                    const isSelected = objective === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setObjective(opt.id)}
                        className={`flex flex-col justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer relative text-left min-h-[96px] ${
                          isSelected
                            ? "border-accent bg-orange-50/40 shadow-sm"
                            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-slate-50/50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{opt.icon}</span>
                            <span className="text-sm font-bold text-gray-900">{opt.label}</span>
                          </div>
                          {isSelected ? (
                            <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-gray-300 shrink-0" />
                          )}
                        </div>

                        <p className="text-xs text-gray-500 leading-snug mt-2">
                          {opt.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4. Textos e Infográficos na Imagem */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm sm:text-base font-bold text-gray-900">
                    4. Textos e Infográficos na Imagem
                  </Label>
                  <span className="text-xs text-gray-400">Diagramação visual</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {TEXT_OVERLAY_OPTIONS.map((tOpt) => {
                    const isSelected = textOverlayMode === tOpt.id;
                    return (
                      <div
                        key={tOpt.id}
                        role="button"
                        data-testid={`overlay-mode-${tOpt.id}`}
                        onClick={() => setTextOverlayMode(tOpt.id)}
                        className={`flex flex-col justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer relative text-left min-h-[96px] ${
                          isSelected
                            ? "border-accent bg-orange-50/40 shadow-sm"
                            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-slate-50/50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{tOpt.icon}</span>
                            <span className="text-sm font-bold text-gray-900">{tOpt.title}</span>
                          </div>
                          {isSelected ? (
                            <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-gray-300 shrink-0" />
                          )}
                        </div>

                        <p className="text-xs text-gray-500 leading-snug mt-2">
                          {tOpt.subtitle}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {(textOverlayMode === "TITLE_ONLY" || textOverlayMode === "INFOGRAPHIC" || textOverlayMode === "BOTH") && (
                  <div
                    className="p-4 rounded-2xl bg-orange-50/50 border border-orange-200/80 space-y-2 mt-2 transition-all"
                  >
                    <Label htmlFor="headlineInput" className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                      <span>Frase, Título ou Slogan do Anúncio (Opcional)</span>
                    </Label>
                    <Input
                      id="headlineInput"
                      value={productHeadline}
                      onChange={(e) => setProductHeadline(e.target.value)}
                      placeholder="Ex: 30% OFF NO SEGUNDO ITEM ou QUALIDADE QUE TRANSFORMA"
                      className="rounded-xl border-orange-200 bg-white text-sm focus:border-accent focus:ring-accent"
                    />
                    <p className="text-[11px] text-gray-500">
                      💡 Se deixar em branco, a própria inteligência artificial criará uma frase comercial chamativa com base na sua ideia.
                    </p>
                  </div>
                )}
              </div>

              {/* 5. Fotos para Ajudar a IA (Opcional, com suporte a Ctrl+V) */}
              <div className="space-y-3 pt-2">
                <div>
                  <Label className="text-sm sm:text-base font-bold text-gray-900">
                    5. Fotos para ajudar a IA (Opcional)
                  </Label>
                  <p className="text-xs text-gray-500">
                    Você pode tirar uma foto pelo celular, selecionar um arquivo ou colar com Ctrl+V.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Foto do Produto ou Pessoa */}
                  <div className="p-5 rounded-2xl border-2 border-dashed border-gray-300 bg-slate-50/70 hover:border-accent hover:bg-orange-50/20 transition-all space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                          <Scissors className="h-4 w-4 text-accent" />
                          Foto do Produto ou Pessoa
                        </span>
                        <Badge variant="outline" className="text-[10px] font-bold border-orange-200 text-orange-600 bg-orange-50">
                          Sujeito
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">
                        Envie a foto real do seu produto ou de uma pessoa para a IA criar um cenário em volta.
                      </p>
                    </div>

                    {!sourceImage ? (
                      <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-200 rounded-xl bg-white hover:bg-slate-50 cursor-pointer transition-all">
                        <UploadCloud className="h-8 w-8 text-gray-400 mb-1" />
                        <span className="text-xs font-bold text-gray-700">
                          Clique para escolher ou cole (Ctrl+V)
                        </span>
                        <span className="text-[10px] text-gray-400 mt-0.5">
                          PNG, JPG ou foto de celular
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const f = e.target.files[0];
                              const url = URL.createObjectURL(f);
                              setSourceImage({ file: f, url });
                            }
                          }}
                        />
                      </label>
                    ) : (
                      <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-gray-200">
                        <div className="relative h-16 w-16 rounded-lg overflow-hidden border shrink-0">
                          <img src={sourceImage.url} alt="Produto" className="h-full w-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-xs font-bold text-gray-800 truncate">
                            {sourceImage.file?.name || "Foto do Produto"}
                          </p>
                          <span className="text-[11px] text-emerald-600 font-medium">✓ Carregada</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSourceImage(null)}
                          className="text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Fotos de Inspiração / Estilo */}
                  <div className="p-5 rounded-2xl border-2 border-dashed border-gray-300 bg-slate-50/70 hover:border-primary hover:bg-blue-50/20 transition-all space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                          <ImageIcon className="h-4 w-4 text-primary" />
                          Foto de Inspiração / Estilo
                        </span>
                        <Badge variant="outline" className="text-[10px] font-bold border-blue-200 text-primary bg-blue-50">
                          Referência
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">
                        Gostou de uma foto na internet ou Instagram? Envie como referência de cores e luz.
                      </p>
                    </div>

                    <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-200 rounded-xl bg-white hover:bg-slate-50 cursor-pointer transition-all">
                      <UploadCloud className="h-8 w-8 text-gray-400 mb-1" />
                      <span className="text-xs font-bold text-gray-700">
                        Clique para escolher ou cole (Ctrl+V)
                      </span>
                      <span className="text-[10px] text-gray-400 mt-0.5">
                        Pode enviar 1 ou mais fotos
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files) {
                            const files = Array.from(e.target.files);
                            files.forEach((f) => {
                              const url = URL.createObjectURL(f);
                              setReferenceImages((prev) => [...prev, { file: f, url }]);
                            });
                          }
                        }}
                      />
                    </label>

                    {referenceImages.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto pt-1">
                        {referenceImages.map((refImg, i) => (
                          <div key={i} className="relative h-14 w-14 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                            <img src={refImg.url} alt="Referência" className="h-full w-full object-cover" />
                            <button
                              type="button"
                              onClick={() =>
                                setReferenceImages((prev) => prev.filter((_, idx) => idx !== i))
                              }
                              className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 hover:bg-red-600"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 6. BrandKit (Cores e Marca da Empresa) */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white shadow-xs">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <Label htmlFor="brandKitToggle" className="text-sm font-bold text-gray-900 cursor-pointer block">
                        6. Usar identidade do negócio (BrandKit)
                      </Label>
                      <span className="text-xs text-gray-500">
                        A IA usará suas cores institucionais e elementos cadastrados
                      </span>
                    </div>
                  </div>
                  <Switch
                    id="brandKitToggle"
                    checked={useBrandKit}
                    onCheckedChange={setUseBrandKit}
                  />
                </div>

                {useBrandKit && businessProfile && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-gray-700 bg-white/90 p-3.5 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center gap-1 shrink-0">
                        <div
                          className="h-5 w-5 rounded-full border border-gray-300 shadow-2xs"
                          title="Cor Primária"
                          style={{
                            backgroundColor:
                              businessProfile.primaryColor ||
                              businessProfile.brandKit?.primaryColor ||
                              "#0083C7",
                          }}
                        />
                        {(businessProfile.secondaryColor || businessProfile.brandKit?.secondaryColor) && (
                          <div
                            className="h-4 w-4 rounded-full border border-gray-300 shadow-2xs -ml-1.5"
                            title="Cor Secundária"
                            style={{
                              backgroundColor:
                                businessProfile.secondaryColor ||
                                businessProfile.brandKit?.secondaryColor ||
                                "#FA6305",
                            }}
                          />
                        )}
                      </div>
                      <span className="font-bold text-gray-900">
                        {businessProfile.name || "Sua Empresa"}
                      </span>
                      {(businessProfile.segment || businessProfile.category) && (
                        <Badge variant="outline" className="text-[10px] text-gray-500 border-gray-200">
                          {businessProfile.segment || businessProfile.category}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {((businessProfile.brandKit?.personas && businessProfile.brandKit.personas.length > 0) ||
                        (businessProfile.personas && businessProfile.personas.length > 0)) && (
                        <Badge className="bg-blue-50 text-primary border-blue-200 text-[10px] font-bold">
                          {(businessProfile.brandKit?.personas || businessProfile.personas).length} Personas Ativas
                        </Badge>
                      )}
                      <span className="text-emerald-600 font-semibold flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Identidade Vinculada à IA
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 7. Opções Adicionais (Colapsável para não assustar o usuário) */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-800 flex items-center gap-1.5 transition-colors"
                >
                  <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
                  {showAdvanced ? "Ocultar detalhes avançados" : "Quer evitar algo específico na imagem? (Opcional)"}
                </button>

                {showAdvanced && (
                  <div className="mt-3 p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <Label htmlFor="negInput" className="text-xs font-bold text-gray-700">
                      O que NÃO deve aparecer na imagem (Prompt Negativo)
                    </Label>
                    <Input
                      id="negInput"
                      value={negativeInstructions}
                      onChange={(e) => setNegativeInstructions(e.target.value)}
                      placeholder="Ex: sem pessoas ao fundo, sem reflexos fortes, sem texto borrado"
                      className="text-xs rounded-xl bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Barra de Navegação no Rodapé da Etapa 1 */}
              <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.push("/dashboard/posts")}
                  className="rounded-2xl text-xs font-semibold text-gray-500 hover:text-gray-800 h-11"
                >
                  Cancelar e voltar aos posts
                </Button>

                <Button
                  type="button"
                  size="lg"
                  disabled={isGenerating || !brief.trim()}
                  onClick={handleStartGenerationDirect}
                  className="w-full sm:w-auto bg-accent hover:bg-orange-600 text-white font-bold rounded-2xl h-12 px-8 text-base shadow-lg shadow-orange-100 flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Gerando Imagem com IA...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      <span>Gerar Imagem com IA</span>
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* ETAPA 2 — SUA IMAGEM GERADA & RESULTADOS                                 */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-accent" />
                Etapa 2: Sua Imagem Gerada
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">
                Veja o resultado gerado pela IA. Você pode adicionar textos, tirar o fundo ou usá-la no seu post.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetForm}
                className="rounded-2xl text-xs font-semibold h-10 px-4"
              >
                Novo Briefing
              </Button>
              {assets.some((a) => a.status === "ready") && (
                <Button
                  size="sm"
                  onClick={() => setCurrentStep(3)}
                  className="bg-accent hover:bg-orange-600 text-white font-bold rounded-2xl text-xs h-10 px-5 shadow-sm"
                >
                  Avançar para Concluir
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Grade de Resultados com Miniaturas e Ações Claras */}
          <div className="grid grid-cols-1 max-w-xl mx-auto gap-6">
            {assets.map((asset, idx) => (
              <Card key={asset.id || idx} className="overflow-hidden border border-slate-200 shadow-md rounded-2xl bg-white">
                <div className={`relative ${getFormatAspectClass(format)} w-full bg-slate-950 flex items-center justify-center overflow-hidden rounded-t-2xl mx-auto shadow-inner`}>
                  {asset.status === "processing" ? (
                    <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
                      <Loader2 className="h-10 w-10 text-accent animate-spin" />
                      <p className="text-white text-sm font-bold">
                        {retryingAssetId === asset.id
                          ? "Regerando imagem com IA..."
                          : "Criando sua imagem com IA..."}
                      </p>
                      <span className="text-slate-400 text-xs">
                        Pintando iluminação, texturas e detalhes em alta resolução
                      </span>
                    </div>
                  ) : asset.status === "failed" ? (
                    <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
                      <AlertCircle className="h-10 w-10 text-rose-500" />
                      <p className="text-white text-xs font-semibold">
                        {asset.error || "Não foi possível gerar esta imagem."}
                      </p>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleRetryVariation(asset.id)}
                        disabled={retryingAssetId === asset.id}
                        className="rounded-xl text-xs font-bold"
                      >
                        <RefreshCw className="h-3.5 w-3.5 mr-1" />
                        Tentar Novamente
                      </Button>
                    </div>
                  ) : asset.originalUrl ? (
                    <img
                      src={asset.originalUrl}
                      alt={asset.altText || "Sua Imagem"}
                      className="h-full w-full object-cover"
                    />
                  ) : null}

                  {asset.status === "ready" && (
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-emerald-500 text-white text-xs font-bold border-none shadow-sm px-2.5 py-0.5">
                        ✓ Pronta
                      </Badge>
                    </div>
                  )}
                </div>

                {asset.status === "ready" && (
                  <CardContent className="p-4 sm:p-5 bg-white space-y-3">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="font-bold text-gray-800 text-sm">Sua Imagem</span>
                      <span className="font-medium text-gray-500">{FORMAT_DIMENSIONS[format].label}</span>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleUseInPost(asset)}
                        className="w-full rounded-xl text-xs font-bold bg-primary hover:bg-blue-600 text-white h-10 shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <Send className="h-4 w-4" />
                        Usar em Post
                      </Button>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(asset.originalUrl, `numvapt_opcao_${idx + 1}.png`)}
                          className="rounded-xl text-xs font-bold border-slate-200 hover:bg-slate-50 h-9 flex items-center justify-center gap-1.5"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Baixar
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          disabled={removingBgAssetId === asset.id}
                          onClick={() => handleRemoveBackground(asset)}
                          className="rounded-xl text-xs font-bold border-slate-200 hover:bg-orange-50 hover:text-accent h-9 flex items-center justify-center gap-1.5"
                        >
                          {removingBgAssetId === asset.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Scissors className="h-3.5 w-3.5 text-accent" />
                          )}
                          Tirar Fundo
                        </Button>
                      </div>
                    </div>

                    <div className="pt-1 flex justify-center">
                      <button
                        type="button"
                        onClick={() => handleRetryVariation(asset.id)}
                        disabled={retryingAssetId === asset.id}
                        className="text-xs text-gray-500 hover:text-accent flex items-center gap-1 font-semibold transition-colors"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Gerar outra versão parecida com esta
                      </button>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* ETAPA 3 — CONCLUSÃO, SALVAMENTO & GALERIA                                */}
      {/* ========================================================================= */}
      {currentStep === 3 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card className="relative mx-auto w-full max-w-4xl overflow-hidden border-none shadow-lg bg-white rounded-2xl">
            <CardHeader className="bg-emerald-50/60 border-b border-emerald-100 p-6 text-center sm:text-left">
              <CardTitle className="text-xl font-bold flex items-center justify-center sm:justify-start gap-2 text-emerald-800">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                Tudo Pronto! Sua imagem já está salva na Galeria.
              </CardTitle>
              <CardDescription className="text-sm text-emerald-700">
                Sua imagem foi guardada com sucesso na sua conta. Você pode usá-la para criar um post ou baixá-la no computador.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 max-w-xl mx-auto gap-6">
                {assets
                  .filter((a) => a.status === "ready")
                  .map((readyAsset, idx) => (
                    <div
                      key={readyAsset.id}
                      className="border border-slate-200 rounded-2xl overflow-hidden p-4 space-y-4 bg-slate-50/40"
                    >
                      <div className={`relative ${getFormatAspectClass(format)} w-full rounded-xl overflow-hidden shadow-inner bg-slate-950 flex items-center justify-center mx-auto`}>
                        <img
                          src={readyAsset.originalUrl}
                          alt="Imagem Pronta"
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="flex flex-col gap-2 pt-1">
                        <Button
                          onClick={() => handleUseInPost(readyAsset)}
                          className="w-full bg-accent hover:bg-orange-600 text-white font-bold rounded-xl text-xs h-10 shadow-sm"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Criar Post com Esta Imagem
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => handleDownload(readyAsset.originalUrl, `numvapt_final_${idx + 1}.png`)}
                          className="w-full rounded-xl text-xs font-bold h-9 border-slate-200 hover:bg-slate-100"
                        >
                          <Download className="h-3.5 w-3.5 mr-1" />
                          Baixar Foto
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>

              <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard/galeria")}
                  className="rounded-2xl text-xs font-bold h-11 px-6 border-slate-200 text-gray-700"
                >
                  <ImageIcon className="h-4 w-4 mr-2 text-primary" />
                  Ver Todas na Minha Galeria
                </Button>

                <Button
                  onClick={handleResetForm}
                  className="rounded-2xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 h-11 px-6"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Nova Imagem com IA
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
