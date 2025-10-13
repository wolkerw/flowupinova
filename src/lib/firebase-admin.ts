import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// IMPORTANT: Path is relative to the root of the project, where the app is started
const serviceAccount = require('../../src/service-account.json');

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  return initializeApp({
    credential: cert(serviceAccount),
    databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`,
  });
}

const adminApp = getAdminApp();
const adminDb: Firestore = getFirestore(adminApp);

export { adminApp, adminDb };
