
"use server";

import { adminDb } from "@/lib/firebase-admin";
import type { PostData } from "./posts-service";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Busca no Firestore por posts que estão em um estado que requer processamento (scheduled ou publishing).
 * @returns Uma lista de posts prontos para serem processados.
 */
export async function getDueScheduledPosts(): Promise<(PostData & { _parentPath?: string })[]> {
    const now = new Date();
    console.log(`[CRON_V2] Buscando posts 'scheduled' ou 'publishing' que deveriam ter sido publicados antes de: ${now.toISOString()}`);
    
    // Consulta simplificada para evitar a necessidade de um índice composto.
    // Buscamos todos os posts que não estão em estado final ('published', 'failed').
    const processingStatus = ['scheduled', 'publishing'];
    const postsQuery = adminDb.collectionGroup('posts')
        .where('status', 'in', processingStatus);

    try {
        const querySnapshot = await postsQuery.get();
        const postsToProcess: (PostData & { _parentPath?: string })[] = [];
        
        if (querySnapshot.empty) {
            console.log("[CRON_V2] Nenhum post com status 'scheduled' ou 'publishing' encontrado.");
            return [];
        }
        
        console.log(`[CRON_V2] Encontrados ${querySnapshot.docs.length} posts com status 'scheduled' ou 'publishing'.`);
        
        querySnapshot.docs.forEach(doc => {
            const postData = doc.data() as PostData;
            const scheduledAt = (postData.scheduledAt as any).toDate();

            // Filtramos a data aqui, no código, em vez de na query do Firestore.
            if (scheduledAt <= now) {
                postsToProcess.push({
                    ...postData,
                    id: doc.id,
                    _parentPath: doc.ref.parent.parent?.path,
                    scheduledAt: scheduledAt,
                });
            }
        });
        
        console.log(`[CRON_V2] ${postsToProcess.length} posts estão realmente prontos para serem processados.`);
        return postsToProcess;

    } catch (error: any) {
        // Este erro é menos provável agora, mas mantemos o log por segurança.
        if (error.code === 'FAILED_PRECONDITION') {
            console.error("[CRON_V2_ERROR] Mesmo com a query simplificada, um erro de índice ocorreu. Verifique as regras do Firestore.", error.message);
        } else {
            console.error("[CRON_V2_ERROR] Erro ao buscar posts para o CRON:", error);
        }
        // Lançar o erro força a falha do job e o log de erro fatal na rota principal.
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
