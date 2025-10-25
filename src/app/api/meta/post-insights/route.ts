
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = 'force-dynamic';

interface InsightsRequestBody {
  accessToken: string;
  postId: string;
}

// Helper to fetch a set of metrics
async function fetchMetrics(baseUrl: string, metrics: string) {
    const params = new URLSearchParams({ metric: metrics });
    const fullUrl = `${baseUrl}&${params.toString()}`;
    const response = await fetch(fullUrl);
    return response.json();
}


export async function POST(request: NextRequest) {
    try {
        const body: InsightsRequestBody = await request.json();
        const { accessToken, postId } = body;

        if (!accessToken || !postId) {
            return NextResponse.json({ success: false, error: "Access token e Post ID são obrigatórios." }, { status: 400 });
        }

        const baseUrl = `https://graph.facebook.com/v24.0/${postId}/insights?access_token=${accessToken}`;
        
        const insights: { [key: string]: any } = {};

        // Chamada 1: Métricas principais (substituindo 'impressions' por 'views')
        const mainMetricsList = 'reach,views,likes,comments,shares,saved,total_interactions,ig_reels_avg_watch_time,ig_reels_video_view_total_time,profile_visits';
        const mainMetricsData = await fetchMetrics(baseUrl, mainMetricsList);
        
        if (mainMetricsData.error) {
            console.error("[POST_INSIGHTS_ERROR] API Error (main metrics):", mainMetricsData.error);
            throw new Error(`Erro na API (métricas principais): ${mainMetricsData.error.message}`);
        }
        
        mainMetricsData.data?.forEach((metric: any) => {
             if (metric.values && metric.values.length > 0) {
                insights[metric.name] = metric.values[0].value || 0;
            }
        });

        // A API de insights já nos dá 'likes' e 'comments', então a chamada separada não é mais necessária,
        // a menos que a de insights falhe para esses campos. Vamos manter a simplicidade por agora.
        insights['like_count'] = insights.likes ?? 0;
        insights['comments_count'] = insights.comments ?? 0;
        
        return NextResponse.json({ success: true, insights });

    } catch (error: any) {
        console.error("[POST_INSIGHTS_ERROR] Internal error:", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
