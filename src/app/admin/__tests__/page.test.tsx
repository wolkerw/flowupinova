"use client";

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import AdminDashboardPage from "../page";
import { vi, describe, it, expect } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
}));

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: async () => ({
    stats: {
      totalUsers: 15,
      newUsersToday: 2,
      newUsersThisWeek: 5,
      trialUsers: 10,
      standardUsers: 5,
      trialExpiredUsers: 1,
      totalImagesGenerated: 50,
      totalPostsPublished: 30,
      totalPostsFailed: 2,
      totalChatSessions: 12,
      estimatedCostFalai: 0.25,
      estimatedCostImagen4: 0.15,
      estimatedCostNanoBanana: 0.09,
      estimatedCostGemini: 0.05,
      estimatedCostTotal: 0.54,
    },
    signups: [{ date: "2026-07-24", count: 2 }],
    imageModelsUsage: [
      {
        model: "imagen-3.0-generate-002",
        count: 10,
        totalCostUsd: 0.3,
        avgCostUsd: 0.03,
        avgCostBrl: 0.17,
      },
    ],
    googleAiStudio: {
      connected: true,
      statusMessage: "Conectado com sucesso (50 modelos ativos no Google AI Studio).",
      availableModelsCount: 50,
      totalRequests: 25,
      totalPromptTokens: 15000,
      totalCompletionTokens: 3500,
      totalTokens: 18500,
      totalImagesGenerated: 10,
      totalCostUsd: 0.45,
      totalCostBrl: 2.54,
      usdToBrlRate: 5.65,
      modelsUsage: [
        {
          model: "gemini-2.0-flash",
          provider: "google_gemini",
          type: "chat",
          requestsCount: 20,
          promptTokens: 12000,
          completionTokens: 3000,
          totalTokens: 15000,
          costUsd: 0.15,
          costBrl: 0.85,
        },
      ],
    },
  }),
});

describe("AdminDashboardPage", () => {
  it("renders the admin dashboard, period filter selector, image models pie chart, and Google AI Studio real stats section", async () => {
    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });

    expect(screen.getByText("30D")).toBeInTheDocument();
    expect(screen.getByText(/Modelos de Imagem/)).toBeInTheDocument();
    expect(screen.getByText("AI Studio Conectado")).toBeInTheDocument();
    expect(screen.getByText("gemini-2.0-flash")).toBeInTheDocument();
  });
});
