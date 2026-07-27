"use client";

import React from "react";
import { render, screen } from "@testing-library/react";
import Conteudo from "../page";
import { AuthProvider } from "@/components/auth/auth-provider";
import { Toaster } from "@/components/ui/toaster";
import { vi, describe, it, expect } from "vitest";

const mockUser = { uid: "test-user-123", email: "test@example.com" };
const mockAuth = {
  user: mockUser,
  loading: false,
  loginWithEmail: vi.fn().mockResolvedValue(undefined),
  signUpWithEmail: vi.fn().mockResolvedValue(undefined),
  logout: vi.fn().mockResolvedValue(undefined),
};

vi.mock("@/components/auth/auth-provider", () => ({
  AuthProvider: ({ children }: any) => children,
  useAuth: () => mockAuth,
}));

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

// Mock services
vi.mock("@/lib/services/posts-service", () => ({
  getScheduledPosts: vi.fn().mockResolvedValue([]),
  deletePost: vi.fn().mockResolvedValue(undefined),
  schedulePost: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/lib/services/meta-service", () => ({
  getMetaConnection: vi.fn().mockResolvedValue({ isConnected: false }),
  updateMetaConnection: vi.fn().mockResolvedValue(undefined),
}));

describe("Conteudo Page", () => {
  it("renders the main title and section header", async () => {
    render(
      <AuthProvider>
        <Toaster />
        <Conteudo />
      </AuthProvider>
    );
    expect(await screen.findByText("Conteúdo & Marketing")).toBeInTheDocument();
    expect(screen.getByText("Criar nova publicação")).toBeInTheDocument();
    expect(screen.getByText("Com IA")).toBeInTheDocument();
    expect(screen.getByText("Enviando Foto de Produto")).toBeInTheDocument();
    expect(screen.getByText("Enviando Imagem de Pessoa e Produto/Projeto")).toBeInTheDocument();
    expect(screen.getByText("Manual")).toBeInTheDocument();
  });
});
