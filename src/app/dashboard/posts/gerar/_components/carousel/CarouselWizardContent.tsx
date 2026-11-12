"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useCarousel } from "../../context/CarouselContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  BookmarkPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Palette,
  RefreshCw,
  Send,
  Sparkles,
  Type,
  Wand2,
  Calendar as CalendarIcon,
} from "lucide-react";
import type { CarouselBackgroundVariant } from "@/types/carousel";
import { listCompatibleLayouts } from "@/lib/services/carousel/layouts/select";

const SLIDE_TYPE_LABELS: Record<string, string> = {
  contexto: "Contexto / Problema",
  ponto_principal: "Ponto Principal",
  complemento: "Complemento / Exemplo",
  desenvolvimento: "Desenvolvimento",
  prova_resumo: "Prova / Resumo",
  cta: "Chamada para Ação (CTA)",
};

const BG_VARIANT_LABELS: {
  value: CarouselBackgroundVariant;
  label: string;
}[] = [
  { value: "solid_from_cover", label: "Cor sólida da capa" },
  { value: "cover_stripe_geometry", label: "Faixas e formas da capa" },
  { value: "blurred_cover_crop", label: "Recorte desfocado da capa" },
];

function getCoverLoaderMessage(progress: number): string {
  if (progress >= 95) return "Finalizando a arte da capa e paleta visual...";
  if (progress >= 75) return "Ajustando iluminação, contraste e legibilidade...";
  if (progress >= 45) return "Compondo a tipografia e elementos da marca...";
  if (progress >= 20) return "Criando a cena principal em alta resolução...";
  return "Preparando a direção de arte da capa...";
}

