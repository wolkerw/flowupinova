import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  POST,
  GET,
  buildStructuredTrendFallback,
  buildStructuredTrendAIPrompt,
  parseGoogleTrendsHtmlDs0,
} from "../route";
import { GOOGLE_TRENDS_CATEGORIES } from "@/lib/constants/google-trends-categories";

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

  it("parseGoogleTrendsHtmlDs0 extrai categorias oficiais do item (index 10) e mapeia para nomes", () => {
    const mockHtml = `
      AF_initDataCallback({key: 'ds:0', hash: '1', data:[null,[
        ["Outlook 365",null,"BR",[1794595800],null,null,50000,null,1000,["outlook web"],[18]],
        ["Sérvia x Alemanha",null,"BR",[1794595800],null,null,20000,null,1000,["copa"],[17]],
        ["Nova Dieta Saudável",null,"BR",[1794595800],null,null,15000,null,1000,["saude"],[7]]
      ]], sideChannel: {}});
    `;

    const items = parseGoogleTrendsHtmlDs0(mockHtml, "BR", new Map());
    expect(items).toHaveLength(3);
    expect(items[0].title).toBe("Outlook 365");
    expect(items[0].categories).toEqual([18]);
    expect(items[0].primaryCategory).toBe("Tecnologia");
    expect(items[1].categories).toEqual([17]);
    expect(items[1].primaryCategory).toBe("Esportes");
    expect(items[2].categories).toEqual([7]);
    expect(items[2].primaryCategory).toBe("Saúde e Bem-estar");
  });

  it("GET /api/trends prioriza pautas pertencentes à categoria do negócio selecionada", async () => {
    const mockHtml = `
      AF_initDataCallback({key: 'ds:0', hash: '1', data:[null,[
        ["Campeonato de Futebol",null,"BR",[1794595800],null,null,80000,null,1000,[],[17]],
        ["Novo Software de Gestão",null,"BR",[1794595800],null,null,10000,null,1000,[],[18]],
        ["Show de Rock",null,"BR",[1794595800],null,null,50000,null,1000,[],[4]]
      ]], sideChannel: {}});
    `;

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("trends.google.com/trending")) {
        return Promise.resolve({
          ok: true,
          text: async () => mockHtml,
        });
      }
      return Promise.resolve({
        ok: true,
        text: async () => "<rss></rss>",
      });
    });

    // Categoria 18 = Tecnologia
    const req = new NextRequest("http://localhost:9002/api/trends?period=today&category=18");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.activeCategory?.name).toBe("Tecnologia");
    // O item da categoria 18 deve vir em primeiro lugar pela priorização!
    expect(data.trends[0].title).toBe("Novo Software de Gestão");
    expect(data.trends[0].isBusinessCategoryMatch).toBe(true);
    expect(data.trends[1].title).toBe("Campeonato de Futebol");
    expect(data.trends[1].isBusinessCategoryMatch).toBe(false);
  });
});
