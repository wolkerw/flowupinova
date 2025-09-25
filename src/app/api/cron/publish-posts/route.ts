
import { NextResponse, type NextRequest } from "next/server";
import { getDuePosts, updatePostStatus } from "@/lib/services/posts-service";
import { getMetaConnection } from "@/lib/services/meta-service";

const CRON_SECRET = process.env.CRON_SECRET || "flowup-super-secret-cron-key";
const GRAPH_API_VERSION = "v20.0";
const GRAPH_API_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

async function publishInstagramPhoto(igUserId: string, pageToken: string, imageUrl: string, caption = '') {
  try {
    const createContainerBody = new URLSearchParams({
      image_url: imageUrl,
      caption,
      access_token: pageToken
    });

    const createRes = await fetch(`${GRAPH_API_URL}/${igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: createContainerBody.toString()
    });

    const createJson = await createRes.json();
    if (!createJson.id || createJson.error) {
      throw new Error(`Falha ao criar contêiner: ${JSON.stringify(createJson.error || createJson)}`);
    }
    
    const creationId = createJson.id;
    let containerStatus = 'IN_PROGRESS';
    let attempts = 0;
    
    console.log(`[CRON] Container ${creationId} criado. Aguardando finalização...`);
    
    // Esta é a etapa crucial que estava faltando: aguardar o contêiner ficar pronto.
    while (containerStatus === 'IN_PROGRESS' && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        const statusRes = await fetch(`${GRAPH_API_URL}/${creationId}?fields=status_code&access_token=${pageToken}`);
        const statusJson = await statusRes.json();
        containerStatus = statusJson.status_code;
        attempts++;
        console.log(`[CRON] Tentativa ${attempts}: status do container ${creationId} é ${containerStatus}`);
    }

    if (containerStatus !== 'FINISHED') {
        throw new Error(`O container de mídia não ficou pronto a tempo. Status final: ${containerStatus}`);
    }

    const publishBody = new URLSearchParams({
      creation_id: creationId,
      access_token: pageToken
    });

    const pubRes = await fetch(`${GRAPH_API_URL}/${igUserId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: publishBody.toString()
    });
    
    const pubJson = await pubRes.json();
    if (!pubJson.id || pubJson.error) {
      throw new Error(`Falha ao publicar contêiner: ${JSON.stringify(pubJson.error || pubJson)}`);
    }

    console.log(`[CRON] Container ${creationId} publicado com sucesso. Media ID: ${pubJson.id}`);
    return pubJson.id;

  } catch (error: any) {
    let errorMessage = error.message || "Ocorreu um erro desconhecido na publicação.";
    console.error(`[CRON_PUBLISH_ERROR] Erro ao publicar no Instagram: ${errorMessage}`);
    throw new Error(errorMessage);
  }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  console.log("[CRON] Job iniciado: Buscando posts agendados...");

  try {
    const metaConnection = await getMetaConnection();
    if (!metaConnection || !metaConnection.isConnected || !metaConnection.pageToken || !metaConnection.instagramAccountId) {
        console.error("[CRON] Erro crítico: A conta da Meta não está conectada ou as credenciais (pageToken, instagramAccountId) estão ausentes.");
        return NextResponse.json({ success: false, error: "A conta da Meta não está conectada ou configurada corretamente." }, { status: 500 });
    }
    
    const duePosts = await getDuePosts();
    if (duePosts.length === 0) {
      console.log("[CRON] Nenhum post para publicar no momento.");
      return NextResponse.json({ success: true, message: "Nenhum post para publicar." });
    }

    console.log(`[CRON] Encontrado(s) ${duePosts.length} post(s) para publicar:`, duePosts.map(p => p.id));
    
    let publishedCount = 0;
    let failedCount = 0;

    for (const post of duePosts) {
        console.log(`[CRON] Processando post ID: ${post.id}`);
        try {
            if (post.platforms.includes("instagram")) {
                const fullCaption = `${post.title}\n\n${post.text}`;
                if (!post.imageUrl) {
                    throw new Error("Publicação no Instagram requer uma imagem (imageUrl).");
                }
                
                await publishInstagramPhoto(metaConnection.instagramAccountId, metaConnection.pageToken, post.imageUrl, fullCaption);
            }
            // Adicionar lógica para outras plataformas aqui (ex: Facebook)

            await updatePostStatus(post.id, "published");
            publishedCount++;
            console.log(`[CRON] Post ID: ${post.id} publicado com sucesso.`);

        } catch (error: any) {
            failedCount++;
            console.error(`[CRON] Falha ao publicar o post ID: ${post.id}. Erro: ${error.message}`);
            await updatePostStatus(post.id, "failed");
        }
    }

    const summary = `Job finalizado. Publicados: ${publishedCount}, Falhas: ${failedCount}.`;
    console.log(`[CRON] ${summary}`);
    return NextResponse.json({ success: true, message: summary });

  } catch (error: any) {
    console.error("[CRON] Erro crítico durante a execução do job:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
