import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/firebase-admin", () => {
  const mockDocs = [
    {
      id: "topic_planos",
      data: () => ({
        title: "Planos e Preços",
        content: "Plano Anual: R$ 399/mês",
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
      collection: vi.fn(() => mockQuery),
    },
  };
});

import { generateWhatsAppAIResponse } from "../whatsapp-ai-service";

describe("whatsapp-ai-service", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, GEMINI_API_KEY: "test-gemini-key" };
  });

  it("retorna resposta de contingência quando a chave GEMINI_API_KEY está ausente", async () => {
    delete process.env.GEMINI_API_KEY;

    const res = await generateWhatsAppAIResponse({
      incomingMessage: "Olá, quanto custa o plano da NumVapt?",
    });

    expect(res.replyText).toContain("NumVapt");
    expect(res.replyText).toContain("(51) 92004-4035");
    expect(res.needsHumanSupport).toBe(true);
  });

  it("gera resposta da IA formatada para WhatsApp a partir da chamada ao Gemini", async () => {
    const mockAiJson = JSON.stringify({
      replyText: "Olá! O plano anual da *NumVapt* sai por R$ 369,23/mês equivalente com 13 meses de acesso! ✨ Gostaria de receber o link de pagamento?",
      needsHumanSupport: false,
      suggestedAction: "checkout_link",
      planMentioned: "anual",
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

    const res = await generateWhatsAppAIResponse({
      incomingMessage: "Qual o valor do plano anual?",
      senderName: "Carlos",
      clientPhone: "51920044035",
    });

    expect(res.replyText).toContain("NumVapt");
    expect(res.replyText).toContain("R$ 369,23/mês");
    expect(res.needsHumanSupport).toBe(false);
    expect(res.suggestedAction).toBe("checkout_link");
    expect(res.planMentioned).toBe("anual");
  });

  it("detecta pedido de atendente humano e sinaliza needsHumanSupport", async () => {
    const mockAiJson = JSON.stringify({
      replyText: "Com certeza! Estou acionando agora mesmo um de nossos especialistas humanos da equipe NumVapt para te atender. Um instante! 💬",
      needsHumanSupport: true,
      suggestedAction: "human_transfer",
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

    const res = await generateWhatsAppAIResponse({
      incomingMessage: "Quero falar com um atendente humano urgente",
      senderName: "Mariana",
    });

    expect(res.needsHumanSupport).toBe(true);
    expect(res.suggestedAction).toBe("human_transfer");
  });
});
