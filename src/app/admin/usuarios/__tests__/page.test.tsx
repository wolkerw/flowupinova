import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AdminUsuariosPage from "../page";

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div data-testid="mock-dialog">{children}</div> : null,
  DialogContent: ({ children, className }: any) => (
    <div className={className} data-testid="mock-dialog-content">
      {children}
    </div>
  ),
}));

const mockUsers = [
  {
    uid: "user-com-contrato-123",
    email: "cliente.pro@teste.com",
    displayName: "Empresa Assinante LTDA",
    plan: "standard",
    paymentStatus: "active",
    createdAt: "2026-09-01T10:00:00Z",
    trialDaysLeft: 0,
    trialExpired: false,
    postsCount: 12,
    imagesCount: 30,
    subscriptionPlan: "anual",
    hasSignedContract: true,
    activeContract: {
      id: "contract-abc-777",
      modalidade: "anual",
      valorTotalCiclo: 4800,
      signedAtFormatted: "11/09/2026 15:30:00",
      status: "signed",
    },
  },
  {
    uid: "user-sem-contrato-456",
    email: "cliente.trial@teste.com",
    displayName: "Cliente Novo",
    plan: "trial",
    paymentStatus: "active",
    createdAt: "2026-09-10T10:00:00Z",
    trialDaysLeft: 6,
    trialExpired: false,
    postsCount: 0,
    imagesCount: 2,
    hasSignedContract: false,
  },
];

describe("AdminUsuariosPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url === "/api/admin/users") {
        return {
          ok: true,
          status: 200,
          json: async () => ({ users: mockUsers }),
        };
      }
      if (url.includes("/contract")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            contract: {
              id: "contract-abc-777",
              userId: "user-com-contrato-123",
              userEmail: "cliente.pro@teste.com",
              modalidade: "anual",
              valorTotalCiclo: 4800,
              signedAtFormatted: "11/09/2026 15:30:00",
              status: "signed",
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
              assinante: {
                nomeOuRazaoSocial: "Empresa Assinante LTDA",
                cpfOuCnpj: "12.345.678/0001-99",
                email: "cliente.pro@teste.com",
              },
            },
          }),
        };
      }
      return { ok: true, status: 200, json: async () => ({}) };
    });
  });

  it("renderiza a tabela de usuários com a coluna de contrato e status dos usuários", async () => {
    render(<AdminUsuariosPage />);

    await waitFor(() => {
      expect(screen.getByText("Empresa Assinante LTDA")).toBeInTheDocument();
      expect(screen.getByText("Cliente Novo")).toBeInTheDocument();
    });

    expect(screen.getByRole("columnheader", { name: /Contrato/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Assinado/i })).toBeInTheDocument();
  });

  it("abre o modal com o contrato digital do cliente ao clicar no botão Assinado da tabela", async () => {
    render(<AdminUsuariosPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Assinado/i })).toBeInTheDocument();
    });

    const contractBtn = screen.getByRole("button", { name: /Assinado/i });
    fireEvent.click(contractBtn);

    await waitFor(() => {
      expect(screen.getByText(/Contrato Digital de Assinatura NumVapt/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue("Empresa Assinante LTDA")).toBeInTheDocument();
      expect(screen.getByDisplayValue("12.345.678/0001-99")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Imprimir \/ Salvar PDF/i })).toBeInTheDocument();
    });
  });

  it("permite visualizar o contrato também através do painel lateral de detalhes (UserSheet)", async () => {
    render(<AdminUsuariosPage />);

    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /Gerenciar/i })[0]).toBeInTheDocument();
    });

    const manageBtn = screen.getAllByRole("button", { name: /Gerenciar/i })[0];
    fireEvent.click(manageBtn);

    await waitFor(() => {
      expect(screen.getByText("Detalhes da Conta")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Visualizar Contrato Assinado/i })).toBeInTheDocument();
    });

    const viewContractSheetBtn = screen.getByRole("button", { name: /Visualizar Contrato Assinado/i });
    fireEvent.click(viewContractSheetBtn);

    await waitFor(() => {
      expect(screen.getByText(/Contrato Digital de Assinatura NumVapt/i)).toBeInTheDocument();
    });
  });
});
