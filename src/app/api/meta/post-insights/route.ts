
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = 'force-dynamic';

interface InsightsRequestBody {
  accessToken: string;
  postId: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: InsightsRequestBody = await request.json();
        const { accessToken, postId } = body;

        if (!accessToken || !postId) {
            return NextResponse.json({ success: false, error: "Access token e Post ID são obrigatórios." }, { status: 400 });
        }

        const metrics = [
            'reach',
            'likes',
            'comments',
            'shares',
            'saved',
            'profile_visits',
            'profile_activity'
        ].join(',');

        const url = `https://graph.facebook.com/v20.0/${postId}/insights?metric=${metrics}&breakdown=action_type&access_token=${accessToken}`;

        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            console.error("[META_API_ERROR] Falha ao buscar insights:", data.error);
            throw new Error(data.error?.message || `Falha na API da Meta com status ${response.status}`);
        }
        
        // Processa os dados para um formato mais amigável
        const insights: { [key: string]: any } = {};
        if (data.data && Array.isArray(data.data)) {
            data.data.forEach((metric: any) => {
                 // Para métricas simples como 'reach', 'likes', etc.
                if (metric.name !== 'profile_activity' && metric.values && metric.values.length > 0) {
                    insights[metric.name] = metric.values[0].value || 0;
                }
                // Para a métrica com 'breakdown' como 'profile_activity'
                else if (metric.name === 'profile_activity' && metric.total_value?.breakdowns?.[0]?.results) {
                    metric.total_value.breakdowns[0].results.forEach((breakdown: any) => {
                        const actionType = breakdown.dimension_values?.[0];
                        const snakeCaseAction = actionType.toLowerCase() + '_clicks';
                         // Remapeia para nomes mais amigáveis e consistentes
                        if (actionType === 'bio_link_clicked') insights['bio_link_clicked'] = breakdown.value;
                        if (actionType === 'call') insights['call_clicks'] = breakdown.value;
                        if (actionType === 'email') insights['email_contacts'] = breakdown.value;
                    });
                }
            });
        }

        return NextResponse.json({ success: true, insights });

    } catch (error: any) {
        console.error("[POST_INSIGHTS_ERROR]", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

    