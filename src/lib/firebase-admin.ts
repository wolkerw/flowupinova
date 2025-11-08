
import * as admin from 'firebase-admin';
import { cookies } from 'next/headers';

// Garante que a inicialização só ocorra uma vez.
// Em ambientes Google Cloud (como App Hosting), o SDK detecta as credenciais automaticamente.
if (!admin.apps.length) {
  try {
    admin.initializeApp();
    console.log("[ADMIN_SDK_INIT] Firebase Admin SDK inicializado com credenciais de ambiente padrão.");
  } catch (error: any) {
    console.error("[ADMIN_SDK_FATAL] Falha crítica ao inicializar o Firebase Admin SDK:", error);
    // Em um cenário de produção, você poderia lançar o erro
    // ou ter um mecanismo de fallback, mas para depuração, o log é crucial.
  }
} else {
    // This case is for hot-reloading in development.
    // It's useful to know the SDK was already initialized.
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
 * @throws An error if the user is not authenticated or the token is invalid.
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
        // Propaga o erro detalhado da função verifyIdToken para fornecer mais contexto.
        throw new Error(`Falha na verificação do usuário Firebase. ${error.message}`);
    }
}
