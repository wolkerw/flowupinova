
'use server';

import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface MetaConnectionData {
    isConnected: boolean;
    error?: string;
    connectedAt?: Date;
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
            const connectedAtTimestamp = data.connectedAt as Timestamp | undefined;
            return {
                isConnected: data.isConnected,
                // Convert Firestore Timestamp to JS Date object if it exists
                connectedAt: connectedAtTimestamp ? connectedAtTimestamp.toDate() : undefined, 
            };
        } else {
            // If the document doesn't exist, they are not connected.
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
        return;
    }
    try {
        const docRef = getMetaConnectionDocRef(userId);
        const dataToSave: { [key: string]: any } = { ...connectionData };
        
        // Use serverTimestamp for new connections or use the provided Date
        if (connectionData.connectedAt) {
            dataToSave.connectedAt = Timestamp.fromDate(connectionData.connectedAt);
        } else if (connectionData.isConnected === true) {
             dataToSave.connectedAt = serverTimestamp();
        }

        await setDoc(docRef, dataToSave, { merge: true });
        console.log(`Meta connection status updated for user ${userId}.`);
    } catch (error) {
        console.error(`Error updating Meta connection for user ${userId}:`, error);
        throw new Error("Failed to update Meta connection status in database.");
    }
}
