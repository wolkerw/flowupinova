"use client";

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import Anuncios from "../page";
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
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/dashboard/anuncios",
}));

// Mock client component to avoid rendering the heavy logic
jest.mock("../page.client", () => {
  return function MockPageClient({ initialProfile }: any) {
    return (
      <div>
        <h1>Criar Novo Anúncio</h1>
        <p>Perfil: {initialProfile?.name}</p>
      </div>
    );
  };
});

// Mock server-side dependencies to prevent Jest from importing firebase-admin and jose ESM
jest.mock("@/lib/firebase-admin", () => ({
  getUidFromCookie: jest.fn().mockResolvedValue("test-user-123"),
}));

jest.mock("@/lib/services/business-profile-service-admin", () => ({
  getBusinessProfileAdmin: jest.fn().mockResolvedValue({
    name: "Pizzaria Teste",
    category: "Alimentação",
  }),
}));

describe("Anuncios Page", () => {
  it("renders the main title", async () => {
    // @ts-ignore
    const pageElement = await Anuncios();
    render(
      <AuthProvider>
        <Toaster />
        {pageElement}
      </AuthProvider>
    );
    await waitFor(() => {
      expect(screen.getByText("Criar Novo Anúncio")).toBeInTheDocument();
    });
  });
});
