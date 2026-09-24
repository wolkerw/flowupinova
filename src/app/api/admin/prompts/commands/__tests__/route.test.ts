import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../route";

const mockAdminUser = {
  uid: "admin-123",
  email: "admin@numvapt.com.br",
  name: "Admin User",
};

vi.mock("@/lib/admin-auth", () => ({
  requireAdminAccess: vi.fn(async () => mockAdminUser),
}));

// Mock em memória para a coleção ai_style_commands do Firestore
let mockDbStore: Record<string, any> = {};

vi.mock("@/lib/firebase-admin", () => ({
  adminDb: {
    collection: vi.fn((colName: string) => {
      if (colName !== "ai_style_commands") {
        return {
          doc: vi.fn(() => ({ get: vi.fn().mockResolvedValue({ exists: false }) })),
        };
      }

      return {
        doc: vi.fn((docId: string) => ({
          get: vi.fn(async () => {
            const data = mockDbStore[docId];
            return {
              exists: !!data,
              data: () => data,
              id: docId,
            };
          }),
          set: vi.fn(async (data: any, options?: any) => {
            if (options?.merge && mockDbStore[docId]) {
              mockDbStore[docId] = { ...mockDbStore[docId], ...data };
            } else {
              mockDbStore[docId] = data;
            }
            return Promise.resolve();
          }),
        })),
        where: vi.fn((field: string, op: string, value: any) => ({
          get: vi.fn(async () => {
            const matches = Object.entries(mockDbStore)
              .filter(([_, item]) => {
                if (op === "==") return item[field] === value;
                return false;
              })
              .map(([id, item]) => ({
                id,
                data: () => item,
              }));

            return {
              empty: matches.length === 0,
              docs: matches,
            };
          }),
        })),
      };
    }),
  },
}));

describe("POST /api/admin/prompts/commands - Proteção Anti-Duplicidade", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbStore = {
      cmd_bokeh: {
        id: "cmd_bokeh",
        command: "/bokeh",
        label: "Luzes Desfocadas (Bokeh)",
        promptInjection: "cinematic shallow depth of field, creamy bokeh",
        active: true,
      },
      cmd_cyberpunk: {
        id: "cmd_cyberpunk",
        command: "/cyberpunk",
        label: "Cyberpunk Neon",
        promptInjection: "cyberpunk aesthetic, vibrant neon lights",
        active: true,
      },
    };
  });

  it("deve rejeitar com 409 se tentar criar um novo comando com código já existente (/bokeh)", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/prompts/commands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        command: "/bokeh",
        label: "Tentativa Duplicada de Bokeh",
        promptInjection: "qualquer prompt de teste",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toMatch(/já está cadastrado no sistema/i);
  });

  it("deve rejeitar com 409 se tentar criar com o mesmo código sem barra ou em maiúsculas (BOKEH)", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/prompts/commands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        command: "BOKEH",
        label: "Tentativa Sem Barra e Maiúsculo",
        promptInjection: "qualquer prompt de teste",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toMatch(/já está cadastrado no sistema/i);
  });

  it("deve rejeitar com 409 na edição se o novo código colidir com outro comando já existente", async () => {
    // Editando cmd_cyberpunk para usar /bokeh (que pertence a cmd_bokeh)
    const req = new NextRequest("http://localhost:3000/api/admin/prompts/commands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: "cmd_cyberpunk",
        command: "/bokeh",
        label: "Tentando Mudar Cyberpunk para Bokeh",
        promptInjection: "prompt",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toMatch(/já pertence ao estilo/i);
  });

  it("deve permitir salvar edição do próprio comando quando o código não colide com terceiros", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/prompts/commands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: "cmd_bokeh",
        command: "/bokeh",
        label: "Luzes Desfocadas Atualizadas",
        promptInjection: "novo prompt atualizado",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.item.label).toBe("Luzes Desfocadas Atualizadas");
  });

  it("deve permitir criar um novo comando com código inédito (/golden-hour)", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/prompts/commands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        command: "/golden-hour",
        label: "Golden Hour Solar",
        promptInjection: "warm sunset golden hour natural light",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.item.command).toBe("/golden-hour");
    expect(mockDbStore["cmd_golden-hour"]).toBeDefined();
  });
});
