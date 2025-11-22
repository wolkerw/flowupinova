
"use server";

import { adminDb } from "@/lib/firebase-admin";
import type { PostData } from "./posts-service";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Busca no Firestore por posts agendados que já passaram da hora de publicação.
 * @returns Uma lista de posts prontos para serem publicados.
 */
export async function getDueScheduledPosts(): Promise<(PostData & { _parentPath?: string })[]> {
    const now = new Date();
    console.log(`[CRON_V2] Buscando posts agendados que deveriam ter sido publicados antes de: ${now.toISOString()}`);
    
    // Consulta para posts agendados
    const scheduledPostsQuery = adminDb.collectionGroup('posts')
        .where('status', '==', 'scheduled')
        .where('scheduledAt', '<=', now);

    // Consulta para posts em estado de "publishing" para retentativa
    const publishingPostsQuery = adminDb.collectionGroup('posts')
        .where('status', '==', 'publishing');

    try {
        const [scheduledSnapshot, publishingSnapshot] = await Promise.all([
            scheduledPostsQuery.get(),
            publishingPostsQuery.get()
        ]);

        const posts: (PostData & { _parentPath?: string })[] = [];
        
        if (scheduledSnapshot.empty) {
            console.log("[CRON_V2] Nenhum post agendado encontrado para publicação.");
        } else {
            console.log(`[CRON_V2] Encontrados ${scheduledSnapshot.docs.length} posts agendados para processar.`);
            scheduledSnapshot.docs.forEach(doc => {
                 posts.push({
                    ...(doc.data() as PostData),
                    id: doc.id,
                    _parentPath: doc.ref.parent.parent?.path,
                    scheduledAt: (doc.data().scheduledAt as any).toDate(),
                });
            });
        }
        
        if (publishingSnapshot.empty) {
            console.log("[CRON_V2] Nenhum post em estado 'publishing' encontrado para retentativa.");
        } else {
             console.log(`[CRON_V2] Encontrados ${publishingSnapshot.docs.length} posts em 'publishing' para retentativa.`);
             publishingSnapshot.docs.forEach(doc => {
                 posts.push({
                    ...(doc.data() as PostData),
                    id: doc.id,
                    _parentPath: doc.ref.parent.parent?.path,
                    scheduledAt: (doc.data().scheduledAt as any).toDate(),
                });
            });
        }
        
        if(posts.length === 0) {
             console.log("[CRON_V2] Nenhum post encontrado para processar nesta execução.");
        }


        return posts;
    } catch (error: any) {
        if (error.code === 'FAILED_PRECONDITION' && error.message.includes('index')) {
            console.error("[CRON_V2_ERROR] Falta um índice composto no Firestore. Crie o índice sugerido no link do log de erro.", error.message);
            throw new Error(`Firestore query failed. A composite index is likely required.`);
        }
        console.error("[CRON_V2_ERROR] Erro ao buscar posts agendados:", error);
        throw error;
    }
}


/**
 * Atualiza o status de um post no Firestore.
 * @param userPath O caminho do documento do usuário (ex: users/USER_ID).
 * @param postId O ID do post a ser atualizado.
 * @param updates O objeto com os campos a serem atualizados.
 */
export async function updatePostStatus(userPath: string, postId: string, updates: { status: 'publishing' | 'published' | 'failed', failureReason?: string | FieldValue, publishedMediaId?: string | FieldValue, creationId?: string | FieldValue }) {
    if (!userPath || !postId) {
        console.error("[CRON_V2_ERROR] Caminho do usuário ou ID do post ausente ao tentar atualizar status.");
        return;
    }
    const postRef = adminDb.doc(`${userPath}/posts/${postId}`);
    await postRef.update(updates);
    console.log(`[CRON_V2] Post ${postId} atualizado. Novo status: ${updates.status}`);
}
