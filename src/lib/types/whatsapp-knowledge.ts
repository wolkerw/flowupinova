export interface WhatsAppKnowledgeTopic {
  id: string;
  category: "planos" | "contrato" | "promocoes" | "empresa" | "duvidas" | "outros";
  title: string;
  content: string;
  isActive: boolean;
  order?: number;
  updatedAt: string;
  updatedBy?: string;
}

export interface WhatsAppKnowledgePayload {
  topics: WhatsAppKnowledgeTopic[];
}
