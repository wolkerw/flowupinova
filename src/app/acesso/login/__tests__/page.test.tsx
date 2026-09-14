"use client";

import React from "react";
import { render, screen } from "@testing-library/react";
import LoginPage from "../page";
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
  usePathname: () => "/acesso/login",
}));

describe("LoginPage", () => {
  it("renders login fields, google button and forgot password link", () => {
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );

    // Check heading and subtitle
    expect(screen.getByRole("heading", { name: /Acesse sua conta/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/Preencha seus dados para continuar/i)).toBeInTheDocument();

    // Check email and password inputs
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument();

    // Check forgot password button
    expect(screen.getByRole("button", { name: /Esqueci minha senha/i })).toBeInTheDocument();

    // Check submit button
    expect(screen.getByRole("button", { name: /^Entrar$/i })).toBeInTheDocument();

    // Check link to signup
    expect(screen.getByRole("link", { name: /Criar conta grátis/i })).toBeInTheDocument();
  });
});
