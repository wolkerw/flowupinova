import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { admin, adminDb } from "@/lib/firebase-admin";
import { getUserStoragePathAdmin } from "@/lib/services/storage-utils-admin";
import { logApiUsage } from "@/lib/services/api-usage-service-admin";
import type {
  AIImageGenerationRequest,
  AIImageGenerationDoc,
  AIImageAssetDoc,
  AIImageTextOverlayMode,
  AIImageFormat,
  BrandSnapshot,
} from "@/lib/types/ai-image-general";
import { FORMAT_DIMENSIONS } from "@/lib/types/ai-image-general";
import { Jimp } from "jimp";
import { matchStyleCommands } from "@/lib/services/style-command-matcher";
import {
  ImageGenerationOrchestrator,
  type OrchestratorRunResult,
} from "@/lib/services/image-orchestrator";
import crypto from "crypto";
import fs from "fs";
import path from "path";

export const maxDuration = 300;

async function fetchWithRetry(url: string, options: RequestInit, retries = 3, delay = 2000): Promise<Response> {
  let lastResponse: Response | null = null;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      lastResponse = response;
      if (response.status === 429 || response.status >= 500) {
        await new Promise((r) => setTimeout(r, delay));
        delay *= 2;
        continue;
      }
      return response;
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise((r) => setTimeout(r, delay));
      delay *= 2;
    }
  }
  return lastResponse || fetch(url, options);
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: "Autenticação obrigatória para gerar imagens com IA." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      brief,
      objective = "commercial",
      format = "portrait",
      width = 1080,
      height = 1350,
      quantity = 1,
      style = "automatic",
      useBrandKit = true,
      textMode = "none",
      textOverlayMode = "NONE",
      productHeadline = "",
      negativeInstructions = "",
      visualDirection,
      referenceAssetUrls = [],
      sourceAssetUrls = [],
      retryAssetId = null,
      existingGenerationId = null,
    } = body as AIImageGenerationRequest & {
      retryAssetId?: string | null;
      existingGenerationId?: string | null;
    };

    if (!brief && !retryAssetId) {
      return NextResponse.json(
        { error: "Briefing não fornecido para a geração." },
        { status: 400 }
      );
    }

    const userId = authUser.uid;
    const userStoragePath = getUserStoragePathAdmin(userId);
    const bucket = admin.storage().bucket();

    // 1. Carregar BrandKit / BrandSnapshot
    let brandSnapshot: BrandSnapshot | null = null;
    if (useBrandKit) {
      try {
        const [onboardingDoc, profileDoc] = await Promise.all([
          adminDb.doc(`users/${userId}/business/onboarding`).get(),
          adminDb.doc(`users/${userId}/business/profile`).get(),
        ]);
        const data = {
          ...(profileDoc.exists ? profileDoc.data() : {}),
          ...(onboardingDoc.exists ? onboardingDoc.data() : {}),
        };
        const bk = data?.brandKit || {};
        brandSnapshot = {
          name: data?.name || bk?.name || "Empresa",
          segment: data?.segment || data?.category || bk?.segment || "",
          primaryColor: data?.primaryColor || bk?.primaryColor || "#0083C7",
          secondaryColor: data?.secondaryColor || bk?.secondaryColor || "#FA6305",
          visualGuidelines: bk?.visualGuidelines || data?.visualGuidelines || "",
          logoUrl: bk?.logoUrl || data?.logo?.url || (typeof data?.logo === "string" ? data.logo : ""),
          targetAudience: data?.targetAudience || bk?.targetAudience || "",
          toneOfVoice: data?.toneOfVoice || bk?.toneOfVoice || "",
          slogan: data?.slogan || bk?.slogan || "",
          personas: bk?.personas || data?.personas || [],
        };
      } catch (bkErr) {
        console.warn("[IMAGENS_GERAR] Aviso ao obter brand snapshot:", bkErr);
      }
    }

    // 2. Criar ou reutilizar entidade aiImageGeneration no Firestore
    const generationId =
      existingGenerationId || `gen_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const genDocRef = adminDb.doc(`users/${userId}/aiImageGenerations/${generationId}`);

    if (!existingGenerationId) {
      const initialGenData: Record<string, any> = {
        id: generationId,
        userId,
        status: "generating",
        brief: brief || "",
        objective,
        format,
        width,
        height,
        quantity,
        style,
        useBrandKit: Boolean(useBrandKit),
        referenceAssetUrls,
        sourceAssetUrls,
        textOverlayMode: textOverlayMode || "NONE",
        safetyStatus: "approved",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (visualDirection) initialGenData.visualDirection = visualDirection;
      if (productHeadline) initialGenData.productHeadline = productHeadline;
      if (brandSnapshot) initialGenData.brandSnapshot = brandSnapshot;

      await genDocRef.set(initialGenData);
    }

    // 3. Montar prompt otimizado para o motor visual
    const FORMAT_PROMPT_DIRECTIVES: Record<AIImageFormat, string> = {
      portrait:
        "[FORMATO E ENQUADRAMENTO VERTICAL MANDATÓRIO — FEED RETRATO 4:5 (1080x1350)]: A arte DEVE ser estritamente vertical com proporção 4:5 (1080 de largura por 1350 de altura). [CRITICAL RULE — ZERO TEXT CROPPING & SAFE MARGINS]: É TERMINANTEMENTE PROIBIDO cortar qualquer texto, título, logo ou elemento gráfico. Mantenha uma margem de segurança e respiro generosa de 15% a 20% em todas as bordas (topo, rodapé e laterais). Todos os textos, títulos, cartões e logos DEVEM estar totalmente contidos dentro da área segura central, 100% visíveis e legíveis, com espaçamento confortável das extremidades.",
      story:
        "[FORMATO E ENQUADRAMENTO VERTICAL MANDATÓRIO — STORY / REELS 9:16 (1080x1920)]: A arte DEVE ser estritamente vertical com proporção 9:16 (1080 de largura por 1920 de altura). [CRITICAL RULE — ZERO TEXT CROPPING & SAFE MARGINS]: É TERMINANTEMENTE PROIBIDO cortar qualquer texto ou encostar nas bordas. Mantenha 15% a 20% de margem segura e respiro no topo, rodapé e laterais. Todo o conteúdo textual deve estar contido com folga na área segura central.",
      square:
        "[FORMATO E ENQUADRAMENTO QUADRADO MANDATÓRIO (1:1 / 1080x1080)]: A arte DEVE ter proporção quadrada 1:1. [CRITICAL RULE — ZERO TEXT CROPPING]: Textos e logos com margens seguras de respiro de 15%, sem encostar ou cortar nas bordas.",
      landscape:
        "[FORMATO E ENQUADRAMENTO HORIZONTAL MANDATÓRIO (16:9 / 1920x1080)]: A arte DEVE ter proporção horizontal widescreen 16:9 com margens seguras de respiro de 15% para todos os textos e elementos.",
      banner:
        "[FORMATO E ENQUADRAMENTO PANORÂMICO MANDATÓRIO (1200x630)]: A arte DEVE ter proporção panorâmica horizontal com margens seguras de respiro de 15% para todos os textos e elementos.",
    };

    let compiledPrompt = FORMAT_PROMPT_DIRECTIVES[format]
      ? `${FORMAT_PROMPT_DIRECTIVES[format]} ${brief}`
      : brief;
    let effectiveNegative = negativeInstructions || "";

    // 3.1. Matching inteligente de comandos de estilo da central (/bokeh, /naturallight, etc.)
    try {
      const matchResult = await matchStyleCommands(brief || "");
      if (matchResult.matchedCommands.length > 0) {
        if (matchResult.injectedDirectives.length > 0) {
          compiledPrompt += ` [ESTILO PROFISSIONAL APLICADO: ${matchResult.injectedDirectives.join(" ")}]`;
        }
        if (matchResult.injectedNegativeDirectives.length > 0) {
          effectiveNegative = effectiveNegative
            ? `${effectiveNegative}, ${matchResult.injectedNegativeDirectives.join(", ")}`
            : matchResult.injectedNegativeDirectives.join(", ");
        }
      }
    } catch (cmdMatchErr) {
      console.warn("[IMAGENS_GERAR] Aviso ao fazer matching de comandos de estilo:", cmdMatchErr);
    }

    if (visualDirection) {
      compiledPrompt = `${visualDirection.subject}. ${visualDirection.composition}. ${visualDirection.lighting}. Estilo: ${visualDirection.style}.`;
      if (visualDirection.brandApplication && useBrandKit) {
        compiledPrompt += ` ${visualDirection.brandApplication}`;
      }
    }

    // 3.2. Integração do BrandKit & Personas da Marca no Prompt
    if (useBrandKit && brandSnapshot) {
      const brandDirectives: string[] = [];

      if (brandSnapshot.name && brandSnapshot.name !== "Empresa") {
        brandDirectives.push(`Marca/Empresa: "${brandSnapshot.name}"`);
      }
      if (brandSnapshot.segment) {
        brandDirectives.push(`Segmento/Nicho: ${brandSnapshot.segment}`);
      }
      if (brandSnapshot.primaryColor || brandSnapshot.secondaryColor) {
        const colors = [
          brandSnapshot.primaryColor ? `cor primária ${brandSnapshot.primaryColor}` : "",
          brandSnapshot.secondaryColor ? `cor secundária ${brandSnapshot.secondaryColor}` : "",
        ].filter(Boolean).join(" e ");
        brandDirectives.push(
          `Paleta de Cores da Marca: Harmonizar a cena utilizando ${colors} em detalhes de iluminação, ambiente, elementos gráficos ou vestuário.`
        );
      }
      if (brandSnapshot.visualGuidelines) {
        brandDirectives.push(`Diretrizes Visuais da Marca: ${brandSnapshot.visualGuidelines}`);
      }
      if (brandSnapshot.targetAudience) {
        brandDirectives.push(`Público-Alvo: ${brandSnapshot.targetAudience}`);
      }

      // Personas cadastradas no BrandKit
      if (brandSnapshot.personas && Array.isArray(brandSnapshot.personas) && brandSnapshot.personas.length > 0) {
        const personasList = brandSnapshot.personas
          .slice(0, 3)
          .map((p: any) => `"${p.name || 'Persona'}" (${p.profile || ''}${p.painPoints ? ', foco: ' + p.painPoints : ''})`.trim())
          .join(" | ");
        brandDirectives.push(`Personas da Marca: Adequar a estética humana, estilo e representatividade visual para conectar diretamente com as personas da marca: ${personasList}`);
      }

      // Se o objetivo for Foto de Perfil / Personal Branding ("personal")
      if (objective === "personal") {
        brandDirectives.push(
          `Personal Branding / Foto de Perfil Executiva: Retrato profissional de alta credibilidade, postura confiante e autoridade executiva, alinhado perfeitamente à identidade e nicho da marca "${brandSnapshot.name || 'Empresa'}"`
        );
      }

      // Regra Mandatória de Logomarcas: ZERO LOGOS desenhados pela IA (espaço reservado para overlay manual)
      brandDirectives.push(
        `PROIBIÇÃO TOTAL DE DESENHAR LOGOMARCAS (ZERO LOGOS): É terminantemente PROIBIDO desenhar, inventar, criar, simular ou tentar reproduzir qualquer logotipo, marca, brasão, símbolo comercial, foguete ou mascote na imagem. Deixe o canto superior da imagem 100% limpo, neutro e desobstruído (área de respiro) para que a logomarca oficial seja inserida manualmente depois pelo usuário. A imagem NÃO PODE conter nenhum logotipo gerado.`
      );

      // Se houver foto real de pessoa ou produto enviada na Etapa 5
      if (sourceAssetUrls && sourceAssetUrls.length > 0) {
        brandDirectives.push(
          `SUJEITO REAL DA ETAPA 5 (PESSOA OU PRODUTO): Foi fornecida a foto real do sujeito/produto. A IA DEVE OBRIGATORIAMENTE manter a fisionomia, traços, roupas e características da pessoa, ou a embalagem, formato e rótulo do produto real enviado na Etapa 5, criando o cenário publicitário em volta dele como protagonista da cena.`
        );
      }

      if (brandDirectives.length > 0) {
        compiledPrompt += ` [INTEGRAÇÃO BRANDKIT & IDENTIDADE: ${brandDirectives.join(" — ")}]`;
      }
    }

    if (style !== "automatic") {
      compiledPrompt = `[ESTILO VISUAL: ${style.toUpperCase()}] ${compiledPrompt}`;
    }

    // Harmonizar modo de sobreposição de texto
    const effectiveOverlayMode: AIImageTextOverlayMode =
      textOverlayMode && textOverlayMode !== "NONE" ? textOverlayMode : "NONE";

    // Diretivas de Diagramação, Textos e Infográficos
    if (effectiveOverlayMode === "NONE") {
      compiledPrompt +=
        " [CRITICAL MANDATE — ZERO TEXT: Do not draw or render any text, typography, watermarks or logos on the image. Pristine photography only.]";
    } else if (effectiveOverlayMode === "TITLE_ONLY") {
      const headlineDirective = productHeadline?.trim()
        ? `with the exact headline: "${productHeadline.trim()}"`
        : "with an impactful commercial headline in Portuguese (pt-BR)";
      compiledPrompt +=
        ` [COMMERCIAL HEADLINE POSTER DIRECTIVE: Render a bold, clean, high-contrast headline typography in Portuguese (pt-BR) ${headlineDirective} at the top of the image with elegant lettering and safe margins. No icons or complex infographic elements, just the hero subject and the bold headline.]`;
    } else if (effectiveOverlayMode === "INFOGRAPHIC" || effectiveOverlayMode === "BOTH") {
      const headlineDirective = productHeadline?.trim()
        ? `with the main headline: "${productHeadline.trim()}"`
        : "with an impactful context-tailored commercial headline in Portuguese (pt-BR)";
      compiledPrompt +=
        ` [DYNAMIC & CONTEXTUAL INFOGRAPHIC ADVERTISING DIRECTIVE: The AI has full creative freedom to decide the most fitting, modern infographic composition in Portuguese (pt-BR) tailored dynamically to the subject and briefing. Do NOT force a repetitive rigid template (do NOT force a mandatory warranty seal or a fixed row of 4 bottom cards). Instead, adapt the layout organically: (a) Floating feature callout tags with clean pointers to product/subject details, (b) A sleek modern sidebar or clean list of 2-4 key benefits with minimalist line icons, (c) Glassmorphic stat badges, step-by-step points, or comparative visual highlights, or (d) Integrated editorial typography harmonized naturally with the scene. Include: ${headlineDirective} in bold high-contrast Portuguese typography, well-balanced breathing room, clear visual hierarchy, and 20% safe margins from all outer borders.]`;
    }

    if (negativeInstructions) {
      compiledPrompt += ` [AVOID: ${negativeInstructions}]`;
    }

    // Chaves de API
    const openaiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    // Determinar quantos slots gerar
    const countToGenerate = retryAssetId ? 1 : Math.min(Math.max(quantity, 1), 4);
    const assetSlots: { id: string; order: number }[] = [];

    if (retryAssetId) {
      assetSlots.push({ id: retryAssetId, order: 0 });
    } else {
      for (let i = 0; i < countToGenerate; i++) {
        assetSlots.push({
          id: `asset_${Date.now()}_${i}_${crypto.randomBytes(3).toString("hex")}`,
          order: i,
        });
      }
    }

    // Pre-cadastrar slots com status queued/processing
    for (const slot of assetSlots) {
      const slotRef = adminDb.doc(`users/${userId}/aiImageAssets/${slot.id}`);
      await slotRef.set(
        {
          id: slot.id,
          generationId,
          userId,
          order: slot.order,
          status: "processing",
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }

    // 3.3. Coleta e pré-carregamento de imagens de entrada (Logo oficial, sujeito/produto, referências)
    interface InputImagePart {
      url?: string;
      mimeType: string;
      base64: string;
      role: "source_or_logo" | "reference";
    }
    const inputImages: InputImagePart[] = [];

    const detectMimeType = (url: string, buf: Buffer): string => {
      if (buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
        return "image/png";
      }
      if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
        return "image/jpeg";
      }
      if (url.toLowerCase().includes(".png")) return "image/png";
      if (url.toLowerCase().includes(".webp")) return "image/webp";
      return "image/jpeg";
    };

    // 1. Fotos de Sujeito / Produto ou Logomarca enviadas pelo usuário (sourceAssetUrls)
    if (sourceAssetUrls && sourceAssetUrls.length > 0) {
      for (const srcUrl of sourceAssetUrls.slice(0, 2)) {
        try {
          const res = await fetch(srcUrl);
          if (res.ok) {
            const ab = await res.arrayBuffer();
            const buf = Buffer.from(ab);
            inputImages.push({
              url: srcUrl,
              mimeType: detectMimeType(srcUrl, buf),
              base64: buf.toString("base64"),
              role: "source_or_logo",
            });
          }
        } catch (e) {
          console.warn("[IMAGENS_GERAR] Erro ao carregar foto do sujeito/produto:", e);
        }
      }
    }

    // 2. Logomarca oficial do BrandKit se não estiver já na lista de sourceAssetUrls
    if (useBrandKit && brandSnapshot?.logoUrl && !sourceAssetUrls.includes(brandSnapshot.logoUrl)) {
      try {
        const res = await fetch(brandSnapshot.logoUrl);
        if (res.ok) {
          const ab = await res.arrayBuffer();
          const buf = Buffer.from(ab);
          inputImages.push({
            url: brandSnapshot.logoUrl,
            mimeType: detectMimeType(brandSnapshot.logoUrl, buf),
            base64: buf.toString("base64"),
            role: "source_or_logo",
          });
        }
      } catch (e) {
        console.warn("[IMAGENS_GERAR] Erro ao carregar logo do BrandKit:", e);
      }
    }

    // 3. Fallback inteligente: Logomarca Oficial NumVapt local do sistema
    // Se a marca for NumVapt (ou o briefing citar NumVapt) e nenhuma logo foi carregada até aqui
    const hasSourceOrLogo = inputImages.some((img) => img.role === "source_or_logo");
    if (
      !hasSourceOrLogo &&
      ((brandSnapshot?.name && brandSnapshot.name.toLowerCase().includes("numvapt")) ||
        brief.toLowerCase().includes("numvapt"))
    ) {
      try {
        const localLogoPath = path.join(process.cwd(), "public", "logo-numvapt.png");
        if (fs.existsSync(localLogoPath)) {
          const logoBuf = fs.readFileSync(localLogoPath);
          inputImages.unshift({
            mimeType: "image/png",
            base64: logoBuf.toString("base64"),
            role: "source_or_logo",
          });
        }
      } catch (localLogoErr) {
        console.warn("[IMAGENS_GERAR] Erro ao carregar logo local NumVapt:", localLogoErr);
      }
    }

    // 4. Fotos de Referência / Inspiração (referenceAssetUrls)
    if (referenceAssetUrls && referenceAssetUrls.length > 0) {
      for (const refUrl of referenceAssetUrls.slice(0, 2)) {
        try {
          const res = await fetch(refUrl);
          if (res.ok) {
            const ab = await res.arrayBuffer();
            const buf = Buffer.from(ab);
            inputImages.push({
              url: refUrl,
              mimeType: detectMimeType(refUrl, buf),
              base64: buf.toString("base64"),
              role: "reference",
            });
          }
        } catch (e) {
          console.warn("[IMAGENS_GERAR] Erro ao carregar imagem de referência:", e);
        }
      }
    }

    // 4. Função auxiliar de geração de imagem individual com intermediário GPT-5 -> GPT Image 2
    const generateSingleImage = async (slotId: string, orderIndex: number): Promise<AIImageAssetDoc> => {
      const slotRef = adminDb.doc(`users/${userId}/aiImageAssets/${slotId}`);
      let imageBuffer: Buffer | null = null;
      let modelUsed = "gpt-image-2";
      let plannerModelUsed = "gpt-5";
      let visualPlan: any = null;
      let usedPrompt = compiledPrompt;
      let lastError = "";

      try {
        const orchResult = await ImageGenerationOrchestrator.execute({
          userId,
          generationId,
          assetId: slotId,
          rawBrief: brief,
          compiledPrompt,
          objective,
          format,
          style,
          useBrandKit,
          brandSnapshot,
          textOverlayMode: effectiveOverlayMode,
          productHeadline,
          negativeInstructions,
          sourceAssetUrls,
          referenceAssetUrls,
        });

        imageBuffer = orchResult.imageBuffer;
        modelUsed = orchResult.imageModelUsed;
        plannerModelUsed = orchResult.plannerModelUsed;
        visualPlan = orchResult.planResult.visualPlan;
        usedPrompt = orchResult.planResult.compiledImagePrompt;
      } catch (orchErr: any) {
        lastError = orchErr?.message || String(orchErr);
        console.warn(`[IMAGENS_GERAR] Orquestrador falhou para slot ${slotId}:`, lastError);
      }

      if (!imageBuffer) {
        const failedAsset: AIImageAssetDoc = {
          id: slotId,
          generationId,
          userId,
          order: orderIndex,
          status: "failed",
          error: lastError || "Não foi possível gerar esta variação. Tente novamente ou ajuste o briefing.",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await slotRef.set(failedAsset, { merge: true });
        return failedAsset;
      }

      // 5. Pós-processamento e Padronização Exata de Resolução via Jimp (SEM CORTES DESTRUTIVOS)
      const targetDims = FORMAT_DIMENSIONS[format] || { width: 1080, height: 1350 };
      const targetWidth = targetDims.width;
      const targetHeight = targetDims.height;

      try {
        const jimpImage = await Jimp.read(imageBuffer);
        jimpImage.resize({ w: targetWidth, h: targetHeight });
        imageBuffer = await jimpImage.getBuffer("image/png");
      } catch (jimpErr) {
        console.warn("[IMAGENS_GERAR] Aviso no ajuste de dimensões via Jimp:", jimpErr);
      }

      // 6. Salvar arquivo físico no Firebase Storage
      const storageFilePath = `${userStoragePath}/aiImages/image_${slotId}.png`;
      const fileRef = bucket.file(storageFilePath);
      const downloadToken = crypto.randomUUID();

      await fileRef.save(imageBuffer, {
        metadata: {
          contentType: "image/png",
          metadata: {
            firebaseStorageDownloadTokens: downloadToken,
            userId,
            generationId,
            source: "ai_image_general",
            modelUsed,
            plannerModelUsed,
          },
        },
      });

      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
        storageFilePath
      )}?alt=media&token=${downloadToken}`;

      // 7. Cadastrar automaticamente na Galeria do usuário (mediaGallery) anotando modelUsed e plannerModelUsed
      const galleryMediaId = `ai_img_${slotId}`;
      const galleryRef = adminDb.doc(`users/${userId}/mediaGallery/${galleryMediaId}`);

      const titleSummary = brief.slice(0, 60);
      await galleryRef.set({
        id: galleryMediaId,
        url: publicUrl,
        storagePath: storageFilePath,
        source: "ai_image_general",
        prompt: brief,
        caption: titleSummary,
        type: "image",
        style,
        format,
        width: targetWidth,
        height: targetHeight,
        modelUsed,
        plannerModelUsed,
        generationId,
        assetId: slotId,
        brandKitApplied: Boolean(useBrandKit && brandSnapshot),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        usedInPostId: null,
        fileName: `image_${slotId}.png`,
      });

      // 8. Salvar status no aiImageAsset anotando modelUsed e plannerModelUsed na raiz e no promptMetadata
      const readyAsset: AIImageAssetDoc = {
        id: slotId,
        generationId,
        userId,
        order: orderIndex,
        status: "ready",
        originalUrl: publicUrl,
        previewUrl: publicUrl,
        galleryAssetId: galleryMediaId,
        modelUsed,
        plannerModelUsed,
        promptMetadata: {
          fullPrompt: usedPrompt,
          modelUsed,
          plannerModelUsed,
          ...(visualPlan ? { visualPlan } : {}),
          ...(visualDirection ? { visualDirection } : {}),
        },
        altText: titleSummary,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await slotRef.set(readyAsset, { merge: true });

      logApiUsage({
        userId,
        type: "image_generation",
        provider: modelUsed.includes("gemini") ? "google_gemini" : "openai",
        model: modelUsed || "gpt-image-2",
        costUsd: 0.04,
      });

      return readyAsset;
    };

    // Executar geração dos slots
    const generatedAssets: AIImageAssetDoc[] = [];
    for (let i = 0; i < assetSlots.length; i++) {
      const asset = await generateSingleImage(assetSlots[i].id, assetSlots[i].order);
      generatedAssets.push(asset);
    }

    const hasAnyReady = generatedAssets.some((a) => a.status === "ready");
    const hasAnyFailed = generatedAssets.some((a) => a.status === "failed");

    const finalStatus =
      hasAnyReady && !hasAnyFailed
        ? "ready"
        : hasAnyReady && hasAnyFailed
          ? "partial_ready"
          : "failed";

    const readyAssetFound = generatedAssets.find((a) => a.status === "ready");
    const primaryModelUsed = readyAssetFound?.modelUsed || "gpt-image-2";
    const primaryPlannerModelUsed = readyAssetFound?.plannerModelUsed || "gpt-5";
    const primaryVisualPlan = readyAssetFound?.promptMetadata?.visualPlan || null;

    await genDocRef.update({
      status: finalStatus,
      modelUsed: primaryModelUsed,
      plannerModelUsed: primaryPlannerModelUsed,
      ...(primaryVisualPlan ? { visualPlan: primaryVisualPlan } : {}),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      generationId,
      status: finalStatus,
      assets: generatedAssets,
    });
  } catch (error: any) {
    console.error("[IMAGENS_GERAR_ERROR]:", error);
    return NextResponse.json(
      { error: "Falha interna ao gerar as imagens com IA." },
      { status: 500 }
    );
  }
}
