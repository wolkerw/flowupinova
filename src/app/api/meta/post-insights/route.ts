import { NextResponse, type NextRequest } from "next/server";
import { getUidFromCookie } from "@/lib/firebase-admin";
import { getMetaConnectionAdmin } from "@/lib/services/meta-service-admin";

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

    // Métricas suportadas para mídia no Instagram
    const metrics = "reach,likes,comments,saved,shares,total_interactions";

    const insightsUrl =
      `${host}/${apiVersion}/${encodeURIComponent(postId)}/insights` +
      `?metric=${encodeURIComponent(metrics)}` +
      `&access_token=${encodeURIComponent(accessToken)}`;

    const response = await fetch(insightsUrl, { cache: "no-store" });
    const insightsData = await response.json();

    let raw = insightsData?.data || [];

    // Fallback 1: Se graph.instagram.com falhar por falta de permissão, tentar via Facebook Page Token
    if (!response.ok || insightsData?.error) {
      try {
        const uid = await getUidFromCookie().catch(() => null);
        if (uid) {
          const metaConnection = await getMetaConnectionAdmin(uid).catch(() => null);
          const pageToken = metaConnection?.accessToken;
          if (pageToken) {
            const fbUrl = `https://graph.facebook.com/v24.0/${encodeURIComponent(postId)}/insights?metric=reach,saved,total_interactions&access_token=${encodeURIComponent(pageToken)}`;
            const fbRes = await fetch(fbUrl, { cache: "no-store" });
            const fbData = await fbRes.json();
            if (fbRes.ok && fbData?.data) {
              raw = fbData.data;
            }
          }
        }
      } catch (fbFallbackErr) {
        console.warn("[POST_INSIGHTS_FB_FALLBACK_WARN]", fbFallbackErr);
      }
    }

    // Se ainda não obtivemos dados e a Meta retornou erro de permissão (Code 10 ou permission)
    if (raw.length === 0 && (!response.ok || insightsData?.error)) {
      const errCode = insightsData?.error?.code;
      const errMsg = insightsData?.error?.message || "";
      const isPermissionLimitation =
        errCode === 10 ||
        errCode === 200 ||
        errMsg.toLowerCase().includes("permission") ||
        errMsg.toLowerCase().includes("access");

      if (isPermissionLimitation) {
        return NextResponse.json({
          success: true,
          permissionLimited: true,
          insights: null,
          message:
            "A Meta requer liberação da permissão instagram_manage_insights ou a vinculação do perfil à sua Página do Facebook no Meta Business Suite para exibir dados analíticos de alcance e salvamentos.",
        });
      }

      console.error("[POST_INSIGHTS_ERROR] Instagram API Error:", insightsData?.error || insightsData);
      return NextResponse.json({ success: false, error: errMsg || `Falha ao buscar insights (${response.status}).` }, { status: 400 });
    }

    const insights = {
      reach: getMetricValue(raw, "reach"),
      likes: getMetricValue(raw, "likes"),
      comments: getMetricValue(raw, "comments"),
      saved: getMetricValue(raw, "saved"),
      shares: getMetricValue(raw, "shares"),
      total_interactions: getMetricValue(raw, "total_interactions"),
    };

    return NextResponse.json({ success: true, insights, permissionLimited: false });
  } catch (error: any) {
    console.error("[POST_INSIGHTS_ERROR] Internal error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
