import { describe, it, expect } from "vitest";
import {
  normalizeSearchTerm,
  findBestMatchingPrompt,
  enrichPromptWithKnowledge,
} from "../prompt-knowledge-service";
import type { AIPromptKnowledgeItem } from "@/lib/types/ai-prompt-knowledge";

describe("prompt-knowledge-service", () => {
  const mockPrompts: AIPromptKnowledgeItem[] = [
    {
      id: "p1",
      title: "Hambúrguer Gourmet com Fumaça",
      category: "Gastronomia & Alimentos",
      targetUse: "product_photo",
      rawPrompt: "Fotografia de hambúrguer suculento...",
      sections: {
        subjectTemplate: "{{produto}} suculento com fatias de queijo",
        environment: "Mesa rústica de carvalho escuro com fumaça difusa",
        lighting: "Luz lateral dramática com softbox 45 graus",
        cameraAndLens: "Lente 85mm f/1.4 com foco nítido",
        composition: "Close-up em ângulo levemente inclinado",
        styleAndMood: "Publicitário comercial de alta gastronomia",
      },
      triggerKeywords: ["hambúrguer", "burger", "lanche artesanal", "cheeseburger"],
      semanticSummary: "Fotografia comercial de hambúrguer artesanal para cardápios e anúncios",
      active: true,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "p2",
      title: "Frasco de Perfume Minimalista",
      category: "Beleza & Cosméticos",
      targetUse: "product_photo",
      rawPrompt: "Perfume sobre base de mármore...",
      sections: {
        subjectTemplate: "{{produto}} elegante sobre pedestal",
        environment: "Fundo clean com água cristalina e reflexos",
        lighting: "Luz difusa de estúdio com alto brilho",
        cameraAndLens: "100mm Macro f/2.8",
        composition: "Centralizado com reflexo espelhado",
        styleAndMood: "Luxo sofisticado",
      },
      triggerKeywords: ["perfume", "cosmético", "frasco", "creme"],
      semanticSummary: "Fotografia de luxo de frascos de cosméticos e perfumes",
      active: true,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  it("normaliza termos de busca removendo acentos e pontuações", () => {
    expect(normalizeSearchTerm("Hambúrguer Artesanal!!")).toBe("hamburguer artesanal");
    expect(normalizeSearchTerm("Café Gourmet com Pão")).toBe("cafe gourmet com pao");
  });

  it("encontra o prompt correto de gastronomia para frase simples de hambúrguer", () => {
    const userBrief = "Quero uma foto bem bonita de um hambúrguer duplo com cheddar";
    const match = findBestMatchingPrompt(userBrief, mockPrompts);

    expect(match).not.toBeNull();
    expect(match?.item.id).toBe("p1");
    expect(match?.item.title).toBe("Hambúrguer Gourmet com Fumaça");
    expect(match?.score).toBeGreaterThanOrEqual(2);
  });

  it("encontra o prompt correto de cosméticos para frase de perfume", () => {
    const userBrief = "Foto de lançamento de um perfume feminino elegante";
    const match = findBestMatchingPrompt(userBrief, mockPrompts);

    expect(match).not.toBeNull();
    expect(match?.item.id).toBe("p2");
    expect(match?.item.title).toBe("Frasco de Perfume Minimalista");
  });

  it("retorna null se a frase não tiver relação com nenhum prompt cadastrado", () => {
    const userBrief = "Um astronauta andando de skate em marte";
    const match = findBestMatchingPrompt(userBrief, mockPrompts);

    expect(match).toBeNull();
  });

  it("enriquece a frase simples com as diretrizes técnicas do prompt mestre", () => {
    const userBrief = "Foto de hambúrguer artesanal da minha hamburgueria";
    const matched = mockPrompts[0];

    const result = enrichPromptWithKnowledge(userBrief, matched);

    expect(result.matchedPromptTitle).toBe("Hambúrguer Gourmet com Fumaça");
    expect(result.enrichedBrief).toContain(userBrief);
    expect(result.enrichedBrief).toContain("Luz lateral dramática com softbox 45 graus");
    expect(result.enrichedBrief).toContain("Lente 85mm f/1.4");
  });
});
