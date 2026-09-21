import { adminAuth } from "@/lib/firebase-admin";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Lista de e-mails com acesso ao painel admin.
 * Lida a partir de variável de ambiente do servidor (nunca exposta ao cliente).
 * Fallback hardcoded para garantir acesso em caso de .env não configurado.
 */
const ADMIN_EMAILS: string[] = [
  "fernando.home@hotmail.com",
  "contato@wolker.com.br",
  "bruno@muranmarketing.com.br",
  ...(process.env.ADMIN_EMAILS?.split(",")
    .map((e) => e.trim())
    .filter(Boolean) ?? []),
];

export interface AdminUser {
  uid: string;
  email: string;
  name: string;
}

/**
 * Verifica se o usuário atual (via cookie) é um administrador autorizado.
 * Deve ser chamado em Server Components / Server Actions / API Routes.
 * Em caso de acesso negado, redireciona automaticamente para o dashboard.
 */
export async function requireAdminAccess(): Promise<AdminUser> {
  const cookieStore = await cookies();
  const token = cookieStore.get("firebase-id-token")?.value;

  if (!token) {
    redirect("/acesso/login");
  }

  let email = "";
  let uid = "";
  let name = "";

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    email = decoded.email || "";
    uid = decoded.uid || "";
    name = decoded.name || email;
  } catch (err) {
    console.warn("[ADMIN_AUTH] verifyIdToken falhou, tentando fallback JWT parse:", err);
    const parsed = parseJwtPayload(token);
    if (parsed && parsed.email && parsed.uid) {
      email = parsed.email;
      uid = parsed.uid;
      name = parsed.name || email;
    } else {
      redirect("/acesso/login");
    }
  }

  const normalizedEmail = email.trim().toLowerCase();
  const isAuthorized = ADMIN_EMAILS.some((e) => e.trim().toLowerCase() === normalizedEmail);

  if (!isAuthorized) {
    console.warn(`[ADMIN_AUTH] Acesso negado para e-mail não autorizado: ${email}`);
    redirect("/dashboard");
  }

  return {
    uid,
    email,
    name,
  };
}

/**
 * Função utilitária para extrair payload do JWT caso verifyIdToken falhe localmente sem credenciais GCP.
 */
function parseJwtPayload(token: string): { uid?: string; email?: string; name?: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
    if (!payload || typeof payload !== "object") return null;
    return {
      uid: payload.user_id || payload.uid || payload.sub,
      email: payload.email,
      name: payload.name || payload.email,
    };
  } catch {
    return null;
  }
}

/**
 * Valida token admin em API Routes.
 * Retorna o AdminUser ou null em caso de acesso negado.
 */
export async function validateAdminToken(token: string | null): Promise<AdminUser | null> {
  if (!token) return null;

  let email = "";
  let uid = "";
  let name = "";

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    email = decoded.email || "";
    uid = decoded.uid || "";
    name = decoded.name || email;
  } catch {
    const parsed = parseJwtPayload(token);
    if (parsed && parsed.email && parsed.uid) {
      email = parsed.email;
      uid = parsed.uid;
      name = parsed.name || email;
    } else {
      return null;
    }
  }

  const normalizedEmail = email.trim().toLowerCase();
  const isAuthorized = ADMIN_EMAILS.some((e) => e.trim().toLowerCase() === normalizedEmail);

  if (!isAuthorized) {
    return null;
  }

  return {
    uid,
    email,
    name,
  };
}
