
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  console.warn("A rota de contas de anúncio foi desativada.");
  return NextResponse.json({ success: true, accounts: [] });
}
