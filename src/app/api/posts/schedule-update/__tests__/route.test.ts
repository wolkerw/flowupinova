import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";
import { NextRequest } from "next/server";

vi.mock("@/lib/api-auth", () => ({
  getAuthenticatedUser: vi.fn(),
}));

const mockDocGet = vi.fn();
const mockDocUpdate = vi.fn().mockResolvedValue(undefined);

const mockDoc = vi.fn().mockReturnValue({
  get: mockDocGet,
  update: mockDocUpdate,
  collection: vi.fn().mockReturnValue({
    doc: vi.fn().mockReturnValue({
      get: mockDocGet,
      update: mockDocUpdate,
    }),
  }),
});

const mockCollection = vi.fn().mockReturnValue({
  doc: mockDoc,
});

vi.mock("@/lib/firebase-admin", () => ({
  adminDb: {
    collection: (...args: any[]) => mockCollection(...args),
  },
}));

vi.mock("firebase-admin/firestore", () => ({
  Timestamp: {
    now: vi.fn(() => ({ toMillis: () => Date.now() })),
    fromDate: vi.fn((date: Date) => ({ toDate: () => date, toMillis: () => date.getTime() })),
  },
}));

import { getAuthenticatedUser } from "@/lib/api-auth";

describe("API /api/posts/schedule-update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 401 para usuário não autenticado", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue(null);

    const req = new NextRequest("http://localhost:9002/api/posts/schedule-update", {
      method: "POST",
      body: JSON.stringify({ postId: "post-123" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("retorna 400 se postId não for informado", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      uid: "user-123",
      email: "teste@empresa.com",
    } as any);

    const req = new NextRequest("http://localhost:9002/api/posts/schedule-update", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("PostId é obrigatório");
  });

  it("retorna 404 se a publicação não existir no Firestore", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      uid: "user-123",
      email: "teste@empresa.com",
    } as any);

    mockDocGet.mockResolvedValueOnce({
      exists: false,
    });

    const req = new NextRequest("http://localhost:9002/api/posts/schedule-update", {
      method: "POST",
      body: JSON.stringify({ postId: "post-not-found" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it("retorna 400 se a data de agendamento for inválida", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      uid: "user-123",
      email: "teste@empresa.com",
    } as any);

    mockDocGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({ status: "scheduled" }),
    });

    const req = new NextRequest("http://localhost:9002/api/posts/schedule-update", {
      method: "POST",
      body: JSON.stringify({ postId: "post-123", scheduledAt: "data-invalida" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Data de agendamento inválida");
  });

  it("atualiza com sucesso data/hora e legenda da publicação agendada", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      uid: "user-123",
      email: "teste@empresa.com",
    } as any);

    mockDocGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({ status: "scheduled", text: "Legenda anterior" }),
    });

    const newDateStr = "2026-11-25T15:30:00.000Z";
    const req = new NextRequest("http://localhost:9002/api/posts/schedule-update", {
      method: "POST",
      body: JSON.stringify({
        postId: "post-123",
        scheduledAt: newDateStr,
        text: "Nova legenda atualizada pelo Planner!",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(mockDocUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "scheduled",
        text: "Nova legenda atualizada pelo Planner!",
      })
    );
  });
});
