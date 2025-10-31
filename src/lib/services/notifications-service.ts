
"use client";

import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, Timestamp, orderBy, limit } from "firebase/firestore";
import type { PostData } from "./posts-service";

export interface Notification {
    id: string;
    postId: string;
    postTitle: string;
    status: 'pending' | 'unread' | 'read' | 'failed';
    message: string;
    createdAt: Timestamp;
}

function getNotificationsCollectionRef(userId: string) {
    return collection(db, `users/${userId}/notifications`);
}

/**
 * Checks for pending notifications that have passed their scheduled time,
 * verifies the post status, and updates the notification accordingly.
 * @param userId The UID of the user.
 */
export async function processPendingNotifications(userId: string): Promise<void> {
    if (!userId) return;

    const notificationsRef = getNotificationsCollectionRef(userId);
    const now = Timestamp.now();
    
    // Query for pending notifications, ordered by their scheduled time.
    // This avoids the composite index requirement by filtering the date on the client-side.
    const q = query(
        notificationsRef, 
        where("status", "==", "pending"),
        orderBy("scheduledAt", "asc")
    );

    try {
        const querySnapshot = await getDocs(q);

        for (const notificationDoc of querySnapshot.docs) {
            const notification = notificationDoc.data();
            
            // Client-side check for the time.
            if (notification.scheduledAt > now) {
                // Since the query is ordered, we can stop once we find a notification scheduled for the future.
                break;
            }

            const postRef = doc(db, `users/${userId}/posts`, notification.postId);
            const postSnap = await getDoc(postRef);

            if (postSnap.exists()) {
                const post = postSnap.data() as PostData;
                let notificationUpdate: { status: 'unread' | 'failed'; message: string; };
                
                if (post.status === 'published') {
                    notificationUpdate = {
                        status: 'unread',
                        message: `Sua publicação "${post.title}" foi publicada com sucesso.`
                    };
                } else if (post.status === 'failed') {
                    notificationUpdate = {
                        status: 'failed',
                        message: `Falha ao publicar "${post.title}". Motivo: ${post.failureReason || 'desconhecido'}`
                    };
                } else {
                    // Post is still 'publishing' or 'scheduled', skip for now
                    continue;
                }
                
                await updateDoc(notificationDoc.ref, notificationUpdate);
                console.log(`Notification ${notificationDoc.id} processed. Status set to ${notificationUpdate.status}.`);

            } else {
                // Post document doesn't exist, something went wrong
                await updateDoc(notificationDoc.ref, {
                    status: 'failed',
                    message: `O post associado (ID: ${notification.postId}) não foi encontrado.`
                });
            }
        }
    } catch (error: any) {
        // This specific error indicates a missing index. We catch it to prevent app crashes.
        if (error.code === 'failed-precondition') {
            console.warn(
              'Firestore query failed. This likely requires a composite index to be created in your Firebase console. The original query was changed to avoid this, but if the error persists, the index is needed. Details:',
              error.message
            );
        } else {
             console.error("Error processing pending notifications:", error);
        }
    }
}

/**
 * Fetches the latest notifications for a user.
 * @param userId The UID of the user.
 * @returns An array of notifications.
 */
export async function getNotifications(userId: string): Promise<Notification[]> {
    if (!userId) return [];

    try {
        const notificationsRef = getNotificationsCollectionRef(userId);
        const q = query(
            notificationsRef, 
            orderBy("createdAt", "desc"),
            limit(20) // Get the 20 most recent notifications
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return [];
    }
}

/**
 * Marks a specific notification as read.
 * @param userId The UID of the user.
 * @param notificationId The ID of the notification to mark as read.
 */
export async function markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
    if (!userId || !notificationId) return;

    try {
        const notificationRef = doc(db, `users/${userId}/notifications`, notificationId);
        await updateDoc(notificationRef, { status: 'read' });
    } catch (error) {
        console.error(`Error marking notification ${notificationId} as read:`, error);
    }
}

/**
 * Marks all unread notifications as read for a user.
 * @param userId The UID of the user.
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
    if (!userId) return;
    
    try {
        const notificationsRef = getNotificationsCollectionRef(userId);
        const q = query(notificationsRef, where("status", "==", "unread"));
        const querySnapshot = await getDocs(q);

        const batch = [];
        for (const doc of querySnapshot.docs) {
            batch.push(updateDoc(doc.ref, { status: "read" }));
        }

        await Promise.all(batch);
        console.log(`Marked ${batch.length} notifications as read for user ${userId}.`);
    } catch (error) {
         console.error(`Error marking all notifications as read for user ${userId}:`, error);
    }
}
