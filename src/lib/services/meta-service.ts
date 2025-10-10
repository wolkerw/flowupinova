
'use server';

import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { META_APP_ID, META_APP_SECRET } from "@/lib/config";

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
    error?: string;
}

const defaultMeta: Omit<MetaConnectionData, 'userAccessToken'> = {
    isConnected: false,
};

/**
 * Retrieves the Meta connection data for a specific user.
 * @param userId The UID of the user.
 * @returns The user's Meta connection data, or a default object with isConnected: false if not found.
 * @throws Will throw an error if Firestore read fails.
 */
export async function getMetaConnection(userId: string): Promise<MetaConnectionData> {
    if (!userId) {
        console.error("getMetaConnection called without a userId.");
        // Return a disconnected state without throwing, as this is often a recoverable state.
        return { isConnected: false, error: "User not found." };
    }
    try {
        const metaDocRef = doc(db, "users", userId, "integrations", "meta");
        const docSnap = await getDoc(metaDocRef);

        if (docSnap.exists()) {
            return docSnap.data() as MetaConnectionData;
        } else {
            // Document doesn't exist, this is a clean state, not an error.
            return { isConnected: false };
        }
    } catch (error: any) {
        console.error(`Error getting Meta connection for user ${userId}:`, error);
        // Re-throw a more specific error for the UI to handle.
        throw new Error("Falha ao buscar os dados de conexão da Meta.");
    }
}

/**
 * Safely updates or creates the Meta connection document for a specific user.
 * @param userId The UID of the user.
 * @param data The partial data to update.
 * @throws Will throw an error if Firestore write fails.
 */
export async function saveUserToken(userId: string, data: Partial<MetaConnectionData>): Promise<void> {
    if (!userId) {
        console.error("CRITICAL: saveUserToken called without a userId.");
        throw new Error("ID do usuário é obrigatório para salvar o token.");
    }
    try {
        const metaDocRef = doc(db, "users", userId, "integrations", "meta");
        // Use set with merge:true to create or update the document.
        await setDoc(metaDocRef, data, { merge: true });
        console.log(`Meta connection data updated successfully for user ${userId}.`);
    } catch (error: any) {
        console.error(`CRITICAL: Failed to save Meta token for user ${userId}:`, error);
        throw new Error("Não foi possível salvar os dados de conexão no banco de dados.");
    }
}


/**
 * Fetches data from the Graph API robustly.
 * @param url The full URL for the Graph API endpoint.
 * @param step A descriptive name for the API call step for logging.
 * @returns The JSON data from the API.
 * @throws Will throw if the API call fails or returns an error.
 */
export async function fetchGraphAPI(url: string, step: string): Promise<any> {
    const response = await fetch(url, { cache: 'no-store' });
    const data = await response.json();

    if (!response.ok || data.error) {
        const errorMessage = data.error?.message || `Erro desconhecido na API da Meta em '${step}'.`;
        console.error(`[GRAPH_API_ERROR] Step: ${step} | Status: ${response.status} | Response:`, data);
        throw new Error(`Erro na API (${step}): ${errorMessage}`);
    }
    
    return data;
}


/**
 * Exchanges a short-lived code for a long-lived token and fetches user details.
 * @param userId The UID of the user.
 * @param code The authorization code from Meta.
 * @param redirectUri The exact redirect URI used to initiate the OAuth flow.
 * @throws Will throw an error if any step in the process fails.
 */
export async function getAndSaveUserDetails(userId: string, code: string, redirectUri: string): Promise<void> {
     if (!userId || !code) {
        throw new Error("UserId e código são obrigatórios.");
    }
    if (!redirectUri) {
        throw new Error("A URL de redirecionamento da Meta não está configurada.");
    }

    // Step 1: Exchange short-lived code for a short-lived token
    const tokenUrl = `https://graph.facebook.com/v20.0/oauth/access_token?client_id=${META_APP_ID}&redirect_uri=${redirectUri}&client_secret=${META_APP_SECRET}&code=${code}`;
    const tokenData = await fetchGraphAPI(tokenUrl, "Troca de Código por Token");
    const shortLivedToken = tokenData.access_token;
    if (!shortLivedToken) {
        throw new Error("Não foi possível obter o token de acesso de curta duração.");
    }

    // Step 2: Exchange short-lived token for a long-lived token
    const longLivedUrl = `https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${shortLivedToken}`;
    const longLivedData = await fetchGraphAPI(longLivedUrl, "Troca para Token de Longa Duração");
    const longLivedToken = longLivedData.access_token;
    if (!longLivedToken) {
        throw new Error("Não foi possível obter o token de acesso de longa duração.");
    }

    // Step 3: Fetch user's pages and connected Instagram accounts
    const pagesUrl = `https://graph.facebook.com/v20.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,name,username,followers_count,profile_picture_url}&limit=10&access_token=${longLivedToken}`;
    const pagesData = await fetchGraphAPI(pagesUrl, "Busca de Páginas e Contas do Instagram");
    
    if (!pagesData.data || pagesData.data.length === 0) {
        throw new Error("Nenhuma Página do Facebook foi encontrada para esta conta.");
    }

    const pageWithIg = pagesData.data.find((p: any) => p.instagram_business_account);
    if (!pageWithIg) {
        throw new Error("Nenhuma de suas Páginas do Facebook possui uma conta do Instagram Business vinculada.");
    }

    const { access_token: pageToken, id: facebookPageId, name: facebookPageName, instagram_business_account: igAccount } = pageWithIg;
    
    // Step 4: Save all relevant data to Firestore
    await saveUserToken(userId, {
        userAccessToken: longLivedToken,
        pageToken,
        facebookPageId,
        facebookPageName,
        instagramAccountId: igAccount.id,
        instagramAccountName: igAccount.username,
        igFollowersCount: igAccount.followers_count,
        igProfilePictureUrl: igAccount.profile_picture_url,
        isConnected: true,
        error: '', // Clear any previous errors
    });

    console.log(`[META_SUCCESS] Dados do usuário salvos com sucesso para ${userId}.`);
}
