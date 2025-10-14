
import type { Firestore, Timestamp } from 'firebase-admin/firestore';
import type { PostData } from './posts-service'; // Usamos a mesma interface

// Esta função agora espera a instância do DB do Admin
export async function getDuePosts(adminDb: Firestore): Promise<(PostData & { userId: string, id: string })[]> {
    const now = Timestamp.now();
    const postsToPublish: (PostData & { userId: string, id: string })[] = [];

    try {
        const usersSnapshot = await adminDb.collection('users').get();
        
        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            const postsQuery = adminDb.collection('users').doc(userId).collection('posts')
                .where('status', '==', 'scheduled')
                .where('scheduledAt', '<=', now);
            
            const duePostsSnapshot = await postsQuery.get();
            duePostsSnapshot.forEach(postDoc => {
                postsToPublish.push({
                    userId: userId,
                    id: postDoc.id,
                    ...postDoc.data() as PostData
                });
            });
        }

        return postsToPublish;
    } catch (error) {
        console.error("[CRON_ERROR] Erro ao buscar posts para publicação:", error);
        return [];
    }
}

// Esta função também espera a instância do DB do Admin
export async function updatePostStatus(
    adminDb: Firestore, 
    userId: string, 
    postId: string, 
    status: 'publishing' | 'published' | 'failed', 
    additionalData: { publishedMediaId?: string, failureReason?: string } = {}
): Promise<void> {
    const postRef = adminDb.collection('users').doc(userId).collection('posts').doc(postId);
    await postRef.update({
        status: status,
        ...additionalData
    });
}
