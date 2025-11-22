
import { NextResponse, type NextRequest } from "next/server";
import { getDueScheduledPosts, updatePostStatus } from "@/lib/services/posts-service-admin";
import type { PostData } from "@/lib/services/posts-service";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  console.log("==============================================");
  console.log("[CRON_V2] RECEBIDO POST DO SCHEDULER");
  console.log(`[CRON_V2] Origin detectado: ${request.nextUrl.origin}`);
  console.log(`[CRON_V2] URL acessada: ${request.nextUrl.href}`);
  console.log("==============================================");

  let processedCount = 0;
  let failedCount = 0;

  try {
    console.log("[CRON_V2] Buscando posts agendados…");
    const duePosts = await getDueScheduledPosts();

    console.log(`[CRON_V2] Posts retornados pelo banco: ${duePosts.length}`);
    if (duePosts.length > 0) {
      console.log("[CRON_V2] Conteúdo dos posts:", JSON.stringify(duePosts, null, 2));
    }

    if (duePosts.length === 0) {
      console.log("[CRON_V2] Nenhum post agendado encontrado. Encerrando.");
      return NextResponse.json({ success: true, message: "Nenhum post para publicar." });
    }

    const publishPromises = duePosts.map(async (post: PostData & { _parentPath?: string }) => {
      console.log("--------------------------------------------------");
      console.log(`[CRON_V2] PROCESSANDO POST: ${post.id}`);
      console.log(`[CRON_V2] PATH DO USUÁRIO: ${post._parentPath}`);
      console.log(`[CRON_V2] Plataformas deste post:`, post.platforms);
      console.log(`[CRON_V2] Dados do MetaConnection:`, post.metaConnection);
      console.log(`[CRON_V2] URL da imagem:`, post.imageUrl);
      console.log("--------------------------------------------------");

      const { id: postId, _parentPath: userPath } = post;
      if (!postId || !userPath) {
        console.error("[CRON_V2] ERRO: Post sem ID ou userPath:", post);
        failedCount++;
        return;
      }

      try {
        console.log(`[CRON_V2] Marcando post ${postId} como 'publishing'…`);
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

          console.log(`[CRON_V2] ===== FETCH PARA ${platform.toUpperCase()} =====`);
          console.log(`[CRON_V2] URL da API interna:`, requestUrl.toString());
          console.log(`[CRON_V2] Payload enviado:`, JSON.stringify(payload, null, 2));

          let response;

          try {
            response = await fetch(requestUrl.toString(), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
          } catch (networkErr: any) {
            console.error(`[CRON_V2] ERRO DE REDE ao chamar ${platform}:`, networkErr.message);
            throw new Error(`Falha de rede ao tentar publicar no ${platform}: ${networkErr.message}`);
          }

          console.log(`[CRON_V2] Código HTTP retornado pela publish API: ${response.status}`);

          let responseText;
          try {
            responseText = await response.text();
          } catch (parseErr: any) {
            console.error(`[CRON_V2] Erro ao ler corpo da resposta de ${platform}:`, parseErr.message);
            throw new Error(`Falha ao ler corpo da resposta da API de ${platform}`);
          }

          console.log(`[CRON_V2] Corpo retornado:`, responseText);

          if (!response.ok) {
            throw new Error(`Falha na API interna de ${platform}: HTTP ${response.status} - ${responseText}`);
          }

          let resultJson;
          try {
            resultJson = JSON.parse(responseText);
          } catch (errJson: any) {
            console.error(`[CRON_V2] ERRO ao parsear JSON da resposta (${platform}):`, errJson.message);
            throw new Error(`Resposta inválida (não-JSON) da API de ${platform}`);
          }

          console.log(`[CRON_V2] JSON final retornado:`, resultJson);

          if (!resultJson.success) {
            throw new Error(`Falha lógica na API de ${platform}: ${resultJson.error}`);
          }

          return resultJson.publishedMediaId;
        });

        const results = await Promise.all(platformPromises);
        
        console.log(`[CRON_V2] Sucesso ao publicar ${postId}. IDs retornados:`, results);

        await updatePostStatus(userPath, postId, { 
          status: "published",
          publishedMediaId: results.filter(Boolean).join(', ')
        });

        processedCount++;

      } catch (publishError: any) {
        console.error(`[CRON_V2] ERRO AO PUBLICAR ${post.id}:`, publishError.message);
        failedCount++;
        await updatePostStatus(userPath, post.id, {
          status: "failed",
          failureReason: publishError.message,
        });
      }
    });

    await Promise.all(publishPromises);

    const summary = `[CRON_V2] Processamento finalizado → Sucesso: ${processedCount}, Falhas: ${failedCount}`;
    console.log(summary);

    return NextResponse.json({ success: true, message: summary });

  } catch (fatalErr: any) {
    console.error("[CRON_V2] ERRO FATAL:", fatalErr.message);
    return NextResponse.json({ success: false, error: fatalErr.message }, { status: 500 });
  }
}
