
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
    console.log("[ADMIN_SDK_INIT] Firebase Admin SDK inicializado com credenciais de Service Account.");
  } catch (error: any) {
    console.error("[ADMIN_SDK_FATAL] Falha crítica ao inicializar o Firebase Admin SDK:", error);
    // Em um ambiente de produção, você pode querer lançar o erro
    // para impedir que a aplicação continue em um estado inválido.
    // throw new Error("Não foi possível inicializar o Firebase Admin.");
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
  } catch (error: any) {
    console.error(`Erro detalhado ao verificar o ID token: (${error.code}) ${error.message}`);
    // Lança um erro mais detalhado para o chamador
    throw new Error(`O token do Firebase é inválido. Motivo: ${error.message}`);
  }
}

/**
 * Retrieves the user's UID from the ID token stored in cookies on the server-side.
 * This is a server-side utility.
 * @returns The user's UID string.
 * @throws An error if the user is not authenticated.
 */
export async function getUidFromCookie(): Promise<string> {
    const cookieStore = cookies();
    const idTokenCookie = cookieStore.get('firebase-id-token');

    if (!idTokenCookie?.value) {
        throw new Error("Falha na verificação do usuário Firebase. O cookie de autenticação não foi encontrado.");
    }

    try {
        const decodedToken = await verifyIdToken(idTokenCookie.value);
        return decodedToken.uid;
    } catch (error: any) {
        console.error("Error verifying ID token from cookie:", error.message);
        // Propaga o erro detalhado da função verifyIdToken
        throw new Error(`Falha na verificação do usuário Firebase. ${error.message}`);
    }
}
