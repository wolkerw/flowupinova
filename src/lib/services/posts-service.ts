import { adminDb } from "@/lib/firebase-admin";
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

// Interface for data stored in Firestore
export interface PostData {
    id?: string;
    title: string;
    text: string;
    imageUrl: string | null;
    platforms: string[];
    status: 'scheduled' | 'published' | 'failed';
    scheduledAt: Timestamp; // Using Admin SDK Timestamp
}

// Interface for data coming from the client to the server action
export type PostDataInput = Omit<PostData, 'id' | 'status' | 'scheduledAt'> & {
    scheduledAt: Date;
};

// Interface for data being sent from the server action to the client
export type PostDataOutput = Omit<PostData, 'scheduledAt'> & {
    id: string; // Ensure ID is always present on output
    scheduledAt: Date; // Server sends a native Date object
};

// Helper to get the collection reference for a specific user
function getPostsCollectionRef(userId: string) {
    return adminDb.collection("users").doc(userId).collection("posts");
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
        const docRef = await postsCollectionRef.add(postToSave);
        console.log(`Post scheduled successfully with ID ${docRef.id} for user ${userId}.`);

        return {
            id: docRef.id,
            title: postData.title,
            text: postData.text,
            imageUrl: postData.imageUrl,
            platforms: postData.platforms,
            status: 'scheduled',
            scheduledAt: postData.scheduledAt
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
        const q = postsCollectionRef.orderBy("scheduledAt", "desc");
        const querySnapshot = await q.get();

        const posts: PostDataOutput[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data() as PostData;
            posts.push({
                ...data,
                id: doc.id,
                scheduledAt: data.scheduledAt.toDate(), // Convert Timestamp to Date
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
 * Retrieves all posts for a specific user that are due to be published.
 * @param userId The UID of the user.
 * @returns An array of due posts.
 */
export async function getDuePosts(userId?: string): Promise<PostDataOutput[]> {
     if (!userId) {
        console.error("User ID is required to get due posts.");
        return [];
    }
    try {
        const postsCollectionRef = getPostsCollectionRef(userId);
        const now = Timestamp.now();
        const q = postsCollectionRef
            .where("status", "==", "scheduled")
            .where("scheduledAt", "<=", now);

        const querySnapshot = await q.get();

        const posts: PostDataOutput[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data() as PostData;
            posts.push({
                ...data,
                id: doc.id,
                scheduledAt: data.scheduledAt.toDate(),
            });
        });

        return posts;
    } catch (error) {
        console.error(`Error getting due posts for user ${userId}:`, error);
        return [];
    }
}

/**
 * Updates the status of a specific post for a user.
 * @param userId The UID of the user.
 * @param postId The ID of the post to update.
 * @param status The new status for the post.
 */
export async function updatePostStatus(userId: string, postId: string, status: 'published' | 'failed'): Promise<void> {
     if (!userId) {
        throw new Error("User ID is required to update post status.");
    }
    try {
        const postRef = getPostsCollectionRef(userId).doc(postId);
        await postRef.update({ status });
    } catch (error) {
        console.error(`Error updating post ${postId} for user ${userId} to ${status}:`, error);
        throw new Error("Failed to update post status.");
    }
}
