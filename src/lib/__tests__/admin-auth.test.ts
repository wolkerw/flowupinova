import { describe, it, expect, vi } from "vitest";

const { mockVerify } = vi.hoisted(() => ({ mockVerify: vi.fn() }));
vi.mock("@/lib/firebase-admin", () => ({ adminAuth: { verifyIdToken: mockVerify } }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import { validateAdminToken } from "../admin-auth";

function forgedToken(payload: object): string {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${b64({ alg: "none" })}.${b64(payload)}.assinatura-falsa`;
}

describe("validateAdminToken", () => {
  it("rejeita JWT forjado com e-mail de admin (assinatura inválida)", async () => {
    mockVerify.mockRejectedValueOnce(new Error("invalid signature"));
    const token = forgedToken({ uid: "x", email: "flowupinova@gmail.com" });
    expect(await validateAdminToken(token)).toBeNull();
  });

  it("aceita token verificado de e-mail admin", async () => {
    mockVerify.mockResolvedValueOnce({ uid: "a1", email: "flowupinova@gmail.com" });
    expect(await validateAdminToken("token-valido")).toMatchObject({ uid: "a1" });
  });

  it("rejeita token verificado de e-mail comum", async () => {
    mockVerify.mockResolvedValueOnce({ uid: "u1", email: "cliente@example.com" });
    expect(await validateAdminToken("token-valido")).toBeNull();
  });
});
