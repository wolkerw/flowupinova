export type KnowledgeCategory =
  | "planos"
  | "contrato"
  | "promocoes"
  | "empresa"
  | "funcionalidades"
  | "novidades"
  | "suporte"
  | "duvidas"
  | "outros";

/** Em qual canal da Maia o tópico é usado. */
export type KnowledgeChannel = "ambos" | "whatsapp" | "instagram";

/** Para quem a informação é voltada (orienta o tom da resposta). */
export type KnowledgeAudience = "todos" | "lead" | "cliente";

/** Marcador de informação pendente: tópicos com ele não podem ser ativados. */
export const KNOWLEDGE_PENDING_MARKER = "[PREENCHER]";

/** Dias sem atualização a partir dos quais o painel alerta que o tópico pode estar desatualizado. */
export const KNOWLEDGE_STALE_DAYS = 60;

export interface WhatsAppKnowledgeTopic {
  id: string;
  category: KnowledgeCategory;
  title: string;
  content: string;
  isActive: boolean;
  order?: number;
  updatedAt: string;
  updatedBy?: string;
  /** Padrão: "ambos". */
  channel?: KnowledgeChannel;
  /** Padrão: "todos". */
  audience?: KnowledgeAudience;
  /** Data ISO (AAAA-MM-DD) a partir da qual o tópico deixa de ser usado pela Maia. */
  expiresAt?: string | null;
}

export interface WhatsAppKnowledgePayload {
  topics: WhatsAppKnowledgeTopic[];
}
