import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { mockFetch } = vi.hoisted(() => {
  const mockFetch = vi.fn();
  return { mockFetch };
});

vi.mock("@/lib/api-auth", () => ({
  getAuthenticatedUser: vi.fn().mockResolvedValue({ uid: "user_123", email: "teste@numvapt.com.br" }),
}));

vi.mock("@/lib/firebase-admin", () => {
  const firestoreFn: any = () => ({
    collection: () => ({
      doc: () => ({
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({ plan: "pro" }),
        }),
        collection: () => ({
          doc: () => ({
            set: vi.fn().mockResolvedValue(true),
          }),
        }),
      }),
    }),
  });
  firestoreFn.FieldValue = {
    serverTimestamp: () => "mock_timestamp",
  };

  return {
    admin: {
      storage: () => ({
        bucket: () => ({
          name: "test-bucket",
          file: (name: string) => ({
            name,
            save: vi.fn().mockResolvedValue(true),
          }),
        }),
      }),
      firestore: firestoreFn,
    },
    adminDb: {
      collection: () => ({
        doc: () => ({
          get: vi.fn().mockResolvedValue({
            exists: true,
            data: () => ({ plan: "pro" }),
          }),
          collection: () => ({
            doc: () => ({
              set: vi.fn().mockResolvedValue(true),
            }),
          }),
        }),
      }),
    },
  };
});

vi.mock("@/lib/services/storage-utils-admin", () => ({
  getUserStoragePathAdmin: vi.fn().mockResolvedValue("users/test-user"),
}));

vi.mock("@/lib/services/api-usage-service-admin", () => ({
  logApiUsage: vi.fn(),
}));

vi.mock("@/lib/services/global-settings-service", () => ({
  getGlobalSettings: vi.fn().mockResolvedValue({
    generateAvatarWebhook: "https://webhook.flowupinova.com.br/webhook/gerador_avatar_twin",
    serverTimeout: 120,
  }),
}));

import { POST } from "../route";

function createMultipartRequest(url: string, formData: FormData): NextRequest {
  const req = new NextRequest(url, {
    method: "POST",
    headers: {
      "content-type": "multipart/form-data; boundary=fake-boundary",
    },
  });
  req.formData = async () => formData;
  return req;
}

describe("POST /api/avatar/generate (/identylock)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
  });

  it("envia a diretriz /identylock no payload para o webhook de avatar", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ imageUrl: "https://storage.googleapis.com/test-avatar.jpg" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => Buffer.from("fake generated image binary"),
      });

    const formData = new FormData();
    formData.append("prompt", "em um escritório moderno com terno azul");
    formData.append("userId", "user_123");

    const fakeFile = {
      name: "selfie.jpg",
      type: "image/jpeg",
      arrayBuffer: async () => Buffer.from("fake selfie"),
    };

    const req = createMultipartRequest("http://localhost:9002/api/avatar/generate", formData);
    req.formData = async () =>
      ({
        get: (key: string) => {
          if (key === "file") return fakeFile as any;
          return formData.get(key);
        },
      }) as any;

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.url).toContain("https://firebasestorage.googleapis.com");

    expect(mockFetch).toHaveBeenCalledTimes(2);
    const [calledUrl, calledOptions] = mockFetch.mock.calls[0];
    expect(calledUrl).toBe("https://webhook.flowupinova.com.br/webhook/gerador_avatar_twin");

    const bodySent = JSON.parse(calledOptions.body);
    expect(bodySent.identylock).toBe(true);
    expect(bodySent.userPrompt).toContain("/identylock");
  });

  it("retorna erro 400 se a selfie não for fornecida", async () => {
    const formData = new FormData();
    formData.append("prompt", "foto corporativa");
    formData.append("userId", "user_123");

    const req = createMultipartRequest("http://localhost:9002/api/avatar/generate", formData);

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("selfie de referência ausente");
  });
});
