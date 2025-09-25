
"use server";

import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, Timestamp, orderBy, query } from "firebase/firestore";

export interface PostData {
    id?: string;
    title: string;
    text: string;
    imageUrl: string | null;
    platforms: string[];
    status: 'scheduled' | 'published';
    scheduledAt: Timestamp;
}

const postsCollectionRef = collection(db, "posts");

/**
 * Schedules a new post by saving it to the Firestore database.
 * @param postData The data for the post to be scheduled.
 */
export async function schedulePost(postData: Omit<PostData, 'id' | 'status'>): Promise<{ id: string }> {
    try {
        const docRef = await addDoc(postsCollectionRef, {
            ...postData,
            status: 'scheduled',
        });
        console.log("Post scheduled successfully with ID:", docRef.id);
        return { id: docRef.id };
    } catch (error) {
        console.error("Error scheduling post:", error);
        throw new Error("Failed to schedule post in database.");
    }
}

/**
 * Retrieves all scheduled and published posts from Firestore, ordered by schedule date.
 * @returns An array of posts.
 */
export async function getScheduledPosts(): Promise<PostData[]> {
    try {
        const q = query(postsCollectionRef, orderBy("scheduledAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        const posts: PostData[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            posts.push({
                id: doc.id,
                ...data
            } as PostData);
        });

        console.log(`Fetched ${posts.length} posts from the database.`);
        return posts;
    } catch (error) {
        console.error("Error getting posts:", error);
        return [];
    }
}
