import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockRequireUser } = vi.hoisted(() => ({
  mockRequireUser: vi.fn(async () => ({ uid: "test-user-uid", email: "test@example.com" })),
}));
vi.mock("@/lib/api-auth", () => ({ requireUser: mockRequireUser }));
import { POST } from "../analyze/route";

describe("POST /api/competitors/analyze", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna erro 400 se o nome do concorrente não for enviado", async () => {
    const req = new Request("http://localhost/api/competitors/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("O nome do concorrente ou referência é obrigatório.");
  });

  it("retorna o relatório de inteligência com o que deu certo e oportunidades", async () => {
    const req = new Request("http://localhost/api/competitors/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        competitorName: "Concorrente Exemplo",
        type: "direct_competitor",
        website: "https://exemplo.com.br",
        socialMedia: "@concorrente_exemplo",
        userBusinessContext: {
          name: "NumVapt",
          category: "Marketing Digital com IA",
          description: "Plataforma completa de criação e agendamento de posts",
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.report).toBeDefined();
    expect(Array.isArray(data.report.whatWorkedWell)).toBe(true);
    expect(Array.isArray(data.report.gapsAndOpportunities)).toBe(true);
    expect(Array.isArray(data.report.winningContentIdeas)).toBe(true);
    expect(data.report.benchmarkScores).toBeDefined();
  });
});
