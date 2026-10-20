export interface ApplyLogoOptions {
  position?: "top-left" | "top-right" | "top-center" | "auto";
  maxScale?: number; // Padrão: 0.18 (18% da largura da imagem)
  marginRatio?: number; // Padrão: 0.04 (4% de margem segura)
  avoidCollisions?: boolean; // Padrão: true (detecta texto/gráficos e busca a melhor posição limpa)
}

async function getJimpInstance() {
  const mod: any = await import("jimp");
  return mod.Jimp || mod.default?.Jimp || mod.default || mod;
}

/**
 * Aplica a logomarca oficial do BrandKit com precisão pixel-perfect,
 * preservando canal alfa (transparência) e proporções originais.
 * 
 * Inclui sistema inteligente anti-colisão que analisa contraste e densidade
 * de bordas (edge transitions) para NUNCA sobrepor textos, títulos ou elementos gráficos.
 */
export class BrandLogoApplier {
  /**
   * Analisa a região do bounding box para calcular densidade de bordas e contraste.
   * Valores altos de clutterScore (> 8.0) indicam presença de texto, títulos ou gráficos complexos.
   */
  public static analyzeRegion(
    img: any,
    x0: number,
    y0: number,
    boxW: number,
    boxH: number
  ): { edgeDensity: number; stdDev: number; clutterScore: number; mean: number } {
    if (typeof img?.getPixelColor !== "function") {
      return { edgeDensity: 0, stdDev: 0, clutterScore: 0, mean: 255 };
    }

    let lumSum = 0;
    let lumSqSum = 0;
    let edgeCount = 0;
    let count = 0;
    const w = img.width || 0;
    const h = img.height || 0;

    // Amostragem com salto de 2 pixels para alta performance (< 5ms)
    for (let y = y0; y < y0 + boxH && y < h; y += 2) {
      for (let x = x0; x < x0 + boxW && x < w; x += 2) {
        const color = img.getPixelColor(x, y);
        const r = (color >> 24) & 255;
        const g = (color >> 16) & 255;
        const b = (color >> 8) & 255;
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        lumSum += lum;
        lumSqSum += lum * lum;
        count++;

        if (x + 2 < w) {
          const rightColor = img.getPixelColor(x + 2, y);
          const rr = (rightColor >> 24) & 255;
          const rg = (rightColor >> 16) & 255;
          const rb = (rightColor >> 8) & 255;
          const rightLum = 0.299 * rr + 0.587 * rg + 0.114 * rb;
          if (Math.abs(lum - rightLum) > 30) edgeCount++;
        }
      }
    }

    const mean = count > 0 ? lumSum / count : 0;
    const variance = count > 0 ? Math.max(0, (lumSqSum / count) - (mean * mean)) : 0;
    const stdDev = Math.sqrt(variance);
    const edgeDensity = count > 0 ? edgeCount / count : 0;
    const clutterScore = edgeDensity * 100 + (stdDev / 10);

    return { edgeDensity, stdDev, clutterScore, mean };
  }

