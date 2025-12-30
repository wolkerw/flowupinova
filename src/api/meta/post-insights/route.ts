
// src/app/api/meta/post-insights/route.ts
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

interface InsightsRequestBody {
  accessToken: string;
  postId: string; // mediaId
}

async function fetchJson(url: string) {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) {
    const msg = json?.error?.message || `HTTP ${res.status}`;
    const code = json?.error?.code;
    throw new Error(code ? `Erro na API (${code}): ${msg}` : msg);
  }
  return json;
}

function pickInsights(insightsData: any) {
  const out: Record<string, number> = {};
  for (const metric of insightsData?.data || []) {
    const v = metric?.values?.[0]?.value;
    if (typeof v === "number") out[metric.name] = v;
  }
  return out;
}

export async function POST(request: NextRequest) {
  try {
    const body: InsightsRequestBody = await request.json();
    const { accessToken, postId } = body;

    if (!accessToken || !postId) {
      return NextResponse.json({ success: false, error: "Access token e Post ID são obrigatórios." }, { status: 400 });
    }

    const host = "https://graph.instagram.com";
    const apiVersion = "v24.0";

    // 1) campos reais do media (curtidas/comentários)
    const mediaInfoUrl = `${host}/${apiVersion}/${postId}?fields=media_type,like_count,comments_count&access_token=${encodeURIComponent(accessToken)}`;
    const mediaInfo = await fetchJson(mediaInfoUrl);

    // 2) insights “seguros” (Instagram Login)
    // ⚠️ requer scope instagram_business_manage_insights
    const baseMetrics = ["reach", "impressions", "engagement", "saved"];
    const insightsUrl = `${host}/${apiVersion}/${postId}/insights?metric=${baseMetrics.join(",")}&access_token=${encodeURIComponent(accessToken)}`;

    let insightsMap: Record<string, number> = {};
    try {
      const insightsData = await fetchJson(insightsUrl);
      insightsMap = pickInsights(insightsData);
    } catch (e: any) {
      // se não tiver permissão de insights, não quebra tudo — só volta sem reach etc.
      // (o front mostra 0/—)
      insightsMap = {};
    }

    // 3) opcional: plays para vídeo (se suportar)
    if (mediaInfo?.media_type === "VIDEO") {
      const playsUrl = `${host}/${apiVersion}/${postId}/insights?metric=plays&access_token=${encodeURIComponent(accessToken)}`;
      try {
        const playsData = await fetchJson(playsUrl);
        Object.assign(insightsMap, pickInsights(playsData));
      } catch {}
    }

    const likeCount = mediaInfo?.like_count ?? 0;
    const commentsCount = mediaInfo?.comments_count ?? 0;
    const saved = insightsMap.saved ?? 0;

    const insights = {
      reach: insightsMap.reach ?? 0,
      impressions: insightsMap.impressions ?? 0,
      engagement: insightsMap.engagement ?? 0,
      saved,
      plays: insightsMap.plays ?? 0,
      like_count: likeCount,
      comments_count: commentsCount,
      // “total_interactions” pra tua UI:
      total_interactions: (likeCount + commentsCount + saved),
      // shares não é garantido no Instagram Login:
      shares: 0,
    };

    return NextResponse.json({ success: true, insights });
  } catch (error: any) {
    console.error("[POST_INSIGHTS_ERROR] Internal error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
