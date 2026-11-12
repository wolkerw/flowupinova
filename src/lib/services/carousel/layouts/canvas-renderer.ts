/**
 * Desenha um slide resolvido num CanvasRenderingContext2D (navegador).
 * Nenhuma chamada de IA: só formas, texto e recortes da capa já gerada.
 */

import type { DrawOp, ResolvedSlide } from "./types";

export interface LayoutImages {
  cover?: CanvasImageSource & { width: number; height: number } | null;
  logo?: CanvasImageSource & { width: number; height: number } | null;
}

function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function fontString(op: Extract<DrawOp, { op: "text" }>): string {
  return `${op.italic ? "italic " : ""}${op.fontWeight} ${op.fontSize}px "${op.fontFamily}", sans-serif`;
}

function drawText(ctx: CanvasRenderingContext2D, op: Extract<DrawOp, { op: "text" }>) {
  ctx.font = fontString(op);
  ctx.textAlign = op.align;
  ctx.textBaseline = "top";
  if ("letterSpacing" in ctx) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${op.letterSpacing}px`;
  }

  if (op.highlight) {
    ctx.save();
    ctx.fillStyle = op.highlight.color;
    op.lines.forEach((line, i) => {
      const w = ctx.measureText(line).width;
      const left = op.align === "center" ? op.x - w / 2 : op.align === "right" ? op.x - w : op.x;
      const top = op.y + i * op.lineHeightPx + (op.lineHeightPx - op.fontSize * 1.12) / 2;
      ctx.fillRect(left - op.highlight!.padX, top - op.highlight!.padY, w + op.highlight!.padX * 2, op.fontSize * 1.12 + op.highlight!.padY * 2);
    });
    ctx.restore();
  }

  op.lines.forEach((line, i) => {
    // Centraliza a fonte dentro da altura da linha
    const y = op.y + i * op.lineHeightPx + (op.lineHeightPx - op.fontSize) / 2;
    if (op.fill) {
      ctx.fillStyle = op.fill;
      ctx.fillText(line, op.x, y);
    }
    if (op.stroke) {
      ctx.strokeStyle = op.stroke;
      ctx.lineWidth = op.strokeWidth ?? 2;
      ctx.lineJoin = "round";
      ctx.strokeText(line, op.x, y);
    }
  });
}

function drawImage(ctx: CanvasRenderingContext2D, op: Extract<DrawOp, { op: "image" }>, images: LayoutImages) {
  const img = op.source === "cover" ? images.cover : images.logo;
  if (!img || !img.width || !img.height) return;

  let dx = op.x;
  let dy = op.y;
  let dw = op.w;
  let dh = op.h;
  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;

  if (op.fit === "cover") {
    const scale = Math.max(op.w / img.width, op.h / img.height);
    sw = op.w / scale;
    sh = op.h / scale;
    sx = (img.width - sw) / 2;
    sy = (img.height - sh) / 2;
  } else {
    const scale = Math.min(op.w / img.width, op.h / img.height);
    dw = img.width * scale;
    dh = img.height * scale;
    const anchor = op.anchor ?? "center";
    dx = anchor === "left" ? op.x : anchor === "right" ? op.x + op.w - dw : op.x + (op.w - dw) / 2;
    dy = op.y + (op.h - dh) / 2;
  }

  ctx.save();
  if (op.mask === "circle") {
    ctx.beginPath();
    ctx.ellipse(op.x + op.w / 2, op.y + op.h / 2, op.w / 2, op.h / 2, 0, 0, Math.PI * 2);
    ctx.clip();
  } else if (op.radius > 0) {
    roundedRectPath(ctx, op.x, op.y, op.w, op.h, op.radius);
    ctx.clip();
  }
  if (op.blur > 0) ctx.filter = `blur(${op.blur}px)`;
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
  ctx.restore();
}

export function drawOps(ctx: CanvasRenderingContext2D, ops: DrawOp[], images: LayoutImages = {}) {
  for (const op of ops) {
    ctx.save();
    ctx.globalAlpha = op.opacity;
    switch (op.op) {
      case "rect":
        roundedRectPath(ctx, op.x, op.y, op.w, op.h, op.radius);
        if (op.fill) {
          ctx.fillStyle = op.fill;
          ctx.fill();
        }
        if (op.stroke) {
          ctx.strokeStyle = op.stroke;
          ctx.lineWidth = op.strokeWidth ?? 2;
          ctx.stroke();
        }
        break;
      case "ellipse":
        ctx.beginPath();
        ctx.ellipse(op.cx, op.cy, op.rx, op.ry, 0, 0, Math.PI * 2);
        if (op.fill) {
          ctx.fillStyle = op.fill;
          ctx.fill();
        }
        if (op.stroke) {
          ctx.strokeStyle = op.stroke;
          ctx.lineWidth = op.strokeWidth ?? 2;
          ctx.stroke();
        }
        break;
      case "path":
        if (!op.points.length) break;
        ctx.beginPath();
        ctx.moveTo(op.points[0][0], op.points[0][1]);
        for (const [x, y] of op.points.slice(1)) ctx.lineTo(x, y);
        if (op.closed) ctx.closePath();
        if (op.fill) {
          ctx.fillStyle = op.fill;
          ctx.fill();
        }
        if (op.stroke) {
          ctx.strokeStyle = op.stroke;
          ctx.lineWidth = op.strokeWidth ?? 2;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.stroke();
        }
        break;
      case "text":
        drawText(ctx, op);
        break;
      case "image":
        drawImage(ctx, op, images);
        break;
    }
    ctx.restore();
  }
}

function loadImage(src: string | null | undefined): Promise<HTMLImageElement | null> {
  if (!src || typeof window === "undefined" || typeof Image === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Renderiza o slide resolvido em PNG (data URL). Retorna "" fora do navegador. */
export async function renderResolvedSlideToDataUrl(
  slide: ResolvedSlide,
  sources: { coverImageUrl?: string | null; logoUrl?: string | null }
): Promise<string> {
  if (typeof document === "undefined") return "";
  const canvas = document.createElement("canvas");
  canvas.width = slide.width;
  canvas.height = slide.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const needsCover = slide.ops.some((o) => o.op === "image" && o.source === "cover");
  const needsLogo = slide.ops.some((o) => o.op === "image" && o.source === "logo");
  const [cover, logo] = await Promise.all([
    needsCover ? loadImage(sources.coverImageUrl) : Promise.resolve(null),
    needsLogo ? loadImage(sources.logoUrl) : Promise.resolve(null),
  ]);

  if (typeof document !== "undefined" && "fonts" in document) {
    try {
      await (document as Document & { fonts: FontFaceSet }).fonts.ready;
    } catch {
      // segue com a fonte disponível
    }
  }

  drawOps(ctx, slide.ops, { cover, logo });
  return canvas.toDataURL("image/png");
}
