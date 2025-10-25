
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = 'force-dynamic';

interface InsightsRequestBody {
  accessToken: string;
  postId: string;
}

// Helper para buscar um conjunto de métricas
async function fetchMetrics(url: string, metrics: string, breakdown?: string) {
    const params = new URLSearchParams({
        metric: metrics,
    });
    if (breakdown) {
        params.append('breakdown', breakdown);
    }
    const fullUrl = `${url}&${params.toString()}`;
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

        const baseUrl = `https://graph.facebook.com/v20.0/${postId}/insights?access_token=${accessToken}`;
        
        const insights: { [key: string]: any } = {};

        // Chamada 1: Métricas principais sem breakdown
        const mainMetricsList = 'reach,saved,shares,profile_visits';
        const mainMetricsData = await fetchMetrics(baseUrl, mainMetricsList);
        
        if (mainMetricsData.error) throw new Error(`Erro na API (métricas principais): ${mainMetricsData.error.message}`);

        mainMetricsData.data?.forEach((metric: any) => {
             if (metric.values && metric.values.length > 0) {
                insights[metric.name] = metric.values[0].value || 0;
            }
        });

        // Chamada 2: Métricas de like e comment (mais confiáveis no objeto de mídia principal)
        const mediaFieldsUrl = `https://graph.facebook.com/v20.0/${postId}?fields=like_count,comments_count&access_token=${accessToken}`;
        const mediaResponse = await fetch(mediaFieldsUrl);
        const mediaData = await mediaResponse.json();

        if (mediaData.error) throw new Error(`Erro na API (curtidas/comentários): ${mediaData.error.message}`);
        
        insights['like_count'] = mediaData.like_count ?? insights.likes ?? 0;
        insights['comments_count'] = mediaData.comments_count ?? insights.comments ?? 0;
        
        // Chamada 3: profile_activity com breakdown
        const profileActivityData = await fetchMetrics(baseUrl, 'profile_activity', 'action_type');
        if (!profileActivityData.error && profileActivityData.data?.[0]?.total_value?.breakdowns?.[0]?.results) {
            insights.profile_activity_details = {};
            profileActivityData.data[0].total_value.breakdowns[0].results.forEach((result: any) => {
                const action = result.dimension_values?.[0];
                if(action) {
                    insights.profile_activity_details[action.toLowerCase()] = result.value || 0;
                }
            });
        }


        return NextResponse.json({ success: true, insights });

    } catch (error: any) {
        console.error("[POST_INSIGHTS_ERROR]", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
