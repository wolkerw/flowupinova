import { db } from "../firebase";
import { doc, getDoc, setDoc, updateDoc, Timestamp, increment, runTransaction } from "firebase/firestore";
import { 
  UserGamificationDoc, 
  GAMIFICATION_LEVELS, 
  GamificationLevelId,
  EarnedBadge
} from "../types/gamification";

const COLLECTION_NAME = "gamification";

const DEFAULT_GAMIFICATION: Omit<UserGamificationDoc, "uid"> = {
  totalPoints: 0,
  currentLevelId: "iniciante",
  missions: {
    onboarding_gmb: { missionId: "onboarding_gmb", isCompleted: false, progress: 0, target: 1 },
    explorer_flows: { missionId: "explorer_flows", isCompleted: false, progress: 0, target: 4, metadata: { flowsUsed: [] } },
    consistency_weekly: { missionId: "consistency_weekly", isCompleted: false, progress: 0, target: 3 },
    opportunity_holiday: { missionId: "opportunity_holiday", isCompleted: false, progress: 0, target: 1 },
  },
  badges: [],
  weeklyPostCount: 0,
  lastPostDate: null,
  updatedAt: Timestamp.now(),
};

export const GamificationService = {
  /**
   * Obtém os dados de gamificação do usuário. Se não existir, cria o documento padrão.
   */
  async getUserGamification(uid: string): Promise<UserGamificationDoc> {
    const docRef = doc(db, COLLECTION_NAME, uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as UserGamificationDoc;
    }

    // Cria o doc inicial
    const newDoc: UserGamificationDoc = {
      uid,
      ...DEFAULT_GAMIFICATION,
      updatedAt: Timestamp.now(),
    };
    await setDoc(docRef, newDoc);
    return newDoc;
  },

  /**
   * Adiciona pontos ao usuário e verifica se houve subida de nível.
   */
  async addPoints(uid: string, points: number): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, uid);

    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(docRef);
      if (!docSnap.exists()) {
        throw new Error("Gamification doc does not exist!");
      }

      const data = docSnap.data() as UserGamificationDoc;
      const newTotalPoints = data.totalPoints + points;

      // Determina o novo nível
      let newLevelId: GamificationLevelId = "iniciante";
      for (const level of GAMIFICATION_LEVELS) {
        if (newTotalPoints >= level.minPoints) {
          newLevelId = level.id;
        }
      }

      transaction.update(docRef, {
        totalPoints: newTotalPoints,
        currentLevelId: newLevelId,
        updatedAt: Timestamp.now(),
      });
    });
  },

  /**
   * Concede uma medalha ao usuário, se ele ainda não a tiver.
   */
  async awardBadge(uid: string, badgeId: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, uid);

    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(docRef);
      if (!docSnap.exists()) return;

      const data = docSnap.data() as UserGamificationDoc;
      const hasBadge = data.badges.some((b) => b.badgeId === badgeId);

      if (!hasBadge) {
        const newBadge: EarnedBadge = { badgeId, earnedAt: Timestamp.now() };
        transaction.update(docRef, {
          badges: [...data.badges, newBadge],
          updatedAt: Timestamp.now(),
        });
      }
    });
  }
};
