
import { NextResponse, type NextRequest } from "next/server";
import { google } from "googleapis";
import { getUidFromCookie } from "@/lib/firebase-admin";
import { getBusinessProfileAdmin } from "@/lib/services/business-profile-service-admin";
import { getMetaConnection } from "@/lib/services/meta-service"; // Re-using meta token for now. In future, this should be a separate Google token.

export async function GET(request: NextRequest) {
    try {
        const uid = await getUidFromCookie();
        const profile = await getBusinessProfileAdmin(uid);
        
        if (!profile.isVerified || !profile.name.includes('/')) {
             return NextResponse.json({ success: false, error: "Perfil do Google Meu Negócio não está conectado ou é inválido." }, { status: 400 });
        }

        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        
        // This is a placeholder. For a real app, you must store and use the user's refresh token.
        // As a temporary workaround, we assume a valid (short-lived) access token exists from another service if needed,
        // but the best approach is a dedicated OAuth flow for GMB.
        const metaConnection = await getMetaConnection(uid);
        if (!metaConnection.isConnected || !metaConnection.accessToken) {
             // For now, let's proceed without a token and see if the service account can access it.
             // This will likely fail without user consent, but it's a step.
        }

        const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
        // In a real scenario:
        // oauth2Client.setCredentials({ refresh_token: userRefreshToken });
        // const { token: accessToken } = await oauth2Client.getAccessToken();

        const myBusiness = google.mybusinessbusinessinformation({
            version: 'v1',
            auth: oauth2Client // This will fail without credentials.
        });
        
        // This part of the code is illustrative and will not work without proper OAuth token management.
        // We will return mock data for now.
        const mockInsights = {
            views: Math.floor(Math.random() * 5000) + 1000,
            searches: Math.floor(Math.random() * 2000) + 500,
            websiteClicks: Math.floor(Math.random() * 500) + 50,
            directionsRequests: Math.floor(Math.random() * 200) + 20,
        };
        
        return NextResponse.json({ success: true, insights: mockInsights });

    } catch (error: any) {
        console.error("[GOOGLE_INSIGHTS_ERROR]", error.message);
        return NextResponse.json({ success: false, error: "Funcionalidade de insights ainda em desenvolvimento." }, { status: 501 });
    }
}
