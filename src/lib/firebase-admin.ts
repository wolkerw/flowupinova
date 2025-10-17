
import * as admin from 'firebase-admin';

// As credenciais de serviço são importadas diretamente do arquivo JSON.
// Isso é seguro porque este código roda exclusivamente no servidor.
import serviceAccount from '@/service-account.json';

// Evita a reinicialização do app em ambientes de desenvolvimento.
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      // Adicione a URL do seu Realtime Database se estiver usando
      // databaseURL: "https://<DATABASE_NAME>.firebaseio.com",
    });
    console.log("Firebase Admin SDK initialized.");
  } catch (error: any) {
    console.error("Firebase Admin initialization error:", error.message);
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
    console.error("Error verifying ID token:", error);
    throw new Error("Token inválido ou expirado.");
  }
}
