
import { NextResponse, type NextRequest } from "next/server";
import { headers } from "next/headers";

type PageData = {
  id: string;
  name: string;
  access_token: string;
};

// Função auxiliar para fazer chamadas à API da Meta
async function fetchWithToken(url: string) {
  try {
    const response = await fetch(url);
    const responseText = await response.text();

    if (!response.ok) {
        let errorDetails = responseText;
        try {
            const errorJson = JSON.parse(responseText);
            errorDetails = errorJson.error?.message || JSON.stringify(errorJson.error);
        } catch (e) {
            // A resposta de erro não era JSON, usa o texto puro.
        }
        console.error(`Meta API Error fetching URL ${url}: Status ${response.status}`, errorDetails);
        return null; 
    }
    
    if (!responseText) {
        return {};
    }

    return JSON.parse(responseText);

  } catch (error: any) {
      console.error(`Network or parsing error fetching URL ${url}:`, error.message);
      return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, userAccessToken: providedToken } = body;
    const origin = headers().get('origin');

    if (!origin) {
        return NextResponse.json({ success: false, error: "Could not determine request origin." }, { status: 400 });
    }

    let userAccessToken: string;

    // Etapa 1: Obter o token de acesso do usuário.
    // Se um 'code' for fornecido, trocamos por um token.
    // Se um 'userAccessToken' for fornecido, nós o usamos diretamente.
    if (code) {
        const clientId = "826418333144156";
        const clientSecret = "944e053d34b162c13408cd00ad276aa2";
        const redirectUri = `${origin}/dashboard/conteudo`;
        
        // Trocar o código por um token de acesso de curta duração do USUÁRIO
        const tokenUrl = `https://graph.facebook.com/v20.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`;
        const tokenData = await fetchWithToken(tokenUrl);
        if (!tokenData || !tokenData.access_token) {
          throw new Error("Falha ao obter token de acesso de curta duração da Meta.");
        }
        const shortLivedUserToken = tokenData.access_token;
        
        // Trocar por token de longa duração
        const longLivedTokenUrl = `https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${shortLivedUserToken}`;
        const longLivedTokenData = await fetchWithToken(longLivedTokenUrl);
        userAccessToken = longLivedTokenData?.access_token || shortLivedUserToken;

        // Nesta etapa, retornamos APENAS o token. O frontend irá salvá-lo e chamar a API novamente.
        return NextResponse.json({
            success: true,
            userAccessToken: userAccessToken,
        });
    } else if (providedToken) {
        userAccessToken = providedToken;
    } else {
         return NextResponse.json({ success: false, error: "Authorization code or user access token not provided." }, { status: 400 });
    }

    // Etapa 2: Se um token foi fornecido (pelo frontend), buscamos as páginas.
    const allPages: PageData[] = [];
    let pagesUrl: string | undefined = `https://graph.facebook.com/v20.0/me/accounts?access_token=${userAccessToken}&fields=id,name,access_token&limit=100`;

    while(pagesUrl) {
        const pagesData = await fetchWithToken(pagesUrl);
        if (pagesData?.data) {
            allPages.push(...pagesData.data.filter((page: PageData) => page.access_token));
        }
        pagesUrl = pagesData?.paging?.next;
    }

    if (allPages.length === 0) {
      throw new Error("Nenhuma Página do Facebook foi encontrada para este usuário. Verifique suas permissões no diálogo da Meta.");
    }
    
    // Retorna a lista completa para o frontend escolher
    return NextResponse.json({
      success: true,
      pages: allPages,
      message: `${allPages.length} página(s) encontrada(s).`,
    });

  } catch (error: any) {
    console.error("[META_CALLBACK_ERROR]", error);
    return NextResponse.json({ success: false, error: error.message || "An unknown error occurred." }, { status: 500 });
  }
}
