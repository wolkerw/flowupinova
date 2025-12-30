
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

interface InsightsRequestBody {
  accessToken: string;
  postId: string;
}

function getMetricValue(data: any[], metricName: string): number {
  const metric = data.find((m: any) => m.name === metricName);
  return metric?.values?.[0]?.value ?? 0;
}

export async function POST(request: NextRequest) {
  try {
    const body: InsightsRequestBody = await request.json();
    const { accessToken, postId } = body;

    if (!accessToken || !postId) {
      return NextResponse.json(
        { success: false, error: "Access token e Post ID são obrigatórios." },
        { status: 400 }
      );
    }

    const host = "https://graph.instagram.com";
    const apiVersion = "v24.0";

    // ✅ Métricas que são aceitas (e batem com o Explorer)
    const metrics = "reach,likes,comments,saved,shares,total_interactions";

    const insightsUrl =
      `${host}/${apiVersion}/${encodeURIComponent(postId)}/insights` +
      `?metric=${encodeURIComponent(metrics)}` +
      `&access_token=${encodeURIComponent(accessToken)}`;

    const response = await fetch(insightsUrl, { cache: "no-store" });
    const insightsData = await response.json();

    if (!response.ok || insightsData?.error) {
      console.error("[POST_INSIGHTS_ERROR] Instagram API Error:", insightsData?.error || insightsData);
      const msg = insightsData?.error?.message || `Falha ao buscar insights (${response.status}).`;
      return NextResponse.json({ success: false, error: msg }, { status: 400 });
    }

    const raw = insightsData.data || [];

    const insights = {
      reach: getMetricValue(raw, "reach"),
      likes: getMetricValue(raw, "likes"),
      comments: getMetricValue(raw, "comments"),
      saved: getMetricValue(raw, "saved"),
      shares: getMetricValue(raw, "shares"),
      total_interactions: getMetricValue(raw, "total_interactions"),
    };

    return NextResponse.json({ success: true, insights });
  } catch (error: any) {
    console.error("[POST_INSIGHTS_ERROR] Internal error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
