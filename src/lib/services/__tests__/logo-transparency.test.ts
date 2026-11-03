import { describe, it, expect, vi } from "vitest";
import { generateTransparentLogoBlob } from "../logo-transparency";

describe("generateTransparentLogoBlob - Remoção de Fundo de Logotipo", () => {
  it("exporta a função generateTransparentLogoBlob corretamente", () => {
    expect(typeof generateTransparentLogoBlob).toBe("function");
  });

  it("processa com sucesso um SVG data URL e gera o PNG correspondente", async () => {
    // Mock do Canvas e Image para ambiente JSDOM
    const mockToBlob = vi.fn((callback: (blob: Blob | null) => void) => {
      callback(new Blob(["mock-transparent-png"], { type: "image/png" }));
    });

    const mockGetContext = vi.fn(() => ({
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray(100 * 100 * 4),
      })),
      putImageData: vi.fn(),
    }));

    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName === "canvas") {
        return {
          getContext: mockGetContext,
          toBlob: mockToBlob,
          width: 100,
          height: 100,
        } as any;
      }
      return document.createElement(tagName);
    });

    // SVG data URL
    const svgData = "data:image/svg+xml;utf8," + encodeURIComponent('<svg><rect width="100" height="100" fill="white"/><circle cx="50" cy="50" r="40" fill="blue"/></svg>');

    // Simula Image onload
    const origImage = global.Image;
    global.Image = class {
      crossOrigin = "";
      src = "";
      onload = () => {};
      onerror = () => {};
      constructor() {
        setTimeout(() => this.onload(), 0);
      }
    } as any;

    const blob = await generateTransparentLogoBlob(svgData);
    expect(blob).toBeDefined();
    expect(blob.type).toBe("image/png");

    global.Image = origImage;
  });
});
