import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { aiRateLimit } from "@/lib/rate-limit";
import { admin } from "@/lib/firebase-admin";
import { getUserStoragePathAdmin } from "@/lib/services/storage-utils-admin";
import { logApiUsage } from "@/lib/services/api-usage-service-admin";
import {
  BrandLogoApplier,
  ImageModelExecutor,
  ImageResultValidator,
} from "@/lib/services/image-orchestrator";
import { extractCoverDesignTokens } from "@/lib/services/carousel/cover-design-extractor";
import {
  assertCoverOnlyImageGeneration,
  CarouselImageGuardError,
} from "@/lib/services/carousel/fabric-slide-renderer";
import { CAROUSEL_COVER_IMAGE_MODEL } from "@/types/carousel";
import crypto from "crypto";

export const maxDuration = 180;

function getColorLuminance(hex: string): number {
  const clean = hex.replace("#", "").trim();
  if (!/^[0-9A-Fa-f]{6}$/.test(clean)) return 0.5;
  const num = parseInt(clean, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/**
 * Monta o prompt de capa (1080×1350, 4:5) incluindo a `chamadaCapa` na arte e pedindo
 * uma composição que deixe uma linguagem visual reaproveitável para os slides 2..N,
 * com trava rigorosa de contraste e uniformidade na área de texto.
 */
export function buildCarouselCoverImagePrompt(params: {
  chamadaCapa: string;
  promptImagemCapa: string;
  brandColors?: string[];
  headingFont?: string;
  bodyFont?: string;
  includeHeadlineInArt?: boolean;
}): string {
  const {
    chamadaCapa,
    promptImagemCapa,
    brandColors = [],
    headingFont = "Poppins",
    bodyFont = "Inter",
    includeHeadlineInArt = true,
  } = params;

  const primaryBgOrBrandColor = brandColors[0];
  const accentColors = brandColors.slice(1);
  const isPrimaryDark = primaryBgOrBrandColor
    ? getColorLuminance(primaryBgOrBrandColor) < 0.52
    : true;

  const paletteDirective =
    brandColors.length > 0
      ? `Paleta de cores da marca (NÃO misture cor escura de texto sobre fundo escuro): use ${primaryBgOrBrandColor} como base de composição/acento e ${accentColors.length > 0 ? accentColors.join(", ") : primaryBgOrBrandColor} para detalhes gráficos e palavras de destaque.`
      : "Paleta de cores coesa e de alto contraste editorial.";

  const contrastLockDirective = isPrimaryDark
    ? `TRAVA OBRIGATÓRIA DE CONTRASTE E FUNDO UNIFORME ATRÁS DO TEXTO:
- A área inteira onde ficará o título deve ter FUNDO ESCURO SÓLIDO E UNIFORME (sem halos claros parciais nem transições irregulares) e 100% das letras do título DEVEM ser em BRANCO PURO (#FFFFFF) com eventual destaque pontual em cor vibrante clara — é TERMINANTEMENTE PROIBIDO usar fonte escura/preta/marinho sobre fundo ou sombra escura.
- OU, se a cena superior for clara, 100% da área sob TODAS as linhas e letras do texto deve permanecer clara e homogênea, PROIBIDO colocar vinhetas, curvas ou sombras escuras invadindo os cantos atrás do texto.`
    : `TRAVA OBRIGATÓRIA DE CONTRASTE E FUNDO UNIFORME ATRÁS DO TEXTO:
- Toda a zona atrás de 100% do bloco de texto deve ter luminosidade 100% uniforme do início ao fim da frase — PROIBIDO degradês bicolores, sombras nos cantos ou vinhetas escuras cruzando por trás das letras.
- Se a área atrás do texto for clara e uniforme, use 100% texto escuro de altíssimo contraste (#0F172A); se a área atrás do texto for escura e uniforme, use 100% texto em branco puro (#FFFFFF).`;

  const headlineDirective = includeHeadlineInArt
    ? `TEXTO OBRIGATÓRIO NA CAPA (renderize exatamente com ortografia impecável em Português do Brasil, fonte ${headingFont} bold, legibilidade máxima do primeiro ao último caractere): "${chamadaCapa}". Não adicione nenhum outro texto, selo ou palavra inventada.`
    : `NÃO renderize nenhum texto escrito na imagem; deixe uma área limpa, sólida e com luminosidade uniforme no terço superior ou inferior para sobreposição tipográfica posterior.`;

  return `CAPA DE CARROSSEL INSTAGRAM 4:5 (1080x1350px) — DIREÇÃO DE ARTE EDITORIAL.
Cena principal: ${promptImagemCapa}
${paletteDirective}
Tipografia de referência da marca: Títulos em ${headingFont}, corpo em ${bodyFont}.
${headlineDirective}
${contrastLockDirective}
DIRETRIZ DE FAMÍLIA VISUAL REAPROVEITÁVEL:
- Composição limpa com área de respiro bem definida para leitura imediata (contraste mínimo AA/AAA em 100% de cada palavra).
- Elementos gráficos simples e elegantes (faixa de acento sólida, moldura sutil ou bloco geométrico limpo) posicionados SEM invadir ou escurecer parcialmente a zona por trás das letras.
- Fotografia/ilustração realista de altíssima nitidez, sem poluição visual.`;
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireUser(request);
    if (authUser instanceof NextResponse) return authUser;
    const userId = authUser.uid;

    const rateCheck = await aiRateLimit.limit(userId);
    if (!rateCheck.success) {
      return NextResponse.json(
        {
          error:
            "Limite de geração atingido temporariamente. Aguarde alguns segundos e tente novamente.",
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const slideNumber = Number(body.slideNumber ?? 1);

    // =========================================================================
    // GUARD INVIOLÁVEL DA REGRA DE OURO: Somente o Slide 1 gera imagem por IA
    // =========================================================================
    try {
      assertCoverOnlyImageGeneration(slideNumber);
    } catch (guardError) {
      if (guardError instanceof CarouselImageGuardError) {
        return NextResponse.json(
          {
            error: guardError.message,
            code: "CAROUSEL_IMAGE_GUARD_VIOLATION",
            slideNumber: guardError.slideNumber,
          },
          { status: 400 }
        );
      }
      throw guardError;
    }

    const chamadaCapa = String(body.chamadaCapa || "").trim();
    const promptImagemCapa = String(body.promptImagemCapa || "").trim();

    if (!chamadaCapa || !promptImagemCapa) {
      return NextResponse.json(
        {
          error:
            "Os campos 'chamadaCapa' e 'promptImagemCapa' são obrigatórios para gerar a capa.",
        },
        { status: 400 }
      );
    }

    const brandKit = body.brandKit || {};
    const includeHeadlineInArt = body.includeHeadlineInArt !== false;
    const includeLogo = body.includeLogo !== false;
    const carouselId =
      String(body.carouselId || "").trim() || crypto.randomUUID();

    const compiledPrompt = buildCarouselCoverImagePrompt({
      chamadaCapa,
      promptImagemCapa,
      brandColors: Array.isArray(brandKit.colors) ? brandKit.colors : [],
      headingFont: brandKit.headingFont || "Poppins",
      bodyFont: brandKit.bodyFont || "Inter",
      includeHeadlineInArt,
    });

    // ÚNICA chamada ao modelo de imagem por carrossel: GPT-image-2.6 Sunburst
    const execution = await ImageModelExecutor.execute({
      prompt: compiledPrompt,
      format: "portrait",
      preferredModel: CAROUSEL_COVER_IMAGE_MODEL,
      fallbackModel: "gpt-image-2.6-flare",
      quality: "high",
    });

    // Garante proporção e resolução 1080x1350 (4:5)
    const validated = await ImageResultValidator.validateAndNormalize(
      execution.imageBuffer,
      "portrait"
    );

    let finalBuffer = validated.buffer;
    if (includeLogo && brandKit.logoUrl) {
      finalBuffer = await BrandLogoApplier.applyLogo(
        finalBuffer,
        brandKit.logoUrl,
        {
          position: "auto",
          avoidCollisions: true,
        }
      );
    }

    // Extrai Design Tokens da capa (paleta dominante via Jimp + estilo via LLM de visão)
    // Combinando com BrandKit (cores da capa prevalecem; logo e tipografia do BrandKit prevalecem)
    const designTokens = await extractCoverDesignTokens({
      userId,
      coverImageBuffer: finalBuffer,
      brandKit: {
        colors: brandKit.colors,
        headingFont: brandKit.headingFont,
        bodyFont: brandKit.bodyFont,
        logoUrl: brandKit.logoUrl,
      },
    });

    // Faz upload da capa em users/{uid}/posts/carousel_{id}/slide_1_cover.png
    let coverImageUrl = "";
    try {
      const userStoragePath = await getUserStoragePathAdmin(userId);
      const bucket = admin.storage().bucket();
      const filePath = `${userStoragePath}/posts/carousel_${carouselId}/slide_1_cover_${Date.now()}.png`;
      const fileRef = bucket.file(filePath);
      const downloadToken = crypto.randomUUID();

      await fileRef.save(finalBuffer, {
        metadata: {
          contentType: "image/png",
          metadata: {
            firebaseStorageDownloadTokens: downloadToken,
            userId,
            carouselId,
            slideNumber: "1",
            modelUsed: execution.modelUsed,
          },
        },
      });

      coverImageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media&token=${downloadToken}`;
    } catch (storageErr) {
      console.warn(
        "[CarouselGenerateCover] Fallback para Data URL local:",
        storageErr
      );
      coverImageUrl = `data:image/png;base64,${finalBuffer.toString("base64")}`;
    }

    await logApiUsage({
      userId,
      type: "image_generation",
      provider: "openai",
      model: execution.modelUsed || CAROUSEL_COVER_IMAGE_MODEL,
      costUsd: 0.04,
      endpoint: "/api/carousel/generate-cover",
    });

    return NextResponse.json({
      carouselId,
      slideNumber: 1,
      coverImageUrl,
      modelUsed: execution.modelUsed || CAROUSEL_COVER_IMAGE_MODEL,
      width: validated.width || 1080,
      height: validated.height || 1350,
      designTokens,
      imageCallsExecuted: 1,
    });
  } catch (error: any) {
    console.error("[API /api/carousel/generate-cover] Erro:", error);
    return NextResponse.json(
      {
        error:
          error?.message || "Erro interno ao gerar a imagem de capa do carrossel.",
      },
      { status: 500 }
    );
  }
}
