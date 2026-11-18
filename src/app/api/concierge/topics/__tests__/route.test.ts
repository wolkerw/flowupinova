import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "../route";
import { NextRequest } from "next/server";

vi.mock("@/lib/api-auth", () => ({
  getAuthenticatedUser: vi.fn(),
}));

const mockDocGet = vi.fn();
const mockDocSet = vi.fn().mockResolvedValue(undefined);
const mockDocUpdate = vi.fn().mockResolvedValue(undefined);

const mockDoc = vi.fn().mockReturnValue({
  get: mockDocGet,
  set: mockDocSet,
  update: mockDocUpdate,
  collection: (...args: any[]) => mockCollection(...args),
});

const mockWhereGet = vi.fn().mockResolvedValue({ empty: true, docs: [] });
const mockWhere = vi.fn().mockReturnValue({
  limit: vi.fn().mockReturnValue({
    get: mockWhereGet,
  }),
});

const mockCollection = vi.fn().mockReturnValue({
  doc: mockDoc,
  where: mockWhere,
});

vi.mock("@/lib/firebase-admin", () => ({
  adminDb: {
    collection: (...args: any[]) => mockCollection(...args),
  },
}));

import { getAuthenticatedUser } from "@/lib/api-auth";

describe("API /api/concierge/topics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("retorna 401 para usuário não autenticado", async () => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue(null);

      const req = new NextRequest("http://localhost:9002/api/concierge/topics?month=2026-11");
      const res = await GET(req);

      expect(res.status).toBe(401);
    });

    it("retorna objeto vazio padronizado quando não há tópicos salvos para o mês", async () => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue({
        uid: "user-creator-1",
        email: "gestor@agencia.com",
      } as any);

      // user doc
      mockDocGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({ plan: "tudo_pronto" }),
      });

      // topics doc
      mockDocGet.mockResolvedValueOnce({
        exists: false,
        data: () => undefined,
      });

      const req = new NextRequest("http://localhost:9002/api/concierge/topics?month=2026-11");
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.topics.month).toBe("2026-11");
      expect(json.topics.week1).toBe("");
      expect(json.topics.week2).toBe("");
      expect(json.topics.week3).toBe("");
      expect(json.topics.week4).toBe("");
    });

    it("retorna os tópicos salvos quando o documento existe no Firestore", async () => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue({
        uid: "user-creator-1",
        email: "gestor@agencia.com",
      } as any);

      // user doc
      mockDocGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({ plan: "tudo_pronto" }),
      });

      // topics doc
      mockDocGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          month: "2026-11",
          week1: "Tema da semana 1: Lançamento",
          week2: "Tema da semana 2: Prova social",
          week3: "Tema da semana 3: Dúvidas frequentes",
          week4: "Tema da semana 4: Promoção especial",
          notes: "Focar em público corporativo",
          updatedAt: "2026-11-18T12:00:00.000Z",
          updatedBy: "cliente@empresa.com",
          updatedByRole: "client_approver",
        }),
      });

      const req = new NextRequest("http://localhost:9002/api/concierge/topics?month=2026-11");
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.topics.week1).toBe("Tema da semana 1: Lançamento");
      expect(json.topics.week2).toBe("Tema da semana 2: Prova social");
      expect(json.topics.week3).toBe("Tema da semana 3: Dúvidas frequentes");
      expect(json.topics.week4).toBe("Tema da semana 4: Promoção especial");
      expect(json.topics.notes).toBe("Focar em público corporativo");
    });

    it("resolve workspace vinculado corretamente para o cliente aprovador", async () => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue({
        uid: "approver-uid-99",
        email: "cliente@aprovador.com",
      } as any);

      // user doc do aprovador
      mockDocGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          conciergeRole: "client_approver",
          linkedWorkspaceId: "creator-workspace-123",
        }),
      });

      // topics doc no workspace do criador
      mockDocGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          month: "2026-11",
          week1: "Semana 1 aprovador",
          week2: "",
          week3: "",
          week4: "",
        }),
      });

      const req = new NextRequest("http://localhost:9002/api/concierge/topics?month=2026-11");
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.targetWorkspaceId).toBe("creator-workspace-123");
      expect(json.isApprover).toBe(true);
      expect(json.topics.week1).toBe("Semana 1 aprovador");
    });
  });

  describe("POST", () => {
    it("retorna 401 para usuário não autenticado", async () => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue(null);

      const req = new NextRequest("http://localhost:9002/api/concierge/topics", {
        method: "POST",
        body: JSON.stringify({ month: "2026-11", week1: "Assunto 1" }),
      });
      const res = await POST(req);

      expect(res.status).toBe(401);
    });

    it("retorna 400 se o mês não for informado ou for inválido", async () => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue({
        uid: "user-1",
        email: "teste@numvapt.com",
      } as any);

      const req = new NextRequest("http://localhost:9002/api/concierge/topics", {
        method: "POST",
        body: JSON.stringify({ month: "mes-invalido", week1: "Assunto 1" }),
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
    });

    it("salva os tópicos das 4 semanas com sucesso no Firestore", async () => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue({
        uid: "approver-uid-1",
        email: "cliente@aprovador.com",
      } as any);

      // user doc
      mockDocGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          conciergeRole: "client_approver",
          linkedWorkspaceId: "creator-1",
        }),
      });

      mockDocSet.mockResolvedValueOnce(undefined);

      const req = new NextRequest("http://localhost:9002/api/concierge/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: "2026-11",
          week1: "Semana 1: Black Friday Antecipada",
          week2: "Semana 2: Destaque de Produto X",
          week3: "Semana 3: Depoimento de Clientes",
          week4: "Semana 4: Últimos dias da promoção",
          notes: "Usar fotos reais da loja",
        }),
      });
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.topics.week1).toBe("Semana 1: Black Friday Antecipada");
      expect(json.topics.week2).toBe("Semana 2: Destaque de Produto X");
      expect(json.topics.week3).toBe("Semana 3: Depoimento de Clientes");
      expect(json.topics.week4).toBe("Semana 4: Últimos dias da promoção");
      expect(json.topics.notes).toBe("Usar fotos reais da loja");
      expect(json.topics.updatedBy).toBe("cliente@aprovador.com");
      expect(json.topics.updatedByRole).toBe("client_approver");
    });
  });
});
