import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as uploadGalleryPhoto } from "../upload-gallery-photo/route";
import { POST as uploadCover } from "../upload-cover/route";
import { POST as uploadLogo } from "../upload-logo/route";

vi.mock("@/lib/firebase-admin", () => {
  return {
    getUidFromCookie: vi.fn().mockResolvedValue("user-123"),
    admin: {
      storage: () => ({
        bucket: () => ({
          name: "test-bucket",
          file: (filename: string) => ({
            name: filename,
            save: vi.fn().mockResolvedValue(true),
          }),
        }),
      }),
    },
    adminDb: {
      collection: vi.fn((colName) => ({
        doc: vi.fn((docId) => ({
          collection: vi.fn((subCol) => ({
            doc: vi.fn((subDocId) => ({
              get: vi.fn().mockResolvedValue({
                exists: true,
                data: () =>
                  subDocId === "google"
                    ? { accountId: "acc-123" }
                    : { googleName: "locations/loc-456" },
              }),
            })),
          })),
        })),
      })),
    },
  };
});

vi.mock("@/lib/services/storage-utils-admin", () => ({
  getUserStoragePathAdmin: vi.fn().mockResolvedValue("users/user-123"),
}));

vi.mock("@/lib/services/google-service-admin", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    getAuthenticatedGoogleClient: vi.fn().mockResolvedValue({
      getAccessToken: vi.fn().mockResolvedValue({ token: "fake-google-token" }),
    }),
  };
});

function createFakeFile(name: string, type: string): File {
  const file = new File([new Uint8Array([1, 2, 3])], name, { type });
  (file as any).arrayBuffer = async () => new Uint8Array([1, 2, 3]).buffer;
  return file;
}

function createMultipartRequest(url: string, formData: FormData): NextRequest {
  const req = new NextRequest(url, {
    method: "POST",
  });
  req.formData = async () => formData;
  return req;
}

describe("Google Media Upload Routes (Direct Storage Upload)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockImplementation((url) => {
      const urlStr = String(url);
      if (urlStr.includes("mybusiness.googleapis.com")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ name: "media/media-123", mediaFormat: "PHOTO" }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => [{ url_post: "https://fallback.com/photo.jpg" }],
      });
    });
  });

  it("uploadGalleryPhoto deve salvar foto via Storage e cadastrar no Google Meu Negócio", async () => {
    const formData = new FormData();
    const fakeFile = createFakeFile("galeria.jpg", "image/jpeg");
    formData.append("file", fakeFile);

    const req = createMultipartRequest("http://localhost/api/google/upload-gallery-photo", formData);

    const res = await uploadGalleryPhoto(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.name).toBe("media/media-123");
  });

  it("uploadCover deve salvar foto de capa via Storage e cadastrar no Google Meu Negócio", async () => {
    const formData = new FormData();
    const fakeFile = createFakeFile("capa.jpg", "image/jpeg");
    formData.append("file", fakeFile);

    const req = createMultipartRequest("http://localhost/api/google/upload-cover", formData);

    const res = await uploadCover(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it("uploadLogo deve salvar foto do logotipo via Storage e cadastrar no Google Meu Negócio", async () => {
    const formData = new FormData();
    const fakeFile = createFakeFile("logo.png", "image/png");
    formData.append("file", fakeFile);

    const req = createMultipartRequest("http://localhost/api/google/upload-logo", formData);

    const res = await uploadLogo(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it("retorna erro 400 se nenhum arquivo for enviado", async () => {
    const formData = new FormData();
    const req = createMultipartRequest("http://localhost/api/google/upload-logo", formData);

    const res = await uploadLogo(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
  });
});
