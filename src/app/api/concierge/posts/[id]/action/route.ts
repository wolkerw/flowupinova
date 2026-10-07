import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id: postId } = await params;
  if (!postId) {
    return NextResponse.json({ error: "ID da postagem é obrigatório." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { action, notes } = body;

    if (!["approve", "request_changes"].includes(action)) {
      return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
    }

    const userDocRef = adminDb.collection("users").doc(authUser.uid);
    const userDoc = await userDocRef.get();
    const userData = userDoc.exists ? userDoc.data() : null;

    const isApprover = Boolean(
      userData?.conciergeRole === "client_approver" ||
      userData?.plan === "client_approver" ||
      userData?.role === "client_approver" ||
      String(userData?.plan || "").toLowerCase() === "client_approver"
    );

    // O gestor não tem permissão para aprovar o post em nome do cliente
    if (!isApprover && !authUser.isAdmin && action === "approve") {
      return NextResponse.json(
        { error: "Apenas o cliente aprovador tem permissão para aprovar a postagem." },
        { status: 403 }
      );
    }

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
        }
      }
    }

    const postDocRef = adminDb
      .collection("users")
      .doc(targetWorkspaceId)
      .collection("posts")
      .doc(postId);

    const postSnap = await postDocRef.get();
    if (!postSnap.exists) {
      return NextResponse.json({ error: "Postagem não encontrada." }, { status: 404 });
    }

    const now = new Date();

    if (action === "approve") {
      await postDocRef.update({
        status: "scheduled",
        "approval.status": "approved",
        "approval.reviewedAt": now,
        "approval.reviewedBy": authUser.email || authUser.uid,
        updatedAt: now,
      });

      return NextResponse.json({
        success: true,
        message: "Postagem aprovada e agendada com sucesso.",
      });
    }

    if (action === "request_changes") {
      await postDocRef.update({
        status: "changes_requested",
        "approval.status": "changes_requested",
        "approval.reviewNotes": notes || "",
        "approval.reviewedAt": now,
        "approval.reviewedBy": authUser.email || authUser.uid,
        updatedAt: now,
      });

      return NextResponse.json({
        success: true,
        message: "Solicitação de ajustes enviada com sucesso.",
      });
    }

    return NextResponse.json({ error: "Operação não executada." }, { status: 400 });
  } catch (error: any) {
    console.error("[CONCIERGE_POST_ACTION] Erro:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao processar ação na postagem." },
      { status: 500 }
    );
  }
}
