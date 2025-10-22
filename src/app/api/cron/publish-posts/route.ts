import { NextResponse } from "next/server";

// Esta rota foi desativada pois a publicação agendada não está implementada
// e estava gerando logs de erro desnecessários.
export async function POST(request: Request) {
  console.warn("A funcionalidade de CRON foi desativada.");
  return NextResponse.json({ success: false, error: "Funcionalidade de CRON desativada." }, { status: 503 });
}
