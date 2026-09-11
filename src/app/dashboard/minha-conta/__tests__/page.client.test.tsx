import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MinhaContaPageClient } from "../page.client";

const staticUser = {
  uid: "test-user-123",
  email: "cliente@teste.com",
  displayName: "Cliente Teste",
};

const staticAuth = {
  user: staticUser,
  loading: false,
  loginWithEmail: vi.fn(),
  signUpWithEmail: vi.fn(),
  logout: vi.fn(),
};

vi.mock("@/components/auth/auth-provider", () => ({
  useAuth: () => staticAuth,
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/lib/firebase", () => ({
  db: {},
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div data-testid="mock-dialog">{children}</div> : null,
  DialogContent: ({ children, className }: any) => (
    <div className={className} data-testid="mock-dialog-content">
      {children}
    </div>
  ),
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  onSnapshot: vi.fn((_, callback) => {
    setTimeout(() => {
      callback({
        exists: () => true,
        data: () => ({ plan: "pro" }),
      });
    }, 0);
    return vi.fn();
  }),
}));

describe("MinhaContaPageClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        contract: {
          id: "contract-xyz-999",
          userId: "test-user-123",
          userEmail: "cliente@teste.com",
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
            nomeOuRazaoSocial: "Empresa do Cliente",
            cpfOuCnpj: "99.888.777/0001-66",
            email: "cliente@teste.com",
          },
        },
      }),
    });
  });

  it("renderiza o plano do usuário e os dados de login", async () => {
    render(<MinhaContaPageClient />);
    expect(screen.getByText("Minha Conta")).toBeInTheDocument();
    expect(screen.getByText("cliente@teste.com")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("PRO")).toBeInTheDocument();
    });
  });

  it("exibe o card de Contrato de Assinatura com status assinado digitalmente", async () => {
    render(<MinhaContaPageClient />);
    await waitFor(() => {
      expect(screen.getByText("Contrato de Assinatura")).toBeInTheDocument();
      expect(screen.getByText(/Assinado Digitalmente/i)).toBeInTheDocument();
      expect(screen.getByText(/Plano ANUAL/i)).toBeInTheDocument();
    });
  });

  it("abre o modal de visualização do contrato completo ao clicar no botão", async () => {
    render(<MinhaContaPageClient />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Visualizar Contrato Completo/i })).toBeInTheDocument();
    });

    const openBtn = screen.getByRole("button", { name: /Visualizar Contrato Completo/i });
    fireEvent.click(openBtn);

    await waitFor(() => {
      expect(screen.getByText(/Contrato Digital de Assinatura NumVapt/i)).toBeInTheDocument();
      expect(screen.getAllByText("contract-xyz-999").length).toBeGreaterThanOrEqual(2);
    });
  });
});
