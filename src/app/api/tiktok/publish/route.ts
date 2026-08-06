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

    // 2. Obtém os bytes binários do vídeo para envio via FILE_UPLOAD
    // O método FILE_UPLOAD não exige verificação de domínio no Developer Portal do TikTok
    console.log(`[TIKTOK_PUBLISH] Baixando vídeo para buffer da URL de origem: ${videoUrl}`);
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Falha ao acessar o arquivo de vídeo (HTTP ${videoResponse.status}). Verifique a URL do vídeo.`,
        },
        { status: 400 }
      );
    }
    const arrayBuffer = await videoResponse.arrayBuffer();
    const videoBuffer = Buffer.from(arrayBuffer);
    const videoSize = videoBuffer.length;
    console.log(`[TIKTOK_PUBLISH] Vídeo em memória (${videoSize} bytes). Iniciando FILE_UPLOAD no TikTok...`);

    // 3. Inicia o envio usando Content Posting API v2 com FILE_UPLOAD
    // O escopo video.publish utiliza o endpoint /video/init/ (publicação direta no perfil)
    const initPublishUrl = "https://open.tiktokapis.com/v2/post/publish/video/init/";

    let currentPrivacy = privacyLevel || "SELF_ONLY";
    const getPayload = (privacy: string) => ({
      post_info: {
        title: title || "",
        privacy_level: privacy,
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
        video_cover_timestamp_ms: 1000,
      },
      source_info: {
        source: "FILE_UPLOAD",
        video_size: videoSize,
        chunk_size: videoSize,
        total_chunk_count: 1,
      },
    });

    let response = await fetch(initPublishUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify(getPayload(currentPrivacy)),
    });

    let resData = await response.json();

    // Se falhar por restrição de Sandbox (internal_error, Internal error encountered, ou privacy_level) quando tentou postar público, faz fallback automático para SELF_ONLY
    if (
      (!response.ok || resData.error?.code !== "ok") &&
      currentPrivacy !== "SELF_ONLY" &&
      (resData.error?.code === "internal_error" ||
        JSON.stringify(resData).toLowerCase().includes("internal error") ||
        resData.error?.code?.toLowerCase().includes("privacy"))
    ) {
      console.log(`[TIKTOK_PUBLISH] Erro com privacy_level '${currentPrivacy}'. Tentando fallback automático para SELF_ONLY (obrigatório em modo Sandbox)...`);
      currentPrivacy = "SELF_ONLY";
      response = await fetch(initPublishUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json; charset=UTF-8",
        },
        body: JSON.stringify(getPayload(currentPrivacy)),
      });
      resData = await response.json();
    }

    if (!response.ok || resData.error?.code !== "ok") {
      console.error("[TIKTOK_PUBLISH_INIT_ERROR]", resData);
      const errCode = resData.error?.code;
      let userMessage = resData.error?.message || "Falha ao iniciar publicação do vídeo no TikTok.";

      const resString = JSON.stringify(resData).toLowerCase();

      if (errCode === "scope_not_authorized" || resString.includes("scope")) {
        userMessage = "A conta do TikTok precisa ser reconectada para conceder a permissão de publicação direta no feed. Por favor, desconecte e reconecte o TikTok na aba Conexões.";
      } else if (errCode === "url_ownership_unverified" || errCode === "video_url_unverified") {
        userMessage = "O domínio do armazenamento de vídeo não está verificado no TikTok Developer Portal. Verifique o domínio ou use envio local.";
      } else if (errCode === "privacy_level_not_allowed" || errCode === "invalid_privacy_level" || resString.includes("privacy")) {
        userMessage = `O nível de privacidade '${currentPrivacy}' não é permitido para esta conta no momento. Verifique as restrições da conta ou do modo Sandbox no TikTok Developer Portal.`;
      } else if (errCode === "internal_error" || resString.includes("internal error")) {
        userMessage = "A API v2 do TikTok rejeitou o processamento do vídeo com falha interna (Internal Error). Em modo Sandbox, verifique se a sua conta do TikTok está cadastrada como testadora no Developer Portal e se o vídeo cumpre as especificações da API.";
      } else if (errCode === "unaudited_client_can_only_post_to_private_accounts" || resString.includes("private_accounts")) {
        userMessage = "O nosso app no TikTok Developer Portal ainda está em modo Sandbox (não auditado/homologado). A regra da API do TikTok exige que, durante os testes, o perfil conectado esteja configurado como 'Conta Privada' nas configurações do aplicativo TikTok no celular.";
      }

      return NextResponse.json(
        {
          success: false,
          error: userMessage,
          details: resData,
        },
        { status: 400 }
      );
    }

    const publishId = resData.data?.publish_id;
    const uploadUrl = resData.data?.upload_url;

    if (!uploadUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "O TikTok não retornou a URL de upload (upload_url) para transferência binária.",
          details: resData,
        },
        { status: 400 }
      );
    }

    // 4. Envia os bytes do arquivo de vídeo via PUT diretamente para a upload_url do TikTok
    console.log(`[TIKTOK_PUBLISH] Transferindo ${videoSize} bytes em chunk único para os servidores do TikTok...`);
    const putResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": `${videoSize}`,
        "Content-Range": `bytes 0-${videoSize - 1}/${videoSize}`,
      },
      body: videoBuffer,
    });

    if (!putResponse.ok) {
      const putErrorText = await putResponse.text();
      console.error("[TIKTOK_PUBLISH_PUT_ERROR]", putResponse.status, putErrorText);
      return NextResponse.json(
        {
          success: false,
          error: `Falha ao transferir os bytes do vídeo para os servidores do TikTok (HTTP ${putResponse.status}).`,
          details: putErrorText,
        },
        { status: 400 }
      );
    }

    console.log(`[TIKTOK_PUBLISH] Transferência concluída com sucesso! Publish ID: ${publishId}`);

    // 5. Registra publicação no Firestore do usuário
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
      message: "Publicação no TikTok iniciada e transferida com sucesso!",
    });
  } catch (err: any) {
    console.error("[TIKTOK_PUBLISH_FATAL_ERROR]", err);
    return NextResponse.json(
      { success: false, error: err.message || "Erro interno ao publicar no TikTok." },
      { status: 500 }
    );
  }
}
