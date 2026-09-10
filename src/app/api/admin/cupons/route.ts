import { NextResponse, type NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { validateAdminToken } from "@/lib/admin-auth";

async function getAdminFromRequest(request: Request) {
  const authHeader = request.headers.get("authorization");
  let token = authHeader?.replace(/^Bearer /i, "") || null;

  if (!token) {
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(/firebase-id-token=([^;]+)/);
    if (match) {
      token = decodeURIComponent(match[1]);
    }
  }

  return await validateAdminToken(token);
}

export async function GET(request: Request) {
  try {
    const adminUser = await getAdminFromRequest(request);
    if (!adminUser) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const db = adminDb;
    const snapshot = await db.collection("coupons").orderBy("createdAt", "desc").get();
    const coupons = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ coupons });
  } catch (error: any) {
    console.error("Erro GET coupons:", error);
    return NextResponse.json({ error: "Erro ao buscar cupons" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const adminUser = await getAdminFromRequest(request);
    if (!adminUser) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const body = await request.json();
    const { code, discountPercentage, expiresAt } = body;

    if (!code || !discountPercentage) {
      return NextResponse.json({ error: "Faltam parâmetros" }, { status: 400 });
    }

    const db = adminDb;
    const cleanCode = String(code).toUpperCase().trim();

    const existing = await db.collection("coupons").doc(cleanCode).get();
    if (existing.exists) {
      return NextResponse.json({ error: "Este código de cupom já existe" }, { status: 400 });
    }

    const couponData: Record<string, any> = {
      code: cleanCode,
      discountPercentage: Number(discountPercentage),
      active: true,
      createdAt: new Date().toISOString(),
    };

    // Validade opcional: salvar apenas se fornecida e válida
    if (expiresAt) {
      const expiresDate = new Date(expiresAt);
      if (!isNaN(expiresDate.getTime())) {
        couponData.expiresAt = expiresDate.toISOString();
      }
    }

    await db.collection("coupons").doc(cleanCode).set(couponData);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro POST coupons:", error);
    return NextResponse.json({ error: error?.message || "Erro ao criar cupom" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const adminUser = await getAdminFromRequest(request);
    if (!adminUser) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) return NextResponse.json({ error: "Code missing" }, { status: 400 });

    const db = adminDb;
    await db.collection("coupons").doc(code).delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro DELETE coupons:", error);
    return NextResponse.json({ error: "Erro ao deletar cupom" }, { status: 500 });
  }
}
