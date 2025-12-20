"use server";

import { admin } from "@/lib/firebase-admin";

export interface InstagramConnectionAdminData {
    isConnected: boolean;
    error?: string;
    connectedAt?: any;
    accessToken?: string;
    instagramId?: string;
    instagramUsername?: string;
}

/**
 * Updates the Instagram connection status for a user using the Admin SDK.
 * This is a server-side only function.
 * @param userId The UID of the user.
 * @param connectionData The partial data to update the connection with.
 */
export async function updateInstagramConnectionAdmin(userId: string, connectionData: Partial<InstagramConnectionAdminData>): Promise<void> {
    if (!userId) {
        throw new Error("User ID is required to update Instagram connection.");
    }

    try {
        const docRef = admin.firestore().collection("users").doc(userId).collection("connections").doc("instagram");
        
        let dataToSet: { [key: string]: any } = connectionData;

        // If we are connecting, add a server timestamp.
        if (connectionData.isConnected) {
            dataToSet.connectedAt = admin.firestore.FieldValue.serverTimestamp();
        }
        
        // Use set with merge to create or update the document.
        await docRef.set(dataToSet, { merge: true });
        
        console.log(`Admin SDK: Instagram connection status updated for user ${userId}.`);

    } catch (error: any) {
        console.error(`Admin SDK Error: updating Instagram connection for user ${userId}:`, error);
        throw new Error(`Failed to update Instagram connection status via admin. Reason: ${error.message}`);
    }
}
