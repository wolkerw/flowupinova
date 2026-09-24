import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "../route";

vi.mock("@/lib/admin-auth", () => ({
  validateAdminToken: vi.fn(async (token: string | null) => {
    if (token === "valid-admin-token") {
      return { uid: "admin1", email: "admin@numvapt.com.br" };
    }
    return null;
  }),
}));

vi.mock("@/lib/services/system-ai-config-service", () => {
  let mockConfig = {
    generalPlannerModel: "gpt-5",
    generalImageModel: "gpt-image-2",
    generalFallbackImageModel: "gemini-2.5-flash-image",
    chatModel: "gemini-2.5-flash",
    promptsIdeaModel: "gemini-2.5-flash",
  };
  return {
    getAIModelsConfig: vi.fn(async () => mockConfig),
    updateAIModelsConfig: vi.fn(async (payload: any, email?: string) => {
      mockConfig = { ...mockConfig, ...payload, updatedBy: email };
      return mockConfig;
    }),
    AVAILABLE_AI_MODELS: {
      planners: [{ id: "gpt-5", label: "GPT-5", provider: "openai" }],
      imageGenerators: [{ id: "gpt-image-2", label: "GPT Image 2", provider: "openai" }],
      chatAssistants: [{ id: "gemini-2.5-flash", label: "Gemini 2.5", provider: "google" }],
      promptGenerators: [{ id: "gemini-2.5-flash", label: "Gemini 2.5", provider: "google" }],
    },
    DEFAULT_AI_MODELS_CONFIG: {
      generalPlannerModel: "gpt-5",
      generalImageModel: "gpt-image-2",
      generalFallbackImageModel: "gemini-2.5-flash-image",
      chatModel: "gemini-2.5-flash",
      promptsIdeaModel: "gemini-2.5-flash",
    },
  };
});

describe("Admin AI Models API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve retornar 403 se o usuário não for admin no GET", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/configuracoes/modelos");
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it("deve retornar as configurações e opções se o usuário for admin no GET", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/configuracoes/modelos", {
      headers: {
        cookie: "firebase-id-token=valid-admin-token",
      },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.config.generalPlannerModel).toBe("gpt-5");
    expect(data.availableOptions).toBeDefined();
  });

  it("deve salvar nova configuração no POST se o usuário for admin", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/configuracoes/modelos", {
      method: "POST",
      headers: {
        cookie: "firebase-id-token=valid-admin-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        generalPlannerModel: "gpt-4o",
        generalImageModel: "gemini-2.5-flash-image",
        imageQuality: "low",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.config.generalPlannerModel).toBe("gpt-4o");
    expect(data.config.generalImageModel).toBe("gemini-2.5-flash-image");
    expect(data.config.imageQuality).toBe("low");
  });
});
