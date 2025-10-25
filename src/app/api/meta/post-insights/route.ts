
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = 'force-dynamic';

interface InsightsRequestBody {
  accessToken: string;
  postId: string;
}

// Helper to fetch data from Meta API
async function fetchFromMeta(url: string) {
    const response = await fetch(url);
    const data = await response.json();
    if (data.error) {
        console.error("[POST_INSIGHTS_ERROR] API Error:", data.error);
        throw new Error(`Erro na API (${data.error.code}): ${data.error.message}`);
    }
    return data;
}

export async function POST(request: NextRequest) {
    try {
        const body: InsightsRequestBody = await request.json();
        const { accessToken, postId } = body;

        if (!accessToken || !postId) {
            return NextResponse.json({ success: false, error: "Access token e Post ID são obrigatórios." }, { status: 400 });
        }

        // Step 1: Get the media product type
        const mediaInfoUrl = `https://graph.facebook.com/v24.0/${postId}?fields=media_product_type&access_token=${accessToken}`;
        const mediaInfo = await fetchFromMeta(mediaInfoUrl);
        const mediaProductType = mediaInfo.media_product_type;

        // Step 2: Build the metrics list based on the media type
        let metricsList = 'reach,views,likes,comments,shares,saved,total_interactions,profile_visits';
        
        if (mediaProductType === 'REELS') {
            metricsList += ',ig_reels_avg_watch_time,ig_reels_video_view_total_time';
        }

        // Step 3: Fetch the insights with the correct metrics
        const insightsUrl = `https://graph.facebook.com/v24.0/${postId}/insights?metric=${metricsList}&access_token=${accessToken}`;
        const insightsData = await fetchFromMeta(insightsUrl);

        const insights: { [key: string]: any } = {};
        insightsData.data?.forEach((metric: any) => {
             if (metric.values && metric.values.length > 0) {
                // Convert ms to seconds for watch time metrics
                if (metric.name === 'ig_reels_avg_watch_time' || metric.name === 'ig_reels_video_view_total_time') {
                     insights[metric.name] = (metric.values[0].value || 0) / 1000;
                } else {
                    insights[metric.name] = metric.values[0].value || 0;
                }
            }
        });

        // The API already gives 'likes' and 'comments', so we just ensure they exist.
        insights['like_count'] = insights.likes ?? 0;
        insights['comments_count'] = insights.comments ?? 0;
        
        return NextResponse.json({ success: true, insights });

    } catch (error: any) {
        console.error("[POST_INSIGHTS_ERROR] Internal error:", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
