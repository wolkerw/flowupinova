import { CoverDesignTokensSchema, type CoverDesignTokens } from "@/types/carousel";
import { logApiUsage } from "@/lib/services/api-usage-service-admin";

async function getJimpInstance() {
  const mod: any = await import("jimp");
  return mod.Jimp || mod.default?.Jimp || mod.default || mod;
}

export interface BrandKitPreferences {
  colors?: string[];
  primaryColor?: string;
  secondaryColor?: string;
  primaryFont?: string;
  secondaryFont?: string;
  headingFont?: string;
  bodyFont?: string;
  logoUrl?: string | null;
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return (
    "#" +
    [clamp(r), clamp(g), clamp(b)]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "").trim();
  if (clean.length !== 6) return { r: 11, g: 37, b: 58 };
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function getRelativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function normalizeHex(hex?: string, fallback = "#0083C7"): string {
  if (!hex || typeof hex !== "string") return fallback;
  const cleaned = hex.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(cleaned)) return cleaned.toUpperCase();
  if (/^[0-9A-Fa-f]{6}$/.test(cleaned)) return `#${cleaned.toUpperCase()}`;
  return fallback;
}

/**
 * Extrai a paleta dominante real da imagem da capa usando quantização de pixels via Jimp (custo zero).
 */
export async function extractDominantPaletteWithJimp(imageBuffer: Buffer): Promise<{
  backgroundHex: string;
  primaryAccentHex: string;
  secondaryAccentHex: string;
  textPrimaryHex: string;
  textMutedHex: string;
}> {
  try {
    const Jimp = await getJimpInstance();
    const img = await Jimp.read(imageBuffer);
    const w = img.width || 100;
    const h = img.height || 100;

    if (typeof img.getPixelColor !== "function") {
      return {
        backgroundHex: "#0B253A",
        primaryAccentHex: "#FA6305",
        secondaryAccentHex: "#0083C7",
        textPrimaryHex: "#FFFFFF",
        textMutedHex: "#CBD5E1",
      };
    }

    const buckets = new Map<
      string,
      { count: number; rSum: number; gSum: number; bSum: number; saturation: number }
    >();

    const stepX = Math.max(1, Math.floor(w / 40));
    const stepY = Math.max(1, Math.floor(h / 40));

    for (let y = 0; y < h; y += stepY) {
      for (let x = 0; x < w; x += stepX) {
        const color = img.getPixelColor(x, y);
        const r = (color >>> 24) & 255;
        const g = (color >>> 16) & 255;
        const b = (color >>> 8) & 255;

        // Quantização em blocos de 32 níveis por canal
        const qr = Math.floor(r / 32);
        const qg = Math.floor(g / 32);
        const qb = Math.floor(b / 32);
        const key = `${qr}_${qg}_${qb}`;

        const maxC = Math.max(r, g, b);
        const minC = Math.min(r, g, b);
        const sat = maxC === 0 ? 0 : (maxC - minC) / maxC;

        const existing = buckets.get(key);
        if (existing) {
          existing.count++;
          existing.rSum += r;
          existing.gSum += g;
          existing.bSum += b;
        } else {
          buckets.set(key, { count: 1, rSum: r, gSum: g, bSum: b, saturation: sat });
        }
      }
    }

    const sortedByFrequency = Array.from(buckets.values()).sort((a, b) => b.count - a.count);
    const dominant = sortedByFrequency[0];
    const backgroundHex = dominant
      ? rgbToHex(
          dominant.rSum / dominant.count,
          dominant.gSum / dominant.count,
          dominant.bSum / dominant.count
        )
      : "#0B253A";

    const accentCandidates = sortedByFrequency
      .slice(1)
      .sort((a, b) => b.saturation * Math.sqrt(b.count) - a.saturation * Math.sqrt(a.count));

    const firstAccent = accentCandidates[0];
    const secondAccent = accentCandidates[1] || accentCandidates[0];

    const primaryAccentHex = firstAccent
      ? rgbToHex(
          firstAccent.rSum / firstAccent.count,
          firstAccent.gSum / firstAccent.count,
          firstAccent.bSum / firstAccent.count
        )
      : "#FA6305";

    const secondaryAccentHex = secondAccent
      ? rgbToHex(
          secondAccent.rSum / secondAccent.count,
          secondAccent.gSum / secondAccent.count,
          secondAccent.bSum / secondAccent.count
        )
      : "#0083C7";

    const bgLum = getRelativeLuminance(backgroundHex);
    const isDarkBg = bgLum < 0.55;

    return {
      backgroundHex,
      primaryAccentHex,
      secondaryAccentHex,
      textPrimaryHex: isDarkBg ? "#FFFFFF" : "#0F172A",
      textMutedHex: isDarkBg ? "#CBD5E1" : "#475569",
    };
  } catch {
    return {
      backgroundHex: "#0B253A",
      primaryAccentHex: "#FA6305",
      secondaryAccentHex: "#0083C7",
      textPrimaryHex: "#FFFFFF",
      textMutedHex: "#CBD5E1",
    };
  }
}

