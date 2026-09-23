import { describe, it, expect, vi, beforeEach } from "vitest";
import { BriefNormalizer } from "../BriefNormalizer";
import { BrandContextBuilder } from "../BrandContextBuilder";
import { ReferenceContextBuilder } from "../ReferenceContextBuilder";
import { Gpt5PromptPlanner } from "../Gpt5PromptPlanner";
import { ImageModelExecutor } from "../ImageModelExecutor";
import { ImageResultValidator } from "../ImageResultValidator";
import { ImageGenerationOrchestrator } from "../index";

vi.mock("jimp", () => ({
  Jimp: {
    read: vi.fn().mockResolvedValue({
      width: 1080,
      height: 1350,
      resize: vi.fn(),
      getBuffer: vi.fn().mockResolvedValue(Buffer.from("processed-image-data")),
    }),
  },
}));

vi.mock("@/lib/firebase-admin", () => {
  const mockSet = vi.fn().mockResolvedValue(undefined);
  const mockDoc = {
    set: mockSet,
    get: vi.fn().mockResolvedValue({
      exists: true,
      data: () => ({
        name: "NumVapt Test",
        primaryColor: "#0083C7",
        secondaryColor: "#FA6305",
        brandKit: { visualGuidelines: "Estilo limpo e moderno" },
      }),
    }),
  };

  return {
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

describe("Image Orchestrator Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("BriefNormalizer", () => {
    it("limpa espaços extras e extrai headline entre aspas", () => {
      const res = BriefNormalizer.normalize({
        rawBrief: '  Um novo produto "Super Oferta Relâmpago" com café   ',
      });
      expect(res.cleanedBrief).toBe('Um novo produto "Super Oferta Relâmpago" com café');
      expect(res.explicitHeadline).toBe("Super Oferta Relâmpago");
    });

    it("detecta modo infográfico automaticamente se houver palavra-chave", () => {
      const res = BriefNormalizer.normalize({
        rawBrief: "Infográfico comparativo sobre energia solar sustentável",
      });
      expect(res.requestedTextOverlayMode).toBe("INFOGRAPHIC");
    });
  });

  describe("BrandContextBuilder", () => {
    it("retorna contexto vazio quando useBrandKit é false", async () => {
      const brand = await BrandContextBuilder.build("user-1", false);
      expect(brand.enabled).toBe(false);
      expect(brand.businessName).toBe("");
    });

    it("carrega cores e diretrizes da marca quando useBrandKit é true", async () => {
      const brand = await BrandContextBuilder.build("user-1", true, {
        name: "Minha Empresa",
        primaryColor: "#123456",
        secondaryColor: "#654321",
      });
      expect(brand.enabled).toBe(true);
      expect(brand.businessName).toBe("Minha Empresa");
      expect(brand.primaryColors).toContain("#123456");
      expect(brand.secondaryColors).toContain("#654321");
    });
  });

  describe("ReferenceContextBuilder", () => {
    it("adiciona logo oficial da NumVapt se for o caso", async () => {
      const refs = await ReferenceContextBuilder.buildReferences({
        businessName: "NumVapt Soluções",
        brief: "Crie um post publicitário para a NumVapt",
      });
      // Verifica que o builder roda sem erros
      expect(Array.isArray(refs)).toBe(true);
    });
  });

  describe("Gpt5PromptPlanner", () => {
    it("gera plano com GPT-5 estruturado ou fallback determinístico garantindo safe margins", async () => {
      const planResult = await Gpt5PromptPlanner.plan({
        userBrief: "Café especial aromático",
        objective: "commercial",
        format: "portrait",
        width: 1080,
        height: 1350,
        quantity: 1,
        stylePreference: "photographic",
        useBrandKit: true,
        brandKit: {
          enabled: true,
          businessName: "NumVapt",
          primaryColors: ["#0083C7"],
          secondaryColors: ["#FA6305"],
          accentColors: ["#FFFFFF"],
          restrictions: [],
          hasLocalOfficialLogo: true,
        },
      });

      expect(planResult.plannerModelUsed).toBeDefined();
      expect(planResult.visualPlan).toBeDefined();
      expect(planResult.compiledImagePrompt).toContain("SAFE MARGINS");
      expect(planResult.compiledImagePrompt).toContain("15% to 20%");
    });
  });

  describe("ImageModelExecutor", () => {
    it("chama OpenAI com dimensões nativas para portrait (1024x1280)", async () => {
      process.env.OPENAI_API_KEY = "test-key";
      let capturedBody: any = null;

      global.fetch = vi.fn().mockImplementation((url, opts) => {
        if (opts && opts.body) {
          capturedBody = JSON.parse(opts.body as string);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: [{ b64_json: Buffer.from("fake-b64-image").toString("base64") }],
          }),
        });
      });

      const res = await ImageModelExecutor.execute({
        prompt: "Commercial coffee ad",
        format: "portrait",
        preferredModel: "gpt-image-2",
      });

      expect(res.modelUsed).toBe("gpt-image-2");
      expect(capturedBody.size).toBe("1024x1280");
      expect(res.imageBuffer).toBeDefined();
    });
  });

  describe("ImageResultValidator", () => {
    it("redimensiona para as dimensões alvo via Jimp", async () => {
      const result = await ImageResultValidator.validateAndNormalize(
        Buffer.from("dummy-image-data-for-testing-purposes-1234567890"),
        "portrait"
      );
      expect(result.width).toBe(1080);
      expect(result.height).toBe(1350);
      expect(result.buffer).toBeDefined();
    });
  });

  describe("ImageGenerationOrchestrator End-to-End", () => {
    it("executa a orquestração completa em 2 etapas com telemetria", async () => {
      process.env.OPENAI_API_KEY = "test-key";

      global.fetch = vi.fn().mockImplementation((url, opts) => {
        const urlStr = String(url);
        if (urlStr.includes("api.openai.com/v1/chat/completions")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      schemaVersion: "1.0",
                      confidence: 0.98,
                      needsClarification: false,
                      interpretation: { goal: "commercial", subject: "Café especial" },
                      visualPlan: { scene: "Estúdio moderno" },
                      imagePrompt: "Rich 10-block prompt for coffee [SAFE MARGINS MANDATE: 20%]",
                      negativePrompt: "blurry, cropped text",
                    }),
                  },
                },
              ],
            }),
          });
        }
        if (urlStr.includes("api.openai.com/v1/images/generations")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              data: [{ b64_json: Buffer.from("final-rendered-image-bytes").toString("base64") }],
            }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });

      const res = await ImageGenerationOrchestrator.execute({
        userId: "user-123",
        generationId: "gen-456",
        assetId: "asset-789",
        rawBrief: "Xícara de cappuccino com arte latte",
        format: "portrait",
      });

      expect(res.plannerModelUsed).toBe("gpt-5");
      expect(res.imageModelUsed).toBe("gpt-image-2");
      expect(res.width).toBe(1080);
      expect(res.height).toBe(1350);
      expect(res.planResult.visualPlan).toBeDefined();
    });
  });
});
