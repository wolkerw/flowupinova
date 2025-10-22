
import * as admin from 'firebase-admin';

// Em ambientes Google Cloud (como App Hosting), o SDK encontra as credenciais automaticamente.
// Não é necessário carregar o arquivo service-account.json manualmente.
if (!admin.apps.length) {
  try {
    admin.initializeApp({
        // Adicionar o databaseURL reforça a conexão com o banco de dados correto.
        databaseURL: `https://studio-7502195980-3983c.firebaseio.com`
    });
    console.log("Firebase Admin SDK initialized using application default credentials.");
  } catch (error: any) {
    console.error("Firebase Admin initialization error:", error.message);
    // Para depuração, podemos tentar inicializar com o arquivo se o padrão falhar (útil para dev local).
    try {
        const serviceAccount = require('../../../service-account.json');
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: `https://studio-7502195980-3983c.firebaseio.com`
        });
        console.log("Firebase Admin SDK initialized using service-account.json as a fallback.");
    } catch (fallbackError: any) {
        console.error("Fallback Firebase Admin initialization failed:", fallbackError.message);
    }
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
