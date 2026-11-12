import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  CarouselStoryboardSchema,
  CAROUSEL_COVER_IMAGE_MODEL,
} from "@/types/carousel";
import {
  POST as postStoryboard,
  buildFallbackStoryboard,
  buildCarouselStoryboardSystemPrompt,
} from "../storyboard/route";
import {
  POST as postGenerateCover,
  buildCarouselCoverImagePrompt,
} from "../generate-cover/route";
import { buildFabricSlideSpec } from "@/lib/services/carousel/fabric-slide-renderer";

const mockImageExecute = vi.fn();

vi.mock("@/lib/api-auth", () => ({
  requireUser: vi.fn().mockResolvedValue({
    uid: "user-carousel-test",
    email: "user@numvapt.com",
    isAdmin: false,
  }),
}));

vi.mock("@/lib/rate-limit", () => ({
  aiRateLimit: {
    limit: vi.fn().mockResolvedValue({ success: true, remaining: 9 }),
  },
}));

vi.mock("@/lib/services/semantic-cache", () => ({
  getSemanticCache: vi.fn().mockResolvedValue(null),
  setSemanticCache: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/services/api-usage-service-admin", () => ({
  logApiUsage: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/services/storage-utils-admin", () => ({
  getUserStoragePathAdmin: vi.fn().mockResolvedValue("users/user-carousel-test"),
}));

