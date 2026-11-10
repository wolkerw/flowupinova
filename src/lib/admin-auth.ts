import { adminAuth } from "@/lib/firebase-admin";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Lista de e-mails com acesso ao painel admin.
 * Lida a partir de variável de ambiente do servidor (nunca exposta ao cliente).
 * Fallback hardcoded para garantir acesso em caso de .env não configurado.
 */
export const ADMIN_EMAILS: string[] = [
  "fernando.home@hotmail.com",
  "contato@wolker.com.br",
  "bruno@muranmarketing.com.br",
  "flowupinova@gmail.com",
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
    // SEGURANÇA: nunca confiar no payload de um JWT cuja assinatura não foi verificada.
    console.warn("[ADMIN_AUTH] verifyIdToken falhou:", err);
    redirect("/acesso/login");
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
    // SEGURANÇA: token com assinatura inválida/expirada nunca concede acesso admin.
    return null;
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
