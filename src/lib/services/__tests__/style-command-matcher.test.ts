import { describe, it, expect, vi, beforeEach } from "vitest";
import { matchStyleCommands } from "../style-command-matcher";

vi.mock("@/lib/firebase-admin", () => ({
  adminDb: {
    collection: vi.fn(() => ({
      where: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue({
        empty: true,
      }),
    })),
  },
}));

describe("matchStyleCommands", () => {
  it("identifica comando explícito digitado com barra /bokeh", async () => {
    const result = await matchStyleCommands("Foto de uma modelo na cafeteria /bokeh");
    expect(result.commandNames).toContain("/bokeh");
    expect(result.injectedDirectives.some((d) => d.includes("depth of field"))).toBe(true);
    // Remove o comando explícito da frase base limpa
    expect(result.enrichedPrompt).not.toContain("/bokeh");
  });

  it("identifica comando semântico por palavras-chave em linguagem natural (luz natural e cidade à noite)", async () => {
    const result = await matchStyleCommands("Quero uma foto dela na cidade à noite com luz natural suave");
    expect(result.commandNames).toContain("/nightcity");
    expect(result.commandNames).toContain("/naturallight");
    expect(result.enrichedPrompt).toContain("[ESTILO PROFISSIONAL APLICADO:");
  });

  it("identifica comando de nitidez e textura da pele", async () => {
    const result = await matchStyleCommands("Retrato feminino bem nítido preservando a textura da pele");
    expect(result.commandNames).toContain("/sharpen");
    expect(result.commandNames).toContain("/skinreal");
  });

  it("não injeta comandos se o texto não corresponder a nenhum estilo cadastrado", async () => {
    const result = await matchStyleCommands("Um quadrado azul simples");
    expect(result.commandNames).toHaveLength(0);
    expect(result.enrichedPrompt).toBe("Um quadrado azul simples");
  });
});
