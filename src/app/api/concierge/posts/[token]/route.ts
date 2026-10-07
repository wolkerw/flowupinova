import { NextResponse, type NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import type { ConciergeApprovalPublicView } from "@/lib/types/concierge";
import { toIsoDate } from "@/lib/admin/generated-content-utils";

export const maxDuration = 60;

/**
 * GET /api/concierge/posts/[token]
 * Retorna os dados públicos da postagem para visualização do cliente contratante
 * no Link Mágico de Aprovação (sem exigir login).
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;

    if (!token || typeof token !== "string" || token.trim().length < 6) {
      return NextResponse.json(
        { error: "Token de aprovação inválido ou ausente." },
        { status: 400 }
      );
    }

    // Busca o post que contém approval.approvalToken igual ao token
    const postsQuery = await adminDb
      .collectionGroup("posts")
      .where("approval.approvalToken", "==", token)
      .limit(1)
      .get();

    if (postsQuery.empty) {
      return NextResponse.json(
        { error: "Publicação não encontrada ou link de aprovação inexistente." },
        { status: 404 }
      );
    }

    const postDoc = postsQuery.docs[0];
    const postData = postDoc.data();
    const parentUserRef = postDoc.ref.parent.parent;
    const userId = parentUserRef ? parentUserRef.id : "";

    // Buscar dados visuais do negócio/cliente (logo e nome) para personalização do cabeçalho
    let businessName = "Seu Negócio";
    let businessLogo: string | null = null;

    if (userId) {
      try {
        const userDoc = await adminDb.doc(`users/${userId}`).get();
        if (userDoc.exists) {
          const uData = userDoc.data();
          businessName =
            uData?.businessProfile?.companyName ||
            uData?.displayName ||
            uData?.brandKit?.businessName ||
            "Seu Negócio";
          businessLogo =
            uData?.brandKit?.logoUrl ||
            uData?.brandKit?.logos?.[0]?.url ||
            uData?.photoURL ||
            null;
        }
      } catch (err) {
        console.warn("[CONCIERGE_GET] Falha ao carregar perfil do usuário:", err);
      }
    }

    const expiresAtStr =
      postData.approval?.tokenExpiresAt ||
      new Date(Date.now() + 14 * 86400000).toISOString();
    const isExpired = new Date(expiresAtStr).getTime() < Date.now();

    const publicView: ConciergeApprovalPublicView = {
      token,
      postId: postDoc.id,
      userId,
      businessName,
      businessLogo,
      text: postData.text || "",
      imageUrls:
        postData.imageUrls && postData.imageUrls.length > 0
          ? postData.imageUrls
          : postData.imageUrl
            ? [postData.imageUrl]
            : [],
      platforms: postData.platforms || ["instagram"],
      isCarousel: Boolean(postData.isCarousel),
      scheduledAt:
        toIsoDate(postData.scheduledAt) ||
        toIsoDate(postData.createdAt) ||
        new Date().toISOString(),
      status: postData.approval?.status || postData.status || "pending_approval",
      tokenExpiresAt: expiresAtStr,
      reviewerFeedback: postData.approval?.reviewerFeedback || null,
      isExpired,
    };

    return NextResponse.json({ success: true, post: publicView }, { status: 200 });
  } catch (err: any) {
    console.error("[CONCIERGE_GET_ERROR] Erro ao buscar post de aprovação:", err);
    return NextResponse.json(
      { error: "Erro interno ao carregar a página de aprovação." },
      { status: 500 }
    );
  }
}
