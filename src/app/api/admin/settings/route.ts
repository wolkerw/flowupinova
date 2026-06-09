import { NextResponse, type NextRequest } from "next/server";
import { validateAdminToken } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase-admin";
import type { GlobalSettings } from "@/lib/services/settings-service-admin";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("firebase-id-token")?.value ?? null;
  const admin = await validateAdminToken(token);

  if (!admin) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  try {
    const snap = await adminDb.collection("settings").doc("global").get();
    return NextResponse.json({ settings: snap.exists ? snap.data() : {} }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: "Falha ao buscar configurações." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get("firebase-id-token")?.value ?? null;
  const admin = await validateAdminToken(token);

  if (!admin) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  try {
    const body: Partial<GlobalSettings> = await request.json();
    await adminDb.collection("settings").doc("global").set(body, { merge: true });
    console.log(`[ADMIN_SETTINGS] Admin ${admin.email} atualizou as configurações globais.`);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: "Falha ao salvar configurações." }, { status: 500 });
  }
}
