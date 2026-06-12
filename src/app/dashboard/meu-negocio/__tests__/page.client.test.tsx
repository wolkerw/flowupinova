"use client";

import React from "react";
import { render, screen } from "@testing-library/react";
import MeuNegocioPageClient from "../page.client";
import { AuthProvider } from "@/components/auth/auth-provider";
import { Toaster } from "@/components/ui/toaster";
import { vi, describe, it, expect } from "vitest";

vi.mock("@/components/auth/auth-provider", () => {
  const user = { uid: "test-user-123", email: "test@example.com" };
  const auth = {
    user: user,
    loading: false,
    loginWithEmail: vi.fn().mockResolvedValue(undefined),
    signUpWithEmail: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
  };
  return {
    AuthProvider: ({ children }: any) => children,
    useAuth: () => auth,
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
    has: vi.fn().mockReturnValue(false),
  }),
}));

vi.mock("@/lib/services/business-profile-service", () => {
  const profile = {
    name: "Minha Empresa Teste",
    category: "Consultoria",
    address: "Rua Teste, 123",
    phone: "(11) 99999-9999",
    website: "www.teste.com",
    description: "Descrição de teste.",
    brandSummary: "Resumo da marca.",
    instagram: "",
    logo: { url: "", width: 0, height: 0 },
    rating: 4.5,
    totalReviews: 10,
    isVerified: true,
  };
  return {
    getBusinessProfile: vi.fn().mockResolvedValue(profile),
    updateBusinessProfile: vi.fn().mockResolvedValue(undefined),
    resetBusinessProfile: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock("@/lib/services/google-service", () => ({
  getGoogleConnection: vi.fn().mockResolvedValue({
    isConnected: false,
    accessToken: "",
    expiryDate: 0,
    refreshToken: "",
  }),
  updateGoogleConnection: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/services/onboarding-service", () => ({
  getOnboardingProfile: vi.fn().mockResolvedValue({}),
  updateOnboardingProfile: vi.fn().mockResolvedValue(undefined),
}));

describe("MeuNegocioPageClient", () => {
  it("renders the main title", async () => {
    const profile = {
      name: "Minha Empresa Teste",
      category: "Consultoria",
      address: "Rua Teste, 123",
      phone: "(11) 99999-9999",
      website: "www.teste.com",
      description: "Descrição de teste.",
      brandSummary: "Resumo da marca.",
      instagram: "",
      logo: { url: "", width: 0, height: 0 },
      rating: 4.5,
      totalReviews: 10,
      isVerified: true,
    };

    render(
      <AuthProvider>
        <Toaster />
        <MeuNegocioPageClient initialProfile={profile} />
      </AuthProvider>
    );

    expect(screen.getByText("Meu Negócio")).toBeInTheDocument();
    expect(screen.getByText("Gerencie seu perfil no Google Meu Negócio")).toBeInTheDocument();
  });
});
