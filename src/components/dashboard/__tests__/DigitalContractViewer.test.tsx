import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DigitalContractViewer } from "../DigitalContractViewer";

describe("DigitalContractViewer", () => {
  const defaultProps = {
    modalidade: "anual" as const,
    formaPagamento: "pix" as const,
    initialAssinante: {
      nomeOuRazaoSocial: "Empresa Teste LTDA",
      cpfOuCnpj: "12.345.678/0001-90",
      email: "teste@empresa.com",
    },
    onSignContract: vi.fn(),
    onBack: vi.fn(),
  };

  it("renderiza o cabeçalho e cláusulas do contrato", () => {
    render(<DigitalContractViewer {...defaultProps} />);
    expect(screen.getByText(/CONTRATO DE ASSINATURA NUMVAPT/i)).toBeInTheDocument();
    expect(screen.getByText(/FLOWUP SOLUCOES E INOVACOES INOVA SIMPLES/i)).toBeInTheDocument();
    expect(screen.getByText(/19. Declaração de contratação consciente/i)).toBeInTheDocument();
  });

  it("mantém o botão de assinar desabilitado até que todos os 10 itens sejam confirmados", () => {
    render(<DigitalContractViewer {...defaultProps} />);
    const submitBtn = screen.getByRole("button", { name: /Assinar Digitalmente/i });
    expect(submitBtn).toBeDisabled();
  });

  it("habilita o botão ao clicar em 'Marcar todos os 10 itens' com dados preenchidos", async () => {
    render(<DigitalContractViewer {...defaultProps} />);
    const checkAllBtn = screen.getByRole("button", { name: /Marcar todos os 10 itens/i });
    fireEvent.click(checkAllBtn);

    const submitBtn = screen.getByRole("button", { name: /Assinar Digitalmente/i });
    expect(submitBtn).not.toBeDisabled();
  });

  it("chama onSignContract ao submeter o formulário após marcar os aceites", async () => {
    const onSignMock = vi.fn();
    render(<DigitalContractViewer {...defaultProps} onSignContract={onSignMock} />);

    const checkAllBtn = screen.getByRole("button", { name: /Marcar todos os 10 itens/i });
    fireEvent.click(checkAllBtn);

    const submitBtn = screen.getByRole("button", { name: /Assinar Digitalmente/i });
    fireEvent.click(submitBtn);

    expect(onSignMock).toHaveBeenCalledWith(
      expect.objectContaining({
        modalidade: "anual",
        formaPagamento: "pix",
        assinante: expect.objectContaining({
          nomeOuRazaoSocial: "Empresa Teste LTDA",
          cpfOuCnpj: "12.345.678/0001-90",
        }),
        aceites: expect.objectContaining({
          modalidadeEValor: true,
          politicaPrivacidade: true,
        }),
      })
    );
  });

  it("renderiza em modo readOnly com carimbo de auditoria e botão de impressão", () => {
    const signedContract = {
      id: "contract-abc-123",
      userId: "user-123",
      userEmail: "teste@empresa.com",
      assinante: {
        nomeOuRazaoSocial: "Empresa Teste LTDA",
        cpfOuCnpj: "12.345.678/0001-90",
        email: "teste@empresa.com",
      },
      modalidade: "anual" as const,
      valorMensalReferencia: 369.23,
      valorTotalCiclo: 4800,
      periodoMeses: 13,
      formaPagamento: "pix" as const,
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
      signedAt: new Date(),
      signedAtFormatted: "11/09/2026 15:00:00",
      ipAddress: "200.100.50.25",
      userAgent: "TestBrowser/1.0",
      contractVersion: "v1.0-anual-numvapt",
      status: "signed" as const,
    };

    render(
      <DigitalContractViewer
        {...defaultProps}
        readOnly={true}
        signedContract={signedContract}
      />
    );

    expect(screen.getByText(/Evidência de Assinatura Eletrônica/i)).toBeInTheDocument();
    expect(screen.getByText("contract-abc-123")).toBeInTheDocument();
    expect(screen.getByText(/Assinado Digitalmente/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Imprimir/i })).toBeInTheDocument();
  });
});
