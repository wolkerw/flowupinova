import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../route";
import { NextRequest } from "next/server";

vi.mock("@/lib/firebase-admin", () => ({
  getUidFromCookie: vi.fn().mockResolvedValue("test-user-123"),
}));

vi.mock("@/lib/services/meta-service-admin", () => ({
  getMetaConnectionAdmin: vi.fn().mockResolvedValue({
    isConnected: true,
    accessToken: "mock-meta-token",
    adAccountId: "act_123456",
  }),
}));

global.fetch = vi.fn();

describe("GET /api/ads/interests/suggestions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return category-based suggestions when no interest is selected", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          { id: "101", name: "Hambúrguer", type: "interests" },
          { id: "102", name: "Pizza", type: "interests" },
        ],
      }),
    });

    const req = new NextRequest("http://localhost:3000/api/ads/interests/suggestions?category=alimentacao");
    const res = await GET(req);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(Array.isArray(data.suggestions)).toBe(true);
    expect(data.suggestions.length).toBeGreaterThan(0);
  });

  it("should call adinterestsuggestion when interests are selected", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          { id: "201", name: "Batata frita", type: "interests" },
          { id: "202", name: "Refrigerante", type: "interests" },
        ],
      }),
    });

    const req = new NextRequest("http://localhost:3000/api/ads/interests/suggestions?category=alimentacao&selected=Pizza");
    const res = await GET(req);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.suggestions.some((s: any) => s.name === "Batata frita")).toBe(true);
  });
});
