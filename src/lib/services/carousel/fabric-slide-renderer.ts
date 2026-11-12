import {
  CarouselBackgroundVariant,
  CarouselInternalSlide,
  CarouselSlideCount,
  CoverDesignTokens,
  DEFAULT_COVER_DESIGN_TOKENS,
} from "@/types/carousel";

export const CAROUSEL_SLIDE_WIDTH = 1080;
export const CAROUSEL_SLIDE_HEIGHT = 1350;
export const CAROUSEL_SAFE_MARGIN = 80;

export class CarouselImageGuardError extends Error {
  public readonly slideNumber: number;

  constructor(slideNumber: number) {
    super(
      `VIOLAÇÃO DA REGRA DE OURO: Somente o slide 1 (capa) pode chamar modelo de imagem IA (recebido slide ${slideNumber}). Slides 2 a N usam exclusivamente templates Fabric.js com custo zero de imagem.`
    );
    this.name = "CarouselImageGuardError";
    this.slideNumber = slideNumber;
  }
}

/**
 * Guard explícito e inviolável: garante que NENHUM slide 2..N possa acionar
 * geração de imagem por IA.
 */
export function assertCoverOnlyImageGeneration(slideNumber: number): void {
  if (!Number.isInteger(slideNumber) || slideNumber !== 1) {
    throw new CarouselImageGuardError(slideNumber);
  }
}

export {
  wrapTextIntoLines,
  calculateAutoFitFontSize,
  type AutoFitFontParams,
  type AutoFitFontResult,
} from "./text-fit";
import { calculateAutoFitFontSize, type AutoFitFontResult } from "./text-fit";
import {
  renderResolvedSlideToDataUrl,
  resolveCarouselSlide,
  resolveLayoutForSlide,
  type ResolvedSlide,
} from "./layouts";

export interface FabricSlideLayoutSpec {
  width: number;
  height: number;
  safeMargin: number;
  slideNumber: number;
  totalSlides: CarouselSlideCount;
  slideBadgeText: string;
  showSwipeIndicator: boolean;
  swipeIndicatorText: string;
  backgroundVariant: CarouselBackgroundVariant;
  tokens: CoverDesignTokens;
  titleFit: AutoFitFontResult;
  bodyFit: AutoFitFontResult;
  ctaButtonText?: string;
}

/**
 * Monta a especificação determinística do slide interno (2..N) combinando
 * os design tokens extraídos da capa com o ajuste automático de fonte.
 */
