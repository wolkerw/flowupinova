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
      const errorMessage =
        data.error?.message || `Falha na API da Meta com status ${response.status}`;
      console.error(`[META_CALLBACK_API] Erro na chamada para ${url}:`, errorMessage, data.error);
      throw new Error(`Falha ao comunicar com a Meta. Razão: ${errorMessage}`);
    }

    return data;
  } catch (error: any) {
    console.error(
      `[META_CALLBACK_API] Erro de rede ou parse na chamada para ${url}:`,
      error.message
    );
    throw new Error(error.message);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, userAccessToken, origin: clientOrigin, redirectUri: clientRedirectUri } = body;

    // Detecta a origem real através dos headers caso não venha no body
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    const protocol = request.headers.get("x-forwarded-proto") || "https";
    const serverOrigin = `${protocol}://${host}`;

    // Se um 'code' for fornecido, trocamos por um token de usuário de longa duração.
    if (code) {
      // Usa a origem enviada pelo cliente (front-end) ou a detectada pelo servidor
      const origin = clientOrigin || serverOrigin;
      const redirectUri = clientRedirectUri || `${origin}/dashboard/conteudo`;

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
      const pagesMap = new Map<string, PageData>();

      // =====================================================================
      // CAMADA 1: /me/accounts — Fonte primária de páginas
      // =====================================================================
      let pagesWithoutToken: { id: string; name: string }[] = [];
      let pagesUrl: string | undefined =
        `https://graph.facebook.com/v20.0/me/accounts?access_token=${userAccessToken}&fields=id,name,access_token,tasks&limit=100`;

      while (pagesUrl) {
        const pagesData = await fetchFromMetaAPI(pagesUrl);
        if (pagesData?.data) {
          for (const page of pagesData.data) {
            if (page.access_token) {
              pagesMap.set(page.id, { id: page.id, name: page.name, access_token: page.access_token });
            } else {
              pagesWithoutToken.push({ id: page.id, name: page.name });
            }
          }
        }
        pagesUrl = pagesData?.paging?.next;
      }

      console.log(
        `[META_CALLBACK_API] Camada 1 (/me/accounts): ${pagesMap.size} páginas com token, ${pagesWithoutToken.length} sem token.`
      );

      // =====================================================================
      // CAMADA 2: Gerar tokens individualmente para páginas sem token
      // =====================================================================
      if (pagesWithoutToken.length > 0) {
        console.log(
          `[META_CALLBACK_API] Camada 2: Tentando gerar tokens para ${pagesWithoutToken.length} páginas: ${pagesWithoutToken.map((p) => p.name).join(", ")}`
        );

        const tokenPromises = pagesWithoutToken.map(async (page) => {
          try {
            const tokenUrl = `https://graph.facebook.com/v20.0/${page.id}?fields=id,name,access_token&access_token=${userAccessToken}`;
            const tokenData = await fetchFromMetaAPI(tokenUrl);
            if (tokenData?.access_token) {
              console.log(`[META_CALLBACK_API] Camada 2: Token gerado com sucesso para "${page.name}" (${page.id})`);
              return { id: tokenData.id || page.id, name: tokenData.name || page.name, access_token: tokenData.access_token } as PageData;
            }
          } catch (err: any) {
            console.warn(`[META_CALLBACK_API] Camada 2: Falha ao gerar token para "${page.name}" (${page.id}): ${err.message}`);
          }
          return null;
        });

        const tokenResults = await Promise.allSettled(tokenPromises);
        let layer2Count = 0;
        for (const result of tokenResults) {
          if (result.status === "fulfilled" && result.value) {
            if (!pagesMap.has(result.value.id)) {
              pagesMap.set(result.value.id, result.value);
              layer2Count++;
            }
          }
        }
        console.log(`[META_CALLBACK_API] Camada 2: ${layer2Count} páginas recuperadas com token individual.`);
      }

      // =====================================================================
      // CAMADA 3: Varrer Business Managers do usuário
      // =====================================================================
      try {
        const businessesUrl = `https://graph.facebook.com/v20.0/me/businesses?access_token=${userAccessToken}&fields=id,name&limit=50`;
        const businessesData = await fetchFromMetaAPI(businessesUrl);

        if (businessesData?.data && businessesData.data.length > 0) {
          console.log(
            `[META_CALLBACK_API] Camada 3: Encontrados ${businessesData.data.length} Business Manager(s): ${businessesData.data.map((b: any) => b.name).join(", ")}`
          );

          for (const bm of businessesData.data) {
            // 3a: Páginas próprias do BM
            try {
              let ownedUrl: string | undefined =
                `https://graph.facebook.com/v20.0/${bm.id}/owned_pages?access_token=${userAccessToken}&fields=id,name,access_token&limit=100`;
              while (ownedUrl) {
                const ownedData = await fetchFromMetaAPI(ownedUrl);
                if (ownedData?.data) {
                  for (const page of ownedData.data) {
                    if (page.access_token && !pagesMap.has(page.id)) {
                      pagesMap.set(page.id, { id: page.id, name: page.name, access_token: page.access_token });
                    }
                  }
                }
                ownedUrl = ownedData?.paging?.next;
              }
            } catch (err: any) {
              console.warn(`[META_CALLBACK_API] Camada 3: Falha ao buscar owned_pages do BM "${bm.name}": ${err.message}`);
            }

            // 3b: Páginas de clientes gerenciadas pelo BM
            try {
              let clientUrl: string | undefined =
                `https://graph.facebook.com/v20.0/${bm.id}/client_pages?access_token=${userAccessToken}&fields=id,name,access_token&limit=100`;
              while (clientUrl) {
                const clientData = await fetchFromMetaAPI(clientUrl);
                if (clientData?.data) {
                  for (const page of clientData.data) {
                    if (page.access_token && !pagesMap.has(page.id)) {
                      pagesMap.set(page.id, { id: page.id, name: page.name, access_token: page.access_token });
                    }
                  }
                }
                clientUrl = clientData?.paging?.next;
              }
            } catch (err: any) {
              console.warn(`[META_CALLBACK_API] Camada 3: Falha ao buscar client_pages do BM "${bm.name}": ${err.message}`);
            }
          }

          console.log(`[META_CALLBACK_API] Camada 3: Total acumulado após varredura de BMs: ${pagesMap.size} páginas.`);
        }
      } catch (err: any) {
        // Se /me/businesses falhar (ex: usuário sem BM), não é um erro crítico.
        console.warn(`[META_CALLBACK_API] Camada 3: Não foi possível listar Business Managers (normal se o usuário não tiver BM): ${err.message}`);
      }

      // =====================================================================
      // RESULTADO FINAL
      // =====================================================================
      const allPages = Array.from(pagesMap.values());

      console.log(`[META_CALLBACK_API] Total final: ${allPages.length} páginas únicas com token de acesso.`);

      if (allPages.length === 0) {
        throw new Error(
          `Nenhuma Página do Facebook foi encontrada para este usuário. Verificamos 3 fontes de dados (páginas diretas, tokens individuais e Business Managers) e nenhuma retornou um Token de Acesso válido. Verifique se você possui permissão de 'Gerenciar' ou 'Criar Conteúdo' (Controle Total) na página.`
        );
      }

      return NextResponse.json({
        success: true,
        pages: allPages,
      });
    }

    // Se nenhum 'code' or 'userAccessToken' for fornecido.
    return NextResponse.json(
      {
        success: false,
        error: "Código de autorização ou token de acesso do usuário não fornecido.",
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[META_CALLBACK_API] Erro no fluxo:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Ocorreu um erro desconhecido." },
      { status: 500 }
    );
  }
}

