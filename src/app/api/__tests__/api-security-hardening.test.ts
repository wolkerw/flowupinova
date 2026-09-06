import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockVerifyIdToken = vi.fn();
const mockAdminAuthVerify = vi.fn();
const mockCookies = vi.fn();

vi.mock("next/headers", () => ({
  cookies: () => mockCookies(),
}));

vi.mock("@/lib/firebase-admin", () => {
  const dummyDoc = {
    get: vi.fn().mockResolvedValue({ exists: false, data: () => ({}) }),
    set: vi.fn().mockResolvedValue({}),
  };
  const dummyCollection = {
    doc: vi.fn().mockReturnValue(dummyDoc),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    get: vi.fn().mockResolvedValue({ docs: [], forEach: vi.fn() }),
  };
  return {
    admin: {
      firestore: {
        FieldValue: {
          serverTimestamp: vi.fn().mockReturnValue(new Date()),
        },
      },
    },
    adminDb: {
      collection: vi.fn().mockReturnValue(dummyCollection),
    },
    adminAuth: {
      verifyIdToken: (token: string) => mockAdminAuthVerify(token),
    },
    verifyIdToken: (token: string) => mockVerifyIdToken(token),
    getUidFromCookie: vi.fn().mockRejectedValue(new Error("No cookie")),
  };
});

describe("API Security Hardening", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCookies.mockResolvedValue({
      get: () => undefined,
    });
  });

  describe("Transactions API Security", () => {
    it("rejects list-pending for unauthenticated users (403)", async () => {
      const { GET } = await import("../transactions/route");
      const req = new NextRequest("http://localhost/api/transactions?action=list-pending");
      const res = await GET(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain("apenas administradores");
    });

    it("rejects update-status for unauthenticated users (403)", async () => {
      const { POST } = await import("../transactions/route");
      const req = new NextRequest("http://localhost/api/transactions?action=update-status", {
        method: "POST",
        body: JSON.stringify({ transactionId: "tx-1", status: "approved" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain("apenas administradores");
    });

    it("rejects submit-receipt when unauthenticated (401)", async () => {
      const { POST } = await import("../transactions/route");
      const req = new NextRequest("http://localhost/api/transactions?action=submit-receipt", {
        method: "POST",
        body: JSON.stringify({
          userId: "user-123",
          plan: "mensal",
          method: "pix",
          receiptUrl: "https://storage.com/rec.jpg",
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it("rejects submit-receipt when userId does not match authenticated user (403)", async () => {
      mockVerifyIdToken.mockResolvedValue({ uid: "user-real-999", email: "real@test.com" });
      const { POST } = await import("../transactions/route");
      const req = new NextRequest("http://localhost/api/transactions?action=submit-receipt", {
        method: "POST",
        headers: { Authorization: "Bearer valid-token" },
        body: JSON.stringify({
          userId: "victim-user-123",
          plan: "mensal",
          method: "pix",
          receiptUrl: "https://storage.com/rec.jpg",
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain("não corresponde ao usuário autenticado");
    });
  });

  describe("AI Generation APIs Security", () => {
    it("rejects /api/generate-text when unauthenticated (401)", async () => {
      const { POST } = await import("../generate-text/route");
      const req = new Request("http://localhost/api/generate-text", {
        method: "POST",
        body: JSON.stringify({ summary: "Post sobre marketing" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toContain("Autenticação obrigatória");
    });
  });

  describe("CRON Authorization Security", () => {
    it("rejects /api/cron/publish-posts when CRON_SECRET is set and header is wrong or missing (401)", async () => {
      process.env.CRON_SECRET = "super-secret-cron-key";
      const { POST } = await import("../cron/publish-posts/route");
      const req = new NextRequest("http://localhost/api/cron/publish-posts", {
        method: "POST",
        headers: { Authorization: "Bearer wrong-key" },
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
      delete process.env.CRON_SECRET;
    });

    it("rejects /api/cron/sync-ads when CRON_SECRET is set and header is wrong (401)", async () => {
      process.env.CRON_SECRET = "super-secret-cron-key";
      const { POST } = await import("../cron/sync-ads/route");
      const req = new NextRequest("http://localhost/api/cron/sync-ads", {
        method: "POST",
        headers: { Authorization: "Bearer wrong-key" },
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
      delete process.env.CRON_SECRET;
    });
  });

  describe("Proxy Webhook Security", () => {
    it("rejects /api/proxy-webhook without authenticated session (401)", async () => {
      const { POST } = await import("../proxy-webhook/route");
      const req = new NextRequest("http://localhost/api/proxy-webhook?target=imagem_sem_logo", {
        method: "POST",
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toContain("Autenticação obrigatória");
    });
  });
});
