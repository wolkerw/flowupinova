
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

        const host = "https://graph.instagram.com";
        const apiVersion = "v24.0";

        // Step 1: Get the media product type to determine which metrics are available.
        const mediaInfoUrl = `${host}/${apiVersion}/${postId}?fields=media_product_type,media_type&access_token=${accessToken}`;
        const mediaInfo = await fetchFromMeta(mediaInfoUrl);
        const mediaProductType = mediaInfo.media_product_type; // e.g., FEED, REELS, STORY
        const mediaType = mediaInfo.media_type; // e.g., IMAGE, VIDEO, CAROUSEL_ALBUM

        // Step 2: Build the metrics list based on the media type.
        let metricsList = 'reach,saved,total_interactions'; // Base metrics for almost all types

        // Add metrics specific to Reels/Video
        if (mediaProductType === 'REELS' || mediaType === 'VIDEO') {
            metricsList += ',plays,ig_reels_avg_watch_time,ig_reels_video_view_total_time,likes,comments,shares';
        } 
        // Add metrics specific to Feed/Carousel
        else if (mediaProductType === 'FEED' || mediaType === 'IMAGE' || mediaType === 'CAROUSEL_ALBUM') {
            metricsList += ',impressions,profile_activity,likes,comments,shares';
        }
        else { // Fallback for other types like STORY
            metricsList += ',impressions,likes,comments,shares';
        }


        // Step 3: Fetch the insights with the dynamically built metrics list.
        const insightsUrl = `${host}/${apiVersion}/${postId}/insights?metric=${metricsList}&access_token=${accessToken}`;
        const insightsData = await fetchFromMeta(insightsUrl);

        const insights: { [key: string]: any } = {};
        insightsData.data?.forEach((metric: any) => {
             if (metric.values && metric.values.length > 0) {
                // Convert ms to seconds for watch time metrics
                if (metric.name === 'ig_reels_avg_watch_time' || metric.name === 'ig_reels_video_view_total_time') {
                     insights[metric.name] = (metric.values[0].value || 0) / 1000;
                } else if(metric.name === 'profile_activity') {
                    // Profile activity is an object, so we merge its fields.
                    const activityValue = metric.values[0].value || {};
                    Object.assign(insights, activityValue);
                } else {
                    insights[metric.name] = metric.values[0].value || 0;
                }
            }
        });

        // The API already gives 'likes' and 'comments', so we just ensure they exist for consistency.
        insights['like_count'] = insights.likes ?? 0;
        insights['comments_count'] = insights.comments ?? 0;
        
        return NextResponse.json({ success: true, insights });

    } catch (error: any) {
        console.error("[POST_INSIGHTS_ERROR] Internal error:", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
