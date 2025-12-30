
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

interface InsightsRequestBody {
  accessToken: string;
  postId: string; // mediaId
}

// Helper para extrair um valor de uma métrica específica do array de resultados da API
function getMetricValue(data: any[], metricName: string): any {
    const metric = data.find((m: any) => m.name === metricName);
    return metric?.values?.[0]?.value || 0;
}


export async function POST(request: NextRequest) {
  try {
    const body: InsightsRequestBody = await request.json();
    const { accessToken, postId } = body;

    if (!accessToken || !postId) {
      return NextResponse.json({ success: false, error: "Access token e Post ID são obrigatórios." }, { status: 400 });
    }

    // ✅ Corrigido para usar a URL correta do Instagram
    const host = "https://graph.instagram.com";
    const apiVersion = "v24.0";
    
    // ✅ Lista de métricas ajustada para o que realmente precisamos buscar
    const metricsList = "reach,saved,shares";

    const insightsUrl = `${host}/${apiVersion}/${postId}/insights?metric=${metricsList}&access_token=${encodeURIComponent(accessToken)}`;
    
    const response = await fetch(insightsUrl);
    const insightsData = await response.json();
    
    if (!response.ok || insightsData.error) {
        console.error("[POST_INSIGHTS_ERROR] Instagram API Error:", insightsData.error);
        throw new Error(`Erro na API de Insights do Instagram: ${insightsData.error.message}`);
    }
    
    const rawInsights = insightsData.data || [];
    
    const insights = {
      reach: getMetricValue(rawInsights, 'reach'),
      saved: getMetricValue(rawInsights, 'saved'),
      shares: getMetricValue(rawInsights, 'shares'),
    };

    return NextResponse.json({ success: true, insights });

  } catch (error: any) {
    console.error("[POST_INSIGHTS_ERROR] Internal error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
