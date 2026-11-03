import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { PdvStudio } from "../PdvStudio";

const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe("PdvStudio - Ponto de Venda & Credibilidade Comercial (Etapa 3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.print = vi.fn();
  });

  const defaultProps = {
    brandName: "InovaTech",
    slogan: "Inovação para o seu negócio",
    primaryColor: "#0083C7",
    secondaryColor: "#FA6305",
    logoUrl: "https://example.com/logo.png",
    phone: "(11) 98765-4321",
    instagram: "inovatech",
    website: "www.inovatech.com.br",
    email: "contato@inovatech.com.br",
    address: "Av. Paulista, 1000 - SP",
  };

  it("renderiza inicialmente o Display Google (A5) com QR Code, logotipo e apenas slogan quando houver logo", () => {
    render(<PdvStudio {...defaultProps} />);

    expect(screen.getByText("Display Google (Avaliações A5)")).toBeInTheDocument();
    expect(screen.getByText("Configurar Display de Mesa / Balcão")).toBeInTheDocument();
    expect(screen.getByText("Sua opinião é fundamental para nós!")).toBeInTheDocument();
    // Com logo presente, não duplica o nome da empresa em texto
    expect(screen.queryByText("INOVATECH")).not.toBeInTheDocument();
    // Exibe apenas o slogan
    expect(screen.getByText("Inovação para o seu negócio")).toBeInTheDocument();
    expect(screen.getByText("Imprimir Display A5 com Marcas de Corte")).toBeInTheDocument();
  });

  it("exibe o nome da marca em texto como fallback quando não houver logotipo cadastrado", () => {
    render(<PdvStudio {...defaultProps} logoUrl={undefined} />);

    expect(screen.getByText("INOVATECH")).toBeInTheDocument();
  });

  it("permite personalizar os textos do Display Google e adicionar recompensa", () => {
    render(<PdvStudio {...defaultProps} />);

    const headlineInput = screen.getByPlaceholderText("Ex: Sua opinião é fundamental para nós!");
    fireEvent.change(headlineInput, { target: { value: "Avalie nosso atendimento no Google!" } });

    expect(screen.getByText("Avalie nosso atendimento no Google!")).toBeInTheDocument();

    // Ativar recompensa
    const rewardCheckbox = screen.getByRole("checkbox");
    fireEvent.click(rewardCheckbox);

    expect(screen.getByPlaceholderText("Ex: Mostre sua avaliação e ganhe 10% de desconto!")).toBeInTheDocument();
  });

  it("alterna para a ferramenta de Lacres & Adesivos de Sacola e altera o formato da faca", () => {
    render(<PdvStudio {...defaultProps} />);

    const stickersBtn = screen.getByText("Lacres & Adesivos de Sacola");
    fireEvent.click(stickersBtn);

    expect(screen.getByText("Personalizar Lacres & Adesivos")).toBeInTheDocument();
    expect(screen.getByText("Feito com muito carinho para você 💖")).toBeInTheDocument();

    // Selecionar mensagem especial
    const especialPreset = screen.getByText("Cuidado: Conteúdo especial! ✨");
    fireEvent.click(especialPreset);

    expect(screen.getByText("Cuidado: Conteúdo muito especial aqui dentro! ✨")).toBeInTheDocument();
  });

  it("alterna para Pastas de Proposta Comercial e permite alternar entre Capa e Faca Aberta com Bolsa", () => {
    render(<PdvStudio {...defaultProps} />);

    const folderBtn = screen.getByText("Pastas de Proposta Comercial");
    fireEvent.click(folderBtn);

    expect(screen.getByText("Pasta Corporativa com Porta-Cartão")).toBeInTheDocument();
    expect(screen.getByText("Proposta Comercial & Institucional")).toBeInTheDocument();

    // Alternar para Faca Aberta
    const openBtn = screen.getByText("Faca Aberta (Interna com Bolsa)");
    fireEvent.click(openBtn);

    expect(screen.getByText("Bolsa / Orelha (7 cm)")).toBeInTheDocument();
    expect(screen.getByText("Cartão de Visita Acoplado")).toBeInTheDocument();
  });

  it("alterna para Mockups de Marca e visualiza simulações em Camisa Polo, Caneca, Frota, Sacola Kraft e Fachada 3D", () => {
    render(<PdvStudio {...defaultProps} />);

    const mockupsBtn = screen.getByText("Mockups de Marca (Uniformes & Loja)");
    fireEvent.click(mockupsBtn);

    expect(screen.getByText("Simulação de Mockups da Marca")).toBeInTheDocument();
    expect(screen.getByText("Camisa Polo Corporativa (Uniforme)")).toBeInTheDocument();

    // 1. Alternar para Caneca / Xícara de Porcelana
    const mugBtn = screen.getByText("Caneca de Porcelana (Brindes & Café)");
    fireEvent.click(mugBtn);
    expect(screen.getByText("Brinde Corporativo & Reuniões")).toBeInTheDocument();
    expect(screen.getByText("Cerâmica Premium 350ml")).toBeInTheDocument();

    // 2. Alternar para Frota / Veículo Comercial
    const fleetBtn = screen.getByText("Frota / Veículo Comercial (Plotagem)");
    fireEvent.click(fleetBtn);
    expect(screen.getByText("Plotagem de Frota & Veículos Comerciais")).toBeInTheDocument();
    expect(screen.getByText("InovaTech Fleet Design")).toBeInTheDocument();

    // 3. Alternar para Sacola Kraft
    const bagBtn = screen.getByText("Sacola Kraft Ecológica (Embalagem)");
    fireEvent.click(bagBtn);
    expect(screen.getByText(/Embalagem 100% Reciclável • Papel Kraft 120g/i)).toBeInTheDocument();

    // 4. Alternar para Fachada 3D
    const facadeBtn = screen.getByText("Placa de Recepção / Fachada 3D");
    fireEvent.click(facadeBtn);
    expect(screen.getByText(/Placa de Entrada Comercial • Letra Caixa e Iluminação Halo LED Backlight/i)).toBeInTheDocument();
  });

  it("aciona window.print() ao clicar no botão de impressão gráfica", () => {
    render(<PdvStudio {...defaultProps} />);

    const printBtn = screen.getByText("Imprimir Display A5 com Marcas de Corte");
    fireEvent.click(printBtn);

    expect(window.print).toHaveBeenCalledTimes(1);
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining("Preparando Impressão Gráfica"),
      })
    );
  });
});
