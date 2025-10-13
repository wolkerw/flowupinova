// src/app/api/meta/callback/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Hardcode the final destination URL to ensure correctness
  const dashboardUrl = new URL("https://6000-firebase-studio-1757951248950.cluster-57i2ylwve5fskth4xb2kui2ow2.cloudworkstations.dev/dashboard/conteudo");

  // 1. Handle errors from Meta
  if (error) {
    console.error(`Erro no callback da Meta: ${error} - ${errorDescription}`);
    dashboardUrl.searchParams.set("error", errorDescription || "Ocorreu um erro desconhecido durante a autenticação com a Meta.");
    return NextResponse.redirect(dashboardUrl);
  }

  // 2. Validate state to prevent CSRF attacks
  if (state !== 'flowup-auth-state') {
    dashboardUrl.searchParams.set("error", "O estado de autenticação é inválido. Por favor, tente novamente.");
    return NextResponse.redirect(dashboardUrl);
  }

  // 3. Ensure code is present
  if (!code) {
    dashboardUrl.searchParams.set("error", "O código de autorização não foi recebido. Por favor, tente novamente.");
    return NextResponse.redirect(dashboardUrl);
  }

  // 4. Exchange code for an access token (Backend logic)
  // This is where you would make a server-to-server call to Meta's API
  // For now, we'll simulate this step and assume it's successful.
  // In a real implementation, you would:
  // - Make a POST request to https://graph.facebook.com/v20.0/oauth/access_token
  // - Include client_id, client_secret, redirect_uri, and the code.
  // - Receive the access token and save it securely (e.g., in Firestore).

  try {
    // ---- SIMULATED TOKEN EXCHANGE ----
    console.log(`[Meta Auth] Código recebido: ${code}. Iniciando simulação de troca de token...`);
    // const response = await fetch(...); // Real API call would be here
    // const data = await response.json();
    // if (data.error) throw new Error(data.error.message);
    // const accessToken = data.access_token;
    // await saveUserAccessToken(userId, accessToken); // Save token to DB
    console.log("[Meta Auth] Simulação bem-sucedida. Token de acesso teria sido obtido e salvo.");
    // ---- END SIMULATION ----

    // 5. Redirect back to the dashboard with a success indicator
    dashboardUrl.searchParams.set("connected", "true");
    return NextResponse.redirect(dashboardUrl);

  } catch (exchangeError: any) {
    console.error("Erro ao trocar o código pelo token de acesso:", exchangeError);
    dashboardUrl.searchParams.set("error", "Falha ao obter o token de acesso da Meta. Tente novamente.");
    return NextResponse.redirect(dashboardUrl);
  }
}
