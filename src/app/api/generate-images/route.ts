import { NextResponse } from "next/server";
import { admin, adminDb } from "@/lib/firebase-admin";
import { getUserStoragePathAdmin } from "@/lib/services/storage-utils-admin";
import crypto from "crypto";
import { logApiUsage } from "@/lib/services/api-usage-service-admin";

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
      MAGAZINE_3D: "Magazine Cover 3D Parallax Effect — subject breaks through the text plane, editorial serif headline behind the person",
      CLEAN_LUXURY: "Clean Minimalist Luxury — large white negative space, soft diffused light, no clutter, ultra-premium aesthetic",
      UGC_CINEMATIC: "Authentic Lifestyle UGC Cinematic — candid real moment, natural window light, cinematic color grade",
      LIFESTYLE_HYBRID: "Lifestyle Hybrid — person in dynamic action on real-world setting, clean background, subject on one side with open space for text",
    };
    if (layoutStyle && STYLE_LABELS[layoutStyle]) {
      const styleHeader = `[VISUAL STYLE: ${STYLE_LABELS[layoutStyle]}] `;
      finalPrompt = styleHeader + finalPrompt;
      console.log(`[GENERATE_IMAGES_NATIVE] Estilo '${layoutStyle}' injetado no início do prompt.`);
    }

    // 2. Cadeia de modelos: gpt-image-2 primeiro, depois Imagen 4 Ultra como fallback
    const MODELS_CHAIN = [
      { provider: "openai", model: "gpt-image-2" },
      { provider: "google", model: "imagen-4.0-ultra-generate-001" },
    ];

    let imageBytes: string | null = null;
    let modelUsed = "";
    let lastError = "";
    const openaiKey = process.env.OPENAI_API_KEY;

    for (const config of MODELS_CHAIN) {
      console.log(
        `[GENERATE_IMAGES_NATIVE] Tentando modelo ${config.model} (${config.provider}) para o post ${postId} (Slot: ${fileName})...`
      );

      try {
        if (config.provider === "openai") {
          if (!openaiKey) throw new Error("OPENAI_API_KEY ausente");
          const response = await fetchWithRetry(
            "https://api.openai.com/v1/images/generations",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${openaiKey}`,
              },
              body: JSON.stringify({
                model: config.model,
                prompt: `I NEED to test how the tool works with extremely simple and exact prompts. DO NOT ADD ANY DETAIL, JUST USE IT AS-IS: ${finalPrompt}`,
                n: 1,
                size: "1024x1024",
                style: "vivid",
              }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data?.data?.[0]?.b64_json) {
              imageBytes = data.data[0].b64_json;
              modelUsed = config.model;
              console.log(`[GENERATE_IMAGES_NATIVE] Sucesso com o modelo ${config.model}!`);
              break;
            }
          }
          const errText = await response.text().catch(() => `status ${response.status}`);
          lastError = `Modelo OpenAI ${config.model} falhou: ${errText.substring(0, 200)}`;
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
                aspectRatio: "1:1",
              },
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data?.predictions?.[0]?.bytesBase64Encoded) {
              imageBytes = data.predictions[0].bytesBase64Encoded;
              modelUsed = config.model;
              console.log(`[GENERATE_IMAGES_NATIVE] Sucesso com o modelo ${config.model}!`);
              break;
            }
          }
          const errText = await response.text().catch(() => `status ${response.status}`);
          lastError = `Modelo Google ${config.model} falhou: ${errText.substring(0, 200)}`;
          throw new Error(lastError);
        }
      } catch (err: any) {
        console.warn(`[GENERATE_IMAGES_NATIVE] Exceção na tentativa: ${err.message}. Tentando próximo modelo...`);
      }
    }

    if (!imageBytes) {
      console.error(
        `[GENERATE_IMAGES_NATIVE] Todos os modelos Imagen falharam. Último erro: ${lastError}`
      );
      throw new Error(`Todos os modelos do Google Imagen falharam. ${lastError}`);
    }



    if (!imageBytes) {
      console.error(
        "[GENERATE_IMAGES_NATIVE] API do Google Imagen não retornou dados de imagem em Base64 no formato esperado."
      );
      throw new Error(
        "A API do Google Imagen retornou uma resposta sem bytesBase64Encoded na estrutura."
      );
    }

    // 2. Converter o base64 para Buffer binário
    const buffer = Buffer.from(imageBytes, "base64");

    // 3. Fazer o upload do buffer diretamente para o Firebase Storage usando o Firebase Admin SDK no bucket correto
    const projectId = process.env.FIREBASE_PROJECT_ID || "studio-7502195980-3983c";
    const bucket = admin.storage().bucket(`${projectId}.firebasestorage.app`);

    // Caminho da imagem conceito estruturado no Storage
    const userStoragePath = await getUserStoragePathAdmin(userId);
    const fileRef = bucket.file(`${userStoragePath}/posts/${postId}/concepts/image_${fileName}.jpg`);
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
