import { type NextRequest, NextResponse } from "next/server";

/**
 * Middleware de proteção de rotas.
 * Para /admin: verifica se o cookie de sessão Firebase existe.
 * A validação completa do token e verificação do e-mail admin
 * é feita no layout.tsx (Server Component) para manter o middleware leve e rápido.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Proteger todas as rotas /admin
  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get("firebase-id-token")?.value;

    if (!token) {
      const loginUrl = new URL("/acesso/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
