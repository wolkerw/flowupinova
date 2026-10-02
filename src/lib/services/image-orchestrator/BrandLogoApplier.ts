import { Jimp } from "jimp";

export interface ApplyLogoOptions {
  position?: "top-left" | "top-right" | "top-center";
  maxScale?: number; // Padrão: 0.20 (20% da largura da imagem)
  marginRatio?: number; // Padrão: 0.04 (4% de margem segura)
}

/**
 * Aplica a logomarca oficial do BrandKit com precisão pixel-perfect,
 * preservando canal alfa (transparência) e proporções originais.
 * 
 * Isso elimina a dependência de modelos de difusão/IA para desenhar logos
 * (o que gerava alucinações como florzinhas, sóis e logos inventadas).
 */
export class BrandLogoApplier {
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

      const mainImage = await Jimp.read(imageBuffer);
      const logoImage = await Jimp.read(logoBuf);

      const mainW = mainImage.width;
      const mainH = mainImage.height;

      if (!mainW || !mainH || !logoImage.width || !logoImage.height) {
        return imageBuffer;
      }

      // Escala: aproximadamente 18% a 20% da largura da imagem
      const scale = options.maxScale ?? 0.20;
      let targetLogoW = Math.round(mainW * scale);
      const aspect = logoImage.height / logoImage.width;
      let targetLogoH = Math.round(targetLogoW * aspect);

      // Limitar altura a no máximo 12% da altura da arte para logotipos verticais
      const maxH = Math.round(mainH * 0.12);
      if (targetLogoH > maxH) {
        targetLogoH = maxH;
        targetLogoW = Math.round(targetLogoH / aspect);
      }

      if (targetLogoW <= 0 || targetLogoH <= 0) return imageBuffer;

      logoImage.resize({ w: targetLogoW, h: targetLogoH });

      // Margem segura proporcional
      const margin = Math.round(mainW * (options.marginRatio ?? 0.04));
      const pos = options.position ?? "top-left";

      let posX = margin;
      let posY = margin;

      if (pos === "top-right") {
        posX = mainW - targetLogoW - margin;
      } else if (pos === "top-center") {
        posX = Math.round((mainW - targetLogoW) / 2);
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
