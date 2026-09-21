import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateInstagramAIResponse } from "../instagram-ai-service";

vi.mock("@/lib/firebase-admin", () => {
  return {
    adminDb: {
      collection: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({
              empty: false,
              docs: [
                {
                  data: () => ({
                    title: "Planos e Preços",
                    content: "• Mensal: R$ 490,00\n• Anual: 12x de R$ 399,00 (+ 1 mês grátis)",
                    isActive: true,
                  }),
                },
              ],
            }),
          }),
        }),
      }),
    },
  };
});

describe("Instagram AI Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna resposta de planos usando a central de conhecimento do Firestore", async () => {
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
});
