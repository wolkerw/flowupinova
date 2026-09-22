import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdminPromptsPage from "../page";

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe("AdminPromptsPage", () => {
  const mockPrompts = [
    {
      id: "pk_1",
      title: "Hambúrguer Gourmet Artesanal",
      category: "Gastronomia & Alimentos",
      targetUse: "product_photo",
      rawPrompt: "Hambúrguer suculento com queijo derretido e fumaça...",
      sections: {
        lighting: "Luz lateral quente",
        cameraAndLens: "85mm f/1.8",
      },
      triggerKeywords: ["hambúrguer", "burger"],
      active: true,
      usageCount: 0,
      createdAt: "2026-09-22T00:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza o cabeçalho e a lista de prompts retornada pela API", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, items: mockPrompts }),
    });

    render(<AdminPromptsPage />);

    expect(screen.getByText(/Central de Conhecimento de Prompts/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Hambúrguer Gourmet Artesanal")).toBeInTheDocument();
      expect(screen.getAllByText("Gastronomia & Alimentos").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("85mm f/1.8")).toBeInTheDocument();
    });
  });

  it("abre o modal de envio de print ao clicar no botão de novo prompt", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, items: [] }),
    });

    render(<AdminPromptsPage />);

    const newBtn = screen.getByRole("button", { name: /Enviar Print de Prompt/i });
    fireEvent.click(newBtn);

    await waitFor(() => {
      expect(screen.getByText(/Cadastrar Novo Prompt na Central/i)).toBeInTheDocument();
      expect(screen.getByText(/Cole seu print aqui com/i)).toBeInTheDocument();
    });
  });
});
