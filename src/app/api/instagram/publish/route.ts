
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  console.warn("A rota de publicação no Instagram foi desativada.");
  return NextResponse.json({ success: false, error: "A funcionalidade de publicação no Instagram foi desativada." }, { status: 503 });
}
