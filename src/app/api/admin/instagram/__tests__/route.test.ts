import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PUT, POST } from "../route";
import { NextRequest } from "next/server";

vi.mock("@/lib/admin-auth", () => ({
  validateAdminToken: vi.fn().mockImplementation(async (token: string | null) => {
    if (token === "valid_admin_token") {
      return { uid: "admin_123", email: "admin@numvapt.com.br", role: "admin" };
    }
    return null;
  }),
}));

vi.mock("@/lib/firebase-admin", () => {
  const mockDocSet = vi.fn().mockResolvedValue({});
  const mockDocRef = {
    set: mockDocSet,
    collection: vi.fn().mockReturnValue({
      doc: vi.fn().mockReturnValue({ set: mockDocSet }),
      orderBy: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            docs: [
              {
                id: "msg_1",
                data: () => ({
                  id: "msg_1",
                  role: "user",
                  text: "Olá!",
                  timestamp: new Date().toISOString(),
                }),
              },
            ],
          }),
        }),
      }),
    }),
  };

  return {
    adminDb: {
      collection: vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue(mockDocRef),
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({
              docs: [
                {
                  id: "user_999",
                  data: () => ({
                    senderId: "user_999",
                    contactName: "Seguidor Teste",
                    lastMessageText: "Olá!",
                    lastMessageAt: new Date().toISOString(),
                    aiEnabled: true,
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

describe("Admin Instagram Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET rejeita requisição não autenticada com 403", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/instagram");
    const res = await GET(req);

    expect(res.status).toBe(403);
  });

  it("GET retorna lista de chats para usuário admin autenticado", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/instagram", {
      headers: {
        cookie: "firebase-id-token=valid_admin_token",
      },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.chats).toBeDefined();
    expect(json.chats.length).toBe(1);
    expect(json.chats[0].senderId).toBe("user_999");
  });

  it("PUT atualiza o status da IA para uma conversa", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/instagram", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        cookie: "firebase-id-token=valid_admin_token",
      },
      body: JSON.stringify({ senderId: "user_999", aiEnabled: false }),
    });

    const res = await PUT(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.aiEnabled).toBe(false);
  });

  it("POST registra mensagem de atendente humano", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/instagram", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: "firebase-id-token=valid_admin_token",
      },
      body: JSON.stringify({ senderId: "user_999", message: "Olá, sou o suporte da NumVapt!" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.message.text).toBe("Olá, sou o suporte da NumVapt!");
    expect(json.message.role).toBe("admin");
  });
});
