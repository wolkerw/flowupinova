import { describe, it, expect, vi } from "vitest";
import {
  assertCoverOnlyImageGeneration,
  buildFabricSlideSpec,
  calculateAutoFitFontSize,
  CarouselImageGuardError,
  CAROUSEL_SLIDE_HEIGHT,
  CAROUSEL_SLIDE_WIDTH,
  CAROUSEL_SAFE_MARGIN,
} from "../fabric-slide-renderer";
import { extractCoverDesignTokens } from "../cover-design-extractor";

vi.mock("@/lib/services/api-usage-service-admin", () => ({
  logApiUsage: vi.fn().mockResolvedValue(undefined),
}));

describe("fabric-slide-renderer & cover-design-extractor", () => {
  describe("Guard da Regra de Ouro (assertCoverOnlyImageGeneration)", () => {
    it("permite geração de imagem exclusivamente para o Slide 1 (Capa)", () => {
      expect(() => assertCoverOnlyImageGeneration(1)).not.toThrow();
    });

    it("bloqueia qualquer tentativa de gerar imagem por IA para os Slides 2 a 7", () => {
      for (const slideNum of [2, 3, 4, 5, 6, 7, 0, -1]) {
        expect(() => assertCoverOnlyImageGeneration(slideNum)).toThrow(
          CarouselImageGuardError
        );
      }
    });
  });

  describe("Ajuste automático de fonte (calculateAutoFitFontSize)", () => {
    it("mantém fonte grande para títulos curtos que cabem folgados", () => {
      const fit = calculateAutoFitFontSize({
        text: "Reforma Tributária sem erro",
        maxWidthPx: 880,
        maxHeightPx: 260,
        maxFontSize: 64,
        minFontSize: 34,
      });

      expect(fit.fontSize).toBeGreaterThanOrEqual(52);
      expect(fit.totalHeightPx).toBeLessThanOrEqual(260);
      expect(fit.fitsWithinBounds).toBe(true);
    });

    it("reduz automaticamente a fonte para que textos longos nunca ultrapassem a área útil do slide", () => {
      const longText =
        "Este é um texto de apoio extenso com várias informações cruciais sobre planejamento tributário, fluxo de caixa, margem operacional e conformidade fiscal para pequenas e médias empresas brasileiras que precisam se adaptar rapidamente.";

      const maxWidthPx = CAROUSEL_SLIDE_WIDTH - CAROUSEL_SAFE_MARGIN * 2 - 40;
      const maxHeightPx = 320;

      const fit = calculateAutoFitFontSize({
        text: longText,
        maxWidthPx,
        maxHeightPx,
        maxFontSize: 44,
        minFontSize: 20,
      });

      expect(fit.fontSize).toBeLessThan(44);
      expect(fit.totalHeightPx).toBeLessThanOrEqual(maxHeightPx);
      expect(fit.fitsWithinBounds).toBe(true);

      // Nenhuma linha pode exceder a largura máxima da caixa segura do slide
      for (const line of fit.lines) {
        const estimatedWidth = line.length * fit.fontSize * 0.56;
        expect(estimatedWidth).toBeLessThanOrEqual(maxWidthPx * 1.05);
      }
    });
  });

  describe("Construção do template Fabric.js (buildFabricSlideSpec)", () => {
    it("gera especificação 1080x1350 com numeração 2/7 e indicador Arraste nos slides intermediários", () => {
      const spec = buildFabricSlideSpec({
        slide: {
          n: 2,
          tipo: "contexto",
          titulo: "Por que a mudança impacta seu caixa?",
          texto:
            "Sem revisar o enquadramento atual, sua empresa pode recolher tributos em duplicidade já no próximo trimestre.",
        },
        totalSlides: 7,
      });

      expect(spec.width).toBe(CAROUSEL_SLIDE_WIDTH);
      expect(spec.height).toBe(CAROUSEL_SLIDE_HEIGHT);
      expect(spec.slideBadgeText).toBe("2/7");
      expect(spec.showSwipeIndicator).toBe(true);
      expect(spec.titleFit.fitsWithinBounds).toBe(true);
      expect(spec.bodyFit.fitsWithinBounds).toBe(true);
    });

    it("inclui botão de CTA e oculta indicador Arraste no último slide (5/5 ou 7/7)", () => {
      const spec = buildFabricSlideSpec({
        slide: {
          n: 5,
          tipo: "cta",
          titulo: "Agende seu diagnóstico hoje",
          texto: "Fale com nossos especialistas pelo WhatsApp oficial.",
          botao: "Chamar no WhatsApp",
        },
        totalSlides: 5,
      });

      expect(spec.slideBadgeText).toBe("5/5");
      expect(spec.showSwipeIndicator).toBe(false);
      expect(spec.ctaButtonText).toBe("Chamar no WhatsApp");
    });
  });

  describe("Precedência de Design Tokens (Capa vs BrandKit)", () => {
    it("garante que as cores extraídas da capa prevaleçam e o BrandKit prevaleça em logo e tipografia", async () => {
      const tokens = await extractCoverDesignTokens({
        userId: "user-test-123",
        coverImageBuffer: Buffer.from("fake-image"),
        brandKit: {
          colors: ["#111111", "#222222"],
          headingFont: "Montserrat",
          bodyFont: "Open Sans",
          logoUrl: "https://cdn.numvapt.com/logo-oficial.png",
        },
      });

      // Tipografia e Logo vêm obrigatoriamente do BrandKit quando presentes
      expect(tokens.headingFont).toBe("Montserrat");
      expect(tokens.bodyFont).toBe("Open Sans");
      expect(tokens.logoUrl).toBe("https://cdn.numvapt.com/logo-oficial.png");
      expect(tokens.dominantPalette.length).toBeGreaterThanOrEqual(3);
    });
  });
});
