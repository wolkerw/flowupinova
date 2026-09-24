import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { admin, adminDb } from "@/lib/firebase-admin";
import { getUserStoragePathAdmin } from "@/lib/services/storage-utils-admin";
import crypto from "crypto";

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: "Autenticação obrigatória para remover o fundo da imagem." },
        { status: 401 }
      );
    }

    const { imageUrl, assetId } = await request.json();
    if (!imageUrl) {
      return NextResponse.json(
        { error: "URL da imagem não fornecida." },
        { status: 400 }
      );
    }

    const falKey = process.env.FAL_KEY;
    if (!falKey) {
      return NextResponse.json(
        { error: "Serviço de remoção de fundo temporariamente indisponível." },
        { status: 503 }
      );
    }

    // Chama o endpoint do Bria Background Removal via Fal.ai
    const response = await fetch("https://queue.fal.run/fal-ai/bria/background/remove", {
      method: "POST",
      headers: {
        Authorization: `Key ${falKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image_url: imageUrl }),
    });

    if (!response.ok) {
      const errTxt = await response.text();
      throw new Error(`Falha no provedor Bria: ${errTxt.slice(0, 150)}`);
    }

    const briaData = await response.json();
    const resultUrl = briaData?.image?.url || briaData?.images?.[0]?.url;

    if (!resultUrl) {
      throw new Error("URL da imagem com fundo removido não retornada.");
    }

    // Baixar a imagem resultante e salvar no Storage sob a pasta do usuário
    const imgRes = await fetch(resultUrl);
    const ab = await imgRes.arrayBuffer();
    const buffer = Buffer.from(ab);

    const userId = authUser.uid;
    const userStoragePath = getUserStoragePathAdmin(userId);
    const bucket = admin.storage().bucket();
    const newAssetId = `nobg_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const storageFilePath = `${userStoragePath}/aiImages/image_${newAssetId}.png`;
    const fileRef = bucket.file(storageFilePath);
    const downloadToken = crypto.randomUUID();

    await fileRef.save(buffer, {
      metadata: {
        contentType: "image/png",
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
          userId,
          derivedFromAssetId: assetId || null,
          action: "background_removed",
        },
      },
    });

    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
      storageFilePath
    )}?alt=media&token=${downloadToken}`;

    // Catalogar versão derivada na mediaGallery
    const galleryMediaId = `ai_img_${newAssetId}`;
    await adminDb.doc(`users/${userId}/mediaGallery/${galleryMediaId}`).set({
      id: galleryMediaId,
      url: publicUrl,
      storagePath: storageFilePath,
      source: "ai_image_general_nobg",
      prompt: "Fundo removido",
      caption: "Imagem com fundo removido",
      type: "image",
      derivedFromAssetId: assetId || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      fileName: `image_${newAssetId}.png`,
    });

    return NextResponse.json({
      success: true,
      url: publicUrl,
      derivedAssetId: newAssetId,
    });
  } catch (error: any) {
    console.error("[REMOVER_FUNDO_ERROR]:", error);
    return NextResponse.json(
      { error: "Não foi possível remover o fundo desta imagem no momento." },
      { status: 500 }
    );
  }
}
