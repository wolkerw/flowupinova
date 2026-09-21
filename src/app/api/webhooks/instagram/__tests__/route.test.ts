import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "../route";
import { NextRequest } from "next/server";

vi.mock("@/lib/firebase-admin", () => {
  const mockDocSet = vi.fn().mockResolvedValue({});
  const mockDocGet = vi.fn().mockResolvedValue({
    exists: true,
    data: () => ({ aiEnabled: true, humanTakeover: false, username: "teste_user" }),
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

describe("Instagram Webhook Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET valida o webhook da Meta quando token está correto", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/webhooks/instagram?hub.mode=subscribe&hub.verify_token=numvapt_instagram_verify_token&hub.challenge=1158201244"
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toBe("1158201244");
  });

  it("GET rejeita o webhook se o token for incorreto (403)", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/webhooks/instagram?hub.mode=subscribe&hub.verify_token=token_invalido&hub.challenge=1158201244"
    );
    const res = await GET(req);

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain("inválido");
  });

  it("POST processa mensagem recebida do Direct e retorna EVENT_RECEIVED", async () => {
    const payload = {
      object: "instagram",
      entry: [
        {
          id: "page_123",
          messaging: [
            {
              sender: { id: "user_456" },
              recipient: { id: "page_123" },
              timestamp: Date.now(),
              message: {
                mid: "msg_789",
                text: "Quanto custa o plano da NumVapt?",
              },
            },
          ],
        },
      ],
    };

    const req = new NextRequest("http://localhost:3000/api/webhooks/instagram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("EVENT_RECEIVED");
  });

  it("POST ignora evento que não seja de instagram", async () => {
    const req = new NextRequest("http://localhost:3000/api/webhooks/instagram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ object: "unknown" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("ignored");
  });
});
