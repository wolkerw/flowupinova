
"use server";

import { admin, adminDb } from "@/lib/firebase-admin";

export interface MetaConnectionAdminData {
    isConnected: boolean;
    error?: string;
    connectedAt?: any;
    accessToken?: string;
    pageId?: string;
    pageName?: string;
    instagramId?: string;
    instagramUsername?: string;
}


/**
 * Updates the Meta connection status for a user using the Admin SDK.
 * This is a server-side only function.
 * @param userId The UID of the user.
 * @param connectionData The partial data to update the connection with.
 */
export async function updateMetaConnectionAdmin(userId: string, connectionData: Partial<MetaConnectionAdminData>): Promise<void> {
    if (!userId) {
        throw new Error("User ID is required to update Meta connection.");
    }

    try {
        const docRef = adminDb.collection("users").doc(userId).collection("connections").doc("meta");
        
        let dataToSet: { [key: string]: any } = connectionData;

        // If we are connecting, add a server timestamp.
        if (connectionData.isConnected) {
            dataToSet.connectedAt = admin.firestore.FieldValue.serverTimestamp();
        }
        
        // Use set with merge to create or update the document.
        await docRef.set(dataToSet, { merge: true });
        
        console.log(`Admin SDK: Meta connection status updated for user ${userId}.`);

    } catch (error: any) {
        console.error(`Admin SDK Error: updating Meta connection for user ${userId}:`, error);
        throw new Error(`Failed to update Meta connection status via admin. Reason: ${error.message}`);
    }
}
