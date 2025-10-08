
// src/app/api/meta/callback/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { updateMetaConnection, fetchGraphAPI } from "@/lib/services/meta-service";
import { META_APP_ID, META_APP_SECRET, META_REDIRECT_URI } from "@/lib/config";

const GRAPH_API_URL = "https://graph.facebook.com/v20.0";

// Garante que a rota seja executada no Node.js runtime e não no Edge,
// e que seja sempre dinâmica para evitar cache.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Em um ambiente de produção, isso seria um Redis ou banco de dados para evitar "dupla troca".
// Para desenvolvimento, um Set em memória é suficiente.
const seenCodes = new Set<string>();

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Se a Meta retornou um erro explícito (ex: usuário cancelou)
  if (error) {
    console.error(`[META_CB] Auth failed explicitly: ${error} - ${errorDescription}`);
    return NextResponse.redirect(new URL(`/dashboard/conteudo?error=${error}&desc=${errorDescription}`, request.url));
  }

  // Validações essenciais
  if (!code) {
    return NextResponse.json({ error: "Authorization code not provided." }, { status: 400 });
  }
  if (state !== "flowup-auth-state") {
      return NextResponse.json({ error: "Invalid state parameter." }, { status: 400 });
  }

  // Evita a "dupla troca" do mesmo código
  if (seenCodes.has(code)) {
    console.warn("[META_CB] Attempted to redeem an already used authorization code.");
    return NextResponse.redirect(new URL("/dashboard/conteudo?error=code_already_used", request.url));
  }
  seenCodes.add(code);
  
  // Limpa o Set periodicamente para não consumir memória indefinidamente
  setTimeout(() => seenCodes.delete(code), 300000); // 5 minutos

  try {
    // Etapa 1: Trocar o 'code' por um token de acesso de curta duração
    const tokenUrl = `${GRAPH_API_URL}/oauth/access_token?client_id=${META_APP_ID}&redirect_uri=${META_REDIRECT_URI}&client_secret=${META_APP_SECRET}&code=${code}`;
    const tokenResponse = await fetchGraphAPI(tokenUrl, '', 'Step 1: Exchange code for token');
    const shortLivedUserToken = tokenResponse.access_token;
    
    // Etapa 2: Trocar o token de curta duração por um de longa duração
    const longLivedTokenUrl = `${GRAPH_API_URL}/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${shortLivedUserToken}`;
    const longLivedTokenResponse = await fetchGraphAPI(longLivedTokenUrl, '', 'Step 2: Exchange for long-lived token');
    const userAccessToken = longLivedTokenResponse.access_token;

    // Etapa 3: Obter as páginas do usuário para encontrar a que tem uma conta do Instagram
    const pagesListUrl = `${GRAPH_API_URL}/me/accounts?fields=id,name,access_token,instagram_business_account{id,name,username,followers_count,profile_picture_url}&limit=500`;
    const pagesData = await fetchGraphAPI(pagesListUrl, userAccessToken, "Step 3: Fetch user pages");

    if (!pagesData.data || pagesData.data.length === 0) {
      throw new Error("Nenhuma Página do Facebook foi encontrada para esta conta. Verifique suas permissões.");
    }

    const pageWithIg = pagesData.data.find((p: any) => p.instagram_business_account);
    if (!pageWithIg) {
      throw new Error("Nenhuma Página do Facebook possui uma conta do Instagram Business vinculada. Por favor, vincule uma conta para continuar.");
    }

    const { access_token: pageToken, id: facebookPageId, name: facebookPageName, instagram_business_account: igAccount } = pageWithIg;
    const { id: instagramAccountId, username: instagramAccountName } = igAccount;
    
    // Etapa 4: Salvar todos os dados no Firestore de forma minimalista
    await updateMetaConnection({
        userAccessToken,
        pageToken,
        facebookPageId,
        facebookPageName,
        instagramAccountId,
        instagramAccountName,
        isConnected: true,
    });

    console.log("[META_CB] Connection successful. Redirecting to dashboard.");
    // Redireciona para o dashboard com um indicador de sucesso
    return NextResponse.redirect(new URL("/dashboard/conteudo?connected=true", request.url));

  } catch (err: any) {
    console.error("[META_CB_FATAL]", err);
    // Em caso de qualquer erro, garante que a conexão seja marcada como falsa
    await updateMetaConnection({ isConnected: false });
    // Redireciona para o dashboard com uma mensagem de erro clara
    return NextResponse.redirect(new URL(`/dashboard/conteudo?error=${encodeURIComponent(err.message)}`, request.url));
  }
}
