
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = 'force-dynamic';

interface PublishRequestBody {
  postData: {
      title: string;
      text: string;
      imageUrl: string;
      metaConnection: {
          accessToken: string;
          instagramId: string;
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
    console.error("[META_API_ERROR] Falha ao criar o container de mídia:", data.error);
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

  // Loop para verificar o status do container antes de publicar
  let attempts = 0;
  while (attempts < 12) { // Max wait time of ~60 seconds
    const statusResponse = await fetch(`https://graph.facebook.com/v20.0/${creationId}?fields=status_code&access_token=${accessToken}`);
    const statusData = await statusResponse.json();
    
    if (statusData.status_code === 'FINISHED') {
      break;
    }
    
    if (statusData.status_code === 'ERROR') {
      console.error("[META_API_ERROR] Falha no processamento do container de mídia:", statusData);
      throw new Error("O container de mídia falhou ao ser processado pelo Instagram.");
    }
    
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    attempts++;
  }

  if (attempts >= 12) {
    throw new Error("Tempo de espera excedido para o processamento da mídia pelo Instagram.");
  }

  const response = await fetch(`${url}?${params.toString()}`, { method: 'POST' });
  const data = await response.json();

  if (!response.ok || !data.id) {
    console.error("[META_API_ERROR] Falha ao publicar o container de mídia:", data.error);
    throw new Error(data.error?.message || "Media ID is not available");
  }

  return data.id;
}

export async function POST(request: NextRequest) {
    try {
        const { postData }: PublishRequestBody = await request.json(); 
        
        if (!postData || !postData.metaConnection?.instagramId || !postData.metaConnection?.accessToken || !postData.imageUrl) {
            return NextResponse.json({ success: false, error: "Dados da requisição incompletos. Faltando postData ou detalhes da conexão Meta." }, { status: 400 });
        }
        
        const caption = `${postData.title}\n\n${postData.text}`.slice(0, 2200);
        
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
        
        console.log(`[INSTAGRAM_PUBLISH_SUCCESS] Mídia publicada com sucesso no Instagram. Post ID: ${publishedMediaId}`);

        return NextResponse.json({ success: true, publishedMediaId: publishedMediaId });

    } catch (error: any) {
        const errorMessage = `[INSTAGRAM_PUBLISH_ERROR] Mensagem: ${error.message}.`;
        console.error(errorMessage, { cause: error.cause, stack: error.stack });
        
        return NextResponse.json({
            success: false,
            error: error.message,
        }, { status: 500 });
    }
}
