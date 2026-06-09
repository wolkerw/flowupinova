import { NextResponse, type NextRequest } from "next/server";
import { validateAdminToken } from "@/lib/admin-auth";
import { getFailedPosts } from "@/lib/services/admin-dashboard-service";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("firebase-id-token")?.value ?? null;
  const admin = await validateAdminToken(token);

  if (!admin) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  try {
    const failedPosts = await getFailedPosts(50);
    return NextResponse.json({ failedPosts }, { status: 200 });
  } catch (err: any) {
    console.error("[ADMIN_LOGS] Erro:", err);
    return NextResponse.json({ error: "Falha ao buscar logs." }, { status: 500 });
  }
}
