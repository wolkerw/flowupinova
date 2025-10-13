
'use server';

import { doc, getDoc, setDoc, FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase-admin"; // Usaremos a instância de admin aqui

export interface MetaConnectionData {
    isConnected: boolean;
    error?: string;
    connectedAt?: Date;
}

function getMetaConnectionDocRef(userId: string) {
    const db = getAdminFirestore();
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
            const connectedAtTimestamp = data.connectedAt as Timestamp | undefined;
            return {
                isConnected: data.isConnected,
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

/**
 * Updates the Meta connection status for a specific user.
 * @param userId The UID of the user.
 * @param connectionData The data to update.
 */
export async function updateMetaConnection(userId: string, connectionData: Partial<MetaConnectionData>): Promise<void> {
    if (!userId) {
        console.error("updateMetaConnection called without userId.");
        throw new Error("User ID is required to update Meta connection.");
    }
    try {
        const docRef = getMetaConnectionDocRef(userId);
        const dataToSave: { [key: string]: any } = { ...connectionData };
        
        // Use o serverTimestamp do Admin SDK se a conexão for bem-sucedida e a data não for fornecida
        if (connectionData.isConnected === true && !connectionData.connectedAt) {
             dataToSave.connectedAt = FieldValue.serverTimestamp();
        } else if (connectionData.connectedAt) {
            // Se uma data for fornecida, converta para Timestamp do Firestore
            dataToSave.connectedAt = Timestamp.fromDate(connectionData.connectedAt);
        }

        // Use setDoc com merge para criar o documento se ele não existir, ou atualizá-lo se existir.
        await setDoc(docRef, dataToSave, { merge: true });
        console.log(`Meta connection status updated for user ${userId}.`);
    } catch (error) {
        console.error(`Error updating Meta connection for user ${userId}:`, error);
        throw new Error("Failed to update Meta connection status in database.");
    }
}
