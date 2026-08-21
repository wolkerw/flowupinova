import { describe, it, expect } from "vitest";
import nextConfig from "../../../next.config";
import fs from "fs";
import path from "path";

describe("Security Configuration & Headers", () => {
  it("defines comprehensive HTTP security headers in next.config.ts", async () => {
    expect(nextConfig.headers).toBeDefined();
    if (typeof nextConfig.headers === "function") {
      const headerConfigs = await nextConfig.headers();
      expect(Array.isArray(headerConfigs)).toBe(true);
      expect(headerConfigs.length).toBeGreaterThan(0);

      const allHeaders = headerConfigs.flatMap((cfg: any) => cfg.headers);
      const headerKeys = allHeaders.map((h: any) => h.key);

      expect(headerKeys).toContain("X-Content-Type-Options");
      expect(headerKeys).toContain("X-Frame-Options");
      expect(headerKeys).toContain("X-XSS-Protection");
      expect(headerKeys).toContain("Referrer-Policy");
      expect(headerKeys).toContain("Permissions-Policy");
      expect(headerKeys).toContain("Strict-Transport-Security");

      const nosniff = allHeaders.find((h: any) => h.key === "X-Content-Type-Options");
      expect(nosniff?.value).toBe("nosniff");

      const frameOptions = allHeaders.find((h: any) => h.key === "X-Frame-Options");
      expect(frameOptions?.value).toBe("SAMEORIGIN");
    }
  });

  it("enforces size limits and MIME types in storage.rules", () => {
    const storageRulesPath = path.resolve(process.cwd(), "storage.rules");
    expect(fs.existsSync(storageRulesPath)).toBe(true);
    const content = fs.readFileSync(storageRulesPath, "utf-8");

    expect(content).toContain("isValidUpload()");
    expect(content).toContain("request.resource.size");
    expect(content).toContain("image/.*");
  });

  it("enforces owner access and prevents privilege escalation in firestore.rules", () => {
    const firestoreRulesPath = path.resolve(process.cwd(), "firestore.rules");
    expect(fs.existsSync(firestoreRulesPath)).toBe(true);
    const content = fs.readFileSync(firestoreRulesPath, "utf-8");

    expect(content).toContain("isOwner(userId)");
    expect(content).toContain("isSignedIn()");
    expect(content).toContain("affectedKeys().hasAny");
  });
});
