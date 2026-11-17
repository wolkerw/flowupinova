import { describe, it, expect } from "vitest";
import { isEmojiOnly, isShortReaction, sanitizeMaiaReply } from "../maia-shared";

describe("isEmojiOnly", () => {
  it.each(["❤️", "🔥🔥🔥", "👏🏽👏🏽", "😍!!", "🇧🇷", "❤️ 🙌"])("'%s' é só emoji", (t) => {
    expect(isEmojiOnly(t)).toBe(true);
  });
  it.each(["oi", "quanto custa? 🤔", "123", "😍 amei"])("'%s' não é só emoji", (t) => {
    expect(isEmojiOnly(t)).toBe(false);
  });
});

describe("isShortReaction", () => {
  it.each(["Amei!!", "top", "kkkkk", "Parabéns 👏", "que lindo", "Show!!!"])("'%s' é reação", (t) => {
    expect(isShortReaction(t)).toBe(true);
  });
  it.each(["amei, quanto custa?", "oi", "quero saber mais", "Top, como assino?"])("'%s' não é reação", (t) => {
    expect(isShortReaction(t)).toBe(false);
  });
});

describe("sanitizeMaiaReply", () => {
  it("troca .com.br e /planos e corrige preço inventado", () => {
    const out = sanitizeMaiaReply("Custa R$ 99,00 por mês: https://www.numvapt.com.br/planos e https://numvapt.com.br/x");
    expect(out).toContain("R$ 490,00/mês");
    expect(out).toContain("https://numvapt.com/acesso/cadastro");
    expect(out).toContain("https://numvapt.com/x");
    expect(out).not.toContain(".com.br");
  });
});
