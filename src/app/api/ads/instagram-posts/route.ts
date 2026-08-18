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

    // 1. Tentar buscar pela conexão direta do Instagram (Basic Display API / Instagram Login)
    try {
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

        if (mediaRes.ok && mediaData.data && Array.isArray(mediaData.data)) {
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
            "[INSTAGRAM_POSTS_ROUTE] Conexão direta do Instagram não retornou mídias:",
            mediaData
          );
        }
      }
    } catch (instaErr) {
      console.warn("[INSTAGRAM_POSTS_ROUTE] Erro ao consultar conexão direta do Instagram:", instaErr);
    }

    // 2. Fallback: buscar pela conta vinculada da Meta (Facebook Page -> Instagram Business Account)
    const metaConnDoc = await adminDb
      .collection("users")
      .doc(uid)
      .collection("connections")
      .doc("meta")
      .get();

    const metaConnection = metaConnDoc.exists ? metaConnDoc.data() : null;

    if (!metaConnection?.isConnected || (!metaConnection?.accessToken && !metaConnection?.userAccessToken)) {
      return NextResponse.json({
        success: true,
        posts: [],
        message: "Nenhuma conexão ativa do Instagram ou Facebook encontrada.",
      });
    }

    const availableTokens = [
      metaConnection.userAccessToken,
      metaConnection.accessToken,
    ].filter(Boolean);

    const pageId = metaConnection.pageId;

    if (!pageId) {
      return NextResponse.json({
        success: true,
        posts: [],
        message: "Nenhuma página do Facebook selecionada.",
      });
    }

    // Tentar consultar instagram_business_account com os tokens disponíveis
    let instagramBusinessAccountId: string | null = null;

    for (const token of availableTokens) {
      try {
        const pageInstaRes = await fetch(
          `https://graph.facebook.com/v24.0/${pageId}?fields=instagram_business_account&access_token=${token}`,
          { cache: "no-store" }
        );
        const pageInstaData = await pageInstaRes.json();

        if (pageInstaRes.ok && pageInstaData?.instagram_business_account?.id) {
          instagramBusinessAccountId = pageInstaData.instagram_business_account.id;
          break;
        } else {
          console.warn(
            `[INSTAGRAM_POSTS_ROUTE] Resposta da Meta para instagram_business_account:`,
            pageInstaData?.error?.message || pageInstaData
          );
        }
      } catch (err) {
        console.warn("[INSTAGRAM_POSTS_ROUTE] Falha ao testar token para instagram_business_account:", err);
      }
    }

    if (!instagramBusinessAccountId) {
      return NextResponse.json({
        success: true,
        posts: [],
        message: "Nenhuma conta do Instagram Business está vinculada a esta página do Facebook ou permissão não concedida.",
      });
    }

    // Buscar mídias da conta comercial encontrada
    const fields =
      "id,caption,media_type,media_url,permalink,timestamp,thumbnail_url,like_count,comments_count";

    for (const token of availableTokens) {
      try {
        const mediaUrl = `https://graph.facebook.com/v24.0/${instagramBusinessAccountId}/media?fields=${fields}&limit=30&access_token=${token}`;
        const mediaRes = await fetch(mediaUrl, { cache: "no-store" });
        const mediaData = await mediaRes.json();

        if (mediaRes.ok && mediaData.data && Array.isArray(mediaData.data)) {
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

          return NextResponse.json({
            success: true,
            posts,
          });
        } else {
          console.warn("[INSTAGRAM_POSTS_ROUTE] Falha ao buscar posts do instagram_business_account:", mediaData?.error?.message || mediaData);
        }
      } catch (err) {
        console.warn("[INSTAGRAM_POSTS_ROUTE] Erro ao obter mídias com token:", err);
      }
    }

    // Se não encontrou ou não tem permissão no momento, retorna lista vazia segura
    return NextResponse.json({
      success: true,
      posts: [],
      message: "Não foram encontradas postagens públicas no Instagram ou a permissão de leitura não está ativa.",
    });
  } catch (error: any) {
    console.error("[INSTAGRAM_POSTS_ROUTE_ERROR]", error);
    return NextResponse.json({
      success: true,
      posts: [],
      error: error.message || "Erro ao consultar posts do Instagram.",
    });
  }
}
