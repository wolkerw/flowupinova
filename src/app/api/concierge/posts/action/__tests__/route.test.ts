import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";
import { NextRequest } from "next/server";

vi.mock("@/lib/api-auth", () => ({
  getAuthenticatedUser: vi.fn(),
}));

vi.mock("@/lib/firebase-admin", () => {
  const mockPostDocUpdate = vi.fn().mockResolvedValue(undefined);
  const mockPostDocGet = vi.fn().mockResolvedValue({
    exists: true,
    data: () => ({ status: "pending_approval" }),
  });

  const mockPostDoc = {
    get: mockPostDocGet,
    update: mockPostDocUpdate,
  };

  const mockUserDoc = {
    get: vi.fn(),
    set: vi.fn().mockResolvedValue(undefined),
    collection: vi.fn().mockReturnValue({
      doc: vi.fn().mockReturnValue(mockPostDoc),
    }),
  };

  const mockUsersCollection = {
    doc: vi.fn().mockReturnValue(mockUserDoc),
    where: vi.fn().mockReturnValue({
      limit: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
      }),
    }),
  };

  return {
    adminDb: {
      collection: vi.fn().mockReturnValue(mockUsersCollection),
    },
  };
});

import { getAuthenticatedUser } from "@/lib/api-auth";
import { adminDb } from "@/lib/firebase-admin";

describe("POST /api/concierge/posts/action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 401 se usuário não autenticado", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue(null);

    const req = new NextRequest("http://localhost:9002/api/concierge/posts/action", {
      method: "POST",
      body: JSON.stringify({ postId: "post-1", action: "approve" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("aprova postagem com sucesso se for cliente aprovador", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      uid: "approver-123",
      email: "cliente@aprovador.com",
    } as any);

    const userDocMock = {
      get: vi.fn().mockResolvedValue({
        exists: true,
        data: () => ({ plan: "client_approver", linkedWorkspaceId: "creator-999" }),
      }),
      set: vi.fn().mockResolvedValue(undefined),
      collection: vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            exists: true,
            data: () => ({ status: "pending_approval" }),
          }),
          update: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    };

    (adminDb.collection as any).mockReturnValue({
      doc: vi.fn().mockReturnValue(userDocMock),
    });

    const req = new NextRequest("http://localhost:9002/api/concierge/posts/action", {
      method: "POST",
      body: JSON.stringify({
        postId: "post-1",
        workspaceId: "creator-999",
        action: "approve",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it("impede que o gestor (não aprovador) aprove o post em nome do cliente", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      uid: "gestor-999",
      email: "gestor@agencia.com",
      isAdmin: false,
    } as any);

    const userDocMock = {
      get: vi.fn().mockResolvedValue({
        exists: true,
        data: () => ({ plan: "pro", role: "creator" }),
      }),
    };

    (adminDb.collection as any).mockReturnValue({
      doc: vi.fn().mockReturnValue(userDocMock),
    });

    const req = new NextRequest("http://localhost:9002/api/concierge/posts/action", {
      method: "POST",
      body: JSON.stringify({
        postId: "post-1",
        workspaceId: "gestor-999",
        action: "approve",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain("Apenas o cliente aprovador");
  });

  it("permite que o gestor reenvie a postagem para aprovação (resubmit)", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      uid: "gestor-999",
      email: "gestor@agencia.com",
    } as any);

    const postUpdateMock = vi.fn().mockResolvedValue(undefined);
    const userDocMock = {
      get: vi.fn().mockResolvedValue({
        exists: true,
        data: () => ({ plan: "pro", role: "creator" }),
      }),
      collection: vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            exists: true,
            data: () => ({ status: "changes_requested", imageUrls: ["https://old-url.jpg"] }),
          }),
          update: postUpdateMock,
        }),
      }),
    };

    (adminDb.collection as any).mockReturnValue({
      doc: vi.fn().mockReturnValue(userDocMock),
    });

    const req = new NextRequest("http://localhost:9002/api/concierge/posts/action", {
      method: "POST",
      body: JSON.stringify({
        postId: "post-1",
        workspaceId: "gestor-999",
        action: "resubmit",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.message).toContain("reenviada para aprovação");
    expect(postUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "pending_approval",
        "approval.status": "pending",
      })
    );
  });

  it("atualiza a imagem da postagem com sucesso (update_image)", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      uid: "gestor-999",
      email: "gestor@agencia.com",
    } as any);

    const postUpdateMock = vi.fn().mockResolvedValue(undefined);
    const userDocMock = {
      get: vi.fn().mockResolvedValue({
        exists: true,
        data: () => ({ plan: "pro", role: "creator" }),
      }),
      collection: vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            exists: true,
            data: () => ({ status: "changes_requested", imageUrls: ["https://old-url.jpg"] }),
          }),
          update: postUpdateMock,
        }),
      }),
    };

    (adminDb.collection as any).mockReturnValue({
      doc: vi.fn().mockReturnValue(userDocMock),
    });

    const req = new NextRequest("http://localhost:9002/api/concierge/posts/action", {
      method: "POST",
      body: JSON.stringify({
        postId: "post-1",
        workspaceId: "gestor-999",
        action: "update_image",
        newImageUrl: "https://new-edited-art.jpg",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(postUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        imageUrl: "https://new-edited-art.jpg",
        imageUrls: ["https://new-edited-art.jpg"],
      })
    );
  });
});
