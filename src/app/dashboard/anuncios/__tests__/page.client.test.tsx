"use client";

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AnunciosPageClient from "../page.client";
import { AuthProvider } from "@/components/auth/auth-provider";
import { Toaster } from "@/components/ui/toaster";
import { vi, describe, it, expect, beforeEach } from "vitest";

const mockUser = { uid: "test-user-123", email: "test@example.com" };
const mockAuth = {
  user: mockUser,
  loading: false,
  loginWithEmail: vi.fn().mockResolvedValue(undefined),
  signUpWithEmail: vi.fn().mockResolvedValue(undefined),
  logout: vi.fn().mockResolvedValue(undefined),
};

// Mock Auth
vi.mock("@/components/auth/auth-provider", () => ({
  AuthProvider: ({ children }: any) => children,
  useAuth: () => mockAuth,
}));

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
    has: vi.fn().mockReturnValue(false),
  }),
  usePathname: () => "/dashboard/anuncios",
}));

// Mock posts service
vi.mock("@/lib/services/posts-service", () => ({
  getScheduledPosts: vi.fn().mockResolvedValue([
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

// Mock meta service
vi.mock("@/lib/services/meta-service", () => ({
  getMetaConnection: vi.fn().mockResolvedValue({
    isConnected: true,
    adAccountId: "act_123456",
    adAccountName: "Conta Teste",
  }),
  updateMetaConnection: vi.fn().mockResolvedValue(undefined),
}));

// Mock google ads service
vi.mock("@/lib/services/google-ads-service", () => ({
  getGoogleAdsConnection: vi.fn().mockResolvedValue({
    isConnected: true,
    adAccountId: "123-456-7890",
    adAccountName: "Conta Teste Google Ads",
  }),
  updateGoogleAdsConnection: vi.fn().mockResolvedValue(undefined),
}));

// Mock google ads service admin
vi.mock("@/lib/services/google-ads-service-admin", () => ({
  getGoogleAdsCampaigns: vi.fn().mockResolvedValue([
    {
      id: "mock-campaign-1",
      name: "Promoção Sorveteria Local (Pesquisa)",
      status: "active",
      budgetAmount: 15.0,
      metrics: { impressions: 1240, clicks: 88, amountSpent: 42.5 },
    }
  ]),
  updateGoogleAdsCampaignStatus: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock ads service
vi.mock("@/lib/services/anuncios-service", () => ({
  createAdCampaign: vi.fn().mockResolvedValue({ success: true, id: "campaign-1" }),
  getUserAdCampaigns: vi.fn().mockResolvedValue([]),
  updateAdCampaignStatus: vi.fn().mockResolvedValue({ success: true }),
  deleteAdCampaign: vi.fn().mockResolvedValue(undefined),
  estimateReach: () => ({
    minReach: 5000,
    maxReach: 15000,
    minClicks: 100,
    maxClicks: 300,
  }),
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

// Mock do fetch global
globalThis.fetch = vi.fn().mockImplementation((url) => {
  const urlStr = typeof url === "string" ? url : String(url);
  if (urlStr.includes("/api/ads/campaigns")) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        campaigns: [
          {
            id: "campaign-1",
            name: "[NUMVAPT] Promoção especial de pizza artesanal!",
            status: "active",
            postId: "post-1",
            creative: {
              headline: "Promoção especial de pizza artesanal!",
              bodyText: "Promoção especial de pizza artesanal!",
              imageUrl: "https://example.com/pizza.jpg",
            },
            budget: { amount: 1000 },
            durationDays: 5,
            metrics: {
              impressions: 15000,
              clicks: 450,
              actions: 380,
              amountSpent: 50,
            },
          }
        ],
      }),
    } as any);
  }
  if (urlStr.includes("/api/ads/billing-status")) {
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
    } as any);
  }
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true }),
  } as any);
});

describe("AnunciosPageClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
      expect(screen.getByText("Central de Anúncios Locais")).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // Deve mostrar os cards de métricas simplificados para leigos
    expect(screen.getByText("Valor Investido")).toBeInTheDocument();
    expect(screen.getAllByText("Visualizações").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Cliques").length).toBeGreaterThan(0);

    // Deve exibir a campanha ativa no histórico
    expect(screen.getByText("[NUMVAPT] Promoção especial de pizza artesanal!")).toBeInTheDocument();
  });

  it("opens the boosting wizard when clicking on Impulsionar button", async () => {
    render(
      <AuthProvider>
        <Toaster />
        <AnunciosPageClient initialProfile={mockProfile} />
      </AuthProvider>
    );

    // Deve mostrar o botão principal de Impulsionar Publicação
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Impulsionar Publicação/i })).toBeInTheDocument();
    }, { timeout: 5000 });

    const openModalButton = screen.getByRole("button", { name: /Impulsionar Publicação/i });
    fireEvent.click(openModalButton);

    // Aguarda o carregamento do post qualificável dentro do modal
    await waitFor(() => {
      expect(screen.getByText("Promoção especial de pizza artesanal!")).toBeInTheDocument();
    }, { timeout: 5000 });

    // Clica no botão "Impulsionar" do post específico no modal
    const boostButton = screen.getByRole("button", { name: /^Impulsionar$/i });
    fireEvent.click(boostButton);

    // O cabeçalho do wizard e o passo 1 devem aparecer
    await waitFor(() => {
      expect(screen.getByText("Impulsionando Post")).toBeInTheDocument();
      expect(screen.getByText("1. Qual é o objetivo do seu impulsionamento?")).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it("allows switching to Google Ads platform tab and opening creation dialog", async () => {
    render(
      <AuthProvider>
        <Toaster />
        <AnunciosPageClient initialProfile={mockProfile} />
      </AuthProvider>
    );

    // Deve mostrar os botões do seletor de plataforma
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Google Ads/i })).toBeInTheDocument();
    });

    const googleTabButton = screen.getByRole("button", { name: /Google Ads/i });
    fireEvent.click(googleTabButton);

    // Deve mostrar a campanha mockada do Google Ads
    await waitFor(() => {
      expect(screen.getByText("Promoção Sorveteria Local (Pesquisa)")).toBeInTheDocument();
    });

    // Deve mostrar o botão de criar anúncio no Google
    const createAdButton = screen.getByRole("button", { name: /Criar Anúncio Google/i });
    expect(createAdButton).toBeInTheDocument();

    // Clica para abrir o modal de criação do Google Ads
    fireEvent.click(createAdButton);

    // O modal deve abrir com o título
    await waitFor(() => {
      expect(screen.getByText("Criar Campanha no Google Ads")).toBeInTheDocument();
    });
  });
});
