import { NextResponse, type NextRequest } from "next/server";
import { validateAdminToken } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase-admin";

export const maxDuration = 120; // 2 minutos máximo

export async function GET(request: NextRequest) {
  const token = request.cookies.get("firebase-id-token")?.value ?? null;
  const admin = await validateAdminToken(token);

  if (!admin) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const filterYear = searchParams.get("year") || "all";
  const filterMonth = searchParams.get("month") || "all";
  const filterDay = searchParams.get("day") || "all";

  try {
    let query = adminDb.collection("apiUsageLogs")
      .where("type", "in", ["image_generation", "avatar_generation"]);

    // Se não há filtros específicos de ano/mês/dia, limitamos aos últimos 30 dias por performance
    if (filterYear === "all" && filterMonth === "all" && filterDay === "all") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      thirtyDaysAgo.setHours(0, 0, 0, 0);
      query = query.where("createdAt", ">=", thirtyDaysAgo);
    }

    const snapshot = await query.get();
    
    // Agrupamento por dia respeitando o fuso horário local de Brasília (America/Sao_Paulo)
    const dailyStats: Record<string, { date: string; timestamp: number; count: number }> = {};
    
    let totalCount = 0;

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate?.() as Date | undefined;
      
      if (!createdAt || isNaN(createdAt.getTime())) return;

      // Conversão explícita para o fuso horário local (America/Sao_Paulo)
      const formatter = new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Sao_Paulo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      });
      
      const parts = formatter.formatToParts(createdAt);
      const dayStr = parts.find(p => p.type === "day")?.value || "";
      const monthStr = parts.find(p => p.type === "month")?.value || "";
      const yearStr = parts.find(p => p.type === "year")?.value || "";
      
      // Aplicar filtros detalhados no nível de data local se o filtro estiver ativo
      if (filterYear !== "all" && yearStr !== filterYear) return;
      if (filterMonth !== "all" && monthStr !== filterMonth) return;
      if (filterDay !== "all" && dayStr !== filterDay) return;

      const localDateKey = `${dayStr}/${monthStr}/${yearStr}`;
      
      // Criar um timestamp de comparação local para ordenação
      const localDateObj = new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr));

      if (!dailyStats[localDateKey]) {
        dailyStats[localDateKey] = {
          date: localDateKey,
          timestamp: localDateObj.getTime(),
          count: 0
        };
      }
      
      dailyStats[localDateKey].count += 1;
      totalCount += 1;
    });

    // Ordenar os dados cronologicamente
    const statsArray = Object.values(dailyStats)
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((item) => ({
        date: item.date,
        geracoes: item.count
      }));

    return NextResponse.json({ stats: statsArray, total: totalCount }, { status: 200 });
  } catch (err: any) {
    console.error("[DAILY_STATS_ERROR] Erro ao buscar estatísticas diárias:", err);
    return NextResponse.json({ error: "Falha ao buscar estatísticas diárias." }, { status: 500 });
  }
}
