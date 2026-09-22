import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../direcao-visual/route";
import { NextRequest } from "next/server";

vi.mock("@/lib/api-auth", () => ({
  getAuthenticatedUser: vi.fn().mockResolvedValue({
    uid: "test-user-123",
    email: "test@numvapt.com.br",
  }),
}));

vi.mock("@/lib/firebase-admin", () => ({
  adminDb: {
    doc: vi.fn().mockReturnValue({
      get: vi.fn().mockResolvedValue({
        exists: true,
        data: () => ({
          name: "Padaria Artesanal",
          brandKit: {
            primaryColor: "#FA6305",
            secondaryColor: "#0083C7",
            visualGuidelines: "Estética rústica e acolhedora",
          },
        }),
      }),
    }),
  },
}));

describe("API /api/imagens/direcao-visual", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, GEMINI_API_KEY: "test-key-123" };
  });

  it("retorna 400 se o briefing for vazio", async () => {
    const req = new NextRequest("http://localhost:9002/api/imagens/direcao-visual", {
      method: "POST",
      body: JSON.stringify({ brief: "" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("briefing");
  });

  it("retorna direção visual estruturada com base no briefing fornecido", async () => {
    const mockGeminiReply = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  visualDirection: {
                    interpretation: "Foto publicitária de pão artesanal saído do forno",
                    subject: "Pão de fermentação natural dourado com crosta crocante",
                    composition: "Plano detalhe com foco seletivo em tábua de madeira",
                    lighting: "Luz natural lateral quente de manhã",
                    style: "Fotografia gastronômica editorial",
                    brandApplication: "Tons quentes alinhados à cor primária",
                    textLayers: [{ text: "Pão Quentinho Todo Dia", type: "headline" }],
                    avoid: ["pão artificial", "cores frias"],
                  },
                  alternativeDirections: [],
                }),
              },
            ],
          },
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockGeminiReply,
    });

    const req = new NextRequest("http://localhost:9002/api/imagens/direcao-visual", {
      method: "POST",
      body: JSON.stringify({
        brief: "Crie uma foto de um pão artesanal quentinho na mesa",
        objective: "commercial",
        format: "square",
        style: "photographic",
        useBrandKit: true,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.visualDirection.subject).toContain("Pão");
    expect(data.visualDirection.lighting).toBeDefined();
  });
});
