import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateVideoThumbnail } from "../page";

describe("generateVideoThumbnail", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("handles video thumbnail generation gracefully", async () => {
    // Cria um arquivo mock de vídeo
    const videoFile = new File(["dummy video data"], "teste.mp4", { type: "video/mp4" });
    
    // Testa execução da função
    const result = await generateVideoThumbnail(videoFile);
    // Em ambiente JSDOM sem decoder real de mídia de hardware, deve retornar null ou string sem estourar exceção
    expect(result === null || typeof result === "string").toBe(true);
  });
});
