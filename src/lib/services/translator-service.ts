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
      signal: AbortSignal.timeout(3000),
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0]
          .map((item: any) => (Array.isArray(item) && item[0] ? item[0] : ""))
          .join("")
          .trim();

        if (translated) {
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
 * Traduz uma lista de objetos contendo a propriedade `name` em lote em uma única requisição HTTP.
 */
export async function translateInterestsBatch<T extends { name: string }>(
  items: T[]
): Promise<T[]> {
  if (!Array.isArray(items) || items.length === 0) return items;

  // 1. Identifica nomes limpos não traduzidos
  const cleanNames = items.map((item) =>
    (item.name || "").replace(/\s*\([^)]*\)/g, "").trim()
  );

  const pendingIndices: number[] = [];
  const pendingNames: string[] = [];

  cleanNames.forEach((name, idx) => {
    if (name && !translationCache.has(name.toLowerCase())) {
      pendingIndices.push(idx);
      pendingNames.push(name);
    }
  });

  // 2. Se houver itens pendentes, traduz em 1 chamada batch via Google Translate
  if (pendingNames.length > 0) {
    try {
      const batchPayload = pendingNames.join("\n");
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=pt&dt=t&q=${encodeURIComponent(batchPayload)}`;
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        },
        signal: AbortSignal.timeout(3000),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && Array.isArray(data[0])) {
          const fullStr = data[0]
            .map((part: any) => (Array.isArray(part) && part[0] ? part[0] : ""))
            .join("");
          const lines = fullStr.split("\n");

          pendingNames.forEach((originalName, i) => {
            const rawTrans = lines[i] ? lines[i].trim() : originalName;
            const formatted = rawTrans
              ? rawTrans.charAt(0).toUpperCase() + rawTrans.slice(1)
              : originalName;
            translationCache.set(originalName.toLowerCase(), formatted);
          });
        }
      }
    } catch (err) {
      console.warn("[TRANSLATOR] Falha no batch translation, usando fallback limpo:", err);
    }
  }

  // 3. Mapeia o resultado final com cache pré-povoado
  return items.map((item, idx) => {
    const clean = cleanNames[idx];
    const cacheKey = clean.toLowerCase();
    const translatedName = translationCache.get(cacheKey) || clean || item.name;
    return {
      ...item,
      name: translatedName,
    };
  });
}
