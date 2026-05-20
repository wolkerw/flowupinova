import { NextResponse, type NextRequest } from "next/server";
import { google } from "googleapis";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: "Refresh token não fornecido." },
        { status: 400 }
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error(
        "[GOOGLE_REFRESH_TOKEN_ERROR] Variáveis de ambiente GOOGLE_CLIENT_ID ou GOOGLE_CLIENT_SECRET não estão definidas."
      );
      return NextResponse.json(
        {
          success: false,
          error: "Erro de configuração no servidor. As credenciais do Google não foram encontradas.",
        },
        { status: 500 }
      );
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const { credentials } = await oauth2Client.refreshAccessToken();

    if (!credentials || !credentials.access_token) {
      throw new Error("Falha ao obter um novo token de acesso do Google.");
    }

    return NextResponse.json({
      success: true,
      accessToken: credentials.access_token,
      expiryDate: credentials.expiry_date,
      // Se o Google não retornar um novo refresh_token, mantemos o atual.
      refreshToken: credentials.refresh_token || refreshToken,
    });
  } catch (error: any) {
    console.error(
      "[GOOGLE_REFRESH_TOKEN_ERROR] Erro ao renovar token:",
      error.response?.data || error.message
    );
    const errorMessage =
      error.response?.data?.error_description ||
      error.message ||
      "Ocorreu um erro desconhecido ao tentar renovar a sessão com o Google.";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
