
import { NextResponse, type NextRequest } from "next/server";
import { getMetaConnection, updateMetaConnection, fetchGraphAPI } from "@/lib/services/meta-service";
import { META_APP_ID, META_APP_SECRET, META_REDIRECT_URI } from "@/lib/config";

const GRAPH_API_URL = "https://graph.facebook.com/v20.0";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
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

  let userAccessToken = "";

  try {
    // Step 1: Exchange code for a short-lived user access token
    const tokenUrl = `${GRAPH_API_URL}/oauth/access_token?client_id=${META_APP_ID}&redirect_uri=${redirectUri}&client_secret=${META_APP_SECRET}&code=${code}`;
    const tokenResponse = await fetch(tokenUrl).then(res => res.json());

    if (tokenResponse.error) throw new Error(`Step 1 (short-lived token): ${tokenResponse.error.message}`);
    const shortLivedUserToken = tokenResponse.access_token;
    console.log("[META_CB] step1 short-lived token tail:", (shortLivedUserToken || "").slice(-10));


    // Step 2: Exchange short-lived token for a long-lived one
    const longLivedTokenUrl = `${GRAPH_API_URL}/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${shortLivedUserToken}`;
    const longLivedTokenResponse = await fetch(longLivedTokenUrl).then(res => res.json());

    if (longLivedTokenResponse.error) throw new Error(`Step 2 (long-lived token): ${longLivedTokenResponse.error.message}`);
    userAccessToken = longLivedTokenResponse.access_token;
    console.log("[META_CB] step2 long-lived token tail:", (userAccessToken || "").slice(-10));
    
    // Debug the token to check scopes
    const dbgUrl = `https://graph.facebook.com/debug_token?input_token=${userAccessToken}&access_token=${META_APP_ID}|${META_APP_SECRET}`;
    const dbg = await fetch(dbgUrl).then(r => r.json()).catch(e => ({ error: String(e) }));
    console.log("[META_CB] debug_token:", JSON.stringify(dbg));


    // Step 3: Get user's pages and find one with a linked Instagram account
    let pageToken = "", facebookPageId = "", facebookPageName = "", instagramAccountId = "", instagramAccountName = "";
    
     try {
      const pagesListUrl = `${GRAPH_API_URL}/me/accounts?fields=id,name,access_token,instagram_business_account{id,name,username,followers_count,profile_picture_url}&limit=500`;
      const pagesData = await fetchGraphAPI(pagesListUrl, userAccessToken, "Step 3: Fetch user pages and linked IG accounts");
      console.log("[META_CB] pages count:", pagesData?.data?.length || 0);

      if (!pagesData.data || pagesData.data.length === 0) {
        throw new Error("Nenhuma Página do Facebook encontrada para esta conta.");
      }

      const pageWithIg = pagesData.data.find((p: any) => p.instagram_business_account);
      if (!pageWithIg) {
        throw new Error("Nenhuma Página possui uma conta do Instagram Business vinculada. Vincule uma conta para continuar.");
      }

      pageToken = pageWithIg.access_token;
      facebookPageId = pageWithIg.id;
      facebookPageName = pageWithIg.name;
      instagramAccountId = pageWithIg.instagram_business_account.id;
      instagramAccountName = pageWithIg.instagram_business_account.username;
      
    } catch (e:any) {
      const who = await fetch(`https://graph.facebook.com/v20.0/me?fields=id,name&access_token=${userAccessToken}`).then(r=>r.json()).catch(()=>null);
      console.error("[META_CB] Step3 /me/accounts FAILED. /me =>", who, "error =>", e?.message || e);
      throw e;
    }


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
    return NextResponse.redirect(new URL(`/dashboard/conteudo?error=${encodeURIComponent(error.message)}`, request.url));
  }
}
