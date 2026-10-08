import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { postId, workspaceId, action, notes } = body;

    if (!postId) {
      return NextResponse.json({ error: "ID da postagem é obrigatório." }, { status: 400 });
    }

    if (!["approve", "request_changes", "resubmit", "update_image", "update_text"].includes(action)) {
      return NextResponse.json({ error: "Ação inválida. Escolha approve, request_changes, resubmit, update_image ou update_text." }, { status: 400 });
    }

    // Busca dados do usuário logado
    const userDocRef = adminDb.collection("users").doc(authUser.uid);
    const userDoc = await userDocRef.get();
    const userData = userDoc.exists ? userDoc.data() : null;

    const isApprover = Boolean(
      userData?.conciergeRole === "client_approver" ||
      userData?.plan === "client_approver" ||
      userData?.role === "client_approver" ||
      String(userData?.plan || "").toLowerCase() === "client_approver"
    );

    // O gestor não pode aprovar a arte (ação restrita ao cliente aprovador)
    if (!isApprover && !authUser.isAdmin && action === "approve") {
      return NextResponse.json(
        { error: "Apenas o cliente aprovador tem permissão para aprovar a postagem." },
        { status: 403 }
      );
    }

    // Resolve o workspace onde a postagem está gravada
    let targetWorkspaceId = workspaceId || userData?.linkedWorkspaceId || authUser.uid;

    // Se ainda for o próprio UID do aprovador ou se workspaceId não foi passado, tenta localizar o workspace do gestor
    if ((!workspaceId || targetWorkspaceId === authUser.uid) && isApprover) {
      const normalizedEmail = (authUser.email || "").trim().toLowerCase();
      if (normalizedEmail) {
        const gestorSnap = await adminDb
          .collection("users")
          .where("clientApprover.approverEmail", "==", normalizedEmail)
          .limit(1)
          .get();

        if (!gestorSnap.empty) {
          targetWorkspaceId = gestorSnap.docs[0].id;
          // Auto-repara o documento do aprovador
          await userDocRef.set(
            {
              linkedWorkspaceId: targetWorkspaceId,
              conciergeRole: "client_approver",
              plan: "client_approver",
            },
            { merge: true }
          );
        }
      }
    }

    // Tenta carregar o post no targetWorkspaceId
    let postDocRef = adminDb
      .collection("users")
      .doc(targetWorkspaceId)
      .collection("posts")
      .doc(postId);

    let postSnap = await postDocRef.get();

    // Fallback: se não encontrou no workspaceId, tenta no próprio UID do usuário autenticado
    if (!postSnap.exists && targetWorkspaceId !== authUser.uid) {
      const fallbackDocRef = adminDb
        .collection("users")
        .doc(authUser.uid)
        .collection("posts")
        .doc(postId);
      const fallbackSnap = await fallbackDocRef.get();
      if (fallbackSnap.exists) {
        postDocRef = fallbackDocRef;
        postSnap = fallbackSnap;
        targetWorkspaceId = authUser.uid;
      }
    }

    if (!postSnap.exists) {
      return NextResponse.json({ error: "Postagem não encontrada no banco de dados." }, { status: 404 });
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

      console.log(`[CONCIERGE_POST_ACTION] Post ${postId} aprovado com sucesso por ${authUser.email || authUser.uid}`);

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

      console.log(`[CONCIERGE_POST_ACTION] Ajustes solicitados para o post ${postId} por ${authUser.email || authUser.uid}`);

      return NextResponse.json({
        success: true,
        message: "Solicitação de ajustes enviada com sucesso.",
      });
    }

    if (action === "resubmit") {
      const updateData: Record<string, any> = {
        status: "pending_approval",
        "approval.status": "pending",
        "approval.resubmittedAt": now,
        "approval.resubmittedBy": authUser.email || authUser.uid,
        updatedAt: now,
      };

      if (body.newImageUrl) {
        updateData.imageUrl = body.newImageUrl;
        const currentData = postSnap.data();
        let currentList = Array.isArray(currentData?.imageUrls) ? [...currentData.imageUrls] : [];
        const idx = typeof body.imageIndex === "number" ? body.imageIndex : 0;
        if (currentList.length > 0 && idx >= 0 && idx < currentList.length) {
          currentList[idx] = body.newImageUrl;
        } else {
          currentList = [body.newImageUrl];
        }
        updateData.imageUrls = currentList;
        updateData.mediaFiles = currentList.map((url: string) => ({ url, type: "image" }));
      }

      if (typeof body.text === "string" && body.text.trim()) {
        updateData.text = body.text.trim();
        updateData.caption = body.text.trim();
      } else if (typeof body.newText === "string" && body.newText.trim()) {
        updateData.text = body.newText.trim();
        updateData.caption = body.newText.trim();
      }

      await postDocRef.update(updateData);

      console.log(`[CONCIERGE_POST_ACTION] Post ${postId} reenviado para aprovação por ${authUser.email || authUser.uid}`);

      return NextResponse.json({
        success: true,
        message: "Postagem reenviada para aprovação do cliente com sucesso.",
      });
    }

    if (action === "update_image") {
      const { newImageUrl, imageIndex } = body;
      if (!newImageUrl) {
        return NextResponse.json({ error: "newImageUrl é obrigatório para atualizar a imagem." }, { status: 400 });
      }

      const currentData = postSnap.data();
      const idx = typeof imageIndex === "number" ? imageIndex : 0;
      let currentList = Array.isArray(currentData?.imageUrls) ? [...currentData.imageUrls] : [];
      if (currentList.length > 0 && idx >= 0 && idx < currentList.length) {
        currentList[idx] = newImageUrl;
      } else {
        currentList = [newImageUrl];
      }

      await postDocRef.update({
        imageUrl: idx === 0 ? newImageUrl : (currentData?.imageUrl || newImageUrl),
        imageUrls: currentList,
        mediaFiles: currentList.map((url: string) => ({ url, type: "image" })),
        updatedAt: now,
      });

      console.log(`[CONCIERGE_POST_ACTION] Imagem do post ${postId} atualizada com sucesso por ${authUser.email || authUser.uid}`);

      return NextResponse.json({
        success: true,
        message: "Arte da postagem atualizada com sucesso.",
      });
    }

    if (action === "update_text") {
      const textToSave = String(body.text || body.newText || "").trim();
      await postDocRef.update({
        text: textToSave,
        caption: textToSave,
        updatedAt: now,
      });

      console.log(`[CONCIERGE_POST_ACTION] Legenda do post ${postId} atualizada com sucesso por ${authUser.email || authUser.uid}`);

      return NextResponse.json({
        success: true,
        message: "Legenda da postagem atualizada com sucesso.",
      });
    }

    return NextResponse.json({ error: "Ação não processada." }, { status: 400 });
  } catch (error: any) {
    console.error("[CONCIERGE_POST_ACTION] Erro:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao processar ação na postagem." },
      { status: 500 }
    );
  }
}
