
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = 'force-dynamic';

interface InsightsRequestBody {
  accessToken: string;
  postId: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: InsightsRequestBody = await request.json();
        const { accessToken, postId } = body;

        if (!accessToken || !postId) {
            return NextResponse.json({ success: false, error: "Access token e Post ID são obrigatórios." }, { status: 400 });
        }

        const metrics = [
            'post_impressions_unique', // Alcance
            'post_engaged_users',      // Engajamento
            'post_reactions_like_total', // Curtidas (para fotos)
            'post_video_views', // Visualizações (para vídeos)
        ].join(',');

        const url = `https://graph.facebook.com/v20.0/${postId}/insights?metric=${metrics}&access_token=${accessToken}`;

        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            console.error("[META_API_ERROR] Falha ao buscar insights:", data.error);
            throw new Error(data.error?.message || `Falha na API da Meta com status ${response.status}`);
        }
        
        // Processa os dados para um formato mais amigável
        const insights: { [key: string]: number } = {};
        if (data.data && Array.isArray(data.data)) {
            data.data.forEach((metric: any) => {
                if (metric.values && metric.values.length > 0) {
                     // Algumas métricas, como 'post_reactions_like_total', retornam um objeto com valores.
                     // Outras, como 'post_impressions_unique', retornam o valor diretamente.
                    const value = typeof metric.values[0].value === 'object' 
                        ? (metric.values[0].value.like || 0) // Soma as reações de 'like'
                        : metric.values[0].value;
                    insights[metric.name] = value;
                }
            });
        }

        return NextResponse.json({ success: true, insights });

    } catch (error: any) {
        console.error("[POST_INSIGHTS_ERROR]", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
