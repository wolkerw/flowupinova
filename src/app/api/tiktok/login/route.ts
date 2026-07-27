import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId") || searchParams.get("state") || "";

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") || "https";
  const origin = `${protocol}://${host}`;

  const clientKey = config.tiktok.clientKey;
  if (!clientKey) {
    return NextResponse.redirect(
      new URL("/dashboard/conteudo?tiktok_error=server_config_missing", origin)
    );
  }

  // 1. Gerar PKCE (Code Verifier e Code Challenge S256)
  const verifier = crypto.randomBytes(32).toString("base64url");
  const challenge = crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url");

  // 2. Construir URL de autorização do TikTok v2
  const redirectUri = config.tiktok.redirectUri || `${origin}/api/tiktok/callback`;
  const scope = "user.info.basic,video.upload";

  const tiktokAuthUrl = new URL("https://www.tiktok.com/v2/auth/authorize/");
  tiktokAuthUrl.searchParams.set("client_key", clientKey);
  tiktokAuthUrl.searchParams.set("scope", scope);
  tiktokAuthUrl.searchParams.set("response_type", "code");
  tiktokAuthUrl.searchParams.set("redirect_uri", redirectUri);
  tiktokAuthUrl.searchParams.set("state", userId);
  tiktokAuthUrl.searchParams.set("code_challenge", challenge);
  tiktokAuthUrl.searchParams.set("code_challenge_method", "S256");

  const response = NextResponse.redirect(tiktokAuthUrl.toString());

  // 3. Salvar o verifier no Cookie HTTP-Only seguro para uso no callback
  response.cookies.set("tiktok_code_verifier", verifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutos
    path: "/",
  });

  return response;
}
