import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AdminConciergePage from "../page";

const mockPosts = [
  {
    id: "post_1",
    userId: "u1",
    clientName: "Empresa Alfa",
    clientEmail: "alfa@exemplo.com",
    clientPhone: "11999998888",
    text: "Super post de Natal com artes inovadoras",
    imageUrl: "https://cdn.example.com/art1.png",
    imageUrls: ["https://cdn.example.com/art1.png"],
    isCarousel: false,
    platforms: ["instagram"],
    status: "pending_approval",
    scheduledAt: "2026-12-24T18:00:00Z",
    createdAt: "2026-10-07T10:00:00Z",
    approval: {
      approvalToken: "token-alfa-123",
      tokenExpiresAt: "2026-10-21T10:00:00Z",
      status: "pending_approval",
    },
    magicLinkUrl: "/aprovar/token-alfa-123",
  },
  {
    id: "post_2",
    userId: "u2",
    clientName: "Empresa Beta",
    clientEmail: "beta@exemplo.com",
    text: "Post promocional",
    imageUrl: "https://cdn.example.com/art2.png",
    imageUrls: ["https://cdn.example.com/art2.png"],
    isCarousel: false,
    platforms: ["facebook"],
    status: "changes_requested",
    scheduledAt: "2026-10-15T12:00:00Z",
    createdAt: "2026-10-07T08:00:00Z",
    approval: {
      approvalToken: "token-beta-456",
      tokenExpiresAt: "2026-10-21T10:00:00Z",
      status: "changes_requested",
      reviewerFeedback: "Alterar imagem de fundo",
    },
    magicLinkUrl: "/aprovar/token-beta-456",
  },
];

describe("AdminConciergePage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true, posts: mockPosts }),
    });
  });

  it("renderiza a página com métricas e lista de postagens", async () => {
    render(<AdminConciergePage />);

    expect(screen.getByText("NumVapt Concierge")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Empresa Alfa")).toBeInTheDocument();
      expect(screen.getByText("Empresa Beta")).toBeInTheDocument();
      expect(screen.getByText(/Alterar imagem de fundo/i)).toBeInTheDocument();
    });
  });

  it("permite filtrar as postagens pelo termo de busca", async () => {
    render(<AdminConciergePage />);

    await waitFor(() => {
      expect(screen.getByText("Empresa Alfa")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Buscar por cliente/i);
    fireEvent.change(searchInput, { target: { value: "Beta" } });

    expect(screen.queryByText("Empresa Alfa")).not.toBeInTheDocument();
    expect(screen.getByText("Empresa Beta")).toBeInTheDocument();
  });
});
