import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BoostPostModal } from "../boost-post-modal";

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock("@/components/auth/auth-provider", () => ({
  useAuth: () => ({
    user: { uid: "test-user-123" },
  }),
}));

vi.mock("@/lib/services/anuncios-service", () => ({
  createAdCampaign: vi.fn().mockResolvedValue({ success: true, id: "camp-123" }),
}));

global.fetch = vi.fn();

describe("BoostPostModal Component", () => {
  const mockPost = {
    id: "post-123",
    text: "Hambúrguer artesanal delicioso com fritas gratis hoje!",
    imageUrl: "https://example.com/hamburguer.jpg",
    createdAt: new Date().toISOString(),
    platforms: ["instagram"],
  };

  const mockBusinessProfile = {
    companyName: "Burgão Artesanal",
    category: "Alimentação",
    address: "Rua Augusta, 1000 - São Paulo, SP",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders objective selection step when opened", () => {
    render(
      <BoostPostModal
        isOpen={true}
        onClose={vi.fn()}
        post={mockPost as any}
        businessProfile={mockBusinessProfile as any}
      />
    );

    expect(screen.getByText("Qual o seu objetivo com este anúncio?")).toBeInTheDocument();
    expect(screen.getByText("Receber Mensagens")).toBeInTheDocument();
    expect(screen.getByText("Mais Visitas ao Perfil")).toBeInTheDocument();
  });

  it("advances to AI copilot view when selecting an objective", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        audience: {
          ageMin: 20,
          ageMax: 45,
          radiusKm: 8,
          interests: "Hambúrguer, Gastronomia, Fast Food",
          suggestedBudgetDaily: 15,
          suggestedDurationDays: 3,
          explanation: "Excelente escolha para gerar contatos de fome no WhatsApp!",
          ctaType: "WHATSAPP_MESSAGE",
        },
      }),
    });

    render(
      <BoostPostModal
        isOpen={true}
        onClose={vi.fn()}
        post={mockPost as any}
        businessProfile={mockBusinessProfile as any}
      />
    );

    const messageObjectiveButton = screen.getByText("Receber Mensagens");
    fireEvent.click(messageObjectiveButton);

    await waitFor(() => {
      expect(screen.getByText(/Excelente escolha para gerar contatos/i)).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /Publicar Anúncio/i })).toBeInTheDocument();
  });
});
