import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyIdToken } from "./firebase-admin";
import { ADMIN_EMAILS } from "./admin-auth";

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  isAdmin?: boolean;
}

/**
 * Valida a autenticação do usuário a partir da requisição HTTP (Headers ou Cookies).
 */
export async function getAuthenticatedUser(request?: Request): Promise<AuthenticatedUser | null> {
  try {
    let token: string | undefined;

    // 1. Tentar extrair do header Authorization
    if (request) {
      const authHeader = request.headers.get("Authorization") || request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7).trim();
      }
    }

    // 2. Tentar extrair dos cookies se não encontrado no header
    if (!token) {
      const cookieStore = await cookies();
      token =
        cookieStore.get("firebase-id-token")?.value ||
        cookieStore.get("fb-id-token")?.value;
    }

    if (!token) {
      return null;
    }

    const decoded = await verifyIdToken(token);
    if (!decoded || !decoded.uid) {
      return null;
    }

    const emailLower = (decoded.email || "").trim().toLowerCase();
    const isSystemAdmin =
      Boolean(emailLower && emailLower === (process.env.ADMIN_EMAIL || "").trim().toLowerCase()) ||
      decoded.isAdmin === true ||
      ADMIN_EMAILS.some((e) => e.trim().toLowerCase() === emailLower);

    return {
      uid: decoded.uid,
      email: decoded.email,
      isAdmin: isSystemAdmin,
    };
  } catch (error) {
    console.warn("[API_AUTH] Falha ao verificar autenticação:", error);
    return null;
  }
}

/**
 * Valida se o usuário que está fazendo a requisição tem permissão para agir em nome do targetUserId.
 */
export async function validateUserOwnership(
  request: Request | undefined,
  targetUserId: string
): Promise<{ authorized: boolean; reason?: string; user?: AuthenticatedUser }> {
  if (!targetUserId) {
    return { authorized: false, reason: "ID de usuário obrigatório não informado." };
  }

  const authUser = await getAuthenticatedUser(request);
  if (!authUser) {
    // SEGURANÇA: sem autenticação válida nunca há autorização.
    return { authorized: false, reason: "Autenticação obrigatória." };
  }

  if (authUser.uid !== targetUserId && !authUser.isAdmin) {
    return {
      authorized: false,
      reason: "Operação não autorizada: Usuário autenticado diverge do proprietário do recurso.",
    };
  }

  return { authorized: true, user: authUser };
}

/**
 * Exige um usuário autenticado (token Firebase verificado) na API Route.
 * Uso:
 *   const auth = await requireUser(request);
 *   if (auth instanceof NextResponse) return auth;
 *   // auth.uid é confiável
 */
export async function requireUser(request?: Request): Promise<AuthenticatedUser | NextResponse> {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Autenticação obrigatória." },
      { status: 401 }
    );
  }
  return user;
}

/**
 * Exige usuário autenticado que seja o dono de targetUserId (ou admin).
 * Se targetUserId vier vazio, assume o próprio usuário autenticado.
 */
export async function requireOwner(
  request: Request | undefined,
  targetUserId: string | null | undefined
): Promise<AuthenticatedUser | NextResponse> {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;
  if (targetUserId && targetUserId !== user.uid && !user.isAdmin) {
    return NextResponse.json(
      { success: false, error: "Operação não autorizada para este usuário." },
      { status: 403 }
    );
  }
  return user;
}

/**
 * Exige usuário admin (e-mail na lista ADMIN_EMAILS ou claim isAdmin).
 */
export async function requireAdminUser(request?: Request): Promise<AuthenticatedUser | NextResponse> {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;
  if (!user.isAdmin) {
    return NextResponse.json({ success: false, error: "Acesso restrito." }, { status: 403 });
  }
  return user;
}
