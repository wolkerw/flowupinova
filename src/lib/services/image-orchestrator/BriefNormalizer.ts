import type {
  AIImageObjective,
  AIImageStyle,
  AIImageTextOverlayMode,
} from "@/lib/types/ai-image-general";
import type { NormalizedBrief } from "./types";

export class BriefNormalizer {
  public static normalize(params: {
    rawBrief: string;
    objective?: AIImageObjective;
    style?: AIImageStyle;
    textOverlayMode?: AIImageTextOverlayMode;
    productHeadline?: string;
    negativeInstructions?: string;
  }): NormalizedBrief {
    const raw = (params.rawBrief || "").trim();
    let cleaned = raw
      .replace(/[\r\n]+/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();

    // Extrair headline explícita se fornecida ou indicada entre aspas
    let explicitHeadline = (params.productHeadline || "").trim();
    if (!explicitHeadline) {
      const quoteMatch = cleaned.match(/["“']([^"“”']{4,60})["”']/);
      if (quoteMatch) {
        explicitHeadline = quoteMatch[1].trim();
      }
    }

    // Detectar modo de texto caso não especificado explicitamente
    let overlayMode: AIImageTextOverlayMode = params.textOverlayMode || "NONE";
    const lower = cleaned.toLowerCase();

    if (overlayMode === "NONE") {
      if (
        lower.includes("infográfico") ||
        lower.includes("infografico") ||
        lower.includes("com texto") ||
        lower.includes("com título") ||
        lower.includes("com titulo") ||
        lower.includes("poster publicitário") ||
        lower.includes("anúncio com texto")
      ) {
        overlayMode = lower.includes("infogr") ? "INFOGRAPHIC" : "TITLE_ONLY";
      }
    }

    // Detectar estilo se for automatic
    let detectedStyle: AIImageStyle = params.style || "automatic";
    if (detectedStyle === "automatic") {
      if (lower.includes("foto") || lower.includes("realista") || lower.includes("fotografia")) {
        detectedStyle = "photographic";
      } else if (lower.includes("3d") || lower.includes("render")) {
        detectedStyle = "3d";
      } else if (lower.includes("ilustra") || lower.includes("desenho") || lower.includes("vetor")) {
        detectedStyle = "illustration";
      } else if (lower.includes("minimalis")) {
        detectedStyle = "minimalist";
      } else if (lower.includes("cinema") || lower.includes("filme")) {
        detectedStyle = "cinematic";
      } else if (lower.includes("editorial") || lower.includes("moda") || lower.includes("revista")) {
        detectedStyle = "editorial";
      }
    }

    // Detectar objetivo se não fornecido
    const detectedObjective: AIImageObjective = params.objective || "commercial";

    // Detectar sujeito principal
    const detectedSubject = cleaned.split(".")[0]?.slice(0, 100) || cleaned.slice(0, 100);

    return {
      originalBrief: raw,
      cleanedBrief: cleaned,
      detectedObjective,
      detectedSubject,
      detectedStyle,
      explicitHeadline: explicitHeadline || undefined,
      negativeDirectives: params.negativeInstructions?.trim() || undefined,
      requestedTextOverlayMode: overlayMode,
    };
  }
}
