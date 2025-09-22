
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
  
  const redirectUri = "https://6000-firebase-studio-1757951248950.cluster-57i2ylwve5fskth4xb2kui2ow2.cloudworkstations.dev/dashboard/conteudo";
  console.log("[DEBUG] Using redirect_uri for token exchange:", redirectUri);


  try {
    const shortLivedTokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`;
    const tokenData = await fetchGraphAPI(shortLivedTokenUrl, "Step 1: Exchange code for short-lived token");
    const shortLivedToken = tokenData.access_token;

    const longLivedTokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`;
    const longLivedTokenData = await fetchGraphAPI(longLivedTokenUrl, "Step 2: Exchange short-lived for long-lived token");
    const longLivedToken = longLivedTokenData.access_token;

    const fields = "name,access_token,followers_count,picture{url},instagram_business_account{name,username,followers_count,profile_picture_url}";
    const pagesUrl = `https://graph.facebook.com/me/accounts?fields=${fields}&access_token=${longLivedToken}`;
    const pagesData = await fetchGraphAPI(pagesUrl, "Step 3: Fetch user pages");
    
    if (!pagesData.data || pagesData.data.length === 0) {
      throw new Error("Nenhuma Página do Facebook encontrada para esta conta. Você precisa de pelo menos uma página para conectar.");
    }
    const page = pagesData.data[0];
    console.log(`[DEBUG] Found page '${page.name}' (ID: ${page.id})`);

    const instagramAccount = page.instagram_business_account;
    if (instagramAccount) {
        console.log(`[DEBUG] Found linked Instagram account: '${instagramAccount.username}' (ID: ${instagramAccount.id})`);
    } else {
        console.log("[DEBUG] No linked Instagram business account found for this page.");
    }

    const metaData = {
        longLivedToken: longLivedToken,
        facebookPageId: page.id,
        facebookPageName: page.name,
        followersCount: page.followers_count,
        profilePictureUrl: page.picture?.data?.url,
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
    await updateMetaConnection({ isConnected: false, longLivedToken: "" });
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

    