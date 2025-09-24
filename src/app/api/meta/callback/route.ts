// src/app/api/meta/callback/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { updateMetaConnection } from "@/lib/services/meta-service";


async function fetchGraphAPI(url: string, step: string) {
    console.log(`[DEBUG] Executing ${step} with URL: ${url}`);
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
        console.error(`[DEBUG] Graph API error at ${step}:`, data.error);
        throw new Error(`Graph API error (${step}): ${data.error.message} (Code: ${data.error.code}, Type: ${data.error.type})`);
    }
    console.log(`[DEBUG] ${step} successful. Received data.`);
    return data;
}

export async function POST(request: NextRequest) {
  const { code } = await request.json();
  console.log("[DEBUG] API /api/meta/callback received code:", code);


  if (!code) {
    return NextResponse.json(
      { success: false, error: "Authorization code not provided." },
      { status: 400 }
    );
  }

  const appId = "826418333144156";
  const appSecret = "944e053d34b162c13408cd00ad276aa2";
  
  // Dynamically determine redirect URI from request origin
  const origin = request.headers.get('origin');
  const redirectUri = `${origin}/dashboard/conteudo`;
  console.log("[DEBUG] Using redirect_uri for token exchange:", redirectUri);


  try {
    // 1. Trocar código por token de curta duração
    const shortLivedTokenUrl = `https://graph.facebook.com/v20.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`;
    const tokenData = await fetchGraphAPI(shortLivedTokenUrl, "Step 1: Exchange code for short-lived token");
    const userAccessToken = tokenData.access_token;

    // 2. Obter Páginas do usuário com seus respectivos Page Access Tokens
    const pagesListUrl = `https://graph.facebook.com/me/accounts?fields=id,name,access_token&access_token=${userAccessToken}`;
    const pagesData = await fetchGraphAPI(pagesListUrl, "Step 2: Fetch user pages");
    
    if (!pagesData.data || pagesData.data.length === 0) {
      throw new Error("Nenhuma Página do Facebook encontrada para esta conta. Você precisa de pelo menos uma página para conectar.");
    }
    const page = pagesData.data[0];
    const pageAccessToken = page.access_token; 
    console.log(`[DEBUG] Found page '${page.name}' (ID: ${page.id}) with its own Page Access Token.`);

    // 3. Obter detalhes da página, incluindo a conta do Instagram vinculada
    const pageDetailsFields = "id,name,followers_count,picture{url},instagram_business_account{id,name,username,followers_count,profile_picture_url}";
    const pageDetailsUrl = `https://graph.facebook.com/v20.0/${page.id}?fields=${pageDetailsFields}&access_token=${pageAccessToken}`;
    const pageDetailsData = await fetchGraphAPI(pageDetailsUrl, "Step 3: Fetch page details and linked Instagram account");

    const instagramAccount = pageDetailsData.instagram_business_account;
    if (instagramAccount) {
        console.log(`[DEBUG] Found linked Instagram account: '${instagramAccount.username}' (ID: ${instagramAccount.id})`);
    } else {
        console.log("[DEBUG] No linked Instagram business account found for this page.");
    }

    const metaData = {
        pageToken: pageAccessToken,
        facebookPageId: pageDetailsData.id,
        facebookPageName: pageDetailsData.name,
        followersCount: pageDetailsData.followers_count,
        profilePictureUrl: pageDetailsData.picture?.data?.url,
        instagramAccountId: instagramAccount?.id,
        instagramAccountName: instagramAccount?.username,
        igFollowersCount: instagramAccount?.followers_count,
        igProfilePictureUrl: instagramAccount?.profile_picture_url,
        isConnected: true,
    };

    console.log("[DEBUG] Step 4: Updating database with new Meta connection data...");
    await updateMetaConnection(metaData);
    console.log("[DEBUG] Step 4 successful: Database updated.");

    return NextResponse.json({
      success: true,
      message: "Meta account connected successfully.",
      data: metaData,
    });

  } catch (error: any) {
    console.error("[DEBUG] Error during Meta OAuth callback flow:", error);
    // In case of error, ensure the connection status is set to false in the DB.
    await updateMetaConnection({ isConnected: false, pageToken: "", instagramAccountId: undefined });
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
