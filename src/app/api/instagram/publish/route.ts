
import { NextResponse, type NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import type { PostData } from "@/lib/services/posts-service";
import * as admin from 'firebase-admin';

export const dynamic = 'force-dynamic';

interface PublishRequestBody {
  userId: string;
  postData: {
      title: string;
      text: string;
      imageUrl: string;
      platforms: string[];
      scheduledAt: string; // ISO string
      metaConnection: {
          accessToken: string;
          pageId: string;
          instagramId: string;
          instagramUsername?: string;
      };
  };
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
    let userId: string | undefined;
    let postId: string | undefined;

    try {
        const body: PublishRequestBody = await request.json();
        userId = body.userId;
        const { postData } = body;

        if (!userId || !postData) {
            return NextResponse.json({ success: false, error: "userId e postData são obrigatórios." }, { status: 400 });
        }
        if (!postData.metaConnection?.instagramId || !postData.metaConnection?.accessToken) {
             return NextResponse.json({ success: false, error: "Dados de conexão da Meta ausentes ou incompletos." }, { status: 400 });
        }
         if (!postData.imageUrl) {
            return NextResponse.json({ success: false, error: "A URL da imagem é obrigatória." }, { status: 400 });
        }
        
        // 1. Criar o documento do post no Firestore primeiro
        const postToSave = {
            ...postData,
            scheduledAt: admin.firestore.Timestamp.fromDate(new Date(postData.scheduledAt)),
            status: 'publishing' as const, // Start as publishing
        };
        const postDocRef = await adminDb.collection("users").doc(userId).collection("posts").add(postToSave);
        postId = postDocRef.id;

        // 2. Tentar publicar no Instagram
        const caption = `${postData.title}\n\n${postData.text}`.slice(0, 2200);
        
        const creationId = await createMediaContainer(
            postData.metaConnection.instagramId,
            postData.metaConnection.accessToken,
            postData.imageUrl,
            caption
        );

        // A API da Meta pode demorar um pouco para processar o container.
        // Adicionamos um pequeno delay antes de tentar publicar.
        await new Promise(resolve => setTimeout(resolve, 5000));

        const publishedMediaId = await publishMediaContainer(
            postData.metaConnection.instagramId,
            postData.metaConnection.accessToken,
            creationId
        );

        // 3. Se a publicação for bem-sucedida, atualizar o documento
        await postDocRef.update({
            status: "published",
            publishedMediaId,
            failureReason: admin.firestore.FieldValue.delete(),
        });

        return NextResponse.json({ success: true, publishedMediaId, postId });

    } catch (error: any) {
        console.error("[INSTAGRAM_PUBLISH_ERROR]", { userId, postId, error: error.message });

        // Se um postId foi criado, atualiza o status para 'failed'
        if (userId && postId) {
            try {
                const postRef = adminDb.collection("users").doc(userId).collection("posts").doc(postId);
                await postRef.update({
                    status: "failed",
                    failureReason: error.message || "Erro desconhecido na publicação.",
                });
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
