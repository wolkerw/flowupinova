
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

/**
 * Função segura que busca os dados da conexão Meta. Nunca lança erro.
 * Em caso de falha, retorna os dados padrão com isConnected: false.
 */
export async function getMetaConnection(): Promise<MetaConnectionData> {
    try {
        const docSnap = await getDoc(metaDocRef);
        if (docSnap.exists()) {
            return docSnap.data() as MetaConnectionData;
        } else {
            // Se o documento não existe, cria com os valores padrão.
            await setDoc(metaDocRef, defaultMeta);
            return defaultMeta;
        }
    } catch (error) {
        console.error("Error getting Meta connection:", error);
        return defaultMeta; // Retorna o padrão em caso de erro de leitura
    }
}

/**
 * Função segura que atualiza ou cria o documento de conexão da Meta.
 * Envolve a chamada em um try-catch para NUNCA lançar um erro e quebrar o fluxo de callback.
 */
export async function saveUserTokenSafely(data: Partial<MetaConnectionData>): Promise<void> {
    try {
        const docSnap = await getDoc(metaDocRef);
        if (docSnap.exists()) {
            await updateDoc(metaDocRef, data);
        } else {
            // Garante que o documento seja criado se não existir.
            await setDoc(metaDocRef, { ...defaultMeta, ...data });
        }
        console.log("Meta connection data updated safely.");
    } catch (error) {
        // Apenas loga o erro, não o lança novamente.
        console.error("CRITICAL: Failed to save Meta token safely:", error);
    }
}

/**
 * Realiza uma chamada à Graph API de forma robusta.
 */
export async function fetchGraphAPI(url: string, accessToken: string, step: string) {
    try {
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${accessToken}` },
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
 * Busca os detalhes da página e conta do Instagram e salva tudo no Firestore.
 * Esta função é chamada em segundo plano para não bloquear o callback.
 */
export async function getAndSaveUserDetails(userAccessToken: string): Promise<void> {
    try {
        const pagesListUrl = `https://graph.facebook.com/v20.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,name,username,followers_count,profile_picture_url}&limit=10`;
        const pagesData = await fetchGraphAPI(pagesListUrl, userAccessToken, "Fetch User Pages");

        if (!pagesData.data || pagesData.data.length === 0) {
            throw new Error("Nenhuma Página do Facebook foi encontrada para esta conta.");
        }

        const pageWithIg = pagesData.data.find((p: any) => p.instagram_business_account);
        if (!pageWithIg) {
            throw new Error("Nenhuma de suas Páginas do Facebook possui uma conta do Instagram Business vinculada.");
        }

        const { access_token: pageToken, id: facebookPageId, name: facebookPageName, instagram_business_account: igAccount } = pageWithIg;
        
        await saveUserTokenSafely({
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

        console.log("[BACKGROUND_SUCCESS] User details fetched and saved successfully.");

    } catch (error: any) {
        console.error("[BACKGROUND_ERROR] Failed to get and save user details:", error.message);
        // Se falhar, salva o token com o status de desconectado e o erro.
        await saveUserTokenSafely({
            userAccessToken,
            isConnected: false,
        });
    }
}

// Manter a função updateMetaConnection por retrocompatibilidade, mas delegar para a versão segura.
export async function updateMetaConnection(data: Partial<MetaConnectionData>): Promise<void> {
    await saveUserTokenSafely(data);
}
