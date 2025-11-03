
"use client";

import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";

// Type for messages stored in Firestore (includes timestamp)
export interface StoredMessage {
    sender: 'user' | 'ai';
    text: string;
    isError?: boolean;
    createdAt: Date; // Use JS Date for input, it will be converted to Timestamp
}

// Type for data structure in the 'main' document
interface UserAppData {
    chatHistory?: StoredMessage[];
    // other app data fields can go here...
}

// Helper to get the document reference for a user's app data
function getUserAppDataDocRef(userId: string) {
    return doc(db, `users/${userId}/appData/main`);
}

/**
 * Retrieves the chat history for a specific user from Firestore.
 * @param userId The UID of the user.
 * @returns A promise that resolves to an array of StoredMessage.
 */
export async function getChatHistory(userId: string): Promise<StoredMessage[]> {
    if (!userId) {
        console.error("UserID é necessário para buscar o histórico do chat.");
        return [];
    }

    try {
        const docRef = getUserAppDataDocRef(userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data() as UserAppData;
            const history = data.chatHistory || [];
            // Convert Firestore Timestamps to JS Dates
            return history.map(msg => ({
                ...msg,
                createdAt: (msg.createdAt as any).toDate ? (msg.createdAt as any).toDate() : new Date(msg.createdAt)
            })).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        }
        return []; // Return empty if no history exists
    } catch (error: any) {
        console.error(`Erro ao buscar histórico do chat para o usuário ${userId}:`, error);
        throw new Error("Não foi possível buscar o histórico do chat.");
    }
}

/**
 * Saves the entire chat history for a user in a single document.
 * This overwrites the previous history.
 * @param userId The UID of the user.
 * @param messages The full array of messages to save.
 */
export async function saveChatHistory(userId: string, messages: StoredMessage[]): Promise<void> {
    if (!userId) {
        throw new Error("UserID é necessário para salvar o histórico do chat.");
    }

    try {
        const docRef = getUserAppDataDocRef(userId);
        
        // Convert JS Dates to Firestore Timestamps before saving
        const messagesToStore = messages.map(msg => ({
            ...msg,
            createdAt: Timestamp.fromDate(msg.createdAt),
        }));

        // Use setDoc with merge to create or update the chatHistory field
        await setDoc(docRef, { chatHistory: messagesToStore }, { merge: true });
        
    } catch (error: any) {
        console.error(`Erro ao salvar o histórico do chat para o usuário ${userId}:`, error);
        throw new Error("Não foi possível salvar o histórico do chat.");
    }
}
