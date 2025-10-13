// src/app/api/meta/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { updateMetaConnection } from "@/lib/services/meta-service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // The user ID is now in the state
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const dashboardUrl = new URL("https://9000-firebase-studio-1757951248950.cluster-57i2ylwve5fskth4xb2kui2ow2.cloudworkstations.dev/dashboard/conteudo");

  if (error) {
    console.error(`Erro no callback da Meta: ${error} - ${errorDescription}`);
    dashboardUrl.searchParams.set("error", errorDescription || "Ocorreu um erro desconhecido durante a autenticação com a Meta.");
    return NextResponse.redirect(dashboardUrl);
  }

  // The state now contains the user ID. It's crucial for saving the connection status.
  const userId = state;
  if (!userId) {
     dashboardUrl.searchParams.set("error", "Não foi possível identificar o usuário (estado de autenticação inválido). Faça login e tente novamente.");
     return NextResponse.redirect(dashboardUrl);
  }

  if (!code) {
    dashboardUrl.searchParams.set("error", "O código de autorização não foi recebido. Por favor, tente novamente.");
    return NextResponse.redirect(dashboardUrl);
  }

  try {
    console.log(`[Meta Auth] Código recebido: ${code}. Iniciando simulação de troca de token para o usuário ${userId}...`);
    
    // In a real app, you'd make a POST request to Meta's token endpoint here
    // to exchange the code for an access token.
    // We are simulating this step and assuming it's successful.

    // Save the connected state to Firestore for the correct user.
    await updateMetaConnection(userId, { isConnected: true, connectedAt: new Date() });

    console.log(`[Meta Auth] Simulação bem-sucedida. Status de conexão salvo no Firestore para o usuário ${userId}.`);

    // Redirect back to the dashboard with a success indicator
    dashboardUrl.searchParams.set("connected", "true");
    return NextResponse.redirect(dashboardUrl);

  } catch (exchangeError: any) {
    console.error("Erro ao trocar o código ou salvar o status:", exchangeError);
    dashboardUrl.searchParams.set("error", "Falha ao processar a autenticação da Meta. Tente novamente.");
    return NextResponse.redirect(dashboardUrl);
  }
}
