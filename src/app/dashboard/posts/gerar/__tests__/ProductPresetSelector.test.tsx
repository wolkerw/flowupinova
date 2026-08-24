import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProductPresetSelector, PRODUCT_PRESETS } from "../_components/ProductPresetSelector";

describe("ProductPresetSelector", () => {
  it("renders all product preset options and handles click correctly", () => {
    const handleChange = vi.fn();
    render(<ProductPresetSelector value="AUTO" onChange={handleChange} />);

    // Verifica se os presets principais foram renderizados
    expect(screen.getByText("Preset Visual de Fotografia do Produto")).toBeInTheDocument();
    expect(screen.getByText("Anúncio Meta Ads")).toBeInTheDocument();
    expect(screen.getByText("Vitrine de Luxo")).toBeInTheDocument();
    expect(screen.getByText("Produto em Uso")).toBeInTheDocument();
    expect(screen.getByText("Ação & Respingos")).toBeInTheDocument();
    expect(screen.getByText("Catálogo Clean")).toBeInTheDocument();
    expect(screen.getByText("Cosméticos & Skincare")).toBeInTheDocument();
    expect(screen.getByText("Tecnologia 3D")).toBeInTheDocument();
    expect(screen.getByText("Flat Lay 90°")).toBeInTheDocument();
    expect(screen.getByText("Gastronomia")).toBeInTheDocument();
    expect(screen.getByText("Rústico & Artesanal")).toBeInTheDocument();

    // Clica no card de Vitrine de Luxo
    const luxuryBtn = screen.getByText("Vitrine de Luxo").closest("button");
    expect(luxuryBtn).not.toBeNull();
    if (luxuryBtn) {
      fireEvent.click(luxuryBtn);
      expect(handleChange).toHaveBeenCalledWith(
        "PRODUCT_PREMIUM",
        expect.stringContaining("pedestal cilíndrico de mármore")
      );
    }
  });

  it("highlights the currently selected preset", () => {
    const handleChange = vi.fn();
    const { container } = render(
      <ProductPresetSelector value="PRODUCT_METAAD" onChange={handleChange} />
    );

    // O botão selecionado deve ter a classe de borda ativa
    const metaBtn = screen.getByText("Anúncio Meta Ads").closest("button");
    expect(metaBtn?.className).toContain("border-[#0083C7]");
  });
});
