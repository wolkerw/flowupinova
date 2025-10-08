
'use server';

import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

export interface MetaConnectionData {
    userAccessToken?: string;
    pageToken?: string;
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

// Esta é a única URI que será usada para o redirecionamento do OAuth.
const META_REDIRECT_URI = "https://studio-7502195980-3983c.web.app/api/meta/callback";

/**
 * Retorna a URI de redirecionamento do OAuth da Meta.
 * @returns A URI de redirecionamento.
 */
export async function getMetaRedirectURI(): Promise<string> {
    return META_REDIRECT_URI;
}


const defaultMeta: MetaConnectionData = {
    isConnected: false,
};

export async function getMetaConnection(): Promise<MetaConnectionData> {
    try {
        const docSnap = await getDoc(metaDocRef);
        if (docSnap.exists()) {
            return docSnap.data() as MetaConnectionData;
        } else {
            // Se o documento não existe, crie-o com os valores padrão.
            await setDoc(metaDocRef, defaultMeta);
            return defaultMeta;
        }
    } catch (error) {
        console.error("Error getting Meta connection:", error);
        // Em caso de erro, retorna o estado padrão para evitar que a aplicação quebre.
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
        console.error("Error updating Meta connection data:", error);
        throw new Error("Failed to update Meta connection in database.");
    }
}

export async function fetchGraphAPI(url: string, accessToken: string, step: string, method: 'GET' | 'POST' = 'GET', body: URLSearchParams | FormData | null = null) {
    const requestUrl = new URL(url);
    const headers: HeadersInit = {
      'Authorization': `Bearer ${accessToken}`,
    };

    const config: RequestInit = {
        method,
        headers,
    };
    
    if (body && method === 'POST') {
        config.body = body;
    }

    try {
        const response = await fetch(requestUrl.toString(), config);
        const data = await response.json();

        if (!response.ok || data.error) {
            console.error(`[GRAPH_API_ERROR] ${method} ${requestUrl} ::`, JSON.stringify(data.error));
            const errorMessage = data.error?.error_user_title ? `${data.error.error_user_title}: ${data.error.error_user_msg}` : data.error?.message || 'Erro desconhecido';
            throw new Error(`Graph API error (${step}): ${errorMessage} (Code: ${data.error?.code}, Type: ${data.error?.type})`);
        }
        
        console.log(`[GRAPH_API_SUCCESS] Step: ${step}`);
        return data;

    } catch (error) {
        console.error(`[FETCH_ERROR] Step: ${step} | URL: ${url}`, error);
        throw error; // Re-throw the error to be handled by the caller
    }
}
