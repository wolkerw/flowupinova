
import { NextResponse, type NextRequest } from "next/server";
import { getDuePosts, updatePostStatus } from "@/lib/services/posts-service";
import { getMetaConnection } from "@/lib/services/meta-service";

const CRON_SECRET = process.env.CRON_SECRET || "flowup-super-secret-cron-key";
const GRAPH_API_VERSION = "v20.0";
const GRAPH_API_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

async function publishInstagramPhoto(igUserId: string, pageToken: string, imageUrl: string, caption = '') {
  console.log(`[CRON_PUBLISH] Iniciando publicação para o usuário IG: ${igUserId}`);
  try {
    const createContainerBody = new URLSearchParams({
      image_url: imageUrl,
      caption,
      access_token: pageToken
    });

    console.log(`[CRON_PUBLISH] Etapa 1: Criando contêiner com image_url: ${imageUrl}`);
    const createRes = await fetch(`${GRAPH_API_URL}/${igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: createContainerBody.toString()
    });

    const createJson = await createRes.json();
    if (!createRes.ok || !createJson.id || createJson.error) {
      console.error(`[CRON_PUBLISH_ERROR] Falha ao criar contêiner. Resposta: ${JSON.stringify(createJson.error || createJson)}`);
      throw new Error(`Falha ao criar contêiner: ${JSON.stringify(createJson.error || createJson)}`);
    }
    
    const creationId = createJson.id;
    let containerStatus = 'IN_PROGRESS';
    let attempts = 0;
    
    console.log(`[CRON_PUBLISH] Contêiner ${creationId} criado. Aguardando finalização do processamento...`);
    
    while (containerStatus === 'IN_PROGRESS' && attempts < 15) { 
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const statusRes = await fetch(`${GRAPH_API_URL}/${creationId}?fields=status_code&access_token=${pageToken}`);
        const statusJson = await statusRes.json();
        
        containerStatus = statusJson.status_code;
        attempts++;
        console.log(`[CRON_PUBLISH] Tentativa ${attempts}: status do container ${creationId} é ${containerStatus}`);
    }

    if (containerStatus !== 'FINISHED') {
        console.error(`[CRON_PUBLISH_ERROR] O container de mídia ${creationId} não ficou pronto a tempo. Status final: ${containerStatus}`);
        throw new Error(`O container de mídia não ficou pronto a tempo. Status final: ${containerStatus}`);
    }

    console.log(`[CRON_PUBLISH] Etapa 2: Publicando o contêiner ${creationId}`);
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
    if (!pubRes.ok || !pubJson.id || pubJson.error) {
      console.error(`[CRON_PUBLISH_ERROR] Falha ao publicar contêiner ${creationId}. Resposta: ${JSON.stringify(pubJson.error || pubJson)}`);
      throw new Error(`Falha ao publicar contêiner: ${JSON.stringify(pubJson.error || pubJson)}`);
    }

    console.log(`[CRON_PUBLISH] Sucesso! Container ${creationId} publicado. Media ID: ${pubJson.id}`);
    return pubJson.id;

  } catch (error: any) {
    let errorMessage = error.message || "Ocorreu um erro desconhecido na publicação.";
    console.error(`[CRON_PUBLISH_FATAL] Erro no processo de publicação no Instagram: ${errorMessage}`);
    throw new Error(errorMessage);
  }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    console.warn("[CRON_AUTH_FAIL] Tentativa de acesso não autorizada.");
    return new Response("Unauthorized", { status: 401 });
  }

  console.log("[CRON_JOB] Job iniciado: Buscando posts agendados...");

  try {
    const metaConnection = await getMetaConnection();
    if (!metaConnection || !metaConnection.isConnected || !metaConnection.pageToken || !metaConnection.instagramAccountId) {
        console.error("[CRON_JOB_ERROR] Erro crítico: A conta da Meta não está conectada ou as credenciais (pageToken, instagramAccountId) estão ausentes.");
        return NextResponse.json({ success: false, error: "A conta da Meta não está conectada ou configurada corretamente." }, { status: 500 });
    }
    
    const duePosts = await getDuePosts();
    if (duePosts.length === 0) {
      console.log("[CRON_JOB] Nenhum post para publicar no momento.");
      return NextResponse.json({ success: true, message: "Nenhum post para publicar." });
    }

    console.log(`[CRON_JOB] Encontrado(s) ${duePosts.length} post(s) para publicar:`, duePosts.map(p => ({ id: p.id, scheduledAt: p.scheduledAt }) ));
    
    let publishedCount = 0;
    let failedCount = 0;

    for (const post of duePosts) {
        console.log(`[CRON_JOB] Processando post ID: ${post.id}`);
        try {
            if (post.platforms.includes("instagram")) {
                console.log(`[CRON_JOB] Post ${post.id} será publicado no Instagram.`);
                const fullCaption = `${post.title}\\n\\n${post.text}`;
                if (!post.imageUrl) {
                    throw new Error(`Publicação no Instagram (post ${post.id}) requer uma imagem (imageUrl).`);
                }
                
                await publishInstagramPhoto(metaConnection.instagramAccountId, metaConnection.pageToken, post.imageUrl, fullCaption);
            }
            // Adicionar lógica para outras plataformas aqui (ex: Facebook)

            await updatePostStatus(post.id, "published");
            publishedCount++;
            console.log(`[CRON_JOB] Post ID: ${post.id} publicado e status atualizado com sucesso.`);

        } catch (error: any) {
            failedCount++;
            console.error(`[CRON_JOB_ERROR] Falha ao publicar o post ID: ${post.id}. Erro: ${error.message}`);
            await updatePostStatus(post.id, "failed");
        }
    }

    const summary = `Job finalizado. Publicados: ${publishedCount}, Falhas: ${failedCount}.`;
    console.log(`[CRON_JOB] ${summary}`);
    return NextResponse.json({ success: true, message: summary });

  } catch (error: any) {
    console.error("[CRON_JOB_FATAL] Erro crítico durante a execução do job:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
