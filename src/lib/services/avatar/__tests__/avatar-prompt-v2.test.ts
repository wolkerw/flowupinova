import { describe, it, expect } from "vitest";
import { buildAvatarPromptV2, parseIdentityTraits } from "../avatar-prompt-v2";

const identity = {
  ageRange: "35-45 years old",
  faceShape: "oblong, rounded square jaw",
  hair: "short, M-shaped receding hairline, salt-and-pepper at temples",
  eyebrows: "medium, straight",
  eyes: "dark brown, almond",
  nose: "straight bridge, rounded tip",
  mouth: "medium-thin lips",
  facialHair: "short full beard, grey concentrated on chin",
  skin: "fair to medium",
  distinctive: ["receding temples", "grey chin beard"],
  neutralExpression: "serious, direct gaze",
};

describe("parseIdentityTraits", () => {
  it("normaliza a resposta da análise e junta listas", () => {
    const traits = parseIdentityTraits(identity)!;
    expect(traits.distinctive).toBe("receding temples; grey chin beard");
    expect(traits.hair).toContain("receding hairline");
  });

  it("descarta respostas vazias ou incompletas", () => {
    expect(parseIdentityTraits(null)).toBeNull();
    expect(parseIdentityTraits({ hair: "short" })).toBeNull();
  });
});

describe("buildAvatarPromptV2", () => {
  it("com foto de estilo, recria a cena e lista os traços reais da selfie", () => {
    const prompt = buildAvatarPromptV2({
      hasStyleImage: true,
      style: { clothing: "grey suit", background: "light studio", pose: "seated, 3/4", lighting: "soft key from left" },
      identity: parseIdentityTraits(identity),
    });
    expect(prompt).toContain("recreating IMAGE 2");
    expect(prompt).toContain("grey suit");
    expect(prompt).toContain("- Hair: short, M-shaped receding hairline");
    expect(prompt).toContain("without beautifying");
    expect(prompt).toContain("85mm");
    expect(prompt).not.toMatch(/TERMINANTEMENTE|bobblehead|cabeça grande/i);
  });

  it("sem foto de estilo, usa o pedido do cliente como cena", () => {
    const prompt = buildAvatarPromptV2({ hasStyleImage: false, identity: null, userPrompt: "terno azul em escritório" });
    expect(prompt).toContain("terno azul em escritório");
    expect(prompt).not.toContain("IMAGE 2 is the reference");
    expect(prompt).toContain("Reproduce the client's exact face");
  });

  it("mantém o prompt enxuto", () => {
    const prompt = buildAvatarPromptV2({ hasStyleImage: true, style: {}, identity: parseIdentityTraits(identity) });
    expect(prompt.length).toBeLessThan(3500);
  });
});
