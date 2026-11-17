import type { WhatsAppMessage } from "@/lib/types/whatsapp";
import { extractMessageContent } from "@/lib/whatsapp/evolution-message";

/** Mensagem da Evolution convertida para o formato do histórico, com a direção original. */
export interface EvolutionHistoryMessage extends WhatsAppMessage {
  fromMe: boolean;
}

export function evolutionRecordToMessage(rec: any): EvolutionHistoryMessage | null {
  const content = extractMessageContent(rec?.message);
  if (content.kind === "reaction" || content.kind === "system" || !content.displayText) return null;
  const fromMe = Boolean(rec?.key?.fromMe);
  const ts = Number(rec?.messageTimestamp);
  if (!Number.isFinite(ts) || ts <= 0) return null;
  return {
    id: `evo_${rec?.key?.id || rec?.id}`,
    // Mensagem enviada pelo número que não está no Firestore = enviada direto pelo celular/Evolution.
    role: fromMe ? "admin" : "user",
    text: content.displayText,
    timestamp: new Date(ts * 1000).toISOString(),
    senderName: fromMe ? "Enviada pelo WhatsApp" : rec?.pushName || "Cliente",
    fromMe,
  };
}

function compareKey(text: string): string {
  const t = (text || "").toLowerCase().replace(/\s+/g, " ").trim();
  const media = t.match(/^\[(áudio|imagem|vídeo|documento|figurinha|localização|contato)\]/);
  return media ? media[0] : t.slice(0, 120);
}

const SAME_MESSAGE_WINDOW_MS = 3 * 60 * 1000;

/**
 * Junta Firestore (fonte principal: tem o papel certo de Maia/atendente) com a Evolution
 * (pega mensagens enviadas pelo celular e conversas anteriores ao registro no Firestore),
 * sem duplicar a mesma mensagem que existe nas duas fontes.
 */
export function mergeHistory(
  firestoreMessages: WhatsAppMessage[],
  evolutionMessages: EvolutionHistoryMessage[]
): WhatsAppMessage[] {
  const result: WhatsAppMessage[] = [];
  const seenIds = new Set<string>();
  const index = new Map<string, number[]>();

  for (const m of firestoreMessages) {
    if (!m?.text?.trim() || seenIds.has(m.id)) continue;
    seenIds.add(m.id);
    result.push(m);
    const dir = m.role === "user" ? "in" : "out";
    const key = `${dir}|${compareKey(m.text)}`;
    const list = index.get(key) ?? [];
    list.push(new Date(m.timestamp).getTime());
    index.set(key, list);
  }

  for (const m of evolutionMessages) {
    if (seenIds.has(m.id)) continue;
    const key = `${m.fromMe ? "out" : "in"}|${compareKey(m.text)}`;
    const t = new Date(m.timestamp).getTime();
    const times = index.get(key);
    const matchAt = times?.findIndex((x) => Math.abs(x - t) <= SAME_MESSAGE_WINDOW_MS) ?? -1;
    if (times && matchAt >= 0) {
      times.splice(matchAt, 1); // cada registro do Firestore casa com no máximo um da Evolution
      continue;
    }
    seenIds.add(m.id);
    const { fromMe: _fromMe, ...message } = m;
    result.push(message);
  }

  return result.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

/**
 * Corta o histórico mesclado na data a partir da qual todas as fontes estão completas.
 * Uma fonte que devolveu a página cheia pode ter mensagens mais antigas que ainda não vieram;
 * mostrar além do limite dela criaria buracos na conversa.
 */
export function cutAtCompleteBoundary(
  merged: WhatsAppMessage[],
  sources: Array<{ full: boolean; oldest: string | null }>
): { messages: WhatsAppMessage[]; hasMore: boolean; oldest: string | null } {
  const limits = sources.filter((s) => s.full && s.oldest).map((s) => new Date(s.oldest as string).getTime());
  if (limits.length === 0) {
    return { messages: merged, hasMore: false, oldest: merged[0]?.timestamp ?? null };
  }
  const cutoff = Math.max(...limits);
  const messages = merged.filter((m) => new Date(m.timestamp).getTime() >= cutoff);
  return { messages, hasMore: true, oldest: new Date(cutoff).toISOString() };
}
