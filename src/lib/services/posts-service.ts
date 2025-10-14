
"use client";

import { db, storage } from "@/lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
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
    metaConnection: Pick<MetaConnectionData, 'accessToken' | 'pageId' | 'instagramId'>;
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
    metaConnection: Pick<MetaConnectionData, 'accessToken' | 'pageId' | 'instagramId' | 'isConnected'>;
    logo?: File | null;
    logoOptions?: { position: string; size: string };
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
        throw new Error("User ID is required to schedule a post.");
    }
     if (!postData.metaConnection.isConnected || !postData.metaConnection.accessToken || !postData.metaConnection.pageId) {
        throw new Error("Conexão com a Meta não está configurada ou é inválida.");
    }
    
    const now = new Date();
    // Publicação imediata se agendado para menos de 60 segundos no futuro.
    const isImmediate = (postData.scheduledAt.getTime() - now.getTime()) < 60000;

    let imageUrl: string;
    if (postData.media instanceof File) {
        imageUrl = await uploadMediaAndGetURL(userId, postData.media);
    } else {
        imageUrl = postData.media;
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
        }
    };

    try {
        if (isImmediate) {
            console.log("Iniciando publicação imediata...");

            const response = await fetch('/api/instagram/publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pageId: basePostData.metaConnection.pageId,
                    accessToken: basePostData.metaConnection.accessToken,
                    imageUrl: basePostData.imageUrl,
                    caption: basePostData.text,
                }),
            });

            const result = await response.json();
            
            if (!response.ok) {
                 const postToSave: Omit<PostData, 'id'> = {
                    ...basePostData,
                    status: 'failed',
                    failureReason: result.error || "Unknown publishing error"
                };
                const docRef = await addDoc(getPostsCollectionRef(userId), postToSave);
                // Mesmo falhando, retornamos um objeto válido para o cliente
                 return {
                    id: docRef.id,
                    ...postToSave,
                    scheduledAt: postData.scheduledAt.toISOString()
                };
            }
            
            const postToSave: Omit<PostData, 'id'> = {
                ...basePostData,
                status: 'published',
                publishedMediaId: result.publishedMediaId
            };
            const docRef = await addDoc(getPostsCollectionRef(userId), postToSave);
            return {
                id: docRef.id,
                ...postToSave,
                scheduledAt: postData.scheduledAt.toISOString()
            };
            
        } else {
            console.log("Agendando post para publicação futura.");
            const postToSave: Omit<PostData, 'id'> = {
                ...basePostData,
                status: 'scheduled',
            };
            
            const docRef = await addDoc(getPostsCollectionRef(userId), postToSave);
             return {
                id: docRef.id,
                ...postToSave,
                scheduledAt: postData.scheduledAt.toISOString()
            };
        }

    } catch (error) {
        console.error(`Error in schedulePost for user ${userId}:`, error);
        // Garante que o erro seja propagado para o frontend para ser exibido no toast
        throw error instanceof Error ? error : new Error("Failed to process post.");
    }
}


export async function getScheduledPosts(userId: string): Promise<PostDataOutput[]> {
     if (!userId) {
        console.error("User ID is required to get posts.");
        return [];
    }
    // Esta função busca todos os posts, idealmente deveria ser paginada ou filtrada.
    // Por enquanto, ela será mantida, mas a lógica de CRON foi removida.
    // O ideal seria que essa busca fosse feita em um componente separado, talvez com paginação.
    return []; 
}
