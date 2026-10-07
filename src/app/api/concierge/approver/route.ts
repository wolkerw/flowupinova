import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import type { ClientApproverAccount } from "@/lib/types/concierge";

export async function GET(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const targetWorkspaceId =
    authUser.isAdmin && searchParams.get("workspaceId")
      ? searchParams.get("workspaceId")!
      : authUser.uid;

  try {
    const workspaceDoc = await adminDb.collection("users").doc(targetWorkspaceId).get();
    if (!workspaceDoc.exists) {
      return NextResponse.json({ error: "Workspace não encontrado." }, { status: 404 });
    }

    const data = workspaceDoc.data();
    const approver = (data?.clientApprover as ClientApproverAccount | undefined) || null;

    return NextResponse.json({ approver }, { status: 200 });
  } catch (error: any) {
    console.error("[CONCIERGE_APPROVER_GET] Erro:", error);
    return NextResponse.json({ error: "Erro ao buscar aprovador." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { email, password, name, workspaceId } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "E-mail válido é obrigatório." }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ error: "A senha deve ter no mínimo 6 caracteres." }, { status: 400 });
    }

    const targetWorkspaceId =
      authUser.isAdmin && workspaceId ? workspaceId : authUser.uid;

    const normalizedEmail = email.trim().toLowerCase();
    const approverName = (name || "").trim() || "Cliente Aprovador";

    // 1. Criar ou atualizar usuário no Firebase Auth
    let approverUid: string;
    try {
      const existingUser = await adminAuth.getUserByEmail(normalizedEmail);
      approverUid = existingUser.uid;
      await adminAuth.updateUser(approverUid, {
        password,
        displayName: approverName,
      });
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        const newUser = await adminAuth.createUser({
          email: normalizedEmail,
          password,
          displayName: approverName,
        });
        approverUid = newUser.uid;
      } else {
        throw err;
      }
    }

    // 2. Gravar documento do usuário aprovador no Firestore
    await adminDb.collection("users").doc(approverUid).set(
      {
        uid: approverUid,
        email: normalizedEmail,
        displayName: approverName,
        conciergeRole: "client_approver",
        linkedWorkspaceId: targetWorkspaceId,
        role: "free",
        plan: "client_approver",
        updatedAt: new Date(),
      },
      { merge: true }
    );

    // 3. Vincular dados do aprovador no workspace da empresa / criador
    const approverData: ClientApproverAccount = {
      approverUid,
      approverEmail: normalizedEmail,
      approverName,
      status: "active",
      updatedAt: new Date().toISOString(),
    };

    await adminDb.collection("users").doc(targetWorkspaceId).set(
      {
        clientApprover: approverData,
      },
      { merge: true }
    );

    console.log(
      `[CONCIERGE_APPROVER] Conta de aprovador configurada para workspace ${targetWorkspaceId}: ${normalizedEmail}`
    );

    return NextResponse.json({ success: true, approver: approverData }, { status: 200 });
  } catch (error: any) {
    console.error("[CONCIERGE_APPROVER_POST] Erro:", error);
    return NextResponse.json(
      { error: error?.message || "Falha ao configurar conta de aprovador." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const targetWorkspaceId =
    authUser.isAdmin && searchParams.get("workspaceId")
      ? searchParams.get("workspaceId")!
      : authUser.uid;

  try {
    const workspaceDoc = await adminDb.collection("users").doc(targetWorkspaceId).get();
    if (workspaceDoc.exists) {
      const data = workspaceDoc.data();
      const approverUid = data?.clientApprover?.approverUid;

      if (approverUid) {
        // Desativa ou remove o papel de aprovador no usuário
        await adminDb
          .collection("users")
          .doc(approverUid)
          .set({ conciergeRole: null, linkedWorkspaceId: null }, { merge: true });
      }

      await adminDb
        .collection("users")
        .doc(targetWorkspaceId)
        .update({ clientApprover: null });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("[CONCIERGE_APPROVER_DELETE] Erro:", error);
    return NextResponse.json({ error: "Falha ao remover aprovador." }, { status: 500 });
  }
}
