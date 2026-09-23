import fs from "fs";
import path from "path";
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

    // 1. Fotos de Sujeito / Produto ou Logomarca direta enviadas pelo usuário
    if (params.sourceAssetUrls && params.sourceAssetUrls.length > 0) {
      for (const srcUrl of params.sourceAssetUrls.slice(0, 2)) {
        try {
          const res = await fetch(srcUrl);
          if (res.ok) {
            const ab = await res.arrayBuffer();
            const buf = Buffer.from(ab);
            const isLogo = srcUrl.toLowerCase().includes("logo");
            references.push({
              url: srcUrl,
              mimeType: this.detectMimeType(srcUrl, buf),
              base64: buf.toString("base64"),
              role: isLogo ? "official_logo" : "product_subject",
              description: isLogo
                ? "Logomarca enviada pelo usuário"
                : "Foto real do sujeito ou produto enviada pelo usuário",
            });
          }
        } catch (e) {
          console.warn("[ReferenceContextBuilder] Erro ao carregar foto do sujeito:", e);
        }
      }
    }

    // 2. Logomarca oficial do BrandKit
    if (params.logoUrl && !params.sourceAssetUrls?.includes(params.logoUrl)) {
      try {
        const res = await fetch(params.logoUrl);
        if (res.ok) {
          const ab = await res.arrayBuffer();
          const buf = Buffer.from(ab);
          references.push({
            url: params.logoUrl,
            mimeType: this.detectMimeType(params.logoUrl, buf),
            base64: buf.toString("base64"),
            role: "official_logo",
            description: "Logomarca oficial da empresa",
          });
        }
      } catch (e) {
        console.warn("[ReferenceContextBuilder] Erro ao carregar logo do BrandKit:", e);
      }
    }

    // 3. Fallback inteligente: Logomarca Oficial NumVapt local do sistema
    // Apenas se nenhuma foto de sujeito ou logomarca tiver sido carregada até aqui
    const hasSourceOrLogo = references.some((r) => r.role === "official_logo" || r.role === "product_subject");
    const isNumVapt =
      (params.businessName && params.businessName.toLowerCase().includes("numvapt")) ||
      (params.brief && params.brief.toLowerCase().includes("numvapt"));

    if (!hasSourceOrLogo && isNumVapt) {
      try {
        const localLogoPath = path.join(process.cwd(), "public", "logo-numvapt.png");
        if (fs.existsSync(localLogoPath)) {
          const logoBuf = fs.readFileSync(localLogoPath);
          references.unshift({
            mimeType: "image/png",
            base64: logoBuf.toString("base64"),
            role: "official_logo",
            description: "Logomarca oficial local da NumVapt",
          });
        }
      } catch (localLogoErr) {
        console.warn("[ReferenceContextBuilder] Erro ao carregar logo local NumVapt:", localLogoErr);
      }
    }

    // 4. Fotos de Referência / Inspiração de Estilo
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
              description: "Referência estética ou de composição",
            });
          }
        } catch (e) {
          console.warn("[ReferenceContextBuilder] Erro ao carregar imagem de referência:", e);
        }
      }
    }

    return references;
  }
}
