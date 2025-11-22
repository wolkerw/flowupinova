
"use server";

import type { NextRequest } from "next/server";
import { getDueScheduledPosts, updatePostStatus } from "@/lib/services/posts-service-admin";
import type { PostData } from "@/lib/services/posts-service";
import { FieldValue } from "firebase-admin/firestore";

async function publishToPlatform(platform: 'instagram' | 'facebook', post: PostData, origin: string): Promise<string> {
    const apiPath = platform === 'instagram' ? '/api/instagram/publish' : '/api/facebook/publish';
    const requestUrl = new URL(apiPath, origin);

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

    const responseText = await response.text();
    console.log(`[CRON_V2] Resposta da API (${platform}): status ${response.status}, corpo: ${responseText}`);

    if (!response.ok) {
        throw new Error(`Falha na API interna de ${platform}: HTTP ${response.status} - ${responseText}`);
    }

    try {
        const resultJson = JSON.parse(responseText);
        if (!resultJson.success) {
            throw new Error(`Falha lógica na API de ${platform}: ${resultJson.error}`);
        }
        return resultJson.publishedMediaId;
    } catch (e: any) {
        throw new Error(`Resposta inválida (não-JSON) da API de ${platform}`);
    }
}


export async function runCronJob(request: NextRequest) {
    let processedCount = 0;
    let failedCount = 0;

    console.log("[CRON_V2] Serviço de CRON iniciado.");
    console.log("[CRON_V2] Origin detectado:", request.nextUrl.origin);

    try {
        const duePosts = await getDueScheduledPosts();

        if (duePosts.length === 0) {
            console.log("[CRON_V2] Nenhum post encontrado para processar.");
            return { processedCount, failedCount };
        }

        const publishPromises = duePosts.map(async (post) => {
            const { id: postId, _parentPath: userPath } = post;

            if (!postId || !userPath) {
                console.error("[CRON_V2] ERRO: Post sem ID ou userPath, pulando:", post);
                failedCount++;
                return;
            }

            console.log("--------------------------------------------------");
            console.log(`[CRON_V2] PROCESSANDO POST: ${postId}`);
            console.log(`[CRON_V2] Status atual: ${post.status}`);

            try {
                if (post.status === 'scheduled') {
                    await updatePostStatus(userPath, postId, { status: "publishing" });
                }
                
                const results = await Promise.all(
                    post.platforms.map(platform => publishToPlatform(platform, post, request.nextUrl.origin))
                );

                await updatePostStatus(userPath, postId, {
                    status: "published",
                    publishedMediaId: results.filter(Boolean).join(', '),
                    failureReason: FieldValue.delete(), // Limpa erros anteriores
                });

                processedCount++;
                console.log(`[CRON_V2] Sucesso ao publicar ${postId}. IDs:`, results);

            } catch (publishError: any) {
                failedCount++;
                console.error(`[CRON_V2] ERRO AO PUBLICAR ${postId}:`, publishError.message);
                await updatePostStatus(userPath, postId, {
                    status: "failed",
                    failureReason: publishError.message,
                });
            }
        });

        await Promise.all(publishPromises);

    } catch (error: any) {
        console.error("[CRON_V2] Erro fatal no serviço de CRON:", error);
        // Lança o erro para que a rota principal possa capturá-lo e retornar uma resposta 500.
        throw error;
    }

    return { processedCount, failedCount };
}
