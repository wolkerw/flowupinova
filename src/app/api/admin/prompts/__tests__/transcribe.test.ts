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

describe("POST /api/admin/prompts/transcribe", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, GEMINI_API_KEY: "test-gemini-key" };
  });

  it("retorna 400 se nenhum dado de imagem for enviado", async () => {
    const req = new NextRequest("http://localhost:9002/api/admin/prompts/transcribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Imagem");
  });

  it("transcreve o print e divide em seções técnicas com sucesso", async () => {
    const mockGeminiReply = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  title: "Pizza Artesanal em Forno a Lenha",
                  category: "Gastronomia & Alimentos",
                  targetUse: "product_photo",
                  rawPrompt: "Fotografia de pizza napolitana saindo do forno com queijo borbulhante...",
                  sections: {
                    subjectTemplate: "{{produto}} com queijo derretido e manjericão fresco",
                    environment: "Bancada rústica em frente ao forno a lenha incandescente",
                    lighting: "Brilho quente do fogo lateral com foco direto",
                    cameraAndLens: "50mm f/1.8",
                    composition: "Ângulo de 45 graus com fumaça subindo",
                    styleAndMood: "Fotografia gastronômica acolhedora e artesanal",
                    negativeRules: "Sem aspecto artificial ou queimado",
                  },
                  triggerKeywords: ["pizza", "pizzaria", "artesanal", "forno a lenha", "massa"],
                  semanticSummary: "Fotografia profissional de pizza artesanal para pizzarias",
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

    const req = new NextRequest("http://localhost:9002/api/admin/prompts/transcribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageBase64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        fileName: "print-pizza.png",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.transcription.title).toBe("Pizza Artesanal em Forno a Lenha");
    expect(data.transcription.category).toBe("Gastronomia & Alimentos");
    expect(data.transcription.sections.subjectTemplate).toContain("{{produto}}");
    expect(data.transcription.sections.lighting).toContain("Brilho quente do fogo");
    expect(data.transcription.triggerKeywords).toContain("pizza");
  });
});
