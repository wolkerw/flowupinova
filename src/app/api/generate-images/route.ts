import { NextResponse } from "next/server";
import { admin } from "@/lib/firebase-admin";
import crypto from "crypto";

export const maxDuration = 300;

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

    console.log(`[GENERATE_IMAGES_NATIVE] Iniciando geração via Google Imagen 4 Ultra nativo para o post ${postId} (Slot: ${fileName})...`);

    // 1. Chamar a API REST oficial do Google Imagen 4 Ultra de forma síncrona usando :predict
    const imagenUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-ultra-generate-001:predict?key=${apiKey}`;
    
    const imagenResponse = await fetch(imagenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        instances: [
          {
            prompt: prompt,
          }
        ],
        parameters: {
          sampleCount: 1,
          outputMimeType: "image/jpeg",
          aspectRatio: "1:1",
        },
      }),
    });

    if (!imagenResponse.ok) {
      const errText = await imagenResponse.text();
      console.error(`[GENERATE_IMAGES_NATIVE] Erro na API do Google Imagen 4 Ultra (status ${imagenResponse.status}):`, errText);
      throw new Error(`Erro na API do Google Imagen (Status ${imagenResponse.status}): ${errText}`);
    }

    const imagenData = await imagenResponse.json();
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
      // Mantemos o fluxo resiliente: mesmo que a gravação no banco falhe, o base64 e o storage completaram,
      // então não lançamos erro para não quebrar a experiência do lojista na UI.
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
