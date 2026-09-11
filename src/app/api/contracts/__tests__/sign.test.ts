import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../sign/route";
import { GET } from "../route";
import { NextRequest } from "next/server";

const { mockBatch, mockDoc, authState } = vi.hoisted(() => {
  const mockBatch = {
    set: vi.fn(),
    update: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
  };

  const mockDoc = {
    get: vi.fn().mockResolvedValue({
      exists: true,
      data: () => ({
        activeContractId: "contract-123",
      }),
    }),
    collection: vi.fn().mockReturnValue({
      doc: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({
            id: "contract-123",
            modalidade: "anual",
            status: "signed",
            signedAtFormatted: "11/09/2026 14:00:00",
          }),
        }),
      }),
      orderBy: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            empty: false,
            docs: [
              {
                data: () => ({
                  id: "contract-123",
                  modalidade: "anual",
                  status: "signed",
                }),
              },
            ],
          }),
        }),
      }),
    }),
  };

  const authState = {
    user: { uid: "user-123", email: "cliente@teste.com" } as any,
  };

  return { mockBatch, mockDoc, authState };
});

vi.mock("@/lib/firebase-admin", () => ({
  admin: {
    firestore: {
      Timestamp: {
        fromDate: (d: Date) => d,
      },
      FieldValue: {
        serverTimestamp: () => new Date(),
      },
    },
  },
  adminDb: {
    collection: vi.fn().mockReturnValue({
      doc: vi.fn().mockReturnValue(mockDoc),
    }),
    batch: () => mockBatch,
  },
}));

vi.mock("@/lib/api-auth", () => ({
  getAuthenticatedUser: vi.fn(() => Promise.resolve(authState.user)),
}));

describe("API Contratos de Assinatura Digital", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.user = { uid: "user-123", email: "cliente@teste.com" };
  });

  it("rejeita assinatura se o usuário não estiver autenticado (401)", async () => {
    authState.user = null;
    const req = new NextRequest("http://localhost:9002/api/contracts/sign", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain("Autenticação obrigatória");
  });

  it("rejeita se nome ou CPF/CNPJ do assinante estiverem inválidos (400)", async () => {
    const req = new NextRequest("http://localhost:9002/api/contracts/sign", {
      method: "POST",
      body: JSON.stringify({
        assinante: { nomeOuRazaoSocial: "AB", cpfOuCnpj: "" },
        modalidade: "anual",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it("rejeita se qualquer um dos 10 aceites da Cláusula 19 estiver ausente ou false (400)", async () => {
    const req = new NextRequest("http://localhost:9002/api/contracts/sign", {
      method: "POST",
      body: JSON.stringify({
        assinante: { nomeOuRazaoSocial: "Empresa Teste LTDA", cpfOuCnpj: "12.345.678/0001-90" },
        modalidade: "anual",
        formaPagamento: "pix",
        aceites: {
          modalidadeEValor: true,
          prazoAcesso: true,
          valorTotalCiclo: true,
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("10 itens");
    expect(data.missingAceites).toBeDefined();
  });

  it("assina com sucesso quando todos os 10 aceites são preenchidos e válidos", async () => {
    const req = new NextRequest("http://localhost:9002/api/contracts/sign", {
      method: "POST",
      headers: {
        "x-forwarded-for": "189.120.50.2",
        "user-agent": "Mozilla/5.0 Test Browser",
      },
      body: JSON.stringify({
        assinante: {
          nomeOuRazaoSocial: "Empresa Teste LTDA",
          cpfOuCnpj: "12.345.678/0001-90",
          email: "cliente@teste.com",
        },
        modalidade: "anual",
        formaPagamento: "pix",
        aceites: {
          modalidadeEValor: true,
          prazoAcesso: true,
          valorTotalCiclo: true,
          descontosEBeneficios: true,
          desistencia7Dias: true,
          direitoArrependimento: true,
          regrasCancelamento: true,
          multaCompensatoria10: true,
          semPromessaResultado: true,
          politicaPrivacidade: true,
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.contract.modalidade).toBe("anual");
    expect(data.contract.valorTotalCiclo).toBe(4800);
    expect(data.contract.periodoMeses).toBe(13);
    expect(mockBatch.set).toHaveBeenCalled();
    expect(mockBatch.update).toHaveBeenCalled();
    expect(mockBatch.commit).toHaveBeenCalled();
  });

  it("GET /api/contracts retorna o contrato ativo do usuário", async () => {
    const req = new NextRequest("http://localhost:9002/api/contracts", {
      method: "GET",
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.contract).toBeDefined();
    expect(data.contract.id).toBe("contract-123");
  });
});
