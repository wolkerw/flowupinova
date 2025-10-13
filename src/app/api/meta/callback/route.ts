// src/app/api/meta/callback/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const dashboardUrl = new URL("/dashboard/conteudo", req.nextUrl.origin);

  if (error) {
    console.error(`Erro no callback da Meta: ${error} - ${errorDescription}`);
    dashboardUrl.searchParams.set("error", errorDescription || "Ocorreu um erro desconhecido durante a autenticação com a Meta.");
    return NextResponse.redirect(dashboardUrl);
  }

  if (state !== 'flowup-auth-state') {
    dashboardUrl.searchParams.set("error", "O estado de autenticação é inválido. Por favor, tente novamente.");
    return NextResponse.redirect(dashboardUrl);
  }

  if (!code) {
    dashboardUrl.searchParams.set("error", "O código de autorização não foi recebido. Por favor, tente novamente.");
    return NextResponse.redirect(dashboardUrl);
  }

  // Por enquanto, apenas redirecionamos com uma mensagem de sucesso temporária.
  // A lógica de troca do código pelo token será implementada na próxima etapa.
  dashboardUrl.searchParams.set("success", "meta_connected");
  dashboardUrl.searchParams.set("temp_code", code); // Para depuração
  
  return NextResponse.redirect(dashboardUrl);
}

    