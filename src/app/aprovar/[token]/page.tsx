import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminDb } from "@/lib/firebase-admin";
import type { ConciergeApprovalPublicView } from "@/lib/types/concierge";
import { toIsoDate } from "@/lib/admin/generated-content-utils";
import { ApprovalClientView } from "./ApprovalClientView";

export const metadata: Metadata = {
  title: "Aprovação de Conteúdo | NumVapt Concierge",
  description: "Visualize e aprove sua publicação criada pela equipe NumVapt.",
  robots: {
    index: false,
    follow: false,
  },
};

interface PageProps {
  params: Promise<{ token: string }>;
}

async function getPostByToken(token: string): Promise<ConciergeApprovalPublicView | null> {
  if (!token || token.trim().length < 6) return null;

  try {
    const postsQuery = await adminDb
      .collectionGroup("posts")
      .where("approval.approvalToken", "==", token)
      .limit(1)
      .get();

    if (postsQuery.empty) return null;

    const postDoc = postsQuery.docs[0];
    const postData = postDoc.data();
    const parentUserRef = postDoc.ref.parent.parent;
    const userId = parentUserRef ? parentUserRef.id : "";

    let businessName = "Sua Empresa";
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
            "Sua Empresa";
          businessLogo =
            uData?.brandKit?.logoUrl ||
            uData?.brandKit?.logos?.[0]?.url ||
            uData?.photoURL ||
            null;
        }
      } catch (err) {
        console.warn("[PAGE_APROVAR] Erro ao obter dados do usuário:", err);
      }
    }

    const expiresAtStr =
      postData.approval?.tokenExpiresAt ||
      new Date(Date.now() + 14 * 86400000).toISOString();
    const isExpired = new Date(expiresAtStr).getTime() < Date.now();

    return {
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
  } catch (err) {
    console.error("[PAGE_APROVAR_ERROR] Falha ao consultar post:", err);
    return null;
  }
}

export default async function AprovarPostPage({ params }: PageProps) {
  const { token } = await params;
  const post = await getPostByToken(token);

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4 text-xl font-bold">
          !
        </div>
        <h1 className="text-lg font-bold">Link de Aprovação Não Encontrado</h1>
        <p className="text-xs text-slate-400 max-w-sm mt-2 leading-relaxed">
          Esta publicação pode ter sido removida ou o endereço do link está incorreto. Entre em contato com a equipe NumVapt para solicitar um novo link.
        </p>
      </div>
    );
  }

  return <ApprovalClientView initialPost={post} />;
}
