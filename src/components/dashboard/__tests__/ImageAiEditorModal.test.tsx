import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ImageAiEditorModal } from "../ImageAiEditorModal";

describe("ImageAiEditorModal", () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();
  const testImageUrl = "https://example.com/test-image.png";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza o modal quando isOpen é true", () => {
    render(
      <ImageAiEditorModal
        isOpen={true}
        onClose={mockOnClose}
        imageUrl={testImageUrl}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText("Editar Imagem com GPT-image-2.5")).toBeInTheDocument();
    expect(screen.getByText("GPT 2.5 Image-to-Image")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Altere o título principal para/i)).toBeInTheDocument();
  });

  it("permite selecionar uma sugestão rápida de edição", () => {
    render(
      <ImageAiEditorModal
        isOpen={true}
        onClose={mockOnClose}
        imageUrl={testImageUrl}
        onSuccess={mockOnSuccess}
      />
    );

    const quickBtn = screen.getByText("Trocar Título");
    fireEvent.click(quickBtn);

    const textarea = screen.getByPlaceholderText(/Altere o título principal para/i) as HTMLTextAreaElement;
    expect(textarea.value).toContain("Altere o título principal para");
  });

  it("envia a instrução para /api/imagens/editar e permite confirmar", async () => {
    const fakeEditedUrl = "https://example.com/new-edited-image.png";
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          success: true,
          url: fakeEditedUrl,
          originalUrl: testImageUrl,
          modelUsed: "gpt-image-2.5-sunburst",
        }),
    });

    render(
      <ImageAiEditorModal
        isOpen={true}
        onClose={mockOnClose}
        imageUrl={testImageUrl}
        onSuccess={mockOnSuccess}
      />
    );

    const textarea = screen.getByPlaceholderText(/Altere o título principal para/i);
    fireEvent.change(textarea, {
      target: { value: "Altere o título para Novas Vendas 2026" },
    });

    const submitBtn = screen.getByText("Aplicar Alteração com IA");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Edição concluída com sucesso!")).toBeInTheDocument();
    });

    const confirmBtn = screen.getByText("Usar Imagem Editada");
    fireEvent.click(confirmBtn);

    expect(mockOnSuccess).toHaveBeenCalledWith(fakeEditedUrl);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("exibe mensagem de erro se a API retornar falha", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: () =>
        Promise.resolve({
          error: "Recurso disponível apenas para usuários autorizados pelo administrador.",
        }),
    });

    render(
      <ImageAiEditorModal
        isOpen={true}
        onClose={mockOnClose}
        imageUrl={testImageUrl}
        onSuccess={mockOnSuccess}
      />
    );

    const textarea = screen.getByPlaceholderText(/Altere o título principal para/i);
    fireEvent.change(textarea, {
      target: { value: "Ajustar texto" },
    });

    const submitBtn = screen.getByText("Aplicar Alteração com IA");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Recurso disponível apenas para usuários autorizados/i)
      ).toBeInTheDocument();
    });
  });
});
