
import { NextResponse, type NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import type { PostData } from "@/lib/services/posts-service";

interface PublishRequestBody {
    userId: string;
    postId: string;
}

// Função para criar o container de mídia no Instagram
async function createMediaContainer(instagramId: string, accessToken: string, imageUrl: string, caption: string): Promise<string> {
    const url = `https://graph.facebook.com/v20.0/${instagramId}/media`;
    const params = new URLSearchParams({
        image_url: imageUrl,
        caption: caption,
        access_token: accessToken,
    });

    const response = await fetch(`${url}?${params.toString()}`, {
        method: 'POST',
    });

    const data = await response.json();

    if (!response.ok || !data.id) {
        console.error("[META_API_ERROR] Failed to create media container:", data.error);
        throw new Error(data.error?.message || "Falha ao criar o container de mídia no Instagram.");
    }
    
    return data.id;
}

// Função para publicar o container de mídia
async function publishMediaContainer(instagramId: string, accessToken: string, creationId: string): Promise<string> {
    const url = `https://graph.facebook.com/v20.0/${instagramId}/media_publish`;
    const params = new URLSearchParams({
        creation_id: creationId,
        access_token: accessToken,
    });
    
    const response = await fetch(`${url}?${params.toString()}`, {
        method: 'POST',
    });

    const data = await response.json();
    
    if (!response.ok || !data.id) {
        console.error("[META_API_ERROR] Failed to publish media container:", data.error);
        throw new Error(data.error?.message || "Falha ao publicar a mídia no Instagram.");
    }
    
    return data.id;
}


export async function POST(request: NextRequest) {
  const { userId, postId } = (await request.json()) as PublishRequestBody;

  if (!userId || !postId) {
    return NextResponse.json({ success: false, error: "userId e postId são obrigatórios." }, { status: 400 });
  }

  const postDocRef = adminDb.collection('users').doc(userId).collection('posts').doc(postId);

  try {
    const docSnap = await postDocRef.get();
    if (!docSnap.exists) {
        throw new Error(`Post com ID ${postId} não encontrado para o usuário ${userId}.`);
    }

    const postData = docSnap.data() as PostData;

    // TODO: Implement image composition logic here.
    // 1. Download postData.imageUrl
    // 2. Download postData.logoUrl (if it exists)
    // 3. Composite logo onto the main image using a library like 'sharp'
    // 4. Upload the new composite image to Firebase Storage
    // 5. Use the new URL for publishing.
    // For now, we will use the original imageUrl.
    const finalImageUrl = postData.imageUrl; 
    const caption = `${postData.title}\n\n${postData.text}`;
    const { instagramId, accessToken } = postData.metaConnection;

    if (!instagramId || !accessToken) {
        throw new Error("Dados de conexão da Meta ausentes no documento do post.");
    }
    
    // Etapa 1: Criar o container de mídia
    const creationId = await createMediaContainer(instagramId, accessToken, finalImageUrl, caption);

    // Etapa 2: Publicar o container
    const publishedMediaId = await publishMediaContainer(instagramId, accessToken, creationId);
    
    // Etapa 3: Atualizar o documento no Firestore com o status 'published'
    await postDocRef.update({
        status: 'published',
        publishedMediaId: publishedMediaId,
        failureReason: admin.firestore.FieldValue.delete(), // Remove previous error if any
    });

    return NextResponse.json({ success: true, publishedMediaId });

  } catch (error: any) {
    console.error(`[INSTAGRAM_PUBLISH_ERROR] User: ${userId}, Post: ${postId}`, error);
    // Atualiza o documento no Firestore com o status 'failed'
    await postDocRef.update({
        status: 'failed',
        failureReason: error.message || "Ocorreu um erro desconhecido ao publicar no Instagram."
    }).catch(updateError => {
        console.error(`[FIRESTORE_UPDATE_ERROR] Could not update post ${postId} to failed status:`, updateError);
    });
    
    return NextResponse.json(
      { success: false, error: error.message || "Ocorreu um erro desconhecido ao publicar no Instagram." },
      { status: 500 }
    );
  }
}

    
