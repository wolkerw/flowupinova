/**
 * Utilitário de Correção Ortográfica e Gramatical de Títulos Comerciais (pt-BR)
 * Garante que títulos e frases digitados pelo usuário para impressão na imagem
 * sejam corrigidos gramaticalmente, com acentuação impecável e alto apelo publicitário.
 */

export async function correctPortugueseHeadline(rawHeadline: string): Promise<string> {
  if (!rawHeadline || typeof rawHeadline !== "string") {
    return "";
  }

  const trimmed = rawHeadline.trim();
  if (trimmed.length < 3) {
    return trimmed;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return trimmed;
  }

  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const systemInstruction = `Você é um revisor ortográfico, gramatical e redator publicitário sênior especializado em Português do Brasil (pt-BR).
Sua missão única é corrigir ortografia, concordância e acentuação (ex: 'pratico' -> 'prático', 'voce' -> 'você', 'promocao' -> 'promoção', 'edicao' -> 'edição', 'otimo' -> 'ótimo', 'saude' -> 'saúde') do título ou frase comercial informado pelo usuário.
REGRAS:
1. Mantenha 100% da mensagem original e termos de marca/nomes próprios.
2. Não altere o sentido comercial, apenas corrija erros de digitação, gramática e acentos.
3. Se o texto estiver em CAIXA ALTA, mantenha em CAIXA ALTA com acentos corretos (ex: "EDICAO LIMITADA" -> "EDIÇÃO LIMITADA").
4. Responda APENAS o texto corrigido, sem aspas, sem explicações adicionais e sem quebras de linha extras.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        contents: [
          {
            parts: [{ text: `Título comercial para revisar e corrigir: "${trimmed}"` }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 120,
        },
      }),
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const corrected = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (corrected && corrected.length > 0) {
        // Remover eventuais aspas externas retornadas pela IA
        return corrected.replace(/^["'`]+|["'`]+$/g, "").trim();
      }
    }
  } catch (err) {
    console.warn("[HEADLINE_CORRECTOR] Falha ao corrigir título com Gemini, usando original:", err);
  }

  return trimmed;
}
