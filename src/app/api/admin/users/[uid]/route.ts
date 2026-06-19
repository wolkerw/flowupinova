import { NextResponse, type NextRequest } from "next/server";
import { validateAdminToken } from "@/lib/admin-auth";
import { adminDb, adminAuth, admin as firebaseAdmin } from "@/lib/firebase-admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const token = request.cookies.get("firebase-id-token")?.value ?? null;
  const admin = await validateAdminToken(token);

  if (!admin) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const { uid } = await params;
  const body = await request.json();
  const { plan, paymentStatus, extendTrial, extendTrialDays, subscriptionPlan } = body;

  if (!uid) {
    return NextResponse.json({ error: "UID do usuário é obrigatório." }, { status: 400 });
  }

  try {
    const userRef = adminDb.collection("users").doc(uid);
    const updates: Record<string, unknown> = {};

    if (paymentStatus) updates.paymentStatus = paymentStatus;

    if (plan) {
      if (plan === "standard") {
        updates.plan = "standard";
        updates.role = "pro";
        updates.subscriptionStatus = "active";
        
        const subPlan = subscriptionPlan === "anual" ? "anual" : "mensal";
        updates.subscriptionPlan = subPlan;
        
        const durationDays = subPlan === "anual" ? 365 : 30;
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + durationDays);
        updates.subscriptionExpiresAt = firebaseAdmin.firestore.Timestamp.fromDate(expirationDate);
      } else if (plan === "trial") {
        updates.plan = "trial";
        updates.role = "free";
        updates.subscriptionStatus = "inactive";
        updates.subscriptionPlan = null;
        updates.subscriptionExpiresAt = null;
      } else {
        updates.plan = plan;
      }
    }

    // Estender o trial adicionando dias a partir de agora
    if (extendTrial) {
      const days = typeof extendTrialDays === "number" ? extendTrialDays : 7;
      // Como o trial dura fixamente 7 dias a partir do createdAt, definimos o createdAt
      // de forma que o término (createdAt + 7 dias) seja exatamente daqui a "days" dias.
      // createdAt + 7d = hoje + daysd => createdAt = hoje + (days - 7)d.
      const msToAdd = (days - 7) * 24 * 60 * 60 * 1000;
      updates.createdAt = new Date(Date.now() + msToAdd);
      
      updates.plan = "trial";
      updates.role = "free";
      updates.subscriptionStatus = "inactive";
      updates.subscriptionPlan = null;
      updates.subscriptionExpiresAt = null;
    }

    await userRef.update(updates);

    console.log(`[ADMIN_ACTION] Admin ${admin.email} atualizou o usuário ${uid}:`, updates);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("[ADMIN_USER_PATCH] Erro:", err);
    return NextResponse.json({ error: "Falha ao atualizar usuário." }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const token = request.cookies.get("firebase-id-token")?.value ?? null;
  const admin = await validateAdminToken(token);

  if (!admin) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const { uid } = await params;

  if (!uid) {
    return NextResponse.json({ error: "UID do usuário é obrigatório." }, { status: 400 });
  }

  try {
    // Deletar do Firebase Auth
    await adminAuth.deleteUser(uid);

    // Deletar documento principal do Firestore
    await adminDb.collection("users").doc(uid).delete();

    console.log(`[ADMIN_ACTION] Admin ${admin.email} excluiu o usuário ${uid}.`);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("[ADMIN_USER_DELETE] Erro:", err);
    return NextResponse.json({ error: "Falha ao excluir usuário." }, { status: 500 });
  }
}
