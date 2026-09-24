import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../gerar/route";
import { NextRequest } from "next/server";

vi.mock("jimp", () => ({
  Jimp: {
    read: vi.fn().mockResolvedValue({
      width: 1080,
      height: 1350,
      crop: vi.fn(),
      resize: vi.fn(),
      getBuffer: vi.fn().mockResolvedValue(Buffer.from("processed-image-bytes")),
    }),
  },
}));

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
    global.fetch = vi.fn().mockImplementation((url) => {
      const urlStr = String(url);
      if (urlStr.includes("chat/completions")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    schemaVersion: "1.0",
                    confidence: 0.95,
                    needsClarification: false,
                    interpretation: { goal: "commercial", subject: "café" },
                    visualPlan: { scene: "cafeteria" },
                    imagePrompt: "Fotografia de café especial em xícara artesanal [SAFE MARGINS MANDATE: 20%]",
                    negativePrompt: "blurry",
                  }),
                },
              },
            ],
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          data: [{ b64_json: Buffer.from("fake-image-bytes").toString("base64") }],
        }),
      });
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

  it("aplica diretivas de infográfico publicitário e slogan no prompt compilado", async () => {
    let capturedPrompt = "";
    global.fetch = vi.fn().mockImplementation((url, options) => {
      if (options && options.body) {
        try {
          const parsed = JSON.parse(options.body as string);
          if (parsed.prompt) {
            capturedPrompt = parsed.prompt;
          }
        } catch {}
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          data: [{ b64_json: Buffer.from("fake-infographic-image").toString("base64") }],
        }),
      });
    });

    const req = new NextRequest("http://localhost:9002/api/imagens/gerar", {
      method: "POST",
      body: JSON.stringify({
        brief: "Crie um post publicitário para o novo espresso aromático",
        format: "square",
        quantity: 1,
        style: "photographic",
        textOverlayMode: "INFOGRAPHIC",
        productHeadline: "O MELHOR CAFÉ DA CIDADE",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);

    // Verifica que o prompt para o modelo de imagem recebeu as diretivas de infográfico
    expect(capturedPrompt).toContain("O MELHOR CAFÉ DA CIDADE");
    expect(capturedPrompt).toContain("DYNAMIC & CONTEXTUAL INFOGRAPHIC");
  });

  it("injeta cores, diretrizes da marca e personas no prompt quando useBrandKit é true", async () => {
    let capturedPrompt = "";
    global.fetch = vi.fn().mockImplementation((url, options) => {
      if (options && options.body) {
        try {
          const parsed = JSON.parse(options.body as string);
          if (parsed.prompt) capturedPrompt = parsed.prompt;
        } catch {}
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          data: [{ b64_json: Buffer.from("fake-brand-image").toString("base64") }],
        }),
      });
    });

    const req = new NextRequest("http://localhost:9002/api/imagens/gerar", {
      method: "POST",
      body: JSON.stringify({
        brief: "Foto de perfil executiva para meu negócio",
        objective: "personal",
        format: "portrait",
        quantity: 1,
        useBrandKit: true,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(capturedPrompt).toContain("INTEGRAÇÃO BRANDKIT & IDENTIDADE");
    expect(capturedPrompt).toContain("Personal Branding / Foto de Perfil Executiva");
  });

  it("prioriza gpt-image-2 mesmo quando houver foto/logomarca e registra modelUsed no Firestore", async () => {
    process.env.GEMINI_API_KEY = "test-gemini-key";
    process.env.OPENAI_API_KEY = "test-openai-key";

    let openAiCalled = false;
    let openAiPayload: any = null;

    global.fetch = vi.fn().mockImplementation((url, options) => {
      const urlStr = String(url);
      if (urlStr.includes("http://example.com/logo.png")) {
        return Promise.resolve({
          ok: true,
          headers: new Headers({ "content-type": "image/png" }),
          arrayBuffer: async () => Buffer.from("fake-png-logo-bytes"),
        });
      }
      if (urlStr.includes("api.openai.com/v1/images/generations")) {
        openAiCalled = true;
        if (options && options.body) {
          try {
            openAiPayload = JSON.parse(options.body as string);
          } catch {}
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: [{ b64_json: Buffer.from("generated-openai-image").toString("base64") }],
          }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({ data: [{ b64_json: "" }] }),
      });
    });

    const req = new NextRequest("http://localhost:9002/api/imagens/gerar", {
      method: "POST",
      body: JSON.stringify({
        brief: "Crie uma arte cartoon para a NumVapt usando a logomarca oficial enviada",
        sourceAssetUrls: ["http://example.com/logo.png"],
        format: "portrait",
        quantity: 1,
        useBrandKit: true,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(openAiCalled).toBe(true);
    expect(openAiPayload.model).toBe("gpt-image-2");
    expect(openAiPayload.size).toBe("1024x1280"); // Proporção nativa 4:5 exata para a OpenAI
    expect(openAiPayload.prompt).toContain("FORMATO E ENQUADRAMENTO VERTICAL MANDATÓRIO — FEED RETRATO 4:5");
    expect(openAiPayload.prompt).toContain("ZERO TEXT CROPPING & SAFE MARGINS");
    expect(openAiPayload.prompt).toContain("ZERO LOGOS");
    expect(openAiPayload.prompt).toContain("SUJEITO REAL DA ETAPA 5");

    const data = await res.json();
    expect(data.assets[0].modelUsed).toBe("gpt-image-2");
    expect(data.assets[0].promptMetadata.modelUsed).toBe("gpt-image-2");
  });

  it("executa fallback para Google Gemini Multimodal se a OpenAI falhar e anexa imagem em parts", async () => {
    process.env.GEMINI_API_KEY = "test-gemini-key";
    process.env.OPENAI_API_KEY = "test-openai-key";

    let geminiCalled = false;
    let geminiPayload: any = null;

    global.fetch = vi.fn().mockImplementation((url, options) => {
      const urlStr = String(url);
      if (urlStr.includes("http://example.com/logo.png")) {
        return Promise.resolve({
          ok: true,
          headers: new Headers({ "content-type": "image/png" }),
          arrayBuffer: async () => Buffer.from("fake-png-logo-bytes"),
        });
      }
      if (urlStr.includes("api.openai.com/v1/images/generations")) {
        // Simular falha da OpenAI para forçar fallback sem atraso de retry
        return Promise.resolve({
          ok: false,
          status: 400,
          text: async () => "OpenAI client error",
        });
      }
      if (urlStr.includes("generativelanguage.googleapis.com")) {
        geminiCalled = true;
        if (options && options.body) {
          try {
            geminiPayload = JSON.parse(options.body as string);
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
                      inlineData: {
                        mimeType: "image/png",
                        data: Buffer.from("generated-gemini-image").toString("base64"),
                      },
                    },
                  ],
                },
              },
            ],
          }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({ data: [{ b64_json: "" }] }),
      });
    });

    const req = new NextRequest("http://localhost:9002/api/imagens/gerar", {
      method: "POST",
      body: JSON.stringify({
        brief: "Crie uma arte cartoon para a NumVapt usando a logomarca oficial enviada",
        sourceAssetUrls: ["http://example.com/logo.png"],
        format: "portrait",
        quantity: 1,
        useBrandKit: true,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(geminiCalled).toBe(true);
    expect(geminiPayload).toBeDefined();
    // Verifica que Gemini recebeu tanto o prompt quanto a imagem nos parts
    const parts = geminiPayload.contents[0].parts;
    expect(parts.length).toBeGreaterThanOrEqual(2);
    expect(parts[0].text).toContain("ZERO LOGOS");
    expect(parts[0].text).toContain("HERO SUBJECT PRESERVATION");
    expect(parts[1].inlineData).toBeDefined();
    expect(parts[1].inlineData.mimeType).toBe("image/png");
    expect(parts[1].inlineData.data).toBe(Buffer.from("fake-png-logo-bytes").toString("base64"));

    const data = await res.json();
    expect(data.assets[0].modelUsed).toBe("gemini-2.5-flash-image");
  });
});

