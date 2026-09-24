import { Jimp } from "jimp";
import { FORMAT_DIMENSIONS, type AIImageFormat } from "@/lib/types/ai-image-general";

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
      const jimpImage = await Jimp.read(buffer);
      // Redimensionamento direto e suave sem crop destrutivo
      jimpImage.resize({ w: targetWidth, h: targetHeight });
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
