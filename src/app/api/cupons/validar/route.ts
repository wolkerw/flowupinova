import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json({ error: "Código ausente" }, { status: 400 });
    }

    const cleanCode = String(code).toUpperCase().trim();
    const db = adminDb;
    const doc = await db.collection("coupons").doc(cleanCode).get();

    if (!doc.exists) {
      return NextResponse.json({ valid: false, error: "Cupom não encontrado." });
    }

    const data = doc.data();
    if (!data?.active) {
      return NextResponse.json({ valid: false, error: "Cupom inativo." });
    }

    return NextResponse.json({
      valid: true,
      discountPercentage: data.discountPercentage,
      code: data.code,
    });
  } catch (error: any) {
    console.error("Erro GET validar cupom:", error);
    return NextResponse.json(
      { valid: false, error: "Erro interno ao validar cupom" },
      { status: 500 }
    );
  }
}
