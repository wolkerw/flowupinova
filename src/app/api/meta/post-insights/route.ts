
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

        // Métricas que não requerem 'breakdown'
        const metrics = [
            'reach',
            'likes',
            'comments',
            'shares',
            'saved',
            'profile_visits'
        ].join(',');

        const url = `https://graph.facebook.com/v20.0/${postId}/insights?metric=${metrics}&access_token=${accessToken}`;

        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            console.error("[META_API_ERROR] Falha ao buscar insights:", data.error);
            throw new Error(data.error?.message || `Falha na API da Meta com status ${response.status}`);
        }
        
        // Processa os dados para um formato mais amigável
        const insights: { [key: string]: any } = {};
        if (data.data && Array.isArray(data.data)) {
            data.data.forEach((metric: any) => {
                if (metric.values && metric.values.length > 0) {
                    // Mapeia nomes da API para nomes mais amigáveis, se necessário
                    const metricName = metric.name;
                    insights[metricName] = metric.values[0].value || 0;
                }
            });
        }
        
        // A API de 'likes' e 'comments' no objeto de mídia principal é mais confiável.
        // Vamos buscar esses separadamente para garantir a precisão.
        const mediaFieldsUrl = `https://graph.facebook.com/v20.0/${postId}?fields=like_count,comments_count&access_token=${accessToken}`;
        const mediaResponse = await fetch(mediaFieldsUrl);
        const mediaData = await mediaResponse.json();
        
        if (mediaResponse.ok) {
            insights['like_count'] = mediaData.like_count || insights.likes || 0;
            insights['comments_count'] = mediaData.comments_count || insights.comments || 0;
        }

        return NextResponse.json({ success: true, insights });

    } catch (error: any) {
        console.error("[POST_INSIGHTS_ERROR]", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
