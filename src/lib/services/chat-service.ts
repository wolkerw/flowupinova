"use client";

import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";

// Type for messages stored in Firestore (includes timestamp)
export interface StoredMessage {
  sender: "user" | "ai";
  text: string;
  isError?: boolean;
  createdAt: Date; // Use JS Date for input, it will be converted to Timestamp
}

// Type for data structure in the 'history' document
interface UserAppData {
  chatHistory?: StoredMessage[];
  // other app data fields can go here...
}

// Helper to get the document reference for a user's app state/history
function getUserAppDataDocRef(userId: string) {
  // Changed from 'main' to 'history' to be more descriptive
  return doc(db, `users/${userId}/appData/history`);
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
      return history
        .map((msg) => ({
          ...msg,
          createdAt: (msg.createdAt as any).toDate
            ? (msg.createdAt as any).toDate()
            : new Date(msg.createdAt),
        }))
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
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
    console.warn("UserID é necessário para salvar o histórico do chat.");
    return;
  }

  try {
    const docRef = getUserAppDataDocRef(userId);

    // 1. Buscar histórico existente no Firestore de forma preventiva e resiliente
    const docSnap = await getDoc(docRef);
    let existingHistory: any[] = [];
    if (docSnap.exists()) {
      const data = docSnap.data();
      existingHistory = data.chatHistory || [];
    }

    // 2. Converter as mensagens de entrada para o formato de persistência
    const messagesToStore = messages.map((msg) => {
      const cleanMsg: any = {
        sender: msg.sender,
        text: msg.text,
        createdAt: Timestamp.fromDate(msg.createdAt instanceof Date ? msg.createdAt : new Date()),
      };
      if (msg.isError !== undefined) {
        cleanMsg.isError = msg.isError;
      }
      return cleanMsg;
    });

    // 3. Mesclar sem duplicidades (usando margem de tolerância de 2 segundos de timestamp)
    const mergedHistory = [...existingHistory];

    for (const newMsg of messagesToStore) {
      const alreadyExists = existingHistory.some((extMsg) => {
        const extTime = extMsg.createdAt && extMsg.createdAt.toDate 
          ? extMsg.createdAt.toDate().getTime() 
          : new Date(extMsg.createdAt).getTime();
        const newTime = newMsg.createdAt.toDate().getTime();
        return (
          extMsg.text === newMsg.text && 
          extMsg.sender === newMsg.sender && 
          Math.abs(extTime - newTime) < 2000
        );
      });

      if (!alreadyExists) {
        mergedHistory.push(newMsg);
      }
    }

    // 4. Salvar o histórico unificado completo
    await setDoc(docRef, { chatHistory: mergedHistory }, { merge: true });
  } catch (error: any) {
    console.error(`Erro ao salvar o histórico do chat para o usuário ${userId}:`, error);
  }
}
