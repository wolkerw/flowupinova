
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

const defaultMeta: MetaConnectionData = {
    isConnected: false,
};

export async function getMetaConnection(): Promise<MetaConnectionData> {
    try {
        const docSnap = await getDoc(metaDocRef);
        if (docSnap.exists()) {
            return docSnap.data() as MetaConnectionData;
        } else {
            await setDoc(metaDocRef, defaultMeta);
            return defaultMeta;
        }
    } catch (error) {
        console.error("Error getting Meta connection:", error);
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

/**
 * Performs a robust fetch request to the Meta Graph API, handling network errors and non-JSON responses.
 * @param url The URL to fetch.
 * @param accessToken The access token for authorization.
 * @param step A descriptive name for the current step for logging purposes.
 * @param method The HTTP method to use.
 * @param body The body of the request for POST methods.
 * @returns The JSON response from the API.
 * @throws An error if the fetch fails at any stage.
 */
export async function fetchGraphAPI(url: string, accessToken: string, step: string, method: 'GET' | 'POST' = 'GET', body: URLSearchParams | FormData | null = null) {
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
        const response = await fetch(url, config);
        const text = await response.text();
        
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            // The response was not valid JSON, likely an HTML error page.
            console.error(`[GRAPH_API_PARSE_ERROR] Step: ${step} | Status: ${response.status} | Response (not JSON):`, text);
            throw new Error(`A API da Meta retornou uma resposta inesperada (não-JSON) na etapa: ${step}.`);
        }

        console.log(`[GRAPH_API_RESPONSE] Step: ${step} | Status: ${response.status} | Data:`, JSON.stringify(data));

        if (!response.ok || data.error) {
            const errorMessage = data.error?.error_user_title 
                ? `${data.error.error_user_title}: ${data.error.error_user_msg}` 
                : data.error?.message || 'Erro desconhecido na API da Meta.';
            
            throw new Error(`Erro na API (${step}): ${errorMessage}`);
        }
        
        return data;

    } catch (error) {
        console.error(`[FETCH_ERROR] A chamada de rede para a Meta falhou na etapa '${step}'. URL: ${url}`, error);
        // Re-throw a more user-friendly error to be caught by the API route.
        if (error instanceof Error && error.message.includes('Erro na API')) {
            throw error;
        }
        throw new Error(`Falha de comunicação com os servidores da Meta. Verifique sua conexão ou as permissões de rede do ambiente. Etapa: ${step}.`);
    }
}
