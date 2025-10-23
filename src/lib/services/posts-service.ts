
"use client";

import { db, storage } from "@/lib/firebase";
import { collection, addDoc, Timestamp, doc, getDocs, query, orderBy, setDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import type { MetaConnectionData } from "./meta-service";

// Interface for data stored in Firestore
export interface PostData {
    id?: string;
    title: string;
    text: string;
    imageUrl: string; // URL must be public from Firebase Storage or AI source
    platforms: Array<'instagram' | 'facebook'>;
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
    platforms: Array<'instagram' | 'facebook'>;
    scheduledAt: Date;
    metaConnection: MetaConnectionData; // Pass the full connection object
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
    let docRef; // Define docRef here to be accessible in the final catch block

    try {
        // Step 1: Handle Media URL
        if (postData.media instanceof File) {
            imageUrl = await uploadMediaAndGetURL(userId, postData.media);
        } else {
            imageUrl = postData.media;
        }

        const now = new Date();
        const isImmediate = (postData.scheduledAt.getTime() - now.getTime()) < 60000; // 1 minute threshold
        const initialStatus = isImmediate ? 'publishing' : 'scheduled';
        
        // Step 2: Save to Firestore FIRST
        const postToSave: Omit<PostData, 'id'> = {
            title: postData.title,
            text: postData.text,
            imageUrl: imageUrl,
            platforms: postData.platforms,
            scheduledAt: Timestamp.fromDate(postData.scheduledAt),
            status: initialStatus,
            metaConnection: {
                accessToken: postData.metaConnection.accessToken,
                pageId: postData.metaConnection.pageId,
                instagramId: postData.metaConnection.instagramId,
                instagramUsername: postData.metaConnection.instagramUsername,
            }
        };

        docRef = await addDoc(getPostsCollectionRef(userId), postToSave);

        // If it's a scheduled (not immediate) post, our job is done for now.
        // The backend cron job will handle the publishing later.
        if (!isImmediate) {
            console.log(`Post ${docRef.id} scheduled for ${postData.scheduledAt}.`);
            return { 
                success: true, 
                post: { 
                    id: docRef.id, 
                    ...postToSave, 
                    scheduledAt: postData.scheduledAt.toISOString() 
                }
            };
        }
        
        // Step 3: For immediate posts, call the publish API AFTER saving to DB
        console.log(`[1] Post ${docRef.id} saved to DB. Now attempting to publish immediately...`);
        
        // For now, we only handle Instagram publishing via this flow.
        // The logic for Facebook publishing would need a separate API call or a modified one.
        if (postData.platforms.includes('instagram')) {
            const apiPayload = {
                postData: {
                    title: postData.title,
                    text: postData.text,
                    imageUrl: imageUrl,
                    metaConnection: {
                        accessToken: postData.metaConnection.accessToken,
                        instagramId: postData.metaConnection.instagramId,
                    }
                }
            };

            const response = await fetch('/api/instagram/publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(apiPayload),
            });

            const result = await response.json();
            console.log('[2] API Response:', result);

            if (!response.ok || !result.success) {
                throw new Error(result.error || `A API de publicação falhou com status ${response.status}`);
            }
            
            console.log(`[3] API call successful. Updating post ${docRef.id} to 'published'.`);
            await setDoc(docRef, {
                status: 'published',
                publishedMediaId: result.publishedMediaId
            }, { merge: true });
        } else {
             // If only Facebook is selected for an immediate post, we mark it as scheduled
             // since the FB publish logic is not yet implemented on this client-side flow.
             await setDoc(docRef, { status: 'scheduled' }, { merge: true });
             console.log(`Post ${docRef.id} for Facebook has been scheduled. A backend process should handle it.`);
        }


        return { 
            success: true, 
            post: { 
                id: docRef.id, 
                ...postToSave, 
                status: 'published', 
                scheduledAt: postData.scheduledAt.toISOString() 
            }
        };
        
    } catch(error: any) {
        console.error(`Error in schedulePost for user ${userId}:`, error);

        if (docRef) {
            await setDoc(docRef, {
                status: 'failed',
                failureReason: error.message
            }, { merge: true });
        }
        
        return { 
            success: false, 
            error: `Failed to process post. Reason: ${error.message}` 
        };
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
                    platforms: data.platforms as Array<'instagram' | 'facebook'>,
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
