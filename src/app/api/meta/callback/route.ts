// src/app/api/meta/callback/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // The user ID is now in the state
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const dashboardUrl = new URL(req.nextUrl.origin + "/dashboard/conteudo");

  if (error) {
    console.error(`[Meta Auth Error] ${error}: ${errorDescription}`);
    dashboardUrl.searchParams.set("error", errorDescription || "Ocorreu um erro desconhecido durante a autenticação com a Meta.");
    return NextResponse.redirect(dashboardUrl);
  }

  const userId = state;
  console.log(`[Meta Auth] Callback received for user: ${userId} with code: ${code}`);

  if (!userId) {
     console.error("[Meta Auth Error] User ID (state) is missing from callback.");
     dashboardUrl.searchParams.set("error", "Não foi possível identificar o usuário (estado de autenticação inválido). Faça login e tente novamente.");
     return NextResponse.redirect(dashboardUrl);
  }

  if (!code) {
    console.error("[Meta Auth Error] Authorization code is missing from callback.");
    dashboardUrl.searchParams.set("error", "O código de autorização não foi recebido. Por favor, tente novamente.");
    return NextResponse.redirect(dashboardUrl);
  }

  // --- Real Token Exchange Logic ---
  const clientId = process.env.NEXT_PUBLIC_META_APP_ID;
  const clientSecret = process.env.META_APP_SECRET;
  // Construa a redirectUri de forma consistente com o frontend
  const redirectUri = new URL('/api/meta/callback', req.nextUrl.origin).toString();

  if (!clientId || !clientSecret) {
    console.error("[Meta Auth FATAL] Missing META_APP_ID or META_APP_SECRET in .env file.");
    dashboardUrl.searchParams.set("error", "Erro de configuração do servidor. Credenciais da Meta ausentes.");
    return NextResponse.redirect(dashboardUrl);
  }

  const tokenUrl = `https://graph.facebook.com/v20.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`;

  try {
    console.log(`[Meta Auth] Exchanging code for access token for user ${userId}...`);
    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || tokenData.error) {
      console.error("[Meta Auth FATAL] Error exchanging code for token:", tokenData.error);
      throw new Error(tokenData.error.message || "Falha ao obter o token de acesso da Meta.");
    }
    
    const accessToken = tokenData.access_token;
    console.log(`[Meta Auth] Access token received for user ${userId}. Token starts with: ${accessToken.substring(0, 10)}...`);

    // Use n8n webhook to update Firestore
    const webhookUrl = process.env.N8N_WEBHOOK_URL + "/webhook/update-firestore";
    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: `users/${userId}/connections/meta`,
        data: { isConnected: true, connectedAt: new Date().toISOString() }
      }),
    });

    if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text();
        throw new Error(`Webhook to update Firestore failed: ${errorText}`);
    }

    console.log(`[Meta Auth] Firestore update request sent via webhook for user ${userId}. Redirecting to dashboard.`);

    // Redirect back to the dashboard with a success indicator
    dashboardUrl.searchParams.set("connected", "true");
    return NextResponse.redirect(dashboardUrl);

  } catch (exchangeError: any) {
    console.error("[Meta Auth FATAL] Error during token exchange or saving status:", exchangeError);
    dashboardUrl.searchParams.set("error", `Falha ao processar a autenticação da Meta: ${exchangeError.message}`);
    return NextResponse.redirect(dashboardUrl);
  }
}
