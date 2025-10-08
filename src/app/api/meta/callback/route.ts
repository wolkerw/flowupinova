
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
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const [authState, userId] = state?.split(":") || [];

  if (!code) {
    return NextResponse.redirect(new URL(`/dashboard/conteudo?error=missing_code`, req.url));
  }
  if (authState !== "flowup-auth-state" || !userId) {
    console.error("[META_CB] Auth failed: State mismatch or missing userId.");
    return NextResponse.redirect(new URL(`/dashboard/conteudo?error=state_mismatch`, req.url));
  }
  
  if (seenCodes.has(code)) {
    console.warn("[META_CB] Attempted to redeem an already used authorization code.");
    return NextResponse.redirect(new URL("/dashboard/conteudo?error=code_already_used", req.url));
  }
  seenCodes.add(code);
  setTimeout(() => seenCodes.delete(code), 5 * 60 * 1000); // Limpa o código após 5 minutos

  try {
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
      return NextResponse.redirect(new URL(`/dashboard/conteudo?error=${encodeURIComponent(errorMsg)}`, req.url));
    }

    const shortLivedToken = tokenJson.access_token;
    
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

        console.log(`[META_CB][background] Successfully obtained final token for user ${userId}. Fetching user details...`);
        
        // Agora com o token final e o userId, buscamos os detalhes.
        await getAndSaveUserDetails(userId, finalToken);

      } catch (e: any) {
        console.error(`[META_CB][background] Fatal error in background task for user ${userId}:`, e?.message);
        await saveUserTokenSafely(userId, { userAccessToken: shortLivedToken, isConnected: false });
      }
    });

    console.log("[META_CB] Redirecting user to dashboard. Background task initiated.");
    return NextResponse.redirect(new URL("/dashboard/conteudo?connected=true", req.url));

  } catch (err: any) {
    console.error("[META_CB][fatal]", err?.message || err);
    return NextResponse.redirect(new URL(`/dashboard/conteudo?error=internal_callback_error`, req.url));
  }
}
