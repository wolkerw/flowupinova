"use client";

import React from "react";
import { render, screen } from "@testing-library/react";
import AnunciosPage from "../page";
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
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => ({
    get: vi.fn(),
    has: vi.fn().mockReturnValue(false),
  }),
}));

vi.mock("@/lib/firebase-admin", () => ({
  getUidFromCookie: vi.fn().mockResolvedValue("test-user-123"),
}));

vi.mock("@/lib/services/business-profile-service-admin", () => ({
  getBusinessProfileAdmin: vi.fn().mockResolvedValue({
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
  }),
}));

// Mock dos serviços usados pelo page.client interno
vi.mock("@/lib/services/meta-service", () => ({
  getMetaConnection: vi.fn().mockResolvedValue({ isConnected: false }),
}));

vi.mock("@/lib/services/instagram-service", () => ({
  getInstagramConnection: vi.fn().mockResolvedValue({ isConnected: false }),
}));

describe("Anuncios Page", () => {
  it("renders the main title", async () => {
    // Resolve o Server Component assíncrono
    const jsx = await AnunciosPage();
    render(
      <AuthProvider>
        <Toaster />
        {jsx}
      </AuthProvider>
    );
    expect(screen.getByText("Anúncios Pagos (Meta Ads)")).toBeInTheDocument();
  });
});
