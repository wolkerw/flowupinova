"use client";

import React from "react";
import { render, screen } from "@testing-library/react";
import HomePage from "../page";
import { AuthProvider } from "@/components/auth/auth-provider";
import { vi, describe, it, expect } from "vitest";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  usePathname: () => "/",
  useScroll: () => ({ scrollYProgress: { toJSON: () => 0 } }),
  useTransform: (value: any) => value,
}));

const mockUser = null;
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

describe("HomePage", () => {
  it("renders the main headline", () => {
    render(
      <AuthProvider>
        <HomePage />
      </AuthProvider>
    );
    expect(screen.getAllByText(/O marketing da/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/por você/i)).toBeInTheDocument();
  });
});
