import { describe, it, expect } from "vitest";
import { BriefNormalizer, isNoPeopleRequested } from "../BriefNormalizer";
import { Gpt5PromptPlanner } from "../Gpt5PromptPlanner";
import { PromptPlannerV2, type PlannerV2Input } from "../v2/PromptPlannerV2";
import { selectArtDirections } from "../v2/art-direction-library";
import type { Gpt5PlannerInput } from "../types";

describe("Trava Mandatória de Ausência de Pessoas (/nopeople)", () => {
  describe("isNoPeopleRequested", () => {
    it("deve detectar variações de 'sem pessoas' e 'não inserir pessoas'", () => {
      expect(isNoPeopleRequested("Crie uma arte imobiliária sem pessoas")).toBe(true);
      expect(isNoPeopleRequested("sem pessoa")).toBe(true);
      expect(isNoPeopleRequested("não inserir pessoas na imagem")).toBe(true);
      expect(isNoPeopleRequested("não colocar pessoas")).toBe(true);
      expect(isNoPeopleRequested("sem modelo")).toBe(true);
      expect(isNoPeopleRequested("sem modelos")).toBe(true);
      expect(isNoPeopleRequested("sem gente")).toBe(true);
      expect(isNoPeopleRequested("sem humanos")).toBe(true);
      expect(isNoPeopleRequested("sem ninguém")).toBe(true);
      expect(isNoPeopleRequested("no people")).toBe(true);
      expect(isNoPeopleRequested("without people")).toBe(true);
      expect(isNoPeopleRequested("no humans")).toBe(true);
      expect(isNoPeopleRequested("zero pessoas")).toBe(true);
    });

    it("não deve detectar falsos positivos em briefings normais", () => {
      expect(isNoPeopleRequested("Casa moderna com piscina e jardim")).toBe(false);
      expect(isNoPeopleRequested("Foto de tênis esportivo em estúdio")).toBe(false);
      expect(isNoPeopleRequested("Prato de comida delicioso")).toBe(false);
    });
  });

  describe("BriefNormalizer", () => {
    it("deve normalizar o briefing marcando isNoPeopleRequested quando presente no brief ou no negativeInstructions", () => {
      const result1 = BriefNormalizer.normalize({
        rawBrief: "Post para imobiliária: Casa de alto padrão, sem pessoas",
      });
      expect(result1.isNoPeopleRequested).toBe(true);
      expect(result1.negativeDirectives).toContain("strictly no people, zero humans");

      const result2 = BriefNormalizer.normalize({
        rawBrief: "Post para imobiliária: Casa de alto padrão",
        negativeInstructions: "não inserir pessoas",
      });
      expect(result2.isNoPeopleRequested).toBe(true);
      expect(result2.negativeDirectives).toContain("strictly no people, zero humans");
    });
  });

  describe("Gpt5PromptPlanner (Motor v1)", () => {
    const baseInput: Gpt5PlannerInput = {
      userBrief: "Panfleto para venda de imóvel moderno",
      objective: "flyer" as any,
      format: "portrait" as any,
      width: 1080,
      height: 1350,
      quantity: 1,
      stylePreference: "photographic",
      useBrandKit: true,
      negativeInstructions: "sem pessoas",
      brandKit: {
        enabled: true,
        businessName: "Imobiliária Prime",
        primaryColors: ["#0083C7"],
        secondaryColors: ["#FA6305"],
        accentColors: [],
        hasLocalOfficialLogo: false,
        personas: [{ name: "Comprador", profile: "Família buscando casa" }],
      },
    };

    it("buildPersonaDiversityMandate deve retornar a diretriz estrita /nopeople e NUNCA injetar rotação de personas quando sem pessoas", () => {
      const mandate = Gpt5PromptPlanner.buildPersonaDiversityMandate(baseInput);
      expect(mandate).toContain("/nopeople");
      expect(mandate).toContain("STRICT PROHIBITION — ZERO PEOPLE / NO HUMANS MANDATORY");
      expect(mandate).not.toContain("/personadiversity");
      expect(mandate).not.toContain("Rotated Protagonist Archetype");
    });

    it("buildAgencyQualityAndAnatomyMandate deve suprimir referências a dedos/mãos e focar no realismo de ambiente", () => {
      const mandate = Gpt5PromptPlanner.buildAgencyQualityAndAnatomyMandate(baseInput);
      expect(mandate).toContain("/agencystudio");
      expect(mandate).toContain("ZERO HUMANS: Absolutely no people");
      expect(mandate).not.toContain("5-finger");
      expect(mandate).not.toContain("Every human hand");
    });

    it("buildAntiClicheCreativeMandate no objetivo flyer deve remover o protagonista segurando smartphone e focar no imóvel/arquitetura", () => {
      const mandate = Gpt5PromptPlanner.buildAntiClicheCreativeMandate(baseInput);
      expect(mandate).toContain("FLYER EXCEPTION");
      expect(mandate).toContain("ZERO human presence");
      expect(mandate).not.toContain("Dynamic hero subject presenting a high-res app UI mockup");
    });
  });

  describe("PromptPlannerV2 (Motor v2)", () => {
    it("selectArtDirections deve filtrar ou penalizar direções com people: 'required' quando noPeople estiver ativo", () => {
      const directions = selectArtDirections({
        objective: "flyer",
        brief: "Venda de apartamento sem pessoas",
        noPeople: true,
      });

      // Nenhuma das direções selecionadas deve exigir pessoas
      for (const d of directions) {
        expect(d.people).not.toBe("required");
      }
    });

    it("compileImagePrompt deve forçar 'No people in the image. Strictly zero humans' quando sem pessoas", () => {
      const plannerInput: PlannerV2Input = {
        userBrief: "Arte para lançamento imobiliário",
        objective: "commercial" as any,
        format: "portrait" as any,
        width: 1080,
        height: 1350,
        quantity: 1,
        stylePreference: "photographic",
        useBrandKit: false,
        negativeInstructions: "não inserir pessoas",
      };

      const mockDirection = {
        id: "hero_architectural",
        labelPt: "Arquitetura",
        objectives: ["commercial"],
        nicheHints: ["imovel"],
        people: "optional" as const,
        productFriendly: true,
        sceneEn: "Architectural property",
        lightEn: "Golden hour sun",
        cameraEn: "Wide angle prime",
        textZoneEn: "top third",
      };

      const mockLlm = {
        visual: {
          subject: "Luxury residence facade",
          setting: "Lush garden and pool",
          composition: "Symmetric front view",
          people: "none",
        },
      };

      const compiled = PromptPlannerV2.compileImagePrompt(
        plannerInput,
        mockDirection,
        mockLlm as any,
        "top-left"
      );

      expect(compiled).toContain("No people in the image. Strictly zero humans");
    });
  });
});
