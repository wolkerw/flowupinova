import { FORMAT_DIMENSIONS, type AIImageFormat } from "@/lib/types/ai-image-general";

async function getJimpInstance() {
  const mod: any = await import("jimp");
  return mod.Jimp || mod.default?.Jimp || mod.default || mod;
}

export class ImageResultValidator {
  public static async validateAndNormalize(
    buffer: Buffer,
    format: AIImageFormat
  ): Promise<{
    buffer: Buffer;
    width: number;
    height: number;
  }> {
    if (!buffer || buffer.length === 0) {
      throw new Error("Buffer de imagem inválido ou vazio gerado pelo modelo.");
    }

    const targetDims = FORMAT_DIMENSIONS[format] || { width: 1080, height: 1350 };
    const targetWidth = targetDims.width;
    const targetHeight = targetDims.height;

    try {
      const Jimp = await getJimpInstance();
      const jimpImage = await Jimp.read(buffer);

      const imgWidth = jimpImage.width;
      const imgHeight = jimpImage.height;
      const currentRatio = imgWidth / imgHeight;
      const targetRatio = targetWidth / targetHeight;

      // Preservação matemática rigorosa de proporções:
      // Se a proporção for praticamente idêntica (ex: 1024x1280 para 1080x1350, ambas 4:5), resize direto
      if (Math.abs(currentRatio - targetRatio) < 0.005) {
        jimpImage.resize({ w: targetWidth, h: targetHeight });
      } else if (typeof jimpImage.cover === "function") {
        // Redimensionamento proporcional inteligente (cover):
        // Escala uniformemente mantendo a proporção de pixels 1:1 e corta o respiro excedente centralizado,
        // eliminando 100% de qualquer achatamento ou estiramento de rostos, produtos, textos e ícones circulares.
        jimpImage.cover({ w: targetWidth, h: targetHeight });
      } else {
        // Fallback proporcional caso .cover não esteja implementado
        const scale = Math.max(targetWidth / imgWidth, targetHeight / imgHeight);
        const scaledWidth = Math.round(imgWidth * scale);
        const scaledHeight = Math.round(imgHeight * scale);
        jimpImage.resize({ w: scaledWidth, h: scaledHeight });
        const cropX = Math.max(0, Math.floor((scaledWidth - targetWidth) / 2));
        const cropY = Math.max(0, Math.floor((scaledHeight - targetHeight) / 2));
        jimpImage.crop({ x: cropX, y: cropY, w: targetWidth, h: targetHeight });
      }

      const processedBuffer = await jimpImage.getBuffer("image/png");

      return {
        buffer: processedBuffer,
        width: targetWidth,
        height: targetHeight,
      };
    } catch (err) {
      console.warn("[ImageResultValidator] Aviso ao processar via Jimp, usando buffer original:", err);
      return {
        buffer,
        width: targetWidth,
        height: targetHeight,
      };
    }
  }
}
