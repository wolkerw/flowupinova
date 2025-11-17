
import { NextResponse, type NextRequest } from "next/server";
import { google } from "googleapis";
import { getAuthenticatedGoogleClient, getGoogleBusinessProfile } from "@/lib/services/google-service-admin";
import { getUidFromCookie } from "@/lib/firebase-admin";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const uid = await getUidFromCookie();
        const profile = await getGoogleBusinessProfile(uid);

        if (!profile.isVerified || !profile.googleName) {
            return NextResponse.json({ success: false, error: "Perfil do Google Meu Negócio não está conectado ou é inválido." }, { status: 400 });
        }
        
        // A API de avaliações espera o formato "accounts/{accountId}/locations/{locationId}"
        const accountId = profile.googleName.split('/')[0]; // Extrai "accounts"
        const locationId = profile.googleName.split('/')[1]; // Extrai "{locationId}"
        const parentName = `accounts/${accountId}/locations/${locationId}`;


        const oauth2Client = await getAuthenticatedGoogleClient(uid);

        const myBusinessReviews = google.mybusinessreviews({
            version: 'v1',
            auth: oauth2Client,
        });

        const response = await myBusinessReviews.accounts.locations.reviews.list({
            parent: parentName,
            pageSize: 5, // Pega as 5 avaliações mais recentes
            orderBy: 'updateTime desc',
        });
        
        const reviews = response.data.reviews || [];

        return NextResponse.json({ success: true, reviews: reviews });

    } catch (error: any) {
        console.error("[GOOGLE_REVIEWS_ERROR]", error);
        return NextResponse.json({ success: false, error: error.message || "Falha ao buscar avaliações." }, { status: 500 });
    }
}
