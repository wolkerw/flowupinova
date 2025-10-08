// src/app/api/meta/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { saveUserTokenSafely, getAndSaveUserDetails } from "@/lib/services/meta-service";
import { META_APP_ID, META_APP_SECRET, META_REDIRECT_URI } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Em um ambiente de produção, isso seria um Redis ou banco de dados para evitar "dupla troca".
// Para desenvolvimento, um Set em memória é suficiente.
const seenCodes = new Set<string>();

export async function GET(req: NextRequest) {
  const u = new URL(req.url);
  const code = u.searchParams.get("code");
  const state = u.searchParams.get("state");

  if (!code) {
    console.error("[META_CB] Auth failed: Missing code parameter.");
    return NextResponse.redirect(new URL(`/dashboard/conteudo?error=missing_code`, u.origin));
  }
  if (state !== "flowup-auth-state") {
    console.error("[META_CB] Auth failed: State mismatch.");
    return NextResponse.redirect(new URL(`/dashboard/conteudo?error=state_mismatch`, u.origin));
  }
  
  if (seenCodes.has(code)) {
    console.warn("[META_CB] Attempted to redeem an already used authorization code.");
    return NextResponse.redirect(new URL("/dashboard/conteudo?error=code_already_used", u.origin));
  }
  seenCodes.add(code);
  // Limpa o Set periodicamente para não consumir memória indefinidamente
  setTimeout(() => seenCodes.delete(code), 5 * 60 * 1000); // 5 minutos

  try {
    // Etapa 1: Troca do code por um token de acesso de curta duração.
    const tokenBody = new URLSearchParams({
      client_id: META_APP_ID,
      client_secret: META_APP_SECRET,
      redirect_uri: META_REDIRECT_URI,
      code,
    });

    const tokenRes = await fetch("https://graph.facebook.com/v20.0/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: tokenBody,
      cache: "no-store",
    });

    const tokenText = await tokenRes.text();
    let tokenJson: any;
    try { tokenJson = JSON.parse(tokenText); } catch { tokenJson = { raw: tokenText }; }
    
    console.log("[META_CB][exchange_short] status:", tokenRes.status, "body:", tokenJson);

    if (!tokenRes.ok || !tokenJson?.access_token) {
      const errorMsg = tokenJson?.error?.message || "token_exchange_failed";
      console.error(`[META_CB] Failed to exchange short-lived token: ${errorMsg}`);
      return NextResponse.redirect(new URL(`/dashboard/conteudo?error=${encodeURIComponent(errorMsg)}`, u.origin));
    }

    const shortLivedToken = tokenJson.access_token;
    
    // Etapa 2 (em segundo plano): Troca por token de longa duração e busca de detalhes.
    // Usamos queueMicrotask para não bloquear a resposta ao usuário.
    queueMicrotask(async () => {
      try {
        const longLivedParams = new URLSearchParams({
            grant_type: "fb_exchange_token",
            client_id: META_APP_ID,
            client_secret: META_APP_SECRET,
            fb_exchange_token: shortLivedToken,
        });
        const llRes = await fetch(`https://graph.facebook.com/v20.0/oauth/access_token`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
            body: longLivedParams,
            cache: "no-store",
        });

        const llText = await llRes.text();
        let llJson: any;
        try { llJson = JSON.parse(llText); } catch { llJson = { raw: llText }; }
        
        const finalToken = llJson?.access_token ?? shortLivedToken;

        console.log(`[META_CB][background] Successfully obtained final token. Fetching user details...`);
        // Agora, com o token final, buscamos os detalhes e salvamos tudo.
        await getAndSaveUserDetails(finalToken);

      } catch (e: any) {
        console.error("[META_CB][background] Fatal error in background task:", e?.message);
        // Se a tarefa em segundo plano falhar, pelo menos tentamos salvar o token de curta duração.
        await saveUserTokenSafely({ userAccessToken: shortLivedToken, isConnected: false });
      }
    });

    // Etapa 3: Redireciona o usuário imediatamente para o dashboard.
    console.log("[META_CB] Redirecting user to dashboard. Background task initiated.");
    return NextResponse.redirect(new URL("/dashboard/conteudo?connected=true", u.origin));

  } catch (err: any) {
    console.error("[META_CB][fatal]", err?.message || err);
    // Erro fatal de rede ou parsing, redireciona com erro genérico.
    return NextResponse.redirect(new URL(`/dashboard/conteudo?error=internal_callback_error`, u.origin));
  }
}
