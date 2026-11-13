import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  POST,
  buildStructuredTrendFallback,
  buildStructuredTrendAIPrompt,
} from "../route";

describe("Trends API - POST /api/trends (Estruturação com IA)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("buildStructuredTrendFallback gera um micro-briefing visual com resumo da notícia e headline", () => {
    const fallback = buildStructuredTrendFallback({
      trendTitle: "Mercado Imobiliário tem alta histórica",
      newsTitle: "Venda de imóveis cresce 20% no Brasil",
      source: "Valor Econômico",
      companyNiche: "Corretor de Imóveis de Luxo",
      companyName: "Prime Imóveis",
    });

    expect(fallback.headline).toContain("Venda de imóveis");
    expect(fallback.headline).toContain("Mercado Imobiliário tem alta histórica");
    expect(fallback.headline).not.toContain("…");
    expect(fallback.newsSummary).toBeDefined();
    expect(fallback.newsSummary).toContain("Venda de imóveis cresce 20% no Brasil");
    expect(fallback.visualPrompt.length).toBeGreaterThan(50);
    expect(fallback.visualPrompt).toContain("Corretor de Imóveis de Luxo");
    expect(fallback.fullBrief).toContain("[Cena Visual]:");
    expect(fallback.fullBrief).toContain("[Head Relevante da Arte]:");
    expect(fallback.fullBrief).not.toContain("Fonte:");
    expect(fallback.fullBrief).toContain("Prime Imóveis");
    expect(fallback.visualPrompt).not.toContain("8k");
    expect(fallback.visualPrompt).not.toContain("0,5k");
    expect(fallback.fullBrief).not.toContain("8k");
    expect(fallback.fullBrief).not.toContain("0,5k");
    expect(["INFOGRAPHIC", "TITLE_ONLY"]).toContain(fallback.suggestedOverlay);
  });

  it("buildStructuredTrendAIPrompt inclui os parâmetros, resumo e diretrizes no prompt do Gemini", () => {
    const prompt = buildStructuredTrendAIPrompt({
      trendTitle: "Nova IA para Marketing",
      newsTitle: "Lançamento de nova ferramenta revoluciona campanhas",
      newsSnippet: "Nova tecnologia promete reduzir custos e otimizar tempo de equipes de marketing.",
      source: "TechNews",
      companyNiche: "Agência Digital",
      companyName: "FlowAgência",
    });

    expect(prompt).toContain('DADOS JORNALÍSTICOS EM TEMPO REAL APURADOS SOBRE "Nova IA para Marketing":');
    expect(prompt).toContain('Manchete: "Lançamento de nova ferramenta revoluciona campanhas"');
    expect(prompt).toContain('Nova tecnologia promete reduzir custos');
    expect(prompt).toContain('Nicho do negócio: "Agência Digital"');
    expect(prompt).toContain('Nome da empresa: "FlowAgência"');
    expect(prompt).toContain('"newsSummary"');
    expect(prompt).toContain('"visualPrompt"');
    expect(prompt).toContain('"headline"');
    expect(prompt).toContain('"fullBrief"');
  });

  it("retorna 400 quando o título da tendência não é fornecido", async () => {
    const req = new NextRequest("http://localhost:9002/api/trends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  it("retorna proposta estruturada com sucesso via fallback determinístico quando GEMINI_API_KEY não estiver setada", async () => {
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    try {
      const req = new NextRequest("http://localhost:9002/api/trends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trendTitle: "Inteligência Artificial no Varejo",
          newsTitle: "Varejistas aumentam vendas com IA",
          source: "Exame",
          companyNiche: "Supermercados",
          companyName: "Rede Max",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.headline).toBeDefined();
      expect(data.visualPrompt).toBeDefined();
      expect(data.fullBrief).toContain("Varejistas aumentam vendas com IA");
      expect(data.fullBrief).toContain("Supermercados");
      expect(["INFOGRAPHIC", "TITLE_ONLY"]).toContain(data.suggestedOverlay);
    } finally {
      process.env.GEMINI_API_KEY = originalKey;
    }
  });

  it("chama Gemini 2.5 Flash quando a chave estiver presente e parseia a resposta JSON", async () => {
    process.env.GEMINI_API_KEY = "dummy-test-key";

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("generativelanguage.googleapis.com")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        newsSummary: "Varejistas aumentam vendas com IA ao automatizar campanhas.",
                        headline: "IA no Varejo: 3 Segredos para Vender Mais",
                        visualPrompt: "Cena moderna de cliente usando aplicativo inteligente no caixa...",
                        fullBrief: "Fotografia editorial de supermercado moderno com IA...",
                        suggestedOverlay: "INFOGRAPHIC",
                      }),
                    },
                  ],
                },
              },
            ],
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        text: async () => `
          <rss><channel>
            <item>
              <title>Varejistas aumentam vendas com IA - Exame</title>
              <source url="https://exame.com">Exame</source>
              <link>https://exame.com/noticia</link>
            </item>
          </channel></rss>
        `,
      });
    });

    const req = new NextRequest("http://localhost:9002/api/trends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trendTitle: "IA no Varejo",
        companyNiche: "Supermercados",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.headline).toBe("IA no Varejo: 3 Segredos para Vender Mais");
    expect(data.source).toBe("gemini-2.5-flash");
  });
});
