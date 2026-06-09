import { NextResponse, type NextRequest } from "next/server";
import { validateAdminToken } from "@/lib/admin-auth";
import { getPlatformStats, getRecentSignups } from "@/lib/services/admin-dashboard-service";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("firebase-id-token")?.value ?? null;
  const admin = await validateAdminToken(token);

  if (!admin) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  try {
    const [stats, signups] = await Promise.all([
      getPlatformStats(),
      getRecentSignups(30),
    ]);

    return NextResponse.json({ stats, signups }, { status: 200 });
  } catch (err: any) {
    console.error("[ADMIN_STATS] Erro:", err);
    return NextResponse.json({ error: "Falha ao buscar estatísticas." }, { status: 500 });
  }
}
