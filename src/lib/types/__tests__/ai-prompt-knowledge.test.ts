import { describe, it, expect } from "vitest";
import {
  PROMPT_DEFAULT_CATEGORIES,
  type AIPromptKnowledgeItem,
  type AIPromptTargetUse,
} from "../ai-prompt-knowledge";

describe("ai-prompt-knowledge types & contracts", () => {
  it("contém categorias padrão para os principais segmentos de mercado", () => {
    expect(PROMPT_DEFAULT_CATEGORIES).toContain("Gastronomia & Alimentos");
    expect(PROMPT_DEFAULT_CATEGORIES).toContain("Moda & Vestuário");
    expect(PROMPT_DEFAULT_CATEGORIES).toContain("Produtos & E-commerce");
    expect(PROMPT_DEFAULT_CATEGORIES.length).toBeGreaterThanOrEqual(8);
  });

  it("permite construir um item válido com seccionamento técnico", () => {
    const item: AIPromptKnowledgeItem = {
      id: "prompt_123",
      title: "Hambúrguer Artesanal Rústico",
      category: "Gastronomia & Alimentos",
      targetUse: "product_photo",
      rawPrompt: "Close-up de hambúrguer suculento com fumaça e queijo derretendo...",
      sections: {
        subjectTemplate: "{{produto}} suculento com queijo derretendo",
        environment: "Mesa de madeira rústica com fumaça ao fundo",
        lighting: "Luz lateral quente, rim light sutil",
        cameraAndLens: "85mm f/1.8 macro",
        composition: "Close-up 45 graus",
        styleAndMood: "Fotografia gastronômica comercial",
        negativeRules: "Sem textos borrados ou saturação excessiva",
      },
      triggerKeywords: ["hambúrguer", "burger", "lanche", "artesanal"],
      semanticSummary: "Fotografia profissional de hambúrguer para anúncios gastronômicos",
      active: true,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(item.id).toBe("prompt_123");
    expect(item.sections.subjectTemplate).toContain("{{produto}}");
    expect(item.triggerKeywords).toContain("hambúrguer");
  });
});
