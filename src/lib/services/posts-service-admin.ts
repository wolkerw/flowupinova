
"use server";

import { adminDb } from "@/lib/firebase-admin";
import type { PostData } from "./posts-service";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Busca posts agendados que já passaram da hora de publicação.
 * Esta consulta requer um índice composto no Firestore.
 */
export async function getDueScheduledPosts(): Promise<(PostData & { _parentPath?: string })[]> {
    const now = new Date();
    console.log(`[CRON_V2] Buscando posts agendados com data anterior a: ${now.toISOString()}`);
    
    // Consulta otimizada que requer um índice: (posts, status ASC, scheduledAt ASC)
    // Adicionamos o orderBy('status') para corresponder explicitamente ao índice.
    const postsQuery = adminDb.collectionGroup('posts')
                              .where('status', '==', 'scheduled')
                              .where('scheduledAt', '<=', now)
                              .orderBy('status', 'asc') // Adicionado para espelhar o índice
                              .orderBy('scheduledAt', 'asc');

    try {
        const querySnapshot = await postsQuery.get();
        
        if (querySnapshot.empty) {
            console.log("[CRON_V2] Nenhum post agendado encontrado para o momento.");
            return [];
        }
        
        const postsToProcess: (PostData & { _parentPath?: string })[] = [];
        querySnapshot.docs.forEach(doc => {
            postsToProcess.push({
                ...(doc.data() as PostData),
                id: doc.id,
                _parentPath: doc.ref.parent.parent?.path, // Caminho para o doc do usuário (ex: users/userId)
                scheduledAt: (doc.data().scheduledAt as any).toDate(),
            });
        });
        
        console.log(`[CRON_V2] ${postsToProcess.length} post(s) encontrados e prontos para processar.`);
        return postsToProcess;

    } catch (error: any) {
        console.error("[CRON_V2_ERROR] Erro crítico ao buscar posts agendados:", error);
        // Se o erro for FAILED_PRECONDITION, o log agora será muito claro sobre a necessidade do índice.
        if (error.code === 'failed-precondition') {
             console.error("[CRON_V2_FATAL] A consulta falhou. Mesmo com o índice presente, pode haver uma inconsistência. Verifique a configuração do índice no console do Firebase.");
        }
        throw error;
    }
}


/**
 * Atualiza o status de um post no Firestore.
 * @param userPath O caminho do documento do usuário.
 * @param postId O ID do post a ser atualizado.
 * @param updates Os campos a serem atualizados no documento do post.
 */
export async function updatePostStatus(userPath: string, postId: string, updates: { status: 'publishing' | 'published' | 'failed', failureReason?: string | FieldValue, publishedMediaId?: string | FieldValue, creationId?: string | FieldValue }) {
    if (!userPath || !postId) {
        console.error("[CRON_V2_ERROR] Tentativa de atualizar post sem userPath ou postId.");
        return;
    }
    const postRef = adminDb.doc(`${userPath}/posts/${postId}`);
    await postRef.update(updates);
    console.log(`[CRON_V2] Status do post ${postId} atualizado para: ${updates.status}`);
}
