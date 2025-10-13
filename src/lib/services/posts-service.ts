"use client";

import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs, addDoc, doc, updateDoc, where, Timestamp } from "firebase/firestore";

// Interface for data stored in Firestore
export interface PostData {
    id?: string;
    title: string;
    text: string;
    imageUrl: string | null;
    platforms: string[];
    status: 'scheduled' | 'published' | 'failed';
    scheduledAt: Timestamp; // Using client SDK Timestamp
}

// Interface for data coming from the client
export type PostDataInput = Omit<PostData, 'id' | 'status' | 'scheduledAt'> & {
    scheduledAt: Date;
};

// Interface for data being sent to the client
export type PostDataOutput = Omit<PostData, 'scheduledAt'> & {
    id: string; // Ensure ID is always present on output
    scheduledAt: string; // Client receives an ISO string for serialization
};

// Helper to get the collection reference for a specific user
function getPostsCollectionRef(userId: string) {
    return collection(db, "users", userId, "posts");
}


/**
 * Schedules a new post for a specific user.
 * @param userId The UID of the user.
 * @param postData The data for the post to be scheduled.
 * @returns The full post data including the new ID and status.
 */
export async function schedulePost(userId: string, postData: PostDataInput): Promise<PostDataOutput> {
    if (!userId) {
        throw new Error("User ID is required to schedule a post.");
    }
    try {
        const postsCollectionRef = getPostsCollectionRef(userId);
        // Data being saved to Firestore. Convert JS Date to Firestore Timestamp.
        const postToSave: Omit<PostData, 'id'> = {
            ...postData,
            status: 'scheduled' as const,
            scheduledAt: Timestamp.fromDate(postData.scheduledAt),
        };
        const docRef = await addDoc(postsCollectionRef, postToSave);
        console.log(`Post scheduled successfully with ID ${docRef.id} for user ${userId}.`);

        return {
            id: docRef.id,
            title: postData.title,
            text: postData.text,
            imageUrl: postData.imageUrl,
            platforms: postData.platforms,
            status: 'scheduled',
            scheduledAt: postData.scheduledAt.toISOString()
        };
    } catch (error) {
        console.error(`Error scheduling post for user ${userId}:`, error);
        throw new Error("Failed to schedule post in database.");
    }
}


/**
 * Retrieves all posts for a specific user, ordered by schedule date.
 * @param userId The UID of the user.
 * @returns An array of posts.
 */
export async function getScheduledPosts(userId: string): Promise<PostDataOutput[]> {
     if (!userId) {
        console.error("User ID is required to get posts.");
        return [];
    }
    try {
        const postsCollectionRef = getPostsCollectionRef(userId);
        const q = query(postsCollectionRef, orderBy("scheduledAt", "desc"));
        const querySnapshot = await getDocs(q);

        const posts: PostDataOutput[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data() as PostData;
            posts.push({
                ...data,
                id: doc.id,
                scheduledAt: data.scheduledAt.toDate().toISOString(), // Convert Timestamp to ISO String
            });
        });

        console.log(`Fetched ${posts.length} posts for user ${userId}.`);
        return posts;
    } catch (error) {
        console.error(`Error getting posts for user ${userId}:`, error);
        return [];
    }
}

/**
 * Updates the status of a specific post. (Client-side)
 * @param userId The UID of the user who owns the post.
 * @param postId The ID of the post to update.
 * @param status The new status for the post.
 */
export async function updatePostStatus(userId: string, postId: string, status: 'published' | 'failed'): Promise<void> {
     if (!userId) {
        throw new Error("User ID is required to update post status.");
    }
    try {
        const postRef = doc(db, "users", userId, "posts", postId);
        await updateDoc(postRef, { status });
    } catch (error) {
        console.error(`Error updating post ${postId} for user ${userId} to ${status}:`, error);
        throw new Error("Failed to update post status.");
    }
}


export async function getDuePosts(): Promise<PostData[]> {
    // This is a server-side function and should use the admin SDK.
    // Re-implementing with admin SDK if needed, or removing if fully client-side.
    // For now, returning empty to avoid breaking the cron job route that calls it.
    console.warn("getDuePosts is not implemented for server-side execution yet.");
    return [];
}
