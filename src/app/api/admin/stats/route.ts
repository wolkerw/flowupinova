import { NextResponse, type NextRequest } from "next/server";
import { validateAdminToken } from "@/lib/admin-auth";
import {
  getPlatformStats,
  getRecentSignups,
  getRecentImageGenerations,
  getRecentImageModelsUsage,
} from "@/lib/services/admin-dashboard-service";
import { getGoogleAIStudioRealStats } from "@/lib/services/google-ai-studio-service";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("firebase-id-token")?.value ?? null;
  const admin = await validateAdminToken(token);

  if (!admin) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  try {
    const daysParam = request.nextUrl.searchParams.get("days");
    const days = daysParam !== null ? parseInt(daysParam, 10) : 30;

    const [stats, signups, dailyImages, imageModelsUsage, googleAiStudio] = await Promise.all([
      getPlatformStats(days),
      getRecentSignups(days > 0 ? days : 30),
      getRecentImageGenerations(days > 0 ? days : 30),
      getRecentImageModelsUsage(days),
      getGoogleAIStudioRealStats(days),
    ]);

    return NextResponse.json(
      { stats, signups, dailyImages, imageModelsUsage, googleAiStudio, periodDays: days },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[ADMIN_STATS] Erro:", err);
    return NextResponse.json({ error: "Falha ao buscar estatísticas." }, { status: 500 });
  }
}
