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
  BrandSnapshot,
} from "@/lib/types/ai-image-general";
import crypto from "crypto";

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
        const businessDoc = await adminDb.doc(`users/${userId}/business/onboarding`).get();
        if (businessDoc.exists) {
          const data = businessDoc.data();
          const bk = data?.brandKit;
          brandSnapshot = {
            name: data?.name || bk?.name || "Empresa",
            segment: data?.segment || bk?.segment || "",
            primaryColor: data?.primaryColor || bk?.primaryColor,
            secondaryColor: data?.secondaryColor || bk?.secondaryColor,
            visualGuidelines: bk?.visualGuidelines || "",
            logoUrl: bk?.logoUrl || data?.logo?.url || "",
          };
        }
      } catch (bkErr) {
        console.warn("[IMAGENS_GERAR] Aviso ao obter brand snapshot:", bkErr);
      }
    }

    // 2. Criar ou reutilizar entidade aiImageGeneration no Firestore
    const generationId =
      existingGenerationId || `gen_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const genDocRef = adminDb.doc(`users/${userId}/aiImageGenerations/${generationId}`);

    if (!existingGenerationId) {
      const initialGenData: AIImageGenerationDoc = {
        id: generationId,
        userId,
        status: "generating",
        brief: brief || "",
        visualDirection: visualDirection || undefined,
        objective,
        format,
        width,
        height,
        quantity,
        style,
        useBrandKit,
        brandSnapshot,
        referenceAssetUrls,
        sourceAssetUrls,
        textOverlayMode,
        productHeadline: productHeadline || undefined,
        safetyStatus: "approved",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await genDocRef.set(initialGenData);
    }

    // 3. Montar prompt otimizado para o motor visual
    let compiledPrompt = brief;
    if (visualDirection) {
      compiledPrompt = `${visualDirection.subject}. ${visualDirection.composition}. ${visualDirection.lighting}. Estilo: ${visualDirection.style}.`;
      if (visualDirection.brandApplication && useBrandKit) {
        compiledPrompt += ` ${visualDirection.brandApplication}`;
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
        ? `headline "${productHeadline.trim()}"`
        : "an impactful commercial headline";
      compiledPrompt +=
        ` [CREATIVE ADVERTISING AGENCY DIRECTIVE — INFOGRAPHIC POSTER MODE: Construct a complete, bespoke commercial advertising poster / infographic card in Portuguese (pt-BR). Include: (1) An impactful ${headlineDirective} at the top in Portuguese with decorative badge, (2) A floating quality or guarantee seal badge (e.g. "QUALIDADE PREMIUM", "100% ORIGINAL" ou "GARANTIA TOTAL"), (3) The subject prominently staged in high fidelity with atmospheric depth, (4) A structured row of 3-4 distinct benefit cards with minimalist line icons and short Portuguese micro-descriptions tailored to the subject, (5) An elegant slogan bar. 20% safe margins from all borders.]`;
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

    // 4. Função auxiliar de geração de imagem individual
    const generateSingleImage = async (slotId: string, orderIndex: number): Promise<AIImageAssetDoc> => {
      const slotRef = adminDb.doc(`users/${userId}/aiImageAssets/${slotId}`);
      let imageBuffer: Buffer | null = null;
      let modelUsed = "";
      let lastError = "";

      // Pipeline multimodelo: 1. OpenAI gpt-image-2 -> 2. Gemini 3 Pro -> 3. Fallback DALL-E-3
      const modelsToTry = [
        { provider: "openai", model: "gpt-image-2" },
        { provider: "google", model: "gemini-3-pro-image" },
        { provider: "openai", model: "dall-e-3" },
      ];

      for (const cfg of modelsToTry) {
        try {
          if (cfg.provider === "openai" && openaiKey) {
            const nativeSize =
              format === "portrait"
                ? "1024x1792"
                : format === "square"
                  ? "1024x1024"
                  : "1792x1024";

            const res = await fetchWithRetry("https://api.openai.com/v1/images/generations", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${openaiKey}`,
              },
              body: JSON.stringify({
                model: cfg.model,
                prompt: compiledPrompt,
                n: 1,
                size: nativeSize,
              }),
            });

            if (res.ok) {
              const data = await res.json();
              const b64 = data?.data?.[0]?.b64_json;
              const imgUrl = data?.data?.[0]?.url;
              if (b64) {
                imageBuffer = Buffer.from(b64, "base64");
                modelUsed = cfg.model;
                break;
              } else if (imgUrl) {
                const downloadRes = await fetch(imgUrl);
                if (downloadRes.ok) {
                  const ab = await downloadRes.arrayBuffer();
                  imageBuffer = Buffer.from(ab);
                  modelUsed = cfg.model;
                  break;
                }
              }
            }
          } else if (cfg.provider === "google" && geminiKey) {
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${cfg.model}:generateContent?key=${geminiKey}`;
            const parts: any[] = [{ text: compiledPrompt }];

            // Se houver referências visuais
            if (referenceAssetUrls.length > 0) {
              for (const refUrl of referenceAssetUrls.slice(0, 2)) {
                try {
                  const refFetch = await fetch(refUrl);
                  if (refFetch.ok) {
                    const refAb = await refFetch.arrayBuffer();
                    parts.push({
                      inlineData: {
                        mimeType: "image/jpeg",
                        data: Buffer.from(refAb).toString("base64"),
                      },
                    });
                  }
                } catch (e) {
                  console.warn("[IMAGENS_GERAR] Falha ao anexar imagem de referência:", e);
                }
              }
            }

            const res = await fetchWithRetry(geminiUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts }],
                generationConfig: {
                  responseModalities: ["IMAGE"],
                },
              }),
            });

            if (res.ok) {
              const data = await res.json();
              const b64 = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
              if (b64) {
                imageBuffer = Buffer.from(b64, "base64");
                modelUsed = cfg.model;
                break;
              }
            }
          }
        } catch (err: any) {
          lastError = err?.message || String(err);
          console.warn(`[IMAGENS_GERAR] Falha no modelo ${cfg.model}:`, lastError);
        }
      }

      if (!imageBuffer) {
        const failedAsset: AIImageAssetDoc = {
          id: slotId,
          generationId,
          userId,
          order: orderIndex,
          status: "failed",
          error: "Não foi possível gerar esta variação. Tente novamente ou ajuste o briefing.",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await slotRef.set(failedAsset, { merge: true });
        return failedAsset;
      }

      // 5. Salvar arquivo físico no Firebase Storage
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
          },
        },
      });

      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
        storageFilePath
      )}?alt=media&token=${downloadToken}`;

      // 6. Cadastrar automaticamente na Galeria do usuário (mediaGallery)
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
        width,
        height,
        generationId,
        assetId: slotId,
        brandKitApplied: Boolean(useBrandKit && brandSnapshot),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        usedInPostId: null,
        fileName: `image_${slotId}.png`,
      });

      // 7. Salvar status no aiImageAsset
      const readyAsset: AIImageAssetDoc = {
        id: slotId,
        generationId,
        userId,
        order: orderIndex,
        status: "ready",
        originalUrl: publicUrl,
        previewUrl: publicUrl,
        galleryAssetId: galleryMediaId,
        promptMetadata: {
          fullPrompt: compiledPrompt,
          modelUsed,
          visualDirection,
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
        metadata: { generationId, assetId: slotId, format, modelUsed },
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

    await genDocRef.update({
      status: finalStatus,
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
