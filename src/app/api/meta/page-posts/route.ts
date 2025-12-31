
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = 'force-dynamic';

interface PagePostsRequestBody {
  accessToken: string;
  pageId: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: PagePostsRequestBody = await request.json();
        const { accessToken, pageId } = body;

        if (!accessToken || !pageId) {
            return NextResponse.json({ success: false, error: "Access token e Page ID são obrigatórios." }, { status: 400 });
        }

        // CORREÇÃO: Alterado period(day) para period(lifetime) para obter o alcance total.
        const fields = 'id,message,created_time,full_picture,shares,insights.metric(post_impressions_unique).period(lifetime),reactions.summary(total_count),comments.summary(total_count)';

        const url = `https://graph.facebook.com/v20.0/${pageId}/posts?fields=${fields}&access_token=${accessToken}&limit=10`;

        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            console.error("[META_API_ERROR] Falha ao buscar posts da página:", data.error);
            const errorMessage = data.error?.message || `Falha na API da Meta com status ${response.status}`;
            if (data.error?.code === 190) { // OAuthException
              return NextResponse.json({ success: false, error: "Sua sessão com a Meta expirou. Por favor, reconecte sua conta." }, { status: 401 });
            }
            return NextResponse.json({ success: false, error: errorMessage }, { status: response.status });
        }
        
        // Processa os dados para um formato mais amigável
        const posts = data.data.map((post: any) => {
            const insightsData = post.insights?.data || [];
            // O insight de alcance agora é pego diretamente pelo nome.
            const reach = insightsData.find((m: any) => m.name === 'post_impressions_unique')?.values?.[0]?.value || 0;
            const likes = post.reactions?.summary?.total_count || 0;
            const comments = post.comments?.summary?.total_count || 0;
            const shares = post.shares?.count || 0;
            
            return {
                id: post.id,
                message: post.message,
                created_time: post.created_time,
                full_picture: post.full_picture,
                insights: {
                    reach,
                    likes,
                    comments,
                    shares
                }
            };
        });

        return NextResponse.json({ success: true, posts });

    } catch (error: any) {
        console.error("[PAGE_POSTS_ERROR]", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
    
