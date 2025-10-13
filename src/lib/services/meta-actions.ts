
"use server";

import admin from "firebase-admin";
import { App, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import serviceAccount from "@/service-account.json";

function initializeAdminApp(): App {
  if (getApps().length) {
    return getApp();
  }
  try {
    return initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccountCredential),
    });
  } catch (error: any) {
    console.error("Firebase Admin Initialization Error:", error.message);
    throw new Error("Failed to initialize Firebase Admin SDK.");
  }
}

/**
 * Exchanges a Meta authorization code for an access token and updates the user's connection status in Firestore.
 * This is a Server Action and should only be called from the server or other server actions.
 *
 * @param code - The authorization code received from Meta OAuth.
 * @param userId - The Firebase UID of the user.
 * @returns An object indicating success or failure.
 */
export async function exchangeMetaCode(code: string, userId: string): Promise<{ success: boolean; error?: string }> {
  if (!userId) {
    console.error("exchangeMetaCode called without userId.");
    return { success: false, error: "Usuário não autenticado." };
  }

  // Ensure Firebase Admin is initialized
  const adminApp = initializeAdminApp();
  const adminDb = getFirestore(adminApp);

  const clientId = process.env.META_APP_ID || "826418333144156";
  const clientSecret = process.env.META_APP_SECRET || "944e053d34b162c13408cd00ad276aa2";
  
  const redirectUri = "https://9000-firebase-studio-1757951248950.cluster-57i2ylwve5fskth4xb2kui2ow2.cloudworkstations.dev/dashboard/conteudo";

  if (!clientId || !clientSecret) {
    const errorMsg = "Credenciais da Meta não estão configuradas no servidor.";
    console.error(errorMsg);
    return { success: false, error: errorMsg };
  }

  const tokenUrl = `https://graph.facebook.com/v20.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`;

  try {
    // 1. Exchange code for an access token
    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("Meta Token Exchange Error:", tokenData);
      throw new Error(tokenData.error?.message || "Falha ao obter token de acesso da Meta.");
    }

    // 2. Update connection status in Firestore using Admin SDK
    const metaConnectionRef = adminDb.doc(`users/${userId}/connections/meta`);
    await metaConnectionRef.set({
      isConnected: true,
      connectedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    console.log(`Meta connection successful for user: ${userId}`);
    return { success: true };

  } catch (error: any) {
    console.error("Error during Meta code exchange or Firestore update:", error);
    return { success: false, error: error.message || "Ocorreu um erro desconhecido." };
  }
}

    