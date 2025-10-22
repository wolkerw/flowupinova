
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  console.warn("A funcionalidade de CRON foi desativada para corrigir um erro de compilação.");
  return NextResponse.json({ success: false, error: "Funcionalidade de CRON desativada." }, { status: 503 });
}

    