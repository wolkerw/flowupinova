"use client";

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AnunciosPageClient from "../page.client";
import { AuthProvider } from "@/components/auth/auth-provider";
import { Toaster } from "@/components/ui/toaster";

const mockUser = { uid: "test-user-123" };
const mockAuthValue = { user: mockUser, loading: false };

// Mock Auth using stable references
jest.mock("@/components/auth/auth-provider", () => ({
  ...jest.requireActual("@/components/auth/auth-provider"),
  useAuth: () => mockAuthValue,
}));

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => "/dashboard/anuncios",
}));

// Mock posts service
jest.mock("@/lib/services/posts-service", () => ({
  getScheduledPosts: jest.fn().mockResolvedValue([
    {
      success: true,
      post: {
        id: "post-1",
        text: "Promoção especial de pizza artesanal!",
        imageUrl: "https://example.com/pizza.jpg",
        status: "published",
        isBoosted: false,
      },
    },
  ]),
}));

// Mock ads service
jest.mock("@/lib/services/anuncios-service", () => ({
  createAdCampaign: jest.fn().mockResolvedValue({ success: true, id: "campaign-1" }),
  getUserAdCampaigns: jest.fn().mockResolvedValue([]),
  updateAdCampaignStatus: jest.fn().mockResolvedValue({ success: true }),
  deleteAdCampaign: jest.fn().mockResolvedValue(undefined),
  estimateReach: () => ({
    minReach: 5000,
    maxReach: 15000,
    minClicks: 100,
    maxClicks: 300,
  }),
}));

// Mock meta service
jest.mock("@/lib/services/meta-service", () => ({
  getMetaConnection: jest.fn().mockResolvedValue({
    isConnected: true,
    adAccountId: "act_123456",
    adAccountName: "Conta de Teste",
    userAccessToken: "token-123",
  }),
  updateMetaConnection: jest.fn().mockResolvedValue({ success: true }),
}));

const mockProfile = {
  name: "Pizzaria Teste",
  category: "Alimentação",
  address: "Rua das Flores, 123",
  phone: "(11) 99999-9999",
  website: "www.pizzariateste.com",
  description: "A melhor pizza no forno a lenha.",
  brandSummary: "Resumo da marca.",
  instagram: "pizzariateste",
  logo: { url: "https://example.com/logo.png", width: 100, height: 100 },
  rating: 4.8,
  totalReviews: 45,
  isVerified: true,
};

describe("AnunciosPageClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock window.fetch globally
    window.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes("/api/ads/billing-status")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            billing: {
              hasPaymentMethod: true,
              accountStatus: 1,
              balance: 150.00,
              isPrepaid: true,
              fundingSourceDetails: { display_string: "Pix" },
              businessId: "123456",
            }
          }),
        });
      }
      if (url.includes("/api/ads/campaigns")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            campaigns: [],
          }),
        });
      }
      if (url.includes("/api/ads/interests")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            interests: [
              { id: "1", name: "Pizza", path: ["Comida", "Pizza"] },
              { id: "2", name: "Hambúrguer", path: ["Comida", "Hambúrguer"] }
            ],
          }),
        });
      }
      if (url.includes("/api/meta/page-whatsapp")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            hasWhatsApp: true,
            pageName: "Pizzaria Teste",
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
    });
  });

  it("renders main titles and metrics dashboard", async () => {
    render(
      <AuthProvider>
        <Toaster />
        <AnunciosPageClient initialProfile={mockProfile} />
      </AuthProvider>
    );

    // Deve mostrar o título principal após o carregamento
    await waitFor(() => {
      expect(screen.getByText("Seus Impulsionamentos")).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // Deve exibir o post publicado elegível para impulsionamento (esperando o loading terminar)
    await waitFor(() => {
      expect(screen.getByText("Selecione um de seus posts publicados e configure o raio e orçamento do seu anúncio local para começar a atrair novos clientes na sua região.")).toBeInTheDocument();
    }, { timeout: 5000 });

    // Deve mostrar os cards de métricas simplificados para leigos
    expect(screen.getByText("Valor Investido")).toBeInTheDocument();
    expect(screen.getByText("Visualizações")).toBeInTheDocument();
    expect(screen.getByText("Cliques")).toBeInTheDocument();
  });

  it("opens the boosting wizard when clicking on Impulsionar button", async () => {
    render(
      <AuthProvider>
        <Toaster />
        <AnunciosPageClient initialProfile={mockProfile} />
      </AuthProvider>
    );

    // Aguarda o carregamento inicial da tela
    await waitFor(() => {
      expect(screen.getByText("Seus Impulsionamentos")).toBeInTheDocument();
    }, { timeout: 5000 });

    // Clica no botão para abrir o modal de seleção de posts
    const openModalButton = await screen.findByRole("button", { name: /Impulsionar um Post/i });
    fireEvent.click(openModalButton);

    // Aguarda o post ser exibido no modal
    await waitFor(() => {
      expect(screen.getByText("Promoção especial de pizza artesanal!")).toBeInTheDocument();
    }, { timeout: 5000 });

    // Seleciona o post para impulsionar dentro do modal
    const boostButton = screen.getByRole("button", { name: /Impulsionar/i });
    expect(boostButton).toBeInTheDocument();
    fireEvent.click(boostButton);

    // O cabeçalho do wizard e o passo 1 devem aparecer
    await waitFor(() => {
      expect(screen.getByText("Impulsionando Post")).toBeInTheDocument();
      expect(screen.getByText("1. Qual é o objetivo do seu impulsionamento?")).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});
