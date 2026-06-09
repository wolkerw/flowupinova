import { NextResponse } from "next/server";
import { admin } from "@/lib/firebase-admin";
import crypto from "crypto";

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
      
      if (response.status === 429 || response.status === 503 || (response.status >= 500 && response.status <= 599)) {
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
    const { prompt, postId, fileName, userId } = await request.json();

    if (!prompt || !postId || !fileName || !userId) {
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes: prompt, postId, fileName, userId" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("[GENERATE_IMAGES_NATIVE_ERROR] Chave GEMINI_API_KEY não encontrada no arquivo de ambiente.");
      return NextResponse.json(
        { error: "Chave de API do Gemini ausente no servidor." },
        { status: 500 }
      );
    }

    // 1. Chamar a API REST oficial do Google Imagen com fallback automático de modelo
    // Tenta o Ultra primeiro (maior qualidade). Se indisponível (503/500), cai para o Fast.
    const IMAGEN_MODELS = [
      "imagen-4.0-ultra-generate-001",
      "imagen-4.0-fast-generate-001",
    ];

    let imagenData: any = null;
    let lastError = "";

    for (const model of IMAGEN_MODELS) {
      console.log(`[GENERATE_IMAGES_NATIVE] Tentando modelo ${model} para o post ${postId} (Slot: ${fileName})...`);
      const imagenUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`;

      const imagenResponse = await fetchWithRetry(imagenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt: prompt }],
          parameters: {
            sampleCount: 1,
            outputMimeType: "image/jpeg",
            aspectRatio: "1:1",
          },
        }),
      });

      if (imagenResponse.ok) {
        const data = await imagenResponse.json();
        if (data?.predictions?.[0]?.bytesBase64Encoded) {
          imagenData = data;
          console.log(`[GENERATE_IMAGES_NATIVE] Sucesso com o modelo ${model}!`);
          break;
        }
      }

      // Se for 503 ou 500 (instabilidade no servidor), tenta o próximo modelo
      const errText = await imagenResponse.text().catch(() => `status ${imagenResponse.status}`);
      lastError = `Modelo ${model} falhou (status ${imagenResponse.status}): ${errText.substring(0, 200)}`;
      console.warn(`[GENERATE_IMAGES_NATIVE] ${lastError}. Tentando próximo modelo...`);
    }

    if (!imagenData) {
      console.error(`[GENERATE_IMAGES_NATIVE] Todos os modelos Imagen falharam. Último erro: ${lastError}`);
      throw new Error(`Todos os modelos do Google Imagen falharam. ${lastError}`);
    }

    const imageBytes = imagenData?.predictions?.[0]?.bytesBase64Encoded;

    if (!imageBytes) {
      console.error("[GENERATE_IMAGES_NATIVE] API do Google Imagen não retornou dados de imagem em Base64 no formato esperado.");
      throw new Error("A API do Google Imagen retornou uma resposta sem bytesBase64Encoded na estrutura.");
    }

    // 2. Converter o base64 para Buffer binário
    const buffer = Buffer.from(imageBytes, "base64");

    // 3. Fazer o upload do buffer diretamente para o Firebase Storage usando o Firebase Admin SDK no bucket correto
    const projectId = process.env.FIREBASE_PROJECT_ID || "studio-7502195980-3983c";
    const bucket = admin.storage().bucket(`${projectId}.firebasestorage.app`);
    
    // Caminho da imagem conceito estruturado no Storage
    const fileRef = bucket.file(`users/${userId}/posts/${postId}/concepts/image_${fileName}.jpg`);
    const downloadToken = crypto.randomUUID();

    await fileRef.save(buffer, {
      metadata: {
        contentType: "image/jpeg",
        metadata: {
          firebaseStorageDownloadTokens: downloadToken
        }
      }
    });

    // 4. Construir a URL de download pública e estável do Firebase Storage
    const firebaseDownloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileRef.name)}?alt=media&token=${downloadToken}`;
    console.log(`[GENERATE_IMAGES_NATIVE] Sucesso absoluto! Imagem conceito ${fileName} salva de forma estável no Firebase Storage: ${firebaseDownloadUrl}`);

    // 5. Cadastrar automaticamente o registro da imagem gerada na subcoleção mediaGallery do Firestore do lojista
    try {
      const galleryRef = admin.firestore().collection("users").doc(userId).collection("mediaGallery");
      const galleryMediaId = `${postId}_concept_${fileName}`;
      
      await galleryRef.doc(galleryMediaId).set({
        id: galleryMediaId,
        url: firebaseDownloadUrl,
        storagePath: fileRef.name,
        source: "wizard_generation",
        prompt: prompt,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        usedInPostId: null, // Inicialmente livre/não publicada
        fileName: `concept_${fileName}.jpg`
      });
      console.log(`[GENERATE_IMAGES_NATIVE] Imagem catalogada com sucesso na subcoleção mediaGallery do Firestore: ${galleryMediaId}`);
    } catch (firestoreError) {
      console.error("[GENERATE_IMAGES_NATIVE_ERROR] Falha ao catalogar imagem gerada no Firestore:", firestoreError);
    }

    return NextResponse.json({
      success: true,
      imageUrl: firebaseDownloadUrl,
      fileName: fileName
    });

  } catch (error: any) {
    console.error("[GENERATE_IMAGES_NATIVE_ERROR] Erro no processamento da imagem:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno ao processar a geração de imagem.", details: error.message },
      { status: 500 }
    );
  }
}
