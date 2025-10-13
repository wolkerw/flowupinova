import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
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
export async function updateMetaConnection(userId: string, connectionData: Partial<Omit<MetaConnectionData, 'connectedAt'> & { connectedAt?: Date }>): Promise<void> {
    if (!userId) {
        console.error("updateMetaConnection called without userId.");
        throw new Error("User ID is required to update Meta connection.");
    }
    try {
        const docRef = getMetaConnectionDocRef(userId);
        const dataToSave: { [key: string]: any } = { ...connectionData };
        
        if (connectionData.isConnected === true) {
             dataToSave.connectedAt = new Date();
        }

        // Use setDoc com merge para criar ou atualizar o documento de forma segura.
        await setDoc(docRef, dataToSave, { merge: true });
        console.log(`Meta connection status updated for user ${userId}.`);
    } catch (error) {
        console.error(`Error updating Meta connection for user ${userId}:`, error);
        throw new Error("Failed to update Meta connection status in database.");
    }
}
