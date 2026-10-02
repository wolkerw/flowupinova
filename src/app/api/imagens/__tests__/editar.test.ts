import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../editar/route";
import { NextRequest } from "next/server";

vi.mock("@/lib/api-auth", () => ({
  getAuthenticatedUser: vi.fn(),
}));

let mockUserData: any = {
  canEditImages: true,
  role: "user",
};

vi.mock("@/lib/firebase-admin", () => {
  const mockSet = vi.fn().mockResolvedValue(undefined);
  const mockDoc = {
    set: mockSet,
    get: vi.fn().mockImplementation(() =>
      Promise.resolve({
        exists: true,
        data: () => mockUserData,
      })
    ),
  };

  return {
    admin: {
      storage: () => ({
        bucket: () => ({
          name: "test-bucket",
          file: () => ({
            save: vi.fn().mockResolvedValue(undefined),
          }),
        }),
      }),
    },
    adminDb: {
      doc: vi.fn(() => mockDoc),
      collection: vi.fn(() => ({
        doc: vi.fn(() => mockDoc),
      })),
    },
  };
});

vi.mock("@/lib/services/storage-utils-admin", () => ({
  getUserStoragePathAdmin: vi.fn().mockReturnValue("users/test-user-123"),
}));

vi.mock("@/lib/services/api-usage-service-admin", () => ({
  logApiUsage: vi.fn().mockResolvedValue(undefined),
}));

describe("POST /api/imagens/editar (GPT-image-2.5 Edition)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, OPENAI_API_KEY: "mock-openai-key" };
    mockUserData = {
      canEditImages: true,
      role: "user",
    };
  });

  it("deve retornar 401 se o usuário não estiver autenticado", async () => {
    const { getAuthenticatedUser } = await import("@/lib/api-auth");
    (getAuthenticatedUser as any).mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost:9002/api/imagens/editar", {
      method: "POST",
      body: JSON.stringify({
        imageUrl: "https://example.com/original.png",
        instruction: "Mudar o título",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("deve retornar 403 se o usuário NÃO tiver permissão canEditImages no Firestore", async () => {
    const { getAuthenticatedUser } = await import("@/lib/api-auth");
    (getAuthenticatedUser as any).mockResolvedValueOnce({
      uid: "user-bloqueado-123",
      email: "bloqueado@numvapt.com.br",
    });

    mockUserData = {
      canEditImages: false,
      role: "user",
    };

    const req = new NextRequest("http://localhost:9002/api/imagens/editar", {
      method: "POST",
      body: JSON.stringify({
        imageUrl: "https://example.com/original.png",
        instruction: "Mudar título",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.code).toBe("FEATURE_NOT_ENABLED");
  });

  it("deve retornar 400 se faltar imageUrl ou instruction", async () => {
    const { getAuthenticatedUser } = await import("@/lib/api-auth");
    (getAuthenticatedUser as any).mockResolvedValueOnce({
      uid: "user-123",
      email: "user@numvapt.com.br",
    });

    const req = new NextRequest("http://localhost:9002/api/imagens/editar", {
      method: "POST",
      body: JSON.stringify({
        imageUrl: "",
        instruction: "",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("deve processar e editar a imagem com sucesso quando autorizado", async () => {
    const { getAuthenticatedUser } = await import("@/lib/api-auth");
    (getAuthenticatedUser as any).mockResolvedValueOnce({
      uid: "user-autorizado-123",
      email: "autorizado@numvapt.com.br",
    });

    mockUserData = {
      canEditImages: true,
      role: "user",
    };

    // Mock do fetch: primeiro para baixar a imagem original, segundo para a OpenAI
    const fakeImageBuffer = Buffer.from("fake-image-bytes");
    const fakeEditedB64 = Buffer.from("edited-result-bytes").toString("base64");

    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === "https://example.com/original.png") {
        return Promise.resolve({
          ok: true,
          status: 200,
          arrayBuffer: () => Promise.resolve(fakeImageBuffer.buffer),
        });
      }
      if (url.includes("api.openai.com/v1/images/edits")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              data: [
                {
                  b64_json: fakeEditedB64,
                },
              ],
            }),
        });
      }
      return Promise.reject(new Error("URL desconhecida"));
    });

    global.fetch = fetchMock;

    const req = new NextRequest("http://localhost:9002/api/imagens/editar", {
      method: "POST",
      body: JSON.stringify({
        imageUrl: "https://example.com/original.png",
        instruction: "Altere o título para '5 Dicas de Gestão Financeira'",
        format: "portrait",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.url).toContain("firebasestorage.googleapis.com");
    expect(json.originalUrl).toBe("https://example.com/original.png");
    expect(json.modelUsed).toContain("gpt-image-2.5");
  });

  it("deve permitir edição quando o usuário for admin, mesmo sem flag explícita", async () => {
    const { getAuthenticatedUser } = await import("@/lib/api-auth");
    (getAuthenticatedUser as any).mockResolvedValueOnce({
      uid: "admin-user-123",
      email: "admin@numvapt.com.br",
    });

    mockUserData = {
      canEditImages: false,
      role: "admin",
    };

    const fakeImageBuffer = Buffer.from("fake-image-bytes");
    const fakeEditedB64 = Buffer.from("edited-result-bytes").toString("base64");

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === "https://example.com/original.png") {
        return Promise.resolve({
          ok: true,
          status: 200,
          arrayBuffer: () => Promise.resolve(fakeImageBuffer.buffer),
        });
      }
      if (url.includes("api.openai.com/v1/images/edits")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              data: [{ b64_json: fakeEditedB64 }],
            }),
        });
      }
      return Promise.reject(new Error("URL desconhecida"));
    });

    const req = new NextRequest("http://localhost:9002/api/imagens/editar", {
      method: "POST",
      body: JSON.stringify({
        imageUrl: "https://example.com/original.png",
        instruction: "Corrigir texto do infográfico",
        format: "square",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it("deve processar com sucesso a edição com selectedArea e máscara de inpainting", async () => {
    const { getAuthenticatedUser } = await import("@/lib/api-auth");
    (getAuthenticatedUser as any).mockResolvedValueOnce({
      uid: "user-area-123",
      email: "area@numvapt.com.br",
    });

    mockUserData = {
      canEditImages: true,
      role: "user",
    };

    const fakeImageBuffer = Buffer.from("fake-image-bytes");
    const fakeEditedB64 = Buffer.from("edited-area-bytes").toString("base64");

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === "https://example.com/original.png") {
        return Promise.resolve({
          ok: true,
          status: 200,
          arrayBuffer: () => Promise.resolve(fakeImageBuffer.buffer),
        });
      }
      if (url.includes("api.openai.com/v1/images/edits")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              data: [{ b64_json: fakeEditedB64 }],
            }),
        });
      }
      return Promise.reject(new Error("URL desconhecida"));
    });

    const fakeMaskBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    const req = new NextRequest("http://localhost:9002/api/imagens/editar", {
      method: "POST",
      body: JSON.stringify({
        imageUrl: "https://example.com/original.png",
        instruction: "Apagar elemento na área selecionada",
        format: "portrait",
        selectedArea: {
          x: 10,
          y: 15,
          width: 30,
          height: 20,
          action: "erase",
          description: "canto superior esquerdo",
        },
        maskDataUrl: fakeMaskBase64,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});
