/**
 * Peças comuns da Maia (WhatsApp e Instagram): montagem da conversa para o Gemini, chamada aos
 * modelos, saneamento da resposta e detecção de mensagens que não pedem resposta (reações).
 */

export interface MaiaHistoryMessage {
  role: "user" | "assistant" | "system" | "admin";
  text: string;
}

export type GeminiTurn = { role: "user" | "model"; parts: Array<{ text: string }> };

/** Quantas mensagens anteriores a Maia recebe como contexto. */
export const MAIA_HISTORY_LIMIT = 12;

export const SIGNUP_URL = "https://numvapt.com/acesso/cadastro";

export const MAIA_MODELS: Array<{ name: string; thinkingBudget?: number }> = [
  { name: "gemini-2.5-flash", thinkingBudget: 1024 },
  { name: "gemini-3.5-flash" },
  { name: "gemini-flash-latest" },
];

/** Repetido no fim da instrução: com uma base de conhecimento longa, o modelo segue melhor o que vem por último. */
export const MAIA_FINAL_REMINDER = `

# LEMBRETE FINAL
Use a base de conhecimento acima apenas para consultar o que for preciso. Responda só o que o cliente perguntou agora, em poucas frases, sem acrescentar preços, links ou recursos que ele não pediu e sem se reapresentar ou mandar boas-vindas quando ele fez uma pergunta.`;

export function readCandidateText(resData: any): string {
  const parts: any[] = resData?.candidates?.[0]?.content?.parts ?? [];
  return parts
    .filter((p) => typeof p?.text === "string" && !p.thought)
    .map((p) => p.text)
    .join("")
    .trim();
}

function formatHistoryTurn(msg: MaiaHistoryMessage): { role: "user" | "model"; text: string } | null {
  const text = (msg.text || "").trim();
  if (!text) return null;
  if (msg.role === "assistant") return { role: "model", text };
  if (msg.role === "admin") return { role: "model", text: `[Atendente humano da NumVapt]: ${text}` };
  if (msg.role === "user") return { role: "user", text };
  return null;
}

/**
 * Monta os turnos para o Gemini: histórico já respondido + bloco com as mensagens novas.
 * Turnos seguidos do mesmo papel são juntados (o Gemini espera alternância user/model).
 */
export function buildConversationContents<T extends MaiaHistoryMessage>(
  history: T[],
  pending: string[],
  senderName: string
): GeminiTurn[] {
  const turns: Array<{ role: "user" | "model"; text: string }> = [];

  for (const msg of history.slice(-MAIA_HISTORY_LIMIT)) {
    const turn = formatHistoryTurn(msg);
    if (!turn) continue;
    // Blindagem anti-contaminação: não reaproveita respostas antigas com preço/link inventado
    if (turn.role === "model" && /79[,.]90|79 reais|\/planos/i.test(turn.text)) continue;
    turns.push(turn);
  }

  const cleanPending = pending.map((p) => p.trim()).filter(Boolean);
  const pendingText =
    cleanPending.length > 1
      ? `Mensagens novas de ${senderName} (responda todas de uma vez):\n${cleanPending.map((p, i) => `${i + 1}. ${p}`).join("\n")}`
      : `Mensagem nova de ${senderName}: ${cleanPending[0] ?? ""}`;
  turns.push({ role: "user", text: pendingText });

  const merged: GeminiTurn[] = [];
  for (const t of turns) {
    const last = merged[merged.length - 1];
    if (last && last.role === t.role) {
      last.parts[0].text += `\n${t.text}`;
    } else {
      merged.push({ role: t.role, parts: [{ text: t.text }] });
    }
  }
  // O Gemini exige que a conversa comece pelo usuário
  while (merged.length && merged[0].role === "model") merged.shift();
  return merged;
}

