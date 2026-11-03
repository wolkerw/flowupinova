import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSet, mockSave } = vi.hoisted(() => {
  const mockSet = vi.fn().mockResolvedValue(true);
  const mockSave = vi.fn().mockResolvedValue(true);
  return { mockSet, mockSave };
});

vi.mock("@/lib/firebase-admin", () => ({
  admin: {
    storage: () => ({
      bucket: () => ({
        name: "test-bucket",
        file: (name: string) => ({
          name,
          save: mockSave,
        }),
      }),
    }),
    firestore: {
      FieldValue: {
        serverTimestamp: () => "mock_timestamp",
      },
    },
  },
  adminDb: {
    doc: vi.fn().mockReturnValue({
      set: mockSet,
    }),
    collection: vi.fn().mockReturnValue({
      doc: vi.fn().mockReturnValue({
        collection: vi.fn().mockReturnValue({
          doc: vi.fn().mockReturnValue({
            set: mockSet,
          }),
        }),
      }),
    }),
  },
}));

import { POST } from "../route";

vi.mock("@/lib/api-auth", () => ({
  getAuthenticatedUser: vi.fn().mockResolvedValue({
    uid: "test-user-mockup-generator",
    email: "cliente@numvapt.com",
  }),
}));

global.fetch = vi.fn().mockImplementation(async (url: string) => {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      candidates: [
        {
          content: {
            parts: [{ inlineData: { data: "fake_gemini_multimodal_mockup_bytes" } }],
          },
        },
      ],
    }),
  } as any;
});

describe("POST /api/brand-studio/mockup/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna erro 400 se brandName estiver ausente", async () => {
    const req = new Request("http://localhost/api/brand-studio/mockup/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("O nome da marca é obrigatório para gerar o mockup.");
  });

  it("gera mockup de xícara/caneca com resolução 0.5K (512x512)", async () => {
    const req = new Request("http://localhost/api/brand-studio/mockup/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandName: "NumVapt Inovação",
        mockupType: "mug",
        mockupColor: "brand",
        primaryColor: "#0083C7",
        secondaryColor: "#FA6305",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.imageUrl).toBeDefined();
    expect(data.mockupType).toBe("mug");
    expect(data.resolution).toBe("512x512");
  });

  it("gera mockup usando a logomarca real fornecida pelo usuário", async () => {
    const fakeLogoBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    const req = new Request("http://localhost/api/brand-studio/mockup/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandName: "NumVapt Oficial",
        mockupType: "polo",
        mockupColor: "brand",
        logoUrl: fakeLogoBase64,
        primaryColor: "#0083C7",
        secondaryColor: "#FA6305",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.imageUrl).toBeDefined();
    expect(data.mockupType).toBe("polo");
    expect(data.resolution).toBe("512x512");
  });

  it("gera mockup de frota comercial com sucesso", async () => {
    const req = new Request("http://localhost/api/brand-studio/mockup/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandName: "NumVapt Logística",
        mockupType: "fleet",
        mockupColor: "light",
        primaryColor: "#0083C7",
        secondaryColor: "#FA6305",
        phone: "(11) 98765-4321",
        website: "www.numvapt.com.br",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.imageUrl).toBeDefined();
    expect(data.mockupType).toBe("fleet");
    expect(data.resolution).toBe("512x512");
  });

  it("salva persistentemente o mockup gerado no Cloud Storage e Firestore", async () => {
    const req = new Request("http://localhost/api/brand-studio/mockup/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandName: "NumVapt Nuvem",
        mockupType: "mug",
        mockupColor: "brand",
        primaryColor: "#0083C7",
        secondaryColor: "#FA6305",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.savedToCloud).toBe(true);
    expect(mockSave).toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalled();
  });
});
