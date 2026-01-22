
import { getUidFromCookie } from "@/lib/firebase-admin";
import { getBusinessProfileAdmin } from "@/lib/services/business-profile-service-admin";
import MeuNegocioPageClient from "./page.client";

export const dynamic = 'force-dynamic';

export default async function MeuNegocioPage() {
    // This is a server component, so we can fetch data directly.
    // The layout ensures the user is authenticated.
    const uid = await getUidFromCookie();
    const initialProfile = await getBusinessProfileAdmin(uid);

    return <MeuNegocioPageClient initialProfile={initialProfile} />;
}
