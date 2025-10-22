import { NextResponse, type NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import type { PostData } from "@/lib/services/posts-service";
import * as admin from 'firebase-admin';

interface PublishRequestBody {
  userId: string;
  postId: string;
}

async function createMediaContainer(instagramId: string, accessToken: string, imageUrl: string, caption: string): Promise<string> {
  const url = `https://graph.facebook.com/v20.0/${instagramId}/media`;
  const params = new URLSearchParams({
    image_url: imageUrl,
    caption,
    access_token: accessToken,
  });

  const response = await fetch(`${url}?${params.toString()}`, { method: 'POST' });
  const data = await response.json();

  if (!response.ok || !data.id) {
    console.error("[META_API_ERROR] Failed to create media container:", data.error);
    throw new Error(data.error?.message || "Falha ao criar o container de mídia no Instagram.");
  }

  return data.id;
}

async function publishMediaContainer(instagramId: string, accessToken: string, creationId: string): Promise<string> {
  const url = `https://graph.facebook.com/v20.0/${instagramId}/media_publish`;
  const params = new URLSearchParams({
    creation_id: creationId,
    access_token: accessToken,
  });

  const response = await fetch(`${url}?${params.toString()}`, { method: 'POST' });
  const data = await response.json();

  if (!response.ok || !data.id) {
    console.error("[META_API_ERROR] Failed to publish media container:", data.error);
    throw new Error(data.error?.message || "Falha ao publicar a mídia no Instagram.");
  }

  return data.id;
}

export async function POST(request: NextRequest) {
  console.log("[DEBUG] Chamada recebida em /api/instagram/publish");

  let userId: string | undefined;
  let postId: string | undefined;

  try {
    const body = await request.json();
    userId = body.userId;
    postId = body.postId;

    if (!userId || !postId) {
      console.warn("[VALIDATION] userId ou postId ausente.");
      return NextResponse.json({ success: false, error: "userId e postId são obrigatórios." }, { status: 400 });
    }

    const postDocRef = adminDb.collection("users").doc(userId).collection("posts").doc(postId);

    const docSnap = await postDocRef.get();
    if (!docSnap.exists) {
      throw new Error(`Post com ID ${postId} não encontrado para o usuário ${userId}.`);
    }

    const postData = docSnap.data() as PostData;

    if (!postData?.imageUrl) {
      throw new Error("A URL da imagem final está ausente no documento do post.");
    }

    if (!postData.metaConnection?.instagramId || !postData.metaConnection?.accessToken) {
      throw new Error("Dados de conexão da Meta ausentes ou incompletos.");
    }

    const caption = (postData.text || '').slice(0, 2200);
    const creationId = await createMediaContainer(
      postData.metaConnection.instagramId,
      postData.metaConnection.accessToken,
      postData.imageUrl,
      caption
    );

    const publishedMediaId = await publishMediaContainer(
      postData.metaConnection.instagramId,
      postData.metaConnection.accessToken,
      creationId
    );

    await postDocRef.update({
      status: "published",
      publishedMediaId,
      failureReason: admin.firestore.FieldValue.delete(),
    });

    return NextResponse.json({ success: true, publishedMediaId });

  } catch (error: any) {
    console.error("[INSTAGRAM_PUBLISH_ERROR]", { userId, postId, error });

    // Atualiza o post como 'failed' se possível
    if (userId && postId) {
      try {
        const postRef = adminDb.collection("users").doc(userId).collection("posts").doc(postId);
        const snapshot = await postRef.get();
        if (snapshot.exists) {
          await postRef.update({
            status: "failed",
            failureReason: error.message || "Erro desconhecido na publicação.",
          });
        }
      } catch (updateError) {
        console.error("[FIRESTORE_UPDATE_ERROR] Falha ao atualizar status para 'failed':", updateError);
      }
    }

    return NextResponse.json({
      success: false,
      error: error?.message || "Erro inesperado no servidor.",
    }, { status: 500 });
  }
}
