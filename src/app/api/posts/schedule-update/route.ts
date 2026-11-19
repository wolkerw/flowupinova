import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const body = await req.json();
    const { postId, userId, scheduledAt, text } = body;

    if (!postId) {
      return NextResponse.json({ error: "PostId é obrigatório." }, { status: 400 });
    }

    const targetUserId = userId || user.uid;

    // Verificar se o post pertence ao usuário ou workspace
    const postRef = adminDb.collection("users").doc(targetUserId).collection("posts").doc(postId);
    const postSnap = await postRef.get();

    if (!postSnap.exists) {
      return NextResponse.json({ error: "Publicação agendada não encontrada." }, { status: 404 });
    }

    const updatePayload: Record<string, any> = {
      updatedAt: Timestamp.now(),
    };

    if (scheduledAt) {
      const parsedDate = new Date(scheduledAt);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: "Data de agendamento inválida." }, { status: 400 });
      }

      updatePayload.scheduledAt = Timestamp.fromDate(parsedDate);
      updatePayload.status = "scheduled";
    }

    if (typeof text === "string") {
      updatePayload.text = text.trim();
      updatePayload.caption = text.trim();
    }

    await postRef.update(updatePayload);

    return NextResponse.json({
      success: true,
      message: "Agendamento atualizado com sucesso.",
    });
  } catch (error: any) {
    console.error("[SCHEDULE_UPDATE_API] Erro ao atualizar agendamento:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno ao atualizar agendamento." },
      { status: 500 }
    );
  }
}
