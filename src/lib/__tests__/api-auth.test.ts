import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAuthenticatedUser, validateUserOwnership } from "../api-auth";

const mockVerifyIdToken = vi.fn();
vi.mock("../firebase-admin", () => ({
  verifyIdToken: (token: string) => mockVerifyIdToken(token),
}));

const mockCookies = vi.fn();
vi.mock("next/headers", () => ({
  cookies: () => mockCookies(),
}));

describe("api-auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("extracts token from Authorization header and verifies successfully", async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: "user-123", email: "user@example.com" });
    const req = new Request("http://localhost/api/test", {
      headers: { Authorization: "Bearer valid-token" },
    });

    const result = await getAuthenticatedUser(req);
    expect(result).toEqual({
      uid: "user-123",
      email: "user@example.com",
      isAdmin: false,
    });
    expect(mockVerifyIdToken).toHaveBeenCalledWith("valid-token");
  });

  it("extracts token from cookie when header is missing", async () => {
    mockCookies.mockResolvedValue({
      get: (name: string) => (name === "firebase-id-token" ? { value: "cookie-token" } : undefined),
    });
    mockVerifyIdToken.mockResolvedValue({ uid: "cookie-user", email: "cookie@example.com" });

    const req = new Request("http://localhost/api/test");
    const result = await getAuthenticatedUser(req);

    expect(result).toEqual({
      uid: "cookie-user",
      email: "cookie@example.com",
      isAdmin: false,
    });
  });

  it("returns null when no token is present", async () => {
    mockCookies.mockResolvedValue({
      get: () => undefined,
    });

    const req = new Request("http://localhost/api/test");
    const result = await getAuthenticatedUser(req);
    expect(result).toBeNull();
  });

  it("validates ownership correctly when user matches targetUserId", async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: "user-123" });
    const req = new Request("http://localhost/api/test", {
      headers: { Authorization: "Bearer valid-token" },
    });

    const validation = await validateUserOwnership(req, "user-123");
    expect(validation.authorized).toBe(true);
  });

  it("rejects when user does not match targetUserId and is not admin", async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: "attacker-456", email: "attacker@example.com" });
    const req = new Request("http://localhost/api/test", {
      headers: { Authorization: "Bearer valid-token" },
    });

    const validation = await validateUserOwnership(req, "victim-123");
    expect(validation.authorized).toBe(false);
    expect(validation.reason).toContain("Operação não autorizada");
  });
});
