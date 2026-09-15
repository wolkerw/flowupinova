import { NextResponse, type NextRequest } from "next/server";
import { getUidFromCookie } from "@/lib/firebase-admin";
import { getMetaConnectionAdmin } from "@/lib/services/meta-service-admin";

const TYPE_TRANSLATIONS: Record<string, string> = {
  interests: "Interesse",
  behaviors: "Comportamento",
  demographics: "Dados demográficos",
  life_events: "Acontecimentos relevantes",
  user_device: "Dispositivo",
  mobile_device_user: "Dispositivo móvel",
  family_status: "Status familiar",
  relationship_statuses: "Status de relacionamento",
  industries: "Setor de atuação",
  income: "Faixa de renda",
  education_majors: "Área de estudo",
  education_schools: "Instituição de ensino",
  work_employers: "Empregador",
  work_positions: "Cargo",
};

const translateType = (type: string) => {
  const t = String(type || "").toLowerCase();
  return TYPE_TRANSLATIONS[t] || type || "Interesse";
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    if (!q || q.length < 2) {
      return NextResponse.json({ success: true, interests: [] });
    }

    const uid = await getUidFromCookie();
    if (!uid) {
      return NextResponse.json(
        { success: false, error: "Usuário não autenticado." },
        { status: 401 }
      );
    }

    const metaConnection = await getMetaConnectionAdmin(uid);
    if (!metaConnection.isConnected || !metaConnection.accessToken) {
      return NextResponse.json(
        { success: false, error: "Sua conta do Facebook/Instagram não está conectada." },
        { status: 403 }
      );
    }

    const adAccountId = metaConnection.adAccountId;
    let interests: any[] = [];

    // 1. Tentar busca via targetingsearch da conta de anúncios (retorna até 50 itens)
    if (adAccountId) {
      const cleanAdAccountId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
      const metaUrl = `https://graph.facebook.com/v24.0/${cleanAdAccountId}/targetingsearch?q=${encodeURIComponent(q)}&locale=pt_BR&limit=50&access_token=${metaConnection.accessToken}`;

      const metaRes = await fetch(metaUrl);
      const metaData = await metaRes.json();

      if (metaRes.ok && Array.isArray(metaData.data)) {
        interests = metaData.data.map((item: any) => ({
          id: String(item.id),
          name: item.name,
          type: translateType(item.type || item.class || "interests"),
          audienceSizeMin: item.audience_size_lower_bound || item.audience_size || null,
          audienceSizeMax: item.audience_size_upper_bound || item.audience_size || null,
          path: Array.isArray(item.path) ? item.path : [],
          description: item.description || "",
        }));
      } else {
        console.warn(
          "[API_INTERESTS] targetingsearch falhou ou retornou sem dados, tentando fallback:",
          metaData?.error || metaData
        );
      }
    }

    // 2. Fallback via Meta Graph Search API (type=adinterest)
    if (interests.length === 0) {
      const fallbackUrl = `https://graph.facebook.com/v24.0/search?type=adinterest&q=${encodeURIComponent(q)}&locale=pt_BR&limit=50&access_token=${metaConnection.accessToken}`;

      const fallbackRes = await fetch(fallbackUrl);
      const fallbackData = await fallbackRes.json();

      if (!fallbackRes.ok) {
        console.error(
          "[API_INTERESTS] Erro na busca genérica do Facebook Graph Search API:",
          fallbackData
        );
        return NextResponse.json(
          {
            success: false,
            error: fallbackData.error?.message || "Erro ao consultar interesses no Facebook.",
          },
          { status: fallbackRes.status }
        );
      }

      if (Array.isArray(fallbackData.data)) {
        interests = fallbackData.data.map((item: any) => ({
          id: String(item.id),
          name: item.name,
          type: translateType(item.type || item.topic || "interests"),
          audienceSizeMin: item.audience_size_lower_bound || item.audience_size || null,
          audienceSizeMax: item.audience_size_upper_bound || item.audience_size || null,
          path: Array.isArray(item.path) ? item.path : [],
          description: item.description || "",
        }));
      }
    }

    return NextResponse.json({
      success: true,
      interests,
    });
  } catch (error: any) {
    console.error("[API_INTERESTS] Erro interno no endpoint de interesses:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
