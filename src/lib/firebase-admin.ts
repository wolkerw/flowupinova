
import * as admin from 'firebase-admin';
import serviceAccount from '@/service-account.json';

// Converte a conta de serviço para o formato esperado pelo SDK
const serviceAccountParams = {
    type: serviceAccount.type,
    projectId: serviceAccount.project_id,
    privateKeyId: serviceAccount.private_key_id,
    privateKey: serviceAccount.private_key,
    clientEmail: serviceAccount.client_email,
    clientId: serviceAccount.client_id,
    authUri: serviceAccount.auth_uri,
    tokenUri: serviceAccount.token_uri,
    authProviderX509CertUrl: serviceAccount.auth_provider_x509_cert_url,
    clientX509CertUrl: serviceAccount.client_x509_cert_url,
};


// Garante que a inicialização só ocorra uma vez.
// Força o uso do service-account.json para garantir autenticação robusta no ambiente de nuvem.
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountParams),
      databaseURL: `https://studio-7502195980-3983c.firebaseio.com`
    });
    console.log("[ADMIN_SDK_INIT] Firebase Admin SDK initialized successfully from imported service-account.json.");
  } catch (error: any) {
    console.error("[ADMIN_SDK_INIT] Critical Error: Firebase Admin initialization failed from service-account.json:", error.message);
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
