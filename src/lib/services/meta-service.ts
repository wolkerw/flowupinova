
"use client";

import { doc, getDoc, setDoc, serverTimestamp, getFirestore } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface MetaConnectionData {
    isConnected: boolean;
    error?: string;
    connectedAt?: Date;
}

function getMetaConnectionDocRef(userId: string) {
    // CORREÇÃO: O caminho estava incorreto, criando coleções aninhadas.
    // O caminho correto é 'users/{userId}/connections/meta'
    return doc(db, "users", userId, "connections", "meta");
}

/**
 * Retrieves the Meta connection status for a specific user.
 * @param userId The UID of the user.
 * @returns The connection data.
 */
export async function getMetaConnection(userId: string): Promise<MetaConnectionData> {
    if (!userId) {
        console.error("getMetaConnection called without userId.");
        return { isConnected: false, error: "User ID not provided." };
    }
    try {
        const docRef = getMetaConnectionDocRef(userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            const connectedAtTimestamp = data?.connectedAt;
            return {
                isConnected: data?.isConnected,
                connectedAt: connectedAtTimestamp ? connectedAtTimestamp.toDate() : undefined,
            };
        } else {
            return { isConnected: false };
        }
    } catch (error: any) {
        console.error(`Error getting Meta connection for user ${userId}:`, error);
        return { isConnected: false, error: error.message };
    }
}


export async function updateMetaConnection(userId: string, connectionData: Partial<Omit<MetaConnectionData, 'connectedAt'>>): Promise<void> {
    if (!userId) {
        throw new Error("User ID is required to update Meta connection.");
    }
    
    // Esta função agora será chamada apenas para desconectar.
    // A lógica de conexão foi movida para a API Route para usar o Admin SDK
    // e evitar problemas de permissão.
    if (connectionData.isConnected === true) {
        console.warn("Attempted to call updateMetaConnection() to connect from the client. This logic has been moved to the server.");
        // Não faz nada para evitar chamadas inseguras.
        return;
    }

    try {
        const docRef = getMetaConnectionDocRef(userId);
        await setDoc(docRef, connectionData, { merge: true });
        console.log(`Meta connection status updated for user ${userId}.`);
    } catch (error) {
        console.error(`Error updating Meta connection for user ${userId}:`, error);
        throw new Error("Failed to update Meta connection status in database.");
    }
}
