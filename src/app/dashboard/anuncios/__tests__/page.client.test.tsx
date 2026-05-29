"use client";

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AnunciosPageClient from "../page.client";
import { AuthProvider } from "@/components/auth/auth-provider";
import { Toaster } from "@/components/ui/toaster";

// Mock Auth
jest.mock("@/components/auth/auth-provider", () => ({
  ...jest.requireActual("@/components/auth/auth-provider"),
  useAuth: () => ({
    user: { uid: "test-user-123" },
    loading: false,
  }),
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
      expect(screen.getByText("Anúncios Pagos (Meta Ads)")).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // Deve mostrar os cards de métricas simplificados para leigos
    expect(screen.getByText("Investimento Total")).toBeInTheDocument();
    expect(screen.getByText("Pessoas Alcançadas")).toBeInTheDocument();
    expect(screen.getByText("Ações e Cliques")).toBeInTheDocument();

    // Deve exibir o post publicado elegível para impulsionamento
    expect(screen.getByText("Promoção especial de pizza artesanal!")).toBeInTheDocument();
  });

  it("opens the boosting wizard when clicking on Impulsionar button", async () => {
    render(
      <AuthProvider>
        <Toaster />
        <AnunciosPageClient initialProfile={mockProfile} />
      </AuthProvider>
    );

    // Aguarda o carregamento do post na tela
    await waitFor(() => {
      expect(screen.getByText("Promoção especial de pizza artesanal!")).toBeInTheDocument();
    }, { timeout: 5000 });

    const boostButton = screen.getByRole("button", { name: /Impulsionar/i });
    expect(boostButton).toBeInTheDocument();

    // Clica para impulsionar o post
    fireEvent.click(boostButton);

    // O cabeçalho do wizard e o passo 1 devem aparecer
    expect(screen.getByText("Impulsionando Post")).toBeInTheDocument();
    expect(screen.getByText("1. O que seu anúncio vai dizer?")).toBeInTheDocument();
    expect(screen.getByLabelText("Título Chamativo (Curto)")).toBeInTheDocument();
  });
});
