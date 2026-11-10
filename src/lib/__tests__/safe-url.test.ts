import { describe, it, expect } from "vitest";
import { isSafePublicUrl } from "../safe-url";

describe("isSafePublicUrl (proteção SSRF)", () => {
  it.each([
    "http://127.0.0.1/admin",
    "http://localhost:9002/api",
    "http://169.254.169.254/computeMetadata/v1/",
    "http://10.0.0.5/",
    "http://192.168.0.1/",
    "http://[::1]/",
    "file:///etc/passwd",
    "ftp://example.com/x",
    "nao-e-url",
  ])("bloqueia %s", async (url) => {
    expect(await isSafePublicUrl(url)).toBe(false);
  });

  it("permite IP público literal", async () => {
    expect(await isSafePublicUrl("https://8.8.8.8/imagem.png")).toBe(true);
  });
});
