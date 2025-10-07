
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    console.warn("A rota de campanhas de anúncio foi desativada.");
    return NextResponse.json({ success: true, campaigns: [] });
}

export async function POST(request: NextRequest) {
  console.warn("A rota de campanhas de anúncio foi desativada.");
  return NextResponse.json({ success: false, error: "A funcionalidade de criação de campanhas foi desativada." }, { status: 503 });
}
