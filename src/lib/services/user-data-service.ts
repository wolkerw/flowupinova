
"use client";

import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";

// Interface for the user-specific application data
interface UserAppData {
    unusedImageUrls?: string[];
}

// Helper to get the document reference for a user's app data
function getUserAppDataDocRef(userId: string) {
    return doc(db, `users/${userId}/appData/main`);
}

/**
 * Retrieves the list of unused image URLs for a specific user from Firestore.
 * @param userId The UID of the user.
 * @returns A promise that resolves to an array of image URLs.
 */
export async function getUnusedImages(userId: string): Promise<string[]> {
    if (!userId) {
        console.error("UserID é necessário para buscar as imagens não utilizadas.");
        return [];
    }

    try {
        const docRef = getUserAppDataDocRef(userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data() as UserAppData;
            return data.unusedImageUrls || [];
        }
        return [];
    } catch (error: any) {
        console.error(`Erro ao buscar imagens não utilizadas para o usuário ${userId}:`, error);
        throw new Error("Não foi possível buscar o histórico de imagens do banco de dados.");
    }
}

/**
 * Saves an array of image URLs to the user's unused images list in Firestore.
 * This function ensures no duplicates are added.
 * @param userId The UID of the user.
 * @param images The array of image URLs to add.
 */
export async function saveUnusedImages(userId: string, images: string[]): Promise<void> {
    if (!userId) {
        throw new Error("UserID é necessário para salvar as imagens.");
    }
    if (!images || images.length === 0) {
        return;
    }

    try {
        const docRef = getUserAppDataDocRef(userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            // Atomically add new elements to the array if they don't exist
            await updateDoc(docRef, {
                unusedImageUrls: arrayUnion(...images)
            });
        } else {
            // Create the document with the initial array
            await setDoc(docRef, { unusedImageUrls: images });
        }
        console.log(`${images.length} imagens não utilizadas salvas para o usuário ${userId}.`);
    } catch (error: any) {
        console.error(`Erro ao salvar imagens não utilizadas para o usuário ${userId}:`, error);
        throw new Error("Não foi possível salvar o histórico de imagens no banco de dados.");
    }
}

/**
 * Removes a specific image URL from the user's unused images list in Firestore.
 * @param userId The UID of the user.
 * @param imageUrl The URL of the image to remove.
 */
export async function removeUnusedImage(userId: string, imageUrl: string): Promise<void> {
     if (!userId) {
        throw new Error("UserID é necessário para remover a imagem.");
    }
    if (!imageUrl) {
        return;
    }

    try {
        const docRef = getUserAppDataDocRef(userId);
        // Atomically remove all instances of the element from the array
        await updateDoc(docRef, {
            unusedImageUrls: arrayRemove(imageUrl)
        });
        console.log(`Imagem não utilizada removida para o usuário ${userId}.`);
    } catch (error: any) {
        // Don't throw an error if the document doesn't exist, just log it.
        if (error.code === 'not-found') {
            console.warn(`Documento de dados do usuário não encontrado ao tentar remover imagem para ${userId}.`);
            return;
        }
        console.error(`Erro ao remover imagem não utilizada para o usuário ${userId}:`, error);
        throw new Error("Não foi possível remover a imagem do histórico no banco de dados.");
    }
}
