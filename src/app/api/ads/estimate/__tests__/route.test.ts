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
    adAccountId: "act_123456",
  }),
}));

global.fetch = vi.fn();

describe("POST /api/ads/estimate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should calculate real delivery estimate from Meta API", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          {
            users_lower_bound: 25000,
            users_upper_bound: 35000,
            estimate_dau: 5000,
            estimate_mau: 30000,
            daily_outcomes_curve: [
              {
                spend: 1500,
                reach: 3200,
                actions: 65,
              },
            ],
          },
        ],
      }),
    });

    const req = new NextRequest("http://localhost:3000/api/ads/estimate", {
      method: "POST",
      body: JSON.stringify({
        latitude: -23.5505,
        longitude: -46.6333,
        radiusKm: 5,
        ageMin: 18,
        ageMax: 50,
        gender: "all",
        interests: [{ id: "6003668857118", name: "Pizza" }],
        dailyBudget: 20,
        objective: "REACH",
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.isRealMeta).toBe(true);
    expect(data.minReach).toBeGreaterThan(0);
    expect(data.maxReach).toBeGreaterThan(data.minReach);
  });
});
