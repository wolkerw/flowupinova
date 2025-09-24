
// src/app/api/instagram/publish/route.ts
import { NextResponse, type NextRequest } from "next/server";

const GRAPH_API_VERSION = "v20.0";
const GRAPH_API_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

async function fetchGraphAPI(url: string, method: "POST" | "GET" = "GET", body?: any) {
    console.log(`[GRAPH_API] Request: ${method} ${url}`);
    if (body) {
        console.log(`[GRAPH_API] Body: ${JSON.stringify(body)}`);
    }

    const response = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    
    const data = await response.json();

    if (data.error) {
        console.error(`[GRAPH_API] Error:`, data.error);
        throw new Error(`Erro na API do Instagram: ${data.error.message} (Code: ${data.error.code}, Type: ${data.error.type})`);
    }
    
    console.log(`[GRAPH_API] Success Response:`, data);
    return data;
}

export async function POST(request: NextRequest) {
  const { igUserId, pageToken, caption, imageUrl } = await request.json();

  if (!igUserId || !pageToken || !caption || !imageUrl) {
    return NextResponse.json({ success: false, error: "Parâmetros faltando. É necessário igUserId, pageToken, caption, e imageUrl." }, { status: 400 });
  }

  try {
    // Etapa 1: Criar o contêiner de mídia
    console.log("[PUBLISH] Etapa 1: Criando contêiner de mídia...");
    const createContainerUrl = `${GRAPH_API_URL}/${igUserId}/media`;
    const containerParams = new URLSearchParams({
        image_url: imageUrl,
        caption: caption,
        access_token: pageToken,
    });
    
    const containerData = await fetchGraphAPI(`${createContainerUrl}?${containerParams.toString()}`, "POST");
    const creationId = containerData.id;

    if (!creationId) {
        throw new Error("Falha ao obter o creation_id na Etapa 1.");
    }
    console.log(`[PUBLISH] Contêiner criado com sucesso. creation_id: ${creationId}`);
    
    // Etapa 2: Publicar o contêiner
    console.log("[PUBLISH] Etapa 2: Publicando o contêiner...");
    const publishUrl = `${GRAPH_API_URL}/${igUserId}/media_publish`;
    const publishParams = new URLSearchParams({
        creation_id: creationId,
        access_token: pageToken,
    });

    const publishData = await fetchGraphAPI(`${publishUrl}?${publishParams.toString()}`, "POST");
    const postId = publishData.id;
    
    if (!postId) {
        throw new Error("Falha ao obter o post_id na Etapa 2.");
    }
    console.log(`[PUBLISH] Post publicado com sucesso! postId: ${postId}`);

    return NextResponse.json({
        success: true,
        message: "Post publicado no Instagram com sucesso!",
        postId: postId,
    });

  } catch (error: any) {
    console.error("[PUBLISH] Erro durante o processo de publicação:", error);

    let errorMessage = error.message || "Ocorreu um erro desconhecido.";
    // Tratar erros específicos da API do Graph
    if (errorMessage.includes("code 190")) {
        errorMessage = "Token de acesso expirado ou inválido. Por favor, reconecte sua conta Meta.";
    } else if (errorMessage.includes("code 200")) {
         errorMessage = "Permissão 'instagram_content_publish' faltando. Por favor, reconecte sua conta e conceda a permissão necessária.";
    }

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
