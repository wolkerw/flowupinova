"use server";

import { adminDb, adminAuth } from "@/lib/firebase-admin";

// Custo estimado por operação (em USD)
const COSTS = {
  falaiPerImage: 0.05,
  imagen4PerImage: 0.03,
  nanoBananaPerImage: 0.03,
  geminiPer1kTokens: 0.00015,
  estimatedTokensPerChat: 800,
};

export interface UserSummary {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  segment?: string;
  plan: "trial" | "standard" | "blocked";
  paymentStatus: string;
  createdAt: string;
  trialDaysLeft: number;
  trialExpired: boolean;
  postsCount: number;
  imagesCount: number;
  lastSignIn?: string;
  subscriptionPlan?: "mensal" | "anual" | null;
  subscriptionExpiresAt?: string | null;
}

export interface PlatformStats {
  totalUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  trialUsers: number;
  standardUsers: number;
  trialExpiredUsers: number;
  totalImagesGenerated: number;
  totalPostsPublished: number;
  totalPostsFailed: number;
  totalChatSessions: number;
  estimatedCostFalai: number;
  estimatedCostImagen4: number;
  estimatedCostNanoBanana: number;
  estimatedCostGemini: number;
  estimatedCostTotal: number;
}

export interface SignupDataPoint {
  date: string;
  count: number;
}

export interface ContentDataPoint {
  date: string;
  images: number;
  posts: number;
}

/**
 * Busca estatísticas gerais da plataforma usando Firebase Admin SDK com filtro temporal.
 * @param days Quantidade de dias para filtrar (padrão: 30 dias. Se 0 ou null, calcula para todo o período).
 */
export async function getPlatformStats(days: number | null = 30): Promise<PlatformStats> {
  const usersSnap = await adminDb.collection("users").get();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
  const trialDuration = 7 * 24 * 60 * 60 * 1000;

  let sinceDate: Date | null = null;
  if (days !== null && days !== undefined && days > 0) {
    sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);
    sinceDate.setHours(0, 0, 0, 0);
  }

  let totalUsers = 0;
  let newUsersToday = 0;
  let newUsersThisWeek = 0;
  let trialUsers = 0;
  let standardUsers = 0;
  let trialExpiredUsers = 0;

  for (const userDoc of usersSnap.docs) {
    totalUsers++;
    const data = userDoc.data();
    const createdAt = data.createdAt?.toDate?.() as Date | undefined;
    const plan = data.plan ?? "trial";

    if (createdAt) {
      if (createdAt >= todayStart) newUsersToday++;
      if (createdAt >= weekStart) newUsersThisWeek++;
    }

    if (plan === "trial") {
      trialUsers++;
      if (createdAt && now.getTime() - createdAt.getTime() > trialDuration) {
        trialExpiredUsers++;
      }
    } else if (plan === "standard") {
      standardUsers++;
    }
  }

  // Executa contagem agregada de posts globalmente (muito mais rápido!)
  let totalPostsPublished = 0;
  let totalPostsFailed = 0;
  try {
    const [publishedSnap, failedSnap] = await Promise.all([
      adminDb.collectionGroup("posts").where("status", "==", "published").count().get(),
      adminDb.collectionGroup("posts").where("status", "==", "failed").count().get(),
    ]);
    totalPostsPublished = publishedSnap.data().count;
    totalPostsFailed = failedSnap.data().count;
  } catch (err) {
    console.error("[ADMIN_DASHBOARD] Erro ao contar posts via collectionGroup:", err);
  }

  // Contagem precisa de sessões de chat (lendo subcoleção appData/history)
  let totalChatSessions = 0;
  try {
    const appDataSnap = await adminDb.collectionGroup("appData").get();
    const historyDocs = appDataSnap.docs.filter((d) => d.id === "history");
    totalChatSessions = historyDocs.length;
  } catch (err) {
    console.error("[ADMIN_DASHBOARD] Erro ao contar sessões de chat:", err);
  }

  // Obter custos e imagens reais a partir da coleção apiUsageLogs com filtro temporal
  let totalImagesGenerated = 0;
  let estimatedCostFalai = 0;
  let estimatedCostImagen4 = 0;
  let estimatedCostNanoBanana = 0;
  let estimatedCostGemini = 0;

  try {
    const usageSnap = await adminDb.collection("apiUsageLogs").get();
    usageSnap.docs.forEach((doc) => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate?.() as Date | undefined;

      if (sinceDate && createdAt && createdAt < sinceDate) {
        return;
      }

      const cost = data.costUsd || 0;

      if (data.provider === "falai") {
        estimatedCostFalai += cost;
      } else if (data.provider === "google_vertex") {
        estimatedCostImagen4 += cost;
      } else if (
        data.model === "imagen-3.0-generate-002" ||
        data.source === "nanobanana_ref" ||
        (data.provider === "google_gemini" && data.type === "avatar_generation") ||
        (data.provider === "google_gemini" && data.type === "image_generation")
      ) {
        estimatedCostNanoBanana += cost;
      } else if (data.type === "chat" || data.type === "vision_analysis") {
        estimatedCostGemini += cost;
      }

      if (data.type === "image_generation" || data.type === "avatar_generation") {
        totalImagesGenerated++;
      }
    });
  } catch (err) {
    console.error("[ADMIN_DASHBOARD] Erro ao carregar logs de consumo de APIs:", err);
  }

  return {
    totalUsers,
    newUsersToday,
    newUsersThisWeek,
    trialUsers,
    standardUsers,
    trialExpiredUsers,
    totalImagesGenerated,
    totalPostsPublished,
    totalPostsFailed,
    totalChatSessions,
    estimatedCostFalai,
    estimatedCostImagen4,
    estimatedCostNanoBanana,
    estimatedCostGemini,
    estimatedCostTotal:
      estimatedCostFalai + estimatedCostImagen4 + estimatedCostNanoBanana + estimatedCostGemini,
  };
}

