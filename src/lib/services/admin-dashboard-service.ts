"use server";

import { adminDb, adminAuth } from "@/lib/firebase-admin";

// Custo estimado por operação (em USD)
const COSTS = {
  falaiPerImage: 0.05,
  imagen4PerImage: 0.03,
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
 * Busca estatísticas gerais da plataforma usando Firebase Admin SDK.
 */
export async function getPlatformStats(): Promise<PlatformStats> {
  const usersSnap = await adminDb.collection("users").get();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
  const trialDuration = 7 * 24 * 60 * 60 * 1000;

  let totalUsers = 0;
  let newUsersToday = 0;
  let newUsersThisWeek = 0;
  let trialUsers = 0;
  let standardUsers = 0;
  let trialExpiredUsers = 0;
  let totalImagesGenerated = 0;
  let totalPostsPublished = 0;
  let totalPostsFailed = 0;
  let totalChatSessions = 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const imageCountPromises: Promise<any>[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const postCountPromises: Promise<any>[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const failedPostCountPromises: Promise<any>[] = [];

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

    // Contar imagens e posts de forma agregada
    const uid = userDoc.id;
    imageCountPromises.push(
      adminDb.collection(`users/${uid}/mediaGallery`).count().get()
    );
    postCountPromises.push(
      adminDb.collection(`users/${uid}/posts`).where("status", "==", "published").count().get()
    );
    failedPostCountPromises.push(
      adminDb.collection(`users/${uid}/posts`).where("status", "==", "failed").count().get()
    );
  }

  // Resolver promessas em paralelo para eficiência
  const [imageCounts, postCounts, failedPostCounts] = await Promise.all([
    Promise.all(imageCountPromises),
    Promise.all(postCountPromises),
    Promise.all(failedPostCountPromises),
  ]);

  for (const snap of imageCounts) totalImagesGenerated += snap.data().count;
  for (const snap of postCounts) totalPostsPublished += snap.data().count;
  for (const snap of failedPostCounts) totalPostsFailed += snap.data().count;

  // Estimar sessões de chat (usando contagem de coleções de histórico)
  try {
    const chatGroupSnap = await adminDb.collectionGroup("chatHistory").count().get();
    totalChatSessions = chatGroupSnap.data().count;
  } catch {
    totalChatSessions = 0;
  }

  const estimatedCostFalai = totalImagesGenerated * COSTS.falaiPerImage;
  const estimatedCostImagen4 = totalImagesGenerated * COSTS.imagen4PerImage;
  const estimatedCostGemini =
    (totalChatSessions * COSTS.estimatedTokensPerChat * COSTS.geminiPer1kTokens) / 1000;

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
    estimatedCostGemini,
    estimatedCostTotal: estimatedCostFalai + estimatedCostImagen4 + estimatedCostGemini,
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
        ? Math.max(0, Math.ceil((createdAt.getTime() + trialDuration - now.getTime()) / (24 * 60 * 60 * 1000)))
        : 0;
      const trialExpired = plan === "trial" && trialDaysLeft === 0;

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

export async function getFailedPosts(limit = 50): Promise<
  { uid: string; postId: string; reason: string; scheduledAt: string; platforms: string[] }[]
> {
  try {
    const usersSnap = await adminDb.collection("users").get();
    const allFailedPostsPromises = usersSnap.docs.map((userDoc) => {
      return adminDb
        .collection(`users/${userDoc.id}/posts`)
        .where("status", "==", "failed")
        .get();
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
