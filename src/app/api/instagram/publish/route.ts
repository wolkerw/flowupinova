// src/app/api/instagram/publish/route.ts
import { NextResponse, type NextRequest } from "next/server";

const GRAPH_API_VERSION = "v20.0";
const GRAPH_API_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

async function publishInstagramPhoto(igUserId: string, pageToken: string, imageUrl: string, caption = '') {
  try {
    // 1) Criar container (apenas 3 campos)
    console.log('[PUBLISH] Etapa 1: Criando contêiner de mídia...');
    const createBody = new URLSearchParams({
      image_url: imageUrl,
      caption,
      access_token: pageToken
    }).toString();

    console.log(`[PUBLISH] Request Body (Create): ${createBody.replace(pageToken, '***')}`);

    const createRes = await fetch(`${GRAPH_API_URL}/${igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: createBody
    });
    const createJson = await createRes.json();

    console.log('[PUBLISH] Response (Create):', createJson);
    if (!createJson.id || createJson.error) {
      throw new Error(`Falha ao criar contêiner: ${JSON.stringify(createJson.error || createJson)}`);
    }

    // 2) Publicar
    console.log(`[PUBLISH] Etapa 2: Publicando o contêiner ${createJson.id}...`);
    const publishBody = new URLSearchParams({
      creation_id: createJson.id,
      access_token: pageToken
    }).toString();
    
    console.log(`[PUBLISH] Request Body (Publish): ${publishBody.replace(pageToken, '***')}`);

    const pubRes = await fetch(`${GRAPH_API_URL}/${igUserId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: publishBody
    });
    const pubJson = await pubRes.json();
    
    console.log('[PUBLISH] Response (Publish):', pubJson);
    if (!pubJson.id || pubJson.error) {
      throw new Error(`Falha ao publicar contêiner: ${JSON.stringify(pubJson.error || pubJson)}`);
    }

    return pubJson.id;

  } catch (error: any) {
    // Re-throw a mais limpa e específica mensagem de erro
    let errorMessage = error.message || "Ocorreu um erro desconhecido na publicação.";
    if (errorMessage.includes("CREATE_FAIL") || errorMessage.includes("PUBLISH_FAIL")) {
       // Apenas usa a mensagem já formatada
    } else if (errorMessage.includes("code 190")) {
        errorMessage = "Token de acesso expirado ou inválido. Por favor, reconecte sua conta Meta.";
    } else if (errorMessage.includes("code 200")) {
         errorMessage = "Permissão 'instagram_content_publish' faltando. Por favor, reconecte sua conta e conceda a permissão necessária.";
    }
    throw new Error(errorMessage);
  }
}


export async function POST(request: NextRequest) {
  try {
    const { igUserId, pageToken, caption, imageUrl } = await request.json();

    if (!igUserId || !pageToken || !caption || !imageUrl) {
      return NextResponse.json({ success: false, error: "Parâmetros faltando. É necessário igUserId, pageToken, caption, e imageUrl." }, { status: 400 });
    }

    const postId = await publishInstagramPhoto(igUserId, pageToken, imageUrl, caption);

    return NextResponse.json({
        success: true,
        message: "Post publicado no Instagram com sucesso!",
        postId: postId,
    });

  } catch (error: any) {
    console.error("[PUBLISH] Erro durante o processo de publicação:", error.message);
    return NextResponse.json({ success: false, error: `Erro na API do Instagram: ${error.message}` }, { status: 500 });
  }
}
