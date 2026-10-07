import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
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

    // Se for aprovador mas não tiver linkedWorkspaceId gravado no seu doc, procura qual gestor o cadastrou
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
          // Auto-repara o documento do aprovador gravando o vínculo
          await userDocRef.set(
            {
              linkedWorkspaceId: targetWorkspaceId,
              conciergeRole: "client_approver",
              plan: "client_approver",
            },
            { merge: true }
          );
          console.log(
            `[CONCIERGE_POSTS] Vínculo auto-recuperado para aprovador ${authUser.uid} (${normalizedEmail}) -> workspace ${targetWorkspaceId}`
          );
        }
      }
    }

    // Busca os posts do workspace alvo
    const postsSnap = await adminDb
      .collection("users")
      .doc(targetWorkspaceId)
      .collection("posts")
      .get();

    const posts: any[] = [];
    postsSnap.forEach((doc) => {
      const data = doc.data();
      posts.push({
        ...data,
        id: doc.id,
        // Serializa datas e Timestamps para transporte JSON seguro
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        scheduledAt: data.scheduledAt?.toDate ? data.scheduledAt.toDate().toISOString() : data.scheduledAt,
      });
    });

    // Ordena por data agendada ou criação
    posts.sort((a, b) => {
      const timeA = new Date(a.scheduledAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.scheduledAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    return NextResponse.json({
      success: true,
      posts,
      targetWorkspaceId,
      isApprover,
    });
  } catch (error: any) {
    console.error("[CONCIERGE_POSTS_GET] Erro:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao carregar postagens do workspace." },
      { status: 500 }
    );
  }
}
