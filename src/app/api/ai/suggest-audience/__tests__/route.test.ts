import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";
import { NextRequest } from "next/server";

vi.mock("@/lib/firebase-admin", () => ({
  getUidFromCookie: vi.fn().mockResolvedValue("test-user-123"),
}));

vi.mock("@/lib/services/meta-service-admin", () => ({
  getMetaConnectionAdmin: vi.fn().mockResolvedValue({
    isConnected: true,
    accessToken: "mock-token",
  }),
}));

global.fetch = vi.fn();

describe("POST /api/ai/suggest-audience", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return default fallback audience when Gemini fails or returns malformed response", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      text: async () => "Error",
    });

    const req = new NextRequest("http://localhost:3000/api/ai/suggest-audience", {
      method: "POST",
      body: JSON.stringify({
        postText: "Promoção de pizza brotinho!",
        businessAddress: "São Paulo, SP",
        objective: "MESSAGES",
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.audience).toBeDefined();
    expect(data.audience.ageMin).toBeDefined();
    expect(data.audience.ageMax).toBeDefined();
    expect(data.audience.interests).toBeDefined();
  });

  it("should parse Gemini JSON response and return audience recommendations", async () => {
    const mockGeminiResponse = {
      audience: {
        ageMin: 22,
        ageMax: 50,
        radiusKm: 10,
        interests: "Gastronomia, Pizza, Delivery",
        suggestedBudgetDaily: 15,
        suggestedDurationDays: 4,
        explanation: "Público ideal para pedidos de pizza no WhatsApp na sua região.",
        ctaType: "WHATSAPP_MESSAGE",
      },
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify(mockGeminiResponse) }],
            },
          },
        ],
      }),
    });

    const req = new NextRequest("http://localhost:3000/api/ai/suggest-audience", {
      method: "POST",
      body: JSON.stringify({
        postText: "Deliciosa pizza artesanal com 20% de desconto hoje!",
        businessAddress: "Campinas, SP",
        objective: "MESSAGES",
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.audience.ageMin).toBe(22);
    expect(data.audience.interests).toContain("Gastronomia");
    expect(data.audience.ctaType).toBe("WHATSAPP_MESSAGE");
  });
});
