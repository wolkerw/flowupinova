"use client";

import React, { useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  UploadCloud,
  Loader2,
  Sparkles,
  CheckCircle2,
  Printer,
  Brain,
  Palette,
  Users,
  Compass,
  Smile,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Copy,
  Check,
  RefreshCw,
  Target,
  Camera,
  Calendar,
  Globe,
  Instagram,
  Facebook,
  ShieldCheck,
} from "lucide-react";
import type { BrandBookData } from "@/lib/types/brandbook";
import type { OnboardingPersona } from "@/lib/services/onboarding-service";
import { getInstagramConnection, type InstagramConnectionData } from "@/lib/services/instagram-service";

interface BrandBookGeneratorTabProps {
  onApplyToBrain: (data: {
    primaryColor: string;
    secondaryColor: string;
    primaryFont: string;
    secondaryFont: string;
    fontStyle: string;
    slogan: string;
    toneOfVoice: string;
    targetAudience: string;
    mainBenefits: string[];
    visualGuidelines: string;
    personas: OnboardingPersona[];
    description: string;
  }) => Promise<void>;
  currentBrandName?: string;
  currentSegment?: string;
  userId?: string;
  website?: string;
}

export function BrandBookGeneratorTab({
  onApplyToBrain,
  currentBrandName = "",
  currentSegment = "",
  userId = "",
  website = "",
}: BrandBookGeneratorTabProps) {
  const [instagramConnection, setInstagramConnection] = useState<InstagramConnectionData | null>(null);
  const [syncWithSettings, setSyncWithSettings] = useState(true);

  React.useEffect(() => {
    async function loadConnections() {
      if (!userId) return;
      try {
        const conn = await getInstagramConnection(userId);
        setInstagramConnection(conn);
      } catch (err) {
        console.warn("Erro ao buscar conexões do Instagram no BrandBook:", err);
      }
    }
    loadConnections();
  }, [userId]);
  const { toast } = useToast();

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [brandNameHint, setBrandNameHint] = useState(currentBrandName);
  const [segmentHint, setSegmentHint] = useState(currentSegment);
  const [showOptionalHints, setShowOptionalHints] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(1);
  const [brandBook, setBrandBook] = useState<BrandBookData | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [identifiedCompetitors, setIdentifiedCompetitors] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem válida (PNG, JPG, SVG ou WEBP).",
        variant: "destructive",
      });
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setLogoPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGenerateBrandBook = async () => {
    if (!logoPreview) {
      toast({
        title: "Logomarca necessária",
        description: "Envie a imagem da sua logomarca para a inteligência artificial analisar.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGenerationStep(1);

    // Efeito de progresso dinâmico de etapas
    const stepTimer1 = setTimeout(() => setGenerationStep(2), 5000);
    const stepTimer2 = setTimeout(() => setGenerationStep(3), 12000);
    const stepTimer3 = setTimeout(() => setGenerationStep(4), 22000);

    try {
      const res = await fetch("/api/ai/generate-brandbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: logoPreview,
          mimeType: logoFile?.type || "image/png",
          brandNameHint: brandNameHint.trim() || undefined,
          segmentHint: segmentHint.trim() || undefined,
          websiteHint: website.trim() || undefined,
          syncBusinessSettings: syncWithSettings,
        }),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);

      const data = await res.json();

      if (!res.ok || !data.success || !data.brandBook) {
        throw new Error(data.error || "Falha ao gerar Brand Book com IA.");
      }

      setBrandBook(data.brandBook);
      if (Array.isArray(data.socialIntelligence?.competitors)) {
        setIdentifiedCompetitors(data.socialIntelligence.competitors);
      }

      toast({
        title: "Brand Book Gerado com Sucesso!",
        description: data.socialIntelligence?.competitors?.length
          ? `Estratégia construída com sucesso, considerando ${data.socialIntelligence.competitors.length} concorrentes mapeados na web.`
          : "A estratégia e identidade completa da sua marca foram construídas com sucesso.",
        variant: "success",
      });
    } catch (err: any) {
      console.error("Erro na geração do Brand Book:", err);
      toast({
        title: "Erro na geração",
        description: err.message || "Ocorreu um erro ao gerar o Brand Book. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = async () => {
    if (!brandBook) return;

    setIsApplying(true);
    try {
      const primary = brandBook.identidadeVisual.paletaCromatica?.[0]?.hex || "#0083C7";
      const secondary = brandBook.identidadeVisual.paletaCromatica?.[1]?.hex || "#1E293B";

      const mappedPersonas: OnboardingPersona[] = (brandBook.publicosEPersonas.personas || []).map(
        (p) => ({
          name: p.nome || "Persona",
          profile: p.perfil || p.subtitulo || "Perfil Estratégico",
          painPoints: p.dores || "",
          buyingMotivation: p.objetivos || p.oQueGeraConfianca || "",
        })
      );

      const benefits = (brandBook.posicionamento.diferenciais || [])
        .map((d) => d.diferencial)
        .filter(Boolean);

      await onApplyToBrain({
        primaryColor: primary,
        secondaryColor: secondary,
        primaryFont: brandBook.identidadeVisual.tipografia.fonteTitulos || "Montserrat",
        secondaryFont: brandBook.identidadeVisual.tipografia.fonteTextos || "Inter",
        fontStyle: brandBook.identidadeVisual.tipografia.estiloGeral || "Moderno e Intencional",
        slogan: brandBook.posicionamento.taglineRecomendada || "",
        toneOfVoice: brandBook.tomDeVoz.principioVerbal || "",
        targetAudience:
          brandBook.posicionamento.declaracaoPosicionamento ||
          brandBook.posicionamento.propostaDeValor ||
          "",
        mainBenefits: benefits.length > 0 ? benefits : ["Qualidade", "Agilidade"],
        visualGuidelines: `${brandBook.direcaoDeArteEFotografia.direcaoFotografia}\n\nDiretrizes IA: ${brandBook.direcaoDeArteEFotografia.diretrizesParaImagensIA}`,
        personas: mappedPersonas,
        description: brandBook.posicionamento.propostaDeValor || brandBook.fundamentos.missao,
      });

      toast({
        title: "Cérebro do Negócio Atualizado!",
        description:
          "Brand Book aplicado com sucesso! Suas personas existentes foram mantidas e somadas às novas sugestões da IA.",
        variant: "success",
      });
    } catch (err: any) {
      toast({
        title: "Erro ao aplicar",
        description: err.message || "Não foi possível salvar os dados no perfil.",
        variant: "destructive",
      });
    } finally {
      setIsApplying(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHex(text);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Card de Apresentação e Upload */}
      <Card className="border-blue-100 bg-gradient-to-br from-blue-50/40 via-white to-slate-50 shadow-md">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Inteligência Estratégica NumVapt
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
                Gerador de Brand Book Completo por IA
              </CardTitle>
              <CardDescription className="text-sm text-slate-600 max-w-2xl">
                Envie apenas a imagem da sua logomarca. Nossa inteligência artificial analisa a
                semiótica, formas e paleta para construir um manual executivo de marca de 16
                capítulos: propósito, tom de voz, personas, arquétipos, regras editoriais e campanhas.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Zona de Upload */}
          <div className="rounded-xl border-2 border-dashed border-blue-200 bg-white p-6 transition-all hover:border-primary/60">
            {logoPreview ? (
              <div className="flex flex-col items-center justify-center gap-4 text-center">
                <div className="relative flex h-36 w-36 items-center justify-center rounded-xl border bg-slate-50 p-2 shadow-inner">
                  <img
                    src={logoPreview}
                    alt="Preview da Logomarca"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {logoFile?.name || "Logomarca carregada"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Imagem pronta para análise semiótica e estruturação de branding.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isGenerating}
                  >
                    Trocar Imagem
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveLogo}
                    disabled={isGenerating}
                    className="text-red-600 hover:bg-red-50"
                  >
                    Remover
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className="flex cursor-pointer flex-col items-center justify-center gap-3 py-6 text-center"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <UploadCloud className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-semibold text-slate-800">
                    Clique aqui ou arraste a imagem da sua logomarca
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Formatos suportados: PNG, JPG, SVG ou WEBP com fundo transparente ou sólido
                  </p>
                </div>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Dicas Opcionais Expansíveis */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
            <button
              type="button"
              onClick={() => setShowOptionalHints(!showOptionalHints)}
              className="flex w-full items-center justify-between text-xs font-semibold text-slate-700 hover:text-slate-900"
            >
              <span>Refinar análise com dados adicionais (100% Opcional)</span>
              {showOptionalHints ? (
                <ChevronUp className="h-4 w-4 text-slate-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-500" />
              )}
            </button>

            {showOptionalHints && (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2 border-t border-slate-200">
                <div className="space-y-1.5">
                  <Label htmlFor="brandHint" className="text-xs font-medium text-slate-700">
                    Nome da Marca (Opcional)
                  </Label>
                  <Input
                    id="brandHint"
                    placeholder="Ex: Home Produtora"
                    value={brandNameHint}
                    onChange={(e) => setBrandNameHint(e.target.value)}
                    className="bg-white text-xs h-9"
                    disabled={isGenerating}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Caso a logo seja apenas um símbolo ou monograma sem texto legível.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="segmentHint" className="text-xs font-medium text-slate-700">
                    Segmento de Atuação (Opcional)
                  </Label>
                  <Input
                    id="segmentHint"
                    placeholder="Ex: Produtora Audiovisual e Criação de Conteúdo"
                    value={segmentHint}
                    onChange={(e) => setSegmentHint(e.target.value)}
                    className="bg-white text-xs h-9"
                    disabled={isGenerating}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Orienta o modelo para focar na indústria e nicho específico da sua empresa.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>

          {/* Inteligência Digital Ativa (Pesquisa em Segundo Plano) */}
          <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-cyan-50/60 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <ShieldCheck className="h-4 w-4 text-cyan-600" />
                  Pesquisa Ativa no Ecossistema Digital
                </span>
                <p className="text-[11px] text-slate-600">
                  Cruzamento automático com a presença digital da empresa para gerar o Brand Book perfeito sem esforço.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                {instagramConnection?.isConnected ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-800 font-medium">
                    <Instagram className="h-3.5 w-3.5" />
                    {instagramConnection.instagramUsername ? `@${instagramConnection.instagramUsername.replace(/^@/, "")}` : "Instagram Ativo"}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-200/80 px-2.5 py-1 text-slate-600 font-normal">
                    <Instagram className="h-3.5 w-3.5 text-slate-400" />
                    Instagram Desconectado
                  </span>
                )}

                {website ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-cyan-100 px-2.5 py-1 text-cyan-800 font-medium max-w-[200px] truncate" title={website}>
                    <Globe className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{website.replace(/^https?:\/\//, "")}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-200/80 px-2.5 py-1 text-slate-600 font-normal">
                    <Globe className="h-3.5 w-3.5 text-slate-400" />
                    Site não informado
                  </span>
                )}

                <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-violet-800 font-medium">
                  <Target className="h-3.5 w-3.5" />
                  Benchmark de Concorrentes Ativo
                </span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200/70 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={syncWithSettings}
                  onChange={(e) => setSyncWithSettings(e.target.checked)}
                  className="rounded border-slate-300 text-primary focus:ring-primary h-3.5 w-3.5"
                />
                <span>Sincronizar cores e estratégia geradas automaticamente com o Perfil da Empresa</span>
              </label>
            </div>
          </div>

        <CardFooter className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t pt-4">
          <div className="text-xs text-muted-foreground">
            {isGenerating ? (
              <span className="flex items-center gap-1.5 text-primary font-medium">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Construindo Brand Book executivo em tempo real...
              </span>
            ) : (
              <span>Duração estimada: ~30 segundos para gerar o manual completo.</span>
            )}
          </div>

          <Button
            type="button"
            onClick={handleGenerateBrandBook}
            disabled={!logoPreview || isGenerating}
            className="w-full sm:w-auto bg-primary text-white shadow-md hover:bg-primary/90 h-11 px-6 font-semibold"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando Brand Book...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Gerar Brand Book Completo
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Stepper de Progresso quando está gerando */}
      {isGenerating && (
        <Card className="border-blue-200 bg-blue-50/50 p-6 animate-pulse">
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Desenvolvendo o Brand Book da sua Marca:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div
                className={`rounded-lg p-3 border ${
                  generationStep >= 1
                    ? "bg-white border-primary text-primary font-semibold shadow-xs"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                1. Redes, Web & Concorrentes
                <p className="text-[10px] font-normal text-muted-foreground mt-0.5">
                  Mapeando presença e concorrência
                </p>
              </div>
              <div
                className={`rounded-lg p-3 border ${
                  generationStep >= 2
                    ? "bg-white border-primary text-primary font-semibold shadow-xs"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                2. Semiótica da Logo
                <p className="text-[10px] font-normal text-muted-foreground mt-0.5">
                  Cores hex e geometria visual
                </p>
              </div>
              <div
                className={`rounded-lg p-3 border ${
                  generationStep >= 3
                    ? "bg-white border-primary text-primary font-semibold shadow-xs"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                3. Tom de Voz & Campanhas
                <p className="text-[10px] font-normal text-muted-foreground mt-0.5">
                  Regras editoriais e slogans
                </p>
              </div>
              <div
                className={`rounded-lg p-3 border ${
                  generationStep >= 4
                    ? "bg-white border-primary text-primary font-semibold shadow-xs"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                4. Consolidação Executiva
                <p className="text-[10px] font-normal text-muted-foreground mt-0.5">
                  Finalização do Brand Book
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Visualizador do Brand Book Gerado */}
      {brandBook && (
        <div className="space-y-8 pt-4">
          {/* Tarja de Concorrentes Identificados na Web */}
          {identifiedCompetitors.length > 0 && (
            <div className="rounded-xl border border-violet-200 bg-gradient-to-r from-violet-50/80 to-indigo-50/70 p-4 text-xs text-violet-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="space-y-0.5">
                <span className="font-bold flex items-center gap-1.5 text-violet-900">
                  <Target className="h-4 w-4 text-violet-600" />
                  Benchmark Competitivo Mapeado na Web:
                </span>
                <p className="text-[11px] text-violet-700">
                  Concorrentes e alternativas reais analisados para calibrar os diferenciais exclusivos da sua marca:
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {identifiedCompetitors.map((comp, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-violet-800 border border-violet-200 shadow-2xs"
                  >
                    {comp}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Barra de Ações Rápidas do Brand Book */}
          <div className="sticky top-4 z-20 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  Brand Book • {brandBook.meta.brandName}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Versão {brandBook.meta.version} • {brandBook.meta.generatedAt}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="gap-1.5 text-xs font-semibold"
              >
                <Printer className="h-4 w-4" />
                Imprimir / Salvar em PDF
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleApply}
                disabled={isApplying}
                className="gap-1.5 bg-primary text-white hover:bg-primary/90 text-xs font-semibold shadow-sm"
              >
                {isApplying ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Aplicando...
                  </>
                ) : (
                  <>
                    <Brain className="h-3.5 w-3.5" />
                    Aplicar ao Cérebro do Negócio
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* DOCUMENTO DIAGRAMADO: 12 SEÇÕES EXECUTIVAS */}
          <div id="brandbook-printable" className="space-y-8">
            {/* CAPA & RESUMO EXECUTIVO */}
            <Card className="border-none shadow-md overflow-hidden bg-slate-900 text-white">
              <CardContent className="p-8 sm:p-12 relative">
                <div className="max-w-2xl space-y-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary font-bold">
                    <span>BRAND BOOK OFICIAL</span>
                    <span>•</span>
                    <span>{brandBook.meta.segment}</span>
                  </div>
                  <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-white">
                    {brandBook.meta.brandName}
                  </h1>
                  <p className="text-lg text-slate-300 leading-relaxed font-light">
                    {brandBook.posicionamento.propostaDeValor}
                  </p>
                  <div className="pt-4 flex flex-wrap gap-2">
                    {brandBook.fundamentos.personalidadeCincoPalavras.map((word) => (
                      <span
                        key={word}
                        className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
                {logoPreview && (
                  <div className="mt-8 sm:mt-0 sm:absolute sm:right-12 sm:top-1/2 sm:-translate-y-1/2 flex h-32 w-32 items-center justify-center rounded-2xl bg-white/10 p-3 backdrop-blur border border-white/20">
                    <img
                      src={logoPreview}
                      alt={brandBook.meta.brandName}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* SEÇÃO 01: FUNDAMENTOS DA MARCA */}
            <Card className="border-none shadow-md">
              <CardHeader className="border-b pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Compass className="h-5 w-5 text-primary" />
                  01. Fundamentos da Marca
                </CardTitle>
                <CardDescription>Propósito, missão, visão e valores práticos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div className="space-y-1.5 rounded-xl border bg-slate-50/50 p-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                      Propósito
                    </span>
                    <p className="text-sm font-semibold text-slate-900 leading-snug">
                      "{brandBook.fundamentos.proposito}"
                    </p>
                  </div>
                  <div className="space-y-1.5 rounded-xl border bg-slate-50/50 p-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                      Missão
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {brandBook.fundamentos.missao}
                    </p>
                  </div>
                  <div className="space-y-1.5 rounded-xl border bg-slate-50/50 p-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                      Visão
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {brandBook.fundamentos.visao}
                    </p>
                  </div>
                </div>

                {/* Tabela de Valores na Prática */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Valores e Como Aparecem na Prática
                  </h4>
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-semibold">
                        <tr>
                          <th className="p-3 w-1/3">Valor</th>
                          <th className="p-3">Como Aparece na Prática</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {brandBook.fundamentos.valores.map((v, i) => (
                          <tr key={i} className="hover:bg-slate-50/60">
                            <td className="p-3 font-semibold text-slate-900">{v.valor}</td>
                            <td className="p-3 text-slate-600">{v.comoApareceNaPratica}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Promessa e Razões para Acreditar */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
                  <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">
                      Promessa da Marca
                    </span>
                    <p className="text-xs text-slate-800 leading-relaxed">
                      {brandBook.fundamentos.promessaDaMarca}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Razões para Acreditar (RTBs)
                    </span>
                    <ul className="list-disc pl-4 text-xs text-slate-700 space-y-1">
                      {brandBook.fundamentos.razoesParaAcreditar.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SEÇÃO 02: POSICIONAMENTO & PROPOSTA DE VALOR */}
            <Card className="border-none shadow-md">
              <CardHeader className="border-b pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5 text-primary" />
                  02. Posicionamento e Proposta de Valor
                </CardTitle>
                <CardDescription>
                  Declaração formal, categoria mental e diferenciais competitivos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    Declaração de Posicionamento
                  </span>
                  <p className="text-sm text-slate-800 leading-relaxed">
                    {brandBook.posicionamento.declaracaoPosicionamento}
                  </p>
                  <p className="text-xs font-semibold text-slate-600 pt-1">
                    Categoria Mental Desejada:{" "}
                    <span className="text-primary font-bold">
                      {brandBook.posicionamento.categoriaMentalDesejada}
                    </span>
                  </p>
                </div>

                {/* Taglines e Slogans */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-4 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                      Tagline Recomendada (Slogan Oficial)
                    </span>
                    <p className="text-base font-bold text-slate-900">
                      "{brandBook.posicionamento.taglineRecomendada}"
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Alternativas para Campanhas
                    </span>
                    <div className="space-y-0.5">
                      {brandBook.posicionamento.alternativasCampanhas.map((alt, i) => (
                        <p key={i} className="text-xs text-slate-700">
                          • {alt}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tabela de Diferenciais */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Diferenciais a Demonstrar — Não apenas Declarar
                  </h4>
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-semibold">
                        <tr>
                          <th className="p-3 w-1/4">Diferencial</th>
                          <th className="p-3 w-1/3">Evidência Prática</th>
                          <th className="p-3">Como Comunicar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {brandBook.posicionamento.diferenciais.map((d, i) => (
                          <tr key={i} className="hover:bg-slate-50/60">
                            <td className="p-3 font-semibold text-slate-900">{d.diferencial}</td>
                            <td className="p-3 text-slate-600">{d.evidenciaPratica}</td>
                            <td className="p-3 italic text-primary font-medium">"{d.comoComunicar}"</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Posicionamentos a Evitar */}
                <div className="rounded-xl border border-red-100 bg-red-50/30 p-4 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-700">
                    Posicionamentos a Evitar (Antítese da Marca)
                  </span>
                  <ul className="list-disc pl-4 text-xs text-red-900 space-y-1">
                    {brandBook.posicionamento.posicionamentosAEvitar.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* SEÇÃO 03: PÚBLICOS & 4 PERSONAS ESTRATÉGICAS */}
            <Card className="border-none shadow-md">
              <CardHeader className="border-b pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-primary" />
                  03. Públicos Prioritários e Matriz de Personas
                </CardTitle>
                <CardDescription>
                  Segmentos prioritários e 4 personas detalhadas com linguagem sob medida
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* Tabela de Segmentos */}
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-semibold">
                      <tr>
                        <th className="p-3">Segmento</th>
                        <th className="p-3">O que Precisa</th>
                        <th className="p-3">Soluções com Aderência</th>
                        <th className="p-3 text-center">Prioridade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {brandBook.publicosEPersonas.segmentos.map((s, i) => (
                        <tr key={i} className="hover:bg-slate-50/60">
                          <td className="p-3 font-semibold text-slate-900">{s.segmento}</td>
                          <td className="p-3 text-slate-600">{s.oQuePrecisa}</td>
                          <td className="p-3 text-slate-600">{s.solucoesComAderencia}</td>
                          <td className="p-3 text-center">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                s.prioridade === "Alta"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {s.prioridade}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Cards das 4 Personas */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {brandBook.publicosEPersonas.personas.map((persona, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 shadow-xs hover:border-primary/40 transition-all"
                    >
                      <div className="border-b pb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                          Persona {index + 1}
                        </span>
                        <h4 className="text-base font-bold text-slate-900">{persona.nome}</h4>
                        <p className="text-xs text-slate-500 italic">{persona.subtitulo}</p>
                      </div>

                      <div className="space-y-2 text-xs text-slate-700">
                        <p>
                          <strong>Perfil:</strong> {persona.perfil}
                        </p>
                        <p>
                          <strong>Dores:</strong> {persona.dores}
                        </p>
                        <p>
                          <strong>Objeções:</strong> {persona.objecoes}
                        </p>
                        <p>
                          <strong>O que gera confiança:</strong> {persona.oQueGeraConfianca}
                        </p>
                      </div>

                      <div className="rounded-lg bg-blue-50/70 p-3 text-xs border border-blue-100">
                        <strong className="block text-[10px] uppercase font-bold text-blue-900">
                          Mensagem-Chave para Ela:
                        </strong>
                        <p className="text-blue-950 font-medium italic mt-0.5">
                          "{persona.mensagemParaEla}"
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* SEÇÃO 04: ARQUÉTIPOS & TOM DE VOZ */}
            <Card className="border-none shadow-md">
              <CardHeader className="border-b pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Smile className="h-5 w-5 text-primary" />
                  04. Arquétipos, Personalidade e Tom de Voz
                </CardTitle>
                <CardDescription>
                  Postura verbal, dimensões da fala e regras editoriais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* Tríade de Arquétipos */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                      Arquétipo Principal
                    </span>
                    <h5 className="text-sm font-bold text-slate-900">
                      {brandBook.arquetiposEPersonalidade.arquetipoPrincipal.nome}
                    </h5>
                    <p className="text-xs text-slate-600">
                      {brandBook.arquetiposEPersonalidade.arquetipoPrincipal.descricao}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Arquétipo Secundário
                    </span>
                    <h5 className="text-sm font-bold text-slate-900">
                      {brandBook.arquetiposEPersonalidade.arquetipoSecundario.nome}
                    </h5>
                    <p className="text-xs text-slate-600">
                      {brandBook.arquetiposEPersonalidade.arquetipoSecundario.descricao}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Traço Relacional
                    </span>
                    <h5 className="text-sm font-bold text-slate-900">
                      {brandBook.arquetiposEPersonalidade.tracoRelacionalDeApoio.nome}
                    </h5>
                    <p className="text-xs text-slate-600">
                      {brandBook.arquetiposEPersonalidade.tracoRelacionalDeApoio.descricao}
                    </p>
                  </div>
                </div>

                {/* Tabela de Equilíbrio: A marca é / Não é */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Equilíbrio da Personalidade
                  </h4>
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-semibold">
                        <tr>
                          <th className="p-3 w-1/2">A marca é...</th>
                          <th className="p-3 w-1/2">Não é...</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {brandBook.arquetiposEPersonalidade.equilibrioPersonalidade.map((eq, i) => (
                          <tr key={i} className="hover:bg-slate-50/60">
                            <td className="p-3 font-semibold text-emerald-800">✓ {eq.aMarcaE}</td>
                            <td className="p-3 text-red-700">✗ {eq.naoE}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Princípio Verbal & Dimensões */}
                <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900">
                    Princípio Verbal Oficial
                  </span>
                  <p className="text-sm font-bold text-slate-900">
                    "{brandBook.tomDeVoz.principioVerbal}"
                  </p>
                </div>

                {/* Dimensões do Tom de Voz */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Dimensões do Tom e Exemplos Práticos
                  </h4>
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-semibold">
                        <tr>
                          <th className="p-3 w-1/4">Dimensão</th>
                          <th className="p-3 w-1/3">Diretriz</th>
                          <th className="p-3">Exemplo Real</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {brandBook.tomDeVoz.dimensoes.map((dim, i) => (
                          <tr key={i} className="hover:bg-slate-50/60">
                            <td className="p-3 font-semibold text-slate-900">{dim.dimensao}</td>
                            <td className="p-3 text-slate-600">{dim.diretriz}</td>
                            <td className="p-3 italic text-primary">"{dim.exemplo}"</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SEÇÃO 05: IDENTIDADE VISUAL & PALETA CROMÁTICA */}
            <Card className="border-none shadow-md">
              <CardHeader className="border-b pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Palette className="h-5 w-5 text-primary" />
                  05. Sistema de Identidade Visual & Cores
                </CardTitle>
                <CardDescription>
                  Semiótica da logo, paleta extraída e hierarquia tipográfica
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="rounded-xl border bg-slate-50/50 p-4 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    Ideia Visual & Semiótica
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {brandBook.identidadeVisual.ideiaVisual}
                  </p>
                </div>

                {/* Paleta de Cores Extraída */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Paleta Cromática Oficial
                    </h4>
                    <span className="text-xs text-slate-500">
                      Proporção: <strong>{brandBook.identidadeVisual.proporcaoRecomendada}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {brandBook.identidadeVisual.paletaCromatica.map((cor, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-slate-200 bg-white p-3 space-y-2 shadow-xs"
                      >
                        <div
                          className="h-16 w-full rounded-lg shadow-inner flex items-end justify-end p-1.5"
                          style={{ backgroundColor: cor.hex }}
                        >
                          <button
                            type="button"
                            onClick={() => copyToClipboard(cor.hex)}
                            className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-mono text-white hover:bg-black"
                            title="Copiar HEX"
                          >
                            {copiedHex === cor.hex ? <Check className="h-3 w-3 inline" /> : cor.hex}
                          </button>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{cor.nomeCor}</p>
                          <p className="text-[10px] text-slate-500">{cor.papel}</p>
                          <p className="text-[10px] text-muted-foreground mt-1 truncate">
                            {cor.usoSugerido}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tipografia */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Sistema Tipográfico Recomendado
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-xl border p-3 bg-white">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Títulos</span>
                      <p className="text-sm font-bold text-slate-900 mt-1">
                        {brandBook.identidadeVisual.tipografia.fonteTitulos}
                      </p>
                    </div>
                    <div className="rounded-xl border p-3 bg-white">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Textos</span>
                      <p className="text-sm font-bold text-slate-900 mt-1">
                        {brandBook.identidadeVisual.tipografia.fonteTextos}
                      </p>
                    </div>
                    <div className="rounded-xl border p-3 bg-white">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Estilo</span>
                      <p className="text-xs text-slate-700 mt-1">
                        {brandBook.identidadeVisual.tipografia.estiloGeral}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SEÇÃO 06: DIREÇÃO DE ARTE & FOTOGRAFIA PARA IA */}
            <Card className="border-none shadow-md">
              <CardHeader className="border-b pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Camera className="h-5 w-5 text-primary" />
                  06. Direção de Arte e Fotografia (Diretrizes para a IA)
                </CardTitle>
                <CardDescription>
                  Padrões que guiam a criação das imagens e renderizações dos posts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    Diretriz Fotográfica Principal
                  </span>
                  <p className="text-xs text-slate-800 leading-relaxed">
                    {brandBook.direcaoDeArteEFotografia.direcaoFotografia}
                  </p>
                </div>

                <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900">
                    Instrução Mestre para os Geradores de Imagem da IA
                  </span>
                  <p className="text-xs font-mono text-blue-950 leading-relaxed bg-white/70 p-3 rounded-lg border border-blue-200">
                    {brandBook.direcaoDeArteEFotografia.diretrizesParaImagensIA}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Esta instrução é automaticamente injetada no motor de imagem quando você clica em
                    "Aplicar ao Cérebro do Negócio".
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* SEÇÃO 07: ESTRATÉGIA DE CONTEÚDO & CAMPANHAS PRONTAS */}
            <Card className="border-none shadow-md">
              <CardHeader className="border-b pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="h-5 w-5 text-primary" />
                  07. Estratégia de Conteúdo e Campanhas
                </CardTitle>
                <CardDescription>
                  Linha editorial percentual, exemplos práticos de copy e bio
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* Pilares Editoriais */}
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-semibold">
                      <tr>
                        <th className="p-3">Pilar Editorial</th>
                        <th className="p-3 text-center">Peso</th>
                        <th className="p-3">Exemplos de Pautas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {brandBook.estrategiaConteudoECanais.pilaresEditoriais.map((p, i) => (
                        <tr key={i} className="hover:bg-slate-50/60">
                          <td className="p-3 font-semibold text-slate-900">{p.pilar}</td>
                          <td className="p-3 text-center font-bold text-primary">
                            {p.participacaoSugerida}
                          </td>
                          <td className="p-3 text-slate-600">{p.exemplos}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Exemplo de Legenda Pronta e Bio */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Exemplo de Legenda para Redes Sociais
                    </span>
                    <p className="text-xs text-slate-800 leading-relaxed italic bg-slate-50 p-3 rounded-lg border">
                      "{brandBook.campanhasESlogans.exemploLegendaSocial}"
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Bio Oficial para Instagram
                    </span>
                    <p className="text-xs text-slate-800 leading-relaxed font-mono bg-slate-50 p-3 rounded-lg border">
                      {brandBook.campanhasESlogans.exemploBioInstagram}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Headline do Site: <strong>{brandBook.campanhasESlogans.headlineSite}</strong>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SEÇÃO 08: PLANO DE IMPLANTAÇÃO 90 DIAS */}
            <Card className="border-none shadow-md">
              <CardHeader className="border-b pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                  08. Plano de Implantação em 90 Dias & Governança
                </CardTitle>
                <CardDescription>
                  Passo a passo quinzenal para consolidação da marca
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                  {brandBook.metricasEGovernanca.planoImplantacao90Dias.map((fase, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-slate-200 bg-white p-4 space-y-1.5 shadow-xs"
                    >
                      <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary uppercase">
                        {fase.periodo}
                      </span>
                      <h5 className="text-xs font-bold text-slate-900">{fase.prioridades}</h5>
                      <p className="text-[11px] text-slate-600 leading-snug">{fase.entregaveis}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rodapé com Botão de Aplicação */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-blue-200 bg-blue-50/70 p-6">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-base font-bold text-slate-900">
                Gostou deste Brand Book Estratégico?
              </h4>
              <p className="text-xs text-slate-600">
                Transfira todas as cores, personas, slogans e regras de foto diretamente para o
                Cérebro do Negócio.
              </p>
            </div>
            <Button
              type="button"
              onClick={handleApply}
              disabled={isApplying}
              className="bg-primary text-white hover:bg-primary/90 h-11 px-6 font-semibold shadow-md shrink-0 w-full sm:w-auto"
            >
              {isApplying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Aplicando Diretrizes...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  Aplicar Diretrizes ao Cérebro do Negócio
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
