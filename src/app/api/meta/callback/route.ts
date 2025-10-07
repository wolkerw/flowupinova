
// src/app/api/meta/callback/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { updateMetaConnection, fetchGraphAPI } from "@/lib/services/meta-service";

const GRAPH_API_VERSION = "v20.0";
const GRAPH_API_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;
const APP_ID = "826418333144156";
const APP_SECRET = "944e053d34b162c13408cd00ad276aa2";


export async function POST(request: NextRequest) {
  const { code } = await request.json();
  const origin = request.headers.get('origin');
  const redirectUri = `${origin}/dashboard/conteudo`;

  if (!code) {
    return NextResponse.json({ success: false, error: "Authorization code not provided." }, { status: 400 });
  }

  try {
    // 1. Trocar código por token de acesso de usuário de curta duração
    const shortLivedTokenUrl = `${GRAPH_API_URL}/oauth/access_token`;
    const shortLivedTokenParams = new URLSearchParams({
        client_id: APP_ID,
        redirect_uri: redirectUri,
        client_secret: APP_SECRET,
        code: code,
    });
    const shortLivedTokenData = await fetchGraphAPI(shortLivedTokenUrl, "", "Step 1: Exchange code for short-lived user token", 'GET', shortLivedTokenParams);
    const shortLivedUserToken = shortLivedTokenData.access_token;
    console.log("[META_CB] step1 short-lived token tail:", (shortLivedUserToken||"").slice(-10));
    
    // 2. Trocar token de curta duração por um de longa duração
    const longLivedTokenUrl = `${GRAPH_API_URL}/oauth/access_token`;
    const longLivedTokenParams = new URLSearchParams({
        grant_type: 'fb_exchange_token',
        client_id: APP_ID,
        client_secret: APP_SECRET,
        fb_exchange_token: shortLivedUserToken,
    });
    const longLivedTokenData = await fetchGraphAPI(longLivedTokenUrl, "", "Step 2: Exchange for long-lived user token", 'GET', longLivedTokenParams);
    const userAccessToken = longLivedTokenData.access_token; // Este é o token de usuário de longa duração
    console.log("[META_CB] step2 long-lived token tail:", (userAccessToken||"").slice(-10));

    // Debug Token call
    const appId = APP_ID;
    const appSecret = APP_SECRET;
    const dbgUrl = `https://graph.facebook.com/v20.0/debug_token?input_token=${userAccessToken}&access_token=${appId}|${appSecret}`;
    const dbg = await fetch(dbgUrl).then(r=>r.json()).catch(e=>({error:String(e)}));
    console.log("[META_CB] debug_token:", JSON.stringify(dbg));
    
    // 3. Obter Páginas do usuário e contas do Instagram vinculadas, usando o token de usuário de longa duração
    let pageWithIg;
    try {
        const pagesListUrl = `${GRAPH_API_URL}/me/accounts?fields=id,name,access_token,instagram_business_account{id,name,username,followers_count,profile_picture_url}&limit=500`;
        const pagesData = await fetchGraphAPI(pagesListUrl, userAccessToken, "Step 3: Fetch user pages and linked IG accounts");
        console.log("[META_CB] pages count:", pagesData?.data?.length || 0);

        if (!pagesData.data || pagesData.data.length === 0) {
            throw new Error("Nenhuma Página do Facebook encontrada para esta conta.");
        }

        pageWithIg = pagesData.data.find((p: any) => p.instagram_business_account);
        if (!pageWithIg) {
            throw new Error("Nenhuma Página possui uma conta do Instagram Business vinculada. Vincule uma conta para continuar.");
        }
    } catch (e:any) {
        // Logar o erro e também um /me simples pra provar que é user token válido
        const who = await fetch(`https://graph.facebook.com/v20.0/me?fields=id,name&access_token=${userAccessToken}`).then(r=>r.json()).catch(()=>null);
        console.error("[META_CB] Step3 /me/accounts FAILED. /me =>", who, "error =>", e?.message || e);
        throw e;
    }

    const pageAccessToken = pageWithIg.access_token;
    const instagramAccount = pageWithIg.instagram_business_account;

    // 4. Obter detalhes da página (followers, picture), usando o Page Access Token específico
    const pageDetailsFields = "followers_count,picture{url}";
    const pageDetailsUrl = `${GRAPH_API_URL}/${pageWithIg.id}?fields=${pageDetailsFields}`;
    const pageDetailsData = await fetchGraphAPI(pageDetailsUrl, pageAccessToken, "Step 4: Fetch page details");
    
    // 5. Salvar os dados no banco de dados
    const metaData = {
        userAccessToken: userAccessToken,
        pageToken: pageAccessToken,
        facebookPageId: pageWithIg.id,
        facebookPageName: pageWithIg.name,
        followersCount: pageDetailsData.followers_count ?? null,
        profilePictureUrl: pageDetailsData.picture?.data?.url ?? null,
        instagramAccountId: instagramAccount?.id ?? null,
        instagramAccountName: instagramAccount?.username ?? null,
        igFollowersCount: instagramAccount?.followers_count ?? null,
        igProfilePictureUrl: instagramAccount?.profile_picture_url ?? null,
        isConnected: true,
    };
    
    console.log("[DEBUG_CALLBACK] Saving to DB, userAccessToken (last 10):", metaData.userAccessToken?.slice(-10));
    await updateMetaConnection(metaData);

    return NextResponse.json({
      success: true,
      message: "Meta account connected successfully.",
      data: metaData,
    });

  } catch (error: any) {
    console.error("[META_CALLBACK_ERROR] Full flow failed:", error);
    try {
        await updateMetaConnection({ isConnected: false, userAccessToken: "", pageToken: "" });
    } catch (dbError) {
        console.error("[META_CALLBACK_ERROR] Failed to set DB to disconnected state:", dbError);
    }
    
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
