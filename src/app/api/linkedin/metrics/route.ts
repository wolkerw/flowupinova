import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

const LINKEDIN_VERSION = "202607";

export interface LinkedInPostMetricItem {
  id: string;
  text: string;
  imageUrl?: string;
  createdTime: string;
  permalink: string;
  status: "trending" | "declining" | "normal";
  metrics: {
    impressions: number;
    likes: number;
    comments: number;
    shares: number;
    clicks: number;
    engagementRate: string;
  };
}

function buildLinkedInHeaders(accessToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
    "LinkedIn-Version": LINKEDIN_VERSION,
    "X-Restli-Protocol-Version": "2.0.0",
  };
}

function extractShareStats(statsObj: any) {
  const s = statsObj?.totalShareStatistics || {};
  const impressions = Number(s.impressionCount || 0);
  const likes = Number(s.likeCount || 0);
  const comments = Number(s.commentCount || 0);
  const shares = Number(s.shareCount || 0);
  const clicks = Number(s.clickCount || 0);
  const rawEngagement = typeof s.engagement === "number" ? s.engagement : null;
  const computedRate =
    rawEngagement !== null
      ? rawEngagement * 100
      : impressions > 0
        ? ((likes + comments + shares + clicks) / impressions) * 100
        : 0;

  return {
    impressions,
    likes,
    comments,
    shares,
    clicks,
    engagementRate: `${computedRate.toFixed(2)}%`,
    numericEngagementRate: computedRate,
  };
}

