import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../route";
import { NextRequest } from "next/server";

vi.mock("@/lib/api-auth", () => ({
  getAuthenticatedUser: vi.fn(),
}));

vi.mock("@/lib/firebase-admin", () => {
  const mockPostDoc = (id: string, data: any) => ({
    id,
    data: () => data,
  });

  const mockPostsSnap = [
    mockPostDoc("post-1", {
      text: "Post para aprovação",
      status: "pending_approval",
      createdAt: { toDate: () => new Date("2026-10-08T10:00:00Z") },
    }),
  ];

  const mockPostsCollection = {
    get: vi.fn().mockResolvedValue(mockPostsSnap),
  };

  const mockUserDoc = {
    get: vi.fn(),
    set: vi.fn().mockResolvedValue(undefined),
    collection: vi.fn().mockReturnValue(mockPostsCollection),
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
      collection: vi.fn().mockImplementation((name: string) => {
        if (name === "users") return mockUsersCollection;
        return { doc: vi.fn().mockReturnValue(mockUserDoc) };
      }),
    },
  };
});

import { getAuthenticatedUser } from "@/lib/api-auth";
import { adminDb } from "@/lib/firebase-admin";

describe("API /api/concierge/posts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 401 se usuário não estiver autenticado", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue(null);

    const req = new NextRequest("http://localhost:9002/api/concierge/posts");
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it("retorna posts do workspace para usuário criador/gestor", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ uid: "creator-123" } as any);

    const userDocMock = {
      get: vi.fn().mockResolvedValue({
        exists: true,
        data: () => ({ plan: "pro" }),
      }),
      collection: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue([
          {
            id: "post-1",
            data: () => ({
              text: "Post 1",
              status: "pending_approval",
            }),
          },
        ]),
      }),
    };

    const docMock = vi.fn().mockReturnValue(userDocMock);
    (adminDb.collection as any).mockReturnValue({ doc: docMock });

    const req = new NextRequest("http://localhost:9002/api/concierge/posts");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.posts).toHaveLength(1);
    expect(data.isApprover).toBe(false);
  });

  it("retorna posts do workspace vinculado para cliente aprovador", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      uid: "approver-456",
      email: "cliente@empresa.com",
    } as any);

    const approverUserData = {
      plan: "client_approver",
      conciergeRole: "client_approver",
      linkedWorkspaceId: "creator-123",
    };

    const approverUserDoc = {
      get: vi.fn().mockResolvedValue({
        exists: true,
        data: () => approverUserData,
      }),
      collection: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue([]),
      }),
    };

    const workspaceUserDoc = {
      get: vi.fn().mockResolvedValue({
        exists: true,
        data: () => ({ plan: "pro" }),
      }),
      collection: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue([
          {
            id: "post-99",
            data: () => ({
              text: "Post do criador",
              status: "pending_approval",
            }),
          },
        ]),
      }),
    };

    const docMock = vi.fn().mockImplementation((uid: string) => {
      if (uid === "approver-456") return approverUserDoc;
      if (uid === "creator-123") return workspaceUserDoc;
      return approverUserDoc;
    });

    (adminDb.collection as any).mockReturnValue({ doc: docMock });

    const req = new NextRequest("http://localhost:9002/api/concierge/posts");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.posts[0].id).toBe("post-99");
    expect(data.isApprover).toBe(true);
    expect(data.targetWorkspaceId).toBe("creator-123");
  });
});
