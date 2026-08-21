import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Usaremos um cache em memória como fallback/mock caso a variável de ambiente não esteja configurada (ex: localhost/testes)
const cache = new Map();

const getRedisClient = () => {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return null;
};

// Rate limiter para endpoints de Inteligência Artificial (ex: Geração de Imagem, Texto, Avatar)
// Configurado para 10 requisições por minuto por identificador (UID/IP)
export const aiRateLimit = new Ratelimit({
  redis: getRedisClient() || (cache as any), // Fallback para dev local sem env vars
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  analytics: true,
  prefix: "@upstash/ratelimit/ai",
});

// Rate limiter genérico para outras APIs públicas
// Configurado para 30 requisições por minuto por identificador (IP)
export const publicApiRateLimit = new Ratelimit({
  redis: getRedisClient() || (cache as any),
  limiter: Ratelimit.slidingWindow(30, "1 m"),
  analytics: true,
  prefix: "@upstash/ratelimit/public",
});

/**
 * Função utilitária para extrair o IP do cliente da Request no Next.js App Router
 */
export function getIpFromRequest(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}