export async function GET(request: NextRequest) {
  const authUser = await requireUser(request);
  if (authUser instanceof NextResponse) return authUser;

  try {
    const connDoc = await adminDb
      .collection("users")
      .doc(authUser.uid)
      .collection("connections")
      .doc("linkedin")
      .get();

    if (!connDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Conta do LinkedIn não conectada." },
        { status: 404 }
      );
    }

    const connData = connDoc.data() || {};
    const accessToken = connData.accessToken as string | undefined;
    const orgUrn =
      (connData.selectedOrganizationUrn as string | undefined) ||
      (Array.isArray(connData.organizations) ? connData.organizations[0]?.urn : undefined);

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: "Token de acesso do LinkedIn ausente. Reconecte a conta." },
        { status: 401 }
      );
    }

    if (!orgUrn) {
      return NextResponse.json({
        success: true,
        organizationUrn: null,
        organizationName: connData.personName || "Perfil Pessoal",
        totals: { impressions: 0, likes: 0, comments: 0, shares: 0, clicks: 0 },
        posts: [],
        warning:
          "Nenhuma Página Corporativa selecionada. A API de métricas do LinkedIn (r_organization_social) fornece métricas apenas para Páginas Corporativas.",
      });
    }

    const headers = buildLinkedInHeaders(accessToken);

    // 1. Buscar publicações da Página Corporativa + estatísticas totais da organização em paralelo
    const postsUrl = `https://api.linkedin.com/rest/posts?author=${encodeURIComponent(orgUrn)}&q=author&count=20&sortBy=LAST_MODIFIED`;
    const orgStatsUrl = `https://api.linkedin.com/rest/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=${encodeURIComponent(orgUrn)}`;

    const [postsRes, orgStatsRes] = await Promise.all([
      fetch(postsUrl, { headers, cache: "no-store" }),
      fetch(orgStatsUrl, { headers, cache: "no-store" }),
    ]);

    if (!postsRes.ok) {
      const errText = await postsRes.text();
      console.error("[LINKEDIN_METRICS_POSTS_ERROR]", postsRes.status, errText);
      return NextResponse.json(
        {
          success: false,
          error: `LinkedIn API (${postsRes.status}): ${errText}`,
        },
        { status: postsRes.status === 401 ? 401 : 502 }
      );
    }

    const postsJson = await postsRes.json();
    const rawElements: any[] = Array.isArray(postsJson.elements) ? postsJson.elements : [];

    // Estatísticas totais da organização (lifetime)
    let orgTotals = { impressions: 0, likes: 0, comments: 0, shares: 0, clicks: 0 };
    if (orgStatsRes.ok) {
      const orgStatsJson = await orgStatsRes.json();
      const firstOrgStat = orgStatsJson?.elements?.[0];
      if (firstOrgStat) {
        const extracted = extractShareStats(firstOrgStat);
        orgTotals = {
          impressions: extracted.impressions,
          likes: extracted.likes,
          comments: extracted.comments,
          shares: extracted.shares,
          clicks: extracted.clicks,
        };
      }
    } else {
      console.warn(
        "[LINKEDIN_METRICS_ORG_STATS_WARN]",
        orgStatsRes.status,
        await orgStatsRes.text()
      );
    }

    // 2. Buscar estatísticas individuais por post (separando urn:li:share e urn:li:ugcPost)
    const shareUrns = rawElements
      .map((el) => el.id as string)
      .filter((id) => typeof id === "string" && id.startsWith("urn:li:share:"));
    const ugcPostUrns = rawElements
      .map((el) => el.id as string)
      .filter((id) => typeof id === "string" && id.startsWith("urn:li:ugcPost:"));

    const perPostStatsMap = new Map<string, ReturnType<typeof extractShareStats>>();

    const statsPromises: Promise<void>[] = [];

    if (shareUrns.length > 0) {
      const listParam = `List(${shareUrns.map((u) => encodeURIComponent(u)).join(",")})`;
      const url = `https://api.linkedin.com/rest/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=${encodeURIComponent(orgUrn)}&shares=${listParam}`;
      statsPromises.push(
        fetch(url, { headers, cache: "no-store" })
          .then(async (res) => {
            if (!res.ok) {
              console.warn("[LINKEDIN_SHARE_STATS_WARN]", res.status, await res.text());
              return;
            }
            const data = await res.json();
            for (const item of data.elements || []) {
              if (item.share) {
                perPostStatsMap.set(item.share, extractShareStats(item));
              }
            }
          })
          .catch((e) => console.warn("[LINKEDIN_SHARE_STATS_ERR]", e))
      );
    }

    if (ugcPostUrns.length > 0) {
      const listParam = `List(${ugcPostUrns.map((u) => encodeURIComponent(u)).join(",")})`;
      const url = `https://api.linkedin.com/rest/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=${encodeURIComponent(orgUrn)}&ugcPosts=${listParam}`;
      statsPromises.push(
        fetch(url, { headers, cache: "no-store" })
          .then(async (res) => {
            if (!res.ok) {
              console.warn("[LINKEDIN_UGC_STATS_WARN]", res.status, await res.text());
              return;
            }
            const data = await res.json();
            for (const item of data.elements || []) {
              if (item.ugcPost) {
                perPostStatsMap.set(item.ugcPost, extractShareStats(item));
              }
            }
          })
          .catch((e) => console.warn("[LINKEDIN_UGC_STATS_ERR]", e))
      );
    }

    // 3. Buscar URLs das imagens dos posts (media, multiImage ou article thumbnail)
    const getPostImageUrn = (el: any): string | undefined => {
      const candidates = [
        el?.content?.media?.id,
        el?.content?.multiImage?.images?.[0]?.id,
        el?.content?.article?.thumbnail,
      ];
      return candidates.find(
        (id): id is string => typeof id === "string" && id.startsWith("urn:li:image:")
      );
    };

    const imageUrns = [
      ...new Set(
        rawElements
          .map((el) => getPostImageUrn(el))
          .filter((id): id is string => Boolean(id))
      ),
    ];

    const imageUrlMap = new Map<string, string>();
    if (imageUrns.length > 0) {
      try {
        const idsParam = `List(${imageUrns.map((u) => encodeURIComponent(u)).join(",")})`;
        const batchRes = await fetch(`https://api.linkedin.com/rest/images?ids=${idsParam}`, {
          headers,
          cache: "no-store",
        });
        if (batchRes.ok) {
          const batchData = await batchRes.json();
          const results = batchData?.results || {};
          for (const [urn, imgObj] of Object.entries<any>(results)) {
            if (imgObj?.downloadUrl) {
              imageUrlMap.set(urn, imgObj.downloadUrl);
            }
          }
        } else {
          console.warn(
            "[LINKEDIN_METRICS_IMAGES_BATCH_WARN]",
            batchRes.status,
            await batchRes.text()
          );
        }
      } catch (imgErr) {
        console.warn("[LINKEDIN_METRICS_IMAGES_BATCH_ERR]", imgErr);
      }

      // Fallback individual caso alguma URN não tenha vindo no batch
      const missingUrns = imageUrns.filter((urn) => !imageUrlMap.has(urn));
      await Promise.all(
        missingUrns.map(async (imageUrn) => {
          try {
            const res = await fetch(
              `https://api.linkedin.com/rest/images/${encodeURIComponent(imageUrn)}`,
              { headers, cache: "no-store" }
            );
            if (res.ok) {
              const imgData = await res.json();
              if (imgData?.downloadUrl) {
                imageUrlMap.set(imageUrn, imgData.downloadUrl);
              }
            } else {
              console.warn(
                "[LINKEDIN_METRICS_IMAGE_WARN]",
                imageUrn,
                res.status,
                await res.text()
              );
            }
          } catch {
            // Ignora falha individual de thumbnail
          }
        })
      );
    }

    console.log(
      `[LINKEDIN_METRICS_IMAGES_DEBUG] foundUrns=${imageUrns.length} resolvedUrls=${imageUrlMap.size}`
    );

    await Promise.all(statsPromises);

    const posts: LinkedInPostMetricItem[] = rawElements.map((el) => {
      const id = String(el.id || "");
      const mediaId = getPostImageUrn(el);
      const imageUrl = mediaId ? imageUrlMap.get(mediaId) : undefined;
      const createdMs = Number(el.createdAt || el.lastModifiedAt || Date.now());
      const stats = perPostStatsMap.get(id) || {
        impressions: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        clicks: 0,
        engagementRate: "0.00%",
        numericEngagementRate: 0,
      };

      const status: "trending" | "declining" | "normal" =
        stats.numericEngagementRate >= 2 || stats.likes + stats.comments + stats.shares >= 3
          ? "trending"
          : stats.impressions > 20 && stats.numericEngagementRate < 0.5
            ? "declining"
            : "normal";

      return {
        id,
        text: el.commentary || "Publicação corporativa no LinkedIn",
        imageUrl,
        createdTime: new Date(createdMs).toISOString(),
        permalink: `https://www.linkedin.com/feed/update/${id}/`,
        status,
        metrics: {
          impressions: stats.impressions,
          likes: stats.likes,
          comments: stats.comments,
          shares: stats.shares,
          clicks: stats.clicks,
          engagementRate: stats.engagementRate,
        },
      };
    });

    console.log(
      `[LINKEDIN_METRICS_SUCCESS] org=${orgUrn} posts=${posts.length} impressions=${orgTotals.impressions}`
    );

    return NextResponse.json({
      success: true,
      organizationUrn: orgUrn,
      organizationName:
        connData.selectedOrganizationName || connData.personName || "Página Corporativa",
      totals: orgTotals,
      posts,
    });
  } catch (error: any) {
    console.error("[LINKEDIN_METRICS_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erro ao consultar métricas do LinkedIn.",
      },
      { status: 500 }
    );
  }
}