export function CarouselWizardContent() {
  const router = useRouter();
  const {
    step,
    setStep,
    slideCount,
    setSlideCount,
    theme,
    setTheme,
    caption,
    setCaption,
    brandKit,
    setBrandKit,
    storyboard,
    setStoryboard,
    slideLayoutIds,
    isGeneratingStoryboard,
    isGeneratingCover,
    coverProgress,
    rewritingSlideNumber,
    isPublishing,
    isSavingToGallery,
    savedToGallery,
    coverImageUrl,
    coverDisplayUrl,
    coverOverlayApplied,
    designTokens,
    setDesignTokens,
    slideBackgroundVariants,
    setSlideBackgroundVariant,
    renderedSlideUrls,
    activeSlidePreview,
    setActiveSlidePreview,
    handleGenerateStoryboard,
    handleGenerateCover,
    handleToggleCoverOverlay,
    handleUpdateInternalSlide,
    handleRewriteSlideWithAI,
    handlePublishCarousel,
    handleSaveToGallery,
  } = useCarousel();

  const [scheduleDateTime, setScheduleDateTime] = useState("");

  const totalSlides = slideCount;
  const activeInternalSlide = storyboard?.slides.find(
    (s) => s.n === activeSlidePreview
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      {/* Cabeçalho */}
      <div className="flex flex-col items-center justify-between gap-4 border-b border-slate-200 pb-6 md:flex-row">
        <div>
          <h1 className="font-poppins text-3xl font-bold text-slate-900">
            Criar Post Carrossel ({slideCount} slides)
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            A IA cria o gancho da capa e desenvolve os slides internos mantendo
            a mesma família visual.
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-2">
          {[
            { n: 1 as const, label: "1. Tema e Roteiro" },
            { n: 2 as const, label: "2. Capa e Slides" },
            { n: 3 as const, label: "3. Revisar e Publicar" },
          ].map((item) => {
            const canClick =
              item.n === 1 || (item.n >= 2 && Boolean(storyboard));
            return (
              <button
                key={item.n}
                type="button"
                disabled={!canClick}
                onClick={() => canClick && setStep(item.n)}
                data-testid={`carousel-step-${item.n}`}
                className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                  step === item.n
                    ? "bg-[#FA6305] text-white"
                    : canClick
                      ? "border border-[#0083C7]/30 bg-white text-[#0083C7] hover:bg-[#0083C7]/5"
                      : "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ETAPA 1: ENTRADA DO USUÁRIO (TEMA, PÚBLICO, TOM E 5 OU 7 SLIDES) */}
      {step === 1 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-poppins text-xl text-slate-900">
                1. Defina o Objetivo e Tamanho do Carrossel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Seletor 5 ou 7 slides */}
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-800">
                  Quantidade de Slides
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    data-testid="carousel-size-5"
                    onClick={() => setSlideCount(5)}
                    className={`flex flex-col items-start rounded-lg border-2 p-4 text-left transition-all ${
                      slideCount === 5
                        ? "border-[#0083C7] bg-[#0083C7]/5 text-slate-900"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <span className="font-poppins text-lg font-bold text-[#0083C7]">
                      5 Slides (Direto ao Ponto)
                    </span>
                    <span className="mt-1 text-xs text-slate-600">
                      1 Capa → 2 Contexto → 3 Ponto Principal → 4 Complemento →
                      5 CTA
                    </span>
                  </button>

                  <button
                    type="button"
                    data-testid="carousel-size-7"
                    onClick={() => setSlideCount(7)}
                    className={`flex flex-col items-start rounded-lg border-2 p-4 text-left transition-all ${
                      slideCount === 7
                        ? "border-[#0083C7] bg-[#0083C7]/5 text-slate-900"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <span className="font-poppins text-lg font-bold text-[#0083C7]">
                      7 Slides (Educativo Profundo)
                    </span>
                    <span className="mt-1 text-xs text-slate-600">
                      1 Capa → 2 Contexto → 3, 4 e 5 Desenvolvimento → 6
                      Prova/Resumo → 7 CTA
                    </span>
                  </button>
                </div>
              </div>

              {/* Tema / Objetivo */}
              <div className="space-y-2">
                <Label
                  htmlFor="carousel-theme"
                  className="text-sm font-bold text-slate-800"
                >
                  Tema ou Objetivo do Carrossel *
                </Label>
                <Textarea
                  id="carousel-theme"
                  data-testid="carousel-theme-input"
                  rows={3}
                  placeholder="Ex: 3 erros que fazem sua empresa pagar mais impostos na Reforma Tributária e como corrigir..."
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="rounded-lg border-slate-300"
                />
              </div>

              {/* Público, Tom e Canal de CTA pré-preenchidos com o Cérebro do Negócio */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Público-Alvo (Cérebro do Negócio)
                  </Label>
                  <Input
                    data-testid="carousel-audience-input"
                    value={brandKit.targetAudience}
                    onChange={(e) =>
                      setBrandKit((prev) => ({
                        ...prev,
                        targetAudience: e.target.value,
                      }))
                    }
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Tom de Voz
                  </Label>
                  <Input
                    data-testid="carousel-tone-input"
                    value={brandKit.toneOfVoice}
                    onChange={(e) =>
                      setBrandKit((prev) => ({
                        ...prev,
                        toneOfVoice: e.target.value,
                      }))
                    }
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs font-semibold text-slate-700">
                    Canal Real para o CTA (Último Slide)
                  </Label>
                  <Input
                    data-testid="carousel-cta-channel-input"
                    value={brandKit.ctaChannel}
                    onChange={(e) =>
                      setBrandKit((prev) => ({
                        ...prev,
                        ctaChannel: e.target.value,
                      }))
                    }
                    placeholder="Ex: Chame no WhatsApp (11) 99999-9999 ou clique no link da bio"
                    className="rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  data-testid="carousel-generate-storyboard-btn"
                  disabled={isGeneratingStoryboard}
                  onClick={() => handleGenerateStoryboard(false)}
                  className="rounded-lg bg-[#FA6305] px-6 py-2.5 font-bold text-white hover:bg-[#e05600]"
                >
                  {isGeneratingStoryboard ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando roteiro de {slideCount} slides...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Gerar Roteiro Completo ({slideCount} slides)
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Identidade da Marca */}
          <Card>
            <CardHeader>
              <CardTitle className="font-poppins text-lg text-slate-900">
                Identidade do BrandKit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-600">
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Tipografia do BrandKit
                </p>
                <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-xs">
                  <span>Títulos: {brandKit.headingFont}</span>
                  <span>Corpo: {brandKit.bodyFont}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Paleta Base
                </p>
                <div className="flex items-center gap-2">
                  {brandKit.colors.map((hex, i) => (
                    <div
                      key={`${hex}-${i}`}
                      className="flex items-center gap-1.5 rounded-md border border-slate-200 px-2 py-1 text-xs"
                    >
                      <span
                        className="h-4 w-4 rounded-sm border border-slate-300"
                        style={{ backgroundColor: hex }}
                      />
                      <span>{hex}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ETAPA 2: ROTEIRO, CAPA ÚNICA E EDITOR FABRIC.JS DOS SLIDES 2..N */}
      {step === 2 && storyboard && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Coluna Esquerda (5 cols): Preview Interativo 4:5 (Swipe) */}
          <div className="space-y-4 lg:col-span-5">
            <Card className="overflow-hidden border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between bg-slate-50 py-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-[#0083C7] text-white">
                    Slide {activeSlidePreview} de {totalSlides}
                  </Badge>
                  <span className="text-xs font-semibold text-slate-600">
                    {activeSlidePreview === 1
                      ? "Capa"
                      : `${SLIDE_TYPE_LABELS[activeInternalSlide?.tipo || ""] || "Slide Interno"}`}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    data-testid="carousel-prev-slide"
                    disabled={activeSlidePreview <= 1}
                    onClick={() =>
                      setActiveSlidePreview(Math.max(1, activeSlidePreview - 1))
                    }
                    className="h-8 w-8 rounded-lg p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    data-testid="carousel-next-slide"
                    disabled={activeSlidePreview >= totalSlides}
                    onClick={() =>
                      setActiveSlidePreview(
                        Math.min(totalSlides, activeSlidePreview + 1)
                      )
                    }
                    className="h-8 w-8 rounded-lg p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-4">
                <div
                  data-testid="carousel-preview-stage"
                  className="relative mx-auto aspect-[4/5] w-full max-w-[420px] overflow-hidden rounded-lg border border-slate-200 bg-slate-900 shadow-md"
                >
                  {isGeneratingCover && activeSlidePreview === 1 && (
                    <div
                      data-testid="carousel-cover-progress"
                      className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/95 p-6 backdrop-blur-sm"
                    >
                      <div className="relative flex flex-col items-center gap-5">
                        <div className="relative h-36 w-36">
                          <svg
                            className="h-full w-full -rotate-90 transform"
                            viewBox="0 0 100 100"
                          >
                            <defs>
                              <linearGradient
                                id="carouselCoverProgressGradient"
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="100%"
                              >
                                <stop offset="0%" stopColor="#0284c7" />
                                <stop offset="100%" stopColor="#f97316" />
                              </linearGradient>
                            </defs>
                            <circle
                              cx="50"
                              cy="50"
                              r="45"
                              stroke="rgba(30, 41, 59, 0.8)"
                              strokeWidth="6"
                              fill="transparent"
                            />
                            <circle
                              cx="50"
                              cy="50"
                              r="45"
                              stroke="url(#carouselCoverProgressGradient)"
                              strokeWidth="6"
                              fill="transparent"
                              strokeDasharray="282.74"
                              strokeDashoffset={
                                282.74 * (1 - coverProgress / 100)
                              }
                              strokeLinecap="round"
                              className="transition-all duration-200"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl font-bold tracking-tight text-white">
                              {Math.round(coverProgress)}%
                            </span>
                          </div>
                        </div>
                        <p className="max-w-[260px] text-center text-sm font-medium leading-relaxed text-slate-300">
                          {getCoverLoaderMessage(coverProgress)}
                        </p>
                      </div>
                    </div>
                  )}

                  {activeSlidePreview === 1 ? (
                    coverDisplayUrl ? (
                      <img
                        src={coverDisplayUrl}
                        alt="Capa do Carrossel"
                        data-testid="carousel-cover-preview-img"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div
                        className="flex h-full w-full flex-col justify-between p-8 text-white"
                        style={{
                          backgroundColor: designTokens.backgroundColor,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="rounded-full px-3 py-1 text-xs font-bold"
                            style={{ backgroundColor: designTokens.accentColor }}
                          >
                            1/{totalSlides} • CAPA
                          </span>
                        </div>
                        <div className="space-y-4">
                          <p
                            className="font-poppins text-2xl font-extrabold leading-tight"
                            style={{ color: designTokens.textColor }}
                          >
                            {storyboard.chamadaCapa}
                          </p>
                          <p className="text-xs text-slate-300">
                            Clique em &ldquo;Gerar Capa com IA&rdquo; ao lado
                            para criar a arte da capa.
                          </p>
                        </div>
                        <div className="flex justify-end">
                          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                            Arraste →
                          </span>
                        </div>
                      </div>
                    )
                  ) : renderedSlideUrls[activeSlidePreview] ? (
                    <img
                      src={renderedSlideUrls[activeSlidePreview]}
                      alt={`Slide ${activeSlidePreview}`}
                      data-testid={`carousel-internal-preview-img-${activeSlidePreview}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-white">
                      Renderizando slide {activeSlidePreview}...
                    </div>
                  )}
                </div>

                {/* Miniaturas navegáveis */}
                <div className="mt-4 grid grid-cols-7 gap-1.5">
                  {Array.from({ length: totalSlides }, (_, idx) => idx + 1).map(
                    (n) => (
                      <button
                        key={n}
                        type="button"
                        data-testid={`carousel-thumb-${n}`}
                        onClick={() => setActiveSlidePreview(n)}
                        className={`rounded-lg border py-2 text-center text-xs font-bold transition-all ${
                          activeSlidePreview === n
                            ? "border-[#FA6305] bg-[#FA6305] text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:border-[#0083C7]"
                        }`}
                      >
                        {n === 1 ? "Capa" : `S${n}`}
                      </button>
                    )
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Painel de Tokens Extraídos da Capa */}
            <Card className="border-slate-200">
              <CardHeader className="py-3">
                <CardTitle className="flex items-center gap-2 font-poppins text-sm font-bold text-slate-800">
                  <Palette className="h-4 w-4 text-[#0083C7]" />
                  Design Tokens da Família Visual (Capa + BrandKit)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-[11px] text-slate-500">Fundo</Label>
                    <div className="mt-1 flex items-center gap-1.5">
                      <input
                        type="color"
                        aria-label="Cor de fundo dos slides"
                        value={designTokens.backgroundColor}
                        onChange={(e) =>
                          setDesignTokens((prev) => ({
                            ...prev,
                            backgroundColor: e.target.value,
                          }))
                        }
                        className="h-7 w-7 cursor-pointer rounded border"
                      />
                      <span className="font-mono">
                        {designTokens.backgroundColor}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-[11px] text-slate-500">
                      Destaque
                    </Label>
                    <div className="mt-1 flex items-center gap-1.5">
                      <input
                        type="color"
                        aria-label="Cor de destaque dos slides"
                        value={designTokens.accentColor}
                        onChange={(e) =>
                          setDesignTokens((prev) => ({
                            ...prev,
                            accentColor: e.target.value,
                          }))
                        }
                        className="h-7 w-7 cursor-pointer rounded border"
                      />
                      <span className="font-mono">
                        {designTokens.accentColor}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-[11px] text-slate-500">Texto</Label>
                    <div className="mt-1 flex items-center gap-1.5">
                      <input
                        type="color"
                        aria-label="Cor do texto dos slides"
                        value={designTokens.textColor}
                        onChange={(e) =>
                          setDesignTokens((prev) => ({
                            ...prev,
                            textColor: e.target.value,
                          }))
                        }
                        className="h-7 w-7 cursor-pointer rounded border"
                      />
                      <span className="font-mono">{designTokens.textColor}</span>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  Alterar cores ou textos atualiza os slides 2 a {totalSlides}{" "}
                  instantaneamente na prévia.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Coluna Direita (7 cols): Editor da Capa (Slide 1) e dos Slides Internos (2..N) */}
          <div className="space-y-6 lg:col-span-7">
            {/* Bloco Slide 1: Capa */}
            <Card className="border-2 border-[#0083C7]/25">
              <CardHeader className="bg-[#0083C7]/5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <Badge className="bg-[#0083C7] text-white">
                      Slide 1 • Capa (Gancho Principal)
                    </Badge>
                    <CardTitle className="mt-1 font-poppins text-lg text-slate-900">
                      Chamada da Capa & Arte Única IA
                    </CardTitle>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      data-testid="carousel-generate-cover-btn"
                      disabled={isGeneratingCover}
                      onClick={handleGenerateCover}
                      className="rounded-lg bg-[#0083C7] font-bold text-white hover:bg-[#006da6]"
                    >
                      {isGeneratingCover ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Gerando Capa ({Math.round(coverProgress)}%)...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          {coverImageUrl
                            ? "Regenerar apenas a capa"
                            : "Gerar Capa com IA"}
                        </>
                      )}
                    </Button>

                    {coverImageUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        data-testid="carousel-cover-overlay-btn"
                        onClick={handleToggleCoverOverlay}
                        className="rounded-lg border-slate-300 font-semibold text-slate-800"
                      >
                        <Type className="mr-1.5 h-4 w-4 text-[#FA6305]" />
                        {coverOverlayApplied
                          ? "Remover sobreposição"
                          : "Aplicar chamada por sobreposição"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-700">
                      Chamada da Capa (Headline Gancho — máx. 65 caracteres)
                    </Label>
                    <span className="text-xs text-slate-500">
                      {storyboard.chamadaCapa.length}/65
                    </span>
                  </div>
                  <Input
                    data-testid="carousel-chamada-capa-input"
                    maxLength={65}
                    value={storyboard.chamadaCapa}
                    onChange={(e) =>
                      setStoryboard((prev) =>
                        prev ? { ...prev, chamadaCapa: e.target.value } : prev
                      )
                    }
                    className="rounded-lg font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">
                    Direção Visual da Capa
                  </Label>
                  <Textarea
                    data-testid="carousel-cover-prompt-input"
                    rows={2}
                    value={storyboard.promptImagemCapa}
                    onChange={(e) =>
                      setStoryboard((prev) =>
                        prev
                          ? { ...prev, promptImagemCapa: e.target.value }
                          : prev
                      )
                    }
                    className="rounded-lg text-xs"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Lista de Slides Internos (2..N) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-poppins text-lg font-bold text-slate-900">
                  Slides Internos (2 a {totalSlides})
                </h2>
              </div>

              {storyboard.slides.map((slide) => (
                <Card
                  key={slide.n}
                  data-testid={`carousel-slide-card-${slide.n}`}
                  onClick={() => setActiveSlidePreview(slide.n)}
                  className={`cursor-pointer transition-all ${
                    activeSlidePreview === slide.n
                      ? "border-2 border-[#FA6305]"
                      : "border border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <CardContent className="space-y-3 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-slate-900 text-white">
                          Slide {slide.n}/{totalSlides}
                        </Badge>
                        <span className="text-xs font-bold uppercase tracking-wide text-[#0083C7]">
                          {SLIDE_TYPE_LABELS[slide.tipo] || slide.tipo}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Layout da biblioteca (troca o design sem gastar crédito) */}
                        <select
                          aria-label={`Layout do slide ${slide.n}`}
                          data-testid={`carousel-layout-${slide.n}`}
                          value={slideLayoutIds[slide.n] || ""}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            handleUpdateInternalSlide(slide.n, {
                              layout: e.target.value,
                            })
                          }
                          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700"
                        >
                          {listCompatibleLayouts(slide, {
                            hasCoverImage: Boolean(coverImageUrl),
                          }).map((layout) => (
                            <option key={layout.id} value={layout.id}>
                              {layout.name}
                            </option>
                          ))}
                        </select>

                        {/* Variação de fundo sem IA */}
                        <select
                          aria-label={`Estilo de fundo do slide ${slide.n}`}
                          data-testid={`carousel-bg-variant-${slide.n}`}
                          value={
                            slideBackgroundVariants[slide.n] ||
                            BG_VARIANT_LABELS[
                              (slide.n - 2) % BG_VARIANT_LABELS.length
                            ].value
                          }
                          onChange={(e) =>
                            setSlideBackgroundVariant(
                              slide.n,
                              e.target.value as CarouselBackgroundVariant
                            )
                          }
                          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700"
                        >
                          {BG_VARIANT_LABELS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>

                        {/* Reescrever apenas este slide via LLM de texto */}
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          data-testid={`carousel-rewrite-slide-${slide.n}`}
                          disabled={rewritingSlideNumber === slide.n}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRewriteSlideWithAI(slide.n);
                          }}
                          className="h-8 rounded-lg border-slate-300 text-xs font-semibold"
                        >
                          {rewritingSlideNumber === slide.n ? (
                            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Wand2 className="mr-1 h-3.5 w-3.5 text-[#0083C7]" />
                          )}
                          Reescrever texto
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                          <span>Título (máx. 45 caracteres)</span>
                          <span>{slide.titulo.length}/45</span>
                        </div>
                        <Input
                          data-testid={`carousel-slide-title-${slide.n}`}
                          maxLength={45}
                          value={slide.titulo}
                          onChange={(e) =>
                            handleUpdateInternalSlide(slide.n, {
                              titulo: e.target.value,
                            })
                          }
                          className="mt-1 rounded-lg font-semibold"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                          <span>Texto de apoio (máx. 160 caracteres)</span>
                          <span>{(slide.texto || "").length}/160</span>
                        </div>
                        <Textarea
                          data-testid={`carousel-slide-text-${slide.n}`}
                          rows={2}
                          maxLength={160}
                          value={slide.texto || ""}
                          onChange={(e) =>
                            handleUpdateInternalSlide(slide.n, {
                              texto: e.target.value,
                            })
                          }
                          className="mt-1 rounded-lg text-sm"
                        />
                      </div>

                      {slide.tipo === "cta" && (
                        <div>
                          <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                            <span>Texto do Botão CTA (máx. 32 caracteres)</span>
                            <span>{(slide.botao || "").length}/32</span>
                          </div>
                          <Input
                            data-testid={`carousel-slide-cta-btn-${slide.n}`}
                            maxLength={32}
                            value={slide.botao || ""}
                            onChange={(e) =>
                              handleUpdateInternalSlide(slide.n, {
                                botao: e.target.value,
                              })
                            }
                            className="mt-1 rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="rounded-lg"
              >
                Voltar para Tema
              </Button>
              <Button
                type="button"
                data-testid="carousel-go-to-review-btn"
                onClick={() => setStep(3)}
                className="rounded-lg bg-[#FA6305] px-6 font-bold text-white hover:bg-[#e05600]"
              >
                Avançar para Revisão e Publicação
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ETAPA 3: REVISÃO DE TODOS OS SLIDES, LEGENDA E PUBLICAÇÃO */}
      {step === 3 && storyboard && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-poppins text-xl text-slate-900">
                3. Prévia Completa do Carrossel ({totalSlides} Slides em
                1080×1350)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Grade com todos os slides lado a lado */}
              <div
                data-testid="carousel-full-review-grid"
                className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5"
              >
                {/* Slide 1 */}
                <div className="space-y-1.5">
                  <Badge className="bg-[#0083C7] text-white">
                    Slide 1 • Capa
                  </Badge>
                  <div className="aspect-[4/5] overflow-hidden rounded-lg border border-slate-200 bg-slate-900">
                    {coverDisplayUrl ? (
                      <img
                        src={coverDisplayUrl}
                        alt="Slide 1 Capa"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full flex-col justify-center p-4 text-center text-xs text-white">
                        <p className="font-bold">{storyboard.chamadaCapa}</p>
                        <p className="mt-2 text-[11px] text-amber-300">
                          Capa ainda não gerada com IA
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Slides 2..N */}
                {storyboard.slides.map((s) => (
                  <div key={s.n} className="space-y-1.5">
                    <Badge variant="outline" className="border-slate-300">
                      Slide {s.n} • {SLIDE_TYPE_LABELS[s.tipo] || s.tipo}
                    </Badge>
                    <div className="aspect-[4/5] overflow-hidden rounded-lg border border-slate-200 bg-slate-900">
                      {renderedSlideUrls[s.n] ? (
                        <img
                          src={renderedSlideUrls[s.n]}
                          alt={`Slide ${s.n}`}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>

              {/* Legenda do Post */}
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-800">
                  Legenda do Carrossel para o Instagram
                </Label>
                <Textarea
                  data-testid="carousel-caption-textarea"
                  rows={5}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="rounded-lg"
                />
              </div>

              {/* Ações de Publicação / Agendamento */}
              <div className="flex flex-wrap items-end justify-between gap-4 border-t border-slate-200 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="rounded-lg"
                >
                  Voltar para Edição dos Slides
                </Button>

                <div className="flex flex-wrap items-end gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-600">
                      Data/Hora para Agendar (opcional)
                    </Label>
                    <Input
                      type="datetime-local"
                      value={scheduleDateTime}
                      onChange={(e) => setScheduleDateTime(e.target.value)}
                      className="rounded-lg"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    data-testid="carousel-save-gallery-btn"
                    disabled={isSavingToGallery || isPublishing}
                    onClick={handleSaveToGallery}
                    className="rounded-lg border-[#0083C7] font-bold text-[#0083C7] hover:bg-[#0083C7]/10"
                  >
                    {isSavingToGallery ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando na Galeria...
                      </>
                    ) : savedToGallery ? (
                      <>
                        <Check className="mr-2 h-4 w-4 text-emerald-600" />
                        Salvo na Galeria
                      </>
                    ) : (
                      <>
                        <BookmarkPlus className="mr-2 h-4 w-4" />
                        Salvar na Galeria
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    data-testid="carousel-schedule-btn"
                    disabled={isPublishing || isSavingToGallery}
                    onClick={async () => {
                      const ok = await handlePublishCarousel(
                        "schedule",
                        scheduleDateTime
                      );
                      if (ok) router.push("/dashboard/posts");
                    }}
                    className="rounded-lg bg-[#0083C7] font-bold text-white hover:bg-[#006da6]"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Agendar Carrossel
                  </Button>

                  <Button
                    type="button"
                    data-testid="carousel-publish-now-btn"
                    disabled={isPublishing || isSavingToGallery}
                    onClick={async () => {
                      const ok = await handlePublishCarousel("now");
                      if (ok) router.push("/dashboard/posts");
                    }}
                    className="rounded-lg bg-[#FA6305] font-bold text-white hover:bg-[#e05600]"
                  >
                    {isPublishing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Publicando Carrossel...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Publicar Agora no Instagram
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
