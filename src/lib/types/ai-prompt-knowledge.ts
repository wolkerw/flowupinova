export type AIPromptTargetUse =
  | "product_photo"
  | "infographic"
  | "lifestyle"
  | "general";

export interface AIPromptSections {
  subjectTemplate: string;
  environment: string;
  lighting: string;
  cameraAndLens: string;
  composition: string;
  styleAndMood: string;
  negativeRules?: string;
}

export interface AIPromptKnowledgeItem {
  id: string;
  title: string;
  category: string;
  targetUse: AIPromptTargetUse;
  rawPrompt: string;
  sections: AIPromptSections;
  triggerKeywords: string[];
  semanticSummary: string;
  printImageUrl?: string;
  active: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface TranscribePromptPrintResponse {
  success: boolean;
  transcription: {
    title: string;
    category: string;
    targetUse: AIPromptTargetUse;
    rawPrompt: string;
    sections: AIPromptSections;
    triggerKeywords: string[];
    semanticSummary: string;
  };
  printImageUrl?: string;
}

export const PROMPT_DEFAULT_CATEGORIES = [
  "Gastronomia & Alimentos",
  "Moda & Vestuário",
  "Beleza & Cosméticos",
  "Produtos & E-commerce",
  "Serviços Locais & Negócios",
  "Imobiliário & Interiores",
  "Saúde & Bem-estar",
  "Tecnologia & Infoprodutos",
  "Promoções & Varejo",
  "Outros",
] as const;

export type PromptCategory = typeof PROMPT_DEFAULT_CATEGORIES[number] | string;

export interface AIStyleCommand {
  id: string;
  command: string; // Ex: "/bokeh"
  label: string; // Ex: "Luzes Desfocadas"
  description: string; // Ex: "Cria luzes desfocadas e profundidade de campo suave ao fundo"
  category: string; // Ex: "Iluminação", "Câmera & Lentes", "Pessoas & Retrato", "Edição & Fundo", "Atmosfera"
  iconEmoji?: string;
  promptInjection: string; // Diretivas técnicas de prompt injetadas na IA
  negativePromptInjection?: string;
  triggerKeywords: string[]; // Termos em linguagem natural para matching semântico
  active: boolean;
  order: number;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}
