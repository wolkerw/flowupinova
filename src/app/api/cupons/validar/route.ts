import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { publicApiRateLimit, getIpFromRequest } from "@/lib/rate-limit";

export async function GET(request: Request) {
  try {
    const ip = getIpFromRequest(request);
    const { success, limit, reset, remaining } = await publicApiRateLimit.limit(`coupon_val_${ip}`);

    if (!success) {
      return NextResponse.json(
        { error: "Muitas tentativas de validação. Tente novamente mais tarde." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
          },
        }
      );
    }

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

    // Verificar validade por data de expiração
    if (data.expiresAt) {
      const expiresDate = new Date(data.expiresAt);
      if (!isNaN(expiresDate.getTime()) && new Date() > expiresDate) {
        return NextResponse.json({ valid: false, error: "Cupom expirado." });
      }
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
