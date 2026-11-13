import { describe, it, expect, vi, afterEach } from "vitest";
import { ART_DIRECTIONS, selectArtDirections } from "../art-direction-library";
import { PromptPlannerV2, type PlannerV2Input } from "../PromptPlannerV2";

function baseInput(over: Partial<PlannerV2Input> = {}): PlannerV2Input {
  return {
    userBrief: "Post para divulgar o pão de fermentação natural da padaria",
    objective: "social" as any,
    format: "portrait" as any,
    width: 1080,
    height: 1350,
    quantity: 1,
    stylePreference: "photographic",
    useBrandKit: true,
    textOverlayMode: "TITLE_ONLY" as any,
    brandKit: {
      enabled: true,
      businessName: "Padaria Trigo Bom",
      segment: "Padaria artesanal",
      rawSegment: "Padaria artesanal",
      primaryColors: ["#7A3E1D"],
      secondaryColors: ["#F2E3C6"],
      accentColors: [],
      hasCustomColors: true,
      hasLocalOfficialLogo: false,
      businessDescription: "Pães de fermentação natural feitos todos os dias",
      mainBenefits: ["Fermentação de 48h", "Forno a lenha"],
    },
    ...over,
  };
}

const llmOutput = {
  insight: "Quem compra pão artesanal quer sentir que foi feito hoje.",
  concepts: [
    { idea: "Close macro da casca crocante rachando ao ser partida.", artDirectionId: "macro_texture", why: "sensorial" },
    { idea: "O padeiro tirando fornada do forno a lenha.", artDirectionId: "documentary_real_business", why: "autêntico" },
  ],
  chosenIndex: 1,
  headline: "Feito hoje, às 5h",
  subline: "Fermentação natural de 48 horas",
  visual: {
    subject: "a baker pulling a tray of sourdough loaves from a wood-fired oven",
    setting: "small artisan bakery kitchen at dawn, flour on the wooden bench",
    composition: "baker on the left third, loaves in the foreground",
    people: "one baker in a linen apron, focused on the work",
    palette: "warm browns and cream",
    mood: "warm, honest, early morning",
  },
};

describe("selectArtDirections", () => {
  it("prioriza direções do nicho e do objetivo, de forma determinística", () => {
    const a = selectArtDirections({ objective: "social", segment: "padaria", brief: "pão artesanal" });
    const b = selectArtDirections({ objective: "social", segment: "padaria", brief: "pão artesanal" });
    expect(a.map((d) => d.id)).toEqual(b.map((d) => d.id));
    expect(a.map((d) => d.id)).toContain("documentary_real_business");
  });

  it("evita repetir as últimas direções do cliente", () => {
    const first = selectArtDirections({ objective: "social", segment: "padaria" })[0].id;
    const next = selectArtDirections({ objective: "social", segment: "padaria", recentIds: [first] });
    expect(next.map((d) => d.id)).not.toContain(first);
  });

  it("com foto de produto, só sugere direções que funcionam com produto real", () => {
    const picks = selectArtDirections({ objective: "commercial", segment: "cosméticos", hasProductReference: true });
    expect(picks.every((d) => d.productFriendly)).toBe(true);
  });

  it("nenhuma direção da biblioteca usa clichês de IA", () => {
    const text = JSON.stringify(ART_DIRECTIONS).toLowerCase();
    expect(text).not.toMatch(/neon|glassmorph|holograph|levitat|zero-gravity|bokeh/);
  });
});

describe("PromptPlannerV2.compileImagePrompt", () => {
  const direction = ART_DIRECTIONS.find((d) => d.id === "documentary_real_business")!;

  it("monta um prompt curto, sem códigos internos nem gritos, com a headline exata", () => {
    const prompt = PromptPlannerV2.compileImagePrompt(baseInput(), direction, llmOutput as any, "top-right");
    expect(prompt.length).toBeLessThan(2500);
    expect(prompt).toContain('"Feito hoje, às 5h"');
    expect(prompt).not.toMatch(/\/[a-z]+lock|TERMINANTEMENTE|CRITICAL MANDATE|STRICTLY FORBIDDEN/);
    expect(prompt).toContain("#7A3E1D");
  });

  it("nunca usa as cores da NumVapt quando o cliente não cadastrou cores", () => {
    const input = baseInput({
      brandKit: { ...baseInput().brandKit!, primaryColors: ["#0083C7"], secondaryColors: ["#FA6305"], hasCustomColors: false },
    });
    const prompt = PromptPlannerV2.compileImagePrompt(input, direction, { ...llmOutput, visual: { ...llmOutput.visual, palette: "" } } as any, "top-right");
    expect(prompt).not.toMatch(/#0083C7|#FA6305/i);
    expect(prompt).toContain("suits Padaria artesanal");
  });

  it("reserva a zona do logo na mesma posição escolhida", () => {
    const input = baseInput({
      referenceImages: [{ role: "business_logo", mimeType: "image/png", base64: "x" }],
    });
    const prompt = PromptPlannerV2.compileImagePrompt(input, direction, llmOutput as any, "bottom-right");
    expect(prompt).toContain("bottom-right corner free");
    expect(prompt).not.toContain("top-left");
  });

  it("sem pessoas quando a direção não permite", () => {
    const still = ART_DIRECTIONS.find((d) => d.id === "single_light_plinth")!;
    const prompt = PromptPlannerV2.compileImagePrompt(baseInput(), still, llmOutput as any, "top-left");
    expect(prompt).toContain("No people in the image.");
  });

  it("preserva o produto real quando há foto de produto", () => {
    const input = baseInput({
      referenceImages: [{ role: "product_subject", mimeType: "image/png", base64: "x", description: "pote de geleia" }],
    });
    const prompt = PromptPlannerV2.compileImagePrompt(input, direction, llmOutput as any, "top-left");
    expect(prompt).toContain("exactly as it is");
  });

  it("remove clichês mesmo que o LLM os escreva", () => {
    const dirty = { ...llmOutput, visual: { ...llmOutput.visual, setting: "studio with glowing neon ribbons and glassmorphic cards floating" } };
    const prompt = PromptPlannerV2.compileImagePrompt(baseInput(), direction, dirty as any, "top-left");
    expect(prompt).not.toMatch(/neon|glassmorph/i);
  });
});

describe("PromptPlannerV2.plan", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.OPENAI_API_KEY;
  });

  it("usa o conceito escolhido pelo LLM e devolve a direção de arte", async () => {
    process.env.OPENAI_API_KEY = "test";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ choices: [{ message: { content: JSON.stringify(llmOutput) } }] }),
      }))
    );
    const result = await PromptPlannerV2.plan(baseInput({ lastLogoPosition: "top-left" }));
    expect(result.artDirectionId).toBe("documentary_real_business");
    expect(result.plannerModelUsed).toContain("prompt v2");
    expect(result.visualPlan.brandApplication.logoPosition).toBe("top-right");
    expect(result.compiledImagePrompt).toContain("baker");
  });

  it("sem LLM disponível, gera um prompt v2 determinístico válido", async () => {
    const result = await PromptPlannerV2.plan(baseInput());
    expect(result.plannerModelUsed).toBe("deterministic-v2");
    expect(result.compiledImagePrompt.length).toBeGreaterThan(100);
    expect(result.compiledImagePrompt).not.toMatch(/neon/i);
  });
});
