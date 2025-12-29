
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = 'force-dynamic';

interface MediaRequestBody {
  accessToken: string;
  // O instagramId não é mais necessário, pois usamos o endpoint /me/media
}

export async function POST(request: NextRequest) {
    try {
        const body: MediaRequestBody = await request.json();
        const { accessToken } = body;

        if (!accessToken) {
            return NextResponse.json({ success: false, error: "O token de acesso do Instagram é obrigatório." }, { status: 400 });
        }

        const fields = 'id,caption,media_type,media_url,permalink,timestamp,username,thumbnail_url';
        const url = `https://graph.instagram.com/me/media?fields=${fields}&access_token=${accessToken}&limit=24`;

        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            console.error("[INSTAGRAM_MEDIA_API_ERROR] Falha ao buscar mídias do Instagram:", data.error);
            const errorMessage = data.error?.message || `Falha na API do Instagram com status ${response.status}`;
             if (data.error?.code === 190) { // OAuthException
              return NextResponse.json({ success: false, error: "Sua sessão com o Instagram expirou. Por favor, reconecte sua conta." }, { status: 401 });
            }
            return NextResponse.json({ success: false, error: errorMessage }, { status: response.status });
        }
        
        // A API de /me/media não retorna os insights diretamente.
        // Eles precisam ser buscados por post no modal.
        // A estrutura dos likes e comments também não vem aqui.
        const media = data.data.map((item: any) => {
            return {
                id: item.id,
                caption: item.caption,
                media_type: item.media_type,
                media_url: item.media_url,
                thumbnail_url: item.media_type === 'VIDEO' ? item.thumbnail_url : item.media_url,
                permalink: item.permalink,
                timestamp: item.timestamp,
                username: item.username,
                // Os insights e contagens virão de uma chamada separada no modal.
                insights: { reach: 0, shares: 0 },
                like_count: 0,
                comments_count: 0,
            };
        });

        return NextResponse.json({ success: true, media });

    } catch (error: any) {
        console.error("[INSTAGRAM_MEDIA_ERROR]", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
