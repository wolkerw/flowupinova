
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = 'force-dynamic';

interface ReviewsRequestBody {
  accessToken: string;
  parentName: string; // Formato: accounts/{accountId}/locations/{locationId}
}

export async function POST(request: NextRequest) {
    try {
        const { accessToken, parentName } = await request.json() as ReviewsRequestBody;
        
        if (!accessToken || !parentName) {
            return NextResponse.json({ success: false, error: "Access Token e Parent Name são obrigatórios." }, { status: 400 });
        }
        
        const url = `https://mybusinessreviews.googleapis.com/v1/${parentName}/reviews?pageSize=5&orderBy=updateTime%20desc`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });
        
        const data = await response.json();

        if (!response.ok) {
            console.error("[GOOGLE_REVIEWS_ERROR] API Response:", data);
            throw new Error(data.error?.message || "Falha ao buscar avaliações do Google.");
        }

        const reviews = data.reviews || [];

        return NextResponse.json({ success: true, reviews: reviews });

    } catch (error: any) {
        console.error("[GOOGLE_REVIEWS_ERROR]", error.message);
        return NextResponse.json({ success: false, error: error.message || "Falha ao buscar avaliações." }, { status: 500 });
    }
}
