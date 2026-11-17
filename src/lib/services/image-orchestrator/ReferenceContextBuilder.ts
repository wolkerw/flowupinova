import type { ReferenceInput } from "./types";

export class ReferenceContextBuilder {
  private static detectMimeType(url: string, buf: Buffer): string {
    if (buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
      return "image/png";
    }
    if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
      return "image/jpeg";
    }
    if (url.toLowerCase().includes(".png")) return "image/png";
    if (url.toLowerCase().includes(".webp")) return "image/webp";
    return "image/jpeg";
  }

  private static async loadAssetData(url: string): Promise<{ mimeType: string; base64: string } | null> {
    try {
      // Suporte nativo para Data URIs (base64) sem depender de fetch HTTP
      if (url.startsWith("data:")) {
        const match = url.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          return {
            mimeType: match[1] || "image/jpeg",
            base64: match[2],
          };
        }
      }

      const res = await fetch(url);
      if (!res.ok) return null;
      const ab = await res.arrayBuffer();
      const buf = Buffer.from(ab);
      return {
        mimeType: this.detectMimeType(url, buf),
        base64: buf.toString("base64"),
      };
    } catch (e) {
      console.warn(`[ReferenceContextBuilder] Falha ao carregar recurso visual (${url.slice(0, 60)}):`, e);
      return null;
    }
  }

  public static async buildReferences(params: {
    sourceAssetUrls?: string[];
    referenceAssetUrls?: string[];
    logoUrl?: string;
    businessName?: string;
    brief?: string;
  }): Promise<ReferenceInput[]> {
    const references: ReferenceInput[] = [];

    // 1. Fotos do Sujeito Real (Pessoa, Produto ou Logomarca) enviadas na Etapa 5
    if (params.sourceAssetUrls && params.sourceAssetUrls.length > 0) {
      for (const srcUrl of params.sourceAssetUrls.slice(0, 2)) {
        const data = await this.loadAssetData(srcUrl);
        if (data) {
          references.push({
            url: srcUrl,
            mimeType: data.mimeType,
            base64: data.base64,
            role: "product_subject",
            description: "Foto real da pessoa, produto ou logomarca enviada pelo usuário na Etapa 5",
          });
        }
      }
    }

    // 2. Fotos de Inspiração / Estilo enviadas na Etapa 5
    if (params.referenceAssetUrls && params.referenceAssetUrls.length > 0) {
      for (const refUrl of params.referenceAssetUrls.slice(0, 2)) {
        const data = await this.loadAssetData(refUrl);
        if (data) {
          references.push({
            url: refUrl,
            mimeType: data.mimeType,
            base64: data.base64,
            role: "style_reference",
            description: "Foto de referência estética, cores ou iluminação enviada na Etapa 5",
          });
        }
      }
    }

    // 3. Logomarca Oficial do Negócio enviada ou cadastrada no BrandKit
    if (params.logoUrl) {
      const data = await this.loadAssetData(params.logoUrl);
      if (data) {
        references.push({
          url: params.logoUrl,
          mimeType: data.mimeType,
          base64: data.base64,
          role: "business_logo",
          description: "Logomarca oficial do negócio que DEVE ser inserida e visível na imagem solicitada de forma nítida e integrada",
        });
      }
    }

    return references;
  }
}
