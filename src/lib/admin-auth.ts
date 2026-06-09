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
  ...(process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim()).filter(Boolean) ?? []),
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

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(token);
  } catch (err) {
    console.error("[ADMIN_AUTH] Token inválido:", err);
    redirect("/acesso/login");
  }

  const email = decoded.email ?? "";

  if (!ADMIN_EMAILS.includes(email)) {
    console.warn(`[ADMIN_AUTH] Acesso negado para e-mail não autorizado: ${email}`);
    redirect("/dashboard");
  }

  return {
    uid: decoded.uid,
    email,
    name: decoded.name ?? email,
  };
}

/**
 * Valida token admin em API Routes.
 * Retorna o AdminUser ou null em caso de acesso negado.
 */
export async function validateAdminToken(token: string | null): Promise<AdminUser | null> {
  if (!token) return null;

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const email = decoded.email ?? "";

    if (!ADMIN_EMAILS.includes(email)) {
      return null;
    }

    return {
      uid: decoded.uid,
      email,
      name: decoded.name ?? email,
    };
  } catch {
    return null;
  }
}
