
'use server';

import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

export interface MetaConnectionData {
    userAccessToken?: string; // Token do usuário com permissões mais amplas
    pageToken?: string; // Renomeado para não ser usado por engano
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

// Helper para chamadas à Graph API, agora centralizado.
export async function fetchGraphAPI(url: string, accessToken: string, step: string, method: 'GET' | 'POST' = 'GET', body: URLSearchParams | FormData | null = null) {
    const headers: HeadersInit = {};
    let requestUrl = url;
    let requestBody: URLSearchParams | FormData | string | null = null;
    
    // Log para depuração, conforme solicitado
    console.log(`[DEBUG_GRAPH_API] Step: ${step} | Method: ${method} | Using token (last 8): ...${accessToken.slice(-8)}`);

    if (method === 'GET') {
        const urlObj = new URL(url);
        if (body instanceof URLSearchParams) {
            body.forEach((value, key) => urlObj.searchParams.append(key, value));
        }
        if (accessToken) {
             urlObj.searchParams.append('access_token', accessToken);
        }
        requestUrl = urlObj.toString();
    } else { // POST
        if (body instanceof FormData) {
            const tempBody = new FormData();
            tempBody.append('access_token', accessToken);
            for (const [key, value] of body.entries()) {
                if (key !== 'access_token') {
                   tempBody.append(key, value);
                }
            }
            requestBody = tempBody;
        } else {
            headers['Content-Type'] = 'application/x-www-form-urlencoded';
            const postBody = new URLSearchParams(body?.toString() || '');
            if(accessToken) {
                postBody.append('access_token', accessToken);
            }
            requestBody = postBody.toString();
        }
    }
    
    const response = await fetch(requestUrl, {
        method,
        headers,
        body: requestBody,
        cache: 'no-store'
    });

    const data = await response.json();

    if (data.error) {
        console.error(`[GRAPH_API_ERROR] at ${step}:`, data.error);
        const errorMessage = data.error.error_user_title ? `${data.error.error_user_title}: ${data.error.error_user_msg}` : data.error.message;
        throw new Error(`Graph API error (${step}): ${errorMessage} (Code: ${data.error.code}, Type: ${data.error.type})`);
    }
    
    console.log(`[GRAPH_API_SUCCESS] Step: ${step} successful.`);
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
            const connectionData = docSnap.data() as MetaConnectionData;
            // Log de depuração, conforme solicitado
            console.log("[DEBUG_GET_CONNECTION] userAccessToken (last 10):", connectionData.userAccessToken?.slice(-10));
            return connectionData;
        } else {
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
            await setDoc(metaDocRef, { ...defaultMeta, ...data });
        }
        console.log("Meta connection data updated/created successfully in 'integrations/meta'.");
    } catch (error) {
        console.error("Error updating/creating meta connection data:", error);
        throw error;
    }
}
