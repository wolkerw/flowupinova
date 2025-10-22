
import * as admin from 'firebase-admin';

// Em ambientes de nuvem, às vezes a detecção automática de credenciais pode falhar
// ou apontar para o projeto errado. Para garantir a conexão correta no Firebase Studio,
// vamos forçar o uso do arquivo de conta de serviço.
if (!admin.apps.length) {
  try {
    console.log("[ADMIN_SDK_INIT] Attempting to initialize with service-account.json...");
    // O `require` funciona aqui porque o Next.js agrupa os arquivos JSON.
    const serviceAccount = require('../../service-account.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        // Adicionar o databaseURL reforça a conexão com o banco de dados correto.
        databaseURL: `https://studio-7502195980-3983c.firebaseio.com`
    });
    console.log("[ADMIN_SDK_INIT] Firebase Admin SDK initialized successfully using service-account.json.");
  } catch (error: any) {
    console.error("[ADMIN_SDK_INIT] Firebase Admin initialization failed:", error.message);
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
