
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
        // No entanto, a biblioteca googleapis abstrai isso, e precisamos do 'parent' correto.
        // O `googleName` (locations/...) não é o parent direto.
        // O `parent` precisa ser `accounts/{accountId}`. A API de reviews usa o `parent` da location.
        // O `googleName` é no formato 'locations/{locationId}' mas a API de reviews precisa de 'accounts/{accountId}/locations/{locationId}'
        // Vamos precisar buscar as contas primeiro.
        
        const oauth2Client = await getAuthenticatedGoogleClient(uid);
        
        const myBizAccount = google.mybusinessaccountmanagement({
            version: 'v1',
            auth: oauth2Client
        });

        const accountsResponse = await myBizAccount.accounts.list();
        const accounts = accountsResponse.data.accounts;

        if (!accounts || accounts.length === 0) {
            throw new Error("Nenhuma conta do Google Meu Negócio encontrada.");
        }
        
        // Assume a primeira conta. Em um app mais complexo, permitiria ao usuário escolher.
        const accountName = accounts[0].name; // Formato: accounts/{accountId}
        const parentName = `${accountName}/${profile.googleName}`;


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
