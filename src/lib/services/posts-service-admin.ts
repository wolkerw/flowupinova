
"use server";

import { adminDb } from "@/lib/firebase-admin";
import type { PostData } from "./posts-service";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Busca posts agendados ou em publicação para processamento pelo CRON.
 * Esta versão simplificada busca todos os documentos com status relevante e
 * a verificação da data é feita no código do servidor para evitar a necessidade
 * de um índice composto complexo no Firestore.
 */
export async function getDueScheduledPosts(): Promise<(PostData & { _parentPath?: string })[]> {
    const now = new Date();
    console.log(`[CRON_V2] Buscando posts 'scheduled' ou 'publishing' para verificação. Horário atual: ${now.toISOString()}`);
    
    // Status que indicam que um post precisa ser verificado
    const processingStatus = ['scheduled', 'publishing'];
    const postsQuery = adminDb.collectionGroup('posts').where('status', 'in', processingStatus);

    try {
        const querySnapshot = await postsQuery.get();
        const postsToProcess: (PostData & { _parentPath?: string })[] = [];
        
        if (querySnapshot.empty) {
            console.log("[CRON_V2] Nenhum post com status 'scheduled' ou 'publishing' foi encontrado no banco de dados.");
            return [];
        }
        
        console.log(`[CRON_V2] Verificando ${querySnapshot.docs.length} post(s) com status 'scheduled' ou 'publishing'.`);
        
        // Filtra os posts no lado do servidor para ver se a data de agendamento já passou
        querySnapshot.docs.forEach(doc => {
            const postData = doc.data() as PostData;
            // O Firestore armazena Timestamp, então precisamos convertê-lo para Date
            const scheduledAt = (postData.scheduledAt as any).toDate();

            if (scheduledAt <= now) {
                postsToProcess.push({
                    ...postData,
                    id: doc.id,
                    _parentPath: doc.ref.parent.parent?.path, // Caminho para o documento do usuário (ex: users/userId)
                    scheduledAt: scheduledAt, // Garante que a data já é um objeto Date
                });
            }
        });
        
        console.log(`[CRON_V2] ${postsToProcess.length} post(s) estão com a data de publicação vencida e prontos para processar.`);
        return postsToProcess;

    } catch (error: any) {
        // Com a nova query, o erro FAILED_PRECONDITION não deve mais acontecer.
        // Se acontecer, é um problema diferente.
        console.error("[CRON_V2_ERROR] Erro crítico ao buscar posts agendados:", error);
        throw error; // Lança o erro para ser capturado pela rota da API
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
