"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  type AIImageObjective,
  type AIImageFormat,
  type AIImageStyle,
  type VisualDirectionResponse,
  type AIImageAssetDoc,
  FORMAT_DIMENSIONS,
} from "@/lib/types/ai-image-general";
import dynamic from "next/dynamic";

const ImageInpaintModal = dynamic(
  () =>
    import("@/app/dashboard/posts/gerar/_components/ImageInpaintModal").then(
      (m) => m.ImageInpaintModal
    ),
  { ssr: false }
);

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

// Opções de Estilo Visual com linguagem desmistificada
const STYLE_OPTIONS: {
  id: AIImageStyle;
  label: string;
  icon: string;
  desc: string;
  badge?: string;
}[] = [
  {
    id: "automatic",
    label: "Automático (IA decide)",
    icon: "✨",
    desc: "A inteligência artificial escolhe o melhor estilo de acordo com a sua ideia",
    badge: "Recomendado",
  },
  {
    id: "photographic",
    label: "Foto Realista de Estúdio",
    icon: "📸",
    desc: "Foto nítida com luz profissional, como em um estúdio fotográfico",
  },
  {
    id: "editorial",
    label: "Elegante & Premium",
    icon: "💎",
    desc: "Visual sofisticado de revista, estética minimalista e cores nobres",
  },
  {
    id: "illustration",
    label: "Desenho / Ilustração",
    icon: "🖌️",
    desc: "Arte moderna e colorida, perfeita para conteúdos criativos e didáticos",
  },
  {
    id: "3d",
    label: "3D de Produto",
    icon: "🧊",
    desc: "Modelagem 3D limpa e brilhante, ideal para embalagens e tecnologia",
  },
  {
    id: "minimalist",
    label: "Minimalista Clean",
    icon: "⚪",
    desc: "Fundo suave e foco absoluto no produto ou elemento central",
  },
  {
    id: "cinematic",
    label: "Estilo Cinema",
    icon: "🎬",
    desc: "Iluminação dramática, sombras marcantes e atmosfera de filme",
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

  // Etapa atual (1 a 5)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Estados do Briefing (Etapa 1)
  const [brief, setBrief] = useState<string>("");
  const [objective, setObjective] = useState<AIImageObjective>("commercial");
  const [format, setFormat] = useState<AIImageFormat>("portrait");
  const [style, setStyle] = useState<AIImageStyle>("automatic");
  const quantity = 1;
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

  // Estados da Direção Visual (Etapa 2)
  const [isLoadingDirection, setIsLoadingDirection] = useState<boolean>(false);
  const [visualDirection, setVisualDirection] = useState<VisualDirectionResponse | null>(null);
  const [alternativeDirections, setAlternativeDirections] = useState<VisualDirectionResponse[]>([]);
  const [selectedDirectionIndex, setSelectedDirectionIndex] = useState<number>(0);

  // Estados da Geração (Etapa 3)
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [assets, setAssets] = useState<AIImageAssetDoc[]>([]);
  const [retryingAssetId, setRetryingAssetId] = useState<string | null>(null);
  const [removingBgAssetId, setRemovingBgAssetId] = useState<string | null>(null);

  // Estados da Edição e Marca (Etapa 4)
  const [selectedAssetForEdit, setSelectedAssetForEdit] = useState<AIImageAssetDoc | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);

  // Placeholder rotativo com proteção para ambiente de testes
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined" || process.env.NODE_ENV === "test") return;
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDER_PROMPTS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // 1. Carregar perfil de BrandKit do usuário e rascunho anterior
  useEffect(() => {
    if (!user) return;

    // Carregar BrandKit do negócio
    getDoc(doc(db, "users", user.uid, "business", "onboarding")).then((snap) => {
      if (snap.exists()) {
        setBusinessProfile(snap.data());
      }
    });

    // Carregar rascunho salvo se disponível
    if (typeof window !== "undefined") {
      try {
        const savedDraft = window.sessionStorage?.getItem("numvapt_image_generation_draft");
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          if (parsed.brief) setBrief(parsed.brief);
          if (parsed.objective) setObjective(parsed.objective);
          if (parsed.format) setFormat(parsed.format);
          if (parsed.style) setStyle(parsed.style);
          if (parsed.useBrandKit !== undefined) setUseBrandKit(parsed.useBrandKit);
          if (parsed.visualDirection) setVisualDirection(parsed.visualDirection);
        }
      } catch (e) {
        console.warn("Erro ao recuperar rascunho:", e);
      }
    }
  }, [user]);

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

  // Autosave no sessionStorage a cada alteração no briefing
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const draft = {
          brief,
          objective,
          format,
          style,
          quantity,
          useBrandKit,
          visualDirection,
          updatedAt: new Date().toISOString(),
        };
        window.sessionStorage?.setItem("numvapt_image_generation_draft", JSON.stringify(draft));
      } catch (e) {
        // ignore
      }
    }
  }, [brief, objective, format, style, quantity, useBrandKit, visualDirection]);

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

  // Avançar da Etapa 1 para a Etapa 2 (Interpretação da Direção Visual)
  const handleContinueWithBriefing = async () => {
    if (!brief.trim()) {
      toast({
        variant: "destructive",
        title: "Conte sua ideia primeiro",
        description: "Por favor, digite o que você deseja criar antes de continuar.",
      });
      return;
    }

    setIsLoadingDirection(true);
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

      const res = await fetch("/api/imagens/direcao-visual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief,
          objective,
          format,
          style,
          useBrandKit,
          textMode,
          negativeInstructions,
          referenceAssetUrls: uploadedRefUrls,
          sourceAssetUrls: uploadedSourceUrl ? [uploadedSourceUrl] : [],
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.visualDirection) {
        throw new Error(data.error || "Não foi possível planejar a direção visual.");
      }

      setVisualDirection(data.visualDirection);
      setAlternativeDirections(data.alternativeDirections || []);
      setCurrentStep(2);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Não foi possível avançar",
        description: err.message || "Tente novamente ou ajuste a descrição da sua imagem.",
      });
    } finally {
      setIsLoadingDirection(false);
    }
  };

  // Avançar da Etapa 2 para a Etapa 3 (Geração de Imagens)
  const handleStartGeneration = async () => {
    if (!brief.trim()) return;

    setIsGenerating(true);
    setCurrentStep(3);

    const activeVisualDirection =
      selectedDirectionIndex > 0 && alternativeDirections[selectedDirectionIndex - 1]
        ? alternativeDirections[selectedDirectionIndex - 1]
        : visualDirection;

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
          textMode,
          negativeInstructions,
          visualDirection: activeVisualDirection,
          referenceAssetUrls: referenceImages.map((r) => r.url).filter(Boolean),
          sourceAssetUrls: sourceImage?.url ? [sourceImage.url] : [],
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
          visualDirection,
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

  // Abrir editor para marca e edição (Etapa 4)
  const handleOpenEditor = (asset: AIImageAssetDoc) => {
    setSelectedAssetForEdit(asset);
    setIsEditorOpen(true);
  };

  // Sucesso da edição com camadas
  const handleEditorSuccess = (newImageUrl: string) => {
    if (selectedAssetForEdit) {
      setAssets((prev) =>
        prev.map((a) =>
          a.id === selectedAssetForEdit.id
            ? { ...a, originalUrl: newImageUrl, previewUrl: newImageUrl, derivedFromAssetId: selectedAssetForEdit.id }
            : a
        )
      );
    }
    setIsEditorOpen(false);
    toast({
      title: "Edição salva com sucesso!",
      description: "Sua versão personalizada foi salva e adicionada à Galeria.",
    });
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

  // Lista de etapas do Stepper (Padrão NumVapt)
  const wizardSteps = [
    { number: 1, label: "Ideia" },
    { number: 2, label: "Direção Visual" },
    { number: 3, label: "Imagens" },
    { number: 4, label: "Marca & Edição" },
    { number: 5, label: "Concluir" },
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
            "Etapa 2: Confira como a inteligência artificial planejou a sua imagem."}
          {currentStep === 3 &&
            "Etapa 3: Escolha as melhores opções geradas e faça os ajustes que desejar."}
          {currentStep === 4 &&
            "Etapa 4: Adicione sua logomarca ou edite detalhes da imagem com o editor."}
          {currentStep === 5 &&
            "Etapa 5: Suas imagens foram salvas na galeria e estão prontas para usar!"}
        </p>
      </div>

      {/* Stepper Interativo (Idêntico ao padrão dos demais fluxos) */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 md:gap-4">
        {wizardSteps.map((s) => (
          <button
            key={s.number}
            onClick={() => {
              if (s.number <= currentStep || (s.number === 2 && visualDirection)) {
                setCurrentStep(s.number);
              }
            }}
            disabled={s.number > currentStep && !(s.number === 2 && visualDirection)}
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
            <CardHeader className="bg-slate-50/70 border-b border-slate-100 p-6">
              <CardTitle className="text-xl font-bold flex items-center gap-2 text-gray-900">
                <Sparkles className="h-6 w-6 text-accent" />
                Etapa 1: O que você quer criar?
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">
                Conte sua ideia em palavras simples ou escolha um dos nossos modelos prontos. Você não precisa saber termos técnicos.
              </CardDescription>
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

                {/* Chips de Sugestão Rápida */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
                  <span className="text-xs text-gray-500 font-bold shrink-0 flex items-center gap-1">
                    💡 Exemplos rápidos para testar:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PLACEHOLDER_PROMPTS.slice(0, 3).map((promptSample, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setBrief(promptSample)}
                        className="text-xs bg-slate-100 hover:bg-orange-50 hover:text-accent hover:border-accent/40 border border-slate-200/80 text-slate-700 px-3 py-1.5 rounded-xl transition-all font-medium text-left truncate max-w-xs"
                      >
                        {promptSample}
                      </button>
                    ))}
                  </div>
                </div>
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

              {/* 4. Estilo Visual Desejado */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm sm:text-base font-bold text-gray-900">
                    4. Qual o estilo visual que você prefere?
                  </Label>
                  <span className="text-xs text-gray-400">Aparência da imagem</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {STYLE_OPTIONS.map((st) => {
                    const isSelected = style === st.id;
                    return (
                      <div
                        key={st.id}
                        onClick={() => setStyle(st.id)}
                        className={`flex flex-col justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer relative text-left min-h-[96px] ${
                          isSelected
                            ? "border-accent bg-orange-50/40 shadow-sm"
                            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-slate-50/50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{st.icon}</span>
                            <span className="text-sm font-bold text-gray-900">{st.label}</span>
                          </div>
                          {isSelected ? (
                            <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-gray-300 shrink-0" />
                          )}
                        </div>

                        <p className="text-xs text-gray-500 leading-snug mt-2">
                          {st.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
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
                        Usar identidade do negócio (BrandKit)
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
                  <div className="flex items-center gap-3 pt-2 text-xs text-gray-700 bg-white/90 p-3 rounded-xl border border-blue-100">
                    <div
                      className="h-5 w-5 rounded-full border border-gray-300 shadow-2xs shrink-0"
                      style={{
                        backgroundColor:
                          businessProfile.primaryColor ||
                          businessProfile.brandKit?.primaryColor ||
                          "#0083C7",
                      }}
                    />
                    <span className="font-bold text-gray-900">
                      {businessProfile.name || "Sua Empresa"}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-600 truncate">
                      Cores e identidade da marca ativos
                    </span>
                  </div>
                )}
              </div>

              {/* 8. Opções Adicionais (Colapsável para não assustar o usuário) */}
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
                  disabled={isLoadingDirection || !brief.trim()}
                  onClick={handleContinueWithBriefing}
                  className="w-full sm:w-auto bg-accent hover:bg-orange-600 text-white font-bold rounded-2xl h-12 px-8 text-base shadow-lg shadow-orange-100 flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
                >
                  {isLoadingDirection ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Interpretando Ideia...</span>
                    </>
                  ) : (
                    <>
                      <span>Continuar com este briefing</span>
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* ETAPA 2 — DIREÇÃO VISUAL INTERPRETADA                                     */}
      {/* ========================================================================= */}
      {currentStep === 2 && visualDirection && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card className="relative mx-auto w-full max-w-4xl overflow-hidden border-none shadow-lg bg-white rounded-2xl">
            <CardHeader className="bg-slate-50/70 border-b border-slate-100 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-xl font-bold flex items-center gap-2 text-gray-900">
                    <SlidersHorizontal className="h-6 w-6 text-accent" />
                    Etapa 2: Direção Visual Interpretada
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600">
                    Confira como a nossa inteligência artificial planejou sua imagem antes de gerar.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentStep(1)}
                  className="rounded-xl text-xs font-semibold h-9"
                >
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                  Ajustar Ideia
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6 sm:p-8 space-y-6">
              {/* Sugestões Alternativas se houver */}
              {alternativeDirections.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-700">
                    Escolha a abordagem visual que mais gosta:
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setSelectedDirectionIndex(0)}
                      className={`p-3.5 rounded-2xl text-left border-2 text-xs transition-all ${
                        selectedDirectionIndex === 0
                          ? "border-accent bg-orange-50/50 font-bold text-gray-900"
                          : "border-gray-200 hover:bg-slate-50 text-gray-700"
                      }`}
                    >
                      ⭐ Abordagem Principal
                    </button>
                    {alternativeDirections.map((alt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedDirectionIndex(i + 1)}
                        className={`p-3.5 rounded-2xl text-left border-2 text-xs transition-all ${
                          selectedDirectionIndex === i + 1
                            ? "border-accent bg-orange-50/50 font-bold text-gray-900"
                            : "border-gray-200 hover:bg-slate-50 text-gray-700"
                        }`}
                      >
                        {alt.style || `Opção Alternativa ${i + 2}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Cards Explicativos da Direção Visual */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1.5">
                  <span className="text-[11px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                    💡 Ideia Compreendida
                  </span>
                  <p className="text-sm font-semibold text-gray-900">
                    {visualDirection.interpretation}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1.5">
                  <span className="text-[11px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                    🎯 Elemento Principal
                  </span>
                  <p className="text-sm font-semibold text-gray-900">{visualDirection.subject}</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1.5">
                  <span className="text-[11px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                    🏞️ Cenário & Composição
                  </span>
                  <p className="text-sm font-medium text-gray-700">
                    {visualDirection.composition}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1.5">
                  <span className="text-[11px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                    🌟 Iluminação & Clima
                  </span>
                  <p className="text-sm font-medium text-gray-700">{visualDirection.lighting}</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1.5">
                  <span className="text-[11px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                    🏷️ Cores & Marca
                  </span>
                  <p className="text-sm font-medium text-gray-700">
                    {visualDirection.brandApplication}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1.5">
                  <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1">
                    🚫 O que NÃO haverá na imagem
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {visualDirection.avoid.map((av, idx) => (
                      <Badge key={idx} variant="secondary" className="text-[11px] bg-rose-50 text-rose-600 border-none font-medium">
                        ✕ {av}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Botões de Ação da Etapa 2 */}
              <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  className="rounded-2xl text-xs font-semibold text-gray-600 hover:text-gray-900 h-11"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar e alterar ideias
                </Button>

                <Button
                  type="button"
                  size="lg"
                  disabled={isGenerating}
                  onClick={handleStartGeneration}
                  className="w-full sm:w-auto bg-accent hover:bg-orange-600 text-white font-bold rounded-2xl h-12 px-10 text-base shadow-lg shadow-orange-100 flex items-center justify-center gap-2"
                >
                  <Sparkles className="h-5 w-5" />
                  Gerar Agora com IA
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* ETAPA 3 — GERAÇÃO DE IMAGENS & RESULTADOS                                 */}
      {/* ========================================================================= */}
      {currentStep === 3 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-accent" />
                Etapa 3: Sua Imagem Gerada
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">
                Veja o resultado gerado pela IA. Você pode adicionar textos, tirar o fundo ou usá-la no seu post.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(1)}
                className="rounded-2xl text-xs font-semibold h-10 px-4"
              >
                Novo Briefing
              </Button>
              {assets.some((a) => a.status === "ready") && (
                <Button
                  size="sm"
                  onClick={() => setCurrentStep(5)}
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
                <div className="relative aspect-square w-full bg-slate-900 flex items-center justify-center overflow-hidden">
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

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEditor(asset)}
                        className="rounded-xl text-xs font-bold border-slate-200 hover:bg-blue-50 hover:text-primary h-9"
                      >
                        <Edit3 className="h-3.5 w-3.5 mr-1.5 text-primary" />
                        Adicionar Textos
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        disabled={removingBgAssetId === asset.id}
                        onClick={() => handleRemoveBackground(asset)}
                        className="rounded-xl text-xs font-bold border-slate-200 hover:bg-orange-50 hover:text-accent h-9"
                      >
                        {removingBgAssetId === asset.id ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <Scissors className="h-3.5 w-3.5 mr-1.5 text-accent" />
                        )}
                        Tirar Fundo
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => handleUseInPost(asset)}
                        className="rounded-xl text-xs font-bold bg-primary hover:bg-blue-600 text-white h-9"
                      >
                        <Send className="h-3.5 w-3.5 mr-1.5" />
                        Usar em Post
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(asset.originalUrl, `numvapt_opcao_${idx + 1}.png`)}
                        className="rounded-xl text-xs font-bold border-slate-200 hover:bg-slate-50 h-9"
                      >
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        Baixar
                      </Button>
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
      {/* ETAPA 4 — MODAL INTEGRADO DE MARCA & EDIÇÃO                              */}
      {/* ========================================================================= */}
      {isEditorOpen && selectedAssetForEdit && (
        <ImageInpaintModal
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          imageUrl={selectedAssetForEdit.originalUrl || ""}
          prompt={brief}
          postId={generationId || "general_image"}
          userId={user?.uid || ""}
          fileName={selectedAssetForEdit.id}
          onSuccess={(newUrl) => handleEditorSuccess(newUrl)}
          brandKitPrimaryColor={businessProfile?.primaryColor || businessProfile?.brandKit?.primaryColor}
          brandKitSecondaryColor={businessProfile?.secondaryColor || businessProfile?.brandKit?.secondaryColor}
        />
      )}

      {/* ========================================================================= */}
      {/* ETAPA 5 — CONCLUSÃO, SALVAMENTO & GALERIA                                */}
      {/* ========================================================================= */}
      {currentStep === 5 && (
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
                      <div className="relative aspect-square w-full rounded-xl overflow-hidden shadow-inner">
                        <img
                          src={readyAsset.originalUrl}
                          alt="Imagem Pronta"
                          className="h-full w-full object-cover"
                        />
                      </div>

                      {/* Metadados Exibidos */}
                      <div className="space-y-1.5 text-xs text-gray-600 bg-white p-3 rounded-xl border border-gray-100">
                        <div className="flex justify-between">
                          <span className="font-bold text-gray-700">Ideia:</span>
                          <span className="truncate max-w-[200px] text-gray-800">{brief}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-bold text-gray-700">Formato:</span>
                          <span className="font-semibold">{FORMAT_DIMENSIONS[format].label}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-bold text-gray-700">Estilo:</span>
                          <span className="capitalize">{style}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 pt-1">
                        <Button
                          onClick={() => handleUseInPost(readyAsset)}
                          className="w-full bg-accent hover:bg-orange-600 text-white font-bold rounded-xl text-xs h-10 shadow-sm"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Criar Post com Esta Imagem
                        </Button>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => handleDownload(readyAsset.originalUrl, `numvapt_final_${idx + 1}.png`)}
                            className="flex-1 rounded-xl text-xs font-bold h-9 border-slate-200 hover:bg-slate-100"
                          >
                            <Download className="h-3.5 w-3.5 mr-1" />
                            Baixar Foto
                          </Button>

                          <Button
                            variant="outline"
                            onClick={() => handleOpenEditor(readyAsset)}
                            className="flex-1 rounded-xl text-xs font-bold h-9 border-slate-200 hover:bg-slate-100"
                          >
                            <Edit3 className="h-3.5 w-3.5 mr-1" />
                            Editar
                          </Button>
                        </div>
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
                  onClick={() => {
                    setBrief("");
                    setReferenceImages([]);
                    setSourceImage(null);
                    setAssets([]);
                    setCurrentStep(1);
                  }}
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
