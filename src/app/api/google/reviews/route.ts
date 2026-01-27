
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = 'force-dynamic';

interface ReviewsRequestBody {
  accessToken: string;
  accountId: string;
  locationId: string;
}

export async function POST(request: NextRequest) {
    try {
        const { accessToken, accountId, locationId } = await request.json() as ReviewsRequestBody;
        
        if (!accessToken || !accountId || !locationId) {
            return NextResponse.json({ success: false, error: "Access Token, Account ID e Location ID são obrigatórios." }, { status: 400 });
        }
        
        // Usando a API v4 que foi validada no Postman
        const url = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews?pageSize=10&orderBy=updateTime%20desc`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            if (response.status === 401 || response.status === 403) {
                console.warn(`[GOOGLE_REVIEWS_AUTH_ERROR] Token inválido ou expirado. Status: ${response.status}`);
                return NextResponse.json({ success: false, error: "Token de acesso do Google inválido ou expirado." }, { status: 401 });
            }
            console.error(`[GOOGLE_REVIEWS_ERROR] API retornou status ${response.status}. Resposta:`, errorText);
            let errorMessage = `Falha ao buscar avaliações do Google (status: ${response.status}).`;
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.error?.message || errorMessage;
            } catch (e) {
                // O corpo não era JSON
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();

        // O endpoint v4 retorna um objeto com uma propriedade 'reviews'
        const reviews = data.reviews || [];

        return NextResponse.json({ success: true, reviews: reviews, averageRating: data.averageRating || 0 });

    } catch (error: any) {
        console.error("[GOOGLE_REVIEWS_ERROR]", error.message);
        return NextResponse.json({ success: false, error: error.message || "Falha ao buscar avaliações." }, { status: 500 });
    }
}
