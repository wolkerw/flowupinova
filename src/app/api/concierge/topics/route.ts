import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { adminDb } from "@/lib/firebase-admin";
import type { WeeklyPlanningTopics } from "@/lib/types/concierge";

/**
 * Valida formato de mês YYYY-MM (ex: "2026-11")
 */
function isValidMonth(month: string | null | undefined): boolean {
  if (!month || typeof month !== "string") return false;
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(month.trim());
}

/**
 * Resolve o workspace correto (se for o cliente aprovador, vincula ao workspace do criador/gestor)
 */
async function resolveWorkspace(authUser: { uid: string; email?: string }): Promise<{
  targetWorkspaceId: string;
  isApprover: boolean;
}> {
  const userDocRef = adminDb.collection("users").doc(authUser.uid);
  const userDoc = await userDocRef.get();
  const userData = userDoc.exists ? userDoc.data() : null;

  const isApprover = Boolean(
    userData?.conciergeRole === "client_approver" ||
    userData?.plan === "client_approver" ||
    userData?.role === "client_approver" ||
    String(userData?.plan || "").toLowerCase() === "client_approver"
  );

  let targetWorkspaceId = userData?.linkedWorkspaceId || authUser.uid;

  if (isApprover && (!userData?.linkedWorkspaceId || targetWorkspaceId === authUser.uid)) {
    const normalizedEmail = (authUser.email || "").trim().toLowerCase();
    if (normalizedEmail) {
      const gestorSnap = await adminDb
        .collection("users")
        .where("clientApprover.approverEmail", "==", normalizedEmail)
        .limit(1)
        .get();

      if (!gestorSnap.empty) {
        targetWorkspaceId = gestorSnap.docs[0].id;
        try {
          await userDocRef.set(
            {
              linkedWorkspaceId: targetWorkspaceId,
              conciergeRole: "client_approver",
              plan: "client_approver",
            },
            { merge: true }
          );
        } catch (e) {
          console.warn("[CONCIERGE_TOPICS] Falha ao persistir auto-reparo do vínculo:", e);
        }
      }
    }
  }

  return { targetWorkspaceId, isApprover };
}

/**
 * GET /api/concierge/topics?month=YYYY-MM
 * Busca a programação semanal de assuntos do mês informado.
 */
export async function GET(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const rawMonth = searchParams.get("month");

  // Mês padrão: mês atual no formato YYYY-MM
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const month = isValidMonth(rawMonth) ? (rawMonth as string).trim() : currentMonth;

  try {
    const { targetWorkspaceId, isApprover } = await resolveWorkspace(authUser);

    const docRef = adminDb
      .collection("users")
      .doc(targetWorkspaceId)
      .collection("conciergeTopics")
      .doc(month);

    const snap = await docRef.get();

    if (!snap.exists) {
      const emptyTopics: WeeklyPlanningTopics = {
        month,
        week1: "",
        week2: "",
        week3: "",
        week4: "",
        notes: "",
      };
      return NextResponse.json({
        success: true,
        month,
        topics: emptyTopics,
        targetWorkspaceId,
        isApprover,
      });
    }

    const data = snap.data() || {};
    const topics: WeeklyPlanningTopics = {
      month: data.month || month,
      week1: data.week1 || "",
      week2: data.week2 || "",
      week3: data.week3 || "",
      week4: data.week4 || "",
      notes: data.notes || "",
      updatedAt: data.updatedAt || null,
      updatedBy: data.updatedBy || null,
      updatedByRole: data.updatedByRole || null,
    };

    return NextResponse.json({
      success: true,
      month,
      topics,
      targetWorkspaceId,
      isApprover,
    });
  } catch (err: any) {
    console.error("[CONCIERGE_TOPICS_GET] Erro ao buscar assuntos semanais:", err);
    return NextResponse.json(
      { error: err.message || "Erro ao carregar assuntos da semana." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/concierge/topics
 * Salva a programação semanal de assuntos (Semanas 1 a 4) para o mês especificado.
 */
export async function POST(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { month, week1, week2, week3, week4, notes } = body || {};

    if (!isValidMonth(month)) {
      return NextResponse.json(
        { error: "Mês inválido. Forneça o mês no formato YYYY-MM (ex: 2026-11)." },
        { status: 400 }
      );
    }

    const { targetWorkspaceId, isApprover } = await resolveWorkspace(authUser);

    const topicsToSave: WeeklyPlanningTopics = {
      month: month.trim(),
      week1: typeof week1 === "string" ? week1.trim() : "",
      week2: typeof week2 === "string" ? week2.trim() : "",
      week3: typeof week3 === "string" ? week3.trim() : "",
      week4: typeof week4 === "string" ? week4.trim() : "",
      notes: typeof notes === "string" ? notes.trim() : "",
      updatedAt: new Date().toISOString(),
      updatedBy: authUser.email || authUser.uid,
      updatedByRole: isApprover ? "client_approver" : "creator",
    };

    const docRef = adminDb
      .collection("users")
      .doc(targetWorkspaceId)
      .collection("conciergeTopics")
      .doc(month.trim());

    await docRef.set(topicsToSave, { merge: true });

    return NextResponse.json({
      success: true,
      topics: topicsToSave,
      targetWorkspaceId,
      isApprover,
    });
  } catch (err: any) {
    console.error("[CONCIERGE_TOPICS_POST] Erro ao salvar assuntos semanais:", err);
    return NextResponse.json(
      { error: err.message || "Erro ao salvar assuntos semanais." },
      { status: 500 }
    );
  }
}
