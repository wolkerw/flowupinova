import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../route";
import { NextRequest } from "next/server";

vi.mock("@/lib/admin-auth", () => ({
  validateAdminToken: vi.fn(),
}));

vi.mock("@/lib/firebase-admin", () => ({
  adminDb: {
    collection: vi.fn(),
  },
}));

import { validateAdminToken } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase-admin";

describe("GET /api/admin/users/[uid]/contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejeita requisições sem autenticação de administrador com status 403", async () => {
    vi.mocked(validateAdminToken).mockResolvedValue(false);

    const req = new NextRequest("http://localhost:3000/api/admin/users/user-123/contract");
    const res = await GET(req, { params: Promise.resolve({ uid: "user-123" }) });

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Acesso negado.");
  });

  it("retorna contract null quando o usuário não possui contrato assinado", async () => {
    vi.mocked(validateAdminToken).mockResolvedValue(true);

    const mockLimit = vi.fn().mockReturnValue({
      get: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
    });
    const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockContractsColl = { orderBy: mockOrderBy };

    const mockUserDocGet = vi.fn().mockResolvedValue({
      exists: true,
      data: () => ({}),
    });
    const mockUsersDoc = vi.fn().mockReturnValue({ get: mockUserDocGet });

    vi.mocked(adminDb.collection).mockImplementation((collPath: string) => {
      if (collPath === "users/user-123/contracts") {
        return mockContractsColl as any;
      }
      if (collPath === "users") {
        return { doc: mockUsersDoc } as any;
      }
      return {} as any;
    });

    const req = new NextRequest("http://localhost:3000/api/admin/users/user-123/contract");
    const res = await GET(req, { params: Promise.resolve({ uid: "user-123" }) });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.contract).toBeNull();
  });

  it("retorna o contrato do usuário quando encontrado na subcoleção contracts", async () => {
    vi.mocked(validateAdminToken).mockResolvedValue(true);

    const mockContractData = {
      modalidade: "anual",
      valorTotalCiclo: 4800,
      status: "signed",
      signedAtFormatted: "11/09/2026 15:30:00",
      signedAt: { toDate: () => new Date("2026-09-11T18:30:00Z") },
      assinante: {
        nomeOuRazaoSocial: "Cliente Empresa",
        cpfOuCnpj: "12.345.678/0001-90",
        email: "empresa@teste.com",
      },
    };

    const mockDoc = {
      id: "contract-xyz-888",
      data: () => mockContractData,
    };

    const mockLimit = vi.fn().mockReturnValue({
      get: vi.fn().mockResolvedValue({ empty: false, docs: [mockDoc] }),
    });
    const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockContractsColl = { orderBy: mockOrderBy };

    vi.mocked(adminDb.collection).mockImplementation((collPath: string) => {
      if (collPath === "users/user-123/contracts") {
        return mockContractsColl as any;
      }
      return {} as any;
    });

    const req = new NextRequest("http://localhost:3000/api/admin/users/user-123/contract");
    const res = await GET(req, { params: Promise.resolve({ uid: "user-123" }) });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.contract).toBeDefined();
    expect(json.contract.id).toBe("contract-xyz-888");
    expect(json.contract.modalidade).toBe("anual");
    expect(json.contract.assinante.nomeOuRazaoSocial).toBe("Cliente Empresa");
  });
});
