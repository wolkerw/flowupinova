
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
        
        // Usando um conjunto de métricas mais seguro e universalmente aceito para Page Posts
        const metricsList = [
            'post_impressions',
            'post_engaged_users',
        ].join(',');

        // Única chamada para o endpoint de insights com as métricas necessárias
        const insightsUrl = `https://graph.facebook.com/v24.0/${postId}/insights?metric=${metricsList}&period=lifetime&access_token=${accessToken}`;
        const insightsResponse = await fetch(insightsUrl);
        const insightsData = await insightsResponse.json();

        if (!insightsResponse.ok || insightsData.error) {
            console.error("[FB_POST_INSIGHTS_ERROR] API Error:", insightsData.error);
            throw new Error(`Erro na API de Insights: ${insightsData.error.message}`);
        }

        const rawInsights = insightsData.data || [];

        const insights = {
            impressions: getMetricValue(rawInsights, 'post_impressions'),
            engaged_users: getMetricValue(rawInsights, 'post_engaged_users'),
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
