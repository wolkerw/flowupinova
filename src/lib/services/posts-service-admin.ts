
"use server";

import { adminDb } from "@/lib/firebase-admin";
import type { PostData } from "./posts-service";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Busca no Firestore por posts agendados que já passaram da hora de publicação.
 * @returns Uma lista de posts prontos para serem publicados.
 */
export async function getDueScheduledPosts(): Promise<PostData[]> {
    const now = new Date();
    console.log(`[CRON] Buscando posts agendados que deveriam ter sido publicados antes de: ${now.toISOString()}`);
    
    const postsQuery = adminDb.collectionGroup('posts')
        .where('status', '==', 'scheduled')
        .where('scheduledAt', '<=', now);

    try {
        const snapshot = await postsQuery.get();
        if (snapshot.empty) {
            console.log("[CRON] Nenhum post agendado encontrado para publicação.");
            return [];
        }

        console.log(`[CRON] Encontrados ${snapshot.docs.length} posts para processar.`);
        
        const posts: PostData[] = snapshot.docs.map(doc => {
            const data = doc.data() as PostData;
            // O timestamp do Firestore precisa ser convertido para um objeto Date do JS
            return {
                ...data,
                id: doc.id,
                // A referência ao documento pai (usuário) é importante para atualizações futuras
                _parentPath: doc.ref.parent.parent?.path,
                // Converte o Timestamp do Firestore para um objeto Date
                scheduledAt: (data.scheduledAt as any).toDate ? (data.scheduledAt as any).toDate() : new Date(data.scheduledAt),
            };
        });

        return posts;
    } catch (error: any) {
        // Um erro comum aqui é a falta de um índice composto no Firestore.
        if (error.code === 'FAILED_PRECONDITION' && error.message.includes('index')) {
            console.error("[CRON_ERROR] Erro de pré-condição do Firestore. Provavelmente falta um índice composto. Verifique o link no log de erro para criar o índice necessário.", error.message);
            // Lança o erro para que o Cloud Scheduler possa registrar a falha na execução.
            throw new Error(`Firestore query failed. A composite index is likely required. Check logs for a creation link.`);
        }
        console.error("[CRON_ERROR] Erro ao buscar posts agendados:", error);
        throw error; // Propaga o erro
    }
}

/**
 * Atualiza o status de um post no Firestore.
 * @param userPath O caminho do documento do usuário (ex: users/USER_ID).
 * @param postId O ID do post a ser atualizado.
 * @param updates O objeto com os campos a serem atualizados.
 */
export async function updatePostStatus(userPath: string, postId: string, updates: { status: 'publishing' | 'published' | 'failed', failureReason?: string | FieldValue, publishedMediaId?: string | FieldValue }) {
    if (!userPath || !postId) {
        console.error("[UPDATE_STATUS_ERROR] Caminho do usuário ou ID do post ausente.");
        return;
    }
    const postRef = adminDb.doc(`${userPath}/posts/${postId}`);
    await postRef.update(updates);
    console.log(`[CRON] Post ${postId} atualizado com status: ${updates.status}`);
}
