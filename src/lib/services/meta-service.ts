
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

const defaultMeta: Omit<MetaConnectionData, 'userAccessToken'> = {
    isConnected: false,
};

/**
 * Retrieves the Meta connection data for a specific user.
 * This function is safe and will never throw an error.
 * @param userId The UID of the user.
 * @returns The user's Meta connection data, or default values if not found or on error.
 */
export async function getMetaConnection(userId: string): Promise<MetaConnectionData> {
    if (!userId) {
        console.error("getMetaConnection called without a userId.");
        return { ...defaultMeta };
    }
    try {
        const metaDocRef = doc(db, "users", userId, "integrations", "meta");
        const docSnap = await getDoc(metaDocRef);

        if (docSnap.exists()) {
            return docSnap.data() as MetaConnectionData;
        } else {
            // If the document doesn't exist, create it with default values.
            await setDoc(metaDocRef, defaultMeta, { merge: true });
            return { ...defaultMeta };
        }
    } catch (error) {
        console.error(`Error getting Meta connection for user ${userId}:`, error);
        return { ...defaultMeta }; // Return default on read error
    }
}

/**
 * Safely updates or creates the Meta connection document for a specific user.
 * This function will never throw an error to prevent breaking critical auth flows.
 * @param userId The UID of the user.
 * @param data The partial data to update.
 */
export async function saveUserTokenSafely(userId: string, data: Partial<MetaConnectionData>): Promise<void> {
    if (!userId) {
        console.error("CRITICAL: saveUserTokenSafely called without a userId.");
        return;
    }
    try {
        const metaDocRef = doc(db, "users", userId, "integrations", "meta");
        // Use set with merge:true to create or update the document.
        await setDoc(metaDocRef, data, { merge: true });
        console.log(`Meta connection data updated safely for user ${userId}.`);
    } catch (error) {
        // Only log the error, don't re-throw.
        console.error(`CRITICAL: Failed to save Meta token safely for user ${userId}:`, error);
    }
}


/**
 * Fetches data from the Graph API robustly.
 * @param url The full URL for the Graph API endpoint.
 * @param step A descriptive name for the API call step for logging.
 * @returns The JSON data from the API.
 */
export async function fetchGraphAPI(url: string, step: string) {
    try {
        const response = await fetch(url, {
            cache: 'no-store',
        });
        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error(`[GRAPH_API_PARSE_ERROR] Step: ${step} | Status: ${response.status} | Response:`, text);
            throw new Error(`A API da Meta retornou uma resposta inesperada (não-JSON) na etapa: ${step}.`);
        }

        if (!response.ok || data.error) {
            const errorMessage = data.error?.message || `Erro desconhecido na API da Meta em '${step}'.`;
            throw new Error(`Erro na API (${step}): ${errorMessage}`);
        }
        
        return data;
    } catch (networkError: any) {
        console.error(`[FETCH_NETWORK_ERROR] Etapa: '${step}'.`, networkError);
        throw new Error(`Falha de comunicação com os servidores da Meta. Detalhes: ${networkError.message}`);
    }
}


/**
 * Fetches page and Instagram account details and saves them to Firestore for a specific user.
 * This function is intended to be called in the background.
 * @param userId The UID of the user.
 * @param userAccessToken The short-lived or long-lived user access token.
 */
export async function getAndSaveUserDetails(userId: string, userAccessToken: string): Promise<void> {
     if (!userId) {
        console.error("[BACKGROUND_ERROR] getAndSaveUserDetails called without userId.");
        return;
    }
    try {
        const pagesListUrl = `https://graph.facebook.com/v20.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,name,username,followers_count,profile_picture_url}&limit=10&access_token=${userAccessToken}`;
        const pagesData = await fetchGraphAPI(pagesListUrl, "Fetch User Pages");

        if (!pagesData.data || pagesData.data.length === 0) {
            throw new Error("Nenhuma Página do Facebook foi encontrada para esta conta.");
        }

        const pageWithIg = pagesData.data.find((p: any) => p.instagram_business_account);
        if (!pageWithIg) {
            throw new Error("Nenhuma de suas Páginas do Facebook possui uma conta do Instagram Business vinculada.");
        }

        const { access_token: pageToken, id: facebookPageId, name: facebookPageName, instagram_business_account: igAccount } = pageWithIg;
        
        await saveUserTokenSafely(userId, {
            userAccessToken,
            pageToken,
            facebookPageId,
            facebookPageName,
            instagramAccountId: igAccount.id,
            instagramAccountName: igAccount.username,
            igFollowersCount: igAccount.followers_count,
            igProfilePictureUrl: igAccount.profile_picture_url,
            isConnected: true,
        });

        console.log(`[BACKGROUND_SUCCESS] User details fetched and saved for user ${userId}.`);

    } catch (error: any) {
        console.error(`[BACKGROUND_ERROR] Failed to get and save user details for user ${userId}:`, error.message);
        // On failure, save the token with disconnected status and the error.
        await saveUserTokenSafely(userId, {
            userAccessToken,
            isConnected: false,
        });
    }
}
