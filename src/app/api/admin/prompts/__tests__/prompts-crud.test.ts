import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST, DELETE } from "../route";
import { NextRequest } from "next/server";

vi.mock("@/lib/admin-auth", () => ({
  requireAdminAccess: vi.fn().mockResolvedValue({
    uid: "admin-123",
    email: "admin@numvapt.com.br",
  }),
}));

const mockDoc = {
  set: vi.fn().mockResolvedValue(undefined),
  get: vi.fn().mockResolvedValue({ exists: true, data: () => ({ id: "p1" }) }),
  update: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn().mockResolvedValue(undefined),
};

const mockCollection = {
  doc: vi.fn(() => mockDoc),
  where: vi.fn().mockReturnThis(),
  get: vi.fn().mockResolvedValue({
    forEach: (cb: any) =>
      cb({
        data: () => ({
          id: "p1",
          title: "Hambúrguer Gourmet",
          createdAt: "2026-09-22T00:00:00Z",
        }),
      }),
  }),
};

vi.mock("@/lib/firebase-admin", () => ({
  adminDb: {
    collection: vi.fn(() => mockCollection),
  },
}));

describe("API /api/admin/prompts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET lista os prompts cadastrados", async () => {
    const req = new NextRequest("http://localhost:9002/api/admin/prompts");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.items).toHaveLength(1);
    expect(data.items[0].title).toBe("Hambúrguer Gourmet");
  });

  it("POST cria um novo prompt com seções estruturadas", async () => {
    const req = new NextRequest("http://localhost:9002/api/admin/prompts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Bolo de Chocolate Suíço",
        category: "Gastronomia & Alimentos",
        rawPrompt: "Bolo de chocolate derretendo com morangos...",
        sections: {
          subjectTemplate: "{{produto}} com calda escorrendo",
          lighting: "Luz suave de estúdio",
        },
        triggerKeywords: ["bolo", "confeitaria", "doce"],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.item.title).toBe("Bolo de Chocolate Suíço");
    expect(mockDoc.set).toHaveBeenCalledTimes(1);
  });

  it("DELETE remove um prompt existente por id", async () => {
    const req = new NextRequest("http://localhost:9002/api/admin/prompts?id=p1", {
      method: "DELETE",
    });

    const res = await DELETE(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(mockDoc.delete).toHaveBeenCalledTimes(1);
  });
});
