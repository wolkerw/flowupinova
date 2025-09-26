
'use server';

import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

export interface MetaConnectionData {
    userAccessToken?: string; // Token do usuário com permissões mais amplas
    pageToken: string; 
    facebookPageId?: string;
    facebookPageName?: string;
    instagramAccountId?: string;
    instagramAccountName?: string;
    followersCount?: number;
    igFollowersCount?: number;
    profilePictureUrl?: string;
    igProfilePictureUrl?: string;
    isConnected: boolean;
}

// Helper para chamadas à Graph API
export async function fetchGraphAPI(url: string, accessToken: string, step: string) {
    const fullUrl = url.includes('access_token=') ? url : `${url}${url.includes('?') ? '&' : '?'}access_token=${accessToken}`;
    console.log(`[GRAPH_API] Executing ${step} with URL...`);
    const response = await fetch(fullUrl);
    const data = await response.json();

    if (data.error) {
        console.error(`[GRAPH_API_ERROR] at ${step}:`, data.error);
        throw new Error(`Graph API error (${step}): ${data.error.message} (Code: ${data.error.code}, Type: ${data.error.type})`);
    }
    console.log(`[GRAPH_API_SUCCESS] ${step} successful.`);
    return data;
}


const metaDocRef = doc(db, "integrations", "meta");

const defaultMeta: MetaConnectionData = {
    userAccessToken: "",
    pageToken: "",
    isConnected: false,
};

export async function getMetaConnection(): Promise<MetaConnectionData> {
    try {
        const docSnap = await getDoc(metaDocRef);

        if (docSnap.exists()) {
            return docSnap.data() as MetaConnectionData;
        } else {
            // Document doesn't exist, so create it with default data
            await setDoc(metaDocRef, defaultMeta);
            return defaultMeta;
        }
    } catch (error) {
        console.error("Error getting meta connection:", error);
        return defaultMeta;
    }
}

export async function updateMetaConnection(data: Partial<MetaConnectionData>): Promise<void> {
    try {
        const docSnap = await getDoc(metaDocRef);
        if (docSnap.exists()) {
            // If document exists, update it
            await updateDoc(metaDocRef, data);
        } else {
            // If document does not exist, create it with the provided data and defaults
            await setDoc(metaDocRef, { ...defaultMeta, ...data });
        }
        console.log("Meta connection data updated/created successfully.");
    } catch (error) {
        console.error("Error updating/creating meta connection data:", error);
        // We throw the error here to be caught by the API route
        throw error;
    }
}
