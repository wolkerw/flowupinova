"use client";

import React from "react";
import { render, screen } from "@testing-library/react";
import CadastroPage from "../page";
import { Tabs } from "@/components/ui/tabs";
import { AuthProvider } from "@/components/auth/auth-provider";

// Mock useAuth hook
vi.mock("@/components/auth/auth-provider", () => ({
  AuthProvider: ({ children }: any) => children,
  useAuth: () => ({
    user: { uid: "test-user-123", email: "test@example.com" },
    loading: false,
    loginWithEmail: vi.fn().mockResolvedValue(undefined),
    signUpWithEmail: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
  }),
}));

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  usePathname: () => "/acesso/cadastro",
}));

describe("CadastroPage", () => {
  it("renders all required form fields", () => {
    render(
      <AuthProvider>
        <Tabs value="cadastrar"><CadastroPage /></Tabs>
      </AuthProvider>
    );

    expect(screen.getByLabelText(/Nome da Empresa/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Telefone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/E-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Segmento de Negócio/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Criar Minha Conta/i })).toBeInTheDocument();
  });
});
