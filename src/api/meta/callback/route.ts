
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
    
    if (!origin) {
        return NextResponse.json(
            { success: false, error: "Could not determine request origin." },
            { status: 400 }
        );
    }
    
    const clientId = process.env.META_CLIENT_ID;
    const clientSecret = process.env.META_CLIENT_SECRET;
    const redirectUri = `${origin}/dashboard/conteudo`;
    
    if (!clientId || !clientSecret) {
      console.error("[META_CALLBACK_ERROR] Variáveis de ambiente META_CLIENT_ID ou META_CLIENT_SECRET não estão definidas.");
      return NextResponse.json({ success: false, error: "Erro de configuração no servidor. As credenciais da Meta não foram encontradas." }, { status: 500 });
    }

    // Etapa 1: Trocar o código por um token de acesso de curta duração do USUÁRIO
    const tokenUrl = `https://graph.facebook.com/v20.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`;
    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("Meta Token Exchange Error (Short-lived):", tokenData.error);
      throw new Error(tokenData.error?.message || "Falha ao obter token de acesso de curta duração da Meta.");
    }
    const shortLivedUserToken = tokenData.access_token;
    
    // Etapa 2: Trocar o token de curta duração por um de longa duração do USUÁRIO
    const longLivedTokenUrl = `https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${shortLivedUserToken}`;
    const longLivedTokenResponse = await fetch(longLivedTokenUrl);
    const longLivedTokenData = await longLivedTokenResponse.json();
    
    if (!longLivedTokenResponse.ok || !longLivedTokenData.access_token) {
        console.error("Meta Token Exchange Error (Long-lived):", longLivedTokenData.error);
        console.warn("Could not exchange for a long-lived user token. Proceeding with short-lived token.");
    }
    const userAccessToken = longLivedTokenData.access_token || shortLivedUserToken;

    // Etapa 3: Usar o token do usuário para buscar as PÁGINAS e obter o TOKEN DE ACESSO DA PÁGINA
    // Este é o passo crucial que estava faltando
    const pagesUrl = `https://graph.facebook.com/v20.0/me/accounts?access_token=${userAccessToken}&fields=id,name,access_token,instagram_business_account{id,username,name}`;
    const pagesResponse = await fetch(pagesUrl);
    const pagesData = await pagesResponse.json();

    if (!pagesResponse.ok || !pagesData.data) {
        throw new Error("Não foi possível buscar as páginas do Facebook gerenciadas por este usuário.");
    }
    
    // Etapa 4: Encontrar a primeira página com uma conta do Instagram conectada
    const connectedPage = pagesData.data.find((page: any) => page.instagram_business_account);

    if (!connectedPage) {
        throw new Error("Nenhuma Página do Facebook com um perfil do Instagram Business conectado foi encontrada.");
    }

    if (!connectedPage.access_token) {
        throw new Error("A página conectada não retornou um token de acesso de página. Verifique as permissões.");
    }

    // Etapa 5: Retornar os dados relevantes, usando o TOKEN DA PÁGINA
    return NextResponse.json({
      success: true,
      accessToken: connectedPage.access_token, // <<<< USA O TOKEN DA PÁGINA
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
    
