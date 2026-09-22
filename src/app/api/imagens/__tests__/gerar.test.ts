import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../gerar/route";
import { NextRequest } from "next/server";

vi.mock("@/lib/api-auth", () => ({
  getAuthenticatedUser: vi.fn().mockResolvedValue({
    uid: "test-user-123",
    email: "test@numvapt.com.br",
  }),
}));

vi.mock("@/lib/firebase-admin", () => {
  const mockSet = vi.fn().mockResolvedValue(undefined);
  const mockUpdate = vi.fn().mockResolvedValue(undefined);
  const mockDoc = {
    set: mockSet,
    update: mockUpdate,
    get: vi.fn().mockResolvedValue({
      exists: true,
      data: () => ({ name: "Negócio Teste", brandKit: {} }),
    }),
  };

  return {
    admin: {
      storage: () => ({
        bucket: () => ({
          name: "test-bucket",
          file: () => ({
            save: vi.fn().mockResolvedValue(undefined),
          }),
        }),
      }),
      firestore: {
        FieldValue: {
          serverTimestamp: () => new Date().toISOString(),
        },
      },
    },
    adminDb: {
      doc: vi.fn(() => mockDoc),
      collection: vi.fn(() => ({
        doc: vi.fn(() => mockDoc),
      })),
    },
  };
});

vi.mock("@/lib/services/api-usage-service-admin", () => ({
  logApiUsage: vi.fn(),
}));

describe("API /api/imagens/gerar", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, OPENAI_API_KEY: "test-openai-key" };
  });

  it("retorna 400 se o briefing não for enviado", async () => {
    const req = new NextRequest("http://localhost:9002/api/imagens/gerar", {
      method: "POST",
      body: JSON.stringify({ brief: "" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Briefing");
  });

  it("cria a geração, processa slots e retorna as variações geradas", async () => {
    // Mock OpenAI image generation response
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [{ b64_json: Buffer.from("fake-image-bytes").toString("base64") }],
      }),
    });

    const req = new NextRequest("http://localhost:9002/api/imagens/gerar", {
      method: "POST",
      body: JSON.stringify({
        brief: "Um café especial em xícara de cerâmica artesanal",
        format: "square",
        quantity: 1,
        style: "photographic",
        useBrandKit: true,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.generationId).toBeDefined();
    expect(data.assets).toHaveLength(1);
    expect(data.assets[0].status).toBe("ready");
    expect(data.assets[0].originalUrl).toContain("firebasestorage.googleapis.com");
  });
});
