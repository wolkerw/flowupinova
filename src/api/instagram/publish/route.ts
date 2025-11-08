
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

  // Loop to check container status before publishing
  let attempts = 0;
  while (attempts < 10) { // Max wait time of ~50 seconds
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

  if (attempts >= 10) {
    throw new Error("Tempo de espera excedido para o processamento da mídia pelo Instagram.");
  }

  const response = await fetch(`${url}?${params.toString()}`, { method: 'POST' });
  const data = await response.json();

  if (!response.ok || !data.id) {
    console.error("[META_API_ERROR] Falha ao publicar o container de mídia:", data.error);
    throw new Error(data.error?.message || "Falha ao publicar a mídia no Instagram.");
  }

  return data.id;
}

export async function POST(request: NextRequest) {
    let debugMessage = "[API] Endpoint hit. ";

    try {
        // Simplificado para usar o método padrão e mais seguro request.json()
        const body: PublishRequestBody = await request.json(); 
        const { postData } = body;
        
        debugMessage += "[API] Validating request... ";
        if (!postData || !postData.metaConnection?.instagramId || !postData.metaConnection?.accessToken || !postData.imageUrl) {
            return NextResponse.json({ success: false, error: "Dados da requisição incompletos. Faltando postData ou detalhes da conexão Meta." }, { status: 400 });
        }
        
        debugMessage += "[API] Publishing to Instagram... ";
        const caption = `${postData.title}\n\n${postData.text}`.slice(0, 2200);
        
        const creationId = await createMediaContainer(
            postData.metaConnection.instagramId,
            postData.metaConnection.accessToken,
            postData.imageUrl,
            caption
        );
        debugMessage += `Container created (id: ${creationId}). `;

        const publishedMediaId = await publishMediaContainer(
            postData.metaConnection.instagramId,
            postData.metaConnection.accessToken,
            creationId
        );
        debugMessage += `Media published (id: ${publishedMediaId}). `;
        
        debugMessage += `[API] Instagram publication finished. Returning success to client.`;
        console.log(debugMessage);

        // A API agora só retorna o ID da mídia publicada. O salvamento no DB é responsabilidade do cliente.
        return NextResponse.json({ success: true, publishedMediaId: publishedMediaId });

    } catch (error: any) {
        const finalErrorMessage = `Error during Instagram publish. Flow: ${debugMessage}. Error Details: ${error.message}`;
        console.error(`[INSTAGRAM_PUBLISH_ERROR]`, finalErrorMessage);
        
        return NextResponse.json({
            success: false,
            error: finalErrorMessage,
        }, { status: 500 });
    }
}
