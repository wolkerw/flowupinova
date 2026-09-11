import { NextResponse, type NextRequest } from "next/server";
import { validateAdminToken } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(
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
    const contractsSnap = await adminDb
      .collection(`users/${uid}/contracts`)
      .orderBy("signedAt", "desc")
      .limit(1)
      .get();

    if (contractsSnap.empty) {
      const userDoc = await adminDb.collection("users").doc(uid).get();
      const userData = userDoc.data();
      if (userData?.activeContract) {
        return NextResponse.json({ contract: userData.activeContract }, { status: 200 });
      }
      return NextResponse.json({ contract: null }, { status: 200 });
    }

    const contractDoc = contractsSnap.docs[0];
    const contractData = contractDoc.data();

    return NextResponse.json(
      {
        contract: {
          id: contractDoc.id,
          ...contractData,
          signedAt: contractData.signedAt?.toDate?.()?.toISOString() || contractData.signedAt || null,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[ADMIN_USER_CONTRACT] Erro ao buscar contrato:", err);
    return NextResponse.json({ error: "Falha ao buscar contrato." }, { status: 500 });
  }
}
