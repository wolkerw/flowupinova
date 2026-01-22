
import { getUidFromCookie } from "@/lib/firebase-admin";
import { getBusinessProfileAdmin } from "@/lib/services/business-profile-service-admin";
import MeuNegocioPageClient from "./page.client";

export const dynamic = 'force-dynamic';

export default async function MeuNegocioPage() {
    // This is a server component, so we can fetch data directly.
    let uid: string | null = null;
    try {
        uid = await getUidFromCookie();
    } catch (error) {
        // The cookie might not be present during pre-renders or if the user is logged out.
        // In this case, uid will be null, and getBusinessProfileAdmin will return a default profile.
        // The client-side AuthProvider will then handle redirection to the login page.
        console.warn("Could not get UID from cookie during server render. This is expected if the user is not logged in.");
    }

    const initialProfile = await getBusinessProfileAdmin(uid);

    return <MeuNegocioPageClient initialProfile={initialProfile} />;
}
