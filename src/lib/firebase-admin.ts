import * as admin from 'firebase-admin';
import serviceAccount from '@/service-account.json';

let adminApp: admin.app | null = null;

function initializeAdminApp() {
  if (!admin.apps.length) {
    try {
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccountCredential),
        databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
      });
      console.log("Firebase Admin SDK initialized successfully.");
    } catch (error: any) {
      console.error("Firebase Admin SDK initialization error:", error.message);
      // Lançar o erro pode ajudar a depurar problemas de inicialização
      throw error;
    }
  } else {
    adminApp = admin.apps[0];
  }
}

// Chame a inicialização uma vez no carregamento do módulo
initializeAdminApp();

export function getAdmin() {
  if (!adminApp) {
    // Isso não deve acontecer se a lógica acima estiver correta, mas é uma salvaguarda.
    initializeAdminApp();
  }
  return {
    app: adminApp!,
    db: adminApp!.firestore(),
    auth: adminApp!.auth()
  };
}
