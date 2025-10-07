// src/app/api/meta/callback/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { updateMetaConnection } from "@/lib/services/meta-service";


async function fetchGraphAPI(url: string, accessToken: string, step: string) {
    console.log(`[DEBUG] Executing ${step} with URL: ${url.replace(accessToken, '***')}`);
    
    // O access_token já está na URL, não precisa adicionar de novo
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
        console.error(`[DEBUG] Graph API error at ${step}:`, data.error);
        throw new Error(`Graph API error (${step}): ${data.error.message} (Code: ${data.error.code}, Type: ${data.error.type})`);
    }
    console.log(`[DEBUG] ${step} successful.`);
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
    // 1. Trocar código por token de curta duração (User Access Token)
    const tokenUrl = `https://graph.facebook.com/v20.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`;
    // Não passamos token aqui, pois estamos obtendo um
    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();
    if (tokenData.error) {
        throw new Error(`Graph API error (Step 1: Exchange code): ${tokenData.error.message}`);
    }
    const userAccessToken = tokenData.access_token;
    console.log("[DEBUG] Step 1 successful: Got short-lived user access token.");

    // 2. Obter Páginas do usuário com seus respectivos Page Access Tokens (usando o User Access Token)
    const pagesListUrl = `https://graph.facebook.com/me/accounts?fields=id,name,access_token,instagram_business_account{id,name,username,followers_count,profile_picture_url}&access_token=${userAccessToken}`;
    const pagesData = await fetchGraphAPI(pagesListUrl, userAccessToken, "Step 2: Fetch user pages and linked IG accounts");
    
    if (!pagesData.data || pagesData.data.length === 0) {
      throw new Error("Nenhuma Página do Facebook encontrada para esta conta. Você precisa ter pelo menos uma página com uma conta do Instagram Business vinculada.");
    }
    
    // LÓGICA MELHORADA: Encontra a primeira página que TEM uma conta do Instagram Business vinculada.
    const page = pagesData.data.find((p: any) => p.instagram_business_account);
    
    if (!page) {
        throw new Error("Nenhuma de suas Páginas do Facebook possui uma conta do Instagram Business vinculada. Por favor, vincule uma conta para continuar.");
    }
    
    const pageAccessToken = page.access_token; 
    const instagramAccount = page.instagram_business_account;

    console.log(`[DEBUG] Found page '${page.name}' (ID: ${page.id}) with its own Page Access Token.`);
    console.log(`[DEBUG] Found linked Instagram account: '${instagramAccount.username}' (ID: ${instagramAccount.id})`);

    // 3. Obter detalhes da página (followers, picture), usando o Page Access Token específico
    const pageDetailsFields = "followers_count,picture{url}";
    const pageDetailsUrl = `https://graph.facebook.com/v20.0/${page.id}?fields=${pageDetailsFields}&access_token=${pageAccessToken}`;
    const pageDetailsData = await fetchGraphAPI(pageDetailsUrl, pageAccessToken, "Step 3: Fetch page details (followers, picture)");

    const metaData = {
        userAccessToken: userAccessToken, // Salvar o token do usuário
        pageToken: pageAccessToken,
        facebookPageId: page.id,
        facebookPageName: page.name,
        followersCount: pageDetailsData.followers_count ?? null,
        profilePictureUrl: pageDetailsData.picture?.data?.url ?? null,
        instagramAccountId: instagramAccount?.id ?? null,
        instagramAccountName: instagramAccount?.username ?? null,
        igFollowersCount: instagramAccount?.followers_count ?? null,
        igProfilePictureUrl: instagramAccount?.profile_picture_url ?? null,
        isConnected: true,
    };

    console.log("[DEBUG] Step 4: Updating database with new Meta connection data...", metaData);
    await updateMetaConnection(metaData);
    console.log("[DEBUG] Step 4 successful: Database updated.");

    return NextResponse.json({
      success: true,
      message: "Meta account connected successfully.",
      data: metaData,
    });

  } catch (error: any) {
    console.error("[DEBUG] Error during Meta OAuth callback flow:", error);
    try {
        // Tenta redefinir a conexão para um estado desconectado em caso de erro
        await updateMetaConnection({ isConnected: false, pageToken: "", userAccessToken: "" });
    } catch (dbError) {
        console.error("[DEBUG] Failed to even update the DB to disconnected state:", dbError);
    }
    
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
