import { describe, it, expect, vi, beforeEach } from "vitest";
import { PATCH } from "../route";
import { NextRequest } from "next/server";

vi.mock("@/lib/admin-auth", () => ({
  validateAdminToken: vi.fn(),
}));

vi.mock("@/lib/firebase-admin", () => {
  const mockUpdate = vi.fn().mockResolvedValue(undefined);
  const mockDoc = vi.fn().mockReturnValue({
    update: mockUpdate,
  });

  return {
    adminDb: {
      collection: vi.fn().mockReturnValue({
        doc: mockDoc,
      }),
    },
    adminAuth: {
      deleteUser: vi.fn().mockResolvedValue(undefined),
    },
    admin: {
      firestore: {
        Timestamp: {
          fromDate: vi.fn().mockReturnValue("mock-timestamp"),
        },
      },
    },
  };
});

import { validateAdminToken } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase-admin";

describe("PATCH /api/admin/users/[uid]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejeita requisição com 403 se o solicitante não for administrador", async () => {
    vi.mocked(validateAdminToken).mockResolvedValue(false as any);

    const req = new NextRequest("http://localhost:9002/api/admin/users/user-123", {
      method: "PATCH",
      body: JSON.stringify({ canEditImages: true }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ uid: "user-123" }) });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Acesso negado.");
  });

  it("atualiza a flag canEditImages com sucesso no Firestore", async () => {
    vi.mocked(validateAdminToken).mockResolvedValue({ email: "admin@numvapt.com.br" } as any);

    const mockUpdate = vi.fn().mockResolvedValue(undefined);
    const mockDoc = vi.fn().mockReturnValue({ update: mockUpdate });
    vi.mocked(adminDb.collection).mockReturnValue({ doc: mockDoc } as any);

    const req = new NextRequest("http://localhost:9002/api/admin/users/user-123", {
      method: "PATCH",
      body: JSON.stringify({ canEditImages: true }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ uid: "user-123" }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);

    expect(mockDoc).toHaveBeenCalledWith("user-123");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        canEditImages: true,
      })
    );
  });

  it("permite revogar a permissão canEditImages definindo como false", async () => {
    vi.mocked(validateAdminToken).mockResolvedValue({ email: "admin@numvapt.com.br" } as any);

    const mockUpdate = vi.fn().mockResolvedValue(undefined);
    const mockDoc = vi.fn().mockReturnValue({ update: mockUpdate });
    vi.mocked(adminDb.collection).mockReturnValue({ doc: mockDoc } as any);

    const req = new NextRequest("http://localhost:9002/api/admin/users/user-123", {
      method: "PATCH",
      body: JSON.stringify({ canEditImages: false }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ uid: "user-123" }) });
    expect(res.status).toBe(200);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        canEditImages: false,
      })
    );
  });
});
