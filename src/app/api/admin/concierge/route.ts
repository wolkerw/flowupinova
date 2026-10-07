import { NextResponse, type NextRequest } from "next/server";
import { validateAdminToken } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase-admin";
import { toIsoDate } from "@/lib/admin/generated-content-utils";
import crypto from "crypto";

export const maxDuration = 120;

/**
 * GET /api/admin/concierge
 * Lista posts sob o regime de aprovação (pending_approval, changes_requested, approved)
 * e usuários cadastrados no plano/modo Concierge.
 */
export async function GET(request: NextRequest) {
  const token = request.cookies.get("firebase-id-token")?.value ?? null;
  const admin = await validateAdminToken(token);

  if (!admin) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  try {
    // 1. Carregar mapa de usuários para rápida associação
    const usersSnap = await adminDb.collection("users").get();
    const userMap: Record<string, { email: string; name: string; phone?: string; managed?: boolean }> = {};

    usersSnap.docs.forEach((u) => {
      const data = u.data();
      userMap[u.id] = {
        email: data.email || "",
        name:
          data.businessProfile?.companyName ||
          data.displayName ||
          data.brandKit?.businessName ||
          "Cliente",
        phone: data.phone || data.whatsapp || data.managedService?.clientPhone || "",
        managed: data.managedService?.serviceMode === "concierge" || data.serviceMode === "concierge",
      };
    });

    // 2. Buscar posts com approval.status presente via collectionGroup
    let posts: any[] = [];
    try {
      const pendingSnap = await adminDb
        .collectionGroup("posts")
        .where("approval.status", "in", ["pending_approval", "changes_requested", "approved", "rejected"])
        .limit(100)
        .get();

      pendingSnap.docs.forEach((doc) => {
        const data = doc.data();
        const parentUser = doc.ref.parent.parent;
        const userId = parentUser ? parentUser.id : "";
        const uInfo = userMap[userId] || { email: "", name: "Cliente", phone: "" };

        posts.push({
          id: doc.id,
          userId,
          clientName: uInfo.name,
          clientEmail: uInfo.email,
          clientPhone: uInfo.phone,
          text: data.text || "",
          imageUrl: data.imageUrl || (data.imageUrls && data.imageUrls[0]) || null,
          imageUrls: data.imageUrls || [],
          isCarousel: Boolean(data.isCarousel),
          platforms: data.platforms || [],
          status: data.status,
          scheduledAt: toIsoDate(data.scheduledAt),
          createdAt: toIsoDate(data.createdAt),
          approval: data.approval || null,
          magicLinkUrl: data.approval?.approvalToken
            ? `/aprovar/${data.approval.approvalToken}`
            : null,
        });
      });
    } catch (cgErr) {
      console.warn("[ADMIN_CONCIERGE_WARN] CollectionGroup falhou, acionando varredura por usuário:", cgErr);

      for (const uDoc of usersSnap.docs) {
        const uPosts = await uDoc.ref
          .collection("posts")
          .where("approval.status", "in", ["pending_approval", "changes_requested", "approved", "rejected"])
          .limit(20)
          .get()
          .catch(() => ({ docs: [] as any[] }));

        const uInfo = userMap[uDoc.id] || { email: "", name: "Cliente", phone: "" };

        uPosts.docs.forEach((doc: any) => {
          const data = doc.data();
          posts.push({
            id: doc.id,
            userId: uDoc.id,
            clientName: uInfo.name,
            clientEmail: uInfo.email,
            clientPhone: uInfo.phone,
            text: data.text || "",
            imageUrl: data.imageUrl || (data.imageUrls && data.imageUrls[0]) || null,
            imageUrls: data.imageUrls || [],
            isCarousel: Boolean(data.isCarousel),
            platforms: data.platforms || [],
            status: data.status,
            scheduledAt: toIsoDate(data.scheduledAt),
            createdAt: toIsoDate(data.createdAt),
            approval: data.approval || null,
            magicLinkUrl: data.approval?.approvalToken
              ? `/aprovar/${data.approval.approvalToken}`
              : null,
          });
        });
      }
    }

    // Ordenar pelos mais recentes de solicitação
    posts.sort((a, b) => {
      const timeA = new Date(a.approval?.requestedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.approval?.requestedAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    const conciergeUsers = Object.entries(userMap)
      .filter(([_, u]) => u.managed)
      .map(([id, u]) => ({ id, ...u }));

    return NextResponse.json(
      {
        success: true,
        posts,
        conciergeUsers,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[ADMIN_CONCIERGE_GET_ERROR] Erro:", err);
    return NextResponse.json({ error: "Falha ao carregar lista de concierge." }, { status: 500 });
  }
}

/**
 * POST /api/admin/concierge
 * Permite ao operador/desenvolvedor:
 * 1. Gerar/Renovar Link Mágico de Aprovação para um post já existente.
 * 2. Alternar o status de serviço gerenciado de um cliente (ativar modo concierge).
 */
export async function POST(request: NextRequest) {
  const token = request.cookies.get("firebase-id-token")?.value ?? null;
  const admin = await validateAdminToken(token);

  if (!admin) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action, userId, postId, serviceMode } = body as {
      action: "generate_magic_link" | "toggle_concierge_mode";
      userId: string;
      postId?: string;
      serviceMode?: "concierge" | "self_service";
    };

    if (!userId) {
      return NextResponse.json({ error: "userId é obrigatório." }, { status: 400 });
    }

    if (action === "toggle_concierge_mode") {
      const mode = serviceMode === "concierge" ? "concierge" : "self_service";
      await adminDb.doc(`users/${userId}`).set(
        {
          managedService: {
            serviceMode: mode,
            updatedAt: new Date().toISOString(),
          },
        },
        { merge: true }
      );

      return NextResponse.json({
        success: true,
        serviceMode: mode,
        message: `Modo do usuário atualizado para ${mode}.`,
      });
    }

    if (action === "generate_magic_link") {
      if (!postId) {
        return NextResponse.json({ error: "postId é obrigatório para gerar link." }, { status: 400 });
      }

      const postRef = adminDb.doc(`users/${userId}/posts/${postId}`);
      const postSnap = await postRef.get();

      if (!postSnap.exists) {
        return NextResponse.json({ error: "Publicação não encontrada." }, { status: 404 });
      }

      const newToken = crypto.randomUUID();
      const expires = new Date();
      expires.setDate(expires.getDate() + 14);

      const approvalPayload = {
        approvalToken: newToken,
        tokenExpiresAt: expires.toISOString(),
        status: "pending_approval",
        requestedAt: new Date().toISOString(),
      };

      await postRef.update({
        status: "pending_approval",
        approval: approvalPayload,
        updatedAt: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        approval: approvalPayload,
        magicLinkUrl: `/aprovar/${newToken}`,
      });
    }

    return NextResponse.json({ error: "Ação não suportada." }, { status: 400 });
  } catch (err: any) {
    console.error("[ADMIN_CONCIERGE_POST_ERROR] Erro:", err);
    return NextResponse.json({ error: "Erro ao processar ação." }, { status: 500 });
  }
}
