import { describe, it, expect } from "vitest";
import {
  PLATFORM_KNOWLEDGE_BASE,
  getPlatformKnowledgeForChannel,
} from "../platform-knowledge";

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
    expect(PLATFORM_KNOWLEDGE_BASE).toContain("DIRETRIZES DE SUPORTE E TUTOR PASSO A PASSO PARA O VAPTI");
    expect(PLATFORM_KNOWLEDGE_BASE).toContain("Links Clicáveis em Markdown");
    expect(PLATFORM_KNOWLEDGE_BASE).toContain("Para post manual: SEMPRE direcione para a aba");
    expect(PLATFORM_KNOWLEDGE_BASE).toContain("[Posts](/dashboard/posts)");
  });

  it("deve conter o roteiro de etapas até a publicação final", () => {
    expect(PLATFORM_KNOWLEDGE_BASE).toContain("ROTEIRO PASSO A PASSO ATÉ A PUBLICAÇÃO FINAL");
    expect(PLATFORM_KNOWLEDGE_BASE).toContain("Etapa 1: Acessar a tela de Posts");
    expect(PLATFORM_KNOWLEDGE_BASE).toContain("Etapa 2: Adicionar e Editar a Mídia");
    expect(PLATFORM_KNOWLEDGE_BASE).toContain("Etapa 3: Redigir a Legenda e Hashtags");
    expect(PLATFORM_KNOWLEDGE_BASE).toContain("Etapa 4: Selecionar as Redes Sociais");
    expect(PLATFORM_KNOWLEDGE_BASE).toContain("Etapa 5: Publicar ou Agendar");
  });

  it("deve conter os guias passo a passo de configuração do Cérebro do Negócio e dos 5 fluxos de posts", () => {
    // Guia Cérebro do Negócio
    expect(PLATFORM_KNOWLEDGE_BASE).toContain("GUIA PASSO A PASSO: COMO CONFIGURAR O CÉREBRO DO NEGÓCIO");
    expect(PLATFORM_KNOWLEDGE_BASE).toContain("Índice de Inteligência da Marca");
    expect(PLATFORM_KNOWLEDGE_BASE).toContain("Regra de Ouro para Produtos");
    expect(PLATFORM_KNOWLEDGE_BASE).toContain("Diretrizes Visuais para Geração de Fotos");

    // Guia dos 5 fluxos
    expect(PLATFORM_KNOWLEDGE_BASE).toContain("GUIA PASSO A PASSO: COMO CRIAR POSTS NOS 5 FLUXOS");
    expect(PLATFORM_KNOWLEDGE_BASE).toContain("Fluxo Conceito");
    expect(PLATFORM_KNOWLEDGE_BASE).toContain("Fluxo Produto");
    expect(PLATFORM_KNOWLEDGE_BASE).toContain("Fluxo Pessoa + Cenário");
    expect(PLATFORM_KNOWLEDGE_BASE).toContain("Fluxo Manual");
    expect(PLATFORM_KNOWLEDGE_BASE).toContain("Fluxo Geral");
  });

  describe("getPlatformKnowledgeForChannel", () => {
    it("retorna a base original intacta para o canal 'web'", () => {
      const webKb = getPlatformKnowledgeForChannel("web");
      expect(webKb).toBe(PLATFORM_KNOWLEDGE_BASE);
      expect(webKb).toContain("[Posts](/dashboard/posts)");
    });

    it("adapta links para URLs absolutas e negrito nativo para o canal 'whatsapp'", () => {
      const waKb = getPlatformKnowledgeForChannel("whatsapp");
      expect(waKb).toContain("https://numvapt.com.br/dashboard/posts");
      expect(waKb).toContain("https://numvapt.com.br/dashboard/configuracoes");
      expect(waKb).toContain("DIRETRIZES ESPECÍFICAS DE ATENDIMENTO PARA WHATSAPP (MAIA)");
      expect(waKb).toContain("GUIA PASSO A PASSO: COMO CONFIGURAR O CÉREBRO DO NEGÓCIO");
      expect(waKb).toContain("ROTEIRO PASSO A PASSO ATÉ A PUBLICAÇÃO FINAL");
      // Não deve conter links relativos soltos
      expect(waKb).not.toContain("](/dashboard/posts)");
    });

    it("adapta links para URLs absolutas para o canal 'instagram'", () => {
      const igKb = getPlatformKnowledgeForChannel("instagram");
      expect(igKb).toContain("https://numvapt.com.br/dashboard/posts");
      expect(igKb).toContain("https://numvapt.com.br/dashboard/configuracoes");
      expect(igKb).toContain("DIRETRIZES ESPECÍFICAS DE ATENDIMENTO PARA INSTAGRAM DIRECT (MAIA)");
      expect(igKb).toContain("GUIA PASSO A PASSO: COMO CONFIGURAR O CÉREBRO DO NEGÓCIO");
      expect(igKb).toContain("ROTEIRO PASSO A PASSO ATÉ A PUBLICAÇÃO FINAL");
      expect(igKb).not.toContain("](/dashboard/posts)");
    });
  });
});
