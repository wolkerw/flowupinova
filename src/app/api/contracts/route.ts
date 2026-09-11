import { NextResponse, type NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getAuthenticatedUser } from "@/lib/api-auth";
import type { UserContractDoc } from "@/lib/types/contract";

export const maxDuration = 30;

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser || !authUser.uid) {
      return NextResponse.json(
        { error: "Autenticação obrigatória." },
        { status: 401 }
      );
    }

    const userRef = adminDb.collection("users").doc(authUser.uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json({ contract: null });
    }

    const userData = userSnap.data();
    const activeContractId = userData?.activeContractId;

    if (activeContractId) {
      const contractSnap = await userRef
        .collection("contracts")
        .doc(activeContractId)
        .get();

      if (contractSnap.exists) {
        const cData = contractSnap.data() as UserContractDoc;
        const signedAt = cData.signedAt?.toDate
          ? cData.signedAt.toDate().toISOString()
          : cData.signedAt;

        return NextResponse.json({
          contract: {
            ...cData,
            signedAt,
          },
        });
      }
    }

    // Fallback: busca o contrato mais recente na subcoleção
    const contractsQuery = await userRef
      .collection("contracts")
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (!contractsQuery.empty) {
      const docSnap = contractsQuery.docs[0];
      const cData = docSnap.data() as UserContractDoc;
      const signedAt = cData.signedAt?.toDate
        ? cData.signedAt.toDate().toISOString()
        : cData.signedAt;

      return NextResponse.json({
        contract: {
          ...cData,
          signedAt,
        },
      });
    }

    return NextResponse.json({ contract: null });
  } catch (error: any) {
    console.error("[GET_CONTRATO_ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao consultar contrato." },
      { status: 500 }
    );
  }
}
