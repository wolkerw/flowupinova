
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = 'force-dynamic';

interface InsightsRequestBody {
  accessToken: string;
  postId: string;
}

// Helper to fetch metrics from the Graph API
async function fetchMetrics(baseUrl: string, accessToken: string, metrics: string) {
    const params = new URLSearchParams({ 
        metric: metrics,
        access_token: accessToken,
    });
    const fullUrl = `${baseUrl}?${params.toString()}`;
    const response = await fetch(fullUrl);
    const data = await response.json();
    if (data.error) throw new Error(`Erro na API (${metrics}): ${data.error.message}`);
    return data;
}

// Helper to fetch fields from the post object itself
async function fetchPostFields(postId: string, accessToken: string, fields: string) {
    const url = `https://graph.facebook.com/v20.0/${postId}?fields=${fields}&access_token=${accessToken}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.error) throw new Error(`Erro na API (${fields}): ${data.error.message}`);
    return data;
}


export async function POST(request: NextRequest) {
    try {
        const body: InsightsRequestBody = await request.json();
        const { accessToken, postId } = body;

        if (!accessToken || !postId) {
            return NextResponse.json({ success: false, error: "Access token e Post ID são obrigatórios." }, { status: 400 });
        }

        const insightsBaseUrl = `https://graph.facebook.com/v20.0/${postId}/insights`;
        const insights: { [key: string]: any } = {};

        // Chamada 1: Métricas de insights (alcance, cliques)
        const mainMetricsList = 'post_impressions_unique,post_clicks';
        const mainMetricsData = await fetchMetrics(insightsBaseUrl, accessToken, mainMetricsList);

        mainMetricsData.data?.forEach((metric: any) => {
             if (metric.values && metric.values.length > 0) {
                // Renomeia para um formato mais amigável
                if(metric.name === 'post_impressions_unique') insights['reach'] = metric.values[0].value;
                if(metric.name === 'post_clicks') insights['clicks'] = metric.values[0].value;
            }
        });
        
        // Chamada 2: Detalhamento das reações
        const reactionsData = await fetchMetrics(insightsBaseUrl, accessToken, 'post_reactions_by_type_total');
        insights.reactions_detail = {};
        if(reactionsData.data?.[0]?.values?.[0]?.value) {
            insights.reactions_detail = reactionsData.data[0].values[0].value;
        }

        // Chamada 3: Buscar campos diretos do post (comentários, compartilhamentos)
        const postFieldsData = await fetchPostFields(postId, accessToken, 'comments.summary(total_count),shares');
        insights.comments = postFieldsData.comments?.summary?.total_count || 0;
        insights.shares = postFieldsData.shares?.count || 0;


        return NextResponse.json({ success: true, insights });

    } catch (error: any) {
        console.error("[FB_POST_INSIGHTS_ERROR]", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
