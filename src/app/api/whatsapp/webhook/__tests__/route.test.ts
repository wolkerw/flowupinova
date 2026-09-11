import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "../route";
import { NextRequest } from "next/server";

vi.mock("@/lib/firebase-admin", () => {
  const mockDocSet = vi.fn().mockResolvedValue({});
  const mockDocGet = vi.fn().mockResolvedValue({
    exists: true,
    data: () => ({ aiEnabled: true }),
  });
  const mockDocRef = {
    get: mockDocGet,
    set: mockDocSet,
    collection: vi.fn().mockReturnValue({
      doc: vi.fn().mockReturnValue({ set: mockDocSet }),
      orderBy: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({ docs: [] }),
        }),
      }),
    }),
  };

  return {
    adminDb: {
      collection: vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue(mockDocRef),
      }),
    },
  };
});

vi.mock("@/lib/services/whatsapp-ai-service", () => ({
  generateWhatsAppAIResponse: vi.fn().mockResolvedValue({
    replyText: "Olá! A NumVapt ajuda a sua empresa a vender mais nas redes com posts incríveis! ✨",
    needsHumanSupport: false,
    suggestedAction: "plan_details",
    planMentioned: "mensal",
  }),
}));

import { generateWhatsAppAIResponse } from "@/lib/services/whatsapp-ai-service";

describe("WhatsApp Webhook Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET retorna status do serviço e número oficial da NumVapt", async () => {
    const req = new NextRequest("http://localhost:3000/api/whatsapp/webhook");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("active");
    expect(json.whatsappNumber).toBe("(51) 92004-4035");
  });

  it("POST processa mensagem recebida e retorna resposta gerada pela IA", async () => {
    const req = new NextRequest("http://localhost:3000/api/whatsapp/webhook", {
      method: "POST",
      body: JSON.stringify({
        phone: "51920044035",
        senderName: "João da Loja",
        message: "Como funciona a vitrine digital da NumVapt?",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.handled).toBe(true);
    expect(json.replyText).toContain("NumVapt");
    expect(json.phone).toBe("51920044035");
    expect(generateWhatsAppAIResponse).toHaveBeenCalled();
  });

  it("POST ignora mensagens enviadas pelo próprio bot", async () => {
    const req = new NextRequest("http://localhost:3000/api/whatsapp/webhook", {
      method: "POST",
      body: JSON.stringify({
        phone: "51920044035",
        fromMe: true,
        message: "Minha própria mensagem",
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(json.ignored).toBe(true);
    expect(generateWhatsAppAIResponse).not.toHaveBeenCalled();
  });
});
