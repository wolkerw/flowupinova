
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = 'force-dynamic';

interface MediaRequestBody {
  accessToken: string;
  instagramId: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: MediaRequestBody = await request.json();
        const { accessToken, instagramId } = body;

        if (!accessToken || !instagramId) {
            return NextResponse.json({ success: false, error: "Access token e Instagram ID são obrigatórios." }, { status: 400 });
        }

        // Usamos 'reach' para alcance e 'shares' para compartilhamentos.
        const fields = 'id,caption,media_type,media_url,permalink,timestamp,username,comments_count,like_count,insights.metric(reach,shares).period(lifetime)';
        const url = `https://graph.facebook.com/v20.0/${instagramId}/media?fields=${fields}&access_token=${accessToken}&limit=12`;

        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            console.error("[META_API_ERROR] Falha ao buscar mídias do Instagram:", data.error);
            const errorMessage = data.error?.message || `Falha na API da Meta com status ${response.status}`;
             if (data.error?.code === 190) { // OAuthException
              return NextResponse.json({ success: false, error: "Sua sessão com a Meta expirou. Por favor, reconecte sua conta." }, { status: 401 });
            }
            return NextResponse.json({ success: false, error: errorMessage }, { status: response.status });
        }

        const media = data.data.map((item: any) => {
            const insightsData = item.insights?.data || [];
            const getInsightValue = (name: string) => insightsData.find((i: any) => i.name === name)?.values[0]?.value || 0;
            
            return {
                id: item.id,
                caption: item.caption,
                media_type: item.media_type,
                media_url: item.media_url,
                permalink: item.permalink,
                timestamp: item.timestamp,
                username: item.username,
                comments_count: item.comments_count || 0,
                like_count: item.like_count || 0,
                insights: {
                    reach: getInsightValue('reach'),
                    shares: getInsightValue('shares')
                }
            };
        });

        return NextResponse.json({ success: true, media });

    } catch (error: any) {
        console.error("[INSTAGRAM_MEDIA_ERROR]", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
