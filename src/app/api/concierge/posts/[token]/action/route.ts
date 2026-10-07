import { NextResponse, type NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import type { PostApprovalStatus } from "@/lib/types/concierge";

export const maxDuration = 60;

/**
 * POST /api/concierge/posts/[token]/action
 * Processa a decisão do cliente contratante:
 * - action: "approve" -> define approval.status = "approved", post.status = "scheduled"
 * - action: "request_changes" -> define approval.status = "changes_requested", salva feedback
 * - action: "reject" -> define approval.status = "rejected", post.status = "rejected"
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;

    if (!token || typeof token !== "string" || token.trim().length < 6) {
      return NextResponse.json(
        { error: "Token de aprovação inválido." },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { action, feedback } = body as {
      action?: "approve" | "request_changes" | "reject";
      feedback?: string;
    };

    if (!action || !["approve", "request_changes", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Ação inválida. Escolha: approve, request_changes ou reject." },
        { status: 400 }
      );
    }

    if (action === "request_changes" && (!feedback || !feedback.trim())) {
      return NextResponse.json(
        { error: "Por favor, descreva as alterações desejadas para a equipe NumVapt." },
        { status: 400 }
      );
    }

    // Busca o post vinculado a esse token de aprovação
    const postsQuery = await adminDb
      .collectionGroup("posts")
      .where("approval.approvalToken", "==", token)
      .limit(1)
      .get();

    if (postsQuery.empty) {
      return NextResponse.json(
        { error: "Publicação não encontrada ou token expirado." },
        { status: 404 }
      );
    }

    const postDoc = postsQuery.docs[0];
    const postData = postDoc.data();
    const currentApproval = postData.approval || {};

    const expiresAtStr = currentApproval.tokenExpiresAt;
    if (expiresAtStr && new Date(expiresAtStr).getTime() < Date.now()) {
      return NextResponse.json(
        { error: "Este link de aprovação já expirou. Peça um novo link à equipe NumVapt." },
        { status: 410 }
      );
    }

    const nowIso = new Date().toISOString();
    let newApprovalStatus: PostApprovalStatus = "pending_approval";
    let newPostStatus = postData.status;

    if (action === "approve") {
      newApprovalStatus = "approved";
      // Ao aprovar, passa para scheduled (pronto para disparo pelo robô de publicação)
      newPostStatus = "scheduled";
    } else if (action === "request_changes") {
      newApprovalStatus = "changes_requested";
      newPostStatus = "changes_requested";
    } else if (action === "reject") {
      newApprovalStatus = "rejected";
      newPostStatus = "rejected";
    }

    const updatePayload: Record<string, any> = {
      status: newPostStatus,
      "approval.status": newApprovalStatus,
      "approval.reviewedAt": nowIso,
      "approval.reviewChannel": "magic_link",
      updatedAt: nowIso,
    };

    if (action === "request_changes" && feedback) {
      updatePayload["approval.reviewerFeedback"] = feedback.trim();
    }

    await postDoc.ref.update(updatePayload);

    return NextResponse.json(
      {
        success: true,
        action,
        status: newApprovalStatus,
        postStatus: newPostStatus,
        reviewedAt: nowIso,
        message:
          action === "approve"
            ? "Publicação aprovada com sucesso! Ela foi programada para publicação automática."
            : action === "request_changes"
              ? "Suas solicitações de alteração foram enviadas para os desenvolvedores da NumVapt."
              : "Publicação recusada.",
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[CONCIERGE_ACTION_ERROR] Erro ao registrar aprovação:", err);
    return NextResponse.json(
      { error: "Erro ao registrar sua resposta. Tente novamente." },
      { status: 500 }
    );
  }
}
