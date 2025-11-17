
"use server";

import { adminDb } from "@/lib/firebase-admin";
import { google } from "googleapis";
import type { BusinessProfileData } from "./business-profile-service";
import type { MetaConnectionData } from "./meta-service";

/**
 * Retrieves the Meta connection data, which includes the necessary Google access token.
 * @param userId The UID of the user.
 * @returns The user's Meta/Google connection data.
 * @throws An error if the connection data is not found or is invalid.
 */
async function getMetaConnectionForGoogle(userId: string): Promise<MetaConnectionData> {
    const connDoc = await adminDb.collection('users').doc(userId).collection('connections').doc('meta').get();
    if (!connDoc.exists) {
        throw new Error("Conexão com a Meta/Google não encontrada. Por favor, reconecte sua conta.");
    }
    return connDoc.data() as MetaConnectionData;
}


/**
 * Creates and returns an authenticated Google OAuth2 client using the stored access token.
 * This is a simplified client for making direct API calls, as we are not using a refresh token flow here.
 * The access token is expected to be a long-lived page access token.
 * @param userId The UID of the user.
 * @returns An authenticated OAuth2 client instance.
 */
export async function getAuthenticatedGoogleClient(userId: string) {
    if (!userId) {
        throw new Error("UserID é necessário para autenticar com o Google.");
    }
    
    // The access token is stored in the 'meta' connection document.
    const connectionData = await getMetaConnectionForGoogle(userId);
    if (!connectionData.accessToken) {
        throw new Error("Token de acesso do Google não encontrado. Por favor, reconecte sua conta.");
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
        access_token: connectionData.accessToken,
    });

    return oauth2Client;
}


/**
 * Fetches the business profile using the admin SDK, focusing on the googleName.
 * @param userId - The UID of the user.
 * @returns The user's business profile data.
 */
export async function getGoogleBusinessProfile(userId: string): Promise<BusinessProfileData> {
    const profileDocRef = adminDb.collection('users').doc(userId).collection('business').doc('profile');
    const docSnap = await profileDocRef.get();

    if (!docSnap.exists) {
        throw new Error("Perfil de negócio não encontrado para o usuário.");
    }
    
    return docSnap.data() as BusinessProfileData;
}
