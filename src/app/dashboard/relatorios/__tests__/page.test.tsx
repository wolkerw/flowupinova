"use client";

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Relatorios from "../page";
import { AuthProvider } from "@/components/auth/auth-provider";
import { vi, describe, it, expect, beforeEach } from "vitest";

const mockAuth = { user: { uid: "test-user" } };

vi.mock("@/components/auth/auth-provider", () => ({
  AuthProvider: ({ children }: any) => children,
  useAuth: () => mockAuth,
}));

vi.mock("@/lib/services/meta-service", () => ({
  getMetaConnection: vi.fn().mockResolvedValue({
    isConnected: true,
    adAccountId: "act_12345",
    adAccountName: "Minha Conta Meta",
  }),
}));

vi.mock("@/lib/services/instagram-service", () => ({
  getInstagramConnection: vi.fn().mockResolvedValue({ isConnected: false }),
}));

vi.mock("@/lib/services/linkedin-service", () => ({
  getLinkedInConnection: vi.fn().mockResolvedValue({ isConnected: false }),
}));

vi.mock("@/lib/services/google-ads-service", () => ({
  getGoogleAdsConnection: vi.fn().mockResolvedValue({
    isConnected: true,
    adAccountId: "123-456-7890",
    adAccountName: "Conta Google Ads Teste",
  }),
}));

vi.mock("@/lib/services/google-ads-service-admin", () => ({
  getGoogleAdsCampaigns: vi.fn().mockResolvedValue([
    {
      id: "g-1",
      name: "Campanha Pesquisa Google",
      status: "active",
      budgetAmount: 30,
      metrics: {
        impressions: 1200,
        clicks: 85,
        spent: 142.5,
      },
    },
  ]),
}));

// Mock Recharts to prevent errors during server-side rendering in tests
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", null, children),
  BarChart: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", null, children),
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  LineChart: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", null, children),
  Line: () => null,
  PieChart: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", null, children),
  Pie: () => null,
  Cell: () => null,
  Legend: () => null,
  AreaChart: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", null, children),
  Area: () => null,
}));

function activateTab(tabElement: HTMLElement) {
  fireEvent.pointerDown(tabElement, {
    bubbles: true,
    cancelable: true,
    button: 0,
    buttons: 1,
  });
  fireEvent.click(tabElement);
  fireEvent.focus(tabElement);
  fireEvent.keyDown(tabElement, { key: " ", code: "Space" });
}

describe("Relatorios Page", () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        campaigns: [
          {
            id: "m-1",
            name: "Campanha Black Friday Meta",
            status: "active",
            budget: { amount: 25 },
            metrics: {
              impressions: 5400,
              clicks: 320,
              actions: 45,
              amountSpent: 210,
            },
          },
        ],
      }),
    } as any);
  });

  it("renders the main title", async () => {
    render(
      <AuthProvider>
        <Relatorios />
      </AuthProvider>
    );
    expect(await screen.findByText("Relatórios")).toBeInTheDocument();
    expect(screen.getByText("Análise detalhada de performance")).toBeInTheDocument();
  });

  it("renders Instagram, Facebook, and LinkedIn tab triggers after data loads", async () => {
    render(
      <AuthProvider>
        <Relatorios />
      </AuthProvider>
    );
    expect(await screen.findByText("Instagram")).toBeInTheDocument();
    expect(screen.getByText("Facebook")).toBeInTheDocument();
    expect(screen.getByText("LinkedIn")).toBeInTheDocument();
  });

  it("renders and switches to the Campaigns tab and subtabs", async () => {
    render(
      <AuthProvider>
        <Relatorios />
      </AuthProvider>
    );
    const campaignsTab = screen.getByRole("tab", { name: /campanhas/i });
    expect(campaignsTab).toBeInTheDocument();
    expect(campaignsTab).not.toBeDisabled();

    activateTab(campaignsTab);

    expect(await screen.findByText("Performance de Campanhas Pagas")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /meta ads/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /google ads/i })).toBeInTheDocument();

    // Verify Meta Ads renders by default
    expect(await screen.findByText(/Campanhas Meta Ads/i)).toBeInTheDocument();
    expect(screen.getByText("Campanha Black Friday Meta")).toBeInTheDocument();

    // Switch to Google Ads subtab
    const googleSubTab = screen.getByRole("tab", { name: /google ads/i });
    activateTab(googleSubTab);
    expect(await screen.findByText(/Campanhas Google Ads/i)).toBeInTheDocument();
    expect(screen.getByText("Campanha Pesquisa Google")).toBeInTheDocument();
  });
});
