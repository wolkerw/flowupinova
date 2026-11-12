/**
 * Escolha de layout, saneamento dos campos extras vindos do LLM e catálogo para o prompt.
 */

import type { CarouselInternalSlide } from "@/types/carousel";
import { CAROUSEL_LAYOUTS, DEFAULT_CTA_LAYOUT_ID, DEFAULT_LAYOUT_ID, getCarouselLayout } from "./library";
import type { CarouselLayout, LayoutSlot } from "./types";

export interface LayoutSelectionContext {
  hasCoverImage: boolean;
}

export function slideHasSlot(
  slide: CarouselInternalSlide,
  slot: LayoutSlot,
  ctx: LayoutSelectionContext
): boolean {
  switch (slot) {
    case "itens":
      return (slide.itens || []).filter((i) => i.trim()).length >= 2;
    case "destaque":
      return Boolean(slide.destaque?.trim());
    case "autor":
      return Boolean(slide.autor?.trim());
    case "comparacao":
      return Boolean(
        slide.comparacao?.a.itens.length &&
          slide.comparacao?.b.itens.length &&
          slide.comparacao.a.rotulo &&
          slide.comparacao.b.rotulo
      );
    case "cover":
      return ctx.hasCoverImage;
  }
}

/** Slides CTA só usam layouts de CTA; os demais nunca usam layouts de CTA. */
export function isLayoutCompatible(
  layout: CarouselLayout,
  slide: CarouselInternalSlide,
  ctx: LayoutSelectionContext
): boolean {
  const isCtaLayout = layout.category === "cta";
  if ((slide.tipo === "cta") !== isCtaLayout) return false;
  return layout.requires.every((slot) => slideHasSlot(slide, slot, ctx));
}

export function listCompatibleLayouts(
  slide: CarouselInternalSlide,
  ctx: LayoutSelectionContext
): CarouselLayout[] {
  const compatible = CAROUSEL_LAYOUTS.filter((l) => isLayoutCompatible(l, slide, ctx));
  return [
    ...compatible.filter((l) => l.tipos.includes(slide.tipo)),
    ...compatible.filter((l) => !l.tipos.includes(slide.tipo)),
  ];
}

function scoreLayout(
  layout: CarouselLayout,
  slide: CarouselInternalSlide,
  used: Map<string, number>,
  previousId: string | undefined
): number {
  let score = 0;
  if (layout.tipos.includes(slide.tipo)) score += 10;
  // Prefere layouts que aproveitam o conteúdo estruturado que o slide trouxe
  score += layout.requires.filter((s) => s !== "cover").length * 6;
  if (layout.requires.includes("cover")) score += 1;
  const timesUsed = used.get(layout.id) || 0;
  score -= timesUsed * 4;
  if (layout.id === previousId) score -= 8;
  // Desempate determinístico que varia por slide (evita sempre o 1º da lista)
  const idx = CAROUSEL_LAYOUTS.indexOf(layout);
  score += ((idx * 7 + slide.n * 3) % CAROUSEL_LAYOUTS.length) / (CAROUSEL_LAYOUTS.length * 10);
  return score;
}

/**
 * Define o layout de cada slide interno. Respeita o `slide.layout` explícito
 * (LLM ou usuário) quando ele é compatível; caso contrário escolhe o melhor
 * layout de forma determinística, variando entre slides.
 */
export function assignLayouts(
  slides: CarouselInternalSlide[],
  ctx: LayoutSelectionContext
): Record<number, string> {
  const result: Record<number, string> = {};
  const used = new Map<string, number>();
  let previousId: string | undefined;

  for (const slide of slides) {
    const explicit = getCarouselLayout(slide.layout);
    let chosen: CarouselLayout | undefined =
      explicit && isLayoutCompatible(explicit, slide, ctx) ? explicit : undefined;

    if (!chosen) {
      const candidates = listCompatibleLayouts(slide, ctx);
      chosen = candidates
        .map((l) => ({ l, s: scoreLayout(l, slide, used, previousId) }))
        .sort((a, b) => b.s - a.s)[0]?.l;
    }

    const id = chosen?.id ?? (slide.tipo === "cta" ? DEFAULT_CTA_LAYOUT_ID : DEFAULT_LAYOUT_ID);
    result[slide.n] = id;
    used.set(id, (used.get(id) || 0) + 1);
    previousId = id;
  }
  return result;
}

export function resolveLayoutForSlide(
  slide: CarouselInternalSlide,
  ctx: LayoutSelectionContext,
  preferredId?: string
): CarouselLayout {
  const preferred = getCarouselLayout(preferredId ?? slide.layout);
  if (preferred && isLayoutCompatible(preferred, slide, ctx)) return preferred;
  const id = assignLayouts([slide], ctx)[slide.n];
  return getCarouselLayout(id)!;
}

// -----------------------------------------------------------------------------
// Saneamento dos campos extras (saída do LLM)
// -----------------------------------------------------------------------------

function clamp(value: unknown, max: number): string | undefined {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const cleaned = String(value).replace(/\s+/g, " ").trim();
  if (!cleaned) return undefined;
  return cleaned.length <= max ? cleaned : `${cleaned.slice(0, max - 1).trimEnd()}…`;
}

function clampList(value: unknown, maxItems: number, maxLen: number): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value.map((v) => clamp(v, maxLen)).filter((v): v is string => Boolean(v)).slice(0, maxItems);
  return items.length ? items : undefined;
}

export type SlideLayoutExtras = Pick<
  CarouselInternalSlide,
  "layout" | "destaque" | "itens" | "comparacao" | "autor"
>;

/** Converte o que o LLM devolveu em campos válidos para o schema (ou descarta). */
export function sanitizeSlideLayoutExtras(raw: unknown): SlideLayoutExtras {
  if (!raw || typeof raw !== "object") return {};
  const r = raw as Record<string, any>;
  const extras: SlideLayoutExtras = {};

  const layoutId = typeof r.layout === "string" ? r.layout.trim() : "";
  if (getCarouselLayout(layoutId)) extras.layout = layoutId;

  const destaque = clamp(r.destaque, 14);
  if (destaque) extras.destaque = destaque;

  const itens = clampList(r.itens, 5, 70);
  if (itens) extras.itens = itens;

  const a = r.comparacao?.a;
  const b = r.comparacao?.b;
  const aItens = clampList(a?.itens, 4, 60);
  const bItens = clampList(b?.itens, 4, 60);
  const aRot = clamp(a?.rotulo, 24);
  const bRot = clamp(b?.rotulo, 24);
  if (aItens && bItens && aRot && bRot) {
    extras.comparacao = { a: { rotulo: aRot, itens: aItens }, b: { rotulo: bRot, itens: bItens } };
  }

  const autor = clamp(r.autor, 40);
  if (autor) extras.autor = autor;

  return extras;
}

/** Catálogo enxuto dos layouts para o LLM escolher (só id, uso e campos exigidos). */
export function buildLayoutCatalogForPrompt(): string {
  return CAROUSEL_LAYOUTS.map((l) => {
    const req = l.requires.filter((s) => s !== "cover");
    const reqText = req.length ? ` | exige: ${req.join(", ")}` : "";
    const coverText = l.requires.includes("cover") ? " | usa recorte da capa" : "";
    return `- "${l.id}": ${l.description} (tipos: ${l.tipos.join(", ")}${reqText}${coverText})`;
  }).join("\n");
}
