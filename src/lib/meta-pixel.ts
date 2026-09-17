/**
 * Utilitários tipados para integração com a Meta Pixel API (fbq) nas páginas públicas.
 */

export const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID || "151210767670681594"; // ID configurável via env ou fallback

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
  }
}

/**
 * Lista de rotas públicas onde o Meta Pixel é PERMITIDO ser executado.
 */
export const PUBLIC_ROUTES = [
  "/",
  "/acesso",
  "/acesso/login",
  "/acesso/cadastro",
  "/termos",
  "/privacidade",
];

/**
 * Verifica se a rota fornecida é uma rota pública permitida para disparo do Pixel.
 */
export function isPublicRoute(pathname: string): boolean {
  if (!pathname) return false;
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin") || pathname.startsWith("/api")) {
    return false;
  }
  return (
    PUBLIC_ROUTES.includes(pathname) ||
    pathname === "" ||
    !pathname.startsWith("/dashboard")
  );
}

/**
 * Dispara o evento de PageView para a Meta
 */
export function trackPageView() {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", "PageView");
  }
}

/**
 * Dispara o evento de Novo Cadastro Concluído (CompleteRegistration)
 */
export function trackCompleteRegistration(data?: { method?: string }) {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", "CompleteRegistration", data || { method: "Email" });
  }
}

/**
 * Dispara o evento de Início de Checkout / Seleção de Plano
 */
export function trackInitiateCheckout(data?: { planName?: string; value?: number; currency?: string }) {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", "InitiateCheckout", {
      content_name: data?.planName || "Plano NumVapt",
      value: data?.value || 0,
      currency: data?.currency || "BRL",
    });
  }
}

/**
 * Dispara o evento de Compra / Assinatura Confirmada
 */
export function trackPurchase(value: number, currency: string = "BRL") {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", "Purchase", {
      value,
      currency,
    });
  }
}
