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
  if (typeof url === "string" && url.includes("/api/ads/campaigns")) {
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
      expect(screen.getByText("Seus Impulsionamentos")).toBeInTheDocument();
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

    // Deve mostrar o botão principal de Impulsionar Post
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Impulsionar Post/i })).toBeInTheDocument();
    }, { timeout: 5000 });

    const openModalButton = screen.getByRole("button", { name: /Impulsionar Post/i });
    fireEvent.click(openModalButton);

    // Aguarda o carregamento do post qualificável dentro do modal
    await waitFor(() => {
      expect(screen.getByText("Promoção especial de pizza artesanal!")).toBeInTheDocument();
    }, { timeout: 5000 });

    // Clica no botão "Impulsionar" do post específico no modal
    const boostButton = screen.getByRole("button", { name: /^Impulsionar$/i });
    fireEvent.click(boostButton);

    // O cabeçalho do wizard e o passo 1 devem aparecer
    expect(screen.getByText("Impulsionando Post")).toBeInTheDocument();
    expect(screen.getByText("1. Qual é o objetivo do seu impulsionamento?")).toBeInTheDocument();
  });
});
