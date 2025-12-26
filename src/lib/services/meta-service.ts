
"use client";

import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, deleteField } from "firebase/firestore";
import type { MetaConnectionData } from "./meta-service";

export interface MetaConnectionData {
    isConnected: boolean;
    error?: string;
    connectedAt?: any; // Allow for server-side and client-side timestamps
    accessToken?: string; // This is the Page Access Token
    pageId?: string;
    pageName?: string;
    instagramId?: string;
    instagramUsername?: string;
    // This is the main token used to fetch pages, etc.
    userAccessToken?: string; 
    // For pending state
    pending?: boolean;
}

const defaultConnection: MetaConnectionData = {
    isConnected: false,
};

function getMetaConnectionDocRef(userId: string) {
    return doc(db, `users/${userId}/connections/meta`);
}

/**
 * Retrieves the Meta connection status for a specific user.
 * If the document doesn't exist, it creates it with a default state.
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
            const data = docSnap.data() as MetaConnectionData;
            // Ensure isConnected is always a boolean
            return { ...data, isConnected: !!data.isConnected };
        } else {
            console.log(`No meta connection doc for ${userId}, creating one.`);
            // Ensure the parent user document exists before creating a subcollection
            await setDoc(doc(db, "users", userId), { createdAt: new Date() }, { merge: true });
            await setDoc(docRef, defaultConnection);
            return defaultConnection;
        }
    } catch (error: any) {
        console.error(`Error getting Meta connection for user ${userId}:`, error);
        return { isConnected: false, error: error.message };
    }
}


/**
 * Updates the Meta connection status for a user. Can be called from the client.
 * This version must be compatible with client-side operations.
 * @param userId The UID of the user.
 * @param connectionData The data to set for the connection.
 */
export async function updateMetaConnection(userId: string, connectionData: Partial<MetaConnectionData>): Promise<void> {
    if (!userId) {
        throw new Error("User ID is required to update Meta connection.");
    }

    try {
        const docRef = getMetaConnectionDocRef(userId);
        
        let dataToSet: { [key: string]: any } = connectionData;

        if (connectionData.isConnected === false && !connectionData.pending) {
            // If explicitly disconnecting, clear all fields.
            dataToSet = {
                isConnected: false,
                accessToken: deleteField(),
                pageId: deleteField(),
                pageName: deleteField(),
                instagramId: deleteField(),
                instagramUsername: deleteField(),
                connectedAt: deleteField(),
                error: deleteField(),
                pending: deleteField(),
                userAccessToken: deleteField(),
            };
        } else if (connectionData.isConnected === true) {
            // When finalizing the connection
            dataToSet.connectedAt = new Date();
            // Ensure pending field is removed
            dataToSet.pending = false;
        } else if (connectionData.pending === true) {
             // When setting the pending state, just save the pending token
             dataToSet = {
                isConnected: false,
                pending: true,
                userAccessToken: connectionData.userAccessToken
             }
        }
        
        // Use set with merge to create or update
        await setDoc(docRef, dataToSet, { merge: true });
        console.log(`Meta connection status updated for user ${userId}.`);
        
    } catch (error: any) {
        console.error(`Error updating Meta connection for user ${userId}:`, error);
        throw new Error(`Failed to update Meta connection status. Reason: ${error.message}`);
    }
}
