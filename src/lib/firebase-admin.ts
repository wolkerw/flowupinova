
import * as admin from 'firebase-admin';
import serviceAccount from '@/service-account.json';
import { cookies } from 'next/headers';

// Garante que a inicialização só ocorra uma vez, forçando o uso do service-account.json.
// Este é o método mais robusto para ambientes de nuvem onde a detecção automática pode falhar.
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      databaseURL: `https://studio-7502195980-3983c.firebaseio.com`
    });
    console.log("[ADMIN_SDK_INIT] Firebase Admin SDK inicializado com sucesso a partir do service-account.json importado.");
  } catch (error: any) {
    console.error("[ADMIN_SDK_INIT] Erro Crítico: A inicialização do Firebase Admin a partir do service-account.json falhou:", error.message);
  }
}

const adminAuth = admin.auth();
const adminDb = admin.firestore();

export { admin, adminAuth, adminDb };

/**
 * Verifica o ID Token do Firebase enviado pelo cliente.
 * @param idToken O token a ser verificado.
 * @returns O token decodificado se for válido.
 * @throws Uma exceção se o token for inválido.
 */
export async function verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error("Erro ao verificar o ID token:", error);
    throw new Error("Token inválido ou expirado.");
  }
}

/**
 * Retrieves the user's UID from the ID token stored in cookies on the server-side.
 * This is a server-side utility.
 * @returns The user's UID string, or null if not authenticated.
 */
export async function getUidFromCookie(): Promise<string | null> {
    const cookieStore = cookies();
    const idTokenCookie = cookieStore.get('fb-id-token');

    if (!idTokenCookie?.value) {
        console.log("No ID token cookie found in server action.");
        return null;
    }

    try {
        const decodedToken = await verifyIdToken(idTokenCookie.value);
        return decodedToken.uid;
    } catch (error) {
        console.error("Error verifying ID token from cookie:", error);
        return null;
    }
}