export function buildFabricSlideSpec(params: {
  slide: CarouselInternalSlide;
  totalSlides: CarouselSlideCount;
  tokens?: Partial<CoverDesignTokens>;
  backgroundVariant?: CarouselBackgroundVariant;
}): FabricSlideLayoutSpec {
  const { slide, totalSlides } = params;
  // Guard explícito: slides internos são sempre >= 2
  if (slide.n < 2 || slide.n > totalSlides) {
    throw new Error(`Slide interno inválido: ${slide.n} (esperado entre 2 e ${totalSlides}).`);
  }

  const mergedTokens: CoverDesignTokens = {
    ...DEFAULT_COVER_DESIGN_TOKENS,
    ...(params.tokens || {}),
  };

  // Escolhe variação de fundo se não informada, alternando harmoniosamente
  const defaultVariants: CarouselBackgroundVariant[] = [
    "solid_from_cover",
    "cover_stripe_geometry",
    "blurred_cover_crop",
  ];
  const variant =
    params.backgroundVariant ||
    defaultVariants[(slide.n - 2) % defaultVariants.length];

  const contentWidth = CAROUSEL_SLIDE_WIDTH - CAROUSEL_SAFE_MARGIN * 2; // 920px
  const titleFit = calculateAutoFitFontSize({
    text: slide.titulo,
    maxWidthPx: contentWidth - 40,
    maxHeightPx: 260,
    maxFontSize: 64,
    minFontSize: 34,
    lineHeight: 1.18,
    avgCharWidthRatio: 0.58,
  });

  const bodyText = slide.texto || "";
  const bodyFit = calculateAutoFitFontSize({
    text: bodyText,
    maxWidthPx: contentWidth - 40,
    maxHeightPx: slide.tipo === "cta" ? 320 : 460,
    maxFontSize: 42,
    minFontSize: 24,
    lineHeight: 1.36,
    avgCharWidthRatio: 0.53,
  });

  return {
    width: CAROUSEL_SLIDE_WIDTH,
    height: CAROUSEL_SLIDE_HEIGHT,
    safeMargin: CAROUSEL_SAFE_MARGIN,
    slideNumber: slide.n,
    totalSlides,
    slideBadgeText: `${slide.n}/${totalSlides}`,
    showSwipeIndicator: slide.n < totalSlides,
    swipeIndicatorText: "Arraste →",
    backgroundVariant: variant,
    tokens: mergedTokens,
    titleFit,
    bodyFit,
    ctaButtonText:
      slide.tipo === "cta" ? slide.botao || "Fale conosco agora" : undefined,
  };
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function loadHtmlImage(src: string): Promise<HTMLImageElement | null> {
  if (typeof window === "undefined" || typeof Image === "undefined" || !src) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Renderiza um slide interno (2..N) em PNG 1080×1350 usando a biblioteca de
 * layouts (src/lib/services/carousel/layouts), sem nenhuma chamada de IA.
 *
 * O layout vem de `layoutId` (atribuição do carrossel), de `slide.layout`
 * (LLM/usuário) ou é escolhido automaticamente pelo tipo e conteúdo do slide.
 */
export async function renderSlideWithFabricToDataUrl(params: {
  slide: CarouselInternalSlide;
  totalSlides: CarouselSlideCount;
  tokens?: Partial<CoverDesignTokens>;
  backgroundVariant?: CarouselBackgroundVariant;
  coverImageUrl?: string | null;
  layoutId?: string;
}): Promise<string> {
  // Valida a faixa do slide interno (mesmo guard do spec legado)
  buildFabricSlideSpec({
    slide: params.slide,
    totalSlides: params.totalSlides,
    tokens: params.tokens,
    backgroundVariant: params.backgroundVariant,
  });

  if (typeof document === "undefined") {
    return "";
  }

  const resolved = resolveInternalSlide(params);
  const logoUrl = params.tokens?.logoUrl ?? DEFAULT_COVER_DESIGN_TOKENS.logoUrl;
  return renderResolvedSlideToDataUrl(resolved, {
    coverImageUrl: params.coverImageUrl,
    logoUrl,
  });
}

/** Resolve (sem DOM) o slide interno com o layout da biblioteca. */
export function resolveInternalSlide(params: {
  slide: CarouselInternalSlide;
  totalSlides: CarouselSlideCount;
  tokens?: Partial<CoverDesignTokens>;
  backgroundVariant?: CarouselBackgroundVariant;
  coverImageUrl?: string | null;
  layoutId?: string;
}): ResolvedSlide {
  const hasCoverImage = Boolean(params.coverImageUrl);
  const layout = resolveLayoutForSlide(params.slide, { hasCoverImage }, params.layoutId);
  return resolveCarouselSlide({
    layout,
    slide: params.slide,
    totalSlides: params.totalSlides,
    tokens: params.tokens,
    backgroundVariant: params.backgroundVariant,
    hasCoverImage,
  });
}

/**
 * Opção de segurança para o Slide 1 (Capa): aplica a `chamadaCapa` por sobreposição
 * via Canvas/Fabric sobre a imagem da capa existente, SEM chamar modelo de imagem IA.
 */
export async function renderCoverOverlayWithFabric(params: {
  coverImageUrl: string;
  chamadaCapa: string;
  tokens?: Partial<CoverDesignTokens>;
}): Promise<string> {
  if (typeof document === "undefined") {
    return params.coverImageUrl;
  }

  const mergedTokens: CoverDesignTokens = {
    ...DEFAULT_COVER_DESIGN_TOKENS,
    ...(params.tokens || {}),
  };

  const canvas = document.createElement("canvas");
  canvas.width = CAROUSEL_SLIDE_WIDTH;
  canvas.height = CAROUSEL_SLIDE_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return params.coverImageUrl;

  const coverImg = await loadHtmlImage(params.coverImageUrl);
  if (coverImg) {
    ctx.drawImage(coverImg, 0, 0, CAROUSEL_SLIDE_WIDTH, CAROUSEL_SLIDE_HEIGHT);
  } else {
    ctx.fillStyle = mergedTokens.backgroundColor;
    ctx.fillRect(0, 0, CAROUSEL_SLIDE_WIDTH, CAROUSEL_SLIDE_HEIGHT);
  }

  const headlineFit = calculateAutoFitFontSize({
    text: params.chamadaCapa,
    maxWidthPx: CAROUSEL_SLIDE_WIDTH - CAROUSEL_SAFE_MARGIN * 2 - 64,
    maxHeightPx: 300,
    maxFontSize: 66,
    minFontSize: 36,
    lineHeight: 1.16,
    avgCharWidthRatio: 0.58,
  });

  const boxHeight = headlineFit.totalHeightPx + 88;
  const boxY =
    mergedTokens.coverTextPosition === "top"
      ? CAROUSEL_SAFE_MARGIN
      : CAROUSEL_SLIDE_HEIGHT - CAROUSEL_SAFE_MARGIN - boxHeight - 70;

  // Card de contraste sólido sobre a área de texto para cobrir eventual erro de texto da IA
  ctx.save();
  ctx.fillStyle = mergedTokens.backgroundColor;
  ctx.globalAlpha = 0.94;
  drawRoundedRect(
    ctx,
    CAROUSEL_SAFE_MARGIN,
    boxY,
    CAROUSEL_SLIDE_WIDTH - CAROUSEL_SAFE_MARGIN * 2,
    boxHeight,
    mergedTokens.cornerRadius
  );
  ctx.fill();

  ctx.globalAlpha = 1;
  ctx.fillStyle = mergedTokens.accentColor;
  drawRoundedRect(
    ctx,
    CAROUSEL_SAFE_MARGIN,
    boxY,
    14,
    boxHeight,
    mergedTokens.cornerRadius
  );
  ctx.fill();

  ctx.fillStyle = mergedTokens.textColor;
  ctx.font = `800 ${headlineFit.fontSize}px "${mergedTokens.headingFont}", sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  let textY = boxY + 44;
  for (const line of headlineFit.lines) {
    ctx.fillText(line, CAROUSEL_SAFE_MARGIN + 42, textY);
    textY += headlineFit.lineHeightPx;
  }
  ctx.restore();

  return canvas.toDataURL("image/png");
}
