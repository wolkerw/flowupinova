
"use client";

import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface MetaConnectionData {
    isConnected: boolean;
    error?: string;
    connectedAt?: Date;
    accessToken?: string;
    pageId?: string;
    pageName?: string;
    instagramId?: string;
    instagramUsername?: string;
}

function getMetaConnectionDocRef(userId: string) {
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
                isConnected: data?.isConnected || false,
                connectedAt: connectedAtTimestamp ? connectedAtTimestamp.toDate() : undefined,
                accessToken: data?.accessToken,
                pageId: data?.pageId,
                pageName: data?.pageName, // Incluído
                instagramId: data?.instagramId,
                instagramUsername: data?.instagramUsername, // Incluído
            };
        } else {
            return { isConnected: false };
        }
    } catch (error: any) {
        console.error(`Error getting Meta connection for user ${userId}:`, error);
        return { isConnected: false, error: error.message };
    }
}


/**
 * Updates the Meta connection status for a user. Can be called from the client.
 * @param userId The UID of the user.
 * @param connectionData The data to set for the connection.
 */
export async function updateMetaConnection(userId: string, connectionData: Partial<MetaConnectionData>): Promise<void> {
    if (!userId) {
        throw new Error("User ID is required to update Meta connection.");
    }

    try {
        const docRef = getMetaConnectionDocRef(userId);
        
        let dataToSet: Partial<MetaConnectionData> = connectionData;

        // Se estiver conectando, adiciona o serverTimestamp
        if (connectionData.isConnected) {
            dataToSet = { ...dataToSet, connectedAt: serverTimestamp() as any };
        } else {
            // Se estiver desconectando, limpa os campos relacionados
            dataToSet = {
                isConnected: false,
                accessToken: undefined,
                pageId: undefined,
                pageName: undefined,
                instagramId: undefined,
                instagramUsername: undefined,
            };
        }

        await setDoc(docRef, dataToSet, { merge: true });
        console.log(`Meta connection status updated for user ${userId}.`);
    } catch (error) {
        console.error(`Error updating Meta connection for user ${userId}:`, error);
        // O erro será lançado e pode ser pego pelo chamador (ex: na página com um toast)
        throw new Error("Failed to update Meta connection status in database.");
    }
}
