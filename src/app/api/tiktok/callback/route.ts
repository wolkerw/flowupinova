import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const userId = searchParams.get("state"); // state passes the Firebase userId

  // Real host detection
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") || "https";
  const origin = `${protocol}://${host}`;

  const redirectUrl = new URL("/dashboard/meu-negocio", origin);
  redirectUrl.search = "";

  if (error) {
    console.error("[TIKTOK_CALLBACK_ERROR] Erro na autorização:", error);
    redirectUrl.searchParams.set("tiktok_error", error);
    redirectUrl.searchParams.set(
      "tiktok_error_description",
      searchParams.get("error_description") || "Usuário negou o acesso no TikTok."
    );
    return NextResponse.redirect(redirectUrl);
  }

  if (!code) {
    redirectUrl.searchParams.set("tiktok_error", "missing_code");
    redirectUrl.searchParams.set("tiktok_error_description", "Código de autorização ausente.");
    return NextResponse.redirect(redirectUrl);
  }

  if (!userId) {
    redirectUrl.searchParams.set("tiktok_error", "missing_state");
    redirectUrl.searchParams.set(
      "tiktok_error_description",
      "Identificação do usuário (state) ausente."
    );
    return NextResponse.redirect(redirectUrl);
  }

  if (!config.tiktok.clientKey || !config.tiktok.clientSecret) {
    console.error(
      "[TIKTOK_CALLBACK_ERROR] Credenciais do TikTok não configuradas no servidor."
    );
    redirectUrl.searchParams.set("tiktok_error", "server_config_missing");
    redirectUrl.searchParams.set(
      "tiktok_error_description",
      "Configuração do servidor para TikTok incompleta."
    );
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const currentCallbackUri = `${origin}/api/tiktok/callback`;

    // 1. Troca o código pelo Token de Acesso
    const tokenUrl = "https://open.tiktokapis.com/v2/oauth/token/";
    const tokenParams = new URLSearchParams({
      client_key: config.tiktok.clientKey,
      client_secret: config.tiktok.clientSecret,
      code: code,
      grant_type: "authorization_code",
      redirect_uri: currentCallbackUri,
    });

    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache",
      },
      body: tokenParams.toString(),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("[TIKTOK_CALLBACK_ERROR] Resposta da troca de token:", tokenData);
      throw new Error(
        tokenData.error_description || tokenData.message || "Falha na troca de tokens com o TikTok."
      );
    }

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token || null;
    const openId = tokenData.open_id || null;

    // 2. Busca informações do perfil do TikTok
    let displayName = "Usuário do TikTok";
    let avatarUrl = "";

    try {
      const userProfileRes = await fetch(
        "https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (userProfileRes.ok) {
        const userProfileData = await userProfileRes.json();
        const userInfo = userProfileData.data?.user;
        if (userInfo) {
          displayName = userInfo.display_name || displayName;
          avatarUrl = userInfo.avatar_url || avatarUrl;
        }
      }
    } catch (profileErr) {
      console.warn("[TIKTOK_CALLBACK_WARN] Não foi possível buscar o perfil do TikTok:", profileErr);
    }

    // 3. Salva os dados de conexão no Firestore
    const connectionPayload = {
      isConnected: true,
      accessToken,
      refreshToken,
      openId,
      displayName,
      avatarUrl,
      connectedAt: new Date(),
    };

    await adminDb
      .collection("users")
      .doc(userId)
      .collection("connections")
      .doc("tiktok")
      .set(connectionPayload, { merge: true });

    console.log(`[TIKTOK_CALLBACK_SUCCESS] Conexão salva no Firestore para o usuário: ${userId}`);

    redirectUrl.searchParams.set("tiktok_connection_success", "true");
    redirectUrl.searchParams.set("tiktok_name", displayName);

    return NextResponse.redirect(redirectUrl);
  } catch (err: any) {
    console.error("[TIKTOK_CALLBACK_FATAL_ERROR]", err);
    redirectUrl.searchParams.set("tiktok_error", "token_exchange_failed");
    redirectUrl.searchParams.set("tiktok_error_description", encodeURIComponent(err.message || "Falha ao conectar TikTok."));
    return NextResponse.redirect(redirectUrl);
  }
}
