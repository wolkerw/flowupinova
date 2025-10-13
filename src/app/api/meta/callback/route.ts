
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { success: false, error: "Authorization code not provided." },
        { status: 400 }
      );
    }
    
    // As credenciais e a URI de redirecionamento devem corresponder exatamente
    // às configuradas no seu painel de desenvolvedor da Meta.
    const clientId = "826418333144156";
    const clientSecret = "944e053d34b162c13408cd00ad276aa2";
    const redirectUri = "https://9000-firebase-studio-1757951248950.cluster-57i2ylwve5fskth4xb2kui2ow2.cloudworkstations.dev/dashboard/conteudo";
    
    // 1. Troca o código por um token de acesso de curta duração
    const tokenUrl = `https://graph.facebook.com/v20.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`;
    
    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("Meta Token Exchange Error:", tokenData);
      throw new Error(tokenData.error?.message || "Falha ao obter token de acesso da Meta.");
    }
    
    // 2. Opcional, mas recomendado: Troca o token de curta duração por um de longa duração
    const longLivedTokenUrl = `https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${tokenData.access_token}`;
    const longLivedTokenResponse = await fetch(longLivedTokenUrl);
    const longLivedTokenData = await longLivedTokenResponse.json();

    if (!longLivedTokenResponse.ok || !longLivedTokenData.access_token) {
      console.error("Meta Long-Lived Token Error:", longLivedTokenData);
      // Se a troca por token de longa duração falhar, podemos continuar com o de curta duração
      // ou retornar um erro. Para simplicidade, vamos retornar o token que temos.
    }
    
    // A API agora apenas retorna os dados do token. O cliente cuidará de salvar no Firestore.
    return NextResponse.json({
      success: true,
      accessToken: longLivedTokenData.access_token || tokenData.access_token,
      message: "Token obtido com sucesso.",
    });

  } catch (error: any) {
    console.error("[META_CALLBACK_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "An unknown error occurred." },
      { status: 500 }
    );
  }
}
