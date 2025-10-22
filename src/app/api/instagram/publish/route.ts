
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

  // Loop to check container status before publishing
  let attempts = 0;
  while (attempts < 10) { // Max wait time of ~50 seconds
    const statusResponse = await fetch(`https://graph.facebook.com/v20.0/${creationId}?fields=status_code&access_token=${accessToken}`);
    const statusData = await statusResponse.json();
    if (statusData.status_code === 'FINISHED') {
      break;
    }
    if (statusData.status_code === 'ERROR') {
      console.error("[META_API_ERROR] Media container processing failed:", statusData);
      throw new Error("O container de mídia falhou ao ser processado pelo Instagram.");
    }
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    attempts++;
  }

  if (attempts >= 10) {
    throw new Error("Tempo de espera excedido para o processamento da mídia pelo Instagram.");
  }

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
    let debugMessage = "";

    try {
        const body: PublishRequestBody = await request.json();
        userId = body.userId;
        const { postData } = body;
        
        debugMessage += `[1] API endpoint hit for user: ${userId}. `;

        // --- Basic Validation ---
        if (!userId || !postData) {
            return NextResponse.json({ success: false, error: "userId e postData são obrigatórios." }, { status: 400 });
        }
        if (!postData.metaConnection?.instagramId || !postData.metaConnection?.accessToken) {
             return NextResponse.json({ success: false, error: "Dados de conexão da Meta ausentes ou incompletos." }, { status: 400 });
        }
         if (!postData.imageUrl) {
            return NextResponse.json({ success: false, error: "A URL da imagem é obrigatória." }, { status: 400 });
        }

        // --- Step 0: Ensure user document exists ---
        const userDocRef = adminDb.collection("users").doc(userId);
        const userDoc = await userDocRef.get();
        if (!userDoc.exists) {
            debugMessage += `[2] User document NOT FOUND for ${userId}. Creating it now... `;
            await userDocRef.set({ createdAt: admin.firestore.FieldValue.serverTimestamp() });
            debugMessage += `[3] User document created. `;
        } else {
             debugMessage += `[2] User document found for ${userId}. `;
        }

        
        // --- Step 1: Publish to Instagram ---
        debugMessage += `[4] Attempting to publish to Instagram... `;
        const caption = `${postData.title}\n\n${postData.text}`.slice(0, 2200);
        
        const creationId = await createMediaContainer(
            postData.metaConnection.instagramId,
            postData.metaConnection.accessToken,
            postData.imageUrl,
            caption
        );
        debugMessage += `[5] Media container created (id: ${creationId}). `;

        const publishedMediaId = await publishMediaContainer(
            postData.metaConnection.instagramId,
            postData.metaConnection.accessToken,
            creationId
        );
        debugMessage += `[6] Media published (id: ${publishedMediaId}). `;

        // --- Step 2: If successful, save to Firestore ---
        debugMessage += `[7] Attempting to save to Firestore... `;
        const postToSave: Omit<PostData, 'id'> = {
            title: postData.title,
            text: postData.text,
            imageUrl: postData.imageUrl,
            platforms: postData.platforms,
            status: 'published',
            scheduledAt: admin.firestore.Timestamp.fromDate(new Date(postData.scheduledAt)),
            metaConnection: {
                accessToken: postData.metaConnection.accessToken,
                pageId: postData.metaConnection.pageId,
                instagramId: postData.metaConnection.instagramId,
                instagramUsername: postData.metaConnection.instagramUsername,
            },
            publishedMediaId: publishedMediaId,
        };

        const postDocRef = await adminDb.collection("users").doc(userId).collection("posts").add(postToSave);
        
        debugMessage += `[8] Successfully saved to Firestore (docId: ${postDocRef.id}). Process complete.`;
        console.log(debugMessage);

        return NextResponse.json({ success: true, publishedMediaId, postId: postDocRef.id });

    } catch (error: any) {
        // If any step fails, we log it and return a detailed error.
        const finalErrorMessage = `Error for user ${userId}. Flow: ${debugMessage}. Error Details: ${error.message}`;
        console.error(`[INSTAGRAM_PUBLISH_ERROR]`, finalErrorMessage);
        
        return NextResponse.json({
            success: false,
            error: finalErrorMessage, // Return the detailed debug message to the client
        }, { status: 500 });
    }
}
