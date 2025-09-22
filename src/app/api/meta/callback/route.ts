// src/app/api/meta/callback/route.ts
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { code } = await request.json();

  if (!code) {
    return NextResponse.json(
      { success: false, error: "Authorization code not provided." },
      { status: 400 }
    );
  }

  const appId = "YOUR_FACEBOOK_APP_ID";
  const appSecret = "YOUR_FACEBOOK_APP_SECRET";
  
  const origin = request.headers.get('origin');
  if (!origin) {
    return NextResponse.json(
      { success: false, error: "Could not determine request origin." },
      { status: 400 }
    );
  }
  // A URI de redirecionamento DEVE ser exatamente a mesma configurada no seu App da Meta
  const redirectUri = `${origin}/dashboard/conteudo`;

  try {
    // Passo 1: Trocar o código por um token de acesso de curta duração
    const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&redirect_uri=${redirectUri}&client_secret=${appSecret}&code=${code}`;
    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      throw new Error(`Error getting short-lived token: ${tokenData.error.message}`);
    }

    const shortLivedToken = tokenData.access_token;

    // Passo 2: Trocar o token de curta duração por um de longa duração
    const longLivedTokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`;
    const longLivedTokenResponse = await fetch(longLivedTokenUrl);
    const longLivedTokenData = await longLivedTokenResponse.json();
    
    if (longLivedTokenData.error) {
        throw new Error(`Error getting long-lived token: ${longLivedTokenData.error.message}`);
    }

    const longLivedToken = longLivedTokenData.access_token;

    // TODO: Salvar o `longLivedToken` de forma segura (ex: Firestore) associado ao usuário
    console.log("Long-lived token:", longLivedToken);

    return NextResponse.json({
      success: true,
      message: "Meta account connected successfully.",
    });

  } catch (error: any) {
    console.error("Error during Meta OAuth callback:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
