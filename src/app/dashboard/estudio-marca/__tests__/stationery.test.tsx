import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { BusinessCardStudio } from "@/components/dashboard/stationery/BusinessCardStudio";
import { EmailSignatureStudio } from "@/components/dashboard/stationery/EmailSignatureStudio";
import { LetterheadStudio } from "@/components/dashboard/stationery/LetterheadStudio";
import BrandStudioPage from "../page";

// Mocks do Auth e Toast
const mockUser = { uid: "test-user-stationery", email: "contato@empresa.com", displayName: "Carlos Silva" };
vi.mock("@/components/auth/auth-provider", () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
  }),
}));

const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock do onboarding-service
vi.mock("@/lib/services/onboarding-service", () => ({
  getOnboardingProfile: vi.fn().mockResolvedValue({
    name: "InovaTech Soluções",
    category: "Consultoria e Tecnologia",
    slogan: "Inovação que gera resultados",
    primaryColor: "#0083C7",
    secondaryColor: "#FA6305",
    whatsapp: "11999998888",
    instagramUsername: "inovatech.oficial",
    website: "https://inovatech.com.br",
    email: "contato@inovatech.com.br",
    ownerName: "Carlos Silva",
    address: "Av. Paulista, 1000",
    city: "São Paulo",
    state: "SP",
    logo: { url: "https://exemplo.com/logo-inova.png", width: 500, height: 500 },
  }),
  updateOnboardingProfile: vi.fn().mockResolvedValue(true),
}));

