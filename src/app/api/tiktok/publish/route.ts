import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

/**
 * Endpoint para publicar vídeo no TikTok usando a Content Posting API v2 do TikTok.
 * Endpoint TikTok: POST https://open.tiktokapis.com/v2/post/publish/video/init/
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, title, videoUrl, privacyLevel } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Identificação do usuário (userId) é obrigatória." },
        { status: 400 }
      );
    }

    if (!videoUrl) {
      return NextResponse.json(
        { success: false, error: "URL do vídeo é obrigatória para publicação no TikTok." },
        { status: 400 }
      );
    }

    // 1. Busca os dados da conexão do TikTok no Firestore
    const connectionDoc = await adminDb
      .collection("users")
      .doc(userId)
      .collection("connections")
      .doc("tiktok")
      .get();

    if (!connectionDoc.exists || !connectionDoc.data()?.isConnected || !connectionDoc.data()?.accessToken) {
      return NextResponse.json(
        { success: false, error: "Conta do TikTok não conectada. Conecte sua conta antes de publicar." },
        { status: 400 }
      );
    }

    const { accessToken } = connectionDoc.data()!;

    // 2. Inicia o envio usando Content Posting API v2 (PULL_FROM_URL)
    const initPublishUrl = "https://open.tiktokapis.com/v2/post/publish/video/init/";

    const publishPayload = {
      post_info: {
        title: title || "Vídeo publicado via NumVapt AI",
        privacy_level: privacyLevel || "SELF_ONLY", // SELF_ONLY, PUBLIC, FRIENDS
        disable_duet: false,
        disable_stitch: false,
        disable_comment: false,
        auto_add_music: false,
      },
      source_info: {
        source: "PULL_FROM_URL",
        video_url: videoUrl,
      },
    };

    const response = await fetch(initPublishUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify(publishPayload),
    });

    const resData = await response.json();

    if (!response.ok || resData.error?.code !== "ok") {
      console.error("[TIKTOK_PUBLISH_ERROR]", resData);
      return NextResponse.json(
        {
          success: false,
          error: resData.error?.message || "Falha ao iniciar publicação do vídeo no TikTok.",
          details: resData,
        },
        { status: 400 }
      );
    }

    const publishId = resData.data?.publish_id;

    // Registra publicação no Firestore do usuário
    await adminDb
      .collection("users")
      .doc(userId)
      .collection("posts")
      .add({
        platform: "tiktok",
        title: title || "",
        videoUrl,
        publishId,
        status: "PROCESSING",
        createdAt: new Date(),
      });

    return NextResponse.json({
      success: true,
      publishId,
      message: "Publicação no TikTok iniciada com sucesso!",
    });
  } catch (err: any) {
    console.error("[TIKTOK_PUBLISH_FATAL_ERROR]", err);
    return NextResponse.json(
      { success: false, error: err.message || "Erro interno ao publicar no TikTok." },
      { status: 500 }
    );
  }
}