/**
 * Combina a paleta extraída da capa via Jimp + análise visual via LLM Vision (gemini-2.5-flash)
 * com o BrandKit do usuário.
 * REGRA DE PRECEDÊNCIA:
 * - Em conflito, os tokens da capa prevalecem nas CORES.
 * - O BrandKit do usuário prevalece em LOGO e TIPOGRAFIA (fontes).
 */
export async function extractCoverDesignTokens(params: {
  userId: string;
  coverImageBuffer: Buffer;
  brandKit?: BrandKitPreferences;
}): Promise<CoverDesignTokens> {
  const jimpPalette = await extractDominantPaletteWithJimp(params.coverImageBuffer);

  let visionStyle: Partial<{
    backgroundHex: string;
    primaryAccentHex: string;
    secondaryAccentHex: string;
    textPrimaryHex: string;
    titleAlignment: "left" | "center";
    titleWeight: "700" | "800" | "900";
    titlePosition: "top-left" | "top-center" | "center" | "bottom-left";
    motif: "accent_stripe" | "geometric_pill" | "editorial_frame" | "minimal_bar";
    cornerStyle: "rounded" | "sharp" | "pill";
    borderRadiusPx: number;
    hasFrame: boolean;
    mood: string;
  }> = {};

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const visionPrompt = `Analyze this Instagram carousel cover (1080x1350) and extract its visual design tokens in strict JSON format so we can replicate the exact same visual family on internal slides 2..N using Fabric.js.
Return ONLY valid JSON matching:
{
  "backgroundHex": "#RRGGBB",
  "primaryAccentHex": "#RRGGBB",
  "secondaryAccentHex": "#RRGGBB",
  "textPrimaryHex": "#RRGGBB",
  "titleAlignment": "left" | "center",
  "titleWeight": "700" | "800" | "900",
  "titlePosition": "top-left" | "top-center" | "center" | "bottom-left",
  "motif": "accent_stripe" | "geometric_pill" | "editorial_frame" | "minimal_bar",
  "cornerStyle": "rounded" | "sharp" | "pill",
  "borderRadiusPx": 16,
  "hasFrame": true,
  "mood": "short description in pt-BR"
}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: visionPrompt },
                  {
                    inlineData: {
                      mimeType: "image/png",
                      data: params.coverImageBuffer.toString("base64"),
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        const parsed = JSON.parse(rawText);
        visionStyle = parsed || {};

        const usageMeta = data?.usageMetadata;
        await logApiUsage({
          userId: params.userId,
          type: "vision_analysis",
          provider: "google_gemini",
          model: "gemini-2.5-flash",
          costUsd: 0.0004,
          tokens: usageMeta
            ? {
                promptTokens: usageMeta.promptTokenCount || 400,
                completionTokens: usageMeta.candidatesTokenCount || 150,
                totalTokens: usageMeta.totalTokenCount || 550,
              }
            : undefined,
        });
      }
    } catch (err) {
      console.warn("[CoverDesignExtractor] Fallback para tokens determinísticos:", err);
    }
  }

  // Precedência: Cores vêm dos tokens da capa (Vision / Jimp); Fontes vêm do BrandKit do usuário
  const finalBgHex = normalizeHex(visionStyle.backgroundHex, jimpPalette.backgroundHex);
  const bgLuminance = getRelativeLuminance(finalBgHex);
  const isDark = bgLuminance < 0.55;

  const finalPrimaryAccent = normalizeHex(
    visionStyle.primaryAccentHex,
    jimpPalette.primaryAccentHex
  );
  const finalSecondaryAccent = normalizeHex(
    visionStyle.secondaryAccentHex,
    jimpPalette.secondaryAccentHex
  );
  const finalTextPrimary = isDark ? "#FFFFFF" : "#0F172A";
  const finalTextMuted = isDark ? "#CBD5E1" : "#475569";

  // BrandKit prevalece em tipografia
  const cleanBrandFont = (f?: string, defaultFont = "Poppins") => {
    if (!f || !f.trim()) return defaultFont;
    return f.replace(/\s*[-–—]\s*(bold|normal|regular|medium|light|extrabold|black)\b/gi, "").trim();
  };

  const resolvedHeadingFont = cleanBrandFont(
    params.brandKit?.headingFont || params.brandKit?.primaryFont,
    "Poppins"
  );
  const resolvedBodyFont = cleanBrandFont(
    params.brandKit?.bodyFont || params.brandKit?.secondaryFont,
    "Inter"
  );
  const resolvedAlignment =
    visionStyle.titleAlignment === "center" ? "center" : "left";
  const resolvedWeight =
    visionStyle.titleWeight === "700" || visionStyle.titleWeight === "900"
      ? visionStyle.titleWeight
      : "800";
  const resolvedMotif =
    visionStyle.motif === "geometric_pill" ||
    visionStyle.motif === "editorial_frame" ||
    visionStyle.motif === "minimal_bar"
      ? visionStyle.motif
      : "accent_stripe";
  const resolvedRadius =
    typeof visionStyle.borderRadiusPx === "number" &&
    visionStyle.borderRadiusPx >= 0 &&
    visionStyle.borderRadiusPx <= 40
      ? Math.round(visionStyle.borderRadiusPx)
      : 8;
  const resolvedMood =
    visionStyle.mood?.trim() || "Executivo moderno e coeso com a capa";

  const merged: CoverDesignTokens = {
    dominantPalette: [
      finalBgHex,
      finalPrimaryAccent,
      finalSecondaryAccent,
    ],
    backgroundColor: finalBgHex,
    secondaryColor: finalSecondaryAccent,
    accentColor: finalPrimaryAccent,
    textColor: finalTextPrimary,
    mutedTextColor: finalTextMuted,
    titleAlignment: resolvedAlignment,
    coverTextPosition:
      visionStyle.titlePosition === "bottom-left" ? "bottom" : "top",
    headingWeight: resolvedWeight,
    graphicMotif: resolvedMotif,
    cornerRadius: resolvedRadius,
    mood: resolvedMood,
    headingFont: resolvedHeadingFont,
    bodyFont: resolvedBodyFont,
    logoUrl: params.brandKit?.logoUrl || null,
    palette: {
      backgroundHex: finalBgHex,
      primaryAccentHex: finalPrimaryAccent,
      secondaryAccentHex: finalSecondaryAccent,
      textPrimaryHex: finalTextPrimary,
      textMutedHex: finalTextMuted,
    },
    typography: {
      primaryFont: resolvedHeadingFont,
      secondaryFont: resolvedBodyFont,
      titleAlignment: resolvedAlignment,
      titleWeight: resolvedWeight,
      titlePosition:
        visionStyle.titlePosition === "top-center" ||
        visionStyle.titlePosition === "center" ||
        visionStyle.titlePosition === "bottom-left"
          ? visionStyle.titlePosition
          : "top-left",
    },
    graphicElements: {
      motif: resolvedMotif,
      cornerStyle:
        visionStyle.cornerStyle === "sharp" || visionStyle.cornerStyle === "pill"
          ? visionStyle.cornerStyle
          : "rounded",
      borderRadiusPx: resolvedRadius,
      hasFrame: typeof visionStyle.hasFrame === "boolean" ? visionStyle.hasFrame : true,
      mood: resolvedMood,
    },
    backgroundVariants: [
      "solid_from_cover",
      "blurred_cover_crop",
      "cover_stripe_geometry",
    ],
  };

  return CoverDesignTokensSchema.parse(merged);
}
