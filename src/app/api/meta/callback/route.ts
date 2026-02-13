
import { NextResponse, type NextRequest } from "next/server";
import { config } from "@/lib/config";

type PageData = {
  id: string;
  name: string;
  access_token: string;
};

// Função auxiliar para fazer chamadas à API da Meta de forma segura
async function fetchFromMetaAPI(url: string, options?: RequestInit) {
  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok || data.error) {
      const errorMessage = data.error?.message || `Falha na API da Meta com status ${response.status}`;
      console.error(`[META_CALLBACK_API] Erro na chamada para ${url}:`, errorMessage, data.error);
      throw new Error(`Falha ao comunicar com a Meta. Razão: ${errorMessage}`);
    }
    
    return data;

  } catch (error: any) {
    console.error(`[META_CALLBACK_API] Erro de rede ou parse na chamada para ${url}:`, error.message);
    throw new Error(error.message);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, userAccessToken, origin: clientOrigin } = body;
    
    // Se um 'code' for fornecido, trocamos por um token de usuário de longa duração.
    if (code) {
        // Usa a origem enviada pelo cliente ou a origem da requisição atual como fallback
        const origin = clientOrigin || request.nextUrl.origin;
        const redirectUri = `${origin}/dashboard/conteudo`;

        const clientId = config.meta.appId;
        const clientSecret = config.meta.appSecret;
        
        // Etapa 1.1: Trocar o código por um token de acesso de CURTA duração.
        const shortLivedTokenUrl = `https://graph.facebook.com/v20.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`;
        const shortLivedTokenData = await fetchFromMetaAPI(shortLivedTokenUrl);
        const shortLivedUserToken = shortLivedTokenData.access_token;
        if (!shortLivedUserToken) {
          throw new Error("Falha ao obter token de acesso de curta duração da Meta.");
        }
        
        // Etapa 1.2: Trocar o token de curta duração por um de LONGA duração.
        const longLivedTokenUrl = `https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${shortLivedUserToken}`;
        const longLivedTokenData = await fetchFromMetaAPI(longLivedTokenUrl);
        const finalUserAccessToken = longLivedTokenData?.access_token;
        if (!finalUserAccessToken) {
          throw new Error("Falha ao obter token de acesso de longa duração da Meta.");
        }

        // Retorna APENAS o token para o frontend.
        return NextResponse.json({
            success: true,
            userAccessToken: finalUserAccessToken,
        });

    // Se um 'userAccessToken' for fornecido, buscamos as páginas associadas.
    } else if (userAccessToken) {
        let allPages: PageData[] = [];
        let pagesUrl: string | undefined = `https://graph.facebook.com/v20.0/me/accounts?access_token=${userAccessToken}&fields=id,name,access_token&limit=100`;

        while(pagesUrl) {
            const pagesData = await fetchFromMetaAPI(pagesUrl);
            if (pagesData?.data) {
                // Filtra para garantir que a página tenha um token de acesso próprio.
                allPages.push(...pagesData.data.filter((page: PageData) => page.access_token));
            }
            pagesUrl = pagesData?.paging?.next;
        }

        if (allPages.length === 0) {
          throw new Error("Nenhuma Página do Facebook foi encontrada para este usuário. Verifique suas permissões no diálogo da Meta.");
        }
    
        return NextResponse.json({
          success: true,
          pages: allPages,
        });
    }

    // Se nenhum 'code' ou 'userAccessToken' for fornecido.
    return NextResponse.json({ success: false, error: "Código de autorização ou token de acesso do usuário não fornecido." }, { status: 400 });

  } catch (error: any) {
    console.error("[META_CALLBACK_API] Erro no fluxo:", error);
    return NextResponse.json({ success: false, error: error.message || "Ocorreu um erro desconhecido." }, { status: 500 });
  }
}
