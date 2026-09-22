import { describe, it, expect } from "vitest";
import { FORMAT_DIMENSIONS, type AIImageFormat } from "../ai-image-general";

describe("ai-image-general types & contracts", () => {
  it("contém dimensões corretas para todos os formatos previstos", () => {
    const formats: AIImageFormat[] = ["square", "portrait", "landscape", "story", "banner"];

    formats.forEach((fmt) => {
      const dim = FORMAT_DIMENSIONS[fmt];
      expect(dim).toBeDefined();
      expect(dim.width).toBeGreaterThan(0);
      expect(dim.height).toBeGreaterThan(0);
      expect(dim.aspectRatio).toBeDefined();
    });

    expect(FORMAT_DIMENSIONS.square.width).toBe(1080);
    expect(FORMAT_DIMENSIONS.square.height).toBe(1080);
    expect(FORMAT_DIMENSIONS.portrait.width).toBe(1080);
    expect(FORMAT_DIMENSIONS.portrait.height).toBe(1350);
  });
});
