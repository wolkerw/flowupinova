
import { NextResponse, type NextRequest } from "next/server";
import { google } from "googleapis";
import { getUidFromCookie } from "@/lib/firebase-admin";
import { getBusinessProfileAdmin } from "@/lib/services/business-profile-service-admin";
import { getMetaConnection } from "@/lib/services/meta-service";

export async function GET(request: NextRequest) {
    try {
        const uid = await getUidFromCookie();
        const profile = await getBusinessProfileAdmin(uid);
        
        if (!profile.isVerified || !profile.name.includes('/')) {
             return NextResponse.json({ success: false, error: "Perfil do Google Meu Negócio não está conectado ou é inválido." }, { status: 400 });
        }

        // The name field should be like 'accounts/{accountId}/locations/{locationId}'
        const locationName = profile.name;

        // This is a placeholder for proper OAuth flow.
        // In a real application, you must securely store and retrieve the user's refresh token
        // to get a fresh access token for each request.
        const metaConnection = await getMetaConnection(uid);
        if (!metaConnection.isConnected || !metaConnection.accessToken) {
             return NextResponse.json({ success: false, error: "Token de acesso inválido. Reconecte a conta Meta." }, { status: 401 });
        }

        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
        
        // This will fail without a valid access/refresh token for the user.
        // This part of the code is illustrative and will not work without proper OAuth token management.
        // oauth2Client.setCredentials({ access_token: metaConnection.accessToken });
        
        // Mock data will be returned as the full OAuth flow is not implemented.
        const mockReviews = [
            {
              name: "reviews/1",
              reviewer: {
                profilePhotoUrl: "https://lh3.googleusercontent.com/a-/ALV-UjV_gGf-vB_g...",
                displayName: "Maria Silva",
              },
              starRating: "FIVE",
              comment: "Excelente atendimento! Equipe muito profissional e resultados incríveis.",
              createTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              updateTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              name: "reviews/2",
              reviewer: {
                profilePhotoUrl: "https://lh3.googleusercontent.com/a-/ALV-UjV...",
                displayName: "João Santos",
              },
              starRating: "FIVE",
              comment: "Recomendo! Aumentaram muito a visibilidade do meu negócio online.",
              createTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              updateTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            }
        ];
        
        return NextResponse.json({ success: true, reviews: mockReviews });

    } catch (error: any) {
        console.error("[GOOGLE_REVIEWS_ERROR]", error.message);
        return NextResponse.json({ success: false, error: "Funcionalidade de avaliações ainda em desenvolvimento." }, { status: 501 });
    }
}
