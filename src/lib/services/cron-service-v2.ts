
"use server";

import type { NextRequest } from "next/server";
import { getDueScheduledPosts, updatePostStatus } from "@/lib/services/posts-service-admin";
import type { PostData } from "@/lib/services/posts-service";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Tenta publicar um post em uma plataforma específica.
 */
async function publishToPlatform(
  platform: "instagram" | "facebook",
  post: PostData,
  origin: string
): Promise<string> {
  const isInstagram = platform === "instagram";

  // Use SEMPRE o domínio atual da requisição do cron (evita bater em deploy antigo)
  const baseUrl =
    origin ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://studio--studio-7502195980-3983c.us-central1.hosted.app";
    
  const apiPath = isInstagram ? "/api/instagram/publish" : "/api/facebook/publish";
  const requestUrl = new URL(apiPath, baseUrl);
  
  if (!post?.text) throw new Error(`Post sem texto (post.id=${post.id}).`);
  if (!post?.imageUrl) throw new Error(`Post sem imageUrl (post.id=${post.id}).`);

  let payload: any;
  
  if (isInstagram) {
    const accessToken = post.connections.igUserAccessToken;
    const instagramId = post.connections.instagramId;

    if (!accessToken || !instagramId) {
      throw new Error(`Conexão do Instagram incompleta para o post ${post.id}.`);
    }
    
    payload = {
      postData: {
        text: post.text,
        imageUrl: post.imageUrl,
        metaConnection: {
          accessToken,
          instagramId,
        }
      }
    };
  } else { // Facebook
    const accessToken = post.connections.fbPageAccessToken;
    const pageId = post.connections.pageId;

    if (!accessToken || !pageId) {
      throw new Error(`Conexão do Facebook incompleta para o post ${post.id}.`);
    }

    payload = {
      postData: {
        text: post.text,
        imageUrl: post.imageUrl,
        metaConnection: {
          accessToken,
          pageId,
        },
      },
    };
  }

  console.log(`[CRON_V2] Iniciando fetch para ${platform.toUpperCase()} em ${requestUrl.toString()}`);

  let response: Response;
  try {
    response = await fetch(requestUrl.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (networkErr: any) {
    console.error(`[CRON_V2] ERRO DE REDE ao chamar a API de ${platform}:`, networkErr?.message);
    throw new Error(`Falha de rede ao tentar publicar no ${platform}. Verifique se a API interna está acessível.`);
  }

  const responseText = await response.text();
  console.log(`[CRON_V2] Resposta da API de ${platform}: status ${response.status}, corpo: ${responseText}`);

  if (!response.ok) {
    throw new Error(`A API de publicação de ${platform} retornou um erro: HTTP ${response.status} - ${responseText}`);
  }

  try {
    const resultJson = JSON.parse(responseText);
    if (!resultJson.success) {
      throw new Error(`A API de ${platform} retornou uma falha lógica: ${resultJson.error}`);
    }
    return resultJson.publishedMediaId;
  } catch (e: any) {
    throw new Error(`A resposta da API de ${platform} não era um JSON válido.`);
  }
}

/**
 * Executa a lógica principal do CRON Job.
 */
export async function runCronJob(request: NextRequest) {
  let processedCount = 0;
  let failedCount = 0;

  console.log("[CRON_V2] Serviço de CRON v2 iniciado.");

  try {
    const duePosts = await getDueScheduledPosts();

    if (duePosts.length === 0) {
      console.log("[CRON_V2] Nenhum post agendado para o momento. Encerrando execução.");
      return { processedCount, failedCount };
    }

    const publishPromises = duePosts.map(async (post) => {
      const { id: postId, _parentPath: userPath } = post;

      if (!postId || !userPath) {
        console.error("[CRON_V2] ERRO CRÍTICO: Post encontrado sem ID ou caminho do usuário, pulando:", post);
        failedCount++;
        return;
      }

      console.log("--------------------------------------------------");
      console.log(`[CRON_V2] PROCESSANDO POST ID: ${postId}`);

      try {
        await updatePostStatus(userPath, postId, { status: "publishing" });

        const results = await Promise.all(
          post.platforms.map((platform) => publishToPlatform(platform, post, request.nextUrl.origin))
        );

        await updatePostStatus(userPath, postId, {
          status: "published",
          publishedMediaId: results.filter(Boolean).join(", "),
          failureReason: FieldValue.delete(),
        });

        processedCount++;
        console.log(`[CRON_V2] SUCESSO: Post ${postId} publicado. IDs:`, results);
      } catch (publishError: any) {
        failedCount++;
        console.error(`[CRON_V2] FALHA AO PUBLICAR o post ${postId}:`, publishError.message);
        await updatePostStatus(userPath, postId, {
          status: "failed",
          failureReason: publishError.message,
        });
      }
    });

    await Promise.all(publishPromises);
  } catch (error: any) {
    console.error("[CRON_V2] Erro fatal e inesperado durante a execução do serviço de CRON:", error);
    throw error;
  }

  return { processedCount, failedCount };
}
