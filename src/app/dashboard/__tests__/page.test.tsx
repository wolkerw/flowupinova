"use client";

import React from "react";
import { render, screen } from "@testing-library/react";
import Dashboard from "../page";
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

// Mock services to prevent actual API calls during testing
vi.mock("@/lib/services/meta-service", () => ({
  getMetaConnection: vi.fn().mockResolvedValue({ isConnected: false }),
}));

vi.mock("@/lib/services/business-profile-service", () => ({
  getBusinessProfile: vi.fn().mockResolvedValue({ isVerified: false, logo: null }),
}));

vi.mock("@/lib/services/chat-service", () => ({
  getChatHistory: vi.fn().mockResolvedValue([]),
  saveChatHistory: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  getDoc: vi.fn().mockResolvedValue({
    exists: () => true,
    data: () => ({ plan: "trial", createdAt: { toDate: () => new Date() } }),
  }),
  onSnapshot: vi.fn((ref, onNext) => {
    if (onNext) {
      setTimeout(() => {
        onNext({
          exists: () => true,
          data: () => ({
            plan: "trial",
            role: "free",
            subscriptionStatus: "",
            createdAt: { toDate: () => new Date() },
            name: "Test Business",
            logo: { url: "test-logo-url", width: 100, height: 100 },
          }),
        });
      }, 0);
    }
    return vi.fn();
  }),
  dummy: {
    exists: () => true,
    data: () => ({ plan: "trial", createdAt: { toDate: () => new Date() } }),
  },
}));

vi.mock("@/lib/firebase", () => ({
  db: {},
}));

describe("Dashboard Page", () => {
  it("renders the main title and welcome message", async () => {
    render(
      <AuthProvider>
        <Toaster />
        <Dashboard />
      </AuthProvider>
    );
    expect(await screen.findByText("Início")).toBeInTheDocument();
    expect(screen.getByText("Visão geral do seu marketing digital")).toBeInTheDocument();
  });
});
