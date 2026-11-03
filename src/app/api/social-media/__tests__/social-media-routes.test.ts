import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockSet = vi.fn().mockResolvedValue(undefined);
const mockGetDoc = vi.fn();

vi.mock("@/lib/firebase-admin", () => ({
  verifyIdToken: vi.fn().mockResolvedValue({ uid: "user_test_123" }),
  getUidFromCookie: vi.fn().mockResolvedValue("user_test_123"),
  adminDb: {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        collection: vi.fn((colName: string) => ({
          doc: vi.fn((docId: string) => ({
            get: () => mockGetDoc(colName, docId),
            set: mockSet,
          })),
        })),
      })),
    })),
  },
}));

import { POST as auditPost } from "../audit/route";
import { POST as orchestratePost } from "../orchestrate/route";

describe("Social Media API Routes (Audit & Orchestrate)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna erro 400 NOT_CONNECTED quando Instagram e Meta não estão conectados", async () => {
    mockGetDoc.mockImplementation(async () => ({
      exists: false,
      data: () => null,
    }));

    const req = new NextRequest("http://localhost:3000/api/social-media/audit", {
      method: "POST",
      body: JSON.stringify({ userId: "user_test_123" }),
    });

    const res = await auditPost(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.code).toBe("NOT_CONNECTED");
  });

  it("executa auditoria via API com sucesso quando a conta do Instagram está conectada", async () => {
    mockGetDoc.mockImplementation(async (colName: string, docId: string) => {
      if (colName === "connections" && docId === "instagram") {
        return {
          exists: true,
          data: () => ({
            isConnected: true,
            accessToken: "ig_valid_token",
            instagramUsername: "clinica_exemplo",
          }),
        };
      }
      if (colName === "business" && docId === "onboarding") {
        return {
          exists: true,
          data: () => ({
            name: "Clínica Exemplo",
            category: "Estética e Saúde",
            description: "Especialistas em estética avançada",
            targetAudience: "Mulheres 25-50 anos",
          }),
        };
      }
      return { exists: false, data: () => null };
    });

    const globalFetchSpy = vi.spyOn(global, "fetch").mockImplementation(async (input: any) => {
      const url = String(input);
      if (url.includes("graph.instagram.com/me?")) {
        return new Response(
          JSON.stringify({
            id: "12345",
            username: "clinica_exemplo",
            name: "Clínica Exemplo",
            biography: "Estética Avançada | Agende pelo link",
            website: "https://clinicaexemplo.com.br",
            followers_count: 2500,
            media_count: 42,
          }),
          { status: 200 }
        );
      }
      if (url.includes("graph.instagram.com/me/media")) {
        return new Response(
          JSON.stringify({
            data: [
              {
                id: "post_1",
                caption: "Resultado incrível de harmonização!",
                media_type: "VIDEO",
                timestamp: new Date().toISOString(),
                like_count: 85,
                comments_count: 14,
              },
              {
                id: "post_2",
                caption: "3 cuidados essenciais com a pele no inverno",
                media_type: "CAROUSEL_ALBUM",
                timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
                like_count: 62,
                comments_count: 9,
              },
            ],
          }),
          { status: 200 }
        );
      }
      if (url.includes("/insights")) {
        return new Response(
          JSON.stringify({
            data: [
              { name: "reach", values: [{ value: 950 }] },
              { name: "saved", values: [{ value: 22 }] },
              { name: "total_interactions", values: [{ value: 121 }] },
            ],
          }),
          { status: 200 }
        );
      }
      return new Response(JSON.stringify({}), { status: 400 });
    });

    const req = new NextRequest("http://localhost:3000/api/social-media/audit", {
      method: "POST",
      body: JSON.stringify({ userId: "user_test_123" }),
    });

    const res = await auditPost(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.report.username).toBe("@clinica_exemplo");
    expect(json.report.metrics.totalAnalyzedPosts).toBe(2);
    expect(json.report.metrics.formatBreakdown.video).toBe(1);
    expect(json.report.metrics.formatBreakdown.carousel).toBe(1);
    expect(mockSet).toHaveBeenCalled();

    globalFetchSpy.mockRestore();
  });

  it("orquestra uma campanha respeitando a constância semanal e a duração solicitada", async () => {
    mockGetDoc.mockImplementation(async (colName: string, docId: string) => {
      if (colName === "social_audits" && docId === "latest") {
        return {
          exists: true,
          data: () => ({
            username: "@clinica_exemplo",
            accountName: "Clínica Exemplo",
            overallScore: 78,
            bottlenecks: ["Poucos Reels"],
            metrics: {
              bestHoursToPost: ["12:30", "19:00"],
              bestPerformingFormat: "Reels / Vídeo",
            },
          }),
        };
      }
      if (colName === "business" && docId === "onboarding") {
        return {
          exists: true,
          data: () => ({
            name: "Clínica Exemplo",
            category: "Estética e Saúde",
          }),
        };
      }
      return { exists: false, data: () => null };
    });

    const req = new NextRequest("http://localhost:3000/api/social-media/orchestrate", {
      method: "POST",
      body: JSON.stringify({
        userId: "user_test_123",
        objective: "sales_launch",
        frequencyPerWeek: 3,
        durationWeeks: 2,
        preferredDays: ["Terça-feira", "Quinta-feira", "Sábado"],
        customThemeOrOffer: "Semana do Botox Preventivo",
      }),
    });

    const res = await orchestratePost(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.campaign.frequencyPerWeek).toBe(3);
    expect(json.campaign.durationWeeks).toBe(2);
    expect(json.campaign.posts).toHaveLength(6); // 3x na semana * 2 semanas = 6 posts
    expect(json.campaign.posts[0].storiesSequence.length).toBeGreaterThanOrEqual(4);
    expect(json.campaign.posts[0].directSellingScript.triggerKeyword).toBeTruthy();
    expect(json.campaign.posts[0].reelsScript.hook).toBeTruthy();
    expect(mockSet).toHaveBeenCalled();
  });
});