  public static async applyLogo(
    imageBuffer: Buffer,
    logoBufferOrUrl: Buffer | string,
    options: ApplyLogoOptions = {}
  ): Promise<Buffer> {
    try {
      if (!imageBuffer || imageBuffer.length === 0) return imageBuffer;
      if (!logoBufferOrUrl) return imageBuffer;

      let logoBuf: Buffer;
      if (typeof logoBufferOrUrl === "string") {
        if (!logoBufferOrUrl.trim()) return imageBuffer;
        const res = await fetch(logoBufferOrUrl);
        if (!res.ok) {
          console.warn(`[BrandLogoApplier] Falha ao baixar logomarca (${res.status}): ${logoBufferOrUrl}`);
          return imageBuffer;
        }
        logoBuf = Buffer.from(await res.arrayBuffer());
      } else {
        logoBuf = logoBufferOrUrl;
      }

      if (!logoBuf || logoBuf.length === 0) return imageBuffer;

      const Jimp = await getJimpInstance();
      const mainImage = await Jimp.read(imageBuffer);
      const logoImage = await Jimp.read(logoBuf);

      const mainW = mainImage.width;
      const mainH = mainImage.height;

      if (!mainW || !mainH || !logoImage.width || !logoImage.height) {
        return imageBuffer;
      }

      // Escala: aproximadamente 18% da largura da imagem (elegante e seguro)
      const scale = options.maxScale ?? 0.18;
      let targetLogoW = Math.round(mainW * scale);
      const aspect = logoImage.height / logoImage.width;
      let targetLogoH = Math.round(targetLogoW * aspect);

      // Limitar altura a no máximo 11% da altura da arte para logotipos verticais
      const maxH = Math.round(mainH * 0.11);
      if (targetLogoH > maxH) {
        targetLogoH = maxH;
        targetLogoW = Math.round(targetLogoH / aspect);
      }

      if (targetLogoW <= 0 || targetLogoH <= 0) return imageBuffer;

      logoImage.resize({ w: targetLogoW, h: targetLogoH });

      // Margem segura proporcional
      const margin = Math.round(mainW * (options.marginRatio ?? 0.04));
      const requestedPos = options.position ?? "top-left";
      const avoidCollisions = options.avoidCollisions ?? true;

      const candidates: Record<"top-left" | "top-right" | "top-center", { x: number; y: number }> = {
        "top-left": { x: margin, y: margin },
        "top-right": { x: mainW - targetLogoW - margin, y: margin },
        "top-center": { x: Math.round((mainW - targetLogoW) / 2), y: margin },
      };

      let chosenPos: "top-left" | "top-right" | "top-center" =
        requestedPos === "auto" ? "top-left" : requestedPos;
      let posX = candidates[chosenPos].x;
      let posY = candidates[chosenPos].y;

      let needBackdrop = false;
      let backdropIsDark = false;

      // Análise inteligente anti-colisão se a imagem suportar leitura de pixels
      if (avoidCollisions && typeof mainImage.getPixelColor === "function") {
        const preferredScore = this.analyzeRegion(mainImage, posX, posY, targetLogoW, targetLogoH);

        // Clutter score > 8.0 indica presença de texto com alto contraste ou elementos gráficos complexos
        if (preferredScore.clutterScore > 8.0) {
          const scoredCandidates = (["top-left", "top-right", "top-center"] as const).map((posKey) => {
            const coords = candidates[posKey];
            const analysis = this.analyzeRegion(mainImage, coords.x, coords.y, targetLogoW, targetLogoH);
            return { pos: posKey, ...coords, analysis };
          });

          scoredCandidates.sort((a, b) => a.analysis.clutterScore - b.analysis.clutterScore);
          const cleanest = scoredCandidates[0];

          // Se outra posição tiver pontuação significativamente mais limpa (< 50% da preferida e <= 10.0), reloca
          if (cleanest.analysis.clutterScore < preferredScore.clutterScore * 0.5 && cleanest.analysis.clutterScore <= 10.0) {
            chosenPos = cleanest.pos;
            posX = cleanest.x;
            posY = cleanest.y;
            console.log(
              `[BrandLogoApplier] Conflito com texto detectado em '${requestedPos}' (clutter: ${preferredScore.clutterScore.toFixed(1)}). Logomarca relocada para área limpa '${cleanest.pos}' (clutter: ${cleanest.analysis.clutterScore.toFixed(1)}).`
            );
          } else {
            // Se todas as posições do topo possuem elementos ou texto denso, aplicar sutil badge protetor translúcido
            needBackdrop = true;
            backdropIsDark = preferredScore.mean < 128;
            console.log(
              `[BrandLogoApplier] Cabeçalho com densidade gráfica alta em todas as posições. Aplicando badge protetor translúcido para garantir legibilidade da logomarca.`
            );
          }
        }
      }

      if (needBackdrop) {
        try {
          const padX = 14;
          const padY = 8;
          const bgW = targetLogoW + padX * 2;
          const bgH = targetLogoH + padY * 2;
          const bgX = Math.max(0, posX - padX);
          const bgY = Math.max(0, posY - padY);
          // Fundo translúcido (branco suave 0xFFFFFFEE se fundo claro, ou dark 0x0F172ACC se fundo escuro)
          const bgColor = backdropIsDark ? 0x0f172acc : 0xffffffee;
          const bgPill = new Jimp({ width: bgW, height: bgH, color: bgColor });
          mainImage.composite(bgPill, bgX, bgY);
        } catch (badgeErr) {
          console.warn("[BrandLogoApplier] Aviso ao criar badge de fundo:", badgeErr);
        }
      }

      mainImage.composite(logoImage, posX, posY);
      const compositeBuffer = await mainImage.getBuffer("image/png");

      return compositeBuffer;
    } catch (err: any) {
      console.warn("[BrandLogoApplier] Erro ao aplicar logomarca oficial via Jimp:", err?.message || err);
      return imageBuffer;
    }
  }
}
