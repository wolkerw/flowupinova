import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { BusinessCardStudio } from "../BusinessCardStudio";

const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe("BusinessCardStudio - Cartão de Visitas Digital & Gráfico Físico", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.print = vi.fn();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });
  });

  const defaultProps = {
    brandName: "InovaTech",
    slogan: "Inovação para o seu negócio",
    primaryColor: "#0083C7",
    secondaryColor: "#FA6305",
    logoUrl: "https://example.com/logo.png",
    initialPhone: "(11) 98765-4321",
    initialInstagram: "inovatech",
    initialWebsite: "www.inovatech.com.br",
    initialEmail: "contato@inovatech.com.br",
  };

  it("renderiza a interface interativa e permite alternar entre Cartão Digital e Cartão Físico", () => {
    render(<BusinessCardStudio {...defaultProps} />);

    expect(screen.getByText("Cartão de Visitas Digital Interativo")).toBeInTheDocument();
    expect(screen.getByText("Cartão Físico Tradicional (Gráfica)")).toBeInTheDocument();

    // Alterna para o modo Físico
    fireEvent.click(screen.getByText("Cartão Físico Tradicional (Gráfica)"));
    expect(screen.getByText("Formato Padrão Gráfico: 9x5 cm (300 DPI)")).toBeInTheDocument();
  });

  it("renderiza a prancha gráfica de impressão dedicada (90x50 mm) com Frente e Verso", () => {
    render(<BusinessCardStudio {...defaultProps} />);

    // Verifica a presença do cabeçalho técnico de gabarito para impressão
    expect(screen.getByText("Gabarito Oficial de Produção Gráfica")).toBeInTheDocument();
    expect(
      screen.getByText(/INOVATECH — CARTÃO DE VISITAS/i)
    ).toBeInTheDocument();

    // Verifica presença das seções de Frente e Verso na prancha de impressão
    const frentes = screen.getAllByText("FRENTE (90 × 50 mm)");
    expect(frentes.length).toBeGreaterThan(0);

    const versos = screen.getAllByText("VERSO (90 × 50 mm)");
    expect(versos.length).toBeGreaterThan(0);

    expect(
      screen.getByText(/Formato Final Refilado:/i)
    ).toBeInTheDocument();
  });

  it("chama window.print() ao clicar no botão de impressão do cartão físico", () => {
    render(<BusinessCardStudio {...defaultProps} />);

    // Alterna para a aba de Cartão Físico
    fireEvent.click(screen.getByText("Cartão Físico Tradicional (Gráfica)"));

    // Clica no botão Imprimir / Salvar PDF
    const printButtons = screen.getAllByText(/Imprimir \/ Salvar PDF/i);
    expect(printButtons.length).toBeGreaterThan(0);
    fireEvent.click(printButtons[0]);

    expect(window.print).toHaveBeenCalledTimes(1);
  });

  it("permite virar o cartão físico entre Frente e Verso na tela", () => {
    render(<BusinessCardStudio {...defaultProps} />);

    fireEvent.click(screen.getByText("Cartão Físico Tradicional (Gráfica)"));

    // Inicialmente na Frente
    expect(screen.getByText(/Virar Cartão \(Ver Verso\)/i)).toBeInTheDocument();

    // Clica no botão de virar
    fireEvent.click(screen.getByText(/Virar Cartão \(Ver Verso\)/i));

    // Agora exibe opção de ver a Frente
    expect(screen.getByText(/Virar Cartão \(Ver Frente\)/i)).toBeInTheDocument();
  });

  it("permite alternar o modo de contraste do logotipo (branco vs colorido)", () => {
    render(<BusinessCardStudio {...defaultProps} />);

    fireEvent.click(screen.getByText("Cartão Físico Tradicional (Gráfica)"));

    const contrastBtn = screen.getByTitle(
      "Alternar entre logo colorida original e versão branca de alto contraste"
    );
    expect(contrastBtn).toBeInTheDocument();

    // Alterna para Logo Branca
    fireEvent.click(contrastBtn);
    expect(screen.getByText("⚪ Logo Branca")).toBeInTheDocument();

    // Alterna de volta
    fireEvent.click(contrastBtn);
    expect(screen.getByText("🎨 Logo Colorida")).toBeInTheDocument();
  });
});