/**
 * Busca todos os usuários com suas estatísticas individuais.
 */
export async function getAllUsersWithStats(): Promise<UserSummary[]> {
  const usersSnap = await adminDb.collection("users").orderBy("createdAt", "desc").get();
  const now = new Date();
  const trialDuration = 7 * 24 * 60 * 60 * 1000;

  // Buscar usuários do Firebase Auth para obter lastSignIn
  let authUsers: Record<string, string> = {};
  try {
    const listResult = await adminAuth.listUsers(1000);
    for (const u of listResult.users) {
      authUsers[u.uid] = u.metadata.lastSignInTime ?? "";
    }
  } catch {
    // Continuar sem lastSignIn se falhar
  }

  const users: UserSummary[] = [];

  await Promise.all(
    usersSnap.docs.map(async (userDoc) => {
      const data = userDoc.data();
      const uid = userDoc.id;
      const createdAt = data.createdAt?.toDate?.() as Date | undefined;
      const plan = (data.plan ?? "trial") as UserSummary["plan"];

      const trialDaysLeft = createdAt
        ? Math.max(
            0,
            Math.ceil((createdAt.getTime() + trialDuration - now.getTime()) / (24 * 60 * 60 * 1000))
          )
        : 0;
      const trialExpired = plan === "trial" && trialDaysLeft === 0;

      const subscriptionPlan = data.subscriptionPlan as "mensal" | "anual" | null | undefined;
      let subscriptionExpiresAt: string | null = null;
      if (data.subscriptionExpiresAt) {
        subscriptionExpiresAt = data.subscriptionExpiresAt.toDate?.()?.toISOString() ?? null;
      }

      // Contagens paralelas
      const [imagesSnap, postsSnap] = await Promise.all([
        adminDb.collection(`users/${uid}/mediaGallery`).count().get(),
        adminDb.collection(`users/${uid}/posts`).count().get(),
      ]);

      users.push({
        uid,
        email: data.email ?? "",
        displayName: data.displayName ?? data.email ?? "—",
        phone: data.phone,
        segment: data.segment,
        plan,
        paymentStatus: data.paymentStatus ?? "active",
        createdAt: createdAt?.toISOString() ?? new Date().toISOString(),
        trialDaysLeft,
        trialExpired,
        postsCount: postsSnap.data().count,
        imagesCount: imagesSnap.data().count,
        lastSignIn: authUsers[uid] ?? "",
        subscriptionPlan: subscriptionPlan ?? null,
        subscriptionExpiresAt,
      });
    })
  );

  return users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Busca cadastros por dia nos últimos N dias para o gráfico de linha.
 */
export async function getRecentSignups(days = 30): Promise<SignupDataPoint[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const snap = await adminDb
    .collection("users")
    .where("createdAt", ">=", since)
    .orderBy("createdAt", "asc")
    .get();

  const countByDay: Record<string, number> = {};

  // Inicializar todos os dias com 0
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().substring(0, 10);
    countByDay[key] = 0;
  }

  for (const doc of snap.docs) {
    const createdAt = doc.data().createdAt?.toDate?.() as Date | undefined;
    if (createdAt) {
      const key = createdAt.toISOString().substring(0, 10);
      if (key in countByDay) countByDay[key]++;
    }
  }

  return Object.entries(countByDay).map(([date, count]) => ({ date, count }));
}

