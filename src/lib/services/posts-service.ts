
"use client";

import { db, storage } from "@/lib/firebase";
import { collection, addDoc, Timestamp, doc, getDocs, query, orderBy, setDoc, deleteDoc, getDoc, FieldValue, serverTimestamp } from "firebase/firestore";
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
    creationId?: string; // For Instagram container polling
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
        if (!userId) return reject(new Error("UserID é necessário para o upload."));

        const filePath = `users/${userId}/uploads/${Date.now()}_${media.name}`;
        const storageRef = ref(storage, filePath);
        const uploadTask = uploadBytesResumable(storageRef, media);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                onProgress?.(progress);
            },
            (error) => {
                 let detailedErrorMessage = "Falha no upload. ";
                switch (error.code) {
                    case 'storage/unauthorized':
                        detailedErrorMessage += "Você não tem permissão para realizar esta ação. Verifique as regras de segurança do seu Firebase Storage.";
                        break;
                    case 'storage/canceled':
                        detailedErrorMessage += "O upload foi cancelado.";
                        break;
                    case 'storage/unknown':
                        detailedErrorMessage += "Ocorreu um erro desconhecido. Verifique sua conexão com a internet e as configurações de CORS do seu bucket no Google Cloud.";
                        break;
                    default:
                        detailedErrorMessage += `(${error.code}) ${error.message}`;
                }
                reject(new Error(detailedErrorMessage));
            },
            async () => {
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve(downloadURL);
                } catch (getUrlError: any) {
                    reject(new Error("Upload bem-sucedido, mas falha ao obter a URL de download."));
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

    try {
        if (postData.media instanceof File) {
            imageUrl = await uploadMediaAndGetURL(userId, postData.media);
        } else {
            imageUrl = postData.media;
        }
        
        const postToSave: Omit<PostData, 'id'> = {
            title: postData.title,
            text: postData.text,
            imageUrl: imageUrl,
            platforms: postData.platforms,
            scheduledAt: Timestamp.fromDate(postData.scheduledAt),
            status: 'scheduled', // Always schedule first, CRON job will handle it
            metaConnection: {
                accessToken: postData.metaConnection.accessToken,
                pageId: postData.metaConnection.pageId,
                instagramId: postData.metaConnection.instagramId,
                instagramUsername: postData.metaConnection.instagramUsername,
                pageName: postData.metaConnection.pageName
            }
        };

        const docRef = await addDoc(getPostsCollectionRef(userId), postToSave);
        console.log(`Post ${docRef.id} successfully scheduled.`);

        const notificationsCollection = collection(db, `users/${userId}/notifications`);
        await addDoc(notificationsCollection, {
            postId: docRef.id,
            postTitle: postToSave.title,
            status: 'pending',
            scheduledAt: postToSave.scheduledAt,
            createdAt: serverTimestamp(),
        });
        console.log(`Pending notification created for post ${docRef.id}`);

        return { success: true, post: { id: docRef.id, ...postToSave, scheduledAt: postData.scheduledAt.toISOString() }};
        
    } catch(error: any) {
        console.error(`Error in schedulePost for user ${userId}:`, error);
        return { success: false, error: `Falha ao agendar post. Motivo: ${error.message}` };
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
    } catch (error: any) {
        console.error(`Error deleting post ${postId} for user ${userId}:`, error);
        throw new Error("Não foi possível excluir a publicação do banco de dados.");
    }
}
