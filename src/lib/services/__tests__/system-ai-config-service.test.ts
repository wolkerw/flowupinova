import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock do Firebase Admin
vi.mock("@/lib/firebase-admin", () => {
  let store: Record<string, any> = {};
  return {
    adminDb: {
      collection: (colName: string) => ({
        doc: (docId: string) => ({
          get: vi.fn(async () => ({
            exists: !!store[`${colName}/${docId}`],
            data: () => store[`${colName}/${docId}`],
          })),
          set: vi.fn(async (data: any, options?: { merge?: boolean }) => {
            if (options?.merge && store[`${colName}/${docId}`]) {
              store[`${colName}/${docId}`] = { ...store[`${colName}/${docId}`], ...data };
            } else {
              store[`${colName}/${docId}`] = data;
            }
            return { writeTime: new Date() };
          }),
        }),
      }),
      _resetStore: () => {
        store = {};
      },
    },
  };
});

describe("SystemAIConfigService", () => {
  beforeEach(async () => {
    vi.resetModules();
    const { adminDb } = await import("@/lib/firebase-admin");
    (adminDb as any)._resetStore();
  });

  it("deve retornar a configuração padrão quando o documento não existe", async () => {
    const { getAIModelsConfig, DEFAULT_AI_MODELS_CONFIG } = await import(
      "../system-ai-config-service"
    );

    const config = await getAIModelsConfig();
    expect(config.generalPlannerModel).toBe(DEFAULT_AI_MODELS_CONFIG.generalPlannerModel);
    expect(config.generalImageModel).toBe(DEFAULT_AI_MODELS_CONFIG.generalImageModel);
    expect(config.generalFallbackImageModel).toBe(DEFAULT_AI_MODELS_CONFIG.generalFallbackImageModel);
    expect(config.chatModel).toBe(DEFAULT_AI_MODELS_CONFIG.chatModel);
    expect(config.promptsIdeaModel).toBe(DEFAULT_AI_MODELS_CONFIG.promptsIdeaModel);
  });

  it("deve salvar nova configuração e atualizar o cache", async () => {
    const { getAIModelsConfig, updateAIModelsConfig } = await import(
      "../system-ai-config-service"
    );

    await updateAIModelsConfig(
      {
        generalPlannerModel: "gpt-5",
        generalImageModel: "gemini-3-pro-image",
      },
      "admin@numvapt.com.br"
    );

    const updated = await getAIModelsConfig();
    expect(updated.generalPlannerModel).toBe("gpt-5");
    expect(updated.generalImageModel).toBe("gemini-3-pro-image");
    expect(updated.updatedBy).toBe("admin@numvapt.com.br");
    expect(updated.updatedAt).toBeDefined();
  });
});
