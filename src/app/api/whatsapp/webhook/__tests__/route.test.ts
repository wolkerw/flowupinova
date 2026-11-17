import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

const h = vi.hoisted(() => {
  const state = {
    chatData: { aiEnabled: true } as Record<string, any>,
    recentDocs: [] as any[],
    messageExists: false,
  };
  const chatSet = vi.fn().mockResolvedValue({});
  const messageSet = vi.fn().mockResolvedValue({});
  const chatGet = vi.fn(async () => ({ exists: true, data: () => state.chatData }));
  const messageDoc = vi.fn(() => ({
    set: messageSet,
    get: vi.fn(async () => ({ exists: state.messageExists })),
  }));
  const chatRef = {
    get: chatGet,
    set: chatSet,
    collection: vi.fn(() => ({
      doc: messageDoc,
      orderBy: vi.fn(() => ({
        limit: vi.fn(() => ({
          get: vi.fn(async () => ({ docs: state.recentDocs.map((d) => ({ data: () => d })) })),
        })),
      })),
    })),
  };
  const chatDocFn = vi.fn(() => chatRef);
  return { state, chatSet, messageSet, chatGet, chatDocFn };
});

vi.mock("@/lib/firebase-admin", () => ({
  adminDb: { collection: vi.fn(() => ({ doc: h.chatDocFn })) },
}));

vi.mock("@/lib/services/whatsapp-ai-service", () => ({
  WHATSAPP_HISTORY_LIMIT: 12,
  transcribeWhatsAppAudio: vi.fn().mockResolvedValue("quero saber o preço do plano anual"),
  generateWhatsAppAIResponse: vi.fn().mockResolvedValue({
    replyText: "Olá! A NumVapt ajuda a sua empresa a vender mais nas redes com posts incríveis! ✨",
    needsHumanSupport: false,
    suggestedAction: "plan_details",
    planMentioned: "mensal",
  }),
}));

vi.mock("@/lib/whatsapp/evolution-client", () => ({
  getEvolutionMediaBase64: vi.fn().mockResolvedValue({ base64: "QUFB", mimetype: "audio/ogg; codecs=opus" }),
}));

import { GET, POST } from "../route";
import { generateWhatsAppAIResponse, transcribeWhatsAppAudio } from "@/lib/services/whatsapp-ai-service";
import { getEvolutionMediaBase64 } from "@/lib/whatsapp/evolution-client";

function post(body: unknown) {
  return POST(
    new NextRequest("http://localhost:3000/api/whatsapp/webhook", {
      method: "POST",
      body: JSON.stringify(body),
    })
  );
}

function evolutionEvent(message: any, key: Record<string, any> = {}) {
  return {
    event: "messages.upsert",
    data: {
      key: { remoteJid: "5551999998888@s.whatsapp.net", fromMe: false, id: "ABC123", ...key },
      pushName: "Ana",
      message,
    },
  };
}

