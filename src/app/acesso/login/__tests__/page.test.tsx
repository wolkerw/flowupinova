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
  it("renders email and password fields", () => {
    render(
      <AuthProvider>
        <Tabs value="login"><LoginPage /></Tabs>
      </AuthProvider>
    );

    // Check for email input
    expect(screen.getByLabelText(/E-mail/i)).toBeInTheDocument();

    // Check for password input
    expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument();

    // Check for login button
    expect(screen.getByRole("button", { name: /Entrar na Plataforma/i })).toBeInTheDocument();
  });
});
