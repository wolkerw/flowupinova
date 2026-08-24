import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Armazenamento em memória para sliding window caso Upstash não esteja configurado
interface MemoryRateLimitRecord {
  timestamps: number[];
}

const memoryStore = new Map<string, MemoryRateLimitRecord>();

function memorySlidingWindow(
  key: string,
  limit: number,
  windowMs: number
): {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
} {
  const now = Date.now();
  const windowStart = now - windowMs;

  let record = memoryStore.get(key);
  if (!record) {
    record = { timestamps: [] };
    memoryStore.set(key, record);
  }

  // Manter apenas timestamps dentro da janela atual
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (record.timestamps.length >= limit) {
    const oldestTimestamp = record.timestamps[0] || now;
    const reset = oldestTimestamp + windowMs;
    return {
      success: false,
      limit,
      remaining: 0,
      reset,
    };
  }

  record.timestamps.push(now);
  const reset = now + windowMs;
  return {
    success: true,
    limit,
    remaining: limit - record.timestamps.length,
    reset,
  };
}

class SafeRateLimiter {
  private ratelimit: Ratelimit | null = null;
  private maxRequests: number;
  private windowMs: number;

  constructor(options: {
    maxRequests: number;
    windowSeconds: number;
    prefix: string;
  }) {
    this.maxRequests = options.maxRequests;
    this.windowMs = options.windowSeconds * 1000;

    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      try {
        const redis = new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });

        this.ratelimit = new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(options.maxRequests, `${options.windowSeconds} s` as any),
          analytics: true,
          prefix: options.prefix,
        });
      } catch (e) {
        console.warn("[RATE_LIMIT_INIT_WARN] Falha ao inicializar Upstash Redis, usando memória:", e);
        this.ratelimit = null;
      }
    }
  }

  async limit(identifier: string): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
  }> {
    if (this.ratelimit) {
      try {
        const result = await this.ratelimit.limit(identifier);
        return {
          success: result.success,
          limit: result.limit,
          remaining: result.remaining,
          reset: result.reset,
        };
      } catch (err) {
        console.warn(
          "[RATE_LIMIT_WARN] Erro ao consultar Upstash, alternando para in-memory fallback:",
          err
        );
      }
    }

    return memorySlidingWindow(identifier, this.maxRequests, this.windowMs);
  }
}

// 10 requisições por minuto por identificador para endpoints de IA
export const aiRateLimit = new SafeRateLimiter({
  maxRequests: 10,
  windowSeconds: 60,
  prefix: "@upstash/ratelimit/ai",
});

// 30 requisições por minuto por identificador para APIs públicas
export const publicApiRateLimit = new SafeRateLimiter({
  maxRequests: 30,
  windowSeconds: 60,
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
