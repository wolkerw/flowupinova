
"use server";

import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, Timestamp, orderBy, query } from "firebase/firestore";

// Interface for data stored in Firestore
export interface PostData {
    id?: string;
    title: string;
    text: string;
    imageUrl: string | null;
    platforms: string[];
    status: 'scheduled' | 'published';
    scheduledAt: Timestamp;
}

// Interface for data coming from the client to the server action
export type PostDataInput = Omit<PostData, 'id' | 'status' | 'scheduledAt'> & {
    scheduledAt: Date; // Client sends a native Date object
};

// Interface for data being sent from the server action to the client
export type PostDataOutput = Omit<PostData, 'scheduledAt'> & {
    id: string; // Ensure ID is always present on output
    scheduledAt: Date; // Server sends a native Date object
};


/**
 * Schedules a new post by saving it to the Firestore database.
 * @param postData The data for the post to be scheduled.
 * @returns The full post data including the new ID and status.
 */
export async function schedulePost(postData: PostDataInput): Promise<PostDataOutput> {
    try {
        const postToSave = {
            ...postData,
            scheduledAt: Timestamp.fromDate(postData.scheduledAt),
            status: 'scheduled' as const,
        };
        const docRef = await addDoc(postsCollectionRef, postToSave);
        console.log("Post scheduled successfully with ID:", docRef.id);
        
        return {
            ...postData,
            id: docRef.id,
            status: 'scheduled',
        };
    } catch (error) {
        console.error("Error scheduling post:", error);
        throw new Error("Failed to schedule post in database.");
    }
}

const postsCollectionRef = collection(db, "posts");


/**
 * Retrieves all scheduled and published posts from Firestore, ordered by schedule date.
 * @returns An array of posts.
 */
export async function getScheduledPosts(): Promise<PostDataOutput[]> {
    try {
        const q = query(postsCollectionRef, orderBy("scheduledAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        const posts: PostDataOutput[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data() as PostData;
            posts.push({
                id: doc.id,
                title: data.title,
                text: data.text,
                imageUrl: data.imageUrl,
                platforms: data.platforms,
                status: data.status,
                // Convert Timestamp to Date object before sending to client
                scheduledAt: data.scheduledAt.toDate(), 
            });
        });

        console.log(`Fetched ${posts.length} posts from the database.`);
        return posts;
    } catch (error) {
        console.error("Error getting posts:", error);
        return [];
    }
}
