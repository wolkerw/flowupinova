
"use server";

import type { NextRequest } from "next/server";
import { getDueScheduledPosts, updatePostStatus } from "@/lib/services/posts-service-admin";
import type { PostData } from "@/lib/services/posts-service";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Tenta publicar um post em uma plataforma específica.
 * @param platform A plataforma (instagram ou facebook).
 * @param post Os dados do post.
 * @param origin A URL de origem da requisição para construir a URL da API interna.
 * @returns O ID da mídia publicada.
 */
async function publishToPlatform(platform: 'instagram' | 'facebook', post: PostData, origin: string): Promise<string> {
    const isInstagram = platform === 'instagram';
    const apiPath = isInstagram ? '/api/instagram/publish' : '/api/facebook/publish';
    
    // A URL de produção da sua aplicação. Substitua se necessário.
    const productionUrl = "https://studio--studio-7502195980-3983c.us-central1.hosted.app";
    const requestUrl = new URL(apiPath, productionUrl);

    let payload: any;
    
    if (isInstagram) {
        payload = {
            postData: {
                title: post.title, // Title is not used but the API expects it.
                text: post.text,
                imageUrl: post.imageUrl,
                metaConnection: {
                    accessToken: post.connections.igUserAccessToken, // Correct mapping
                    instagramId: post.connections.instagramId,
                }
            }
        };
    } else { // Facebook
        payload = {
            postData: {
                text: post.text,
                imageUrl: post.imageUrl,
                metaConnection: {
                    accessToken: post.connections.fbPageAccessToken, // Correct mapping
                    pageId: post.connections.pageId,
                },
            }
        };
    }

    console.log(`[CRON_V2] ===== INICIANDO FETCH PARA ${platform.toUpperCase()} =====`);
    console.log(`[CRON_V2] URL da API interna de publicação:`, requestUrl.toString());
    console.log(`[CRON_V2] Payload que será enviado:`, JSON.stringify(payload, null, 2));

    let response;
    try {
        response = await fetch(requestUrl.toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
    } catch (networkErr: any) {
        console.error(`[CRON_V2] ERRO DE REDE ao tentar chamar a API de ${platform}:`, networkErr.message);
        throw new Error(`Falha de rede ao tentar publicar no ${platform}. Verifique se a API interna está acessível.`);
    }

    const responseText = await response.text();
    console.log(`[CRON_V2] Resposta recebida da API de ${platform}: status ${response.status}, corpo: ${responseText}`);

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
 * @param request A requisição Next.js recebida pela rota da API.
 * @returns Uma contagem de posts processados e com falha.
 */
export async function runCronJob(request: NextRequest) {
    let processedCount = 0;
    let failedCount = 0;

    console.log("[CRON_V2] Serviço de CRON iniciado.");

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
                // Marca o post como "publishing" para evitar reprocessamento em caso de falha no meio
                await updatePostStatus(userPath, postId, { status: "publishing" });
                
                const results = await Promise.all(
                    post.platforms.map(platform => publishToPlatform(platform, post, request.nextUrl.origin))
                );

                await updatePostStatus(userPath, postId, {
                    status: "published",
                    publishedMediaId: results.filter(Boolean).join(', '),
                    failureReason: FieldValue.delete(), // Limpa qualquer razão de falha anterior
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
        throw error; // Lança o erro para a rota da API tratar
    }

    return { processedCount, failedCount };
}
