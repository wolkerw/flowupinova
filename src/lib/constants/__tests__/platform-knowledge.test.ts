import { describe, it, expect } from "vitest";
import { PLATFORM_KNOWLEDGE_BASE } from "../platform-knowledge";

describe("PLATFORM_KNOWLEDGE_BASE", () => {
  it("deve conter as seções essenciais e rotas da plataforma NumVapt", () => {
    expect(PLATFORM_KNOWLEDGE_BASE).toBeDefined();
    expect(PLATFORM_KNOWLEDGE_BASE.length).toBeGreaterThan(500);

    // Rotas essenciais
    expect(PLATFORM_KNOWLEDGE_BASE).toContain("/dashboard");
    expect(PLATFORM_KNOWLEDGE_BASE).toContain("/dashboard/posts");
    expect(PLATFORM_KNOWLEDGE_BASE).toContain("/dashboard/aprovacoes");
    expect(PLATFORM_KNOWLEDGE_BASE).toContain("/dashboard/galeria");
    expect(PLATFORM_KNOWLEDGE_BASE).toContain("/dashboard/configuracoes");
    expect(PLATFORM_KNOWLEDGE_BASE).toContain("/dashboard/avatar");
    expect(PLATFORM_KNOWLEDGE_BASE).toContain("/dashboard/minha-conta");

    // Recursos cruciais
    expect(PLATFORM_KNOWLEDGE_BASE).toContain("Editor GPT");
    expect(PLATFORM_KNOWLEDGE_BASE).toContain("Editor Manual");
    expect(PLATFORM_KNOWLEDGE_BASE).toContain("Identidade Visual");
    expect(PLATFORM_KNOWLEDGE_BASE).toContain("Personas do Negócio");
    expect(PLATFORM_KNOWLEDGE_BASE).toContain("Extrator de Brand Book");
    expect(PLATFORM_KNOWLEDGE_BASE).toContain("Central de Aprovações");
  });

  it("deve conter as diretrizes de suporte e formatação com links markdown", () => {
    expect(PLATFORM_KNOWLEDGE_BASE).toContain("DIRETRIZES DE SUPORTE E ATENDIMENTO PARA O VAPTI");
    expect(PLATFORM_KNOWLEDGE_BASE).toContain("link clicável em markdown");
    expect(PLATFORM_KNOWLEDGE_BASE).toContain("Para post manual: Oriente o usuário a acessar a aba");
    expect(PLATFORM_KNOWLEDGE_BASE).toContain("[Posts](/dashboard/posts)");
  });
});
