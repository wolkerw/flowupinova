/**
 * Serviço de tradução automática gratuito e ultrarrápido via Google Translate API (GTX).
 * Traduz nomes de interesses e categorias do inglês para o português do Brasil sem consumir cota de IA.
 */

const translationCache = new Map<string, string>();

/**
 * Traduz uma palavra ou frase para Português do Brasil.
 * Remove sufixos parentéticos técnicos (ex: "(apparel)", "(retailers)") e mantém cache em memória.
 */
export async function translateTextToPt(text: string): Promise<string> {
  if (!text || typeof text !== "string") return text;

  // 1. Limpa sufixos entre parênteses em inglês como (apparel), (retailers), (broad interest)
  const clean = text.replace(/\s*\([^)]*\)/g, "").trim();
  if (!clean) return text;

  // 2. Se for palavra extremamente curta ou número puro, retorna limpa
  if (/^\d+$/.test(clean) || clean.length < 2) {
    return clean;
  }

  // 3. Verifica se já está no cache em memória
  const cacheKey = clean.toLowerCase();
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  // 4. Executa a tradução automática via Google Translate GTX
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=pt&dt=t&q=${encodeURIComponent(clean)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
      signal: AbortSignal.timeout(2000),
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0]
          .map((item: any) => (Array.isArray(item) && item[0] ? item[0] : ""))
          .join("")
          .trim();

        if (translated) {
          // Capitaliza a primeira letra para manter padrão estético
          const formatted = translated.charAt(0).toUpperCase() + translated.slice(1);
          translationCache.set(cacheKey, formatted);
          return formatted;
        }
      }
    }
  } catch (err) {
    console.warn("[TRANSLATOR] Falha rápida na tradução automática, mantendo texto limpo:", err);
  }

  // Fallback: Armazena e retorna o texto limpo sem parênteses
  translationCache.set(cacheKey, clean);
  return clean;
}

/**
 * Traduz uma lista de objetos contendo a propriedade `name` em lote.
 */
export async function translateInterestsBatch<T extends { name: string }>(
  items: T[]
): Promise<T[]> {
  if (!Array.isArray(items) || items.length === 0) return items;

  const translatedItems = await Promise.all(
    items.map(async (item) => {
      const newName = await translateTextToPt(item.name);
      return {
        ...item,
        name: newName,
      };
    })
  );

  return translatedItems;
}
