
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = 'force-dynamic';

interface InsightsRequestBody {
  accessToken: string;
  postId: string;
}

// Helper para extrair um valor de uma métrica específica do array de resultados da API
function getMetricValue(data: any[], metricName: string): any {
    const metric = data.find((m: any) => m.name === metricName);
    // Para métricas com detalhamento (by_type), o valor está em um objeto
    if (metric?.values?.[0]?.value && typeof metric.values[0].value === 'object') {
        return metric.values[0].value;
    }
    // Para métricas simples, o valor é um número
    return metric?.values?.[0]?.value || 0;
}


export async function POST(request: NextRequest) {
    try {
        const body: InsightsRequestBody = await request.json();
        const { accessToken, postId } = body;

        if (!accessToken || !postId) {
            return NextResponse.json({ success: false, error: "Access token e Post ID são obrigatórios." }, { status: 400 });
        }
        
        // Lista de métricas validadas para a nova experiência de páginas
        const metricsList = [
            'post_impressions',
            'post_impressions_unique',
            'post_impressions_organic',
            'post_impressions_organic_unique',
            'post_reactions_by_type_total',
            'post_clicks',
            'post_activity_by_action_type'
        ].join(',');

        // Única chamada para o endpoint de insights com todas as métricas necessárias
        const insightsUrl = `https://graph.facebook.com/v24.0/${postId}/insights?metric=${metricsList}&period=lifetime&access_token=${accessToken}`;
        const insightsResponse = await fetch(insightsUrl);
        const insightsData = await insightsResponse.json();

        if (!insightsResponse.ok || insightsData.error) {
            console.error("[FB_POST_INSIGHTS_ERROR] API Error:", insightsData.error);
            throw new Error(`Erro na API de Insights: ${insightsData.error.message}`);
        }

        const rawInsights = insightsData.data || [];

        // Processa as atividades (comentários, compartilhamentos)
        const activity = getMetricValue(rawInsights, 'post_activity_by_action_type');
        const comments = activity.comment || 0;
        const shares = activity.share || 0;
        // Pessoas engajadas - A API do FB não tem um equivalente direto de post_engaged_users no nível do post como o IG
        // A métrica mais próxima é o total de interações, que podemos calcular somando as interações conhecidas.
        const reactionsDetail = getMetricValue(rawInsights, 'post_reactions_by_type_total');
        const totalReactions = Object.values(reactionsDetail).reduce((a: any, b: any) => a + b, 0);
        const engaged_users = (totalReactions || 0) + comments + shares + (getMetricValue(rawInsights, 'post_clicks') || 0);


        const insights = {
            impressions: getMetricValue(rawInsights, 'post_impressions'),
            reach: getMetricValue(rawInsights, 'post_impressions_unique'),
            impressions_organic: getMetricValue(rawInsights, 'post_impressions_organic'),
            reach_organic: getMetricValue(rawInsights, 'post_impressions_organic_unique'),
            clicks: getMetricValue(rawInsights, 'post_clicks'),
            reactions_detail: reactionsDetail,
            comments,
            shares,
            engaged_users: engaged_users, // Usando o valor calculado
        };
        
        // Adiciona a busca pelo permalink_url para o link direto
        const fieldsUrl = `https://graph.facebook.com/v24.0/${postId}?fields=permalink_url&access_token=${accessToken}`;
        const fieldsResponse = await fetch(fieldsUrl);
        const fieldsData = await fieldsResponse.json();
        if(fieldsData.permalink_url) {
            (insights as any).permalink_url = fieldsData.permalink_url;
        }

        return NextResponse.json({ success: true, insights });

    } catch (error: any) {
        console.error("[FB_POST_INSIGHTS_ERROR] Internal Server Error:", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
