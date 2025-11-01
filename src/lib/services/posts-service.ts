

"use client";

import { db, storage } from "@/lib/firebase";
import { collection, addDoc, Timestamp, doc, getDocs, query, orderBy, setDoc, deleteDoc, getDoc } from "firebase/firestore";
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
    metaConnection: Pick<MetaConnectionData, 'accessToken' | 'pageId' | 'instagramId' | 'instagramUsername' | 'pageName'>;
    publishedMediaId?: string; // Can be for Instagram or Facebook
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
        text: string; // Include full text for republishing
        instagramUsername?: string; // Send username to the client
        pageName?: string;
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
     if (!postData.metaConnection.isConnected || !postData.metaConnection.accessToken) {
        return { success: false, error: "Conexão com a Meta não está configurada ou é inválida." };
    }
    
    let imageUrl: string;
    let docRef; 

    try {
        // Step 1: Handle Media URL
        if (postData.media instanceof File) {
            imageUrl = await uploadMediaAndGetURL(userId, postData.media);
        } else {
            imageUrl = postData.media;
        }

        const now = new Date();
        const isImmediate = (postData.scheduledAt.getTime() - now.getTime()) < 60000;
        const initialStatus = isImmediate ? 'publishing' : 'scheduled';
        
        // Step 2: Save to Firestore
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
                pageName: postData.metaConnection.pageName
            }
        };

        docRef = await addDoc(getPostsCollectionRef(userId), postToSave);
        console.log(`Post ${docRef.id} saved to DB with status '${initialStatus}'.`);

        // Step 2.5: Create a pending notification
        const notificationsCollection = collection(db, `users/${userId}/notifications`);
        await addDoc(notificationsCollection, {
            postId: docRef.id,
            postTitle: postToSave.title,
            status: 'pending',
            scheduledAt: postToSave.scheduledAt,
            createdAt: Timestamp.now(),
        });
        console.log(`Pending notification created for post ${docRef.id}`);

        if (!isImmediate) {
            console.log(`Post ${docRef.id} is scheduled for a future date.`);
            return { success: true, post: { id: docRef.id, ...postToSave, scheduledAt: postData.scheduledAt.toISOString() }};
        }
        
        // Step 3: Handle immediate publishing
        console.log(`Attempting immediate publish for post ${docRef.id} to platforms: ${postData.platforms.join(', ')}`);

        const publishPromises = postData.platforms.map(async (platform) => {
            let apiPath: string;
            let payload: any;
            
            if (platform === 'instagram') {
                if (!postData.metaConnection.instagramId) throw new Error("Instagram ID de negócio não encontrado para publicação.");
                apiPath = '/api/instagram/publish';
                payload = {
                    postData: {
                        title: postData.title,
                        text: postData.text,
                        imageUrl: imageUrl,
                        metaConnection: {
                            accessToken: postData.metaConnection.accessToken!,
                            instagramId: postData.metaConnection.instagramId!,
                        }
                    }
                };
            } else if (platform === 'facebook') {
                if (!postData.metaConnection.pageId) throw new Error("ID da Página do Facebook não encontrado para publicação.");
                 apiPath = '/api/facebook/publish';
                 payload = {
                     postData: {
                         text: `${postData.title}\n\n${postData.text}`,
                         imageUrl: imageUrl,
                         metaConnection: {
                             accessToken: postData.metaConnection.accessToken!,
                             pageId: postData.metaConnection.pageId!,
                         }
                     }
                 };
            } else {
                console.warn(`Plataforma desconhecida: ${platform}. Ignorando.`);
                return null;
            }

            const response = await fetch(apiPath, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(`Falha ao publicar no ${platform}: ${result.error || `status ${response.status}`}`);
            }
            return { platform, result };
        });

        const results = await Promise.all(publishPromises);
        
        console.log(`[3] API calls successful. Updating post ${docRef.id} to 'published'.`);
        await setDoc(docRef, { status: 'published' }, { merge: true });

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
            error: `Falha ao processar post. Motivo: ${error.message}` 
        };
    }
}


export async function getScheduledPosts(userId: string): Promise<PostDataOutput[]> {
   if (!userId) {
       console.error("User ID is required to get posts.");
       return [];
   }
   try {
        const userDocRef = doc(db, "users", userId);
        const userDocSnap = await getDoc(userDocRef);
        if (!userDocSnap.exists()) {
            console.log(`User document for ${userId} does not exist. Creating it.`);
            await setDoc(userDocRef, { createdAt: new Date() });
        }

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
                    pageName: data.metaConnection?.pageName,
                }
            });
        });

        return posts;

   } catch (error: any) {
       console.error(`Error fetching posts for user ${userId}:`, error);
       // Retorna um array que indica o erro, para que o frontend possa lidar com isso
       return [{ success: false, error: error.message }];
   }
}

export async function deletePost(userId: string, postId: string): Promise<void> {
    if (!userId || !postId) {
        throw new Error("UserID e PostID são necessários para excluir a publicação.");
    }
    try {
        const postDocRef = doc(db, "users", userId, "posts", postId);
        await deleteDoc(postDocRef);
        console.log(`Post ${postId} deleted successfully for user ${userId}.`);
    } catch (error: any) {
        console.error(`Error deleting post ${postId} for user ${userId}:`, error);
        throw new Error("Não foi possível excluir a publicação do banco de dados.");
    }
}
    
