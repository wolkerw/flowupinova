// src/app/api/meta/callback/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const defaultErrorUrl = new URL("/dashboard/conteudo", req.nextUrl.origin);
  defaultErrorUrl.searchParams.set("error", "meta_integration_disabled");
  
  console.warn("A rota de callback da Meta foi desativada.");
  
  return NextResponse.redirect(defaultErrorUrl);
}
