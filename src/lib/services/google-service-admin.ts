
"use server";

import { adminDb } from "@/lib/firebase-admin";
import { google } from "googleapis";
import type { BusinessProfileData } from "./business-profile-service";

/**
 * Retrieves the Google connection data (including the crucial refresh token) from Firestore.
 * @param userId The UID of the user.
 * @returns The user's Google connection data.
 * @throws An error if the connection data is not found or is invalid.
 */
async function getGoogleConnection(userId: string): Promise<any> {
    const connDoc = await adminDb.collection('users').doc(userId).collection('connections').doc('google').get();
    if (!connDoc.exists) {
        throw new Error("Conexão com o Google não encontrada.");
    }
    return connDoc.data();
}

/**
 * Creates and returns an authenticated Google OAuth2 client using the stored refresh token.
 * This client will automatically handle access token refreshing.
 * @param userId The UID of the user.
 * @returns An authenticated OAuth2 client instance.
 */
export async function getAuthenticatedGoogleClient(userId: string) {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        throw new Error("Credenciais do cliente Google não estão configuradas no servidor.");
    }
    if (!userId) {
        throw new Error("UserID é necessário para autenticar com o Google.");
    }
    
    // For server-side, we can directly access the stored refresh token
    const connectionData = await getGoogleConnection(userId);
    if (!connectionData.refreshToken) {
        throw new Error("Token de atualização do Google não encontrado. Por favor, reconecte sua conta.");
    }

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
        refresh_token: connectionData.refreshToken,
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
