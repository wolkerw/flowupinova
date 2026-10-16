import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SubscriptionModal } from "../SubscriptionModal";

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockAuth = {
  user: { uid: "user-123", email: "teste@empresa.com" },
  logout: vi.fn(),
  getIdToken: vi.fn().mockResolvedValue("mock-token"),
};

vi.mock("@/components/auth/auth-provider", () => ({
  useAuth: () => mockAuth,
}));

vi.mock("@/lib/firebase", () => ({
  db: {},
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(() => ({})),
  updateDoc: vi.fn().mockResolvedValue(undefined),
  onSnapshot: vi.fn((docRef, onNext) => {
    setTimeout(() => {
      onNext({
        exists: () => true,
        data: () => ({
          email: "teste@empresa.com",
          displayName: "Cliente Teste",
          businessProfile: { businessName: "Empresa Teste", cnpj: "12.345.678/0001-90" },
          plan: "trial",
          subscriptionStatus: "",
        }),
      });
    }, 0);
    return vi.fn();
  }),
}));

vi.mock("next/image", () => ({
  default: (props: any) => <img {...props} alt={props.alt || "mock-img"} />,
}));

describe("SubscriptionModal Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("action=get-settings")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            settings: {
              pixKey: "test-pix-key",
              pixQrCodeUrl: "",
              creditLinkMonthly: "",
              creditLinkTrimestral: "",
              creditLinkSemestral: "",
              creditLinkYearly: "",
              creditLinkTudoPronto: "",
            },
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ valid: true, code: "TESTE10", discountPercentage: 10 }),
      });
    });
  });

  it("renderiza o modal com todas as modalidades incluindo o Módulo Tudo Pronto", async () => {
    render(<SubscriptionModal isOpen={true} onClose={vi.fn()} userId="user-123" />);

    await waitFor(() => {
      expect(screen.getByText("Escolha o seu plano")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /^Mensal$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /3 Meses/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /6 Meses/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Anual/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Módulo Tudo Pronto/i })).toBeInTheDocument();
  });

  it("seleciona o Módulo Tudo Pronto e atualiza o valor para R$ 699/mês e o banner de execução", async () => {
    render(<SubscriptionModal isOpen={true} onClose={vi.fn()} userId="user-123" />);

    await waitFor(() => {
      expect(screen.getByText("Escolha o seu plano")).toBeInTheDocument();
    });

    const tudoProntoBtn = screen.getByRole("button", { name: /Módulo Tudo Pronto/i });
    fireEvent.click(tudoProntoBtn);

    expect(screen.getAllByText(/R\$\s*699/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Você só precisa aprovar!/i)).toBeInTheDocument();
    expect(screen.getByText(/Criação e agendamento de posts com gestão na Central de Aprovações/i)).toBeInTheDocument();
  });

  it("avança para o Contrato Digital com a modalidade Tudo Pronto selecionada", async () => {
    render(<SubscriptionModal isOpen={true} onClose={vi.fn()} userId="user-123" />);

    await waitFor(() => {
      expect(screen.getByText("Escolha o seu plano")).toBeInTheDocument();
    });

    const tudoProntoBtn = screen.getByRole("button", { name: /Módulo Tudo Pronto/i });
    fireEvent.click(tudoProntoBtn);

    const continueBtn = screen.getByRole("button", { name: /Continuar para o Contrato Digital/i });
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(screen.getByText(/Contrato Digital de Assinatura NumVapt/i)).toBeInTheDocument();
      expect(screen.getByText(/Tudo Pronto \(Execução Completa\)/i)).toBeInTheDocument();
    });
  });
});
