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

  class MockJimpClass {
    width: number;
    height: number;
    constructor(opts: any) {
      this.width = opts?.width || 100;
      this.height = opts?.height || 50;
    }
  }

  return {
    Jimp: Object.assign(MockJimpClass, {
      read: vi.fn().mockImplementation((buf: any) => {
        if (buf && buf.toString() === "logo-buffer") {
          return Promise.resolve(mockLogoImage);
        }
        return Promise.resolve(mockMainImage);
      }),
    }),
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

  it("calcula corretamente a análise de densidade de bordas e clutterScore através de analyzeRegion", () => {
    // Simular imagem com fundo limpo (todos os pixels brancos)
    const cleanMockImg = {
      width: 200,
      height: 100,
      getPixelColor: () => 0xffffffff,
    };

    const cleanResult = BrandLogoApplier.analyzeRegion(cleanMockImg, 0, 0, 100, 50);
    expect(cleanResult.edgeDensity).toBe(0);
    expect(cleanResult.stdDev).toBe(0);
    expect(cleanResult.clutterScore).toBe(0);

    // Simular imagem com texto de alto contraste alternando preto e branco
    let toggle = false;
    const noisyMockImg = {
      width: 200,
      height: 100,
      getPixelColor: (x: number) => {
        toggle = x % 4 === 0;
        return toggle ? 0x000000ff : 0xffffffff;
      },
    };

    const noisyResult = BrandLogoApplier.analyzeRegion(noisyMockImg, 0, 0, 100, 50);
    expect(noisyResult.edgeDensity).toBeGreaterThan(0);
    expect(noisyResult.clutterScore).toBeGreaterThan(8.0);
  });

  it("detecta colisão em top-left e reloca para top-right quando top-left contém texto denso", async () => {
    const { Jimp } = await import("jimp");
    const mockComposite = vi.fn();
    
    // Imagem onde x < 300 tem texto alternado de alto contraste (top-left) e x >= 300 é 100% limpo (top-right)
    const mockImageWithTextOnLeft = {
      width: 1080,
      height: 1350,
      resize: vi.fn(),
      composite: mockComposite,
      getPixelColor: (x: number) => {
        if (x < 300) {
          return (x >> 1) % 2 === 0 ? 0x000000ff : 0xffffffff;
        }
        return 0xffffffff; // top-right limpo
      },
      getBuffer: vi.fn().mockResolvedValue(Buffer.from("composite-avoided-collision")),
    };

    (Jimp.read as any).mockImplementation((buf: any) => {
      if (buf && buf.toString() === "logo-buffer") {
        return Promise.resolve({ width: 200, height: 100, resize: vi.fn() });
      }
      return Promise.resolve(mockImageWithTextOnLeft);
    });

    const imageBuffer = Buffer.from("main-image-buffer");
    const logoBuffer = Buffer.from("logo-buffer");

    const result = await BrandLogoApplier.applyLogo(imageBuffer, logoBuffer, {
      position: "top-left",
      avoidCollisions: true,
    });

    expect(result.toString()).toBe("composite-avoided-collision");
    expect(mockComposite).toHaveBeenCalled();
    // O composite da logo deve ter sido chamado com posX correspondente a top-right (x > 500) e não top-left (x = margin ~ 43)
    const callArgs = mockComposite.mock.calls[0];
    const posXUsed = callArgs[1];
    expect(posXUsed).toBeGreaterThan(500);
  });
});
