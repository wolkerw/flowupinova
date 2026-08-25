import { NextResponse } from "next/server";
import { admin, adminDb } from "@/lib/firebase-admin";
import { getUserStoragePathAdmin } from "@/lib/services/storage-utils-admin";
import crypto from "crypto";
import { logApiUsage } from "@/lib/services/api-usage-service-admin";
import { Jimp } from "jimp";

export const maxDuration = 300;

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 5,
  delay = 3000
): Promise<Response> {
  let lastResponse: Response | null = null;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      lastResponse = response;

      if (
        response.status === 429 ||
        response.status === 503 ||
        (response.status >= 500 && response.status <= 599)
      ) {
        console.warn(
          `[GENERATE_IMAGES_NATIVE] Recebido status ${response.status}. Tentando novamente em ${delay}ms... (Tentativa ${i + 1}/${retries})`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
        continue;
      }

      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      console.warn(
        `[GENERATE_IMAGES_NATIVE] Erro de rede ou desconhecido. Tentando novamente em ${delay}ms... (Tentativa ${i + 1}/${retries})`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
  return lastResponse || fetch(url, options);
}

export async function POST(request: Request) {
  try {
    const { prompt, postId, fileName, userId, content, layoutStyle } = await request.json();

    if (!prompt || !postId || !fileName || !userId) {
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes: prompt, postId, fileName, userId" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error(
        "[GENERATE_IMAGES_NATIVE_ERROR] Chave GEMINI_API_KEY não encontrada no arquivo de ambiente."
      );
      return NextResponse.json(
        { error: "Chave de API do Gemini ausente no servidor." },
        { status: 500 }
      );
    }

    // 1. Carregar as diretrizes visuais e paleta de cores da marca do Firestore (Brand Kit)
    let finalPrompt = prompt;
    try {
      const docSnap = await admin.firestore().doc(`users/${userId}/business/onboarding`).get();
      if (docSnap.exists) {
        const data = docSnap.data();
        const brandKit = data?.brandKit;

        let brandEnhancements = "";
        if (brandKit?.visualGuidelines) {
          brandEnhancements += ` Siga o estilo visual de: ${brandKit.visualGuidelines.trim()}.`;
        }
        if (brandKit?.primaryColor || brandKit?.secondaryColor) {
          const colors = [];
          if (brandKit.primaryColor) colors.push(brandKit.primaryColor);
          if (brandKit.secondaryColor) colors.push(brandKit.secondaryColor);
          brandEnhancements += ` Integre de forma harmôniosa elementos de cenário ou iluminação sutil que remetam aos tons de: ${colors.join(" e ")}.`;
        }

        if (brandEnhancements) {
          // Remover qualquer ponto final redundante para concatenar de forma limpa
          const cleanPrompt = prompt.trim().endsWith(".")
            ? prompt.trim().slice(0, -1)
            : prompt.trim();
          finalPrompt = `${cleanPrompt}.${brandEnhancements}`;
          console.log(
            `[GENERATE_IMAGES_NATIVE] Prompt estendido com diretrizes do Brand Kit: ${finalPrompt}`
          );
        }
      }
    } catch (dbError) {
      console.warn(
        "[GENERATE_IMAGES_NATIVE] Falha ao carregar diretrizes de marca do Firestore (usando prompt original):",
        dbError
      );
    }

    // 2. Injetar o estilo selecionado no início do prompt (user prompt layer)
    // Isso garante que o modelo visual processe a instrução de estilo ANTES do conteúdo narrativo,
    // mesmo que o gpt-image-2 tente reescrever o restante do prompt.
    const STYLE_LABELS: Record<string, string> = {
      CINEMATIC: "Cinematic Photography — dramatic lighting, deep shadows, 85mm f/1.8 lens",
      STUDIO_CLEAN:
        "Studio Clean Photography — elegant seamless neutral backdrop, soft uniform lighting",
      URBAN_LIFESTYLE: "Authentic Urban Lifestyle — real outdoor city setting, natural daylight",
      MINIMALIST:
        "Minimalist Design — spacious composition, 50-60% clean negative space, modern sophisticated aesthetic",
      TECH_3D:
        "Premium 3D Tech Illustration — Octane/Redshift render style, vibrant colors, glass and metallic textures",
      MAGAZINE_3D:
        "Magazine 3D Cover — high-fashion magazine cover style, integrated typography with 3D depth, subject overlaps title letters",
      PRODUCT_METAAD:
        "Meta Ads High-Conversion Product Advertising — 45-55% strategic negative space for copy/pricing, sharp rim light separation, true-to-life product texture",
      PRODUCT_PREMIUM:
        "Ultra-Luxury Product Showcase — geometric Carrara marble pedestal, caustic reflections, large overhead softbox 3-point lighting",
      PRODUCT_LIFESTYLE:
        "Aspirational Lifestyle Product in Use — natural window sunlight, authentic contemporary interior setting, soft depth of field",
      PRODUCT_DYNAMIC:
        "Dynamic High-Speed Commercial Splash — 1/8000s shutter freeze, suspended water droplets and energetic fluid dynamics",
      PRODUCT_CATALOG:
        "Clean Minimalist E-Commerce Catalog — seamless infinite pure studio backdrop, uniform shadowless light, f/11 edge-to-edge sharpness",
      PRODUCT_COSMETICS:
        "Luxury Cosmetics & Skincare — acrylic ripple tray, delicate organic floral petals, soft pastel backlighting, liquid textures",
      PRODUCT_TECH:
        "Futuristic Tech Hardware — levitating in zero gravity, glowing cyan and purple neon rim accents, sleek titanium finish",
      PRODUCT_FLATLAY:
        "90-Degree Flat Lay Knolling — top-down orthographic view, geometric prop organization, natural linen background",
      PRODUCT_GOURMET:
        "Commercial Food & Culinary — appetizing rich textures, gentle rising steam, warm restaurant ambient glow",
      PRODUCT_RUSTIC:
        "Rustic & Artisanal Botanical — raw organic wood slab, dried eucalyptus branches, warm morning window sunbeams",
    };
    if (layoutStyle && STYLE_LABELS[layoutStyle]) {
      const styleHeader = `[VISUAL STYLE: ${STYLE_LABELS[layoutStyle]}] `;
      finalPrompt = styleHeader + finalPrompt;
      console.log(`[GENERATE_IMAGES_NATIVE] Estilo '${layoutStyle}' injetado no início do prompt.`);
    }

    // 2. Modelo Principal Estrito: gpt-image-2 (OpenAI) é SEMPRE o motor primário absoluto
    const MODELS_CHAIN = [
      { provider: "openai", model: "gpt-image-2" },
      { provider: "openai", model: "dall-e-3" },
      { provider: "google", model: "gemini-3-pro-image" },
    ];

    let imageBytes: string | null = null;
    let modelUsed = "";
    let lastError = "";
    const openaiKey = process.env.OPENAI_API_KEY;

    for (const config of MODELS_CHAIN) {
      console.log(
        `[GENERATE_IMAGES_NATIVE] Tentando modelo principal ${config.model} (${config.provider}) para o post ${postId} (Slot: ${fileName})...`
      );

      try {
        if (config.provider === "openai") {
          if (!openaiKey) throw new Error("OPENAI_API_KEY ausente no ambiente (.env.local)");

          const payload: any = {
            model: config.model,
            prompt: finalPrompt,
            n: 1,
            size: "1024x1024",
          };

          const response = await fetchWithRetry("https://api.openai.com/v1/images/generations", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${openaiKey}`,
            },
            body: JSON.stringify(payload),
          });

          if (response.ok) {
            const data = await response.json();
            let b64 = data?.data?.[0]?.b64_json;
            if (!b64 && data?.data?.[0]?.url) {
              console.log(
                `[GENERATE_IMAGES_NATIVE] URL recebida da OpenAI (${config.model}), baixando imagem...`
              );
              const imgRes = await fetch(data.data[0].url);
              if (imgRes.ok) {
                const ab = await imgRes.arrayBuffer();
                b64 = Buffer.from(ab).toString("base64");
              }
            }
            if (b64) {
              imageBytes = b64;
              modelUsed = config.model;
              console.log(`[GENERATE_IMAGES_NATIVE] ✅ Sucesso com o modelo ${config.model}!`);
              break;
            }
          }
          const errText = await response.text().catch(() => `status ${response.status}`);
          lastError = `Modelo OpenAI ${config.model} falhou: ${errText.substring(0, 250)}`;
          console.error(`[GENERATE_IMAGES_NATIVE] ${lastError}`);
          throw new Error(lastError);
        } else if (config.model.startsWith("gemini-")) {
          // Google Gemini Image (Nano Banana)
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${apiKey}`;
          const response = await fetchWithRetry(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `[FORMAT: Vertical 3:4 portrait (1080x1440)] Framed vertically in 3:4 aspect ratio (1080x1440 portrait format). ${finalPrompt}`,
                    },
                  ],
                },
              ],
              generationConfig: {
                responseModalities: ["IMAGE"],
              },
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const bytes = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (bytes) {
              imageBytes = bytes;
              modelUsed = config.model;
              console.log(`[GENERATE_IMAGES_NATIVE] ✅ Sucesso com o modelo ${config.model}!`);
              break;
            }
          }
          const errText = await response.text().catch(() => `status ${response.status}`);
          lastError = `Modelo Google Gemini ${config.model} falhou: ${errText.substring(0, 250)}`;
          console.error(`[GENERATE_IMAGES_NATIVE] ${lastError}`);
          throw new Error(lastError);
        } else {
          // Google Imagen
          const imagenUrl = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:predict?key=${apiKey}`;
          const response = await fetchWithRetry(imagenUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              instances: [{ prompt: finalPrompt }],
              parameters: {
                sampleCount: 1,
                outputMimeType: "image/jpeg",
                aspectRatio: "3:4",
              },
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data?.predictions?.[0]?.bytesBase64Encoded) {
              imageBytes = data.predictions[0].bytesBase64Encoded;
              modelUsed = config.model;
              console.log(`[GENERATE_IMAGES_NATIVE] ✅ Sucesso com o modelo ${config.model}!`);
              break;
            }
          }
          const errText = await response.text().catch(() => `status ${response.status}`);
          lastError = `Modelo Google ${config.model} falhou: ${errText.substring(0, 250)}`;
          console.error(`[GENERATE_IMAGES_NATIVE] ${lastError}`);
          throw new Error(lastError);
        }
      } catch (err: any) {
        console.warn(
          `[GENERATE_IMAGES_NATIVE] Exceção na tentativa (${config.model}): ${err.message}. Tentando próximo modelo...`
        );
      }
    }

    if (!imageBytes) {
      console.error(
        `[GENERATE_IMAGES_NATIVE] Todos os modelos de imagem falharam. Último erro: ${lastError}`
      );
      throw new Error(`Falha na geração de imagem. ${lastError}`);
    }

    // 2. Converter o base64 para Buffer binário e padronizar com precisão em 1080x1440 (3:4)
    let buffer = Buffer.from(imageBytes, "base64");
    try {
      const image = await Jimp.read(buffer);
      const targetWidth = 1080;
      const targetHeight = 1440;
      const targetRatio = targetWidth / targetHeight; // 0.75 (3:4)
      const currentRatio = image.width / image.height;

      if (Math.abs(currentRatio - targetRatio) > 0.01) {
        let cropW = image.width;
        let cropH = image.height;
        if (currentRatio > targetRatio) {
          // Imagem mais larga (ex: horizontal 16:9 ou 1:1)
          cropW = Math.round(image.height * targetRatio);
          const x = Math.max(0, Math.floor((image.width - cropW) / 2));
          image.crop({ x, y: 0, w: cropW, h: cropH });
        } else {
          // Imagem mais alta (ex: vertical 9:16)
          cropH = Math.round(image.width / targetRatio);
          const y = Math.max(0, Math.floor((image.height - cropH) / 2));
          image.crop({ x: 0, y, w: cropW, h: cropH });
        }
      }

      image.resize({ w: targetWidth, h: targetHeight });
      buffer = await image.getBuffer("image/jpeg");
      console.log(
        `[GENERATE_IMAGES_NATIVE] Imagem concept_${fileName} formatada com precisão para 1080x1440 (3:4).`
      );
    } catch (jimpErr) {
      console.warn("[GENERATE_IMAGES_NATIVE] Falha ao ajustar proporção 3:4 com Jimp:", jimpErr);
    }

    // 3. Fazer o upload do buffer diretamente para o Firebase Storage usando o Firebase Admin SDK no bucket correto
    const projectId = process.env.FIREBASE_PROJECT_ID || "studio-7502195980-3983c";
    const bucket = admin.storage().bucket(`${projectId}.firebasestorage.app`);

    // Caminho da imagem conceito estruturado no Storage
    const userStoragePath = await getUserStoragePathAdmin(userId);
    const fileRef = bucket.file(
      `${userStoragePath}/posts/${postId}/concepts/image_${fileName}.jpg`
    );
    const downloadToken = crypto.randomUUID();

    await fileRef.save(buffer, {
      metadata: {
        contentType: "image/jpeg",
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
        },
      },
    });

    // 4. Construir a URL de download pública e estável do Firebase Storage
    const firebaseDownloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileRef.name)}?alt=media&token=${downloadToken}`;
    console.log(
      `[GENERATE_IMAGES_NATIVE] Sucesso absoluto! Imagem conceito ${fileName} salva de forma estável no Firebase Storage: ${firebaseDownloadUrl}`
    );

    // 5. Cadastrar automaticamente o registro da imagem gerada na subcoleção mediaGallery do Firestore do lojista
    try {
      const galleryRef = admin
        .firestore()
        .collection("users")
        .doc(userId)
        .collection("mediaGallery");
      const galleryMediaId = `${postId}_concept_${fileName}`;

      await galleryRef.doc(galleryMediaId).set({
        id: galleryMediaId,
        url: firebaseDownloadUrl,
        storagePath: fileRef.name,
        source: "wizard_generation",
        prompt: prompt,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        usedInPostId: null, // Inicialmente livre/não publicada
        fileName: `concept_${fileName}.jpg`,
        modelUsed: modelUsed || "gpt-image-2",
        caption: content
          ? `${content.titulo || ""}\n\n${content.subtitulo || ""}\n\n${Array.isArray(content.hashtags) ? content.hashtags.join(" ") : ""}`.trim()
          : null,
      });
      console.log(
        `[GENERATE_IMAGES_NATIVE] Imagem catalogada com sucesso na subcoleção mediaGallery do Firestore: ${galleryMediaId}`
      );

      // Log opcional de faturamento interno
      logApiUsage({
        userId,
        type: "image_generation",
        provider: modelUsed.includes("gpt") ? "openai" : "google_vertex",
        model: modelUsed || "gpt-image-2",
        costUsd: 0.03, // custo estimado padrão
      });
    } catch (firestoreError) {
      console.error(
        "[GENERATE_IMAGES_NATIVE_ERROR] Falha ao catalogar imagem gerada no Firestore:",
        firestoreError
      );
    }

    return NextResponse.json({
      success: true,
      imageUrl: firebaseDownloadUrl,
      fileName: fileName,
    });
  } catch (error: any) {
    console.error("[GENERATE_IMAGES_NATIVE_ERROR] Erro no processamento da imagem:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno ao processar a geração de imagem.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
