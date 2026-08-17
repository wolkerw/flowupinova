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
  if (
    errorLower.includes("network error") ||
    errorLower.includes("fetch") ||
    errorLower.includes("failed to fetch")
  ) {
    return "Falha de conexão com o servidor. Verifique sua internet ou tente novamente.";
  }

  // Erros de JSON / Parsing da IA
  if (
    errorLower.includes("json at position") ||
    errorLower.includes("expected property name") ||
    errorLower.includes("unexpected token")
  ) {
    return "A IA gerou uma resposta formatada incorretamente. Por favor, tente novamente.";
  }

  return error; // Retorna o erro original se não houver tradução específica
}

/**
 * Realiza o parse de respostas JSON de LLMs de forma resiliente.
 */
export function safeParseJSON<T = any>(rawText: string): T {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("O texto para parse de JSON está vazio ou inválido.");
  }

  let cleaned = rawText
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const firstBrace = cleaned.search(/[\{\[]/);
  const lastBrace = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (err1: any) {
    try {
      const repairedStrings = cleaned.replace(
        /"((?:[^"\\]|\\.)*)"/g,
        (match, group1) => {
          const sanitizedGroup = group1
            .replace(/\n/g, "\\n")
            .replace(/\r/g, "\\r")
            .replace(/\t/g, "\\t");
          return `"${sanitizedGroup}"`;
        }
      );
      return JSON.parse(repairedStrings);
    } catch (err2: any) {
      try {
        const repairedTrailingCommas = cleaned
          .replace(/"((?:[^"\\]|\\.)*)"/g, (match, group1) => {
            const sanitizedGroup = group1
              .replace(/\n/g, "\\n")
              .replace(/\r/g, "\\r")
              .replace(/\t/g, "\\t");
            return `"${sanitizedGroup}"`;
          })
          .replace(/,\s*([\}\]])/g, "$1");
        return JSON.parse(repairedTrailingCommas);
      } catch (err3: any) {
        console.error("[SAFE_PARSE_JSON] Falha ao reparar JSON da IA:", {
          originalLength: rawText.length,
          snippet: rawText.substring(0, 200),
          error: err1?.message || err1,
        });
        throw new Error(
          `Falha ao converter resposta da IA em formato JSON válido: ${err1?.message || String(err1)}`
        );
      }
    }
  }
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
