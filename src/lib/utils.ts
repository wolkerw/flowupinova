import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Traduz mensagens de erro técnicas (como as da Meta API) para mensagens amigáveis em português.
 */
export function getFriendlyErrorMessage(error: string): string {
  if (!error) return "Ocorreu um erro inesperado. Tente novamente.";

  const errorLower = error.toLowerCase();

  // Erros de Token da Meta (Facebook/Instagram)
  if (
    errorLower.includes("error validating access token") ||
    errorLower.includes("expired") ||
    errorLower.includes("session has expired") ||
    errorLower.includes("invalid access token")
  ) {
    return "Sua conexão com o Facebook/Instagram expirou. Para resolver, vá em 'Conteúdo' e reconecte sua conta nas 'Contas Conectadas'.";
  }

  if (
    errorLower.includes("unsupported post request") ||
    errorLower.includes("permissions error") ||
    errorLower.includes("requires the manage_pages permission")
  ) {
    return "Faltam permissões para publicar. Vá em 'Conteúdo', desconecte e reconecte sua conta garantindo que todas as permissões foram aceitas.";
  }

  if (errorLower.includes("limit reached") || errorLower.includes("too many requests")) {
    return "Limite de publicações atingido temporariamente. Tente novamente mais tarde.";
  }

  // Erros de CORS / Firebase Storage
  if (errorLower.includes("cors") || errorLower.includes("firebase storage")) {
    return "Erro de permissão ao processar a imagem. Por favor, tente novamente em alguns instantes.";
  }

  // Mensagens padrão traduzidas se conhecidas
  if (errorLower.includes("network error") || errorLower.includes("fetch") || errorLower.includes("failed to fetch")) {
    return "Falha de conexão com o servidor. Verifique sua internet ou tente novamente.";
  }

  return error; // Retorna o erro original se não houver tradução específica
}

/**
 * Verifica se o erro é relacionado à conexão expirada ou falta de permissão da Meta.
 */
export function isConnectionError(error: string): boolean {
  if (!error) return false;
  const errorLower = error.toLowerCase();
  return (
    errorLower.includes("error validating access token") ||
    errorLower.includes("expired") ||
    errorLower.includes("session has expired") ||
    errorLower.includes("invalid access token") ||
    errorLower.includes("permissions error") ||
    errorLower.includes("requires the manage_pages permission")
  );
}
