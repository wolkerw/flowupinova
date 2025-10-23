
import * as admin from 'firebase-admin';

// Em ambientes de nuvem, às vezes a detecção automática de credenciais pode falhar
// ou apontar para o projeto errado. Para garantir a conexão correta no Firebase Studio,
// vamos forçar o uso do arquivo de conta de serviço quando disponível.
if (!admin.apps.length) {
  try {
    // A variável de ambiente SERVICE_ACCOUNT_JSON é injetada pelo ambiente do Firebase Studio.
    const serviceAccountString = process.env.SERVICE_ACCOUNT_JSON;
    if (serviceAccountString) {
        const serviceAccount = JSON.parse(serviceAccountString);
        console.log("[ADMIN_SDK_INIT] Initializing with SERVICE_ACCOUNT_JSON env var...");
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: `https://studio-7502195980-3983c.firebaseio.com`
        });
        console.log("[ADMIN_SDK_INIT] Firebase Admin SDK initialized successfully from env var.");
    } else {
        console.log("[ADMIN_SDK_INIT] Attempting to initialize with default credentials (env var not found)...");
        // Se a variável de ambiente não estiver disponível, cai para o comportamento padrão,
        // que funciona bem em muitos ambientes do Google Cloud.
        admin.initializeApp({
             databaseURL: `https://studio-7502195980-3983c.firebaseio.com`
        });
         console.log("[ADMIN_SDK_INIT] Firebase Admin SDK initialized successfully with default credentials.");
    }
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
