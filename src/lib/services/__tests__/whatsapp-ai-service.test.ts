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

import { buildConversationContents, generateWhatsAppAIResponse } from "../whatsapp-ai-service";

describe("buildConversationContents", () => {
  it("envia as mensagens novas juntas, sem duplicar a pergunta atual", () => {
    const contents = buildConversationContents(
      [
        { id: "1", role: "user", text: "oi", timestamp: "t1" },
        { id: "2", role: "assistant", text: "Oi! Como posso ajudar?", timestamp: "t2" },
      ],
      ["tem teste grátis?", "precisa de cartão?"],
      "Ana"
    );
    expect(contents.map((c) => c.role)).toEqual(["user", "model", "user"]);
    const last = contents[2].parts[0].text;
    expect(last).toContain("1. tem teste grátis?");
    expect(last).toContain("2. precisa de cartão?");
    expect(JSON.stringify(contents).match(/precisa de cartão/g)).toHaveLength(1);
  });

  it("junta turnos seguidos do mesmo papel e marca mensagens do atendente humano", () => {
    const contents = buildConversationContents(
      [
        { id: "0", role: "assistant", text: "boas-vindas", timestamp: "t0" },
        { id: "1", role: "user", text: "a", timestamp: "t1" },
        { id: "2", role: "user", text: "b", timestamp: "t2" },
        { id: "3", role: "admin", text: "Oi, aqui é a equipe", timestamp: "t3" },
      ],
      ["c"],
      "Ana"
    );
    // começa pelo usuário (o turno inicial do modelo é descartado)
    expect(contents[0]).toEqual({ role: "user", parts: [{ text: "a\nb" }] });
    expect(contents[1].parts[0].text).toContain("[Atendente humano da NumVapt]");
  });
});

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

  it("gera resposta da IA formatada para WhatsApp a partir da chamada ao Gemini e inclui a Central de Conhecimento e Cérebro", async () => {
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
      incomingMessage: "Como faço para postar e como configuro meu cérebro do negócio?",
      senderName: "Carlos",
      clientPhone: "51920044035",
    });

    expect(res.replyText).toContain("NumVapt");
    expect(res.needsHumanSupport).toBe(false);

    // Valida que a instrução do sistema enviada ao Gemini continha a base completa de conhecimento
    expect(global.fetch).toHaveBeenCalled();
    const fetchArgs = (global.fetch as any).mock.calls[0];
    const requestBody = JSON.parse(fetchArgs[1].body);
    const systemText = requestBody.systemInstruction.parts[0].text;
    expect(systemText).toContain("GUIA PASSO A PASSO: COMO CONFIGURAR O CÉREBRO DO NEGÓCIO");
    expect(systemText).toContain("ROTEIRO PASSO A PASSO ATÉ A PUBLICAÇÃO FINAL");
    expect(systemText).toContain("https://numvapt.com/dashboard/posts");
    expect(systemText).toContain("https://numvapt.com/dashboard/configuracoes");
    expect(systemText).toContain("DIRETRIZES ESPECÍFICAS DE ATENDIMENTO PARA WHATSAPP (MAIA)");
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
  it("aplica guardrail de saída no WhatsApp para preços incorretos como R$ 97 ou link /planos", async () => {
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

    const res = await generateWhatsAppAIResponse({
      incomingMessage: "Quanto custa o plano?",
      senderName: "Carlos",
    });

    expect(res.replyText).not.toContain("97");
    expect(res.replyText).toContain("R$ 490,00/mês");
    expect(res.replyText).toContain("https://numvapt.com/acesso/cadastro");
  });
});
