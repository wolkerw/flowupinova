import * as admin from 'firebase-admin';
import serviceAccount from '@/service-account.json';

// Garante que a inicialização ocorra apenas uma vez
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccountCredential),
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
    });
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error: any) {
    console.error("Firebase Admin SDK initialization error:", error.message);
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export const adminApp = admin.apps[0];
