
import { NextResponse, type NextRequest } from "next/server";
import { headers } from "next/headers";

type PageData = {
  id: string;
  name: string;
  access_token: string;
  category?: string;
  tasks?: string[];
  owner_business?: { id: string, name: string };
};

// Função auxiliar robustecida para fazer chamadas à API da Meta
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
    
    // Se a resposta for OK mas vazia, retorna um objeto vazio para não quebrar o JSON.parse
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
    const { code } = body;
    const origin = headers().get('origin');

    if (!code) {
      return NextResponse.json({ success: false, error: "Authorization code not provided." }, { status: 400 });
    }
    
    if (!origin) {
        return NextResponse.json({ success: false, error: "Could not determine request origin." }, { status: 400 });
    }
    
    const clientId = "826418333144156";
    const clientSecret = "944e053d34b162c13408cd00ad276aa2";
    const redirectUri = `${origin}/dashboard/conteudo`;
    
    // Etapa 1: Trocar o código por um token de acesso de curta duração do USUÁRIO
    const tokenUrl = `https://graph.facebook.com/v20.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`;
    const tokenData = await fetchWithToken(tokenUrl);

    if (!tokenData || !tokenData.access_token) {
      throw new Error("Falha ao obter token de acesso de curta duração da Meta.");
    }
    const shortLivedUserToken = tokenData.access_token;
    
    // Etapa 2: Trocar por token de longa duração
    const longLivedTokenUrl = `https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${shortLivedUserToken}`;
    const longLivedTokenData = await fetchWithToken(longLivedTokenUrl);
    const userAccessToken = longLivedTokenData?.access_token || shortLivedUserToken;

    // Etapa 3: Coletar todas as páginas usando APENAS o endpoint me/accounts
    const allPages: PageData[] = [];
    let pagesUrl: string | undefined = `https://graph.facebook.com/v20.0/me/accounts?access_token=${userAccessToken}&fields=id,name,access_token,category,tasks&limit=100`;

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
      userAccessToken: userAccessToken, // **NOVO** Retorna o token principal do usuário
      message: `${allPages.length} página(s) encontrada(s).`,
    });

  } catch (error: any) {
    console.error("[META_CALLBACK_ERROR]", error);
    return NextResponse.json({ success: false, error: error.message || "An unknown error occurred." }, { status: 500 });
  }
}
