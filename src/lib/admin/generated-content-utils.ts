/**
 * Utilitários do painel admin "Conteúdo Gerado".
 *
 * - `toIsoDate`: normaliza qualquer formato de data salvo no Firestore (Timestamp, Date,
 *   string ISO, número, objeto serializado `{ _seconds }`) sem lançar exceção.
 * - `isE2ETestContent`: identifica gerações criadas pelos testes automatizados do Playwright
 *   (tests/content-generation.spec.ts), que usam imagem fixa do Unsplash e prompt fixo.
 */

/** Impressões digitais das imagens simuladas pelos testes E2E. */
export const E2E_TEST_IMAGE_FINGERPRINTS = ["images.unsplash.com/photo-1522335789203"];

/** Prompts fixos digitados pelos testes E2E. */
export const E2E_TEST_PROMPT_FINGERPRINTS = [
  "novidades da semana: dicas imperdíveis para impulsionar seu negócio em 2026 com ia",
];

export interface GeneratedContentLike {
  text?: string | null;
  promptUsed?: string | null;
  imageUrl?: string | null;
  imageUrls?: (string | null | undefined)[];
  conceptUrls?: (string | null | undefined)[];
}

export function toIsoDate(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  try {
    let date: Date | null = null;
    if (value instanceof Date) {
      date = value;
    } else if (typeof value === "string" || typeof value === "number") {
      date = new Date(value);
    } else if (typeof value === "object") {
      const v = value as Record<string, any>;
      if (typeof v.toDate === "function") {
        date = v.toDate();
      } else if (typeof v._seconds === "number") {
        date = new Date(v._seconds * 1000);
      } else if (typeof v.seconds === "number") {
        date = new Date(v.seconds * 1000);
      }
    }
    if (!date || Number.isNaN(date.getTime())) return null;
    return date.toISOString();
  } catch {
    return null;
  }
}

export function isE2ETestContent(item: GeneratedContentLike): boolean {
  const urls = [item.imageUrl, ...(item.imageUrls || []), ...(item.conceptUrls || [])].filter(
    (u): u is string => typeof u === "string" && u.length > 0
  );
  if (urls.some((url) => E2E_TEST_IMAGE_FINGERPRINTS.some((fp) => url.includes(fp)))) {
    return true;
  }

  const texts = [item.promptUsed, item.text]
    .filter((t): t is string => typeof t === "string" && t.length > 0)
    .map((t) => t.toLowerCase());
  return texts.some((t) => E2E_TEST_PROMPT_FINGERPRINTS.some((fp) => t.includes(fp)));
}
