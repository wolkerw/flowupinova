import { NextResponse, type NextRequest } from "next/server";
import { getUidFromCookie } from "@/lib/firebase-admin";
import { getMetaConnectionAdmin } from "@/lib/services/meta-service-admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const uid = await getUidFromCookie();
    if (!uid) {
      return NextResponse.json(
        { success: false, error: "Usuário não autenticado." },
        { status: 401 }
      );
    }

    const metaConnection = await getMetaConnectionAdmin(uid);
    if (!metaConnection.isConnected || !metaConnection.accessToken || !metaConnection.pageId) {
      return NextResponse.json(
        { success: false, error: "Sua conta do Facebook/Instagram não está conectada." },
        { status: 403 }
      );
    }

    const metaToken = metaConnection.accessToken;
    const pageId = metaConnection.pageId;

    console.log(
      `[INSTAGRAM_POSTS_ROUTE] Buscando conta comercial do Instagram para a Página: ${pageId}`
    );

    // 1. Obter o ID da conta do Instagram Business vinculada à Página do Facebook
    const pageInstaRes = await fetch(
      `https://graph.facebook.com/v24.0/${pageId}?fields=instagram_business_account&access_token=${metaToken}`
    );

    if (!pageInstaRes.ok) {
      const errData = await pageInstaRes.json();
      console.error("[INSTAGRAM_POSTS_ROUTE] Erro ao buscar instagram_business_account:", errData);
      return NextResponse.json(
        {
          success: false,
          error:
            errData.error?.message ||
            "Não foi possível consultar a conta comercial do Instagram vinculada à página.",
        },
        { status: pageInstaRes.status }
      );
    }

    const pageInstaData = await pageInstaRes.json();
    const instagramBusinessAccountId = pageInstaData?.instagram_business_account?.id;

    if (!instagramBusinessAccountId) {
      console.log(
        "[INSTAGRAM_POSTS_ROUTE] Nenhuma conta comercial do Instagram vinculada à página."
      );
      return NextResponse.json({
        success: true,
        posts: [],
        message: "Nenhuma conta do Instagram Business está vinculada a esta página do Facebook.",
      });
    }

    console.log(
      `[INSTAGRAM_POSTS_ROUTE] Conta comercial encontrada: ${instagramBusinessAccountId}. Buscando posts...`
    );

    // 2. Buscar as mídias da conta comercial do Instagram
    const fields =
      "id,caption,media_type,media_url,permalink,timestamp,thumbnail_url,like_count,comments_count";
    const mediaUrl = `https://graph.facebook.com/v24.0/${instagramBusinessAccountId}/media?fields=${fields}&limit=30&access_token=${metaToken}`;

    const mediaRes = await fetch(mediaUrl);
    const mediaData = await mediaRes.json();

    if (!mediaRes.ok) {
      console.error("[INSTAGRAM_POSTS_ROUTE] Erro ao buscar mídias do Instagram:", mediaData);
      return NextResponse.json(
        {
          success: false,
          error: mediaData.error?.message || "Falha ao obter as postagens da conta do Instagram.",
        },
        { status: mediaRes.status }
      );
    }

    const rawMedia = mediaData.data || [];

    // 3. Mapear para o formato do grid esperado pelo modal do frontend
    const posts = rawMedia.map((item: any) => ({
      id: item.id,
      text: item.caption || "",
      imageUrl: item.media_url,
      thumbnailUrl: item.thumbnail_url || item.media_url,
      mediaType: item.media_type,
      permalink: item.permalink,
      createdAt: item.timestamp,
      likes: item.like_count || 0,
      comments: item.comments_count || 0,
      source: "instagram_feed",
    }));

    return NextResponse.json({
      success: true,
      posts,
    });
  } catch (error: any) {
    console.error("[INSTAGRAM_POSTS_ROUTE_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
