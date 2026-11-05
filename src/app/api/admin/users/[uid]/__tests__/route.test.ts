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
          now: vi.fn().mockReturnValue("mock-timestamp"),
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

  it("atualiza o modo NumVapt Concierge ativando a flag isConcierge e managedService", async () => {
    vi.mocked(validateAdminToken).mockResolvedValue({ email: "admin@numvapt.com.br" } as any);

    const mockUpdate = vi.fn().mockResolvedValue(undefined);
    const mockDoc = vi.fn().mockReturnValue({ update: mockUpdate });
    vi.mocked(adminDb.collection).mockReturnValue({ doc: mockDoc } as any);

    const req = new NextRequest("http://localhost:9002/api/admin/users/user-123", {
      method: "PATCH",
      body: JSON.stringify({ isConcierge: true }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ uid: "user-123" }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);

    expect(mockDoc).toHaveBeenCalledWith("user-123");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        isConcierge: true,
        managedService: expect.objectContaining({
          enabled: true,
          serviceMode: "concierge",
          status: "active",
        }),
      })
    );
  });

  it("permite desativar o NumVapt Concierge definindo isConcierge como false", async () => {
    vi.mocked(validateAdminToken).mockResolvedValue({ email: "admin@numvapt.com.br" } as any);

    const mockUpdate = vi.fn().mockResolvedValue(undefined);
    const mockDoc = vi.fn().mockReturnValue({ update: mockUpdate });
    vi.mocked(adminDb.collection).mockReturnValue({ doc: mockDoc } as any);

    const req = new NextRequest("http://localhost:9002/api/admin/users/user-123", {
      method: "PATCH",
      body: JSON.stringify({ isConcierge: false }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ uid: "user-123" }) });
    expect(res.status).toBe(200);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        isConcierge: false,
        managedService: expect.objectContaining({
          enabled: false,
          serviceMode: "self_service",
          status: "disabled",
        }),
      })
    );
  });
  it("ativa o plano VIP de 7 dias com todas as funções liberadas via activateVip7d", async () => {
    vi.mocked(validateAdminToken).mockResolvedValue({ email: "admin@numvapt.com.br" } as any);

    const mockUpdate = vi.fn().mockResolvedValue(undefined);
    const mockDoc = vi.fn().mockReturnValue({ update: mockUpdate });
    vi.mocked(adminDb.collection).mockReturnValue({ doc: mockDoc } as any);

    const req = new NextRequest("http://localhost:9002/api/admin/users/user-vip-123", {
      method: "PATCH",
      body: JSON.stringify({ activateVip7d: true }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ uid: "user-vip-123" }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);

    expect(mockDoc).toHaveBeenCalledWith("user-vip-123");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        plan: "standard",
        role: "pro",
        subscriptionStatus: "active",
        paymentStatus: "active",
        subscriptionPlan: "trial_7d",
        canEditImages: true,
        isConcierge: true,
        managedService: expect.objectContaining({
          enabled: true,
          serviceMode: "concierge",
          status: "active",
        }),
        subscriptionExpiresAt: "mock-timestamp",
      })
    );
  });

  it("ativa o plano VIP de 7 dias com todas as funções liberadas via plan standard e subscriptionPlan trial_7d", async () => {
    vi.mocked(validateAdminToken).mockResolvedValue({ email: "admin@numvapt.com.br" } as any);

    const mockUpdate = vi.fn().mockResolvedValue(undefined);
    const mockDoc = vi.fn().mockReturnValue({ update: mockUpdate });
    vi.mocked(adminDb.collection).mockReturnValue({ doc: mockDoc } as any);

    const req = new NextRequest("http://localhost:9002/api/admin/users/user-vip-456", {
      method: "PATCH",
      body: JSON.stringify({ plan: "standard", subscriptionPlan: "trial_7d" }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ uid: "user-vip-456" }) });
    expect(res.status).toBe(200);

    expect(mockDoc).toHaveBeenCalledWith("user-vip-456");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        plan: "standard",
        role: "pro",
        subscriptionStatus: "active",
        paymentStatus: "active",
        subscriptionPlan: "trial_7d",
        canEditImages: true,
        isConcierge: true,
        managedService: expect.objectContaining({
          enabled: true,
          serviceMode: "concierge",
          status: "active",
        }),
        subscriptionExpiresAt: "mock-timestamp",
      })
    );
  });
});