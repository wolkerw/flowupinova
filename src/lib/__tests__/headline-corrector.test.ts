import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { correctPortugueseHeadline } from "../headline-corrector";

describe("correctPortugueseHeadline", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, GEMINI_API_KEY: "test-api-key" };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("retorna string vazia para entradas nulas ou vazias", async () => {
    expect(await correctPortugueseHeadline("")).toBe("");
    // @ts-expect-error testando entrada inválida
    expect(await correctPortugueseHeadline(null)).toBe("");
  });

  it("retorna o próprio texto para entradas menores que 3 caracteres", async () => {
    expect(await correctPortugueseHeadline("OI")).toBe("OI");
    expect(await correctPortugueseHeadline(" a ")).toBe("a");
  });

  it("retorna o texto original se GEMINI_API_KEY não estiver configurada", async () => {
    delete process.env.GEMINI_API_KEY;
    const result = await correctPortugueseHeadline("promocao imperdivel");
    expect(result).toBe("promocao imperdivel");
  });

  it("corrige acentuação e ortografia com sucesso chamando o Gemini", async () => {
    const mockResponse = {
      candidates: [
        {
          content: {
            parts: [{ text: '"PROMOÇÃO IMPERDÍVEL"' }],
          },
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as any);

    const result = await correctPortugueseHeadline("promocao imperdivel");
    expect(result).toBe("PROMOÇÃO IMPERDÍVEL");
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("faz fallback seguro para o texto original se a chamada falhar ou der erro", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    const result = await correctPortugueseHeadline("edicao limitada");
    expect(result).toBe("edicao limitada");
  });
});
