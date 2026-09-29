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

  public static async buildReferences(params: {
    sourceAssetUrls?: string[];
    referenceAssetUrls?: string[];
    logoUrl?: string;
    businessName?: string;
    brief?: string;
  }): Promise<ReferenceInput[]> {
    const references: ReferenceInput[] = [];

    // 1. Fotos do Sujeito Real (Pessoa ou Produto) enviadas na Etapa 5
    if (params.sourceAssetUrls && params.sourceAssetUrls.length > 0) {
      for (const srcUrl of params.sourceAssetUrls.slice(0, 2)) {
        try {
          const res = await fetch(srcUrl);
          if (res.ok) {
            const ab = await res.arrayBuffer();
            const buf = Buffer.from(ab);
            references.push({
              url: srcUrl,
              mimeType: this.detectMimeType(srcUrl, buf),
              base64: buf.toString("base64"),
              role: "product_subject",
              description: "Foto real da pessoa ou produto enviada pelo usuário na Etapa 5",
            });
          }
        } catch (e) {
          console.warn("[ReferenceContextBuilder] Erro ao carregar foto do sujeito/produto:", e);
        }
      }
    }

    // 2. Fotos de Inspiração / Estilo enviadas na Etapa 5
    if (params.referenceAssetUrls && params.referenceAssetUrls.length > 0) {
      for (const refUrl of params.referenceAssetUrls.slice(0, 2)) {
        try {
          const res = await fetch(refUrl);
          if (res.ok) {
            const ab = await res.arrayBuffer();
            const buf = Buffer.from(ab);
            references.push({
              url: refUrl,
              mimeType: this.detectMimeType(refUrl, buf),
              base64: buf.toString("base64"),
              role: "style_reference",
              description: "Foto de referência estética, cores ou iluminação enviada na Etapa 5",
            });
          }
        } catch (e) {
          console.warn("[ReferenceContextBuilder] Erro ao carregar imagem de referência de estilo:", e);
        }
      }
    }

    // 3. Logomarca Oficial do Negócio enviada ou cadastrada no BrandKit
    if (params.logoUrl) {
      try {
        const res = await fetch(params.logoUrl);
        if (res.ok) {
          const ab = await res.arrayBuffer();
          const buf = Buffer.from(ab);
          references.push({
            url: params.logoUrl,
            mimeType: this.detectMimeType(params.logoUrl, buf),
            base64: buf.toString("base64"),
            role: "business_logo",
            description: "Logomarca oficial do negócio que DEVE ser inserida e visível na imagem solicitada de forma nítida e integrada",
          });
        }
      } catch (e) {
        console.warn("[ReferenceContextBuilder] Erro ao carregar logomarca do negócio:", e);
      }
    }

    return references;
  }
}
