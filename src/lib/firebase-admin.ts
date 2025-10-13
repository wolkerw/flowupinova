

import type { ServiceAccount } from 'firebase-admin/app';
// Use require for compatibility with Next.js bundling
const admin = require('firebase-admin');
import serviceAccount from '@/service-account.json';

let adminApp: admin.app.App | null = null;

function initializeAdminApp() {
  if (!admin.apps.length) {
    try {
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as ServiceAccount),
        databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
      });
      console.log("Firebase Admin SDK initialized successfully.");
    } catch (error: any) {
      console.error("Firebase Admin SDK initialization error:", error.message);
      // Throwing the error can help debug initialization issues
      throw error;
    }
  } else {
    adminApp = admin.apps[0];
  }
}

// Call initialization once on module load
initializeAdminApp();

export function getAdmin() {
  if (!adminApp) {
    // This should not happen if the logic above is correct, but it's a safeguard.
    initializeAdminApp();
  }
  return {
    app: adminApp!,
    db: adminApp!.firestore(),
    auth: adminApp!.auth()
  };
}
