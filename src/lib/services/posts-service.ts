
"use client";

import { db, storage } from "@/lib/firebase";
import { collection, query, orderBy, getDocs, addDoc, doc, updateDoc, where, Timestamp } from "firebase/firestore";
import { ref, uploadString, getDownloadURL, uploadBytes } from "firebase/storage";
import type { MetaConnectionData } from "./meta-service";

// Interface for data stored in Firestore
export interface PostData {
    id?: string;
    title: string;
    text: string;
    imageUrl: string; // URL must be public from Firebase Storage
    platforms: string[];
    status: 'scheduled' | 'publishing' | 'published' | 'failed';
    scheduledAt: Timestamp;
    metaConnection: Pick<MetaConnectionData, 'accessToken' | 'pageId' | 'instagramId'>;
    publishedMediaId?: string;
    failureReason?: string;
}

// Interface for data coming from the client
export type PostDataInput = Omit<PostData, 'id' | 'status' | 'scheduledAt' | 'metaConnection' | 'imageUrl'> & {
    scheduledAt: Date;
    metaConnection: Pick<MetaConnectionData, 'accessToken' | 'pageId' | 'instagramId'>;
    // Can be a public URL (from AI generation) or a File object (from manual creation)
    media: string | File;
};

// Interface for data being sent to the client
export type PostDataOutput = Omit<PostData, 'scheduledAt' | 'metaConnection'> & {
    id: string; // Ensure ID is always present on output
    scheduledAt: string; // Client receives an ISO string for serialization
};

// Helper to get the collection reference for a specific user
function getPostsCollectionRef(userId: string) {
    return collection(db, "users", userId, "posts");
}

async function uploadMediaAndGetURL(userId: string, media: string | File): Promise<string> {
    if (typeof media === 'string') {
        // If it's already a URL, assume it's public and return it
        // This is the case for AI-generated images
        return media;
    }

    // It's a File object, so upload to Firebase Storage
    const filePath = `users/${userId}/posts/${Date.now()}_${media.name}`;
    const storageRef = ref(storage, filePath);
    
    await uploadBytes(storageRef, media);
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
}

export async function schedulePost(userId: string, postData: PostDataInput): Promise<PostDataOutput> {
    if (!userId) {
        throw new Error("User ID is required to schedule a post.");
    }
     if (!postData.metaConnection.isConnected || !postData.metaConnection.accessToken || !postData.metaConnection.pageId) {
        throw new Error("Conexão com a Meta não está configurada ou é inválida.");
    }
    
    try {
        // Upload media if it's a File object and get the public URL
        const imageUrl = await uploadMediaAndGetURL(userId, postData.media);

        const postsCollectionRef = getPostsCollectionRef(userId);
        const postToSave: Omit<PostData, 'id'> = {
            title: postData.title,
            text: postData.text,
            imageUrl: imageUrl, // Save the public URL
            platforms: postData.platforms,
            status: 'scheduled',
            scheduledAt: Timestamp.fromDate(postData.scheduledAt),
            metaConnection: {
                accessToken: postData.metaConnection.accessToken,
                pageId: postData.metaConnection.pageId,
                instagramId: postData.metaConnection.instagramId,
            }
        };
        
        const docRef = await addDoc(postsCollectionRef, postToSave);
        console.log(`Post scheduled successfully with ID ${docRef.id} for user ${userId}.`);

        // If post is scheduled for now, publish it immediately
        const now = new Date();
        const scheduledDate = postData.scheduledAt;
        if (scheduledDate.getTime() - now.getTime() < 60000) { // If scheduled within the next minute
             console.log(`Post ${docRef.id} is due for immediate publication.`);
             await updateDoc(doc(db, "users", userId, "posts", docRef.id), { status: 'publishing' });
             
             const response = await fetch('/api/instagram/publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pageId: postToSave.metaConnection.pageId,
                    accessToken: postToSave.metaConnection.accessToken,
                    imageUrl: postToSave.imageUrl,
                    caption: postToSave.text,
                }),
            });

            const result = await response.json();
            if (!response.ok) {
                 await updateDoc(doc(db, "users", userId, "posts", docRef.id), { status: 'failed', failureReason: result.error });
                 throw new Error(result.error);
            } else {
                 await updateDoc(doc(db, "users", userId, "posts", docRef.id), { status: 'published', publishedMediaId: result.publishedMediaId });
            }
        }

        return {
            id: docRef.id,
            title: postData.title,
            text: postData.text,
            imageUrl: imageUrl,
            platforms: postData.platforms,
            status: 'scheduled',
            scheduledAt: postData.scheduledAt.toISOString()
        };
    } catch (error) {
        console.error(`Error scheduling post for user ${userId}:`, error);
        throw error instanceof Error ? error : new Error("Failed to schedule post in database.");
    }
}


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
                scheduledAt: data.scheduledAt.toDate().toISOString(),
            });
        });

        console.log(`Fetched ${posts.length} posts for user ${userId}.`);
        return posts;
    } catch (error) {
        console.error(`Error getting posts for user ${userId}:`, error);
        return [];
    }
}


export async function getDuePosts(adminDb: any): Promise<(PostData & { userId: string, id: string })[]> {
    const now = Timestamp.now();
    const duePostsQuery = query(
        collection(adminDb, 'users'), 
        where('status', '==', 'scheduled'), 
        where('scheduledAt', '<=', now)
    );
    
    // This is a simplified query. A real implementation would need a composite query across all users' subcollections.
    // Firestore queries on subcollections across all documents in a root collection are complex.
    // A better data model for this would be a single root-level 'posts' collection.
    // For now, this will not work as intended and is a placeholder.
    
    console.warn("getDuePosts functionality is limited due to Firestore query constraints on subcollections.");
    return [];
}
