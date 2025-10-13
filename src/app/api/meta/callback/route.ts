
// src/app/api/meta/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { updateMetaConnection } from "@/lib/services/meta-service";
import { auth } from 'firebase-admin';
import { getAuth } from "firebase/auth";
import { app } from "@/lib/firebase";


async function getUserIdFromRequest(req: NextRequest): Promise<string | null> {
    // This is a placeholder. In a real app, you'd get the user ID
    // from a secure session cookie or by verifying a bearer token.
    // For now, we assume a hardcoded user for demonstration.
    // A more robust solution would involve middleware to handle auth state.
    const hardcodedUserId = "zB8fP5bN4yX2jH6cV1gA9wE7tFk3"; // This should be replaced with real user management
    return hardcodedUserId;
}


export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Hardcode the final destination URL to ensure correctness
  const dashboardUrl = new URL("https://9000-firebase-studio-1757951248950.cluster-57i2ylwve5fskth4xb2kui2ow2.cloudworkstations.dev/dashboard/conteudo");

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

  // This is a placeholder for getting the current user's ID
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
     dashboardUrl.searchParams.set("error", "Não foi possível identificar o usuário. Faça login e tente novamente.");
     return NextResponse.redirect(dashboardUrl);
  }


  // 4. Exchange code for an access token (Backend logic)
  try {
    // ---- SIMULATED TOKEN EXCHANGE ----
    console.log(`[Meta Auth] Código recebido: ${code}. Iniciando simulação de troca de token...`);
    // In a real implementation, you would:
    // - Make a POST request to https://graph.facebook.com/v20.0/oauth/access_token
    // - Include client_id, client_secret, redirect_uri, and the code.
    // - Receive the access token and save it securely.
    
    // Save the connected state to Firestore
    await updateMetaConnection(userId, { isConnected: true, connectedAt: new Date() });

    console.log("[Meta Auth] Simulação bem-sucedida. Status de conexão salvo no Firestore.");
    // ---- END SIMULATION ----

    // 5. Redirect back to the dashboard with a success indicator
    dashboardUrl.searchParams.set("connected", "true");
    return NextResponse.redirect(dashboardUrl);

  } catch (exchangeError: any) {
    console.error("Erro ao trocar o código ou salvar o status:", exchangeError);
    dashboardUrl.searchParams.set("error", "Falha ao processar a autenticação da Meta. Tente novamente.");
    return NextResponse.redirect(dashboardUrl);
  }
}

