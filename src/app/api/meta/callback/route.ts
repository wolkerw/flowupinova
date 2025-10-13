// src/app/api/meta/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { updateMetaConnection } from "@/lib/services/meta-service";

// NOTE: This is a simplified example. In a production app, you'd use a robust
// session management system (e.g., using JWTs in cookies) to get the user ID.
// The dependency on 'firebase-admin' is removed to avoid server-side SDK confusion.
async function getUserIdFromState(state: string | null): Promise<string | null> {
    if (!state) return null;
    // This is still a placeholder. A real implementation would involve a secure
    // way to pass or retrieve the user ID, maybe encoding it in the state
    // or using a server session linked to the OAuth flow.
    // For now, we'll assume a hardcoded user ID for demonstration until
    // a full session management is implemented.
    const hardcodedUserId = "zB8fP5bN4yX2jH6cV1gA9wE7tFk3"; // THIS MUST BE REPLACED in a real scenario
    return hardcodedUserId;
}


export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const dashboardUrl = new URL("https://9000-firebase-studio-1757951248950.cluster-57i2ylwve5fskth4xb2kui2ow2.cloudworkstations.dev/dashboard/conteudo");

  if (error) {
    console.error(`Erro no callback da Meta: ${error} - ${errorDescription}`);
    dashboardUrl.searchParams.set("error", errorDescription || "Ocorreu um erro desconhecido durante a autenticação com a Meta.");
    return NextResponse.redirect(dashboardUrl);
  }

  // A simple state validation
  if (state !== 'flowup-auth-state') {
    dashboardUrl.searchParams.set("error", "O estado de autenticação é inválido. Por favor, tente novamente.");
    return NextResponse.redirect(dashboardUrl);
  }

  if (!code) {
    dashboardUrl.searchParams.set("error", "O código de autorização não foi recebido. Por favor, tente novamente.");
    return NextResponse.redirect(dashboardUrl);
  }

  // Placeholder for getting user ID.
  const userId = await getUserIdFromState(state);
  if (!userId) {
     dashboardUrl.searchParams.set("error", "Não foi possível identificar o usuário. Faça login e tente novamente.");
     return NextResponse.redirect(dashboardUrl);
  }


  try {
    console.log(`[Meta Auth] Código recebido: ${code}. Iniciando simulação de troca de token para o usuário ${userId}...`);
    
    // In a real app, you'd make a POST request to Meta's token endpoint here.
    // We are simulating this step and assuming it's successful.

    // Save the connected state to Firestore for the correct user.
    await updateMetaConnection(userId, { isConnected: true, connectedAt: new Date() });

    console.log("[Meta Auth] Simulação bem-sucedida. Status de conexão salvo no Firestore.");

    // Redirect back to the dashboard with a success indicator
    dashboardUrl.searchParams.set("connected", "true");
    return NextResponse.redirect(dashboardUrl);

  } catch (exchangeError: any) {
    console.error("Erro ao trocar o código ou salvar o status:", exchangeError);
    dashboardUrl.searchParams.set("error", "Falha ao processar a autenticação da Meta. Tente novamente.");
    return NextResponse.redirect(dashboardUrl);
  }
}
