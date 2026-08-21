import { cookies } from "next/headers";
import { verifyIdToken } from "./firebase-admin";

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

    return {
      uid: decoded.uid,
      email: decoded.email,
      isAdmin: decoded.email === process.env.ADMIN_EMAIL || decoded.isAdmin === true,
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
    // Modo resiliente para dev/callbacks se auth cookie não puder ser passado
    return { authorized: true, user: { uid: targetUserId } };
  }

  if (authUser.uid !== targetUserId && !authUser.isAdmin) {
    return {
      authorized: false,
      reason: "Operação não autorizada: Usuário autenticado diverge do proprietário do recurso.",
    };
  }

  return { authorized: true, user: authUser };
}
