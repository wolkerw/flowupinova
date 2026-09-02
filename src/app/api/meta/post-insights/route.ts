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

    // Métricas analíticas suportadas pela Meta Graph API para mídias
    const metricCombinations = [
      "reach,saved,total_interactions",
      "reach,saved",
      "reach",
    ];

    let raw: any[] = [];
    let lastError: any = null;

    // Tentativa 1: Instagram First (graph.instagram.com com o token fornecido)
    for (const metric of metricCombinations) {
      try {
        const insightsUrl = `${host}/${apiVersion}/${encodeURIComponent(postId)}/insights?metric=${encodeURIComponent(metric)}&access_token=${encodeURIComponent(accessToken)}`;
        const response = await fetch(insightsUrl, { cache: "no-store" });
        const insightsData = await response.json();

        if (response.ok && Array.isArray(insightsData?.data) && insightsData.data.length > 0) {
          raw = insightsData.data;
          break;
        } else if (insightsData?.error) {
          lastError = insightsData.error;
        }
      } catch (err) {
        lastError = err;
      }
    }

    // Tentativa 2 & 3: Fallback via Meta / Facebook (Page Token e User Token)
    if (raw.length === 0) {
      try {
        const uid = await getUidFromCookie().catch(() => null);
        if (uid) {
          const metaConnection = await getMetaConnectionAdmin(uid).catch(() => null);
          const pageToken = metaConnection?.accessToken;
          const userMetaToken = metaConnection?.userAccessToken;

          const fbTokensToTry = [pageToken, userMetaToken].filter(Boolean) as string[];

          for (const fbToken of fbTokensToTry) {
            for (const metric of metricCombinations) {
              try {
                const fbUrl = `https://graph.facebook.com/${apiVersion}/${encodeURIComponent(postId)}/insights?metric=${encodeURIComponent(metric)}&access_token=${encodeURIComponent(fbToken)}`;
                const fbRes = await fetch(fbUrl, { cache: "no-store" });
                const fbData = await fbRes.json();

                if (fbRes.ok && Array.isArray(fbData?.data) && fbData.data.length > 0) {
                  raw = fbData.data;
                  break;
                }
              } catch (e) {
                // Tenta próximo token/métrica
              }
            }
            if (raw.length > 0) break;
          }
        }
      } catch (fbFallbackErr) {
        console.warn("[POST_INSIGHTS_FB_FALLBACK_WARN]", fbFallbackErr);
      }
    }

    // Se ainda não obtivemos dados após todas as tentativas na cascata
    if (raw.length === 0) {
      const errCode = lastError?.code;
      const errMsg = String(lastError?.message || "");
      const isPermissionLimitation =
        errCode === 10 ||
        errCode === 100 ||
        errCode === 200 ||
        errMsg.toLowerCase().includes("permission") ||
        errMsg.toLowerCase().includes("access") ||
        errMsg.toLowerCase().includes("unsupported");

      if (isPermissionLimitation) {
        return NextResponse.json({
          success: true,
          permissionLimited: true,
          insights: null,
          message:
            "Curtidas e comentários estão sincronizados. As métricas analíticas de alcance e salvamentos dependem da liberação da permissão de insights da Meta no painel de desenvolvedores ou da conexão da conta de negócios.",
        });
      }

      console.error("[POST_INSIGHTS_ERROR] Falha após todas as tentativas:", lastError);
      return NextResponse.json(
        { success: false, error: errMsg || "Falha ao consultar métricas na API da Meta." },
        { status: 400 }
      );
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