describe("WhatsApp Webhook Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.state.chatData = { aiEnabled: true };
    h.state.recentDocs = [];
    h.state.messageExists = false;
    delete process.env.WHATSAPP_REPLY_DEBOUNCE_MS;
  });

  afterEach(() => {
    delete process.env.WHATSAPP_REPLY_DEBOUNCE_MS;
  });

  it("GET retorna status do serviço e número oficial da NumVapt", async () => {
    const res = await GET(new NextRequest("http://localhost:3000/api/whatsapp/webhook"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("active");
    expect(json.whatsappNumber).toBe("(51) 92004-4035");
  });

  it("POST processa mensagem recebida e retorna resposta gerada pela IA", async () => {
    const res = await post({
      phone: "51920044035",
      senderName: "João da Loja",
      message: "Como funciona a vitrine digital da NumVapt?",
    });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.handled).toBe(true);
    expect(json.replyText).toContain("NumVapt");
    expect(json.phone).toBe("51920044035");
    expect(generateWhatsAppAIResponse).toHaveBeenCalledWith(
      expect.objectContaining({ pendingMessages: ["Como funciona a vitrine digital da NumVapt?"] })
    );
  });

  it("POST ignora mensagens enviadas pelo próprio bot", async () => {
    const res = await post({ phone: "51920044035", fromMe: true, message: "Minha própria mensagem" });
    const json = await res.json();
    expect(json.ignored).toBe(true);
    expect(generateWhatsAppAIResponse).not.toHaveBeenCalled();
  });

  it("resolve o telefone real quando a Evolution identifica o contato por LID", async () => {
    const res = await post(
      evolutionEvent(
        { conversation: "Oi, tudo bem?" },
        { remoteJid: "123456789012345@lid", remoteJidAlt: "5551988887777@s.whatsapp.net" }
      )
    );
    const json = await res.json();
    expect(json.phone).toBe("5551988887777");
    expect(h.chatDocFn).toHaveBeenCalledWith("5551988887777");
    expect(h.chatSet).toHaveBeenCalledWith(expect.objectContaining({ lid: "123456789012345" }), { merge: true });
  });

  it("lê texto de mensagens temporárias (ephemeralMessage)", async () => {
    await post(
      evolutionEvent({ ephemeralMessage: { message: { extendedTextMessage: { text: "Tem teste grátis?" } } } })
    );
    expect(h.messageSet).toHaveBeenCalledWith(expect.objectContaining({ role: "user", text: "Tem teste grátis?" }));
    expect(generateWhatsAppAIResponse).toHaveBeenCalled();
  });

  it("baixa e transcreve áudio da Evolution antes de responder", async () => {
    await post(evolutionEvent({ audioMessage: { mimetype: "audio/ogg; codecs=opus", seconds: 4 } }));
    expect(getEvolutionMediaBase64).toHaveBeenCalled();
    expect(transcribeWhatsAppAudio).toHaveBeenCalledWith("QUFB", "audio/ogg; codecs=opus");
    expect(generateWhatsAppAIResponse).toHaveBeenCalledWith(
      expect.objectContaining({ incomingMessage: "[Áudio] quero saber o preço do plano anual" })
    );
  });

  it("não responde de novo um evento já processado", async () => {
    h.state.messageExists = true;
    const json = await (await post(evolutionEvent({ conversation: "Oi" }))).json();
    expect(json.ignored).toBe(true);
    expect(generateWhatsAppAIResponse).not.toHaveBeenCalled();
  });

  it("junta mensagens seguidas do cliente numa única resposta", async () => {
    h.state.recentDocs = [
      { id: "m4", role: "user", text: "precisa de cartão?", timestamp: "2026-11-17T10:00:04.000Z" },
      { id: "m3", role: "user", text: "tem teste grátis?", timestamp: "2026-11-17T10:00:02.000Z" },
      { id: "m2", role: "assistant", text: "Oi! Como posso ajudar?", timestamp: "2026-11-17T09:59:00.000Z" },
      { id: "m1", role: "user", text: "oi", timestamp: "2026-11-17T09:58:00.000Z" },
    ];
    await post({ phone: "5551999998888", message: "precisa de cartão?" });
    const args = (generateWhatsAppAIResponse as any).mock.calls[0][0];
    expect(args.pendingMessages).toEqual(["tem teste grátis?", "precisa de cartão?"]);
    expect(args.history.map((m: any) => m.text)).toEqual(["oi", "Oi! Como posso ajudar?"]);
  });

  it("desiste de responder quando chega mensagem mais nova durante a espera", async () => {
    process.env.WHATSAPP_REPLY_DEBOUNCE_MS = "1";
    h.chatGet
      .mockResolvedValueOnce({ exists: true, data: () => ({ aiEnabled: true }) })
      .mockResolvedValueOnce({ exists: true, data: () => ({ aiEnabled: true, lastUserMessageId: "msg_user_outra" }) });
    const json = await (await post({ phone: "5551999998888", message: "tem teste grátis?" })).json();
    expect(json.aggregated).toBe(true);
    expect(json.replyText).toBeNull();
    expect(generateWhatsAppAIResponse).not.toHaveBeenCalled();
  });

  it("ignora reações", async () => {
    const json = await (await post(evolutionEvent({ reactionMessage: { text: "👍" } }))).json();
    expect(json.ignored).toBe(true);
    expect(h.messageSet).not.toHaveBeenCalled();
  });
});
