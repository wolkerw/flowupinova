
"use client";

import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, deleteField } from "firebase/firestore";

export interface GoogleConnectionData {
    isConnected: boolean;
    error?: string;
    connectedAt?: any;
    accessToken?: string;
    refreshToken?: string | null; // Refresh token is crucial
    expiryDate?: number | null;
}

const defaultConnection: GoogleConnectionData = {
    isConnected: false,
};

function getGoogleConnectionDocRef(userId: string) {
    return doc(db, `users/${userId}/connections/google`);
}

/**
 * Retrieves the Google connection status for a specific user.
 * If the document doesn't exist, it creates it with a default state.
 * @param userId The UID of the user.
 * @returns The connection data.
 */
export async function getGoogleConnection(userId: string): Promise<GoogleConnectionData> {
    if (!userId) {
        console.error("getGoogleConnection called without userId.");
        return { isConnected: false, error: "User ID not provided." };
    }
    try {
        const docRef = getGoogleConnectionDocRef(userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data() as GoogleConnectionData;
            return { ...data, isConnected: !!data.isConnected };
        } else {
            console.log(`No google connection doc for ${userId}, creating one.`);
            await setDoc(doc(db, "users", userId), { createdAt: new Date() }, { merge: true });
            await setDoc(docRef, defaultConnection);
            return defaultConnection;
        }
    } catch (error: any) {
        console.error(`Error getting Google connection for user ${userId}:`, error);
        return { isConnected: false, error: error.message };
    }
}


/**
 * Updates the Google connection status for a user. Can be called from the client.
 * @param userId The UID of the user.
 * @param connectionData The data to set for the connection.
 */
export async function updateGoogleConnection(userId: string, connectionData: Partial<GoogleConnectionData>): Promise<void> {
    if (!userId) {
        throw new Error("User ID is required to update Google connection.");
    }

    try {
        const docRef = getGoogleConnectionDocRef(userId);
        
        let dataToSet: { [key: string]: any } = connectionData;

        if (connectionData.isConnected === false) {
            // If explicitly disconnecting, clear all fields.
            dataToSet = {
                isConnected: false,
                accessToken: deleteField(),
                refreshToken: deleteField(),
                expiryDate: deleteField(),
                connectedAt: deleteField(),
                error: deleteField()
            };
        } else if (connectionData.isConnected === true) {
            dataToSet.connectedAt = new Date();
        }
        
        await setDoc(docRef, dataToSet, { merge: true });
        console.log(`Google connection status updated for user ${userId}.`);
        
    } catch (error: any) {
        console.error(`Error updating Google connection for user ${userId}:`, error);
        throw new Error(`Failed to update Google connection status. Reason: ${error.message}`);
    }
}
