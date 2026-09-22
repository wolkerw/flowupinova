import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST, DELETE } from "../commands/route";
import { NextRequest } from "next/server";

vi.mock("@/lib/admin-auth", () => ({
  requireAdminAccess: vi.fn().mockResolvedValue({
    uid: "admin-123",
    email: "admin@numvapt.com.br",
  }),
}));

const mockDoc = {
  set: vi.fn().mockResolvedValue(undefined),
  get: vi.fn().mockResolvedValue({ exists: true, data: () => ({ id: "cmd_bokeh", usageCount: 5 }) }),
  delete: vi.fn().mockResolvedValue(undefined),
};

const mockCollection = {
  doc: vi.fn(() => mockDoc),
  get: vi.fn().mockResolvedValue({
    empty: false,
    forEach: (cb: any) =>
      cb({
        data: () => ({
          id: "cmd_bokeh",
          command: "/bokeh",
          label: "Luzes Desfocadas",
          active: true,
          order: 1,
        }),
      }),
  }),
};

const mockBatch = {
  set: vi.fn(),
  commit: vi.fn().mockResolvedValue(undefined),
};

vi.mock("@/lib/firebase-admin", () => ({
  adminDb: {
    collection: vi.fn(() => mockCollection),
    batch: vi.fn(() => mockBatch),
  },
}));

describe("API /api/admin/prompts/commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET lista os comandos cadastrados", async () => {
    const req = new NextRequest("http://localhost:9002/api/admin/prompts/commands");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.items).toHaveLength(1);
    expect(data.items[0].command).toBe("/bokeh");
  });

  it("POST cria ou atualiza um comando de estilo", async () => {
    const req = new NextRequest("http://localhost:9002/api/admin/prompts/commands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        command: "/bokeh",
        label: "Luzes Desfocadas",
        description: "Fundo com efeito bokeh",
        promptInjection: "Creamy circular bokeh blur",
        triggerKeywords: ["bokeh", "fundo desfocado"],
        active: true,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.item.command).toBe("/bokeh");
    expect(mockDoc.set).toHaveBeenCalledTimes(1);
  });

  it("DELETE exclui um comando existente", async () => {
    const req = new NextRequest("http://localhost:9002/api/admin/prompts/commands?id=cmd_bokeh", {
      method: "DELETE",
    });

    const res = await DELETE(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.deletedId).toBe("cmd_bokeh");
    expect(mockDoc.delete).toHaveBeenCalledTimes(1);
  });
});
