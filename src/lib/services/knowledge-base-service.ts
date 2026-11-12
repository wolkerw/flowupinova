import { adminDb } from "@/lib/firebase-admin";
import { getPlatformKnowledgeForChannel } from "@/lib/constants/platform-knowledge";
import { DEFAULT_KNOWLEDGE_TOPICS } from "@/lib/constants/knowledge-defaults";
import {
  KNOWLEDGE_PENDING_MARKER,
  type WhatsAppKnowledgeTopic,
} from "@/lib/types/whatsapp-knowledge";

export type ExternalChannel = "whatsapp" | "instagram";

export const KNOWLEDGE_COLLECTION = "whatsapp_knowledge_base";

const AUDIENCE_LABEL: Record<string, string> = {
  lead: " (PÚBLICO: quem ainda não é cliente)",
  cliente: " (PÚBLICO: clientes que já assinam)",
};

/**
 * Lê os tópicos da Central de Informações no Firestore.
 * Usa get() simples (sem where/orderBy) para nunca depender de índice composto.
 * Retorna null em caso de falha de leitura.
 */
export async function loadKnowledgeTopics(): Promise<WhatsAppKnowledgeTopic[] | null> {
  try {
    const snap = await adminDb.collection(KNOWLEDGE_COLLECTION).get();
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }) as WhatsAppKnowledgeTopic);
  } catch (err) {
    console.warn("[KNOWLEDGE_BASE] Falha ao carregar a central do Firestore:", err);
    return null;
  }
}

/** Data de validade já passou? (expiresAt é inclusivo: vale até o fim do dia informado) */
export function isTopicExpired(topic: Pick<WhatsAppKnowledgeTopic, "expiresAt">, now = new Date()): boolean {
  if (!topic.expiresAt) return false;
  const end = new Date(`${topic.expiresAt.slice(0, 10)}T23:59:59.999-03:00`);
  return !Number.isNaN(end.getTime()) && now.getTime() > end.getTime();
}

/** Tópicos que a Maia pode usar neste canal agora: ativos, do canal, dentro da validade e sem pendências. */
export function selectTopicsForChannel(
  topics: WhatsAppKnowledgeTopic[],
  channel: ExternalChannel,
  now = new Date()
): WhatsAppKnowledgeTopic[] {
  return topics
    .filter((t) => t.isActive !== false)
    .filter((t) => !t.channel || t.channel === "ambos" || t.channel === channel)
    .filter((t) => !isTopicExpired(t, now))
    .filter((t) => !(t.content || "").includes(KNOWLEDGE_PENDING_MARKER))
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
}

export function formatTopicsForPrompt(topics: WhatsAppKnowledgeTopic[]): string {
  return topics
    .map((t) => `### ${(t.title || "").toUpperCase()}${AUDIENCE_LABEL[t.audience || ""] || ""}\n${t.content}`)
    .join("\n\n");
}

/**
 * Remove do conhecimento da plataforma os detalhes técnicos internos que não devem
 * chegar a leads e clientes nos canais externos (WhatsApp e Instagram Direct):
 * códigos internos de regras (ex: /handlock, /typolayout), nomes de modelos de IA,
 * e linhas que descrevem custo/arquitetura (LLM, Fabric.js, Firestore etc.).
 */
const INTERNAL_LINE_PATTERNS = [
  /gemini-[\w.-]+/i,
  /gpt-image/i,
  /\bLLM\b/,
  /fabric\.js/i,
  /firestore/i,
  /\bprompt(s)?\b/i,
  /modelo de imagem/i,
  /chamada(s)? de (texto|imagem)/i,
  /\b\d+\s*cr[ée]dito/i,
  /thinking/i,
];

// "/handlock", "(/typolayout + /fontlock)": tokens de um só segmento após espaço ou "("
const INTERNAL_CODE_GROUP = /\s*\((?:\s*\/[a-z][a-z0-9-]*\s*(?:[+,]|\be\b)?\s*)+\)/g;
const INTERNAL_CODE_TOKEN = /(^|[\s(])\/(?!dashboard\b|acesso\b|admin\b|api\b)[a-z][a-z0-9-]*(?=[\s),.:*]|$)/gim;

export function sanitizeKnowledgeForExternalChannel(text: string): string {
  return text
    .split("\n")
    .filter((line) => !INTERNAL_LINE_PATTERNS.some((re) => re.test(line)))
    .map((line) =>
      line
        .replace(INTERNAL_CODE_GROUP, "")
        .replace(INTERNAL_CODE_TOKEN, "$1")
        .replace(/`([^`]*)`/g, "$1")
        .replace(/\*\*\s*\*\*/g, "")
        .replace(/\s+\*\*(?=[:,.])/g, "**")
        .replace(/[ \t]{2,}/g, " ")
        .replace(/\s+([:,.])/g, "$1")
    )
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}

export interface ChannelKnowledge {
  /** Conhecimento geral da plataforma, já sem detalhes técnicos internos. */
  platformKnowledge: string;
  /** Tópicos da Central de Informações selecionados para o canal, já formatados. */
  centralKnowledge: string;
}

/**
 * Monta o conhecimento que a Maia usa em um canal externo.
 * Se o Firestore estiver vazio, sem tópicos válidos ou indisponível, usa os tópicos padrão.
 */
export async function buildChannelKnowledge(
  channel: ExternalChannel,
  now = new Date()
): Promise<ChannelKnowledge> {
  const stored = await loadKnowledgeTopics();
  let selected = stored && stored.length > 0 ? selectTopicsForChannel(stored, channel, now) : [];
  if (selected.length === 0) {
    selected = selectTopicsForChannel(DEFAULT_KNOWLEDGE_TOPICS, channel, now);
  }

  return {
    platformKnowledge: sanitizeKnowledgeForExternalChannel(getPlatformKnowledgeForChannel(channel)),
    centralKnowledge: formatTopicsForPrompt(selected),
  };
}

export const CENTRAL_KNOWLEDGE_HEADER =
  "\n\n# CENTRAL DE CONHECIMENTO OFICIAL (FONTE DA VERDADE SUPREMA E ATUALIZADA - PRIORIDADE MÁXIMA):\n" +
  "ATENÇÃO: As informações desta seção foram cadastradas no painel do administrador e têm PREVALÊNCIA TOTAL E SOBERANA sobre qualquer valor padrão pré-definido.\n" +
  "Tópicos marcados com PÚBLICO indicam para quem a informação foi escrita: use os de 'quem ainda não é cliente' em conversas de venda e os de 'clientes que já assinam' em dúvidas de uso.\n\n";
