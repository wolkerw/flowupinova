
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  console.warn("A rota de callback da Meta foi desativada.");
  return NextResponse.json(
    { success: false, error: "A funcionalidade de conexão com a Meta foi desativada." },
    { status: 503 }
  );
}
