
import { NextResponse, type NextRequest } from "next/server";

interface PublishRequestBody {
    pageId: string;
    accessToken: string;
    imageUrl: string;
    caption: string;
}

// Função para criar o container de mídia no Instagram
async function createMediaContainer(pageId: string, accessToken: string, imageUrl: string, caption: string): Promise<string> {
    const url = `https://graph.facebook.com/v20.0/${pageId}/media`;
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
async function publishMediaContainer(pageId: string, accessToken: string, creationId: string): Promise<string> {
    const url = `https://graph.facebook.com/v20.0/${pageId}/media_publish`;
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
  try {
    const { pageId, accessToken, imageUrl, caption } = (await request.json()) as PublishRequestBody;

    if (!pageId || !accessToken || !imageUrl || !caption) {
      return NextResponse.json({ success: false, error: "Parâmetros faltando. É necessário pageId, accessToken, imageUrl e caption." }, { status: 400 });
    }

    // Etapa 1: Criar o container de mídia
    const creationId = await createMediaContainer(pageId, accessToken, imageUrl, caption);

    // Etapa 2: Publicar o container
    const publishedMediaId = await publishMediaContainer(pageId, accessToken, creationId);

    return NextResponse.json({ success: true, publishedMediaId });

  } catch (error: any) {
    console.error("[INSTAGRAM_PUBLISH_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Ocorreu um erro desconhecido ao publicar no Instagram." },
      { status: 500 }
    );
  }
}

