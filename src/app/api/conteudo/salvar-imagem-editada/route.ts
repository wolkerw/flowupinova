import { NextResponse } from "next/server";
import { admin } from "@/lib/firebase-admin";
import crypto from "crypto";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { imageBase64, userId, postId, fileName } = await request.json();

    if (!imageBase64 || !userId || !postId || !fileName) {
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes: imageBase64, userId, postId, fileName" },
        { status: 400 }
      );
    }

    // Extrair o Base64 puro (remover o cabeçalho data:image/jpeg;base64,)
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Salvar no Firebase Storage no mesmo caminho da imagem original
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

    console.log(`[SALVAR_IMAGEM_EDITADA] Imagem editada salva no Storage: ${firebaseDownloadUrl}`);

    // Atualizar URL no Firestore (mediaGallery)
    try {
      const galleryMediaId = `${postId}_concept_${fileName}`;
      await admin
        .firestore()
        .collection("users")
        .doc(userId)
        .collection("mediaGallery")
        .doc(galleryMediaId)
        .set({ url: firebaseDownloadUrl, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (firestoreErr: any) {
      console.warn(
        "[SALVAR_IMAGEM_EDITADA] Falha ao atualizar Firestore (não crítico):",
        firestoreErr.message
      );
    }

    return NextResponse.json({ success: true, imageUrl: firebaseDownloadUrl });
  } catch (error: any) {
    console.error("[SALVAR_IMAGEM_EDITADA_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Erro ao salvar imagem editada.", details: error.message },
      { status: 500 }
    );
  }
}
