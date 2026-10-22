import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockAddDoc, MockTimestamp } = vi.hoisted(() => {
  const mockAddDoc = vi.fn().mockImplementation((colRef, data) => {
    return Promise.resolve({ id: `doc_${Date.now()}` });
  });

  class MockTimestamp {
    static now() {
      return new MockTimestamp();
    }
    static fromDate(date: Date) {
      return new MockTimestamp();
    }
    toMillis() {
      return Date.now();
    }
  }

  return { mockAddDoc, MockTimestamp };
});

vi.mock("@/lib/firebase", () => ({
  db: {
    app: {},
  },
  storage: {
    app: {},
  },
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn((db, ...pathSegments) => ({
    path: pathSegments.join("/"),
  })),
  addDoc: (...args: any[]) => mockAddDoc(...args),
  doc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteField: vi.fn(),
  serverTimestamp: vi.fn(() => "mock-server-timestamp"),
  Timestamp: MockTimestamp,
}));

vi.mock("firebase/storage", () => ({
  ref: vi.fn((storage, path) => ({ path })),
  uploadBytesResumable: vi.fn(() => ({
    on: (evt: string, progress: any, err: any, complete: any) => {
      complete?.();
    },
  })),
  getDownloadURL: vi.fn().mockResolvedValue("https://storage.googleapis.com/test-bucket/uploaded.jpg"),
}));

import { saveMediaToGallery, sendPostToApproval } from "../posts-service";

describe("saveMediaToGallery e sendPostToApproval", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("saveMediaToGallery", () => {
    it("retorna erro quando o userId não é fornecido", async () => {
      const res = await saveMediaToGallery("", {
        publicUrl: "https://example.com/art.jpg",
      });
      expect(res.success).toBe(false);
      expect(res.error).toContain("UserID é obrigatório");
    });

    it("salva mídia com URL pública diretamente na subcoleção mediaGallery", async () => {
      const res = await saveMediaToGallery("user_123", {
        publicUrl: "https://example.com/edited_art.jpg",
        caption: "Minha legenda de teste",
        type: "image",
        source: "manual_editor",
        fileName: "edited_art.jpg",
      });

      expect(res.success).toBe(true);
      expect(res.galleryId).toBeDefined();
      expect(res.url).toBe("https://example.com/edited_art.jpg");

      expect(mockAddDoc).toHaveBeenCalledTimes(1);
      const [colRef, docData] = mockAddDoc.mock.calls[0];
      expect(colRef.path).toBe("users/user_123/mediaGallery");
      expect(docData.url).toBe("https://example.com/edited_art.jpg");
      expect(docData.caption).toBe("Minha legenda de teste");
      expect(docData.usedInPostId).toBeNull();
      expect(docData.isPublished).toBe(false);
      expect(docData.source).toBe("manual_editor");
    });
  });

  describe("sendPostToApproval", () => {
    it("retorna erro quando nenhuma mídia é enviada", async () => {
      const res = await sendPostToApproval("user_123", {
        text: "Legenda de teste",
        media: [],
        platforms: ["instagram"],
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain("Ao menos uma mídia é necessária");
    });

    it("cria o post com status pending_approval e registra na galeria", async () => {
      const res = await sendPostToApproval("user_123", {
        text: "Post para aprovação do cliente",
        media: [
          {
            publicUrl: "https://example.com/branded_post.jpg",
            type: "image",
          },
        ],
        platforms: ["instagram", "facebook"],
        requestedBy: "socialmedia@empresa.com",
      });

      expect(res.success).toBe(true);
      expect(res.postId).toBeDefined();

      // Deve chamar mockAddDoc para a coleção posts e depois para mediaGallery
      expect(mockAddDoc).toHaveBeenCalledTimes(2);

      const [postColRef, postData] = mockAddDoc.mock.calls[0];
      expect(postColRef.path).toBe("users/user_123/posts");
      expect(postData.status).toBe("pending_approval");
      expect(postData.approval.status).toBe("pending");
      expect(postData.approval.requestedBy).toBe("socialmedia@empresa.com");
      expect(postData.imageUrl).toBe("https://example.com/branded_post.jpg");
      expect(postData.platforms).toEqual(["instagram", "facebook"]);

      const [galleryColRef, galleryData] = mockAddDoc.mock.calls[1];
      expect(galleryColRef.path).toBe("users/user_123/mediaGallery");
      expect(galleryData.url).toBe("https://example.com/branded_post.jpg");
      expect(galleryData.source).toBe("manual_approval");
      expect(galleryData.usedInPostId).toBe(res.postId);
    });
  });
});
