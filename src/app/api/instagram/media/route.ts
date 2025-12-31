
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

interface MediaRequestBody {
  accessToken: string;
  after?: string; // Cursor for pagination
}

// Helper to fetch insights for a specific post
async function getPostInsights(postId: string, accessToken: string) {
  const metrics = "reach,saved";
  const insightsUrl = `https://graph.instagram.com/v20.0/${postId}/insights?metric=${metrics}&access_token=${accessToken}`;
  
  try {
    const response = await fetch(insightsUrl, { cache: 'no-store' });
    const data = await response.json();
    
    if (data.error) {
      console.warn(`[INSIGHTS_WARN] Could not fetch insights for post ${postId}: ${data.error.message}`);
      return { reach: 0, saved: 0 };
    }
    
    const getMetricValue = (metricName: string) => {
      const metric = data.data.find((m: any) => m.name === metricName);
      return metric?.values?.[0]?.value ?? 0;
    };

    return {
      reach: getMetricValue('reach'),
      saved: getMetricValue('saved'),
    };
  } catch (e) {
    console.error(`[INSIGHTS_FETCH_ERROR] for post ${postId}:`, e);
    return { reach: 0, saved: 0 };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: MediaRequestBody = await request.json();
    const { accessToken, after } = body;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: "O token de acesso do Instagram é obrigatório." },
        { status: 400 }
      );
    }

    const fields = "id,caption,media_type,media_url,permalink,timestamp,thumbnail_url,like_count,comments_count";
    
    const url = new URL(`https://graph.instagram.com/me/media`);
    url.searchParams.append('fields', fields);
    url.searchParams.append('access_token', accessToken);
    url.searchParams.append('limit', '6'); // Fetch 6 posts at a time

    if (after) {
        url.searchParams.append('after', after);
    }

    const response = await fetch(url.toString(), { cache: "no-store" });
    const data = await response.json();

    if (!response.ok) {
      console.error("[INSTAGRAM_MEDIA_API_ERROR]", data?.error);
      if (data?.error?.code === 190) {
        return NextResponse.json(
          { success: false, error: "Sua sessão com o Instagram expirou. Por favor, reconecte sua conta." },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { success: false, error: data?.error?.message || `Falha na API do Instagram (${response.status})` },
        { status: response.status }
      );
    }
    
    const mediaItems = data.data || [];

    const mediaWithInsights = await Promise.all(
      mediaItems.map(async (item: any) => {
        const insights = await getPostInsights(item.id, accessToken);
        return {
          id: item.id,
          caption: item.caption,
          media_type: item.media_type,
          media_url: item.media_url,
          thumbnail_url: item.thumbnail_url || item.media_url,
          permalink: item.permalink,
          timestamp: item.timestamp,
          like_count: item.like_count ?? 0,
          comments_count: item.comments_count ?? 0,
          insights: insights, 
        };
      })
    );

    // Extract the 'after' cursor for the next page
    const nextCursor = data.paging?.cursors?.after || null;

    return NextResponse.json({ success: true, media: mediaWithInsights, nextCursor });

  } catch (error: any) {
    console.error("[INSTAGRAM_MEDIA_ERROR]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
