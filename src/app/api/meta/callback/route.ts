
// src/app/api/meta/callback/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { updateMetaConnection } from "@/lib/services/meta-service";


async function fetchGraphAPI(url: string) {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
        console.error(`Graph API error at ${url.split('?')[0]}:`, data.error);
        throw new Error(`Graph API error: ${data.error.message} (Code: ${data.error.code}, Type: ${data.error.type})`);
    }
    return data;
}

export async function POST(request: NextRequest) {
  const { code } = await request.json();
  console.log("API /api/meta/callback received code:", code);


  if (!code) {
    return NextResponse.json(
      { success: false, error: "Authorization code not provided." },
      { status: 400 }
    );
  }

  const appId = "826418333144156";
  const appSecret = "944e053d34b162c13408cd00ad276aa2";
  
  const origin = request.headers.get('origin');
  if (!origin) {
    return NextResponse.json(
      { success: false, error: "Could not determine request origin." },
      { status: 400 }
    );
  }
  const redirectUri = `${origin}/dashboard/conteudo`;
  console.log("Using redirect_uri for token exchange:", redirectUri);


  try {
    console.log("Step 1: Exchanging code for a short-lived access token...");
    const shortLivedTokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`;
    const tokenData = await fetchGraphAPI(shortLivedTokenUrl);
    const shortLivedToken = tokenData.access_token;
    console.log("Step 1 successful: Received short-lived token.");

    console.log("Step 2: Exchanging short-lived token for a long-lived access token...");
    const longLivedTokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`;
    const longLivedTokenData = await fetchGraphAPI(longLivedTokenUrl);
    const longLivedToken = longLivedTokenData.access_token;
    console.log("Step 2 successful: Received long-lived token.");

    console.log("Step 3: Fetching user's Facebook pages and linked Instagram accounts...");
    const fields = "name,access_token,followers_count,picture{url},instagram_business_account{name,username,followers_count,profile_picture_url}";
    const pagesUrl = `https://graph.facebook.com/me/accounts?fields=${fields}&access_token=${longLivedToken}`;
    const pagesData = await fetchGraphAPI(pagesUrl);
    
    if (!pagesData.data || pagesData.data.length === 0) {
      throw new Error("Nenhuma Página do Facebook encontrada para esta conta. Você precisa de pelo menos uma página para conectar.");
    }
    const page = pagesData.data[0];
    console.log(`Step 3 successful: Found page '${page.name}' (ID: ${page.id})`);

    const instagramAccount = page.instagram_business_account;
    if (instagramAccount) {
        console.log(`Found linked Instagram account: '${instagramAccount.username}' (ID: ${instagramAccount.id})`);
    } else {
        console.log("No linked Instagram business account found for this page.");
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

    console.log("Step 4: Updating database with new Meta connection data...");
    await updateMetaConnection(metaData);
    console.log("Step 4 successful: Database updated.");

    return NextResponse.json({
      success: true,
      message: "Meta account connected successfully.",
      data: metaData,
    });

  } catch (error: any) {
    console.error("Error during Meta OAuth callback flow:", error);
    // In case of error, ensure the connection status is set to false in the DB.
    await updateMetaConnection({ isConnected: false, longLivedToken: "" });
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
