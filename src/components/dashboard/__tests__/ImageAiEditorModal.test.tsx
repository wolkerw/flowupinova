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

  it("permite ativar as sugestões de apagar ou substituir área selecionada na imagem", () => {
    render(
      <ImageAiEditorModal
        isOpen={true}
        onClose={mockOnClose}
        imageUrl={testImageUrl}
        onSuccess={mockOnSuccess}
      />
    );

    // Clica na sugestão de apagar área
    const eraseAreaBtn = screen.getByText("Apagar Área Selecionada");
    fireEvent.click(eraseAreaBtn);

    const textarea = screen.getByPlaceholderText(/Altere o título principal para/i) as HTMLTextAreaElement;
    expect(textarea.value).toContain("Remova e apague completamente o elemento");
    expect(screen.getByText(/Clique e arraste na imagem para marcar a área/i)).toBeInTheDocument();

    // Clica na sugestão de substituir área
    const replaceAreaBtn = screen.getByText("Substituir Área Selecionada");
    fireEvent.click(replaceAreaBtn);

    expect(textarea.value).toContain("substitua o conteúdo atual por");
  });

  it("permite escolher fazer novo ajuste sobre a arte editada (nova versão)", async () => {
    const fakeEditedUrl1 = "https://example.com/edited-v1.png";
    const fakeEditedUrl2 = "https://example.com/edited-v2.png";

    const fetchMock = vi.fn().mockImplementation((url, options) => {
      const parsedBody = JSON.parse(options.body);
      const isSecondCall = parsedBody.imageUrl === fakeEditedUrl1;
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            success: true,
            url: isSecondCall ? fakeEditedUrl2 : fakeEditedUrl1,
            originalUrl: parsedBody.imageUrl,
            modelUsed: "gpt-image-2.5-sunburst",
          }),
      });
    });
    global.fetch = fetchMock;

    render(
      <ImageAiEditorModal
        isOpen={true}
        onClose={mockOnClose}
        imageUrl={testImageUrl}
        onSuccess={mockOnSuccess}
      />
    );

    // 1ª Edição
    const textarea = screen.getByPlaceholderText(/Altere o título principal para/i);
    fireEvent.change(textarea, { target: { value: "Primeiro ajuste" } });
    fireEvent.click(screen.getByText("Aplicar Alteração com IA"));

    await waitFor(() => {
      expect(screen.getByText("Edição concluída com sucesso!")).toBeInTheDocument();
      expect(screen.getByText(/Ajustar sobre a Arte Editada \(Nova Versão\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Ajustar sobre a Arte Original/i)).toBeInTheDocument();
    });

    // Usuário clica em 'Ajustar sobre a Arte Editada (Nova Versão)'
    const editOnEditedBtn = screen.getByText(/Ajustar sobre a Arte Editada \(Nova Versão\)/i);
    fireEvent.click(editOnEditedBtn);

    // Verifica que voltou ao formulário de edição com indicador de que a base é a Arte Editada
    await waitFor(() => {
      expect(screen.getByText(/Base para este novo ajuste:/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Arte Editada \(v1\)/i).length).toBeGreaterThanOrEqual(1);
    });

    // 2ª Edição (agora com a base sendo a editada)
    const textarea2 = screen.getByPlaceholderText(/Altere o título principal para/i);
    fireEvent.change(textarea2, { target: { value: "Segundo ajuste cumulativo" } });
    fireEvent.click(screen.getByText("Aplicar Alteração com IA"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
      const secondCallBody = JSON.parse(fetchMock.mock.calls[1][1].body);
      expect(secondCallBody.imageUrl).toBe(fakeEditedUrl1);
      expect(secondCallBody.instruction).toBe("Segundo ajuste cumulativo");
    });
  });

  it("permite escolher fazer novo ajuste sobre a arte original", async () => {
    const fakeEditedUrl1 = "https://example.com/edited-v1.png";

    const fetchMock = vi.fn().mockImplementation((url, options) => {
      const parsedBody = JSON.parse(options.body);
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            success: true,
            url: fakeEditedUrl1,
            originalUrl: parsedBody.imageUrl,
            modelUsed: "gpt-image-2.5-sunburst",
          }),
      });
    });
    global.fetch = fetchMock;

    render(
      <ImageAiEditorModal
        isOpen={true}
        onClose={mockOnClose}
        imageUrl={testImageUrl}
        onSuccess={mockOnSuccess}
      />
    );

    // 1ª Edição
    const textarea = screen.getByPlaceholderText(/Altere o título principal para/i);
    fireEvent.change(textarea, { target: { value: "Primeiro ajuste" } });
    fireEvent.click(screen.getByText("Aplicar Alteração com IA"));

    await waitFor(() => {
      expect(screen.getByText("Edição concluída com sucesso!")).toBeInTheDocument();
    });

    // Usuário clica em 'Ajustar sobre a Arte Original'
    const editOnOriginalBtn = screen.getByText(/Ajustar sobre a Arte Original/i);
    fireEvent.click(editOnOriginalBtn);

    // 2ª Edição (com base na original)
    const textarea2 = screen.getByPlaceholderText(/Altere o título principal para/i);
    fireEvent.change(textarea2, { target: { value: "Novo ajuste da original" } });
    fireEvent.click(screen.getByText("Aplicar Alteração com IA"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
      const secondCallBody = JSON.parse(fetchMock.mock.calls[1][1].body);
      expect(secondCallBody.imageUrl).toBe(testImageUrl);
      expect(secondCallBody.instruction).toBe("Novo ajuste da original");
    });
  });
});
