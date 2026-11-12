import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  CarouselPreviewDots,
  CarouselPreviewOverlay,
} from "../_components/CarouselPreviewControls";

describe("CarouselPreviewControls", () => {
  it("não renderiza controles quando há 1 ou menos slides", () => {
    const { container } = render(
      <>
        <CarouselPreviewOverlay
          currentSlide={0}
          totalSlides={1}
          onPrev={vi.fn()}
          onNext={vi.fn()}
        />
        <CarouselPreviewDots totalSlides={1} currentSlide={0} onSelectSlide={vi.fn()} />
      </>
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("exibe contador e botões com z-30 acima da imagem e permite avançar e voltar slides", () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();

    const { rerender } = render(
      <CarouselPreviewOverlay currentSlide={0} totalSlides={7} onPrev={onPrev} onNext={onNext} />
    );

    const counter = screen.getByTestId("carousel-slide-counter");
    expect(counter).toHaveTextContent("1/7");
    expect(counter.className).toContain("z-30");

    expect(screen.queryByRole("button", { name: "Slide anterior" })).not.toBeInTheDocument();
    const nextBtn = screen.getByRole("button", { name: "Próximo slide" });
    expect(nextBtn.className).toContain("z-30");
    fireEvent.click(nextBtn);
    expect(onNext).toHaveBeenCalledTimes(1);

    rerender(
      <CarouselPreviewOverlay currentSlide={3} totalSlides={7} onPrev={onPrev} onNext={onNext} />
    );
    expect(screen.getByTestId("carousel-slide-counter")).toHaveTextContent("4/7");
    const prevBtn = screen.getByRole("button", { name: "Slide anterior" });
    expect(prevBtn.className).toContain("z-30");
    fireEvent.click(prevBtn);
    expect(onPrev).toHaveBeenCalledTimes(1);

    rerender(
      <CarouselPreviewOverlay currentSlide={6} totalSlides={7} onPrev={onPrev} onNext={onNext} />
    );
    expect(screen.getByTestId("carousel-slide-counter")).toHaveTextContent("7/7");
    expect(screen.queryByRole("button", { name: "Próximo slide" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Slide anterior" })).toBeInTheDocument();
  });

  it("permite selecionar diretamente qualquer slide pelos indicadores (bolinhas)", () => {
    const onSelectSlide = vi.fn();

    render(
      <CarouselPreviewDots totalSlides={7} currentSlide={0} onSelectSlide={onSelectSlide} />
    );

    const dot1 = screen.getByRole("button", { name: "Ir para slide 1" });
    const dot5 = screen.getByRole("button", { name: "Ir para slide 5" });
    expect(dot1).toHaveAttribute("aria-current", "true");
    expect(dot5).not.toHaveAttribute("aria-current");

    fireEvent.click(dot5);
    expect(onSelectSlide).toHaveBeenCalledWith(4);
  });
});
