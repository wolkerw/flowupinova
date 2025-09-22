
// src/app/api/meta/callback/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { updateMetaConnection } from "@/lib/services/meta-service";


async function fetchWithToken(url: string, token: string) {
    const response = await fetch(`${url}&access_token=${token}`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: 'Failed to parse error response' }}));
        console.error(`Graph API error response from ${url.split('?')[0]}:`, errorData);
        throw new Error(`Graph API error at ${url.split('?')[0]}: ${errorData.error?.message || `HTTP status ${response.status}`}`);
    }
    const data = await response.json();
    if (data.error) {
        console.error(`Graph API error from ${url.split('?')[0]}:`, data.error);
        throw new Error(`Graph API error at ${url.split('?')[0]}: ${data.error.message}`);
    }
    return data;
}

export async function POST(request: NextRequest) {
  const { code } = await request.json();

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

  try {
    console.log("Exchanging code for short-lived token...");
    const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&redirect_uri=${redirectUri}&client_secret=${appSecret}&code=${code}`;
    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error("Error getting short-lived token:", tokenData.error);
      throw new Error(`Error getting short-lived token: ${tokenData.error.message}`);
    }
    const shortLivedToken = tokenData.access_token;
    console.log("Short-lived token received.");

    console.log("Exchanging for long-lived token...");
    const longLivedTokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`;
    const longLivedTokenResponse = await fetch(longLivedTokenUrl);
    const longLivedTokenData = await longLivedTokenResponse.json();
    
    if (longLivedTokenData.error) {
        console.error("Error getting long-lived token:", longLivedTokenData.error);
        throw new Error(`Error getting long-lived token: ${longLivedTokenData.error.message}`);
    }
    const longLivedToken = longLivedTokenData.access_token;
    console.log("Long-lived token received.");

    console.log("Fetching user's pages...");
    const pagesData = await fetchWithToken(`https://graph.facebook.com/me/accounts?fields=name,access_token,instagram_business_account{name,username,followers_count,profile_picture_url},followers_count,picture{url}`, longLivedToken);
    
    if (!pagesData.data || pagesData.data.length === 0) {
      throw new Error("Nenhuma Página do Facebook encontrada para esta conta. Você precisa de pelo menos uma página para conectar.");
    }
    const page = pagesData.data[0];
    console.log(`Found page: ${page.name}`);
    const instagramAccount = page.instagram_business_account;
    if(instagramAccount) console.log(`Found Instagram account: ${instagramAccount.username}`);

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

    console.log("Updating database with Meta data...");
    await updateMetaConnection(metaData);
    console.log("Database update successful.");

    return NextResponse.json({
      success: true,
      message: "Meta account connected successfully.",
      data: metaData,
    });

  } catch (error: any) {
    console.error("Error during Meta OAuth callback:", error);
    await updateMetaConnection({ isConnected: false, longLivedToken: "" });
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

    