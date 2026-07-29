"use server";

import type { NextRequest } from "next/server";
import { getDueScheduledPosts, updatePostStatus } from "@/lib/services/posts-service-admin";
import type { PostData } from "@/lib/services/posts-service";
import { FieldValue } from "firebase-admin/firestore";
import {
  publishToFacebook,
  publishToInstagram,
  publishToGoogle,
  publishToLinkedIn,
} from "@/lib/services/publisher-service";

/**
 * Tenta publicar um post em uma plataforma específica.
 */
async function publishToPlatform(
  platform: "instagram" | "facebook" | "google" | "linkedin" | "tiktok",
  post: PostData & { _parentPath?: string }
): Promise<string> {
  const isInstagram = platform === "instagram";
  const isFacebook = platform === "facebook";
  const isGoogle = platform === "google";

  if (!post?.text) throw new Error(`Post sem texto (post.id=${post.id}).`);
  if (!post?.imageUrls || post.imageUrls.length === 0)
    throw new Error(`Post sem imageUrls (post.id=${post.id}).`);

  if (isInstagram) {
    const accessToken = post.connections.igUserAccessToken;
    const instagramId = post.connections.instagramId;

    if (!accessToken || !instagramId) {
      throw new Error(`Conexão do Instagram incompleta para o post ${post.id}.`);
    }

    return publishToInstagram(
      instagramId,
      accessToken,
      post.imageUrls,
      post.isCarousel,
      post.text,
      post.collaborators,
      post.userTags
    );
  } else if (isFacebook) {
    const accessToken = post.connections.fbPageAccessToken;
    const pageId = post.connections.pageId;

    if (!accessToken || !pageId) {
      throw new Error(`Conexão do Facebook incompleta para o post ${post.id}.`);
    }

    if (post.isCarousel) {
      console.warn(
        `[CRON_V2_WARN] Publicação em carrossel para Facebook não é suportada diretamente. Publicando a primeira imagem do post ${post.id}.`
      );
    }

    const caption = post.text.slice(0, 2200);
    return publishToFacebook(pageId, accessToken, post.imageUrls[0], caption);
  } else if (isGoogle) {
    const userId = post._parentPath ? post._parentPath.split("/")[1] : "";
    if (!userId) {
      throw new Error(`Impossível identificar o proprietário do post (post.id=${post.id}).`);
    }

    const imageUrl = post.imageUrls && post.imageUrls.length > 0 ? post.imageUrls[0] : undefined;
    return publishToGoogle(userId, post.text, imageUrl);
  } else {
    // LinkedIn
    const userId = post._parentPath ? post._parentPath.split("/")[1] : "";
    if (!userId) {
      throw new Error(`Impossível identificar o proprietário do post (post.id=${post.id}).`);
    }

    const imageUrl = post.imageUrls && post.imageUrls.length > 0 ? post.imageUrls[0] : undefined;
    return publishToLinkedIn(userId, post.text, imageUrl);
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
        console.error(
          "[CRON_V2] ERRO CRÍTICO: Post encontrado sem ID ou caminho do usuário, pulando:",
          post
        );
        failedCount++;
        return;
      }

      console.log("--------------------------------------------------");
      console.log(`[CRON_V2] PROCESSANDO POST ID: ${postId}`);

      try {
        await updatePostStatus(userPath, postId, { status: "publishing" });

        const results = await Promise.all(
          post.platforms.map((platform) => publishToPlatform(platform, post))
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
    console.error(
      "[CRON_V2] Erro fatal e inesperado durante a execução do serviço de CRON:",
      error
    );
    throw error;
  }

  return { processedCount, failedCount };
}