describe("Fase 2: Papelaria & Digital (MVP de Alto Impacto)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("BusinessCardStudio - Cartão de Visitas Digital & Físico", () => {
    it("renderiza o cartão digital com os 4 botões de conversão e permite alternar para o cartão físico 9x5cm", () => {
      render(
        <BusinessCardStudio
          brandName="InovaTech"
          slogan="Inovação que gera resultados"
          primaryColor="#0083C7"
          secondaryColor="#FA6305"
          initialPhone="11999998888"
          initialInstagram="inovatech"
          initialWebsite="https://inovatech.com"
          initialEmail="contato@inovatech.com"
        />
      );

      // Verifica botões de alternância
      expect(screen.getByRole("button", { name: /Cartão de Visitas Digital Interativo/i })).toBeDefined();
      expect(screen.getByRole("button", { name: /Cartão Físico Tradicional/i })).toBeDefined();

      // Botões de ação do Cartão Digital no mockup do celular
      expect(screen.getByText("Conversar no WhatsApp")).toBeDefined();
      expect(screen.getByText("Seguir no Instagram")).toBeDefined();
      expect(screen.getByText("Abrir Rota no Google Maps")).toBeDefined();
      expect(screen.getByText("Salvar Contato na Agenda (vCard)")).toBeDefined();

      // Alternar para Cartão Físico
      const btnFisico = screen.getByRole("button", { name: /Cartão Físico Tradicional/i });
      fireEvent.click(btnFisico);

      expect(screen.getByText(/Formato Padrão Gráfico: 9x5 cm/i)).toBeDefined();
      expect(screen.getByRole("button", { name: /^Verso$/i })).toBeDefined();
    });

    it("permite girar a visualização da frente e verso do cartão físico", () => {
      render(
        <BusinessCardStudio
          brandName="InovaTech"
          primaryColor="#0083C7"
          secondaryColor="#FA6305"
        />
      );

      const btnFisico = screen.getByRole("button", { name: /Cartão Físico Tradicional/i });
      fireEvent.click(btnFisico);

      const btnGirar = screen.getByRole("button", { name: /^Verso$/i });
      fireEvent.click(btnGirar);

      expect(screen.getByRole("button", { name: /^Frente$/i })).toBeDefined();
    });
  });

  describe("EmailSignatureStudio - Gerador de Assinatura de E-mail", () => {
    it("renderiza opções de templates e o botão de copiar assinatura HTML", () => {
      render(
        <EmailSignatureStudio
          brandName="InovaTech"
          slogan="Inovação em tecnologia"
          primaryColor="#0083C7"
          secondaryColor="#FA6305"
          initialName="Carlos Silva"
          initialRole="Diretoria Executiva"
          initialPhone="11999998888"
          initialEmail="carlos@inovatech.com"
        />
      );

      expect(screen.getByText("Gerador de Assinatura de E-mail Profissional")).toBeDefined();
      expect(screen.getByRole("button", { name: /^Executivo$/i })).toBeDefined();
      expect(screen.getByRole("button", { name: /^Compacto$/i })).toBeDefined();
      expect(screen.getByRole("button", { name: /^Cartão Badge$/i })).toBeDefined();

      expect(screen.getByRole("button", { name: /Copiar Assinatura HTML/i })).toBeDefined();
      expect(screen.getByRole("button", { name: /Como Colar no Gmail\/Outlook/i })).toBeDefined();
    });

    it("abre o modal com guia de instalação para Gmail e Outlook", () => {
      render(
        <EmailSignatureStudio
          brandName="InovaTech"
          primaryColor="#0083C7"
          secondaryColor="#FA6305"
        />
      );

      const btnGuia = screen.getByRole("button", { name: /Como Colar no Gmail\/Outlook/i });
      fireEvent.click(btnGuia);

      expect(screen.getByText(/No Gmail \(Google Workspace\)/i)).toBeDefined();
      expect(screen.getByText(/No Outlook \(Web ou Aplicativo\)/i)).toBeDefined();
    });
  });

  describe("LetterheadStudio - Papel Timbrado Corporativo A4", () => {
    it("renderiza o layout A4 com cabeçalho oficial e modelos rápidos", () => {
      render(
        <LetterheadStudio
          brandName="InovaTech Soluções"
          slogan="Inovação que gera resultados"
          primaryColor="#0083C7"
          secondaryColor="#FA6305"
          initialPhone="11999998888"
          initialEmail="contato@inovatech.com"
          initialAddress="Av. Paulista, 1000 - São Paulo"
        />
      );

      expect(screen.getByText("Papel Timbrado Oficial Corporativo (A4)")).toBeDefined();
      expect(screen.getByText("Proposta")).toBeDefined();
      expect(screen.getByText("Orçamento")).toBeDefined();
      expect(screen.getByText("Ofício / Nota")).toBeDefined();

      // Botão de impressão / PDF e Cópia
      expect(screen.getByRole("button", { name: /Imprimir \/ Salvar em PDF/i })).toBeDefined();
      expect(screen.getByRole("button", { name: /Copiar Texto/i })).toBeDefined();
    });
  });

  describe("Integração das Sub-Abas na Página de Marca", () => {
    it("navega para a aba Papelaria & Digital e permite alternar entre os 3 sub-módulos", async () => {
      render(<BrandStudioPage />);

      // Aguarda carregar dados do Cérebro do Negócio
      await waitFor(() => {
        expect(screen.getByPlaceholderText("Ex: NumVapt Marketing")).toBeDefined();
      });

      // Clica na tab da Fase 2
      const tabPapelaria = screen.getByRole("tab", { name: /Papelaria/i });
      fireEvent.pointerDown(tabPapelaria);
      fireEvent.click(tabPapelaria);
      fireEvent.keyDown(tabPapelaria, { key: "Enter" });

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Cartão de Visitas \(Digital & Físico\)/i })).toBeDefined();
        expect(screen.getByRole("button", { name: /Assinatura de E-mail/i })).toBeDefined();
        expect(screen.getByRole("button", { name: /Papel Timbrado A4/i })).toBeDefined();
      });

      // Alterna para Assinatura de E-mail
      const subAbaAssinatura = screen.getByRole("button", { name: /Assinatura de E-mail/i });
      fireEvent.click(subAbaAssinatura);

      await waitFor(() => {
        expect(screen.getByText("Gerador de Assinatura de E-mail Profissional")).toBeDefined();
      });

      // Alterna para Papel Timbrado A4
      const subAbaTimbrado = screen.getByRole("button", { name: /Papel Timbrado A4/i });
      fireEvent.click(subAbaTimbrado);

      await waitFor(() => {
        expect(screen.getByText("Papel Timbrado Oficial Corporativo (A4)")).toBeDefined();
      });
    });
  });
});
