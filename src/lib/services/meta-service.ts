'use server';

import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

export interface MetaConnectionData {
    pageToken: string; // Changed from longLivedToken
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

const metaDocRef = doc(db, "integrations", "meta");

const defaultMeta: MetaConnectionData = {
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
            await updateDoc(metaDocRef, data);
        } else {
            await setDoc(metaDocRef, data);
        }
        console.log("Meta connection data updated successfully.");
    } catch (error) {
        console.error("Error updating meta connection data:", error);
    }
}