/**
 * Busca quantidade de imagens geradas por dia nos últimos N dias para o gráfico de imagens.
 */
export async function getRecentImageGenerations(days = 30): Promise<SignupDataPoint[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const countByDay: Record<string, number> = {};

  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().substring(0, 10);
    countByDay[key] = 0;
  }

  try {
    const snap = await adminDb
      .collection("apiUsageLogs")
      .where("createdAt", ">=", since)
      .get();

    for (const doc of snap.docs) {
      const data = doc.data();
      if (data.type === "image_generation" || data.type === "avatar_generation") {
        const createdAt = data.createdAt?.toDate?.() as Date | undefined;
        if (createdAt) {
          const key = createdAt.toISOString().substring(0, 10);
          if (key in countByDay) countByDay[key]++;
        }
      }
    }
  } catch (err) {
    console.error("[ADMIN_DASHBOARD] Erro ao buscar dados diários de geração de imagens:", err);
  }

  return Object.entries(countByDay).map(([date, count]) => ({ date, count }));
}

export interface ImageModelUsagePoint {
  model: string;
  count: number;
  totalCostUsd: number;
  avgCostUsd: number;
  avgCostBrl: number;
}

/**
 * Busca estatísticas de uso e custo por modelo de geração de imagem nos últimos N dias.
 */
export async function getRecentImageModelsUsage(days = 30): Promise<ImageModelUsagePoint[]> {
  let sinceDate: Date | null = null;
  if (days > 0) {
    sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);
    sinceDate.setHours(0, 0, 0, 0);
  }

  const modelMap: Record<string, { count: number; totalCostUsd: number }> = {};

  try {
    const snap = await adminDb.collection("apiUsageLogs").get();

    for (const doc of snap.docs) {
      const data = doc.data();
      const type = data.type || "";
      if (type === "image_generation" || type === "avatar_generation") {
        const createdAt = data.createdAt?.toDate?.() as Date | undefined;
        if (sinceDate && createdAt && createdAt < sinceDate) {
          continue;
        }

        const model = data.model || "imagen-3.0-generate-002";
        const costUsd = Number(data.costUsd || 0);

        if (!modelMap[model]) {
          modelMap[model] = { count: 0, totalCostUsd: 0 };
        }
        modelMap[model].count += 1;
        modelMap[model].totalCostUsd += costUsd;
      }
    }
  } catch (err) {
    console.error("[ADMIN_DASHBOARD] Erro ao buscar uso por modelo de imagem:", err);
  }

  return Object.entries(modelMap)
    .map(([model, data]) => {
      const avgCostUsd = data.count > 0 ? data.totalCostUsd / data.count : 0;
      const avgCostBrl = avgCostUsd * 5.65;
      return {
        model,
        count: data.count,
        totalCostUsd: data.totalCostUsd,
        avgCostUsd,
        avgCostBrl,
      };
    })
    .sort((a, b) => b.count - a.count);
}

export async function getFailedPosts(
  limit = 50
): Promise<
  { uid: string; postId: string; reason: string; scheduledAt: string; platforms: string[] }[]
> {
  try {
    const usersSnap = await adminDb.collection("users").get();
    const allFailedPostsPromises = usersSnap.docs.map((userDoc) => {
      return adminDb.collection(`users/${userDoc.id}/posts`).where("status", "==", "failed").get();
    });

    const results = await Promise.all(allFailedPostsPromises);
    const failedPosts: any[] = [];

    results.forEach((snap, idx) => {
      const uid = usersSnap.docs[idx].id;
      snap.docs.forEach((doc) => {
        const data = doc.data();
        failedPosts.push({
          uid,
          postId: doc.id,
          reason: data.failureReason ?? "Motivo desconhecido",
          scheduledAt: data.scheduledAt?.toDate?.()?.toISOString() ?? "",
          platforms: data.platforms ?? [],
        });
      });
    });

    // Ordenar por data decrescente e limitar
    return failedPosts
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
      .slice(0, limit);
  } catch (error) {
    console.error("[ADMIN_DASHBOARD] Erro ao buscar posts falhos:", error);
    return [];
  }
}
