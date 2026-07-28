"use client";

import { db, storage } from "@/lib/firebase";
import {
  collection,
  addDoc,
  Timestamp,
  doc,
  getDocs,
  query,
  orderBy,
  setDoc,
  deleteDoc,
  getDoc,
  FieldValue,
  serverTimestamp,
  updateDoc,
  deleteField,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import type { MetaConnectionData } from "./meta-service";
import type { InstagramConnectionData } from "./instagram-service";
import type { GoogleConnectionData } from "./google-service";
import type { LinkedInConnectionData } from "./linkedin-service";
import { config } from "@/lib/config";

// Interface for data stored in Firestore
export interface PostData {
  id?: string;
  text: string;
  // For single image posts
  imageUrl?: string;
  // Changed to array to support carousels
  imageUrls: string[];
  isCarousel: boolean;
  platforms: Array<"instagram" | "facebook" | "google" | "linkedin">;
  status: "scheduled" | "publishing" | "published" | "failed";
  scheduledAt: Timestamp;
  connections: {
    fbPageAccessToken?: string | null;
    igUserAccessToken?: string | null;
    pageId?: string | null;
    pageName?: string | null;
    instagramId?: string | null;
    instagramUsername?: string | null;
  };
  publishedMediaId?: string;
  failureReason?: string;
  // For Instagram carousel, this will be the ID of the parent carousel container
  creationId?: string;
  collaborators?: string[];
  userTags?: { username: string; x: number; y: number }[];
}

export interface MediaFileInput {
  file: File;
  publicUrl?: string;
}

// Interface for data coming from the client
export type PostDataInput = {
  text: string;
  // Changed to array to support carousels
  media: MediaFileInput[];
  platforms: Array<"instagram" | "facebook" | "google" | "linkedin">;
  isCarousel: boolean;
  scheduledAt: Date;
  metaConnection?: MetaConnectionData;
  instagramConnection?: InstagramConnectionData;
  googleConnection?: GoogleConnectionData;
  linkedinConnection?: LinkedInConnectionData;
  collaborators?: string[];
  userTags?: { username: string; x: number; y: number }[];
};

// Interface for data being sent to the client from the service
export type PostDataOutput = {
  success: boolean;
  error?: string;
  post?: Omit<PostData, "scheduledAt" | "connections"> & {
    id: string;
    scheduledAt: string;
    text: string;
    instagramUsername?: string;
    pageName?: string;
  };
};

// Helper to get the collection reference for a specific user
function getPostsCollectionRef(userId: string) {
  return collection(db, "users", userId, "posts");
}

export function uploadMediaAndGetURL(
  userId: string,
  media: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!userId) return reject(new Error("UserID é necessário para o upload."));

    const safeFileName = media.name && media.name !== "" ? media.name : `upload_${Date.now()}.jpg`;
    const filePath = `users/${userId}/uploads/${Date.now()}_${safeFileName}`;
    const storageRef = ref(storage, filePath);
    const uploadTask = uploadBytesResumable(storageRef, media);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(progress);
      },
      (error) => {
        let detailedErrorMessage = "Falha no upload. ";
        switch (error.code) {
          case "storage/unauthorized":
            detailedErrorMessage +=
              "Você não tem permissão para realizar esta ação. Verifique as regras de segurança do seu Firebase Storage.";
            break;
          case "storage/canceled":
            detailedErrorMessage += "O upload foi cancelado.";
            break;
          case "storage/unknown":
            detailedErrorMessage +=
              "Ocorreu um erro desconhecido. Verifique sua conexão com a internet e as configurações de CORS do seu bucket no Google Cloud.";
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

async function publishPostImmediately(
  userId: string,
  postId: string,
  postData: Omit<PostData, "id">
): Promise<{ success: boolean; error?: string }> {
  const postRef = doc(db, `users/${userId}/posts/${postId}`);
  try {
    await updateDoc(postRef, { status: "publishing" });

    const publishPromises = postData.platforms.map((platform) => {
      let apiPath: string;
      let payload: any;

      if (platform === "instagram") {
        apiPath = "/api/instagram/v2/publish"; // Use the V2 route for Instagram
        payload = {
          postData: {
            text: postData.text,
            imageUrls: postData.imageUrls, // Send array
            isCarousel: postData.isCarousel,
            accessToken: postData.connections.igUserAccessToken,
            instagramId: postData.connections.instagramId,
            collaborators: postData.collaborators,
            userTags: postData.userTags,
          },
        };
      } else if (platform === "facebook") {
        apiPath = "/api/facebook/publish";
        payload = {
          postData: {
            text: postData.text,
            // Facebook API only supports single image via /photos endpoint
            imageUrl: postData.imageUrls[0],
            metaConnection: {
              accessToken: postData.connections.fbPageAccessToken,
              pageId: postData.connections.pageId,
            },
          },
        };
      } else if (platform === "google") {
        // 'google'
        apiPath = "/api/google/publish";
        payload = {
          postData: {
            text: postData.text,
            imageUrl:
              postData.imageUrls && postData.imageUrls.length > 0
                ? postData.imageUrls[0]
                : undefined,
            userId,
          },
        };
      } else if (platform === "tiktok") {
        apiPath = "/api/tiktok/publish";
        const videoUrl =
          postData.mediaFiles && postData.mediaFiles.length > 0
            ? postData.mediaFiles[0].url
            : postData.imageUrls && postData.imageUrls.length > 0
            ? postData.imageUrls[0]
            : undefined;
        payload = {
          userId,
          title: postData.text,
          videoUrl,
          privacyLevel: "SELF_ONLY",
        };
      } else {
        // 'linkedin'
        apiPath = "/api/linkedin/publish";
        payload = {
          postData: {
            text: postData.text,
            imageUrl:
              postData.imageUrls && postData.imageUrls.length > 0
                ? postData.imageUrls[0]
                : undefined,
            userId,
          },
        };
      }

      const fullApiPath =
        typeof window !== "undefined" ? apiPath : `${config.aplicationURL}${apiPath}`;

      return fetch(fullApiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    });

    const responses = await Promise.all(publishPromises);
    const results = await Promise.all(responses.map((res) => res.json()));

    const failedResult = results.find((result) => !result.success);
    if (failedResult) {
      throw new Error(failedResult.error || `Uma das plataformas falhou ao publicar.`);
    }

    const publishedMediaIds = results.map((result) => result.publishedMediaId).filter(Boolean);

    await updateDoc(postRef, {
      status: "published",
      publishedMediaId: publishedMediaIds.join(", "),
      failureReason: deleteField(),
    });
    return { success: true };
  } catch (error: any) {
    await updateDoc(postRef, {
      status: "failed",
      failureReason: error.message || "Erro desconhecido durante publicação imediata.",
    });
    console.error(`[PUBLISH_IMMEDIATELY_ERROR] Post ${postId} failed:`, error);
    return { success: false, error: error.message };
  }
}

export async function schedulePost(
  userId: string,
  postData: PostDataInput
): Promise<PostDataOutput> {
  if (!userId) {
    return { success: false, error: "User ID is required to schedule a post." };
  }

  const hasFacebook = postData.platforms.includes("facebook");
  const hasInstagram = postData.platforms.includes("instagram");
  const hasGoogle = postData.platforms.includes("google");
  const hasLinkedIn = postData.platforms.includes("linkedin");

  if (hasFacebook && (!postData.metaConnection || !postData.metaConnection.isConnected)) {
    return {
      success: false,
      error: "A conexão com o Facebook é necessária para publicar nesta plataforma.",
    };
  }
  if (
    hasInstagram &&
    (!postData.instagramConnection || !postData.instagramConnection.isConnected)
  ) {
    return {
      success: false,
      error: "A conexão com o Instagram é necessária para publicar nesta plataforma.",
    };
  }
  if (hasGoogle && (!postData.googleConnection || !postData.googleConnection.isConnected)) {
    return {
      success: false,
      error: "A conexão com o Google Meu Negócio é necessária para publicar nesta plataforma.",
    };
  }
  if (hasLinkedIn && (!postData.linkedinConnection || !postData.linkedinConnection.isConnected)) {
    return {
      success: false,
      error: "A conexão com o LinkedIn é necessária para publicar nesta plataforma.",
    };
  }

  let imageUrls: string[];

  try {
    console.log(
      "[POST_SERVICE] Iniciando processamento de mídia...",
      postData.media.length,
      "itens."
    );
    const uploadPromises = postData.media.map(async (mediaItem, index) => {
      console.log(
        `[POST_SERVICE] Item ${index}:`,
        mediaItem.publicUrl ? "Tem URL" : "Sem URL",
        mediaItem.file ? "Tem arquivo" : "Sem arquivo"
      );

      // Se já temos uma URL pública real (não blob e não base64), usamos ela
      if (
        mediaItem.publicUrl &&
        !mediaItem.publicUrl.startsWith("blob:") &&
        !mediaItem.publicUrl.startsWith("data:")
      ) {
        console.log(`[POST_SERVICE] Item ${index}: Usando URL pública existente.`);
        return mediaItem.publicUrl;
      }

      // Se for um link 'blob:' ou 'data:' (base64), precisamos baixar/converter os dados binários para fazer o upload real no Storage
      if (
        mediaItem.publicUrl &&
        (mediaItem.publicUrl.startsWith("blob:") || mediaItem.publicUrl.startsWith("data:"))
      ) {
        console.log(`[POST_SERVICE] Item ${index}: Convertendo URL temporária (blob/base64)...`);
        const response = await fetch(mediaItem.publicUrl);
        const blob = await response.blob();
        const file = new File([blob], `generated_${Date.now()}.jpg`, {
          type: blob.type,
        });
        console.log(
          `[POST_SERVICE] Item ${index}: Imagem convertida com sucesso, fazendo upload permanente no Firebase Storage...`
        );
        return await uploadMediaAndGetURL(userId, file);
      }

      if (mediaItem.file && mediaItem.file.size > 0) {
        console.log(`[POST_SERVICE] Item ${index}: Fazendo upload do arquivo físico.`);
        return await uploadMediaAndGetURL(userId, mediaItem.file);
      }

      if (mediaItem.publicUrl) {
        console.log(`[POST_SERVICE] Item ${index}: Usando publicUrl como fallback.`);
        return mediaItem.publicUrl;
      }

      throw new Error("Item de mídia inválido ou sem conteúdo.");
    });
    imageUrls = await Promise.all(uploadPromises);
    console.log("[POST_SERVICE] URLs finais processadas:", imageUrls);

    // Validação final: Garantir que não existam URLs blob ou vazias
    if (imageUrls.some((url) => !url || url.startsWith("blob:"))) {
      throw new Error(
        "Algumas imagens não foram carregadas corretamente. Verifique se o CORS do Firebase Storage foi configurado."
      );
    }

    const isImmediate = postData.scheduledAt <= new Date();

    // Save connection data with separate tokens
    const connectionsToSave: PostData["connections"] = {
      fbPageAccessToken: postData.metaConnection?.accessToken || null,
      igUserAccessToken: postData.instagramConnection?.accessToken || null,
      pageId: postData.metaConnection?.pageId || null,
      pageName: postData.metaConnection?.pageName || null,
      instagramId: postData.instagramConnection?.instagramId || null,
      instagramUsername: postData.instagramConnection?.instagramUsername || null,
    };

    const postToSave: Omit<PostData, "id" | "imageUrl"> = {
      text: postData.text,
      imageUrls: imageUrls,
      isCarousel: postData.isCarousel,
      platforms: postData.platforms,
      scheduledAt: Timestamp.fromDate(postData.scheduledAt),
      status: isImmediate ? "publishing" : "scheduled",
      connections: connectionsToSave,
      ...(postData.collaborators ? { collaborators: postData.collaborators } : {}),
      ...(postData.userTags ? { userTags: postData.userTags } : {}),
    };

    const docRef = await addDoc(getPostsCollectionRef(userId), postToSave);
    console.log(`Post ${docRef.id} document created with status: ${postToSave.status}.`);

    if (isImmediate) {
      // Re-add imageUrls for immediate publishing logic, which expects it.
      const fullPostForPublish = { ...postToSave, imageUrl: imageUrls[0] };
      const result = await publishPostImmediately(userId, docRef.id, fullPostForPublish as any);
      if (!result.success) {
        return { success: false, error: result.error };
      }
    } else {
      // Create a pending notification only for future scheduled posts
      const notificationsCollection = collection(db, `users/${userId}/notifications`);
      await addDoc(notificationsCollection, {
        postId: docRef.id,
        postTitle: postToSave.text.substring(0, 40) + "...",
        status: "pending",
        scheduledAt: postToSave.scheduledAt,
        createdAt: serverTimestamp(),
      });
      console.log(`Pending notification created for post ${docRef.id}`);
    }

    return {
      success: true,
      post: {
        id: docRef.id,
        ...postToSave,
        imageUrl: imageUrls[0],
        scheduledAt: postData.scheduledAt.toISOString(),
      } as any,
    };
  } catch (error: any) {
    console.error(`Error in schedulePost for user ${userId}:`, error);
    return { success: false, error: `Falha ao processar post. Motivo: ${error.message}` };
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
          text: data.text,
          imageUrl: data.imageUrl,
          imageUrls: data.imageUrls,
          isCarousel: data.isCarousel,
          platforms: data.platforms as Array<"instagram" | "facebook">,
          status: data.status,
          publishedMediaId: data.publishedMediaId,
          failureReason: data.failureReason,
          scheduledAt: data.scheduledAt.toDate().toISOString(),
          instagramUsername: data.connections?.instagramUsername || undefined,
          pageName: data.connections?.pageName || undefined,
        },
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
