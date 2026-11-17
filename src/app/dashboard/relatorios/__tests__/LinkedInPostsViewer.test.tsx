"use client";

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { LinkedInPostsViewer } from "../_components/LinkedInPostsViewer";
import { vi, describe, it, expect, beforeEach } from "vitest";

const mockAuth = {
  user: { uid: "user-123" },
  getIdToken: vi.fn().mockResolvedValue("mock-token"),
};

vi.mock("@/components/auth/auth-provider", () => ({
  useAuth: () => mockAuth,
}));

describe("LinkedInPostsViewer Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        totals: { impressions: 150, likes: 12, comments: 3, shares: 2, clicks: 9 },
        posts: [
          {
            id: "urn:li:share:123",
            text: "Post de teste corporativo NumVapt",
            createdTime: new Date().toISOString(),
            permalink: "https://www.linkedin.com/feed/update/urn:li:share:123/",
            status: "trending",
            metrics: {
              impressions: 150,
              likes: 12,
              comments: 3,
              shares: 2,
              clicks: 9,
              engagementRate: "17.33%",
            },
          },
        ],
      }),
    } as any);
  });

  it("renders disconnected state when connection is not active", () => {
    render(<LinkedInPostsViewer connection={{ isConnected: false }} />);

    expect(screen.getByText("Conta do LinkedIn não conectada")).toBeInTheDocument();
    expect(screen.getByText("Conectar LinkedIn")).toBeInTheDocument();
  });

  it("renders connected dashboard with real metrics, clicks, and posts when connected", async () => {
    render(
      <LinkedInPostsViewer
        connection={{
          isConnected: true,
          personName: "Bruno Rangel",
          selectedOrganizationName: "Empresa Teste",
          publishTarget: "organization",
        }}
      />
    );

    expect(screen.getAllByText("Empresa Teste").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Impressões")).toBeInTheDocument();
    expect(screen.getByText("Reações Totais")).toBeInTheDocument();
    expect(screen.getByText("Comentários")).toBeInTheDocument();
    expect(screen.getByText("Compartilhamentos")).toBeInTheDocument();
    expect(screen.getAllByText("Cliques").length).toBeGreaterThanOrEqual(1);

    await waitFor(() => {
      expect(screen.getByText("Post de teste corporativo NumVapt")).toBeInTheDocument();
    });

    expect(
      screen.getByText("Estratégia & Recomendações para LinkedIn")
    ).toBeInTheDocument();
  });
});
