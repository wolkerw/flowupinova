import { NextResponse, type NextRequest } from "next/server";
import { validateAdminToken } from "@/lib/admin-auth";
import { adminDb, adminAuth } from "@/lib/firebase-admin";

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
  const { plan, paymentStatus, extendTrial } = body;

  if (!uid) {
    return NextResponse.json({ error: "UID do usuário é obrigatório." }, { status: 400 });
  }

  try {
    const userRef = adminDb.collection("users").doc(uid);
    const updates: Record<string, unknown> = {};

    if (plan) updates.plan = plan;
    if (paymentStatus) updates.paymentStatus = paymentStatus;

    // Estender o trial adicionando 7 dias a partir de agora
    if (extendTrial) {
      const userSnap = await userRef.get();
      const currentCreatedAt = userSnap.data()?.createdAt?.toDate?.() ?? new Date();
      const newTrialStart = new Date(
        Math.max(currentCreatedAt.getTime(), Date.now() - 7 * 24 * 60 * 60 * 1000)
      );
      updates.createdAt = new Date(newTrialStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 7 * 24 * 60 * 60 * 1000);
      // Simplesmente resetar o createdAt para agora (garantindo 7 dias a partir de hoje)
      updates.createdAt = new Date();
      updates.plan = "trial";
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
