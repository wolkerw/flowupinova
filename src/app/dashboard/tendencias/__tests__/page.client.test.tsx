import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TendenciasPageClient from "../page.client";
import { parseGoogleTrendsHtmlDs0, parseGoogleNewsNicheRss } from "@/app/api/trends/route";

const mockPush = vi.fn();
const mockAuth = {
  user: { uid: "user-123" },
  loading: false,
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock("@/components/auth/auth-provider", () => ({
  useAuth: () => mockAuth,
}));

vi.mock("@/lib/services/onboarding-service", () => ({
  getOnboardingProfile: vi.fn().mockResolvedValue({
    name: "Clínica Sorriso",
    category: "Odontologia Estética",
    keyProducts: "Lentes de contato dental, clareamento",
  }),
}));

const mockTrendsResponse = {
  success: true,
  fetchedAt: new Date().toISOString(),
  geo: "BR",
  period: "today",
  hours: 24,
  sourceUrl: "https://trends.google.com.br/trending?geo=BR&hl=pt-BR&hours=24",
  trends: [
    {
      id: "trend-0-regina-torne",
      title: "regina torné",
      approxTraffic: "100 mil+",
      trafficVolume: 100000,
      growthPercent: 1000,
      isActive: true,
      relevanceRank: 1,
      relatedQueries: ["chaves"],
      pubDate: new Date().toISOString(),
      trendsUrl:
        "https://trends.google.com.br/trends/explore?q=regina%20torn%C3%A9&geo=BR&hl=pt-BR",
      sourceLabel: "Google Trends Brasil",
      newsArticles: [
        {
          title: "Atriz que viveu Paty em Chaves vira assunto nas redes",
          url: "https://exemplo.com/noticia-regina",
          source: "Portal Entretenimento",
        },
      ],
    },
  ],
  relatedSuggestions: ["odontologia estetica", "clareamento dental"],
};

describe("TendenciasPageClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockTrendsResponse,
    } as any);
  });

  it("renders simplified Google Trends items, automatic niche tab, and news sources", async () => {
    render(<TendenciasPageClient />);

    expect(screen.getByText(/Tendências no Google/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Seu Mercado/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Em Alta Hoje/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Últimos 7 Dias/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("regina torné")).toBeInTheDocument();
    });

    expect(screen.getByText(/100 mil\+ buscas/i)).toBeInTheDocument();
    expect(
      screen.getByText("Atriz que viveu Paty em Chaves vira assunto nas redes")
    ).toBeInTheDocument();
    expect(screen.getByText(/Fonte: Portal Entretenimento/i)).toBeInTheDocument();
  });

  it("switches to automatic company niche trends when clicking Seu Mercado", async () => {
    render(<TendenciasPageClient />);

    await waitFor(() => {
      expect(screen.getByText("regina torné")).toBeInTheDocument();
    });

    const nicheBtn = screen.getByRole("button", { name: /Seu Mercado/i });
    fireEvent.click(nicheBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("period=niche"),
        expect.any(Object)
      );
    });
  });

  it("switches to 7-day trends when clicking Últimos 7 Dias", async () => {
    render(<TendenciasPageClient />);

    await waitFor(() => {
      expect(screen.getByText("regina torné")).toBeInTheDocument();
    });

    const weekBtn = screen.getByRole("button", { name: /Últimos 7 Dias/i });
    fireEvent.click(weekBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("period=week"),
        expect.any(Object)
      );
    });
  });

  it("navigates to post generator with pre-filled topic when clicking Create Post", async () => {
    render(<TendenciasPageClient />);

    await waitFor(() => {
      expect(screen.getByText("regina torné")).toBeInTheDocument();
    });

    const createBtn = screen.getByRole("button", {
      name: /Criar Post sobre esse Assunto/i,
    });
    fireEvent.click(createBtn);

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush.mock.calls[0][0]).toContain("/dashboard/posts/gerar?mode=text&topic=");
  });

  it("parses AF_initDataCallback ds:0 HTML payload and Google News Niche RSS", () => {
    const sampleHtml = `
      <script>AF_initDataCallback({key: 'ds:0', hash: '1', data:[null,[["regina torné",null,"BR",[1794450600],null,null,100000,null,1000,["regina torné","chaves"]],["benefício de prestação continuada",null,"BR",[1794430000],null,null,50000,null,1000,["bpc loas"]]]], sideChannel: {}});</script>
    `;
    const parsed = parseGoogleTrendsHtmlDs0(sampleHtml, "BR", new Map());
    expect(parsed).toHaveLength(2);
    expect(parsed[0].title).toBe("regina torné");

    const sampleNicheXml = `
      <rss><channel>
        <item>
          <title>Mercado de Odontologia cresce 25% no Brasil - Valor Econômico</title>
          <link>https://valor.globo.com/odonto</link>
          <pubDate>Thu, 12 Nov 2026 12:00:00 GMT</pubDate>
          <source url="https://valor.globo.com">Valor Econômico</source>
        </item>
      </channel></rss>
    `;
    const nicheItems = parseGoogleNewsNicheRss(sampleNicheXml, "Odontologia", "BR");
    expect(nicheItems).toHaveLength(1);
    expect(nicheItems[0].title).toBe("Mercado de Odontologia cresce 25% no Brasil");
    expect(nicheItems[0].sourceLabel).toBe("Valor Econômico");
  });
});
