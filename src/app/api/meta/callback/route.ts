// src/app/api/meta/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAndSaveUserDetails } from "@/lib/services/meta-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const dashboardUrl = new URL("/dashboard/conteudo", origin);

  const [authState, userId] = state?.split(":") || [];

  if (!code) {
    dashboardUrl.searchParams.set("error", "missing_code");
    return NextResponse.redirect(dashboardUrl);
  }
  if (authState !== "flowup-auth-state" || !userId) {
    console.error("[META_CB] Auth failed: State mismatch or missing userId.");
    dashboardUrl.searchParams.set("error", "state_mismatch");
    return NextResponse.redirect(dashboardUrl);
  }

  try {
    // A função getAndSaveUserDetails agora contém toda a lógica de troca de token e salvamento.
    // Ela vai lançar um erro se qualquer etapa falhar.
    await getAndSaveUserDetails(userId, code);
    
    // Se chegou até aqui, tudo deu certo.
    console.log("[META_CB] Redirecting user to dashboard. Background task initiated.");
    dashboardUrl.searchParams.set("connected", "true");
    return NextResponse.redirect(dashboardUrl);

  } catch (err: any) {
    console.error("[META_CB][fatal]", err?.message || err);
    dashboardUrl.searchParams.set("error", err.message || "internal_callback_error");
    return NextResponse.redirect(dashboardUrl);
  }
}
