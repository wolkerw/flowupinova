
import { NextResponse, type NextRequest } from "next/server";
import { getDueScheduledPosts, updatePostStatus } from "@/lib/services/posts-service-admin";
import type { PostData } from "@/lib/services/posts-service";

export const dynamic = 'force-dynamic'; // Garante que a rota não seja cacheada

/**
 * Esta rota é o coração do agendador (CRON job).
 * Ela busca por posts agendados e os publica nas plataformas corretas.
 */
export async function POST(request: NextRequest) {
  // Para segurança, em produção, você deve verificar um token secreto ou usar autenticação OIDC.
  // Ex: const secret = request.headers.get('Authorization');
  // if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  // }
  
  console.log("[CRON_JOB] Iniciando verificação de posts agendados...");

  let processedCount = 0;
  let failedCount = 0;

  try {
    const duePosts = await getDueScheduledPosts();

    if (duePosts.length === 0) {
      console.log("[CRON_JOB] Nenhum post para publicar.");
      return NextResponse.json({ success: true, message: "Nenhum post para publicar." });
    }

    console.log(`[CRON_JOB] Encontrados ${duePosts.length} posts para processar.`);

    // Processa cada post em paralelo
    const publishPromises = duePosts.map(async (post: PostData & { _parentPath?: string }) => {
      const { id: postId, _parentPath: userPath } = post;

      if (!postId || !userPath) {
        console.error("[CRON_ERROR] Post encontrado sem ID ou caminho do usuário.", post);
        failedCount++;
        return;
      }
      
      try {
        // Marca o post como "publishing" para evitar que seja processado novamente em caso de falha
        await updatePostStatus(userPath, postId, { status: "publishing" });

        const platformPromises = post.platforms.map(async (platform) => {
            const apiPath = platform === 'instagram' ? '/api/instagram/publish' : '/api/facebook/publish';
            // Constrói a URL completa para a API interna. Essencial para o ambiente de servidor.
            const requestUrl = new URL(apiPath, request.nextUrl.origin);

            const payload = {
                postData: {
                    title: post.title,
                    text: post.text,
                    imageUrl: post.imageUrl,
                    metaConnection: post.metaConnection,
                }
            };
            
            console.log(`[CRON_FETCH] Chamando ${requestUrl.toString()} para o post ${postId} com payload:`, JSON.stringify(payload, null, 2));
             
            const response = await fetch(requestUrl.toString(), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                 const errorBody = await response.text();
                 throw new Error(`Falha na API de publicação (${platform}) com status ${response.status}. Resposta: ${errorBody}`);
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(`Falha ao publicar no ${platform}: ${result.error || `Status ${response.status}`}`);
            }
            return result.publishedMediaId;
        });

        const results = await Promise.all(platformPromises);
        
        await updatePostStatus(userPath, postId, { 
            status: "published",
            publishedMediaId: results.filter(Boolean).join(', ') // Salva os IDs das mídias publicadas
        });
        processedCount++;

      } catch (publishError: any) {
        const errorMessage = `[CRON_ERROR] Falha ao publicar o post ${postId}. Mensagem: ${publishError.message}.`;
        console.error(errorMessage, { cause: publishError.cause, stack: publishError.stack });
        failedCount++;
        await updatePostStatus(userPath, postId, {
          status: "failed",
          failureReason: publishError.message,
        });
      }
    });

    await Promise.all(publishPromises);

    const summary = `Processamento finalizado. Publicados: ${processedCount}, Falhas: ${failedCount}.`;
    console.log(`[CRON_JOB] ${summary}`);
    return NextResponse.json({ success: true, message: summary });

  } catch (error: any) {
    console.error("[CRON_JOB_FATAL] Erro fatal durante a execução do CRON:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
