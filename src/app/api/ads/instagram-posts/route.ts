import { NextResponse, type NextRequest } from "next/server";
import { getUidFromCookie } from "@/lib/firebase-admin";
import { adminDb } from "@/lib/firebase-admin";

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

    // 1. Tentar buscar pela conexão direta do Instagram (Basic Display API, usada nos Relatórios)
    const instagramConnDoc = await adminDb
      .collection("users")
      .doc(uid)
      .collection("connections")
      .doc("instagram")
      .get();

    const instagramConn = instagramConnDoc.exists ? instagramConnDoc.data() : null;

    if (instagramConn?.isConnected && instagramConn?.accessToken) {
      console.log(
        `[INSTAGRAM_POSTS_ROUTE] Buscando posts via conexão direta do Instagram para o usuário: ${uid}`
      );
      const instagramToken = instagramConn.accessToken;
      const fields =
        "id,caption,media_type,media_url,permalink,timestamp,thumbnail_url,like_count,comments_count";
      const mediaUrl = `https://graph.instagram.com/me/media?fields=${fields}&limit=30&access_token=${instagramToken}`;

      const mediaRes = await fetch(mediaUrl, { cache: "no-store" });
      const mediaData = await mediaRes.json();

      if (mediaRes.ok && mediaData.data) {
        const posts = mediaData.data.map((item: any) => ({
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

        return NextResponse.json({ success: true, posts });
      } else {
        console.warn(
          "[INSTAGRAM_POSTS_ROUTE] Falha ao buscar posts via conexão direta do Instagram, tentando fallback Meta:",
          mediaData
        );
      }
    }

    // 2. Fallback: buscar pela conta vinculada da Meta (Facebook Page -> Instagram Business Account)
    const metaConnDoc = await adminDb
      .collection("users")
      .doc(uid)
      .collection("connections")
      .doc("meta")
      .get();

    const metaConnection = metaConnDoc.exists ? metaConnDoc.data() : null;

    if (!metaConnection?.isConnected || !metaConnection?.accessToken || !metaConnection?.pageId) {
      return NextResponse.json(
        { success: false, error: "Nenhuma conexão ativa do Instagram ou Facebook encontrada." },
        { status: 403 }
      );
    }

    const metaToken = metaConnection.accessToken;
    const pageId = metaConnection.pageId;

    console.log(
      `[INSTAGRAM_POSTS_ROUTE] Fallback: Buscando conta comercial do Instagram para a Página: ${pageId}`
    );

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
      return NextResponse.json({
        success: true,
        posts: [],
        message: "Nenhuma conta do Instagram Business está vinculada a esta página do Facebook.",
      });
    }

    const fields =
      "id,caption,media_type,media_url,permalink,timestamp,thumbnail_url,like_count,comments_count";
    const mediaUrl = `https://graph.facebook.com/v24.0/${instagramBusinessAccountId}/media?fields=${fields}&limit=30&access_token=${metaToken}`;

    const mediaRes = await fetch(mediaUrl, { cache: "no-store" });
    const mediaData = await mediaRes.json();

    if (!mediaRes.ok) {
      console.error("[INSTAGRAM_POSTS_ROUTE] Erro no fallback do Instagram:", mediaData);
      return NextResponse.json(
        {
          success: false,
          error: mediaData.error?.message || "Falha ao obter as postagens da conta do Instagram.",
        },
        { status: mediaRes.status }
      );
    }

    const rawMedia = mediaData.data || [];

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
