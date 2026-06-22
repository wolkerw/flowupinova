import { NextResponse, type NextRequest } from "next/server";
import { google } from "googleapis";
import { adminDb } from "@/lib/firebase-admin";
import { listGoogleAdsCustomers } from "@/lib/services/google-ads-service-admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, state, origin } = body;

    if (!code) {
      return NextResponse.json(
        { success: false, error: "Código de autorização não fornecido." },
        { status: 400 }
      );
    }

    if (!state || !state.startsWith("google_ads:")) {
      return NextResponse.json(
        { success: false, error: "Estado de autorização inválido ou ausente." },
        { status: 400 }
      );
    }

    // Extrai o userId do parâmetro state (formato: "google_ads:USER_UID")
    const userId = state.split(":")[1];
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "UserId não identificado no estado de autorização." },
        { status: 400 }
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error(
        "[GOOGLE_ADS_CALLBACK_ERROR] Variáveis de ambiente GOOGLE_CLIENT_ID ou GOOGLE_CLIENT_SECRET não definidas."
      );
      return NextResponse.json(
        { success: false, error: "Erro de credenciais no servidor Google." },
        { status: 500 }
      );
    }

    // A URI de redirecionamento usada no OAuth do frontend foi para o painel de anuncios
    const redirectUri = new URL("/dashboard/anuncios", origin).toString();

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    const { tokens } = await oauth2Client.getToken({ code });

    if (!tokens || !tokens.access_token) {
      throw new Error("Não foi possível recuperar os tokens de acesso da API do Google.");
    }

    // 1. Salva os tokens no Firestore adminDb antes de consultar os clientes
    const connectionRef = adminDb
      .collection("users")
      .doc(userId)
      .collection("connections")
      .doc("google_ads");

    const dataToSave: any = {
      accessToken: tokens.access_token,
      expiryDate: tokens.expiry_date || null,
      isConnected: true,
      connectedAt: new Date(),
    };

    // O refresh token só é enviado pelo Google na primeira autorização ou se forçada a tela de consentimento
    if (tokens.refresh_token) {
      dataToSave.refreshToken = tokens.refresh_token;
    }

    await connectionRef.set(dataToSave, { merge: true });

    // 2. Busca as contas de cliente acessíveis do Google Ads usando o novo token
    const accounts = await listGoogleAdsCustomers(userId);

    return NextResponse.json({
      success: true,
      accounts,
      adAccountId: accounts.length === 1 ? accounts[0].id : null,
      adAccountName: accounts.length === 1 ? accounts[0].name : null,
    });
  } catch (error: any) {
    console.error(
      "[GOOGLE_ADS_CALLBACK_ERROR] Erro no processamento de callback:",
      error.message || error
    );
    return NextResponse.json(
      { success: false, error: error.message || "Erro desconhecido no processamento de callback." },
      { status: 500 }
    );
  }
}
