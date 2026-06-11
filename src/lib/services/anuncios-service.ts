"use client";

import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  Timestamp,
  doc,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

// Interface para os dados de campanha armazenados no Firestore
export interface AdCampaignData {
  id?: string;
  userId: string;
  postId?: string; // ID do post do feed que foi impulsionado
  name: string;
  status: "draft" | "pending_payment" | "active" | "paused" | "completed" | "failed";
  platforms: Array<"instagram" | "facebook">;
  metaCampaignId?: string;
  metaAdSetId?: string;
  metaAdId?: string;
  adAccountId?: string;
  
  creative: {
    headline: string;
    bodyText: string;
    imageUrl: string;
    ctaType: "SEND_MESSAGE" | "LEARN_MORE" | "CALL_NOW" | "GET_DIRECTIONS" | "SHOP_NOW";
    ctaLink?: string;
  };
  
  budget: {
    type: "daily" | "lifetime";
    amount: number; // Valor em reais (ex: 15 para R$ 15,00)
    currency: "BRL";
  };
  durationDays: number;
  startDate: Timestamp;
  endDate: Timestamp;
  
  targeting: {
    address: string;
    radiusKm: number;
    ageMin: number;
    ageMax: number;
    gender: "all" | "male" | "female";
    locations?: Array<{
      name: string;
      type: string;
      key?: string;
      latitude?: number | null;
      longitude?: number | null;
    }>;
  };
  
  metrics?: {
    impressions: number;
    clicks: number;
    actions: number;
    amountSpent: number;
    lastSyncedAt: Timestamp;
  };
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Retorna a coleção de anúncios de um usuário específico
function getAdsCollectionRef(userId: string) {
  return collection(db, "users", userId, "ads");
}

/**
 * Cria uma nova campanha de anúncio no Firestore
 */
export async function createAdCampaign(
  userId: string,
  campaignData: Omit<AdCampaignData, "userId" | "createdAt" | "updatedAt">
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!userId) {
    return { success: false, error: "UserID é obrigatório para criar um anúncio." };
  }

  try {
    const dataToSave: Omit<AdCampaignData, "id"> = {
      ...campaignData,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(getAdsCollectionRef(userId), dataToSave);
    
    // Se o anúncio for baseado em um post, marca o post como impulsionado
    if (campaignData.postId) {
      try {
        const postRef = doc(db, "users", userId, "posts", campaignData.postId);
        await updateDoc(postRef, {
          isBoosted: true,
          adCampaignId: docRef.id,
        });
      } catch (postErr) {
        console.warn("[ADS_SERVICE] Falha ao atualizar flag isBoosted no post:", postErr);
      }
    }

    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error("[ADS_SERVICE] Erro ao criar campanha:", error);
    return { success: false, error: error.message || "Erro desconhecido ao criar campanha." };
  }
}

/**
 * Busca todas as campanhas de anúncios de um usuário
 */
export async function getUserAdCampaigns(userId: string): Promise<AdCampaignData[]> {
  if (!userId) return [];
  
  try {
    const q = query(getAdsCollectionRef(userId), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const campaigns: AdCampaignData[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as AdCampaignData;
      campaigns.push({
        ...data,
        id: docSnap.id,
      });
    });
    
    return campaigns;
  } catch (error) {
    console.error("[ADS_SERVICE] Erro ao buscar campanhas:", error);
    return [];
  }
}

/**
 * Atualiza o status de uma campanha (ex: Pausar/Ativar)
 */
export async function updateAdCampaignStatus(
  userId: string,
  campaignId: string,
  newStatus: AdCampaignData["status"]
): Promise<{ success: boolean; error?: string }> {
  if (!userId || !campaignId) {
    return { success: false, error: "Parâmetros insuficientes." };
  }

  try {
    const campaignRef = doc(db, "users", userId, "ads", campaignId);
    await updateDoc(campaignRef, {
      status: newStatus,
      updatedAt: Timestamp.now(),
    });
    return { success: true };
  } catch (error: any) {
    console.error("[ADS_SERVICE] Erro ao atualizar status:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Exclui uma campanha de anúncio do banco de dados
 */
export async function deleteAdCampaign(userId: string, campaignId: string): Promise<void> {
  if (!userId || !campaignId) {
    throw new Error("Parâmetros necessários ausentes.");
  }
  
  const campaignRef = doc(db, "users", userId, "ads", campaignId);
  await deleteDoc(campaignRef);
}

/**
 * Calcula a estimativa didática de alcance local com base no orçamento e raio
 * Regra matemática simples:
 * - O alcance é proporcional ao orçamento.
 * - Um raio menor concentra o público (menor dispersão, maior densidade local).
 * - Um raio maior dispersa a verba (cobre mais pessoas, mas precisa de frequência).
 */
export function estimateReach(budgetPerDay: number, durationDays: number, radiusKm: number) {
  const totalBudget = budgetPerDay * durationDays;
  
  // Base de ~120 visualizações por Real gasto (alinhado com um CPM realista do Meta Ads local no Brasil entre R$ 6 e R$ 10)
  const reachBase = totalBudget * 120;
  
  // Fator de ajuste por raio (raio menor = mais densidade local, raio maior = mais dispersão)
  // Raio ideal é em torno de 5km para marketing local
  let radiusFactor = 1.0;
  if (radiusKm <= 3) {
    radiusFactor = 1.15; // Ganho de densidade local
  } else if (radiusKm > 5 && radiusKm <= 10) {
    radiusFactor = 0.95;
  } else if (radiusKm > 10) {
    radiusFactor = 0.85; // Dispersão alta
  }
  
  const minReach = Math.round(reachBase * 0.7 * radiusFactor);
  const maxReach = Math.round(reachBase * 2.1 * radiusFactor);
  
  // Cliques estimados (1.2% a 3.5% de CTR médio local)
  const minClicks = Math.round(minReach * 0.012);
  const maxClicks = Math.round(maxReach * 0.035);
  
  return {
    minReach,
    maxReach,
    minClicks,
    maxClicks,
  };
}
