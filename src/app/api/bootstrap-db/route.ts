
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  console.warn("A rota de bootstrap do banco de dados foi desativada.");
  return NextResponse.json({ success: false, error: "Funcionalidade desativada." }, { status: 503 });
}
