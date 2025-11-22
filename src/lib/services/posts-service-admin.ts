
"use server";

import { adminDb } from "@/lib/firebase-admin";
import type { PostData } from "./posts-service";
import { FieldValue } from "firebase-admin/firestore";

export async function getDueScheduledPosts(): Promise<(PostData & { _parentPath?: string })[]> {
    const now = new Date();
    console.log(`[CRON_V2] Buscando posts 'scheduled' ou 'publishing' que deveriam ter sido publicados antes de: ${now.toISOString()}`);
    
    const processingStatus = ['scheduled', 'publishing'];
    const postsQuery = adminDb.collectionGroup('posts').where('status', 'in', processingStatus);

    try {
        const querySnapshot = await postsQuery.get();
        const postsToProcess: (PostData & { _parentPath?: string })[] = [];
        
        if (querySnapshot.empty) {
            console.log("[CRON_V2] Nenhum post com status 'scheduled' ou 'publishing' encontrado.");
            return [];
        }
        
        console.log(`[CRON_V2] Encontrados ${querySnapshot.docs.length} posts com status 'scheduled' ou 'publishing' para verificação.`);
        
        querySnapshot.docs.forEach(doc => {
            const postData = doc.data() as PostData;
            const scheduledAt = (postData.scheduledAt as any).toDate();

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
        if (error.code === 'FAILED_PRECONDITION') {
            console.error("[CRON_V2_ERROR] Consulta falhou. Verifique as regras do Firestore e a existência de índices, embora a consulta tenha sido simplificada para evitá-los.", error.message);
        } else {
            console.error("[CRON_V2_ERROR] Erro ao buscar posts para o CRON:", error);
        }
        throw error;
    }
}


export async function updatePostStatus(userPath: string, postId: string, updates: { status: 'publishing' | 'published' | 'failed', failureReason?: string | FieldValue, publishedMediaId?: string | FieldValue, creationId?: string | FieldValue }) {
    if (!userPath || !postId) {
        console.error("[CRON_V2_ERROR] Caminho do usuário ou ID do post ausente ao tentar atualizar status.");
        return;
    }
    const postRef = adminDb.doc(`${userPath}/posts/${postId}`);
    await postRef.update(updates);
    console.log(`[CRON_V2] Post ${postId} atualizado. Novo status: ${updates.status}`);
}
