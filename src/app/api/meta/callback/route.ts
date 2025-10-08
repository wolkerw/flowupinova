
import { NextResponse, type NextRequest } from "next/server";
import { getMetaConnection, updateMetaConnection, fetchGraphAPI } from "@/lib/services/meta-service";
import { META_APP_ID, META_APP_SECRET, META_REDIRECT_URI } from "@/lib/config";

const GRAPH_API_URL = "https://graph.facebook.com/v20.0";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  
  // A URI de redirecionamento agora é importada do arquivo de configuração para garantir consistência.
  const redirectUri = META_REDIRECT_URI;

  if (!META_APP_ID || !META_APP_SECRET) {
    console.error("[META_CB] Missing Meta App credentials in config file.");
    return NextResponse.redirect(new URL("/dashboard/conteudo?error=config_missing", request.url));
  }

  if (!code) {
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");
    console.error(`[META_CB] Auth failed: ${error} - ${errorDescription}`);
    return NextResponse.redirect(new URL(`/dashboard/conteudo?error=${error}&desc=${errorDescription}`, request.url));
  }

  try {
    // Step 1: Exchange code for a short-lived user access token
    const tokenUrl = `${GRAPH_API_URL}/oauth/access_token?client_id=${META_APP_ID}&redirect_uri=${redirectUri}&client_secret=${META_APP_SECRET}&code=${code}`;
    const tokenResponse = await fetchGraphAPI(tokenUrl, '', 'Step 1: Exchange code for token');
    const shortLivedUserToken = tokenResponse.access_token;
    
    // Step 2: Exchange short-lived token for a long-lived one
    const longLivedTokenUrl = `${GRAPH_API_URL}/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${shortLivedUserToken}`;
    const longLivedTokenResponse = await fetchGraphAPI(longLivedTokenUrl, '', 'Step 2: Exchange for long-lived token');
    const userAccessToken = longLivedTokenResponse.access_token;

    // Step 3: Get user's pages and find one with a linked Instagram account
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
    
    // Step 4: Save all data to Firestore
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
    return NextResponse.redirect(new URL("/dashboard/conteudo?connected=true", request.url));

  } catch (error: any) {
    console.error("[META_CB_FATAL]", error);
    await updateMetaConnection({ isConnected: false });
    // Redirect to the dashboard with a clear error message in the URL
    return NextResponse.redirect(new URL(`/dashboard/conteudo?error=${encodeURIComponent(error.message)}`, request.url));
  }
}
