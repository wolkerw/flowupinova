import { describe, it, expect, vi, beforeEach } from "vitest";
import { GamificationService } from "../gamification-service";
import * as firestore from "firebase/firestore";

vi.mock("@/lib/firebase", () => ({
  db: {},
}));

vi.mock("../firebase", () => ({
  db: {},
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn((_db, collection, id) => ({ path: `${collection}/${id}` })),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ seconds: 123456789, nanoseconds: 0 })),
  },
  runTransaction: vi.fn(),
}));

describe("GamificationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUserGamification", () => {
    it("deve retornar documento existente quando encontrado no Firestore", async () => {
      const mockData = {
        uid: "user-123",
        totalPoints: 1200,
        currentLevelId: "criador",
        missions: {},
        badges: [],
        weeklyPostCount: 2,
        lastPostDate: null,
        updatedAt: { seconds: 123, nanoseconds: 0 },
      };

      vi.mocked(firestore.getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => mockData,
      } as any);

      const result = await GamificationService.getUserGamification("user-123");
      expect(result).toEqual(mockData);
      expect(firestore.setDoc).not.toHaveBeenCalled();
    });

    it("deve criar documento padrão com nível iniciante quando não existir", async () => {
      vi.mocked(firestore.getDoc).mockResolvedValueOnce({
        exists: () => false,
      } as any);

      vi.mocked(firestore.setDoc).mockResolvedValueOnce(undefined as any);

      const result = await GamificationService.getUserGamification("new-user-456");

      expect(result.uid).toBe("new-user-456");
      expect(result.totalPoints).toBe(0);
      expect(result.currentLevelId).toBe("iniciante");
      expect(result.missions.onboarding_gmb).toBeDefined();
      expect(firestore.setDoc).toHaveBeenCalledWith(
        expect.objectContaining({ path: "gamification/new-user-456" }),
        expect.objectContaining({
          uid: "new-user-456",
          totalPoints: 0,
          currentLevelId: "iniciante",
        })
      );
    });
  });

  describe("addPoints", () => {
    it("deve adicionar pontos e atualizar nível quando cruzar o limite", async () => {
      const initialDoc = {
        uid: "user-123",
        totalPoints: 800,
        currentLevelId: "iniciante",
      };

      const mockTransaction = {
        get: vi.fn().mockResolvedValue({
          exists: () => true,
          data: () => initialDoc,
        }),
        update: vi.fn(),
      };

      vi.mocked(firestore.runTransaction).mockImplementationOnce(async (_db, callback) => {
        return callback(mockTransaction as any);
      });

      // Adicionando 300 pontos -> total 1100 -> nível 'criador'
      await GamificationService.addPoints("user-123", 300);

      expect(mockTransaction.update).toHaveBeenCalledWith(
        expect.objectContaining({ path: "gamification/user-123" }),
        expect.objectContaining({
          totalPoints: 1100,
          currentLevelId: "criador",
        })
      );
    });

    it("deve lançar erro se o documento não existir", async () => {
      const mockTransaction = {
        get: vi.fn().mockResolvedValue({
          exists: () => false,
        }),
        update: vi.fn(),
      };

      vi.mocked(firestore.runTransaction).mockImplementationOnce(async (_db, callback) => {
        return callback(mockTransaction as any);
      });

      await expect(GamificationService.addPoints("user-none", 100)).rejects.toThrow(
        "Gamification doc does not exist!"
      );
    });
  });

  describe("awardBadge", () => {
    it("deve conceder nova medalha se o usuário ainda não a possuir", async () => {
      const initialDoc = {
        uid: "user-123",
        badges: [],
      };

      const mockTransaction = {
        get: vi.fn().mockResolvedValue({
          exists: () => true,
          data: () => initialDoc,
        }),
        update: vi.fn(),
      };

      vi.mocked(firestore.runTransaction).mockImplementationOnce(async (_db, callback) => {
        return callback(mockTransaction as any);
      });

      await GamificationService.awardBadge("user-123", "vitrine_impecavel");

      expect(mockTransaction.update).toHaveBeenCalledWith(
        expect.objectContaining({ path: "gamification/user-123" }),
        expect.objectContaining({
          badges: [
            expect.objectContaining({
              badgeId: "vitrine_impecavel",
            }),
          ],
        })
      );
    });

    it("não deve duplicar medalha caso o usuário já a possua", async () => {
      const initialDoc = {
        uid: "user-123",
        badges: [{ badgeId: "vitrine_impecavel", earnedAt: {} }],
      };

      const mockTransaction = {
        get: vi.fn().mockResolvedValue({
          exists: () => true,
          data: () => initialDoc,
        }),
        update: vi.fn(),
      };

      vi.mocked(firestore.runTransaction).mockImplementationOnce(async (_db, callback) => {
        return callback(mockTransaction as any);
      });

      await GamificationService.awardBadge("user-123", "vitrine_impecavel");

      expect(mockTransaction.update).not.toHaveBeenCalled();
    });
  });
});
