import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  approvePostByClient,
  requestPostChangesByClient,
  resubmitPostByCreator,
  updatePostImageByCreator,
  updatePostTextByCreator,
  scheduleApprovedPostByCreator,
} from "../posts-service";
import * as firestore from "firebase/firestore";

vi.mock("@/lib/firebase", () => ({
  db: {},
  storage: {},
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn((_db, ...parts) => ({ path: parts.join("/") })),
  updateDoc: vi.fn(),
  collection: vi.fn(),
  addDoc: vi.fn(),
  Timestamp: {
    now: vi.fn().mockReturnValue("mock-timestamp-now"),
  },
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
  serverTimestamp: vi.fn(),
  deleteField: vi.fn(),
}));

describe("Posts Service — Aprovação e Revisão pelo Cliente", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve aprovar post pelo cliente atualizando o status para approved (sem agendar automaticamente)", async () => {
    vi.mocked(firestore.updateDoc).mockResolvedValueOnce(undefined as any);

    await approvePostByClient("user-123", "post-456");

    expect(firestore.doc).toHaveBeenCalledWith(expect.anything(), "users", "user-123", "posts", "post-456");
    expect(firestore.updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        status: "approved",
        "approval.status": "approved",
        "approval.reviewedAt": "mock-timestamp-now",
      })
    );
  });

  it("deve agendar post aprovado pelo criador/social media (scheduleApprovedPostByCreator)", async () => {
    vi.mocked(firestore.updateDoc).mockResolvedValueOnce(undefined as any);

    await scheduleApprovedPostByCreator("user-123", "post-456");

    expect(firestore.doc).toHaveBeenCalledWith(expect.anything(), "users", "user-123", "posts", "post-456");
    expect(firestore.updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        status: "scheduled",
      })
    );
  });

  it("deve lançar erro ao tentar aprovar post sem userId ou postId", async () => {
    await expect(approvePostByClient("", "post-456")).rejects.toThrow(
      "UserID e PostID são obrigatórios para aprovar a publicação."
    );
    await expect(approvePostByClient("user-123", "")).rejects.toThrow(
      "UserID e PostID são obrigatórios para aprovar a publicação."
    );
  });

  it("deve registrar solicitação de ajustes pelo cliente com as notas de revisão", async () => {
    vi.mocked(firestore.updateDoc).mockResolvedValueOnce(undefined as any);

    await requestPostChangesByClient("user-123", "post-456", "Favor alterar a foto principal e o preço para R$ 99.");

    expect(firestore.doc).toHaveBeenCalledWith(expect.anything(), "users", "user-123", "posts", "post-456");
    expect(firestore.updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        status: "changes_requested",
        "approval.status": "changes_requested",
        "approval.reviewNotes": "Favor alterar a foto principal e o preço para R$ 99.",
        "approval.reviewedAt": "mock-timestamp-now",
      })
    );
  });

  it("deve lançar erro ao tentar solicitar ajustes sem parâmetros obrigatórios", async () => {
    await expect(requestPostChangesByClient("", "post-456", "ajuste")).rejects.toThrow(
      "UserID e PostID são obrigatórios para solicitar ajustes."
    );
    await expect(requestPostChangesByClient("user-123", "", "ajuste")).rejects.toThrow(
      "UserID e PostID são obrigatórios para solicitar ajustes."
    );
  });

  it("deve reenviar postagem para aprovação pelo criador (resubmitPostByCreator)", async () => {
    vi.mocked(firestore.updateDoc).mockResolvedValueOnce(undefined as any);

    await resubmitPostByCreator("user-123", "post-456");

    expect(firestore.doc).toHaveBeenCalledWith(expect.anything(), "users", "user-123", "posts", "post-456");
    expect(firestore.updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        status: "pending_approval",
        "approval.status": "pending",
        "approval.resubmittedAt": "mock-timestamp-now",
      })
    );
  });

  it("deve atualizar imagem da postagem pelo criador (updatePostImageByCreator)", async () => {
    vi.mocked(firestore.updateDoc).mockResolvedValueOnce(undefined as any);

    await updatePostImageByCreator("user-123", "post-456", "https://new-edited.jpg");

    expect(firestore.doc).toHaveBeenCalledWith(expect.anything(), "users", "user-123", "posts", "post-456");
    expect(firestore.updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        imageUrl: "https://new-edited.jpg",
        imageUrls: ["https://new-edited.jpg"],
      })
    );
  });

  it("deve reenviar postagem com nova legenda (resubmitPostByCreator com newText)", async () => {
    vi.mocked(firestore.updateDoc).mockResolvedValueOnce(undefined as any);

    await resubmitPostByCreator("user-123", "post-456", undefined, "Legenda original preservada");

    expect(firestore.doc).toHaveBeenCalledWith(expect.anything(), "users", "user-123", "posts", "post-456");
    expect(firestore.updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        status: "pending_approval",
        text: "Legenda original preservada",
        caption: "Legenda original preservada",
        "approval.status": "pending",
        "approval.resubmittedAt": "mock-timestamp-now",
      })
    );
  });

  it("deve atualizar texto/legenda da postagem pelo criador (updatePostTextByCreator)", async () => {
    vi.mocked(firestore.updateDoc).mockResolvedValueOnce(undefined as any);

    await updatePostTextByCreator("user-123", "post-456", "Nova legenda incrível");

    expect(firestore.doc).toHaveBeenCalledWith(expect.anything(), "users", "user-123", "posts", "post-456");
    expect(firestore.updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        text: "Nova legenda incrível",
        caption: "Nova legenda incrível",
      })
    );
  });
});
