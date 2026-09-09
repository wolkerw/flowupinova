import { describe, it, expect, vi, beforeEach } from "vitest";
import { getOnboardingProfile, updateOnboardingProfile } from "../onboarding-service";
import * as firestore from "firebase/firestore";

vi.mock("@/lib/firebase", () => ({
  db: {},
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn((_db, path) => ({ path })),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
}));

describe("Onboarding Service — Variações de Logomarcas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve carregar todas as variações de logos (dark, light, secondary, extraLogos) corretamente", async () => {
    const mockDocData = {
      name: "Empresa Teste",
      logos: {
        horizontal: { url: "https://example.com/h.png", width: 200, height: 100 },
        vertical: { url: "https://example.com/v.png", width: 100, height: 200 },
        symbol: { url: "https://example.com/s.png", width: 50, height: 50 },
        avatar: { url: "https://example.com/a.png", width: 80, height: 80 },
        dark: { url: "https://example.com/dark.png", width: 300, height: 150 },
        light: { url: "https://example.com/light.png", width: 300, height: 150 },
        secondary: { url: "https://example.com/sec.png", width: 120, height: 60 },
        extraLogos: [
          { id: "extra_1", name: "Selo Black Friday", url: "https://example.com/selo.png", width: 80, height: 80 },
        ],
      },
    };

    vi.mocked(firestore.getDoc).mockResolvedValueOnce({
      exists: () => true,
      data: () => mockDocData,
    } as any);

    const profile = await getOnboardingProfile("user-test-123");

    expect(profile.logos?.dark?.url).toBe("https://example.com/dark.png");
    expect(profile.logos?.light?.url).toBe("https://example.com/light.png");
    expect(profile.logos?.secondary?.url).toBe("https://example.com/sec.png");
    expect(profile.logos?.extraLogos).toHaveLength(1);
    expect(profile.logos?.extraLogos?.[0].name).toBe("Selo Black Friday");
  });

  it("deve chamar setDoc ao atualizar o perfil com logos parciais", async () => {
    vi.mocked(firestore.setDoc).mockResolvedValueOnce(undefined as any);

    const updatePayload = {
      logos: {
        dark: { url: "https://example.com/new-dark.png", width: 400, height: 200 },
      },
    };

    await updateOnboardingProfile("user-test-123", updatePayload);

    expect(firestore.setDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: "users/user-test-123/business/onboarding" }),
      updatePayload,
      { merge: true }
    );
  });
});
