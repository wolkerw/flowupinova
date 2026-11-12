import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TendenciasPageClient from "../page.client";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockTrendsResponse = {
  success: true,
  fetchedAt: new Date().toISOString(),
  geo: "BR",
  sourceUrl: "https://trends.google.com.br/trending?geo=BR&hl=pt-BR",
  trends: [
    {
      id: "trend-0-inteligencia-artificial",
      title: "Inteligência Artificial no Varejo",
      approxTraffic: "50.000+",
      pubDate: new Date().toUTCString(),
      trendsUrl:
        "https://trends.google.com.br/trends/explore?q=Intelig%C3%AAncia%20Artificial&geo=BR&hl=pt-BR",
      sourceLabel: "Google Trends Brasil (Tempo Real)",
      newsArticles: [
        {
          title: "Pequenas empresas adotam IA para vendas em 2026",
          url: "https://exemplo.com/noticia-ia",
          source: "Portal Economia",
        },
      ],
    },
  ],
  relatedSuggestions: ["inteligencia artificial para empresas", "ia marketing digital"],
};

describe("TendenciasPageClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockTrendsResponse,
    } as any);
  });

  it("renders verified Google Trends items and news sources", async () => {
    render(<TendenciasPageClient />);

    expect(screen.getByText(/Tendências no Google/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Fonte Verificada: Google Trends Brasil \(Ao Vivo\)/i)
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Inteligência Artificial no Varejo")).toBeInTheDocument();
    });

    expect(screen.getByText(/50\.000\+ buscas/i)).toBeInTheDocument();
    expect(
      screen.getByText("Pequenas empresas adotam IA para vendas em 2026")
    ).toBeInTheDocument();
    expect(screen.getByText(/Fonte: Portal Economia/i)).toBeInTheDocument();
  });

  it("navigates to post generator with pre-filled topic when clicking Create Post", async () => {
    render(<TendenciasPageClient />);

    await waitFor(() => {
      expect(screen.getByText("Inteligência Artificial no Varejo")).toBeInTheDocument();
    });

    const createBtn = screen.getByRole("button", {
      name: /Criar Post sobre essa Tendência/i,
    });
    fireEvent.click(createBtn);

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush.mock.calls[0][0]).toContain("/dashboard/posts/gerar?mode=text&topic=");
  });
});
