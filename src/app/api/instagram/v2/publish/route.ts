
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = 'force-dynamic';

interface PublishRequestBody {
  postData: {
      text: string;
      imageUrls: string[];
      isCarousel: boolean;
      accessToken: string;
      instagramId: string;
  };
}

// 1. Create a media container for a single item (image or video)
async function createMediaItemContainer(instagramId: string, accessToken: string, imageUrl: string, isCarouselItem: boolean, caption?: string): Promise<string> {
  const host = "https://graph.instagram.com";
  const url = `${host}/v20.0/${instagramId}/media`;
  
  const params = new URLSearchParams({
    image_url: imageUrl,
    access_token: accessToken,
  });

  if (isCarouselItem) {
    params.append('is_carousel_item', 'true');
  }

  // Caption is only allowed for single media items, not for carousel children.
  if (!isCarouselItem && caption) {
    params.append('caption', caption);
  }

  const response = await fetch(`${url}?${params.toString()}`, { method: 'POST' });
  const data = await response.json();

  if (!response.ok || !data.id) {
    console.error("[INSTAGRAM_V2_API_ERROR] Falha ao criar container de item de mídia:", data.error);
    throw new Error(data.error?.message || "Falha ao criar o container de item de mídia no Instagram.");
  }
  return data.id;
}


// 2. Create the main carousel container
async function createCarouselContainer(instagramId: string, accessToken: string, childrenIds: string[], caption: string): Promise<string> {
    const host = "https://graph.instagram.com";
    const url = `${host}/v20.0/${instagramId}/media`;

    const params = new URLSearchParams({
        media_type: 'CAROUSEL',
        children: childrenIds.join(','),
        caption: caption,
        access_token: accessToken,
    });

    const response = await fetch(`${url}?${params.toString()}`, { method: 'POST' });
    const data = await response.json();

    if (!response.ok || !data.id) {
        console.error("[INSTAGRAM_V2_API_ERROR] Falha ao criar o container do carrossel:", data.error);
        throw new Error(data.error?.message || "Falha ao criar o container do carrossel.");
    }
    return data.id;
}


// 3. Check container status
async function checkContainerStatus(containerId: string, accessToken: string): Promise<void> {
  const host = "https://graph.instagram.com";
  let attempts = 0;
  while (attempts < 12) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const statusUrl = `${host}/v20.0/${containerId}?fields=status_code&access_token=${accessToken}`;
    const statusResponse = await fetch(statusUrl);
    const statusData = await statusResponse.json();
    
    console.log(`[INSTAGRAM_V2_STATUS_CHECK] Attempt ${attempts + 1}: Container ${containerId} status is ${statusData.status_code}`);

    if (statusData.status_code === 'FINISHED') return;
    if (statusData.status_code === 'ERROR') {
      console.error("[INSTAGRAM_V2_API_ERROR] Falha no processamento do container:", statusData);
      throw new Error("O container de mídia falhou ao ser processado.");
    }
    attempts++;
  }
  throw new Error("Tempo de espera excedido para o processamento da mídia.");
}


// 4. Publish the container
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
    console.error("[INSTAGRAM_V2_API_ERROR] Falha ao publicar o container:", data.error);
    throw new Error(data.error?.message || "A API não retornou um ID de mídia publicado.");
  }
  return data.id;
}


export async function POST(request: NextRequest) {
    try {
        const { postData }: PublishRequestBody = await request.json(); 
        
        if (!postData || !postData.instagramId || !postData.accessToken || !postData.imageUrls || postData.imageUrls.length === 0) {
            return NextResponse.json({ success: false, error: "Dados da requisição incompletos." }, { status: 400 });
        }
        
        const caption = postData.text.slice(0, 2200);
        let creationId: string;

        if (postData.isCarousel) {
            // Carousel Flow
            if (postData.imageUrls.length > 10) throw new Error("Carrosséis são limitados a 10 mídias.");
            
            // 1. Create individual item containers without caption
            const childContainerPromises = postData.imageUrls.map(url => 
                createMediaItemContainer(postData.instagramId, postData.accessToken, url, true)
            );
            const childContainerIds = await Promise.all(childContainerPromises);
            
            // 2. Create carousel parent container with caption
            creationId = await createCarouselContainer(postData.instagramId, postData.accessToken, childContainerIds, caption);

        } else {
            // Single Media Flow - create container with caption
            creationId = await createMediaItemContainer(postData.instagramId, postData.accessToken, postData.imageUrls[0], false, caption);
        }

        // 3. Check status of the final container (single or carousel)
        await checkContainerStatus(creationId, postData.accessToken);

        // 4. Publish
        const publishedMediaId = await publishMediaContainer(
            postData.instagramId,
            postData.accessToken,
            creationId
        );
        
        console.log(`[INSTAGRAM_V2_PUBLISH_SUCCESS] Mídia publicada com sucesso. Post ID: ${publishedMediaId}`);
        return NextResponse.json({ success: true, publishedMediaId: publishedMediaId });

    } catch (error: any) {
        const errorMessage = `[INSTAGRAM_V2_PUBLISH_ERROR] Mensagem: ${error.message}.`;
        console.error(errorMessage, { cause: error.cause, stack: error.stack });
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
