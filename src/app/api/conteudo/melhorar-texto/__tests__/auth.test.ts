import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/firebase-admin", () => ({
  verifyIdToken: vi.fn(async () => {
    throw new Error("invalid token");
  }),
  adminAuth: { verifyIdToken: vi.fn() },
  adminDb: {},
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));

import { POST } from "../../melhorar-texto/route";

describe("API /api/conteudo/melhorar-texto - autenticação", () => {
  it("retorna 401 quando não há token de autenticação", async () => {
    const req = new NextRequest("http://localhost/api/conteudo/melhorar-texto", {
      method: "POST",
      body: JSON.stringify({ textoOriginal: "teste" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("retorna 401 quando o token é forjado/inválido", async () => {
    const req = new NextRequest("http://localhost/api/conteudo/melhorar-texto", {
      method: "POST",
      headers: { Authorization: "Bearer eyJhbGciOiJub25lIn0.eyJlbWFpbCI6ImFkbWluQHguY29tIn0." },
      body: JSON.stringify({ textoOriginal: "teste" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});
