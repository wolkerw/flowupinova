"use server";

import { admin, adminDb } from "@/lib/firebase-admin";
import { getUserStoragePathAdmin } from "@/lib/services/storage-utils-admin";
import { google } from "googleapis";
import crypto from "crypto";
import type { BusinessProfileData } from "./business-profile-service";
import type { GoogleConnectionData } from "./google-service";

/**
 * Retrieves the Google connection data.
 * @param userId The UID of the user.
 * @returns The user's Google connection data.
 * @throws An error if the connection data is not found or is invalid.
 */
async function getGoogleConnectionAdmin(userId: string): Promise<GoogleConnectionData> {
  const connDoc = await adminDb
    .collection("users")
    .doc(userId)
    .collection("connections")
    .doc("google")
    .get();
  if (!connDoc.exists) {
    throw new Error("Conexão com o Google não encontrada. Por favor, reconecte sua conta.");
  }
  return connDoc.data() as GoogleConnectionData;
}

/**
 * Creates and returns an authenticated Google OAuth2 client using the stored refresh token.
 * This client can be used to make authenticated API calls.
 * @param userId The UID of the user.
 * @returns An authenticated OAuth2 client instance.
 */
export async function getAuthenticatedGoogleClient(userId: string) {
  if (!userId) {
    throw new Error("UserID é necessário para autenticar com o Google.");
  }

  const connectionData = await getGoogleConnectionAdmin(userId);
  if (!connectionData.refreshToken) {
    throw new Error(
      "Token de atualização do Google não encontrado. Por favor, reconecte sua conta."
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    refresh_token: connectionData.refreshToken,
  });

  // A biblioteca irá usar o refresh token para buscar um novo access token automaticamente na primeira chamada.
  return oauth2Client;
}

/**
 * Fetches the business profile using the admin SDK, focusing on the googleName.
 * @param userId - The UID of the user.
 * @returns The user's business profile data.
 */
export async function getGoogleBusinessProfile(userId: string): Promise<BusinessProfileData> {
  const profileDocRef = adminDb
    .collection("users")
    .doc(userId)
    .collection("business")
    .doc("profile");
  const docSnap = await profileDocRef.get();

  if (!docSnap.exists) {
    throw new Error("Perfil de negócio não encontrado para o usuário.");
  }

  return docSnap.data() as BusinessProfileData;
}

/**
 * Realiza upload direto e nativo para o Firebase Storage, retornando uma URL pública acessível para a API do Google My Business.
 * @param file O arquivo File recebido no FormData.
 * @param userId UID do usuário.
 * @param subfolder Subpasta de organização (ex: 'cover', 'logo', 'gallery').
 * @returns URL pública permanente no Firebase Storage.
 */
export async function uploadGoogleMediaToStorage(
  file: File,
  userId: string,
  subfolder: string = "google"
): Promise<string> {
  let buffer: Buffer;
  if (typeof file.arrayBuffer === "function") {
    buffer = Buffer.from(await file.arrayBuffer());
  } else if (typeof (file as any).bytes === "function") {
    buffer = Buffer.from(await (file as any).bytes());
  } else if (typeof (file as any).text === "function") {
    buffer = Buffer.from(await (file as any).text());
  } else {
    buffer = Buffer.from(file as any);
  }
  const userStoragePath = await getUserStoragePathAdmin(userId);
  const dateStr = new Date()
    .toISOString()
    .replace(/T/, "_")
    .replace(/\..+/, "")
    .replace(/[^0-9_]/g, "");

  const bucket = admin.storage().bucket();
  const ext = file.type?.includes("png") ? "png" : "jpg";
  const filename = `${userStoragePath}/google/${subfolder}/${dateStr}_${crypto.randomUUID().substring(0, 8)}.${ext}`;
  const fileRef = bucket.file(filename);
  const downloadToken = crypto.randomUUID();

  const savePromise = fileRef.save(buffer, {
    metadata: {
      contentType: file.type || "image/jpeg",
      metadata: {
        firebaseStorageDownloadTokens: downloadToken,
        userId,
        source: "google_my_business",
        subfolder,
      },
    },
  });

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Storage upload timeout")), 15000)
  );

  await Promise.race([savePromise, timeoutPromise]);

  const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileRef.name)}?alt=media&token=${downloadToken}`;
  console.log(`[GOOGLE_STORAGE_UPLOAD] Foto do Google salva com sucesso no Storage: ${publicUrl}`);
  return publicUrl;
}

