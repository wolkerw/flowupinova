import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../logo/generate/route";

// Mock da autenticação se necessário ou simulação do request
vi.mock("@/lib/api-auth", () => ({
  getAuthenticatedUser: vi.fn().mockResolvedValue({
    uid: "test-user-brand-studio",
    email: "test@numvapt.com",
  }),
}));

// Mock do fetch global para OpenAI / Gemini
global.fetch = vi.fn().mockImplementation(async (url: string) => {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      data: [{ b64_json: "fake_base64_logo_bytes" }],
    }),
  } as any;
});

describe("POST /api/brand-studio/logo/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna erro 400 se brandName ou niche estiverem ausentes", async () => {
    const req = new Request("http://localhost/api/brand-studio/logo/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("O nome da marca e o nicho de atuação são obrigatórios.");
  });

  it("gera o conceito de logo e retorna paleta harmônica e mockups", async () => {
    const req = new Request("http://localhost/api/brand-studio/logo/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandName: "Studio Bella",
        niche: "Clínica de Estética Avançada",
        style: "minimalist",
        primaryColor: "#0083C7",
        secondaryColor: "#FA6305",
        iconIdea: "Flor de lótus geométrica",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.imageUrl).toBeDefined();
    expect(data.brandPalette).toBeDefined();
    expect(data.brandPalette.primary).toBe("#0083C7");
    expect(Array.isArray(data.variations)).toBe(true);
    expect(data.variations.length).toBeGreaterThanOrEqual(3);
  });
});
