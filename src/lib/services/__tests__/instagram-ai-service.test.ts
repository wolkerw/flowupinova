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
  it("aplica guardrail de saída caso o modelo alucine preço de R$ 79,90 ou link /planos", async () => {
    process.env.GEMINI_API_KEY = "test-gemini-key";

    const mockAiJson = JSON.stringify({
      replyText: "O plano mensal custa R$ 79,90 por mês. Veja no site https://numvapt.com.br/planos!",
      needsHumanSupport: false,
      suggestedAction: "plan_details",
      planMentioned: "mensal",
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: mockAiJson }] } }],
      }),
    });

    const res = await generateInstagramAIResponse({
      incomingMessage: "Quanto custa o plano mensal?",
      senderName: "Luiz",
    });

    expect(res.replyText).not.toContain("79,90");
    expect(res.replyText).toContain("R$ 490,00/mês");
    expect(res.replyText).not.toContain("/planos");
    expect(res.replyText).toContain("https://numvapt.com.br/acesso/cadastro");
  });

  it("filtra mensagens corrompidas do histórico para não contaminar o contexto do modelo", async () => {
    process.env.GEMINI_API_KEY = "test-gemini-key";

    const mockAiJson = JSON.stringify({
      replyText: "O plano mensal oficial é R$ 490,00/mês.",
      needsHumanSupport: false,
      suggestedAction: "plan_details",
      planMentioned: "mensal",
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: mockAiJson }] } }],
      }),
    });

    await generateInstagramAIResponse({
      incomingMessage: "Mas quanto custa por mês?",
      history: [
        {
          id: "old_msg_1",
          role: "assistant",
          text: "O plano custa R$ 79,90 no site /planos",
          timestamp: "2026-09-21T00:00:00Z",
          senderId: "numvapt_bot",
        },
        {
          id: "old_msg_2",
          role: "user",
          text: "ok",
          timestamp: "2026-09-21T00:01:00Z",
          senderId: "user_1",
        },
      ],
      senderName: "Luiz",
    });

    const fetchArgs = (global.fetch as any).mock.calls[0];
    const requestBody = JSON.parse(fetchArgs[1].body);
    const contents = requestBody.contents;

    // A mensagem antiga da IA com 79,90 não deve ter sido enviada
    const hasCorrupted = contents.some((c: any) => c.parts[0].text.includes("79,90"));
    expect(hasCorrupted).toBe(false);
  });
  it("injeta exemplos few-shot de precificação no prompt e sanitiza outros preços incorretos como R$ 97 e R$ 199", async () => {
    process.env.GEMINI_API_KEY = "test-gemini-key";

    const mockAiJson = JSON.stringify({
      replyText: "O plano mensal custa R$ 97/mês no site https://numvapt.com/planos!",
      needsHumanSupport: false,
      suggestedAction: "plan_details",
      planMentioned: "mensal",
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: mockAiJson }] } }],
      }),
    });

    const res = await generateInstagramAIResponse({
      incomingMessage: "Qual o valor por mês?",
      senderName: "Luiz",
    });

    const fetchArgs = (global.fetch as any).mock.calls[0];
    const requestBody = JSON.parse(fetchArgs[1].body);
    const systemInstruction = requestBody.systemInstruction.parts[0].text;

    expect(systemInstruction).toContain("EXEMPLOS OBRIGATÓRIOS DE RESPOSTA (FEW-SHOT)");
    expect(systemInstruction).toContain("O plano mensal da NumVapt custa R$ 490,00/mês");
    expect(res.replyText).not.toContain("97");
    expect(res.replyText).toContain("R$ 490,00/mês");
    expect(res.replyText).toContain("https://numvapt.com.br/acesso/cadastro");
  });
});

