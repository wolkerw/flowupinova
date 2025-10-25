
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = 'force-dynamic';

interface InsightsRequestBody {
  accessToken: string;
  postId: string;
}

// Helper to fetch metrics from the Graph API's /insights edge
async function fetchPostInsights(postId: string, accessToken: string, metrics: string) {
    const url = `https://graph.facebook.com/v20.0/${postId}/insights?metric=${metrics}&access_token=${accessToken}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.error) throw new Error(`Erro na API de Insights (${metrics}): ${data.error.message}`);
    return data;
}

// Helper to fetch fields from the post object itself
async function fetchPostFields(postId: string, accessToken: string, fields: string) {
    const url = `https://graph.facebook.com/v20.0/${postId}?fields=${fields}&access_token=${accessToken}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.error) throw new Error(`Erro na API de Campos (${fields}): ${data.error.message}`);
    return data;
}


export async function POST(request: NextRequest) {
    try {
        const body: InsightsRequestBody = await request.json();
        const { accessToken, postId } = body;

        if (!accessToken || !postId) {
            return NextResponse.json({ success: false, error: "Access token e Post ID são obrigatórios." }, { status: 400 });
        }

        const insights: { [key: string]: any } = {
            reactions_detail: {}
        };

        // Chamada 1: Métricas de insights agrupadas
        const metricsList = 'post_impressions_unique,post_impressions,post_engaged_users,post_clicks,post_reactions_by_type_total';
        const insightsData = await fetchPostInsights(postId, accessToken, metricsList);
        
        insightsData.data?.forEach((metric: any) => {
             if (metric.name === 'post_impressions_unique') insights['reach'] = metric.values[0].value || 0;
             if (metric.name === 'post_impressions') insights['impressions'] = metric.values[0].value || 0;
             if (metric.name === 'post_engaged_users') insights['engaged_users'] = metric.values[0].value || 0;
             if (metric.name === 'post_clicks') insights['clicks'] = metric.values[0].value || 0;
             if (metric.name === 'post_reactions_by_type_total' && metric.values[0]?.value) {
                insights['reactions_detail'] = metric.values[0].value;
             }
        });
        
        // Chamada 2: Buscar campos diretos do post (comentários, compartilhamentos)
        const postFieldsData = await fetchPostFields(postId, accessToken, 'comments.summary(total_count),shares,permalink_url,type');
        insights.comments = postFieldsData.comments?.summary?.total_count || 0;
        insights.shares = postFieldsData.shares?.count || 0;
        insights.permalink_url = postFieldsData.permalink_url;
        insights.type = postFieldsData.type;

        return NextResponse.json({ success: true, insights });

    } catch (error: any) {
        console.error("[FB_POST_INSIGHTS_ERROR]", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

    