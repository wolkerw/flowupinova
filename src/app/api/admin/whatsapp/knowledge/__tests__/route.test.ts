import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST, DELETE } from "../route";
import { NextRequest } from "next/server";

vi.mock("@/lib/admin-auth", () => ({
  validateAdminToken: vi.fn().mockImplementation(async (token) => {
    if (token === "valid-token") return { email: "admin@numvapt.com.br", role: "admin" };
    return null;
  }),
}));

const mockDocSet = vi.fn().mockResolvedValue(undefined);
const mockDocDelete = vi.fn().mockResolvedValue(undefined);
const mockBatchSet = vi.fn();
const mockBatchCommit = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/firebase-admin", () => ({
  adminDb: {
    collection: vi.fn().mockReturnValue({
      orderBy: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          empty: false,
          docs: [
            {
              id: "topic_1",
              data: () => ({
                title: "Planos Teste",
                category: "planos",
                content: "Conteúdo teste",
                isActive: true,
                order: 1,
              }),
            },
          ],
        }),
      }),
      doc: vi.fn().mockReturnValue({
        set: (...args: any[]) => mockDocSet(...args),
        delete: () => mockDocDelete(),
      }),
    }),
    batch: vi.fn().mockReturnValue({
      set: (...args: any[]) => mockBatchSet(...args),
      commit: () => mockBatchCommit(),
    }),
  },
}));

describe("/api/admin/whatsapp/knowledge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 403 se o token de admin não for válido", async () => {
    const req = new NextRequest("http://localhost:9002/api/admin/whatsapp/knowledge");
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it("retorna lista de tópicos quando autenticado", async () => {
    const req = new NextRequest("http://localhost:9002/api/admin/whatsapp/knowledge", {
      headers: { cookie: "firebase-id-token=valid-token" },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.topics).toHaveLength(1);
    expect(data.topics[0].title).toBe("Planos Teste");
  });

  it("permite criar ou atualizar um tópico via POST", async () => {
    const req = new NextRequest("http://localhost:9002/api/admin/whatsapp/knowledge", {
      method: "POST",
      headers: {
        cookie: "firebase-id-token=valid-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Promoção de Carnaval",
        category: "promocoes",
        content: "20% de desconto no plano anual",
        isActive: true,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockDocSet).toHaveBeenCalled();
  });

  it("permite excluir um tópico via DELETE", async () => {
    const req = new NextRequest("http://localhost:9002/api/admin/whatsapp/knowledge?id=topic_1", {
      method: "DELETE",
      headers: { cookie: "firebase-id-token=valid-token" },
    });

    const res = await DELETE(req);
    expect(res.status).toBe(200);
    expect(mockDocDelete).toHaveBeenCalled();
  });
});
