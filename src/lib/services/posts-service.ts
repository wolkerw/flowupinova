
"use client";

import { db, storage } from "@/lib/firebase";
import { collection, addDoc, Timestamp, doc, getDocs, query, orderBy } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
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
    metaConnection: Pick<MetaConnectionData, 'accessToken' | 'pageId' | 'instagramId' | 'instagramUsername'>; // Storing username now
    publishedMediaId?: string;
    failureReason?: string;
}

// Interface for data coming from the client
export type PostDataInput = {
    title: string;
    text: string;
    media: File | string; // Can be a File for upload or a string URL from AI gen
    platforms: string[];
    scheduledAt: Date;
    metaConnection: MetaConnectionData; // Pass the full connection object
    logo?: File | null;
    logoOptions?: { position: string; size: string };
};

// Interface for data being sent to the client from the service
export type PostDataOutput = {
    success: boolean;
    error?: string;
    post?: Omit<PostData, 'scheduledAt' | 'metaConnection'> & {
        id: string; // Ensure ID is always present on output
        scheduledAt: string; // Client receives an ISO string for serialization
        instagramUsername?: string; // Send username to the client
    }
};

// Helper to get the collection reference for a specific user
function getPostsCollectionRef(userId: string) {
    return collection(db, "users", userId, "posts");
}

export function uploadMediaAndGetURL(userId: string, media: File, onProgress?: (progress: number) => void): Promise<string> {
    return new Promise((resolve, reject) => {
        if (!userId) {
            return reject(new Error("UserID é necessário para o upload."));
        }
        const filePath = `users/${userId}/posts/${Date.now()}_${media.name}`;
        const storageRef = ref(storage, filePath);
        const uploadTask = uploadBytesResumable(storageRef, media);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                onProgress?.(progress);
            },
            (error) => {
                console.error("Firebase Storage Error:", error);
                let errorMessage = "Falha no upload. ";
                switch (error.code) {
                    case 'storage/unauthorized':
                        errorMessage += "Verifique as regras de segurança do seu Storage. Você não tem permissão para realizar esta ação.";
                        break;
                    case 'storage/canceled':
                        errorMessage += "O upload foi cancelado.";
                        break;
                    case 'storage/object-not-found':
                         errorMessage += "O arquivo não foi encontrado. Isso pode ocorrer se as regras do Storage não permitirem a leitura.";
                         break;
                    case 'storage/unknown':
                        errorMessage += "Ocorreu um erro desconhecido. Verifique sua conexão e as configurações de CORS do seu bucket no Google Cloud.";
                        break;
                    default:
                         errorMessage += `(${error.code}) ${error.message}`;
                }
                reject(new Error(errorMessage));
            },
            async () => {
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve(downloadURL);
                } catch (error: any) {
                     console.error("Error getting download URL:", error);
                    reject(new Error("Falha ao obter a URL de download após o upload."));
                }
            }
        );
    });
}


export async function schedulePost(userId: string, postData: PostDataInput): Promise<PostDataOutput> {
    if (!userId) {
        return { success: false, error: "User ID is required to schedule a post." };
    }
     if (!postData.metaConnection.isConnected || !postData.metaConnection.accessToken || !postData.metaConnection.instagramId) {
        return { success: false, error: "Conexão com a Meta (Instagram) não está configurada ou é inválida." };
    }
    
    let imageUrl: string;
    try {
        if (postData.media instanceof File) {
            imageUrl = await uploadMediaAndGetURL(userId, postData.media);
        } else {
            imageUrl = postData.media;
        }
    } catch(uploadError: any) {
        return { success: false, error: uploadError.message };
    }


    const basePostData = {
        title: postData.title,
        text: postData.text,
        imageUrl: imageUrl,
        platforms: postData.platforms,
        scheduledAt: Timestamp.fromDate(postData.scheduledAt),
        metaConnection: {
            accessToken: postData.metaConnection.accessToken,
            pageId: postData.metaConnection.pageId,
            instagramId: postData.metaConnection.instagramId,
            instagramUsername: postData.metaConnection.instagramUsername,
        }
    };
    
    const now = new Date();
    // Publicação imediata se agendado para menos de 60 segundos no futuro.
    const isImmediate = (postData.scheduledAt.getTime() - now.getTime()) < 60000;

    if (isImmediate) {
        console.log("Iniciando publicação imediata...");
        try {
            const response = await fetch('/api/instagram/publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    instagramId: basePostData.metaConnection.instagramId,
                    accessToken: basePostData.metaConnection.accessToken,
                    imageUrl: basePostData.imageUrl,
                    caption: basePostData.text,
                }),
            });

            const result = await response.json();
            
            if (!response.ok || !result.success) {
                 const failedPost: Omit<PostData, 'id'> = { ...basePostData, status: 'failed', failureReason: result.error || "Unknown publishing error" };
                 await addDoc(getPostsCollectionRef(userId), failedPost);
                 return { success: false, error: failedPost.failureReason };
            }
            
            const publishedPost: Omit<PostData, 'id'> = { ...basePostData, status: 'published', publishedMediaId: result.publishedMediaId };
            const docRef = await addDoc(getPostsCollectionRef(userId), publishedPost);
            return {
                success: true,
                post: {
                    id: docRef.id,
                    ...publishedPost,
                    scheduledAt: postData.scheduledAt.toISOString(),
                    instagramUsername: publishedPost.metaConnection.instagramUsername
                }
            };
            
        } catch(error: any) {
            console.error(`Error in immediate publish for user ${userId}:`, error);
            const failedPost: Omit<PostData, 'id'> = { ...basePostData, status: 'failed', failureReason: error.message || "Client-side error during publishing." };
            await addDoc(getPostsCollectionRef(userId), failedPost);
            return { success: false, error: failedPost.failureReason };
        }

    } else {
        console.log("Agendando post para publicação futura.");
        try {
            const scheduledPost: Omit<PostData, 'id'> = { ...basePostData, status: 'scheduled' };
            const docRef = await addDoc(getPostsCollectionRef(userId), scheduledPost);
            return {
                success: true,
                post: {
                    id: docRef.id,
                    ...scheduledPost,
                    scheduledAt: postData.scheduledAt.toISOString(),
                    instagramUsername: scheduledPost.metaConnection.instagramUsername
                }
            };
        } catch (error: any) {
            console.error(`Error scheduling post for user ${userId}:`, error);
            return { success: false, error: `Failed to save scheduled post. Reason: ${error.message}` };
        }
    }
}


export async function getScheduledPosts(userId: string): Promise<PostDataOutput[]> {
    if (!userId) {
       console.error("User ID is required to get posts.");
       return [];
   }
   try {
        const postsCollection = getPostsCollectionRef(userId);
        const q = query(postsCollection, orderBy("scheduledAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        const posts: PostDataOutput[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data() as PostData;
            posts.push({
                success: true,
                post: {
                    id: doc.id,
                    title: data.title,
                    text: data.text,
                    imageUrl: data.imageUrl,
                    platforms: data.platforms,
                    status: data.status,
                    publishedMediaId: data.publishedMediaId,
                    failureReason: data.failureReason,
                    scheduledAt: data.scheduledAt.toDate().toISOString(),
                    instagramUsername: data.metaConnection?.instagramUsername, // Read from the post document
                }
            });
        });

        return posts;

   } catch (error: any) {
       console.error(`Error fetching posts for user ${userId}:`, error);
       return [];
   }
}
