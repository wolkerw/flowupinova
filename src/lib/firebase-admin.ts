
import * as admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import { cookies } from 'next/headers';

// This is the Singleton pattern for the Firebase Admin SDK.
// It ensures that initialization happens only once across the server's lifecycle.
if (!getApps().length) {
    admin.initializeApp();
}

const adminAuth = admin.auth();
const adminDb = admin.firestore();

export { admin, adminAuth, adminDb };

/**
 * Verifies the Firebase ID Token sent from the client.
 * @param idToken The token to verify.
 * @returns The decoded token if valid.
 * @throws An exception if the token is invalid.
 */
export async function verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error: any) {
    console.error(`Detailed error verifying ID token: (${error.code}) ${error.message}`);
    // Throw a more detailed error to the caller
    throw new Error(`The Firebase token is invalid. Reason: ${error.message}`);
  }
}

/**
 * Retrieves the user's UID from the ID token stored in cookies on the server-side.
 * This is a server-side utility.
 * @returns The user's UID string.
 * @throws An error if the user is not authenticated or the token is invalid.
 */
export async function getUidFromCookie(): Promise<string> {
    const cookieStore = cookies();
    const idTokenCookie = cookieStore.get('firebase-id-token');

    if (!idTokenCookie?.value) {
        throw new Error("Firebase user verification failed. Authentication cookie not found.");
    }

    try {
        const decodedToken = await verifyIdToken(idTokenCookie.value);
        return decodedToken.uid;
    } catch (error: any) {
        console.error("Error verifying ID token from cookie:", error.message);
        // Propagate the detailed error from the verifyIdToken function to provide more context.
        throw new Error(`Firebase user verification failed. ${error.message}`);
    }
}
