import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../[token]/route";
import { POST } from "../[token]/action/route";

let mockPostsDocs: any[] = [];
let mockUserDocData: any = null;

vi.mock("@/lib/firebase-admin", () => ({
  adminDb: {
    collectionGroup: (name: string) => ({
      where: (field: string, op: string, val: string) => ({
        limit: () => ({
          get: () => Promise.resolve({
            empty: mockPostsDocs.length === 0,
            docs: mockPostsDocs,
          }),
        }),
      }),
    }),
    doc: (path: string) => ({
      get: () => Promise.resolve({
        exists: !!mockUserDocData,
        data: () => mockUserDocData,
      }),
    }),
  },
}));

describe("API Concierge - Link Mágico de Aprovação", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPostsDocs = [];
    mockUserDocData = null;
  });

  describe("GET /api/concierge/posts/[token]", () => {
    it("retorna 400 se o token for inválido ou muito curto", async () => {
      const req = new NextRequest("http://localhost/api/concierge/posts/abc");
      const res = await GET(req, { params: Promise.resolve({ token: "abc" }) });
      expect(res.status).toBe(400);
    });

    it("retorna 404 se nenhum post possuir o token", async () => {
      mockPostsDocs = [];
      const req = new NextRequest("http://localhost/api/concierge/posts/valid-token-1234");
      const res = await GET(req, { params: Promise.resolve({ token: "valid-token-1234" }) });
      expect(res.status).toBe(404);
    });

    it("retorna os dados públicos da publicação formatada", async () => {
      const updateMock = vi.fn();
      mockPostsDocs = [
        {
          id: "post_123",
          data: () => ({
            text: "Post para o Instagram sobre Black Friday",
            imageUrls: ["https://cdn.example.com/art.png"],
            platforms: ["instagram"],
            isCarousel: false,
            scheduledAt: new Date("2026-11-20T14:00:00Z"),
            status: "pending_approval",
            approval: {
              approvalToken: "valid-token-1234",
              tokenExpiresAt: new Date(Date.now() + 86400000).toISOString(),
              status: "pending_approval",
            },
          }),
          ref: {
            parent: { parent: { id: "user_client_456" } },
            update: updateMock,
          },
        },
      ];
      mockUserDocData = {
        businessProfile: { companyName: "Loja Wolker" },
        brandKit: { logoUrl: "https://cdn.example.com/logo.png" },
      };

      const req = new NextRequest("http://localhost/api/concierge/posts/valid-token-1234");
      const res = await GET(req, { params: Promise.resolve({ token: "valid-token-1234" }) });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.post.postId).toBe("post_123");
      expect(json.post.businessName).toBe("Loja Wolker");
      expect(json.post.businessLogo).toBe("https://cdn.example.com/logo.png");
      expect(json.post.isExpired).toBe(false);
      expect(json.post.status).toBe("pending_approval");
    });
  });

  describe("POST /api/concierge/posts/[token]/action", () => {
    it("retorna 400 se a ação for desconhecida", async () => {
      const req = new NextRequest("http://localhost/api/concierge/posts/valid-token-1234/action", {
        method: "POST",
        body: JSON.stringify({ action: "invalid_action" }),
      });
      const res = await POST(req, { params: Promise.resolve({ token: "valid-token-1234" }) });
      expect(res.status).toBe(400);
    });

    it("retorna 400 se pedir alteração mas não fornecer feedback", async () => {
      const req = new NextRequest("http://localhost/api/concierge/posts/valid-token-1234/action", {
        method: "POST",
        body: JSON.stringify({ action: "request_changes", feedback: "" }),
      });
      const res = await POST(req, { params: Promise.resolve({ token: "valid-token-1234" }) });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("descreva as alterações");
    });

    it("aprova o post com sucesso e agenda a publicação", async () => {
      const updateMock = vi.fn().mockResolvedValue(undefined);
      mockPostsDocs = [
        {
          id: "post_123",
          data: () => ({
            status: "pending_approval",
            approval: {
              approvalToken: "valid-token-1234",
              tokenExpiresAt: new Date(Date.now() + 86400000).toISOString(),
              status: "pending_approval",
            },
          }),
          ref: {
            update: updateMock,
          },
        },
      ];

      const req = new NextRequest("http://localhost/api/concierge/posts/valid-token-1234/action", {
        method: "POST",
        body: JSON.stringify({ action: "approve" }),
      });
      const res = await POST(req, { params: Promise.resolve({ token: "valid-token-1234" }) });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.status).toBe("approved");
      expect(json.postStatus).toBe("scheduled");
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "scheduled",
          "approval.status": "approved",
          "approval.reviewChannel": "magic_link",
        })
      );
    });

    it("registra solicitação de alterações com feedback do cliente", async () => {
      const updateMock = vi.fn().mockResolvedValue(undefined);
      mockPostsDocs = [
        {
          id: "post_123",
          data: () => ({
            status: "pending_approval",
            approval: {
              approvalToken: "valid-token-1234",
              tokenExpiresAt: new Date(Date.now() + 86400000).toISOString(),
              status: "pending_approval",
            },
          }),
          ref: {
            update: updateMock,
          },
        },
      ];

      const req = new NextRequest("http://localhost/api/concierge/posts/valid-token-1234/action", {
        method: "POST",
        body: JSON.stringify({
          action: "request_changes",
          feedback: "Por favor, alterar a cor do botão para azul e trocar o preço para R$ 149.",
        }),
      });
      const res = await POST(req, { params: Promise.resolve({ token: "valid-token-1234" }) });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.status).toBe("changes_requested");
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "changes_requested",
          "approval.status": "changes_requested",
          "approval.reviewerFeedback":
            "Por favor, alterar a cor do botão para azul e trocar o preço para R$ 149.",
        })
      );
    });
  });
});
