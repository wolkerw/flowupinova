
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
export async function fetchGraphAPI(url: string, accessToken?: string, step?: string, method: 'GET' | 'POST' = 'GET', body: URLSearchParams | FormData | null = null) {
    const config: RequestInit = {
        method,
        headers: {},
        cache: 'no-store', // Essencial para chamadas de API OAuth
    };
    
    if (accessToken) {
        (config.headers as HeadersInit)['Authorization'] = `Bearer ${accessToken}`;
    }
    
    if (body && method === 'POST') {
        config.body = body;
    }

    try {
        console.log(`[GRAPH_API_REQUEST] Step: ${step} | URL: ${url}`);
        const response = await fetch(url, config);
        
        // Lê a resposta como texto bruto para evitar erros de parsing de JSON
        const text = await response.text();
        
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            // A resposta não era JSON, o que pode ser um erro de HTML da Meta ou falha de rede.
            console.error(`[GRAPH_API_PARSE_ERROR] Step: ${step} | Status: ${response.status} | Response (not JSON):`, text);
            throw new Error(`A API da Meta retornou uma resposta inesperada (não-JSON) na etapa: ${step}. Status: ${response.status}`);
        }

        console.log(`[GRAPH_API_RESPONSE] Step: ${step} | Status: ${response.status} | Data:`, JSON.stringify(data));

        // Se a resposta não for OK (status >= 400) ou contiver um objeto de erro
        if (!response.ok || data.error) {
            const errorMessage = data.error?.error_user_title 
                ? `${data.error.error_user_title}: ${data.error.error_user_msg}` 
                : data.error?.message || `Erro desconhecido na API da Meta em '${step}'.`;
            
            throw new Error(`Erro na API (${step}): ${errorMessage}`);
        }
        
        return data;

    } catch (networkError: any) {
        console.error(`[FETCH_NETWORK_ERROR] A chamada de rede para a Meta falhou na etapa '${step}'. URL: ${url}`, networkError);
        
        // Re-lança o erro para ser pego pelo bloco catch principal na rota da API
        // Se a mensagem já for um erro da nossa API, propaga. Senão, cria uma nova.
        if (networkError.message.includes('Erro na API')) {
            throw networkError;
        }
        throw new Error(`Falha de comunicação com os servidores da Meta. Verifique a rede. Etapa: ${step}. Detalhes: ${networkError.message}`);
    }
}
