import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../transcribe/route";
import { NextRequest } from "next/server";

vi.mock("@/lib/admin-auth", () => ({
  requireAdminAccess: vi.fn().mockResolvedValue({
    uid: "admin-123",
    email: "admin@numvapt.com.br",
  }),
}));

vi.mock("@/lib/firebase-admin", () => ({
  admin: {
    storage: () => ({
      bucket: () => ({
        name: "test-bucket",
        file: () => ({
          save: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    }),
  },
}));

describe("API /api/admin/prompts/transcribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    process.env.GEMINI_API_KEY = "mock-gemini-key";
  });

  it("retorna 400 se nenhuma imagem for enviada", async () => {
    const formData = new FormData();
    const req = new NextRequest("http://localhost:9002/api/admin/prompts/transcribe", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/Nenhuma imagem foi enviada/i);
  });

  it("transcreve o print de prompt com sucesso usando fallback de modelo Gemini", async () => {
    const mockGeminiResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  title: "DEIXE SUA FOTO COM APARÊNCIA PROFISSIONAL",
                  category: "Retratos & Fotos Pessoais",
                  targetUse: "personal_portrait",
                  rawPrompt: "Faça um retoque profissional nesta imagem...",
                  sections: {
                    subjectTemplate: "Retoque profissional preservando identidade",
                    lighting: "Iluminação balanceada e natural",
                  },
                  triggerKeywords: ["retoque", "foto de perfil", "profissional"],
                  semanticSummary: "Transforma fotos comuns em retratos executivos e profissionais",
                }),
              },
            ],
          },
        },
      ],
    };

    // Primeiro modelo retorna 404, segundo modelo (gemini-flash-latest ou 2.5-flash) tem sucesso
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => JSON.stringify({ error: { message: "models/gemini-2.5-flash not found" } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockGeminiResponse,
      });

    const req = new NextRequest("http://localhost:9002/api/admin/prompts/transcribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageBase64: "data:image/png;base64,ZmFrZS1pbWFnZS1ieXRlcw==",
        mimeType: "image/png",
        fileName: "prompt-print.png",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.transcription.title).toBe("DEIXE SUA FOTO COM APARÊNCIA PROFISSIONAL");
    expect(data.transcription.category).toBe("Retratos & Fotos Pessoais");
    expect(data.transcription.triggerKeywords).toContain("retoque");
  });
});
