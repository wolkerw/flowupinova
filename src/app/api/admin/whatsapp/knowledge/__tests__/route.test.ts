import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST, DELETE, PATCH } from "../route";
import { DEFAULT_KNOWLEDGE_TOPICS } from "@/lib/constants/knowledge-defaults";
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
      get: vi.fn().mockResolvedValue({ docs: [{ id: "topic_planos" }] }),
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

  it("GET devolve também os tópicos padrão para o painel comparar", async () => {
    const req = new NextRequest("http://localhost:9002/api/admin/whatsapp/knowledge", {
      headers: { cookie: "firebase-id-token=valid-token" },
    });
    const data = await (await GET(req)).json();
    expect(data.defaultTopics.length).toBe(DEFAULT_KNOWLEDGE_TOPICS.length);
  });

  it("bloqueia ativar tópico com o marcador [PREENCHER]", async () => {
    const req = new NextRequest("http://localhost:9002/api/admin/whatsapp/knowledge", {
      method: "POST",
      headers: { cookie: "firebase-id-token=valid-token", "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Teste grátis", content: "[PREENCHER] duração", isActive: true }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(mockDocSet).not.toHaveBeenCalled();
  });

  it("salva canal, público e validade com valores válidos", async () => {
    const req = new NextRequest("http://localhost:9002/api/admin/whatsapp/knowledge", {
      method: "POST",
      headers: { cookie: "firebase-id-token=valid-token", "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Black Friday",
        content: "30% de desconto",
        channel: "instagram",
        audience: "lead",
        expiresAt: "2026-11-30",
      }),
    });
    expect((await POST(req)).status).toBe(200);
    expect(mockDocSet.mock.calls[0][0]).toMatchObject({
      channel: "instagram",
      audience: "lead",
      expiresAt: "2026-11-30",
    });
  });

  it("import-defaults adiciona só os tópicos padrão que ainda não existem", async () => {
    const req = new NextRequest("http://localhost:9002/api/admin/whatsapp/knowledge", {
      method: "PATCH",
      headers: { cookie: "firebase-id-token=valid-token", "Content-Type": "application/json" },
      body: JSON.stringify({ action: "import-defaults" }),
    });
    const res = await PATCH(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.imported).not.toContain("topic_planos");
    expect(data.imported).toHaveLength(DEFAULT_KNOWLEDGE_TOPICS.length - 1);
    expect(mockBatchCommit).toHaveBeenCalled();
  });

  it("restore-default substitui o tópico pela versão padrão", async () => {
    const req = new NextRequest("http://localhost:9002/api/admin/whatsapp/knowledge", {
      method: "PATCH",
      headers: { cookie: "firebase-id-token=valid-token", "Content-Type": "application/json" },
      body: JSON.stringify({ action: "restore-default", id: "topic_empresa" }),
    });
    expect((await PATCH(req)).status).toBe(200);
    expect(mockDocSet.mock.calls[0][0].content).toContain("Google Meu Negócio");
  });

  it("PATCH exige admin", async () => {
    const req = new NextRequest("http://localhost:9002/api/admin/whatsapp/knowledge", {
      method: "PATCH",
      body: JSON.stringify({ action: "import-defaults" }),
    });
    expect((await PATCH(req)).status).toBe(403);
  });
});
