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
    collection: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue({
        empty: true,
        docs: [],
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

  it("enriquece a direção visual quando há um prompt correspondente na central", async () => {
    let capturedSystemPrompt = "";

    const mockPromptDoc = {
      data: () => ({
        id: "pk_padaria",
        title: "Pão Rústico de Padaria Artesanal",
        category: "Gastronomia & Alimentos",
        targetUse: "product_photo",
        sections: {
          lighting: "Luz matinal dourada lateral de janela",
          cameraAndLens: "50mm f/1.4",
          composition: "Close-up 45 graus",
          environment: "Tábua de corte rústica com farinha polvilhada",
          styleAndMood: "Editorial gastronômico",
        },
        triggerKeywords: ["pão", "padaria", "fornada"],
        active: true,
      }),
    };

    const { adminDb } = await import("@/lib/firebase-admin");
    vi.mocked(adminDb.collection).mockReturnValueOnce({
      where: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue({
        empty: false,
        docs: [mockPromptDoc],
      }),
    } as any);

    global.fetch = vi.fn().mockImplementation((url, opts) => {
      if (opts?.body) {
        try {
          const parsed = JSON.parse(opts.body);
          capturedSystemPrompt = parsed.contents?.[0]?.parts?.[0]?.text || "";
        } catch {}
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      visualDirection: {
                        interpretation: "Pão rústico de padaria artesanal com luz matinal",
                        subject: "Pão de fermentação natural",
                        composition: "Close-up 45 graus",
                        lighting: "Luz matinal dourada lateral de janela",
                        style: "Editorial gastronômico",
                        brandApplication: "",
                        textLayers: [],
                        avoid: [],
                      },
                    }),
                  },
                ],
              },
            },
          ],
        }),
      });
    });

    const req = new NextRequest("http://localhost:9002/api/imagens/direcao-visual", {
      method: "POST",
      body: JSON.stringify({
        brief: "Quero uma foto da fornada de pão da manhã",
        objective: "commercial",
        format: "square",
        style: "photographic",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.matchedPromptKnowledge?.title).toBe("Pão Rústico de Padaria Artesanal");
    expect(capturedSystemPrompt).toContain("Pão Rústico de Padaria Artesanal");
    expect(capturedSystemPrompt).toContain("Luz matinal dourada lateral de janela");
  });
});