/** Corrige links e preços inventados na resposta da Maia. */
export function sanitizeMaiaReply(replyText: string, logTag = "MAIA"): string {
  let text = replyText
    .replace(/https?:\/\/[^\s]*\/planos\b/gi, SIGNUP_URL)
    // numvapt.com.br está fora do ar (sem DNS/certificado): troca pelo domínio que funciona.
    .replace(/https?:\/\/(?:www\.)?numvapt\.com\.br/gi, "https://numvapt.com");

  const invalidPrice = /R\$\s*(?:79|89|97|99|149|199|299)(?:[,.]\d{2})?(?:\/mês|\s*por\s*mês)?(?!\d)/gi;
  if (invalidPrice.test(text) || /79[,.]90|79 reais/i.test(text)) {
    console.warn(`[${logTag}_GUARDRAIL] Preço incorreto detectado e retificado para R$ 490,00/mês.`);
    text = text
      .replace(invalidPrice, "R$ 490,00/mês")
      .replace(/R\$\s*79[,.]90(\/mês)?/gi, "R$ 490,00/mês")
      .replace(/79\s*reais(\s*por\s*mês)?/gi, "R$ 490,00/mês");
  }
  return text.trim();
}

/**
 * Chama os modelos em ordem até um devolver JSON com replyText. Devolve null se todos falharem.
 */
export async function callMaiaModel<T extends { replyText: string; needsHumanSupport?: boolean }>(params: {
  apiKey: string;
  systemInstruction: string;
  contents: GeminiTurn[];
  logTag: string;
}): Promise<T | null> {
  const { apiKey, systemInstruction, contents, logTag } = params;

  for (const model of MAIA_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model.name}:generateContent?key=${apiKey}`;
      const generationConfig: Record<string, unknown> = {
        temperature: 0.3,
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
      };
      if (model.thinkingBudget !== undefined) {
        generationConfig.thinkingConfig = { thinkingBudget: model.thinkingBudget };
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents,
          generationConfig,
        }),
      });

      if (!response.ok) {
        throw new Error(`Status ${response.status}: ${await response.text()}`);
      }

      const rawText = readCandidateText(await response.json());
      if (!rawText) throw new Error("Resposta vazia do Gemini.");

      const cleaned = rawText.replace(/^\s*```(json)?/i, "").replace(/```\s*$/i, "").trim();
      const parsed = JSON.parse(cleaned) as T;
      if (!parsed || typeof parsed.replyText !== "string" || !parsed.replyText.trim()) {
        throw new Error("JSON sem replyText.");
      }

      parsed.replyText = sanitizeMaiaReply(parsed.replyText, logTag);
      parsed.needsHumanSupport = Boolean(parsed.needsHumanSupport);
      return parsed;
    } catch (err: any) {
      console.warn(`[${logTag}] Falha com modelo ${model.name}:`, err?.message || err);
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Mensagens que não pedem resposta
// ---------------------------------------------------------------------------

/** Emojis, modificadores, pontuação e espaços. */
const EMOJI_OR_PUNCT = /[\p{Extended_Pictographic}\p{Emoji_Modifier}\u{1F1E6}-\u{1F1FF}⃣‍️\s\p{P}\p{S}]/gu;

/** True quando a mensagem é só emoji (❤️, 🔥🔥, 👏👏👏) ou pontuação. */
export function isEmojiOnly(text: string): boolean {
  const t = (text || "").trim();
  if (!t) return false;
  return t.replace(EMOJI_OR_PUNCT, "").length === 0;
}

/** Elogios e reações curtas típicas de comentário em post, reel ou story. */
const REACTION_WORDS =
  /^(top+|lind[oa]s?|amei+|show+|massa|perfeit[oa]|demais|incr[ií]vel|maravilhos[oa]|parab[ée]ns|sensacional|que lindo|que top|muito bom|muito boa|arrasou|uau+|wow+|k{3,}|(ha){2,}h?|rs+|hehe+|❤|👏)$/i;

/** True para reação curta sem pergunta ("top", "amei", "kkkk", "parabéns!"). */
export function isShortReaction(text: string): boolean {
  const t = (text || "").trim();
  if (!t || t.length > 30 || t.includes("?")) return false;
  const words = t
    .replace(EMOJI_OR_PUNCT, " ")
    .trim()
    .toLowerCase();
  if (!words) return true;
  return REACTION_WORDS.test(words);
}
