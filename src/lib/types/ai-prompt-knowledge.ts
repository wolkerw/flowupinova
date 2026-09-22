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
