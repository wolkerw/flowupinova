
import { NextResponse, type NextRequest } from "next/server";
import { getDueScheduledPosts, updatePostStatus } from "@/lib/services/posts-service-admin";
import type { PostData } from "@/lib/services/posts-service";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  console.log("==============================================");
  console.log("[CRON] RECEBIDO POST DO SCHEDULER");
  console.log("[CRON] Origin detectado:", request.nextUrl.origin);
  console.log("[CRON] URL acessada:", request.nextUrl.href);
  console.log("==============================================");

  let processedCount = 0;
  let failedCount = 0;

  try {
    console.log("[CRON] Buscando posts agendados…");
    const duePosts = await getDueScheduledPosts();

    console.log(`[CRON] Posts retornados pelo banco: ${duePosts.length}`);
    console.log("[CRON] Conteúdo dos posts:", JSON.stringify(duePosts, null, 2));

    if (duePosts.length === 0) {
      console.log("[CRON] Nenhum post agendado encontrado. Encerrando.");
      return NextResponse.json({ success: true, message: "Nenhum post para publicar." });
    }

    const publishPromises = duePosts.map(async (post: PostData & { _parentPath?: string }) => {
      console.log("--------------------------------------------------");
      console.log(`[CRON] PROCESSANDO POST: ${post.id}`);
      console.log(`[CRON] PATH DO USUÁRIO: ${post._parentPath}`);
      console.log(`[CRON] Plataformas deste post:`, post.platforms);
      console.log(`[CRON] Dados do MetaConnection:`, post.metaConnection);
      console.log(`[CRON] URL da imagem:`, post.imageUrl);
      console.log("--------------------------------------------------");

      const { id: postId, _parentPath: userPath } = post;
      if (!postId || !userPath) {
        console.error("[CRON] ERRO: Post sem ID ou userPath:", post);
        failedCount++;
        return;
      }

      try {
        console.log(`[CRON] Marcando post ${postId} como 'publishing'…`);
        await updatePostStatus(userPath, postId, { status: "publishing" });

        const platformPromises = post.platforms.map(async (platform) => {
          const apiPath = platform === 'instagram' ? '/api/instagram/publish' : '/api/facebook/publish';
          const requestUrl = new URL(apiPath, request.nextUrl.origin);

          const payload = {
            postData: {
              title: post.title,
              text: post.text,
              imageUrl: post.imageUrl,
              metaConnection: post.metaConnection,
            }
          };

          console.log(`[CRON] ===== FETCH PARA ${platform.toUpperCase()} =====`);
          console.log(`[CRON] URL da API interna:`, requestUrl.toString());
          console.log(`[CRON] Payload enviado:`, JSON.stringify(payload, null, 2));

          let response;

          try {
            response = await fetch(requestUrl.toString(), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
          } catch (networkErr) {
            console.error(`[CRON] ERRO DE REDE ao chamar ${platform}:`, networkErr);
            throw new Error(`NETWORK ERROR (${platform}): ${networkErr}`);
          }

          console.log(`[CRON] Código HTTP retornado pela publish API:`, response.status);

          let responseText;
          try {
            responseText = await response.text();
          } catch (parseErr) {
            console.error(`[CRON] Erro ao ler corpo da resposta de ${platform}:`, parseErr);
            throw new Error(`BODY READ ERROR (${platform})`);
          }

          console.log(`[CRON] Corpo retornado:`, responseText);

          if (!response.ok) {
            throw new Error(`Falha da API interna (${platform}): HTTP ${response.status}: ${responseText}`);
          }

          let resultJson;
          try {
            resultJson = JSON.parse(responseText);
          } catch (errJson) {
            console.error(`[CRON] ERRO ao parsear JSON da resposta (${platform}):`, errJson);
            throw new Error(`INVALID JSON (${platform})`);
          }

          console.log(`[CRON] JSON final retornado:`, resultJson);

          if (!resultJson.success) {
            throw new Error(`Falha lógica da API interna (${platform}): ${resultJson.error}`);
          }

          return resultJson.publishedMediaId;
        });

        const results = await Promise.all(platformPromises);
        
        console.log(`[CRON] Sucesso ao publicar ${postId}. IDs retornados:`, results);

        await updatePostStatus(userPath, postId, { 
          status: "published",
          publishedMediaId: results.filter(Boolean).join(', ')
        });

        processedCount++;

      } catch (publishError: any) {
        console.error(`[CRON] ERRO AO PUBLICAR ${post.id}:`, publishError);
        failedCount++;
        await updatePostStatus(userPath, post.id, {
          status: "failed",
          failureReason: publishError.message,
        });
      }
    });

    await Promise.all(publishPromises);

    const summary = `[CRON] Processamento finalizado → Sucesso: ${processedCount}, Falhas: ${failedCount}`;
    console.log(summary);

    return NextResponse.json({ success: true, message: summary });

  } catch (fatalErr: any) {
    console.error("[CRON] ERRO FATAL:", fatalErr);
    return NextResponse.json({ success: false, error: fatalErr.message }, { status: 500 });
  }
}
