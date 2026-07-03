import { NextResponse } from "next/server";
import { admin } from "@/lib/firebase-admin";
import crypto from "crypto";
import { logApiUsage } from "@/lib/services/api-usage-service-admin";

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const { imageUrl, maskBase64, prompt, newText, userId, postId, fileName } = await request.json();

    if (!imageUrl || !maskBase64 || !newText || !userId || !postId || !fileName) {
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes: imageUrl, maskBase64, newText, userId, postId, fileName" },
        { status: 400 }
      );
    }

    const falKey = process.env.FAL_KEY;
    if (!falKey) {
      console.error("[CORRIGIR_IMAGEM_ERROR] Chave FAL_KEY não encontrada no arquivo de ambiente.");
      return NextResponse.json(
        { error: "Serviço de correção indisponível (FAL_KEY ausente)." },
        { status: 500 }
      );
    }

    // 1. Tentar obter o prompt original do Firestore se não vier na requisição
    let cleanPrompt = prompt ? prompt.trim() : "";
    if (!cleanPrompt) {
      try {
        const galleryMediaId = `${postId}_concept_${fileName}`;
        const docSnap = await admin
          .firestore()
          .collection("users")
          .doc(userId)
          .collection("mediaGallery")
          .doc(galleryMediaId)
          .get();
        if (docSnap.exists) {
          cleanPrompt = docSnap.data()?.prompt || "";
        }
      } catch (err: any) {
        console.warn("[CORRIGIR_IMAGEM] Falha ao recuperar prompt original do Firestore:", err.message);
      }
    }
    if (!cleanPrompt) cleanPrompt = "advertising graphic design post";

    const inpaintPrompt = `Render the literal text "${newText}" exactly inside the masked area. The letters must match the typography style, colors, materials, and lighting of the surrounding image perfectly. Ensure correct spelling, clean characters, and render the text exactly once. Surroundings: ${cleanPrompt}`;

    console.log(`[CORRIGIR_IMAGEM] Iniciando inpainting com Fal AI para post ${postId} (Slot: ${fileName})...`);
    console.log(`[CORRIGIR_IMAGEM] Prompt de Inpainting: ${inpaintPrompt}`);

    // 2. Chamar endpoint do Flux Dev Inpainting da Fal AI
    const falUrl = "https://queue.fal.run/fal-ai/flux/dev/inpainting?sync_mode=true";
    const falResponse = await fetch(falUrl, {
      method: "POST",
      headers: {
        "Authorization": `Key ${falKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: imageUrl,
        mask_url: maskBase64,
        prompt: inpaintPrompt,
        num_inference_steps: 30,
        guidance_scale: 7.5,
        strength: 0.95,
        sync_mode: true
      })
    });

    if (!falResponse.ok) {
      const errorText = await falResponse.text();
      console.error(`[CORRIGIR_IMAGEM_ERROR] Erro na Fal AI (${falResponse.status}):`, errorText);
      return NextResponse.json(
        { success: false, error: `Fal AI retornou status ${falResponse.status}`, details: errorText },
        { status: falResponse.status }
      );
    }

    const falData = await falResponse.json();
    const resultImageUrl = falData?.images?.[0]?.url;

    if (!resultImageUrl) {
      console.error("[CORRIGIR_IMAGEM_ERROR] Fal AI não retornou a URL da imagem corrigida.");
      return NextResponse.json(
        { success: false, error: "Fal AI não retornou a URL da imagem corrigida." },
        { status: 500 }
      );
    }

    console.log(`[CORRIGIR_IMAGEM] Imagem corrigida gerada pela Fal AI: ${resultImageUrl}`);

    // 3. Fazer download da imagem gerada pela Fal AI
    const imageDownloadRes = await fetch(resultImageUrl);
    if (!imageDownloadRes.ok) {
      throw new Error(`Falha ao baixar imagem resultante do Fal AI (status ${imageDownloadRes.status})`);
    }
    const arrayBuffer = await imageDownloadRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. Salvar o buffer no Firebase Storage, substituindo a versão conceito anterior no mesmo local
    const firebaseProjectId = process.env.FIREBASE_PROJECT_ID || "studio-7502195980-3983c";
    const bucket = admin.storage().bucket(`${firebaseProjectId}.firebasestorage.app`);

    const fileRef = bucket.file(`users/${userId}/posts/${postId}/concepts/image_${fileName}.jpg`);
    const downloadToken = crypto.randomUUID();

    await fileRef.save(buffer, {
      metadata: {
        contentType: "image/jpeg",
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
        },
      },
    });

    const firebaseDownloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileRef.name)}?alt=media&token=${downloadToken}`;
    console.log(`[CORRIGIR_IMAGEM] Imagem corrigida salva no Storage: ${firebaseDownloadUrl}`);

    // 5. Atualizar o registro correspondente no Firestore na subcoleção mediaGallery
    try {
      const galleryRef = admin
        .firestore()
        .collection("users")
        .doc(userId)
        .collection("mediaGallery");
      const galleryMediaId = `${postId}_concept_${fileName}`;

      await galleryRef.doc(galleryMediaId).update({
        url: firebaseDownloadUrl,
        prompt: cleanPrompt,
        correctedPrompt: inpaintPrompt,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`[CORRIGIR_IMAGEM] Firestore catalog atualizado: ${galleryMediaId}`);

      // Registrar consumo na API Usage
      logApiUsage({
        userId,
        type: "image_generation",
        provider: "fal_ai",
        model: "flux-dev-inpaint",
        costUsd: 0.035,
      });
    } catch (firestoreError: any) {
      console.warn("[CORRIGIR_IMAGEM_WARN] Falha ao atualizar Firestore:", firestoreError.message || firestoreError);
    }

    return NextResponse.json({
      success: true,
      imageUrl: firebaseDownloadUrl,
    });
  } catch (error: any) {
    console.error("[CORRIGIR_IMAGEM_ERROR] Erro interno na API:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno no servidor ao corrigir imagem.", details: error.message },
      { status: 500 }
    );
  }
}
