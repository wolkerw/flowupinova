
import * as admin from 'firebase-admin';
import serviceAccount from '@/service-account.json';

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
