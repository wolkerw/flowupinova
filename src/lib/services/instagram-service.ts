
"use client";

import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, deleteField } from "firebase/firestore";

export interface InstagramConnectionData {
    isConnected: boolean;
    error?: string;
    connectedAt?: any;
    accessToken?: string;
    instagramId?: string;
    instagramUsername?: string;
}

const defaultConnection: InstagramConnectionData = {
    isConnected: false,
};

function getInstagramConnectionDocRef(userId: string) {
    return doc(db, `users/${userId}/connections/instagram`);
}

export async function getInstagramConnection(userId: string): Promise<InstagramConnectionData> {
    if (!userId) {
        console.error("getInstagramConnection called without userId.");
        return { isConnected: false, error: "User ID not provided." };
    }
    try {
        const docRef = getInstagramConnectionDocRef(userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data() as InstagramConnectionData;
            return { ...data, isConnected: !!data.isConnected };
        } else {
            await setDoc(doc(db, "users", userId), { createdAt: new Date() }, { merge: true });
            await setDoc(docRef, defaultConnection);
            return defaultConnection;
        }
    } catch (error: any) {
        console.error(`Error getting Instagram connection for user ${userId}:`, error);
        return { isConnected: false, error: error.message };
    }
}

export async function updateInstagramConnection(userId: string, connectionData: Partial<InstagramConnectionData>): Promise<void> {
    if (!userId) {
        throw new Error("User ID is required to update Instagram connection.");
    }

    try {
        const docRef = getInstagramConnectionDocRef(userId);
        
        let dataToSet: { [key: string]: any } = connectionData;

        if (connectionData.isConnected === false) {
            dataToSet = {
                isConnected: false,
                accessToken: deleteField(),
                instagramId: deleteField(),
                instagramUsername: deleteField(),
                connectedAt: deleteField(),
                error: deleteField()
            };
        } else if (connectionData.isConnected === true) {
            dataToSet.connectedAt = new Date();
        }
        
        await setDoc(docRef, dataToSet, { merge: true });
        console.log(`Instagram connection status updated for user ${userId}.`);
        
    } catch (error: any) {
        console.error(`Error updating Instagram connection for user ${userId}:`, error);
        throw new Error(`Failed to update Instagram connection status. Reason: ${error.message}`);
    }
}
