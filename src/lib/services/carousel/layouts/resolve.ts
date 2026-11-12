/**
 * Resolvedor puro (sem DOM): layout declarativo + conteúdo do slide + tokens da capa
 * => lista de operações de desenho com cores, posições e fontes concretas.
 */

import type {
  CarouselBackgroundVariant,
  CarouselInternalSlide,
  CarouselInternalSlideType,
  CarouselSlideCount,
  CoverDesignTokens,
} from "@/types/carousel";
import { DEFAULT_COVER_DESIGN_TOKENS } from "@/types/carousel";
import { calculateAutoFitFontSize, wrapTextIntoLines } from "../text-fit";
import type {
  Box,
  ButtonNode,
  CarouselLayout,
  ChipsNode,
  ColorRef,
  Corner,
  DrawOp,
  GridNode,
  ImageNode,
  LayoutNode,
  ListNode,
  RectNode,
  ResolvedSlide,
  TextNode,
  TextStyle,
} from "./types";

export const LAYOUT_CANVAS_WIDTH = 1080;
export const LAYOUT_CANVAS_HEIGHT = 1350;
const MARGIN = 80;

// -----------------------------------------------------------------------------
// Cores
// -----------------------------------------------------------------------------

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full.slice(0, 6), 16);
  if (Number.isNaN(num)) return [0, 0, 0];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b]
    .map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Branco ou quase-preto, o que tiver mais contraste sobre a cor dada. */
export function readableOn(hex: string): string {
  const light = "#FFFFFF";
  const dark = "#111827";
  return contrastRatio(hex, light) >= contrastRatio(hex, dark) ? light : dark;
}

export function mixHex(a: string, b: string, amount: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return rgbToHex([
    ca[0] + (cb[0] - ca[0]) * amount,
    ca[1] + (cb[1] - ca[1]) * amount,
    ca[2] + (cb[2] - ca[2]) * amount,
  ]);
}

export interface ResolvedPalette {
  bg: string;
  surface: string;
  accent: string;
  secondary: string;
  text: string;
  muted: string;
  onAccent: string;
  onSecondary: string;
}

export function buildPalette(tokens: CoverDesignTokens): ResolvedPalette {
  return {
    bg: tokens.backgroundColor,
    surface: mixHex(tokens.backgroundColor, tokens.textColor, 0.08),
    accent: tokens.accentColor,
    secondary: tokens.secondaryColor,
    text: tokens.textColor,
    muted: tokens.mutedTextColor,
    onAccent: readableOn(tokens.accentColor),
    onSecondary: readableOn(tokens.secondaryColor),
  };
}

function color(ref: ColorRef | undefined, palette: ResolvedPalette): string | undefined {
  if (!ref) return undefined;
  if (ref.startsWith("#")) return ref;
  return palette[ref as keyof ResolvedPalette];
}

// -----------------------------------------------------------------------------
// Conteúdo
// -----------------------------------------------------------------------------

const TIPO_LABELS: Record<CarouselInternalSlideType, string> = {
  contexto: "O cenário",
  ponto_principal: "O ponto-chave",
  complemento: "Na prática",
  desenvolvimento: "Passo a passo",
  prova_resumo: "Resumo",
  cta: "Próximo passo",
};

export interface LayoutContent {
  vars: Record<string, string>;
  itens: string[];
  comparacao?: { a: { rotulo: string; itens: string[] }; b: { rotulo: string; itens: string[] } };
}

export function buildLayoutContent(
  slide: CarouselInternalSlide,
  totalSlides: CarouselSlideCount
): LayoutContent {
  const passo = Math.max(1, slide.n - 2);
  return {
    vars: {
      titulo: slide.titulo || "",
      texto: slide.texto || "",
      botao: slide.tipo === "cta" ? slide.botao || "Fale conosco agora" : slide.botao || "",
      destaque: slide.destaque || "",
      autor: slide.autor || "",
      n: String(slide.n),
      total: String(totalSlides),
      passo: String(passo),
      passo2: String(passo).padStart(2, "0"),
      rotuloTipo: TIPO_LABELS[slide.tipo] || "",
      rotuloA: slide.comparacao?.a.rotulo || "",
      rotuloB: slide.comparacao?.b.rotulo || "",
    },
    itens: (slide.itens || []).map((i) => i.trim()).filter(Boolean),
    comparacao: slide.comparacao,
  };
}

