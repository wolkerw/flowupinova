import { NextResponse, type NextRequest } from "next/server";
import { validateAdminToken } from "@/lib/admin-auth";
import { getAllUsersWithStats } from "@/lib/services/admin-dashboard-service";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("firebase-id-token")?.value ?? null;
  const admin = await validateAdminToken(token);

  if (!admin) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  try {
    const users = await getAllUsersWithStats();
    return NextResponse.json({ users }, { status: 200 });
  } catch (err: any) {
    console.error("[ADMIN_USERS] Erro:", err);
    return NextResponse.json({ error: "Falha ao buscar usuários." }, { status: 500 });
  }
}
