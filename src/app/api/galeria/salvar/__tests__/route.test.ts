import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { mockAdd, mockSave } = vi.hoisted(() => {
  const mockAdd = vi.fn().mockResolvedValue({ id: "gallery_doc_123" });
  const mockSave = vi.fn().mockResolvedValue(true);
  return { mockAdd, mockSave };
});

vi.mock("@/lib/api-auth", () => ({
  getAuthenticatedUser: vi.fn().mockResolvedValue({ uid: "user_test_123" }),
}));

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
    collection: vi.fn().mockReturnValue({
      doc: vi.fn().mockReturnValue({
        collection: vi.fn().mockReturnValue({
          add: mockAdd,
        }),
      }),
    }),
  },
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

describe("POST /api/galeria/salvar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("salva mídia via FormData com arquivo físico e grava no mediaGallery", async () => {
    const formData = new FormData();
    const blob = new Blob(["fake image binary"], { type: "image/jpeg" });
    (blob as any).name = "minha_foto.jpg";
    (blob as any).arrayBuffer = async () => Buffer.from("fake image binary");
    formData.append("file", blob, "minha_foto.jpg");
    formData.append("caption", "Legenda da arte");
    formData.append("type", "image");

    const req = createMultipartRequest("http://localhost:9002/api/galeria/salvar", formData);

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.galleryId).toBe("gallery_doc_123");
    expect(data.url).toContain("https://firebasestorage.googleapis.com");
    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(mockAdd).toHaveBeenCalledTimes(1);
  });

  it("salva mídia via JSON com fileBase64 e grava no mediaGallery", async () => {
    const body = {
      fileBase64: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
      caption: "Arte em base64",
      type: "image",
      source: "manual_editor",
    };

    const req = new NextRequest("http://localhost:9002/api/galeria/salvar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.galleryId).toBe("gallery_doc_123");
    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(mockAdd).toHaveBeenCalledTimes(1);
  });

  it("retorna erro 400 se nenhum dado de mídia for fornecido", async () => {
    const req = new NextRequest("http://localhost:9002/api/galeria/salvar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain("Nenhum arquivo ou URL válida");
  });
});