function interpolate(template: string, vars: Record<string, string>): string {
  return template
    .replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

// -----------------------------------------------------------------------------
// Tipografia
// -----------------------------------------------------------------------------

function weightOf(style: TextStyle, tokens: CoverDesignTokens): string {
  if (style.weight !== "token") return style.weight;
  const w = tokens.headingWeight;
  if (w === "bold") return "700";
  if (w === "extrabold") return "800";
  return w;
}

function charRatio(style: TextStyle, weight: string, fontSize: number): number {
  let ratio = style.font === "heading" ? 0.58 : 0.53;
  if (Number(weight) >= 800) ratio += 0.03;
  if (style.uppercase) ratio += 0.1;
  if (style.letterSpacing) ratio += style.letterSpacing / Math.max(1, fontSize);
  return ratio;
}

function fitText(text: string, style: TextStyle, w: number, h: number, weight: string) {
  return calculateAutoFitFontSize({
    text,
    maxWidthPx: w,
    maxHeightPx: h,
    maxFontSize: style.maxSize,
    minFontSize: style.minSize,
    lineHeight: style.lineHeight ?? 1.25,
    avgCharWidthRatio: charRatio(style, weight, style.maxSize),
  });
}

function radiusOf(
  r: RectNode["radius"] | ButtonNode["radius"] | GridNode["cellRadius"] | ImageNode["radius"],
  tokens: CoverDesignTokens,
  h: number
): number {
  if (r === undefined) return 0;
  if (r === "token") return tokens.cornerRadius;
  if (r === "pill") return h / 2;
  if (typeof r === "object") return tokens.cornerRadius + r.token;
  return r;
}

// -----------------------------------------------------------------------------
// Resolução
// -----------------------------------------------------------------------------

interface Geometry {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ResolveSlideParams {
  layout: CarouselLayout;
  slide: CarouselInternalSlide;
  totalSlides: CarouselSlideCount;
  tokens?: Partial<CoverDesignTokens>;
  backgroundVariant?: CarouselBackgroundVariant;
  hasCoverImage: boolean;
  hasLogo?: boolean;
}

export function resolveCarouselSlide(params: ResolveSlideParams): ResolvedSlide {
  const { layout, slide, totalSlides, hasCoverImage } = params;
  const tokens: CoverDesignTokens = { ...DEFAULT_COVER_DESIGN_TOKENS, ...(params.tokens || {}) };
  const hasLogo = params.hasLogo ?? Boolean(tokens.logoUrl);
  const palette = buildPalette(tokens);
  const content = buildLayoutContent(slide, totalSlides);
  const W = LAYOUT_CANVAS_WIDTH;
  const H = LAYOUT_CANVAS_HEIGHT;

  const warnings: string[] = [];
  const geometry: Record<string, Geometry> = {};
  const nodeOps: DrawOp[][] = layout.nodes.map(() => []);
  const deferred: number[] = [];

  const family = (font: "heading" | "body") =>
    font === "heading" ? tokens.headingFont : tokens.bodyFont;

  /** Resolve a posição vertical considerando stackAfter. */
  const placeBox = (node: LayoutNode & { box: Box }, mode: "limit" | "shift"): Box => {
    if (!node.stackAfter) return node.box;
    const anchor = geometry[node.stackAfter.id];
    const anchorBottom = anchor ? anchor.y + anchor.h : node.box.y;
    const y = anchorBottom + node.stackAfter.gap;
    if (mode === "shift") return { ...node.box, y };
    const bottomLimit = node.box.y + node.box.h;
    return { ...node.box, y, h: Math.max(0, bottomLimit - y) };
  };

  /** Nó pulado: repassa a âncora para quem empilha depois dele. */
  const passThrough = (node: LayoutNode) => {
    if (!node.id) return;
    if (node.stackAfter && geometry[node.stackAfter.id]) {
      const a = geometry[node.stackAfter.id];
      geometry[node.id] = { ...a };
    } else if ("box" in node) {
      geometry[node.id] = { x: node.box.x, y: node.box.y, w: node.box.w, h: 0 };
    }
  };

  const whenSatisfied = (node: LayoutNode): boolean => {
    if (!node.when) return true;
    if (node.when === "cover") return hasCoverImage;
    if (node.when === "logo") return hasLogo;
    return Boolean(content.vars[node.when]);
  };

  const textOp = (
    lines: string[],
    box: Box,
    style: TextStyle,
    weight: string,
    fontSize: number,
    lineHeightPx: number,
    y: number,
    align: "left" | "center" | "right",
    extra: Partial<Extract<DrawOp, { op: "text" }>> = {},
    opacity = 1
  ): DrawOp => ({
    op: "text",
    lines: style.uppercase ? lines.map((l) => l.toLocaleUpperCase("pt-BR")) : lines,
    x: align === "center" ? box.x + box.w / 2 : align === "right" ? box.x + box.w : box.x,
    y,
    width: box.w,
    align,
    fontFamily: family(style.font),
    fontWeight: weight,
    fontSize,
    italic: Boolean(style.italic),
    lineHeightPx,
    letterSpacing: style.letterSpacing ?? 0,
    fill: color(style.color, palette),
    opacity,
    ...extra,
  });

  layout.nodes.forEach((node, idx) => {
    if (!whenSatisfied(node)) {
      passThrough(node);
      return;
    }
    const ops = nodeOps[idx];
    const opacity = node.opacity ?? 1;

    switch (node.kind) {
      case "rect": {
        if (node.wrap) {
          deferred.push(idx);
          return;
        }
        const box = placeBox(node, "shift");
        ops.push({
          op: "rect",
          ...box,
          radius: radiusOf(node.radius, tokens, box.h),
          fill: color(node.fill, palette),
          stroke: color(node.stroke, palette),
          strokeWidth: node.strokeWidth,
          opacity,
        });
        if (node.id) geometry[node.id] = box;
        return;
      }
      case "ellipse": {
        const box = placeBox(node, "shift");
        ops.push({
          op: "ellipse",
          cx: box.x + box.w / 2,
          cy: box.y + box.h / 2,
          rx: box.w / 2,
          ry: box.h / 2,
          fill: color(node.fill, palette),
          stroke: color(node.stroke, palette),
          strokeWidth: node.strokeWidth,
          opacity,
        });
        if (node.id) geometry[node.id] = box;
        return;
      }
      case "polygon": {
        ops.push({ op: "path", points: node.points, closed: true, fill: color(node.fill, palette), opacity });
        return;
      }
      case "line": {
        let dy = 0;
        if (node.stackAfter) {
          const a = geometry[node.stackAfter.id];
          dy = (a ? a.y + a.h : 0) + node.stackAfter.gap;
        }
        const points = node.points.map(([x, y]) => [x, y + dy] as [number, number]);
        ops.push({ op: "path", points, closed: false, stroke: color(node.stroke, palette), strokeWidth: node.strokeWidth, opacity });
        if (node.id) {
          const ys = points.map((p) => p[1]);
          const xs = points.map((p) => p[0]);
          geometry[node.id] = { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
        }
        return;
      }
      case "dots": {
        const fill = color(node.fill, palette);
        for (let y = node.box.y + node.radius; y <= node.box.y + node.box.h - node.radius; y += node.spacing) {
          for (let x = node.box.x + node.radius; x <= node.box.x + node.box.w - node.radius; x += node.spacing) {
            ops.push({ op: "ellipse", cx: x, cy: y, rx: node.radius, ry: node.radius, fill, opacity });
          }
        }
        return;
      }
      case "text": {
        const text = interpolate(node.text, content.vars);
        if (!text) {
          passThrough(node);
          return;
        }
        const box = placeBox(node, "limit");
        const weight = weightOf(node, tokens);
        const fit = fitText(text, node, box.w, box.h, weight);
        if (!fit.fitsWithinBounds) warnings.push(`${layout.id}: texto "${text.slice(0, 24)}…" truncado`);
        const align = node.align === "token" ? tokens.titleAlignment : node.align ?? "left";
        const free = Math.max(0, box.h - fit.totalHeightPx);
        const y = node.valign === "middle" ? box.y + free / 2 : node.valign === "bottom" ? box.y + free : box.y;
        const extra: Partial<Extract<DrawOp, { op: "text" }>> = {};
        if (node.outline) {
          extra.fill = undefined;
          extra.stroke = color(node.outline.color, palette);
          extra.strokeWidth = node.outline.width;
        }
        if (node.highlight) {
          extra.highlight = {
            color: color(node.highlight.color, palette) || palette.accent,
            padX: node.highlight.padX,
            padY: node.highlight.padY,
          };
        }
        ops.push(textOp(fit.lines, box, node, weight, fit.fontSize, fit.lineHeightPx, y, align, extra, opacity));
        if (node.id) geometry[node.id] = { x: box.x, y, w: box.w, h: fit.totalHeightPx };
        return;
      }
      case "list": {
        const items = listItems(node, content);
        if (!items.length) {
          passThrough(node);
          return;
        }
        const box = placeBox(node, "limit");
        const g = resolveList(node, items, box, tokens, palette, family, warnings, layout.id);
        ops.push(...g.ops.map((o) => ({ ...o, opacity: (o.opacity ?? 1) * opacity })));
        if (node.id) geometry[node.id] = { x: box.x, y: box.y, w: box.w, h: g.height };
        return;
      }
      case "grid": {
        const items = content.itens.slice(0, 4);
        if (!items.length) {
          passThrough(node);
          return;
        }
        const box = placeBox(node, "limit");
        const g = resolveGrid(node, items, box, tokens, palette, family);
        ops.push(...g.ops);
        if (node.id) geometry[node.id] = { x: box.x, y: box.y, w: box.w, h: g.height };
        return;
      }
      case "button": {
        const label = interpolate(node.text, content.vars);
        if (!label) {
          passThrough(node);
          return;
        }
        const box = placeBox(node, "shift");
        ops.push(...resolveButton(node, label, box, tokens, palette, family));
        if (node.id) geometry[node.id] = box;
        return;
      }
      case "chips": {
        const box = placeBox(node, "shift");
        ops.push(...resolveChips(node, box, palette, tokens));
        if (node.id) geometry[node.id] = box;
        return;
      }
      case "image": {
        const box = placeBox(node, "shift");
        const radius = node.radius === undefined ? 0 : radiusOf(node.radius, tokens, box.h);
        const mask = node.mask ?? "rect";
        if (hasCoverImage) {
          ops.push({ op: "image", source: "cover", ...box, fit: node.fit, radius, mask, blur: 0, opacity });
        } else if (mask === "circle") {
          ops.push({ op: "ellipse", cx: box.x + box.w / 2, cy: box.y + box.h / 2, rx: box.w / 2, ry: box.h / 2, fill: color(node.fallback, palette), opacity: 0.6 });
        } else {
          ops.push({ op: "rect", ...box, radius, fill: color(node.fallback, palette), opacity: 0.6 });
        }
        if (node.tint && hasCoverImage) {
          const tint = color(node.tint.color, palette);
          ops.push(
            mask === "circle"
              ? { op: "ellipse", cx: box.x + box.w / 2, cy: box.y + box.h / 2, rx: box.w / 2, ry: box.h / 2, fill: tint, opacity: node.tint.opacity }
              : { op: "rect", ...box, radius, fill: tint, opacity: node.tint.opacity }
          );
        }
        if (node.id) geometry[node.id] = box;
        return;
      }
    }
  });

  // Retângulos que envolvem outro nó (dependem da altura real do texto)
  for (const idx of deferred) {
    const node = layout.nodes[idx] as RectNode;
    const target = node.wrap ? geometry[node.wrap.id] : undefined;
    if (!node.wrap || !target || target.h <= 0) continue;
    const axisY = node.wrap.axis === "y";
    const box: Box = {
      x: axisY ? node.box.x : target.x - node.wrap.padX,
      w: axisY ? node.box.w : target.w + node.wrap.padX * 2,
      y: target.y - node.wrap.padY,
      h: target.h + node.wrap.padY * 2,
    };
    nodeOps[idx].push({
      op: "rect",
      ...box,
      radius: radiusOf(node.radius, tokens, box.h),
      fill: color(node.fill, palette),
      stroke: color(node.stroke, palette),
      strokeWidth: node.strokeWidth,
      opacity: node.opacity ?? 1,
    });
  }

  const ops: DrawOp[] = [
    ...backgroundOps(layout, params.backgroundVariant, hasCoverImage, palette, W, H),
    ...nodeOps.flat(),
    ...chromeOps(layout, slide.n, totalSlides, palette, tokens, hasLogo, W, H),
  ];

  return { layoutId: layout.id, width: W, height: H, ops, warnings };
}

// -----------------------------------------------------------------------------
// Listas, grade, botão, chips
// -----------------------------------------------------------------------------

function listItems(node: ListNode, content: LayoutContent): string[] {
  const source =
    node.field === "itens"
      ? content.itens
      : node.field === "comparacao.a.itens"
        ? content.comparacao?.a.itens || []
        : content.comparacao?.b.itens || [];
  return source.map((s) => s.trim()).filter(Boolean).slice(0, node.maxItems ?? 5);
}

function resolveList(
  node: ListNode,
  items: string[],
  box: Box,
  tokens: CoverDesignTokens,
  palette: ResolvedPalette,
  family: (f: "heading" | "body") => string,
  warnings: string[],
  layoutId: string
): { ops: DrawOp[]; height: number } {
  const weight = weightOf(node, tokens);
  const lineHeight = node.lineHeight ?? 1.3;
  const ms = node.markerSize;
  const textX = box.x + ms + 24;
  const textW = box.w - ms - 24;

  const measure = (size: number) => {
    const lh = Math.round(size * lineHeight);
    const ratio = charRatio(node, weight, size);
    const wrapped = items.map((it) => wrapTextIntoLines(it, textW, size, ratio));
    const heights = wrapped.map((lines) => Math.max(lines.length * lh, ms));
    const total = heights.reduce((a, b) => a + b, 0) + node.gap * (items.length - 1);
    return { lh, wrapped, heights, total };
  };

  let size = node.maxSize;
  let m = measure(size);
  while (m.total > box.h && size > node.minSize) {
    size = Math.max(node.minSize, size - 2);
    m = measure(size);
  }
  let count = items.length;
  while (m.total > box.h && count > 1) {
    count -= 1;
    m = { ...m, total: m.heights.slice(0, count).reduce((a, b) => a + b, 0) + node.gap * (count - 1) };
    warnings.push(`${layoutId}: lista reduzida para ${count} itens para caber`);
  }

  // Sobrou espaço? Distribui parte dele entre os itens (até 2,5× o gap) para não deixar o rodapé vazio.
  const spare = box.h - m.total;
  const gap = count > 1 && spare > 0 ? node.gap + Math.min(spare / (count - 1) / 2, node.gap * 1.5) : node.gap;

  const ops: DrawOp[] = [];
  const markerFill = color(node.markerFill, palette);
  const markerColor = color(node.markerColor, palette)!;
  const textColor = color(node.color, palette);
  const centers: Array<[number, number]> = [];
  let y = box.y;
  const itemOps: DrawOp[] = [];

  for (let i = 0; i < count; i++) {
    const lines = m.wrapped[i];
    const firstLineCenter = ms > m.lh ? y + ms / 2 : y + m.lh / 2;
    const cx = box.x + ms / 2;
    const cy = firstLineCenter;
    centers.push([cx, cy]);

    if (node.markerShape === "circle" && markerFill) {
      itemOps.push({ op: "ellipse", cx, cy, rx: ms / 2, ry: ms / 2, fill: markerFill, opacity: 1 });
    } else if (node.markerShape === "square" && markerFill) {
      itemOps.push({ op: "rect", x: cx - ms / 2, y: cy - ms / 2, w: ms, h: ms, radius: Math.round(ms * 0.22), fill: markerFill, opacity: 1 });
    }
    itemOps.push(...markerGlyph(node, i, cx, cy, markerColor, palette, family));

    const textTop = ms > m.lh ? y + (ms - m.lh) / 2 : y;
    itemOps.push({
      op: "text",
      lines,
      x: textX,
      y: textTop,
      width: textW,
      align: "left",
      fontFamily: family(node.font),
      fontWeight: weight,
      fontSize: size,
      italic: Boolean(node.italic),
      lineHeightPx: m.lh,
      letterSpacing: node.letterSpacing ?? 0,
      fill: textColor,
      opacity: 1,
    });

    y += m.heights[i];
    if (i < count - 1) {
      if (node.dividers) {
        itemOps.push({
          op: "path",
          points: [[textX, y + gap / 2], [box.x + box.w, y + gap / 2]],
          closed: false,
          stroke: color(node.dividers, palette),
          strokeWidth: 2,
          opacity: 0.25,
        });
      }
      y += gap;
    }
  }

  if (node.connector && centers.length > 1) {
    ops.push({
      op: "path",
      points: [centers[0], centers[centers.length - 1]],
      closed: false,
      stroke: color(node.connector, palette),
      strokeWidth: 4,
      opacity: 0.5,
    });
  }
  ops.push(...itemOps);
  return { ops, height: y - box.y };
}

function markerGlyph(
  node: ListNode,
  index: number,
  cx: number,
  cy: number,
  stroke: string,
  palette: ResolvedPalette,
  family: (f: "heading" | "body") => string
): DrawOp[] {
  const s = node.markerSize;
  const sw = Math.max(3, Math.round(s * 0.09));
  switch (node.marker) {
    case "number": {
      const fontSize = Math.round(s * 0.46);
      return [{
        op: "text",
        lines: [String(index + 1)],
        x: cx,
        y: cy - Math.round(fontSize * 1.15) / 2,
        width: s,
        align: "center",
        fontFamily: family("heading"),
        fontWeight: "800",
        fontSize,
        italic: false,
        lineHeightPx: Math.round(fontSize * 1.15),
        letterSpacing: 0,
        fill: stroke,
        opacity: 1,
      }];
    }
    case "check":
      return [{ op: "path", points: [[cx - s * 0.22, cy + s * 0.01], [cx - s * 0.06, cy + s * 0.17], [cx + s * 0.24, cy - s * 0.16]], closed: false, stroke, strokeWidth: sw, opacity: 1 }];
    case "cross":
      return [
        { op: "path", points: [[cx - s * 0.18, cy - s * 0.18], [cx + s * 0.18, cy + s * 0.18]], closed: false, stroke, strokeWidth: sw, opacity: 1 },
        { op: "path", points: [[cx + s * 0.18, cy - s * 0.18], [cx - s * 0.18, cy + s * 0.18]], closed: false, stroke, strokeWidth: sw, opacity: 1 },
      ];
    case "arrow":
      return [
        { op: "path", points: [[cx - s * 0.22, cy], [cx + s * 0.2, cy]], closed: false, stroke, strokeWidth: sw, opacity: 1 },
        { op: "path", points: [[cx + s * 0.04, cy - s * 0.16], [cx + s * 0.2, cy], [cx + s * 0.04, cy + s * 0.16]], closed: false, stroke, strokeWidth: sw, opacity: 1 },
      ];
    case "dot":
    default:
      if (node.markerShape === "circle") {
        return [{ op: "ellipse", cx, cy, rx: s * 0.2, ry: s * 0.2, fill: palette.bg, opacity: 1 }];
      }
      return [{ op: "ellipse", cx, cy, rx: s * 0.26, ry: s * 0.26, fill: stroke, opacity: 1 }];
  }
}

function resolveGrid(
  node: GridNode,
  items: string[],
  box: Box,
  tokens: CoverDesignTokens,
  palette: ResolvedPalette,
  family: (f: "heading" | "body") => string
): { ops: DrawOp[]; height: number } {
  const weight = weightOf(node, tokens);
  const rows = Math.ceil(items.length / node.cols);
  const cellH = Math.min(420, (box.h - node.gap * (rows - 1)) / rows);
  const cellWFull = box.w;
  const cellW = (box.w - node.gap * (node.cols - 1)) / node.cols;
  const pad = 32;
  const radius = radiusOf(node.cellRadius, tokens, cellH);

  const cells = items.map((item, i) => {
    const row = Math.floor(i / node.cols);
    const col = i % node.cols;
    const isLastOdd = i === items.length - 1 && items.length % node.cols !== 0;
    const w = isLastOdd ? cellWFull : cellW;
    const x = box.x + (isLastOdd ? 0 : col * (cellW + node.gap));
    const y = box.y + row * (cellH + node.gap);
    return { item, x, y, w };
  });

  const textTopOffset = pad + node.indexSize + 16;
  const fits = cells.map((c) =>
    calculateAutoFitFontSize({
      text: c.item,
      maxWidthPx: c.w - pad * 2,
      maxHeightPx: cellH - textTopOffset - pad,
      maxFontSize: node.maxSize,
      minFontSize: node.minSize,
      lineHeight: node.lineHeight ?? 1.3,
      avgCharWidthRatio: charRatio(node, weight, node.maxSize),
    })
  );
  const size = Math.min(...fits.map((f) => f.fontSize));
  const lh = Math.round(size * (node.lineHeight ?? 1.3));

  const ops: DrawOp[] = [];
  cells.forEach((c, i) => {
    ops.push({ op: "rect", x: c.x, y: c.y, w: c.w, h: cellH, radius, fill: color(node.cellFill, palette), opacity: 1 });
    ops.push({
      op: "text",
      lines: [String(i + 1).padStart(2, "0")],
      x: c.x + pad,
      y: c.y + pad,
      width: c.w - pad * 2,
      align: "left",
      fontFamily: family("heading"),
      fontWeight: "800",
      fontSize: node.indexSize,
      italic: false,
      lineHeightPx: Math.round(node.indexSize * 1.1),
      letterSpacing: 0,
      fill: color(node.indexColor, palette),
      opacity: 1,
    });
    const maxLines = Math.max(1, Math.floor((cellH - textTopOffset - pad) / lh));
    const lines = wrapTextIntoLines(c.item, c.w - pad * 2, size, charRatio(node, weight, size)).slice(0, maxLines);
    ops.push({
      op: "text",
      lines,
      x: c.x + pad,
      y: c.y + textTopOffset,
      width: c.w - pad * 2,
      align: "left",
      fontFamily: family(node.font),
      fontWeight: weight,
      fontSize: size,
      italic: false,
      lineHeightPx: lh,
      letterSpacing: 0,
      fill: color(node.color, palette),
      opacity: 1,
    });
  });

  return { ops, height: rows * cellH + (rows - 1) * node.gap };
}

function resolveButton(
  node: ButtonNode,
  label: string,
  box: Box,
  tokens: CoverDesignTokens,
  palette: ResolvedPalette,
  family: (f: "heading" | "body") => string
): DrawOp[] {
  const arrowSpace = node.arrow ? 56 : 0;
  const fit = calculateAutoFitFontSize({
    text: label,
    maxWidthPx: box.w - 64 - arrowSpace,
    maxHeightPx: Math.round(box.h * 0.62),
    maxFontSize: node.maxSize,
    minFontSize: node.minSize,
    lineHeight: 1.12,
    avgCharWidthRatio: 0.6,
  });
  const fg = color(node.color, palette)!;
  const cy = box.y + box.h / 2;
  const ops: DrawOp[] = [
    { op: "rect", ...box, radius: radiusOf(node.radius, tokens, box.h), fill: color(node.fill, palette), opacity: node.opacity ?? 1 },
    {
      op: "text",
      lines: fit.lines,
      x: box.x + (box.w - arrowSpace) / 2,
      y: cy - fit.totalHeightPx / 2,
      width: box.w - 64 - arrowSpace,
      align: "center",
      fontFamily: family("heading"),
      fontWeight: "700",
      fontSize: fit.fontSize,
      italic: false,
      lineHeightPx: fit.lineHeightPx,
      letterSpacing: 0,
      fill: fg,
      opacity: 1,
    },
  ];
  if (node.arrow) {
    const ax = box.x + box.w - 64;
    ops.push(
      { op: "path", points: [[ax - 16, cy], [ax + 16, cy]], closed: false, stroke: fg, strokeWidth: 5, opacity: 1 },
      { op: "path", points: [[ax + 2, cy - 14], [ax + 16, cy], [ax + 2, cy + 14]], closed: false, stroke: fg, strokeWidth: 5, opacity: 1 }
    );
  }
  return ops;
}

function resolveChips(node: ChipsNode, box: Box, palette: ResolvedPalette, tokens: CoverDesignTokens): DrawOp[] {
  const n = node.items.length;
  if (!n) return [];
  const w = (box.w - node.gap * (n - 1)) / n;
  const ops: DrawOp[] = [];
  node.items.forEach((label, i) => {
    const x = box.x + i * (w + node.gap);
    ops.push({ op: "rect", x, y: box.y, w, h: box.h, radius: box.h / 2, fill: color(node.fill, palette), opacity: node.opacity ?? 1 });
    ops.push({
      op: "text",
      lines: [label],
      x: x + w / 2,
      y: box.y + (box.h - Math.round(node.size * 1.2)) / 2,
      width: w - 24,
      align: "center",
      fontFamily: tokens.bodyFont,
      fontWeight: "600",
      fontSize: node.size,
      italic: false,
      lineHeightPx: Math.round(node.size * 1.2),
      letterSpacing: 0,
      fill: color(node.color, palette),
      opacity: 1,
    });
  });
  return ops;
}

// -----------------------------------------------------------------------------
// Fundo e "chrome" (numeração, logo, indicador de arraste)
// -----------------------------------------------------------------------------

function backgroundOps(
  layout: CarouselLayout,
  variant: CarouselBackgroundVariant | undefined,
  hasCoverImage: boolean,
  palette: ResolvedPalette,
  W: number,
  H: number
): DrawOp[] {
  const bg = color(layout.background, palette)!;
  const ops: DrawOp[] = [{ op: "rect", x: 0, y: 0, w: W, h: H, radius: 0, fill: bg, opacity: 1 }];
  if (layout.ownsBackground) return ops;
  if (variant === "blurred_cover_crop" && hasCoverImage) {
    ops.push(
      { op: "image", source: "cover", x: -120, y: -120, w: W + 240, h: H + 240, fit: "cover", radius: 0, mask: "rect", blur: 24, opacity: 0.22 },
      { op: "rect", x: 0, y: 0, w: W, h: H, radius: 0, fill: bg, opacity: 0.82 }
    );
  } else if (variant === "cover_stripe_geometry") {
    ops.push(
      { op: "rect", x: 0, y: 0, w: 18, h: H, radius: 0, fill: palette.accent, opacity: 1 },
      { op: "rect", x: 0, y: H - 18, w: W, h: 18, radius: 0, fill: palette.secondary, opacity: 1 }
    );
  }
  return ops;
}

function cornerXY(corner: Corner, w: number, h: number, W: number, H: number): [number, number] {
  switch (corner) {
    case "top-left":
      return [MARGIN, MARGIN];
    case "top-right":
      return [W - MARGIN - w, MARGIN];
    case "bottom-left":
      return [MARGIN, H - MARGIN - h];
    case "bottom-right":
      return [W - MARGIN - w, H - MARGIN - h];
    case "bottom-center":
      return [(W - w) / 2, H - MARGIN - h];
  }
}

function chromeOps(
  layout: CarouselLayout,
  n: number,
  total: number,
  palette: ResolvedPalette,
  tokens: CoverDesignTokens,
  hasLogo: boolean,
  W: number,
  H: number
): DrawOp[] {
  const { chrome } = layout;
  const ops: DrawOp[] = [];
  const fg = chrome.tone === "onAccent" ? palette.onAccent : palette.text;

  if (chrome.counter === "pill") {
    const [x, y] = cornerXY(chrome.counterPos, 130, 54, W, H);
    ops.push(
      { op: "rect", x, y, w: 130, h: 54, radius: 27, fill: palette.accent, opacity: 1 },
      { op: "text", lines: [`${n}/${total}`], x: x + 65, y: y + 11, width: 130, align: "center", fontFamily: tokens.headingFont, fontWeight: "700", fontSize: 26, italic: false, lineHeightPx: 32, letterSpacing: 0, fill: palette.onAccent, opacity: 1 }
    );
  } else if (chrome.counter === "text") {
    const label = `${String(n).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
    const [x, y] = cornerXY(chrome.counterPos, 160, 34, W, H);
    ops.push({ op: "text", lines: [label], x: x + 80, y, width: 160, align: "center", fontFamily: tokens.headingFont, fontWeight: "600", fontSize: 26, italic: false, lineHeightPx: 34, letterSpacing: 3, fill: fg, opacity: 0.7 });
  } else if (chrome.counter === "bar") {
    const gap = 10;
    const segW = (W - MARGIN * 2 - gap * (total - 1)) / total;
    for (let i = 0; i < total; i++) {
      ops.push({ op: "rect", x: MARGIN + i * (segW + gap), y: 56, w: segW, h: 8, radius: 4, fill: i < n ? palette.accent : palette.muted, opacity: i < n ? 1 : 0.3 });
    }
  }

  if (n < total) {
    if (chrome.swipe === "pill") {
      const [x, y] = cornerXY("bottom-right", 210, 56, W, H);
      ops.push(
        { op: "rect", x, y, w: 210, h: 56, radius: 28, fill: palette.secondary, opacity: 0.9 },
        { op: "text", lines: ["Arraste →"], x: x + 105, y: y + 13, width: 210, align: "center", fontFamily: tokens.bodyFont, fontWeight: "600", fontSize: 24, italic: false, lineHeightPx: 30, letterSpacing: 0, fill: palette.onSecondary, opacity: 1 }
      );
    } else if (chrome.swipe === "arrow") {
      const [x, y] = cornerXY("bottom-right", 72, 72, W, H);
      const cx = x + 36;
      const cy = y + 36;
      ops.push(
        { op: "ellipse", cx, cy, rx: 36, ry: 36, stroke: palette.accent, strokeWidth: 4, opacity: 1 },
        { op: "path", points: [[cx - 14, cy], [cx + 12, cy]], closed: false, stroke: palette.accent, strokeWidth: 4, opacity: 1 },
        { op: "path", points: [[cx, cy - 12], [cx + 12, cy], [cx, cy + 12]], closed: false, stroke: palette.accent, strokeWidth: 4, opacity: 1 }
      );
    }
  }

  if (hasLogo && chrome.logo !== "none") {
    const [x, y] = cornerXY(chrome.logo, 170, 68, W, H);
    ops.push({ op: "image", source: "logo", x, y, w: 170, h: 68, fit: "contain", radius: 0, mask: "rect", blur: 0, opacity: 0.92, anchor: chrome.logo.endsWith("left") ? "left" : chrome.logo.endsWith("right") ? "right" : "center" });
  }

  return ops;
}
