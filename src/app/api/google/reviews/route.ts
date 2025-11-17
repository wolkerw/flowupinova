
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = 'force-dynamic';

interface ReviewsRequestBody {
  accessToken: string;
  parentName: string; // Formato: locations/{locationId}
}

export async function POST(request: NextRequest) {
    try {
        const { accessToken, parentName } = await request.json() as ReviewsRequestBody;
        
        if (!accessToken || !parentName) {
            return NextResponse.json({ success: false, error: "Access Token e Parent Name (googleName) são obrigatórios." }, { status: 400 });
        }
        
        // Usando a API mais recente para buscar avaliações
        const url = `https://mybusinessreviews.googleapis.com/v1/${parentName}/reviews?pageSize=5&orderBy=updateTime%20desc`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });
        
        // Primeiro, verifique se a resposta da API foi bem-sucedida
        if (!response.ok) {
            // Se não foi OK, o corpo provavelmente não é JSON (pode ser HTML, texto, etc.)
            const errorText = await response.text();
            console.error(`[GOOGLE_REVIEWS_ERROR] API retornou status ${response.status}. Resposta:`, errorText);
            // Tenta extrair uma mensagem de erro do JSON se possível, caso contrário usa o texto.
            let errorMessage = `Falha ao buscar avaliações do Google (status: ${response.status}).`;
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.error?.message || errorMessage;
            } catch (e) {
                // O corpo não era JSON, o que confirma o problema.
            }
            throw new Error(errorMessage);
        }

        // Somente se a resposta for OK, analise o JSON
        const data = await response.json();

        const reviews = data.reviews || [];

        return NextResponse.json({ success: true, reviews: reviews });

    } catch (error: any) {
        console.error("[GOOGLE_REVIEWS_ERROR]", error.message);
        return NextResponse.json({ success: false, error: error.message || "Falha ao buscar avaliações." }, { status: 500 });
    }
}
