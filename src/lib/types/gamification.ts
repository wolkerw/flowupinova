import { Timestamp } from "firebase/firestore";

export type GamificationLevelId = "iniciante" | "criador" | "estrategista" | "autoridade";

export interface GamificationLevel {
  id: GamificationLevelId;
  name: string;
  minPoints: number;
}

export const GAMIFICATION_LEVELS: GamificationLevel[] = [
  { id: "iniciante", name: "Iniciante Digital", minPoints: 0 },
  { id: "criador", name: "Criador Engajado", minPoints: 1001 },
  { id: "estrategista", name: "Estrategista NumVapt", minPoints: 3001 },
  { id: "autoridade", name: "Autoridade Local", minPoints: 6001 },
];

export interface MissionProgress {
  missionId: string; // ex: "onboarding_gmb", "explorer_flows", "consistency_weekly", "opportunity_holiday"
  isCompleted: boolean;
  progress: number; // ex: 0 a 100
  target: number; // ex: 1 para GMB, 4 para Explorer, 3 para Consistência Semanal
  completedAt?: Timestamp | null;
  metadata?: Record<string, any>; // Dados extras, ex: { flowsUsed: ["concept", "product"] } ou { currentStreak: 2 }
}

export interface EarnedBadge {
  badgeId: string; // ex: "vitrine_impecavel", "mestre_formatos", "relogio_suico", "surfista_tendencias"
  earnedAt: Timestamp;
}

export interface UserGamificationDoc {
  uid: string;
  totalPoints: number;
  currentLevelId: GamificationLevelId;
  
  missions: Record<string, MissionProgress>;
  badges: EarnedBadge[];

  weeklyPostCount: number; // Contador da semana atual
  lastPostDate?: Timestamp | null; // Para avaliar consistência e reiniciar a semana
  
  updatedAt: Timestamp;
}
