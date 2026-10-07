import { describe, it, expect } from "vitest";
import { isE2ETestContent, toIsoDate } from "../generated-content-utils";

describe("toIsoDate", () => {
  it("converte Timestamp do Firestore", () => {
    const ts = { toDate: () => new Date("2026-10-02T18:00:00.000Z") };
    expect(toIsoDate(ts)).toBe("2026-10-02T18:00:00.000Z");
  });

  it("converte string ISO, Date, número e objeto serializado", () => {
    expect(toIsoDate("2026-10-02T18:03:13.841Z")).toBe("2026-10-02T18:03:13.841Z");
    expect(toIsoDate(new Date("2026-01-01T00:00:00.000Z"))).toBe("2026-01-01T00:00:00.000Z");
    expect(toIsoDate(0)).toBe("1970-01-01T00:00:00.000Z");
    expect(toIsoDate({ _seconds: 1 })).toBe("1970-01-01T00:00:01.000Z");
    expect(toIsoDate({ seconds: 2 })).toBe("1970-01-01T00:00:02.000Z");
  });

  it("retorna null para valores vazios ou inválidos sem lançar exceção", () => {
    expect(toIsoDate(null)).toBeNull();
    expect(toIsoDate(undefined)).toBeNull();
    expect(toIsoDate("")).toBeNull();
    expect(toIsoDate("data-invalida")).toBeNull();
    expect(toIsoDate({})).toBeNull();
    expect(toIsoDate({ toDate: () => { throw new Error("boom"); } })).toBeNull();
  });
});

describe("isE2ETestContent", () => {
  it("identifica a imagem fixa usada pelos testes E2E", () => {
    expect(
      isE2ETestContent({
        imageUrls: ["https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800"],
      })
    ).toBe(true);
    expect(
      isE2ETestContent({
        conceptUrls: ["https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800"],
      })
    ).toBe(true);
  });

  it("identifica o prompt fixo dos testes E2E", () => {
    expect(
      isE2ETestContent({
        promptUsed:
          "Novidades da semana: Dicas imperdíveis para impulsionar seu negócio em 2026 com IA!",
      })
    ).toBe(true);
  });

  it("não marca gerações reais como teste", () => {
    expect(
      isE2ETestContent({
        text: "Promoção de outubro na loja",
        promptUsed: "Promoção de outubro",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/x/o/img.png",
        imageUrls: [null, undefined],
      })
    ).toBe(false);
    expect(isE2ETestContent({})).toBe(false);
  });
});
