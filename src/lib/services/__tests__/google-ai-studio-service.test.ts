import { describe, it, expect, vi, beforeEach } from "vitest";
import { getGoogleAIStudioRealStats } from "../google-ai-studio-service";

vi.mock("@/lib/firebase-admin", () => ({
  adminDb: {
    collection: vi.fn().mockReturnValue({
      get: vi.fn().mockResolvedValue({
        docs: [
          {
            data: () => ({
              provider: "google_gemini",
              model: "gemini-1.5-flash",
              type: "chat",
              costUsd: 0.0015,
              tokens: {
                promptTokens: 1000,
                completionTokens: 250,
                totalTokens: 1250,
              },
            }),
          },
          {
            data: () => ({
              provider: "google_gemini",
              model: "imagen-3.0-generate-002",
              type: "image_generation",
              costUsd: 0.03,
              tokens: {
                promptTokens: 0,
                completionTokens: 0,
                totalTokens: 0,
              },
            }),
          },
        ],
      }),
    }),
  },
}));

global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({
    models: [
      { name: "models/gemini-2.5-flash" },
      { name: "models/gemini-2.0-flash" },
    ],
  }),
});

describe("Google AI Studio Service", () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-gemini-key";
  });

  it("fetches Google AI Studio real stats and model aggregation correctly", async () => {
    const stats = await getGoogleAIStudioRealStats(30);

    expect(stats.connected).toBe(true);
    expect(stats.availableModelsCount).toBe(2);
    expect(stats.totalRequests).toBe(2);
    expect(stats.totalPromptTokens).toBe(1000);
    expect(stats.totalCompletionTokens).toBe(250);
    expect(stats.totalImagesGenerated).toBe(1);
    expect(stats.totalCostUsd).toBeCloseTo(0.0315);
    expect(stats.selectedPeriodDays).toBe(30);
    expect(stats.modelsUsage.length).toBe(2);
  });
});
