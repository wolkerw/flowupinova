import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApprovalClientView } from "../ApprovalClientView";
import type { ConciergeApprovalPublicView } from "@/lib/types/concierge";

const mockPost: ConciergeApprovalPublicView = {
  token: "token-teste-12345",
  postId: "p1",
  userId: "u1",
  businessName: "Loja Teste",
  businessLogo: null,
  text: "Legenda de teste com promoção incrível! #oferta",
  imageUrls: ["https://cdn.example.com/img1.jpg", "https://cdn.example.com/img2.jpg"],
  platforms: ["instagram"],
  isCarousel: true,
  scheduledAt: "2026-11-01T15:00:00Z",
  status: "pending_approval",
  tokenExpiresAt: "2026-11-15T15:00:00Z",
  isExpired: false,
};

describe("ApprovalClientView Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza os dados da publicação e opções de ação", () => {
    render(<ApprovalClientView initialPost={mockPost} />);

    expect(screen.getAllByText("Loja Teste").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Legenda de teste com promoção incrível/i)).toBeInTheDocument();
    expect(screen.getByText(/Aprovar e Agendar Publicação/i)).toBeInTheDocument();
    expect(screen.getByText(/Solicitar Ajustes ou Mudanças/i)).toBeInTheDocument();
    expect(screen.getByText("1/2")).toBeInTheDocument();
  });

  it("permite navegar pelas fotos do carrossel", () => {
    render(<ApprovalClientView initialPost={mockPost} />);

    const nextBtn = screen.getByLabelText(/Próxima imagem/i);
    fireEvent.click(nextBtn);

    expect(screen.getByText("2/2")).toBeInTheDocument();
  });

  it("aprova a publicação com sucesso via clique", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true, action: "approve" }),
    });

    render(<ApprovalClientView initialPost={mockPost} />);

    const approveBtn = screen.getByText(/Aprovar e Agendar Publicação/i);
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(screen.getByText(/Publicação aprovada com sucesso/i)).toBeInTheDocument();
    });
  });

  it("abre modal para solicitar alterações e envia feedback", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true, action: "request_changes" }),
    });

    render(<ApprovalClientView initialPost={mockPost} />);

    const requestChangesBtn = screen.getByText(/Solicitar Ajustes ou Mudanças/i);
    fireEvent.click(requestChangesBtn);

    expect(screen.getByText(/O que você gostaria de ajustar\?/i)).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(/Gostei da arte, mas gostaria de alterar/i);
    fireEvent.change(textarea, { target: { value: "Trocar o valor para R$ 99" } });

    const sendBtn = screen.getByText(/Enviar para a Equipe/i);
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText(/Alterações enviadas para os desenvolvedores/i)).toBeInTheDocument();
    });
  });
});
