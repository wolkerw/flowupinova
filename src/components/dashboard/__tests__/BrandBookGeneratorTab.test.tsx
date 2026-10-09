import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrandBookGeneratorTab } from "../BrandBookGeneratorTab";

describe("BrandBookGeneratorTab Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza a interface de upload sem exibir nomes explícitos de modelos de IA", () => {
    const mockApply = vi.fn().mockResolvedValue(undefined);

    render(
      <BrandBookGeneratorTab
        onApplyToBrain={mockApply}
        currentBrandName="Teste"
        currentSegment="Tecnologia"
      />
    );

    expect(screen.getByText("Gerador de Brand Book Completo por IA")).toBeInTheDocument();
    expect(screen.getByText(/Clique aqui ou arraste a imagem da sua logomarca/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Gerar Brand Book Completo/i })).toBeInTheDocument();

    // Regra do usuário: NUNCA exibir o nome explícito de modelos
    expect(screen.queryByText(/GPT-5/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/OpenAI/i)).not.toBeInTheDocument();
  });

  it("permite abrir os campos opcionais de refinamento", () => {
    const mockApply = vi.fn().mockResolvedValue(undefined);

    render(
      <BrandBookGeneratorTab
        onApplyToBrain={mockApply}
        currentBrandName="Minha Empresa"
        currentSegment="Varejo"
      />
    );

    const toggleBtn = screen.getByText(/Refinar análise com dados adicionais/i);
    fireEvent.click(toggleBtn);

    expect(screen.getByLabelText(/Nome da Marca \(Opcional\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Segmento de Atuação \(Opcional\)/i)).toBeInTheDocument();
  });
});
