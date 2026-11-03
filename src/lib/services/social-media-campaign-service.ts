"use client";

import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import type {
  SocialMediaAuditReport,
  SocialMediaCampaign,
  CampaignItemStatus,
} from "@/lib/types/social-media";

function sanitizeForFirestore(data: any): any {
  if (data === null || data === undefined) return null;
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item));
  }
  if (typeof data === "object") {
    const clean: Record<string, any> = {};
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) {
        clean[key] = sanitizeForFirestore(val);
      }
    }
    return clean;
  }
  return data;
}

export async function getLatestSocialAudit(
  userId: string
): Promise<SocialMediaAuditReport | null> {
  if (!userId) return null;
  try {
    const docRef = doc(db, "users", userId, "social_audits", "latest");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as SocialMediaAuditReport;
    }
    return null;
  } catch (error) {
    console.error("[SOCIAL_MEDIA_SERVICE] Erro ao buscar auditoria:", error);
    return null;
  }
}

export async function saveSocialAudit(
  userId: string,
  report: SocialMediaAuditReport
): Promise<void> {
  if (!userId) return;
  try {
    const docRef = doc(db, "users", userId, "social_audits", "latest");
    await setDoc(docRef, sanitizeForFirestore(report), { merge: true });
  } catch (error) {
    console.error("[SOCIAL_MEDIA_SERVICE] Erro ao salvar auditoria:", error);
  }
}

export async function getSocialCampaigns(
  userId: string
): Promise<SocialMediaCampaign[]> {
  if (!userId) return [];
  try {
    const colRef = collection(db, "users", userId, "social_campaigns");
    const q = query(colRef, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      ...(d.data() as SocialMediaCampaign),
      id: d.id,
    }));
  } catch (error) {
    console.error("[SOCIAL_MEDIA_SERVICE] Erro ao listar campanhas:", error);
    return [];
  }
}

export async function saveSocialCampaign(
  userId: string,
  campaign: SocialMediaCampaign
): Promise<SocialMediaCampaign> {
  if (!userId) throw new Error("Usuário não autenticado.");
  const colRef = collection(db, "users", userId, "social_campaigns");
  const campaignId = campaign.id || `camp_${Date.now()}`;
  const docRef = doc(colRef, campaignId);
  const payload: SocialMediaCampaign = {
    ...campaign,
    id: campaignId,
    updatedAt: new Date().toISOString(),
  };
  await setDoc(docRef, sanitizeForFirestore(payload), { merge: true });
  return payload;
}

export interface CampaignPostItemUpdateMeta {
  linkedPostId?: string;
  generatedImageUrl?: string;
  generatedImageAt?: string;
  generatedAssetId?: string;
}

export async function updateCampaignPostItemStatus(
  userId: string,
  campaignId: string,
  postItemId: string,
  status: CampaignItemStatus,
  metaOrLinkedPostId?: string | CampaignPostItemUpdateMeta
): Promise<SocialMediaCampaign | null> {
  if (!userId || !campaignId || !postItemId) return null;
  try {
    const docRef = doc(db, "users", userId, "social_campaigns", campaignId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;

    const meta: CampaignPostItemUpdateMeta =
      typeof metaOrLinkedPostId === "string"
        ? { linkedPostId: metaOrLinkedPostId }
        : metaOrLinkedPostId || {};

    const campaign = snap.data() as SocialMediaCampaign;
    const updatedPosts = (campaign.posts || []).map((item) => {
      if (item.id === postItemId) {
        return {
          ...item,
          status,
          ...(meta.linkedPostId ? { linkedPostId: meta.linkedPostId } : {}),
          ...(meta.generatedImageUrl ? { generatedImageUrl: meta.generatedImageUrl } : {}),
          ...(meta.generatedImageAt ? { generatedImageAt: meta.generatedImageAt } : {}),
          ...(meta.generatedAssetId ? { generatedAssetId: meta.generatedAssetId } : {}),
        };
      }
      return item;
    });

    const updatedCampaign: SocialMediaCampaign = {
      ...campaign,
      id: campaignId,
      posts: updatedPosts,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(docRef, sanitizeForFirestore(updatedCampaign), { merge: true });
    return updatedCampaign;
  } catch (error) {
    console.error("[SOCIAL_MEDIA_SERVICE] Erro ao atualizar status do item:", error);
    return null;
  }
}

export async function deleteSocialCampaign(
  userId: string,
  campaignId: string
): Promise<boolean> {
  if (!userId || !campaignId) return false;
  try {
    const docRef = doc(db, "users", userId, "social_campaigns", campaignId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("[SOCIAL_MEDIA_SERVICE] Erro ao excluir campanha:", error);
    return false;
  }
}
