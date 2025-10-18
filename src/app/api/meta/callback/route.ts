
import { NextResponse, type NextRequest } from "next/server";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;
    const origin = headers().get('origin');

    if (!code) {
      return NextResponse.json(
        { success: false, error: "Authorization code not provided." },
        { status: 400 }
      );
    }
    
    // Substituído por origin para tornar a URL dinâmica
    if (!origin) {
        return NextResponse.json(
            { success: false, error: "Could not determine request origin." },
            { status: 400 }
        );
    }
    
    const clientId = "826418333144156";
    const clientSecret = "944e053d34b162c13408cd00ad276aa2";
    const redirectUri = `${origin}/dashboard/conteudo`;
    
    // 1. Troca o código por um token de acesso de curta duração
    const tokenUrl = `https://graph.facebook.com/v20.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`;
    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("Meta Token Exchange Error:", tokenData);
      throw new Error(tokenData.error?.message || "Falha ao obter token de acesso da Meta.");
    }
    const shortLivedToken = tokenData.access_token;
    
    // 2. Troca o token de curta duração por um de longa duração
    const longLivedTokenUrl = `https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${shortLivedToken}`;
    const longLivedTokenResponse = await fetch(longLivedTokenUrl);
    const longLivedTokenData = await longLivedTokenResponse.json();
    const accessToken = longLivedTokenData.access_token || shortLivedToken;

    // 3. Buscar as páginas do usuário
    const pagesUrl = `https://graph.facebook.com/v20.0/me/accounts?access_token=${accessToken}&fields=id,name,instagram_business_account{username}`;
    const pagesResponse = await fetch(pagesUrl);
    const pagesData = await pagesResponse.json();

    if (!pagesResponse.ok || !pagesData.data) {
        throw new Error("Não foi possível buscar as páginas do Facebook.");
    }
    
    // 4. Encontrar a primeira página com uma conta do Instagram conectada
    const connectedPage = pagesData.data.find((page: any) => page.instagram_business_account);

    if (!connectedPage) {
        throw new Error("Nenhuma Página do Facebook com um perfil do Instagram Business conectado foi encontrada.");
    }

    // 5. Retornar os dados relevantes
    return NextResponse.json({
      success: true,
      accessToken: accessToken,
      pageId: connectedPage.id,
      pageName: connectedPage.name,
      instagramId: connectedPage.instagram_business_account.id,
      instagramUsername: connectedPage.instagram_business_account.username,
      message: "Token e perfis obtidos com sucesso.",
    });

  } catch (error: any) {
    console.error("[META_CALLBACK_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "An unknown error occurred." },
      { status: 500 }
    );
  }
}

    