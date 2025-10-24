
import { cookies } from 'next/headers';
import { verifyIdToken } from './firebase-admin';

/**
 * Retrieves the user's UID from the ID token stored in cookies.
 * This is a server-side utility.
 * @returns The user's UID string, or null if not authenticated.
 */
export async function getUidFromIdToken(): Promise<string | null> {
    const cookieStore = cookies();
    const idTokenCookie = cookieStore.get('fb-id-token');

    if (!idTokenCookie?.value) {
        console.warn("getUidFromIdToken: No ID token cookie found.");
        return null;
    }

    try {
        const decodedToken = await verifyIdToken(idTokenCookie.value);
        return decodedToken.uid;
    } catch (error) {
        console.error("Error verifying ID token in getUidFromIdToken:", error);
        return null;
    }
}
