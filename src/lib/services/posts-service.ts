
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
    imageUrl: string; // URL must be public from Firebase Storage or AI source
    logoUrl?: string; // URL of the logo, also from Storage
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
    media: File | string; // Can be a File for upload or a string URL from AI gen/webhook
    platforms: string[];
    scheduledAt: Date;
    metaConnection: MetaConnectionData; // Pass the full connection object
    logo?: File | null;
    logoOptions?: { position: string; size:string };
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
    let logoUrl: string | undefined;

    try {
        if (postData.media instanceof File) {
            imageUrl = await uploadMediaAndGetURL(userId, postData.media);
        } else {
            imageUrl = postData.media; // Already a URL
        }

        if (postData.logo instanceof File) {
            logoUrl = await uploadMediaAndGetURL(userId, postData.logo);
        }

    } catch(uploadError: any) {
        return { success: false, error: uploadError.message };
    }

    const postToSave: any = {
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

    if (logoUrl) {
        postToSave.logoUrl = logoUrl;
    }
    
    const now = new Date();
    const isImmediate = (postData.scheduledAt.getTime() - now.getTime()) < 60000;

    if (isImmediate) {
        postToSave.status = 'publishing';
    } else {
        postToSave.status = 'scheduled';
    }

    try {
        const docRef = await addDoc(getPostsCollectionRef(userId), postToSave);
        
        if (isImmediate) {
            // Fire-and-forget call to the API.
            const response = await fetch('/api/instagram/publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userId, postId: docRef.id }),
            });
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || `A API de publicação falhou com status ${response.status}`);
            }
        }

        return {
            success: true,
            post: {
                id: docRef.id,
                ...postToSave,
                scheduledAt: postData.scheduledAt.toISOString(),
                instagramUsername: postToSave.metaConnection.instagramUsername,
            }
        };
        
    } catch(error: any) {
        console.error(`Error saving post for user ${userId}:`, error);
        return { success: false, error: `Failed to save post. Reason: ${error.message}` };
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
                    instagramUsername: data.metaConnection?.instagramUsername,
                }
            });
        });

        return posts;

   } catch (error: any) {
       console.error(`Error fetching posts for user ${userId}:`, error);
       return [];
   }
}

    
