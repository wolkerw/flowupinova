import crypto from "crypto";

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

/**
 * Valida o header X-Hub-Signature-256 enviado pela Meta (Instagram/Facebook/WhatsApp Cloud API).
 * Aceita qualquer um dos app secrets configurados (Instagram Login e Facebook Login usam apps diferentes).
 * Se nenhum secret estiver configurado, retorna true (e registra aviso) para não derrubar a integração.
 */
export function verifyMetaSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secrets = [
    process.env.INSTAGRAM_APP_SECRET,
    process.env.META_APP_SECRET,
    process.env.META_CLIENT_SECRET,
  ].filter((s): s is string => Boolean(s && s.trim()));

  if (secrets.length === 0) {
    console.error("[WEBHOOK_AUTH] Nenhum app secret da Meta configurado: assinatura NÃO verificada.");
    return true;
  }
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) return false;

  return secrets.some((secret) => {
    const expected = "sha256=" + crypto.createHmac("sha256", secret.trim()).update(rawBody, "utf8").digest("hex");
    return safeEqual(expected, signatureHeader);
  });
}

/**
 * Valida um segredo compartilhado (header "x-webhook-secret" ou query "?secret=").
 * Se a variável de ambiente não estiver definida, retorna true (e registra aviso).
 */
export function verifySharedSecret(request: Request, envVar: string): boolean {
  const expected = process.env[envVar];
  if (!expected) {
    console.error(`[WEBHOOK_AUTH] ${envVar} não configurado: webhook aceito SEM autenticação.`);
    return true;
  }
  const provided =
    request.headers.get("x-webhook-secret") || new URL(request.url).searchParams.get("secret") || "";
  return safeEqual(provided, expected);
}
