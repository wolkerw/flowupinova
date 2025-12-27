
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = 'force-dynamic';

interface PublishRequestBody {
  postData: {
      title: string;
      text: string;
      imageUrl: string;
      accessToken: string;
      instagramId: string;
  };
}

// 1. Criar o container de mídia
async function createMediaContainer(instagramId: string, accessToken: string, imageUrl: string, caption: string): Promise<string> {
  const host = "https://graph.instagram.com";
  const url = `${host}/v20.0/${instagramId}/media`;
  
  const params = new URLSearchParams({
    image_url: imageUrl,
    caption,
    access_token: accessToken,
  });

  const response = await fetch(`${url}?${params.toString()}`, { method: 'POST' });
  const data = await response.json();

  if (!response.ok || !data.id) {
    console.error("[INSTAGRAM_V2_API_ERROR] Falha ao criar o container de mídia:", data.error);
    throw new Error(data.error?.message || "Falha ao criar o container de mídia no Instagram (V2).");
  }

  return data.id;
}

// 2. Verificar o status do container
async function checkContainerStatus(containerId: string, accessToken: string): Promise<void> {
  const host = "https://graph.instagram.com";
  
  let attempts = 0;
  while (attempts < 12) { // Max wait time of ~60 seconds
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    
    const statusUrl = `${host}/v20.0/${containerId}?fields=status_code&access_token=${accessToken}`;
    const statusResponse = await fetch(statusUrl);
    const statusData = await statusResponse.json();
    
    console.log(`[INSTAGRAM_V2_STATUS_CHECK] Attempt ${attempts + 1}: Container ${containerId} status is ${statusData.status_code}`);

    if (statusData.status_code === 'FINISHED') {
      return; // Success, ready to publish
    }
    
    if (statusData.status_code === 'ERROR') {
      console.error("[INSTAGRAM_V2_API_ERROR] Falha no processamento do container de mídia:", statusData);
      throw new Error("O container de mídia falhou ao ser processado pelo Instagram.");
    }
    
    attempts++;
  }

  throw new Error("Tempo de espera excedido para o processamento da mídia pelo Instagram.");
}


// 3. Publicar o container
async function publishMediaContainer(instagramId: string, accessToken: string, creationId: string): Promise<string> {
  const host = "https://graph.instagram.com";
  const url = `${host}/v20.0/${instagramId}/media_publish`;

  const params = new URLSearchParams({
    creation_id: creationId,
    access_token: accessToken,
  });

  const response = await fetch(`${url}?${params.toString()}`, { method: 'POST' });
  const data = await response.json();

  if (!response.ok || !data.id) {
    console.error("[INSTAGRAM_V2_API_ERROR] Falha ao publicar o container de mídia:", data.error);
    throw new Error(data.error?.message || "A API não retornou um ID de mídia publicado após a finalização.");
  }

  return data.id;
}

export async function POST(request: NextRequest) {
    try {
        const { postData }: PublishRequestBody = await request.json(); 
        
        if (!postData || !postData.instagramId || !postData.accessToken || !postData.imageUrl) {
            return NextResponse.json({ success: false, error: "Dados da requisição incompletos. Faltando instagramId, accessToken ou imageUrl." }, { status: 400 });
        }
        
        const caption = `${postData.title}\n\n${postData.text}`.slice(0, 2200);
        
        // Passo 1: Criar o container
        const creationId = await createMediaContainer(
            postData.instagramId,
            postData.accessToken,
            postData.imageUrl,
            caption
        );

        // Passo 2: Verificar o status do container
        await checkContainerStatus(creationId, postData.accessToken);

        // Passo 3: Publicar o container
        const publishedMediaId = await publishMediaContainer(
            postData.instagramId,
            postData.accessToken,
            creationId
        );
        
        console.log(`[INSTAGRAM_V2_PUBLISH_SUCCESS] Mídia publicada com sucesso no Instagram. Post ID: ${publishedMediaId}`);

        return NextResponse.json({ success: true, publishedMediaId: publishedMediaId });

    } catch (error: any) {
        const errorMessage = `[INSTAGRAM_V2_PUBLISH_ERROR] Mensagem: ${error.message}.`;
        console.error(errorMessage, { cause: error.cause, stack: error.stack });
        
        return NextResponse.json({
            success: false,
            error: error.message,
        }, { status: 500 });
    }
}
