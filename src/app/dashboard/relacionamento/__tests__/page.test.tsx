"use client";

import React from "react";
import { render, screen } from "@testing-library/react";
import Relacionamento from "../page";
import { AuthProvider } from "@/components/auth/auth-provider";
import { Toaster } from "@/components/ui/toaster";

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

vi.mock("@/lib/services/contacts-service", () => ({
  getContacts: vi.fn().mockResolvedValue([]),
  addContact: vi.fn().mockResolvedValue(undefined),
}));

describe("Relacionamento Page", () => {
  it("renders the main title", async () => {
    render(
      <AuthProvider>
        <Toaster />
        <Relacionamento />
      </AuthProvider>
    );
    expect(await screen.findByText("Relacionamento")).toBeInTheDocument();
    expect(screen.getByText("Gerencie leads e clientes")).toBeInTheDocument();
  });
});
