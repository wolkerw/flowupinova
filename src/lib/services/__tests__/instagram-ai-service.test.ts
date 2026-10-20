import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateInstagramAIResponse } from "../instagram-ai-service";

vi.mock("@/lib/firebase-admin", () => {
  const mockDocs = [
    {
      id: "topic_planos",
      data: () => ({
        title: "Planos e Preços Oficiais NumVapt",
        content: "• Mensal: R$ 490,00\n• Anual: 12x de R$ 399,00 (+ 1 mês grátis)",
        isActive: true,
        order: 1,
      }),
    },
  ];

  const mockQuery = {
    get: vi.fn().mockResolvedValue({
      empty: false,
      docs: mockDocs,
    }),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
  };

  return {
    adminDb: {
      collection: vi.fn().mockReturnValue(mockQuery),
    },
  };
});

describe("Instagram AI Service", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.GEMINI_API_KEY;
  });

  it("retorna resposta de planos usando a central de conhecimento do Firestore (fallback)", async () => {
    const res = await generateInstagramAIResponse({
      incomingMessage: "Quanto custa o plano da NumVapt?",
      senderName: "Carlos",
    });

    expect(res.replyText).toContain("NumVapt");
    expect(res.replyText).toContain("Mensal: R$ 490,00");
    expect(res.suggestedAction).toBe("plan_details");
    expect(res.needsHumanSupport).toBe(false);
  });

  it("identifica solicitação de transbordo para atendente humano", async () => {
    const res = await generateInstagramAIResponse({
      incomingMessage: "Gostaria de falar com um atendente humano por favor",
      senderName: "Mariana",
    });

    expect(res.replyText).toContain("humana");
    expect(res.replyText).toContain("(51) 92004-4035");
    expect(res.needsHumanSupport).toBe(true);
    expect(res.suggestedAction).toBe("human_transfer");
  });

  it("retorna apresentação institucional quando a mensagem for genérica", async () => {
    const res = await generateInstagramAIResponse({
      incomingMessage: "Olá, boa tarde!",
      senderName: "Fernanda",
    });

    expect(res.replyText).toContain("Fernanda");
    expect(res.replyText).toContain("Maia");
    expect(res.needsHumanSupport).toBe(false);
  });

  it("chama o Gemini com a base de conhecimento completa da plataforma, passo a passo e cérebro do negócio", async () => {
    process.env.GEMINI_API_KEY = "test-gemini-key";

    const mockAiJson = JSON.stringify({
      replyText: "Olá! Para publicar posts na NumVapt, temos 5 etapas simples na aba Posts! ✨",
      needsHumanSupport: false,
      suggestedAction: "faq",
      planMentioned: null,
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: mockAiJson }],
            },
          },
        ],
      }),
    });

    const res = await generateInstagramAIResponse({
      incomingMessage: "Como faço para postar um carrossel no app?",
      senderName: "Lucas",
    });

    expect(res.replyText).toContain("NumVapt");
    expect(global.fetch).toHaveBeenCalled();

    const fetchArgs = (global.fetch as any).mock.calls[0];
    const requestBody = JSON.parse(fetchArgs[1].body);
    const systemInstruction = requestBody.systemInstruction.parts[0].text;

    expect(systemInstruction).toContain("GUIA PASSO A PASSO: COMO CONFIGURAR O CÉREBRO DO NEGÓCIO");
    expect(systemInstruction).toContain("ROTEIRO PASSO A PASSO ATÉ A PUBLICAÇÃO FINAL");
    expect(systemInstruction).toContain("https://numvapt.com.br/dashboard/posts");
    expect(systemInstruction).toContain("https://numvapt.com.br/dashboard/configuracoes");
    expect(systemInstruction).toContain("DIRETRIZES ESPECÍFICAS DE ATENDIMENTO PARA INSTAGRAM DIRECT (MAIA)");
  });
});
