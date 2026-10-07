import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST, DELETE } from "../route";
import { NextRequest } from "next/server";

vi.mock("@/lib/api-auth", () => ({
  getAuthenticatedUser: vi.fn(),
}));

vi.mock("@/lib/firebase-admin", () => {
  const mockDocGet = vi.fn();
  const mockDocSet = vi.fn().mockResolvedValue(undefined);
  const mockDocUpdate = vi.fn().mockResolvedValue(undefined);

  const mockDoc = vi.fn().mockReturnValue({
    get: mockDocGet,
    set: mockDocSet,
    update: mockDocUpdate,
  });

  return {
    adminDb: {
      collection: vi.fn().mockReturnValue({
        doc: mockDoc,
      }),
    },
    adminAuth: {
      getUserByEmail: vi.fn(),
      createUser: vi.fn(),
      updateUser: vi.fn(),
    },
  };
});

import { getAuthenticatedUser } from "@/lib/api-auth";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

describe("API /api/concierge/approver", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("retorna 401 para usuário não autenticado", async () => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue(null);

      const req = new NextRequest("http://localhost:9002/api/concierge/approver");
      const res = await GET(req);

      expect(res.status).toBe(401);
    });

    it("retorna o aprovador configurado para o workspace do usuário", async () => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue({ uid: "creator-123", email: "creator@test.com" } as any);

      const mockData = {
        clientApprover: {
          approverUid: "client-456",
          approverEmail: "cliente@marca.com",
          approverName: "Carlos Cliente",
          status: "active",
        },
      };

      const mockDoc = {
        exists: true,
        data: () => mockData,
      };

      vi.mocked(adminDb.collection).mockReturnValue({
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(mockDoc),
        }),
      } as any);

      const req = new NextRequest("http://localhost:9002/api/concierge/approver");
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.approver.approverEmail).toBe("cliente@marca.com");
    });
  });

  describe("POST", () => {
    it("rejeita requisição com dados inválidos (email ou senha curta)", async () => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue({ uid: "creator-123" } as any);

      const req = new NextRequest("http://localhost:9002/api/concierge/approver", {
        method: "POST",
        body: JSON.stringify({ email: "invalid", password: "123" }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("cria novo usuário aprovador e vincula ao workspace do criador", async () => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue({ uid: "creator-123", email: "creator@test.com" } as any);

      const notFoundErr: any = new Error("User not found");
      notFoundErr.code = "auth/user-not-found";
      vi.mocked(adminAuth.getUserByEmail).mockRejectedValueOnce(notFoundErr);

      vi.mocked(adminAuth.createUser).mockResolvedValueOnce({ uid: "client-new-789" } as any);

      const mockSet = vi.fn().mockResolvedValue(undefined);
      vi.mocked(adminDb.collection).mockReturnValue({
        doc: vi.fn().mockReturnValue({
          set: mockSet,
        }),
      } as any);

      const req = new NextRequest("http://localhost:9002/api/concierge/approver", {
        method: "POST",
        body: JSON.stringify({
          email: "cliente@novo.com",
          password: "password123",
          name: "João da Silva",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.approver.approverEmail).toBe("cliente@novo.com");
      expect(adminAuth.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "cliente@novo.com",
          password: "password123",
        })
      );
    });
  });

  describe("DELETE", () => {
    it("desvincula o aprovador do workspace com sucesso", async () => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue({ uid: "creator-123" } as any);

      const mockUpdate = vi.fn().mockResolvedValue(undefined);
      const mockSet = vi.fn().mockResolvedValue(undefined);

      vi.mocked(adminDb.collection).mockReturnValue({
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            exists: true,
            data: () => ({ clientApprover: { approverUid: "client-456" } }),
          }),
          set: mockSet,
          update: mockUpdate,
        }),
      } as any);

      const req = new NextRequest("http://localhost:9002/api/concierge/approver", {
        method: "DELETE",
      });

      const res = await DELETE(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });
  });
});
