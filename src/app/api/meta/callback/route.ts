
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
    
    const clientId = "826418333144156";
    const clientSecret = "944e053d34b162c13408cd00ad276aa2";
    const redirectUri = `${origin}/dashboard/conteudo`;
    
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

    // Etapa 3: Usar o token do usuário para buscar as PÁGINAS.
    // Removido o campo instagram_business_account
    const pagesUrl = `https://graph.facebook.com/v20.0/me/accounts?access_token=${userAccessToken}&fields=id,name,access_token`;
    const pagesResponse = await fetch(pagesUrl);
    const pagesData = await pagesResponse.json();

    if (!pagesResponse.ok || !pagesData.data) {
        console.error("Meta API Error fetching pages:", pagesData.error);
        throw new Error(pagesData.error?.message || "Não foi possível buscar as páginas do Facebook gerenciadas por este usuário.");
    }
    
    // Etapa 4: Pegar a primeira página da lista (a que o usuário selecionou na tela da Meta)
    const page = pagesData.data?.[0];

    if (!page) {
      throw new Error("Nenhuma Página do Facebook foi encontrada para este usuário.");
    }

    if (!page.access_token) {
      throw new Error("A Página não retornou um token de acesso. Verifique as permissões (pages_show_list, pages_manage_posts).");
    }

    // Etapa 5: Retornar apenas os dados relevantes da PÁGINA
    return NextResponse.json({
      success: true,
      accessToken: page.access_token,   // <<< USA O TOKEN DA PÁGINA
      pageId: page.id,
      pageName: page.name,
      message: "Página conectada com sucesso.",
    });

  } catch (error: any) {
    console.error("[META_CALLBACK_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "An unknown error occurred." },
      { status: 500 }
    );
  }
}
    
