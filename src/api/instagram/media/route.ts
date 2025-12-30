
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

interface MediaRequestBody {
  accessToken: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: MediaRequestBody = await request.json();
    const { accessToken } = body;

    if (!accessToken) {
      return NextResponse.json({ success: false, error: "O token de acesso do Instagram é obrigatório." }, { status: 400 });
    }

    // ✅ Campos validados pelo usuário, incluindo like_count e comments_count
    const fields =
      "id,caption,media_type,media_url,permalink,timestamp,thumbnail_url,like_count,comments_count";
    const url = `https://graph.instagram.com/me/media?fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(
      accessToken
    )}&limit=24`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      console.error("[INSTAGRAM_MEDIA_API_ERROR] Falha ao buscar mídias do Instagram:", data?.error);
      if (data?.error?.code === 190) {
        return NextResponse.json({ success: false, error: "Sua sessão com o Instagram expirou. Por favor, reconecte sua conta." }, { status: 401 });
      }
      return NextResponse.json(
        { success: false, error: data?.error?.message || `Falha na API do Instagram com status ${response.status}` },
        { status: response.status }
      );
    }

    // Os dados agora vêm com as contagens básicas, e os insights detalhados serão buscados separadamente.
    const media = (data.data || []).map((item: any) => ({
      id: item.id,
      caption: item.caption,
      media_type: item.media_type,
      media_url: item.media_url,
      thumbnail_url: item.thumbnail_url || item.media_url,
      permalink: item.permalink,
      timestamp: item.timestamp,
      // ✅ agora vem de verdade (ou undefined se oculto)
      like_count: item.like_count ?? 0,
      comments_count: item.comments_count ?? 0,
      // Insights detalhados (como reach) virão por endpoint separado
      insights: null,
    }));

    return NextResponse.json({ success: true, media });
  } catch (error: any) {
    console.error("[INSTAGRAM_MEDIA_ERROR]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
