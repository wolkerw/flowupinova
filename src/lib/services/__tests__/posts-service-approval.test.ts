import { describe, it, expect, vi, beforeEach } from "vitest";
import { approvePostByClient, requestPostChangesByClient } from "../posts-service";
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

  it("deve aprovar post pelo cliente atualizando o status para scheduled e status de aprovação para approved", async () => {
    vi.mocked(firestore.updateDoc).mockResolvedValueOnce(undefined as any);

    await approvePostByClient("user-123", "post-456");

    expect(firestore.doc).toHaveBeenCalledWith(expect.anything(), "users", "user-123", "posts", "post-456");
    expect(firestore.updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        status: "scheduled",
        "approval.status": "approved",
        "approval.reviewedAt": "mock-timestamp-now",
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
});