vi.mock("@/lib/firebase-admin", () => ({
  admin: {
    storage: () => ({
      bucket: () => ({
        name: "test-bucket",
        file: () => ({
          save: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    }),
  },
}));

vi.mock("@/lib/services/image-orchestrator", () => ({
  ImageModelExecutor: {
    execute: (...args: any[]) => mockImageExecute(...args),
  },
  ImageResultValidator: {
    validateAndNormalize: vi.fn().mockImplementation(async (buf: Buffer) => ({
      buffer: buf,
      width: 1080,
      height: 1350,
    })),
  },
  BrandLogoApplier: {
    applyLogo: vi.fn().mockImplementation(async (buf: Buffer) => buf),
  },
}));

vi.mock("@/lib/services/carousel/cover-design-extractor", () => ({
  extractCoverDesignTokens: vi.fn().mockResolvedValue({
    dominantPalette: ["#0F172A", "#0083C7", "#FA6305"],
    backgroundColor: "#0F172A",
    secondaryColor: "#1E293B",
    accentColor: "#FA6305",
    textColor: "#FFFFFF",
    mutedTextColor: "#CBD5E1",
    titleAlignment: "left",
    coverTextPosition: "top",
    headingWeight: "extrabold",
    graphicMotif: "accent_stripe",
    cornerRadius: 8,
    mood: "editorial moderno",
    headingFont: "Poppins",
    bodyFont: "Inter",
    logoUrl: null,
  }),
}));

describe("Carrossel (5 e 7 slides) — Schema Zod, Coerência e Regra de Ouro de 1 Única Imagem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockImageExecute.mockResolvedValue({
      imageBuffer: Buffer.from("fake-png-cover-1080x1350"),
      modelUsed: CAROUSEL_COVER_IMAGE_MODEL,
      durationMs: 1200,
    });
  });

  describe("1. Validação do Schema Zod (5 e 7 slides)", () => {
    it("valida com sucesso um roteiro de 5 slides coerente com a chamada da capa", () => {
      const sb5 = buildFallbackStoryboard({
        theme: "Gestão de Fluxo de Caixa para Clínicas",
        slideCount: 5,
        companyName: "Clínica Pro",
        ctaChannel: "Chame no WhatsApp",
      });

      const parsed = CarouselStoryboardSchema.parse(sb5);
      expect(parsed.chamadaCapa).toContain("Gestão de Fluxo de Caixa");
      expect(parsed.slides).toHaveLength(4); // slides 2, 3, 4 e 5
      expect(parsed.slides.map((s) => s.n)).toEqual([2, 3, 4, 5]);
      expect(parsed.slides.map((s) => s.tipo)).toEqual([
        "contexto",
        "ponto_principal",
        "complemento",
        "cta",
      ]);
      for (const slide of parsed.slides) {
        expect(slide.titulo.length).toBeLessThanOrEqual(45);
        expect((slide.texto || "").length).toBeLessThanOrEqual(160);
      }
    });

    it("valida com sucesso um roteiro de 7 slides coerente com a chamada da capa", () => {
      const sb7 = buildFallbackStoryboard({
        theme: "Planejamento Tributário 2026",
        slideCount: 7,
        companyName: "Wanna Contabilidade",
        ctaChannel: "WhatsApp no link da bio",
      });

      const parsed = CarouselStoryboardSchema.parse(sb7);
      expect(parsed.chamadaCapa).toContain("Planejamento Tributário 2026");
      expect(parsed.slides).toHaveLength(6); // slides 2, 3, 4, 5, 6 e 7
      expect(parsed.slides.map((s) => s.n)).toEqual([2, 3, 4, 5, 6, 7]);
      expect(parsed.slides.map((s) => s.tipo)).toEqual([
        "contexto",
        "desenvolvimento",
        "desenvolvimento",
        "desenvolvimento",
        "prova_resumo",
        "cta",
      ]);
      for (const slide of parsed.slides) {
        expect(slide.titulo.length).toBeLessThanOrEqual(45);
        expect((slide.texto || "").length).toBeLessThanOrEqual(160);
      }
    });

    it("rejeita roteiro com título acima de 45 caracteres ou estrutura fora do padrão", () => {
      const sb5 = buildFallbackStoryboard({
        theme: "Tema teste",
        slideCount: 5,
      });
      sb5.slides[0].titulo =
        "Este título tem muito mais de quarenta e cinco caracteres e deve falhar no Zod";

      expect(() => CarouselStoryboardSchema.parse(sb5)).toThrow();
    });
  });

  describe("2. Rota /api/carousel/storyboard (1 chamada de texto, 0 chamadas de imagem)", () => {
    it("gera roteiro completo de 5 e 7 slides com zero chamadas ao modelo de imagem", async () => {
      for (const slideCount of [5, 7] as const) {
        const req = new NextRequest("http://localhost:9002/api/carousel/storyboard", {
          method: "POST",
          body: JSON.stringify({
            theme: "Como aumentar a retenção de clientes no varejo",
            slideCount,
            companyName: "NumVapt Store",
            ctaChannel: "Chame no WhatsApp",
          }),
        });

        const res = await postStoryboard(req);
        expect(res.status).toBe(200);
        const data = await res.json();

        expect(data.slideCount).toBe(slideCount);
        expect(data.imageCallsExecuted).toBe(0);
        expect(data.storyboard.chamadaCapa).toBeTruthy();
        expect(data.storyboard.slides).toHaveLength(slideCount - 1);
      }

      expect(mockImageExecute).toHaveBeenCalledTimes(0);
    });
  });

  describe("3. Regra de Ouro Inviolável: Exatamente 1 chamada ao modelo de imagem por carrossel", () => {
    it("executa exatamente 1 chamada ao modelo gpt-image-2.6-sunburst para o Slide 1 e bloqueia Slides 2..7", async () => {
      // Passo A: Gera roteiro de 7 slides (0 chamadas de imagem)
      const sbReq = new NextRequest("http://localhost:9002/api/carousel/storyboard", {
        method: "POST",
        body: JSON.stringify({
          theme: "Reforma Tributária no Simples Nacional",
          slideCount: 7,
          companyName: "Contábil Prime",
          ctaChannel: "Fale no WhatsApp",
        }),
      });
      const sbRes = await postStoryboard(sbReq);
      const { storyboard } = await sbRes.json();
      expect(mockImageExecute).toHaveBeenCalledTimes(0);

      // Passo B: Gera a Capa (Slide 1) -> ÚNICA chamada de imagem permitida
      const coverReq = new NextRequest(
        "http://localhost:9002/api/carousel/generate-cover",
        {
          method: "POST",
          body: JSON.stringify({
            slideNumber: 1,
            chamadaCapa: storyboard.chamadaCapa,
            promptImagemCapa: storyboard.promptImagemCapa,
            brandKit: {
              colors: ["#0F172A", "#0083C7", "#FA6305"],
              headingFont: "Poppins",
              bodyFont: "Inter",
            },
          }),
        }
      );

      const coverRes = await postGenerateCover(coverReq);
      expect(coverRes.status).toBe(200);
      const coverData = await coverRes.json();

      expect(coverData.slideNumber).toBe(1);
      expect(coverData.modelUsed).toBe("gpt-image-2.6-sunburst");
      expect(coverData.imageCallsExecuted).toBe(1);
      expect(mockImageExecute).toHaveBeenCalledTimes(1);
      expect(mockImageExecute).toHaveBeenCalledWith(
        expect.objectContaining({
          preferredModel: "gpt-image-2.6-sunburst",
          format: "portrait",
        })
      );

      // Passo C: Renderiza todos os slides internos (2 a 7) via Fabric.js (0 chamadas de imagem)
      for (const internalSlide of storyboard.slides) {
        const spec = buildFabricSlideSpec({
          slide: internalSlide,
          totalSlides: 7,
          tokens: coverData.designTokens,
        });
        expect(spec.width).toBe(1080);
        expect(spec.height).toBe(1350);
      }

      // Passo D: Qualquer tentativa de chamar a rota de imagem para os slides 2..7 é bloqueada pelo Guard
      for (const forbiddenSlideNumber of [2, 3, 4, 5, 6, 7]) {
        const badReq = new NextRequest(
          "http://localhost:9002/api/carousel/generate-cover",
          {
            method: "POST",
            body: JSON.stringify({
              slideNumber: forbiddenSlideNumber,
              chamadaCapa: storyboard.chamadaCapa,
              promptImagemCapa: storyboard.promptImagemCapa,
            }),
          }
        );

        const badRes = await postGenerateCover(badReq);
        expect(badRes.status).toBe(400);
        const badData = await badRes.json();
        expect(badData.code).toBe("CAROUSEL_IMAGE_GUARD_VIOLATION");
      }

      // Confirmação final: Ao longo de todo o carrossel de 7 slides, o modelo de imagem foi chamado EXATAMENTE 1 vez!
      expect(mockImageExecute).toHaveBeenCalledTimes(1);
    });
  });

  describe("4. Trava de Contraste e Fundo Uniforme na Capa", () => {
    it("injeta regras explícitas de contraste e proíbe vinhetas/degradês atrás do texto da capa", () => {
      const darkBrandPrompt = buildCarouselCoverImagePrompt({
        chamadaCapa: "Pequenos negócios: 3 dicas para bombar nas redes sociais!",
        promptImagemCapa: "Equipe sorrindo analisando métricas em escritório moderno",
        brandColors: ["#0F172A", "#0083C7", "#FA6305"],
        headingFont: "Poppins",
        bodyFont: "Inter",
      });

      expect(darkBrandPrompt).toContain(
        "TRAVA OBRIGATÓRIA DE CONTRASTE E FUNDO UNIFORME ATRÁS DO TEXTO"
      );
      expect(darkBrandPrompt).toContain("BRANCO PURO (#FFFFFF)");
      expect(darkBrandPrompt).toContain("TERMINANTEMENTE PROIBIDO usar fonte escura");

      const lightBrandPrompt = buildCarouselCoverImagePrompt({
        chamadaCapa: "Como dobrar seus resultados este mês",
        promptImagemCapa: "Consultor em mesa clara",
        brandColors: ["#F8FAFC", "#0083C7"],
      });

      expect(lightBrandPrompt).toContain("luminosidade 100% uniforme");
      expect(lightBrandPrompt).toContain("PROIBIDO degradês bicolores");

      const storyboardPrompt = buildCarouselStoryboardSystemPrompt({
        theme: "Marketing para pequenos negócios",
        slideCount: 5,
      });
      expect(storyboardPrompt).toContain("luminosidade 100% UNIFORME");
    });
  });
});
