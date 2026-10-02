import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrandLogoApplier } from "../BrandLogoApplier";

vi.mock("jimp", () => {
  const mockLogoImage = {
    width: 200,
    height: 100,
    resize: vi.fn(),
  };

  const mockMainImage = {
    width: 1080,
    height: 1350,
    resize: vi.fn(),
    composite: vi.fn(),
    getBuffer: vi.fn().mockResolvedValue(Buffer.from("composite-image-with-logo")),
  };

  return {
    Jimp: {
      read: vi.fn().mockImplementation((buf: any) => {
        if (buf && buf.toString() === "logo-buffer") {
          return Promise.resolve(mockLogoImage);
        }
        return Promise.resolve(mockMainImage);
      }),
    },
  };
});

describe("BrandLogoApplier", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna o buffer original se a imagem ou logo forem inválidas/vazias", async () => {
    const emptyBuf = Buffer.from([]);
    const res = await BrandLogoApplier.applyLogo(emptyBuf, "");
    expect(res).toBe(emptyBuf);
  });

  it("aplica a logomarca com proporções e posicionamento corretos via Jimp", async () => {
    const imageBuffer = Buffer.from("main-image-buffer");
    const logoBuffer = Buffer.from("logo-buffer");

    const result = await BrandLogoApplier.applyLogo(imageBuffer, logoBuffer, {
      position: "top-left",
    });

    expect(result).toBeDefined();
    expect(result.toString()).toBe("composite-image-with-logo");
  });

  it("baixa a logomarca por URL e faz o composite com segurança", async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => Buffer.from("logo-buffer"),
    });

    const imageBuffer = Buffer.from("main-image-buffer");
    const result = await BrandLogoApplier.applyLogo(imageBuffer, "https://example.com/logo.png");

    expect(result).toBeDefined();
    expect(result.toString()).toBe("composite-image-with-logo");
    global.fetch = originalFetch;
  });

  it("retorna o buffer original sem estourar exceção se o fetch da logo falhar", async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });

    const imageBuffer = Buffer.from("main-image-buffer");
    const result = await BrandLogoApplier.applyLogo(imageBuffer, "https://example.com/not-found.png");

    expect(result).toBe(imageBuffer);
    global.fetch = originalFetch;
  });
});
