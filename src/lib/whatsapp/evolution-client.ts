/**
 * Cliente mínimo da Evolution API (instância de atendimento da Maia).
 *
 * A chave deve vir de EVOLUTION_API_KEY (Secret Manager / apphosting.yaml).
 * LEGACY_KEY existe só para não derrubar o atendimento enquanto o secret não é criado: essa chave
 * já está exposta no histórico do GitHub e precisa ser trocada no painel da Evolution. Depois de
 * criar o secret com a chave nova, remova LEGACY_KEY.
 */

const LEGACY_KEY = "8869f3644b0923bb1c982dc2a3c10241";

let warnedLegacyKey = false;

export function getEvolutionConfig() {
  const apiKey = process.env.EVOLUTION_API_KEY || LEGACY_KEY;
  if (!process.env.EVOLUTION_API_KEY && !warnedLegacyKey) {
    warnedLegacyKey = true;
    console.warn("[EVOLUTION] EVOLUTION_API_KEY não configurada; usando a chave legada exposta no código. Troque a chave e crie o secret.");
  }
  return {
    url: (process.env.EVOLUTION_API_URL || "https://evolution-api.flowupinova.com.br").replace(/\/+$/, ""),
    apiKey,
    instance: process.env.EVOLUTION_INSTANCE || "numvapt-atendimento",
  };
}

export async function evolutionPost<T = any>(endpoint: string, body: unknown = {}): Promise<T | null> {
  const { url, apiKey } = getEvolutionConfig();
  try {
    const res = await fetch(`${url}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: apiKey },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (!res.ok) {
      console.warn(`[EVOLUTION] ${endpoint} respondeu ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.error(`[EVOLUTION] Falha em ${endpoint}:`, err);
    return null;
  }
}

export interface EvolutionMessagesPage {
  records: any[];
  pages: number;
  currentPage: number;
}

/**
 * Busca uma página de mensagens de um JID (mais recentes primeiro na Evolution v2).
 * `before` (ISO) limita às mensagens anteriores a essa data; versões da Evolution que não aceitam
 * o filtro devolvem a página mais recente, e quem chama filtra pela data.
 */
export async function findEvolutionMessages(
  remoteJid: string,
  options: { before?: string | null; page?: number; pageSize?: number } = {}
): Promise<EvolutionMessagesPage> {
  const { instance } = getEvolutionConfig();
  const { before, page = 1, pageSize = 50 } = options;
  const where: Record<string, unknown> = { key: { remoteJid } };
  if (before) {
    where.messageTimestamp = { gte: "2000-01-01T00:00:00.000Z", lte: before };
  }
  const data = await evolutionPost<any>(`/chat/findMessages/${instance}`, {
    where,
    page,
    offset: pageSize,
  });
  const block = data?.messages ?? data;
  const records = Array.isArray(block?.records) ? block.records : Array.isArray(block) ? block : [];
  return {
    records,
    pages: Number(block?.pages) || 1,
    currentPage: Number(block?.currentPage) || page,
  };
}

export async function findEvolutionChats(): Promise<any[]> {
  const { instance } = getEvolutionConfig();
  const data = await evolutionPost<any>(`/chat/findChats/${instance}`);
  return Array.isArray(data) ? data : [];
}

export async function sendEvolutionText(number: string, text: string) {
  const { instance } = getEvolutionConfig();
  return evolutionPost(`/message/sendText/${instance}`, { number, text });
}

/** Baixa a mídia (ex.: áudio) de uma mensagem já recebida pela instância. */
export async function getEvolutionMediaBase64(
  messageKey: any
): Promise<{ base64: string; mimetype: string } | null> {
  if (!messageKey?.id) return null;
  const { instance } = getEvolutionConfig();
  const data = await evolutionPost<any>(`/chat/getBase64FromMediaMessage/${instance}`, {
    message: { key: messageKey },
    convertToMp4: false,
  });
  if (!data?.base64) return null;
  return { base64: String(data.base64), mimetype: String(data.mimetype || "audio/ogg") };
}
