import { NextResponse, type NextRequest } from "next/server";
import { getUidFromCookie } from "@/lib/firebase-admin";
import { getMetaConnectionAdmin } from "@/lib/services/meta-service-admin";

const CATEGORY_KEYWORDS_MAP: Record<string, string[]> = {
  alimentacao: ["Gastronomia", "Restaurante", "Comida", "Hamburguer", "Pizza"],
  beleza: ["Beleza", "Salão de beleza", "Estética", "Cosméticos", "Cabelo"],
  moda: ["Moda", "Roupas", "Calçados", "Acessórios", "Compras online"],
  saude: ["Saúde", "Fitness", "Academia", "Bem-estar", "Nutrição"],
  servicos: ["Negócios", "Marketing", "Empreendedorismo", "Serviços"],
};

function getCategoryKeywords(category?: string): string[] {
  const cat = String(category || "").toLowerCase().trim();
  if (cat.includes("alimento") || cat.includes("restaurante") || cat.includes("comida") || cat.includes("pizz") || cat.includes("hamburguer")) {
    return CATEGORY_KEYWORDS_MAP.alimentacao;
  }
  if (cat.includes("beleza") || cat.includes("estetic") || cat.includes("salao") || cat.includes("barbe")) {
    return CATEGORY_KEYWORDS_MAP.beleza;
  }
  if (cat.includes("moda") || cat.includes("roupa") || cat.includes("vestu") || cat.includes("calcado")) {
    return CATEGORY_KEYWORDS_MAP.moda;
  }
  if (cat.includes("saude") || cat.includes("fit") || cat.includes("acad") || cat.includes("nutri")) {
    return CATEGORY_KEYWORDS_MAP.saude;
  }
  return ["Compras online", "Gastronomia", "Entretenimento", "Viagens", "Negócios"];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "";
    const selectedParam = searchParams.get("selected") || "";

    const selectedList = selectedParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

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
        { success: false, error: "Sua conta da Meta não está conectada." },
        { status: 403 }
      );
    }

    const token = metaConnection.accessToken;
    let suggestions: Array<{ id: string; name: string; type?: string }> = [];

    // Scenario 1: User has selected interests -> Ask Meta Graph API for related suggestions
    if (selectedList.length > 0) {
      try {
        const jsonList = JSON.stringify(selectedList);
        const suggestionUrl = `https://graph.facebook.com/v24.0/search?type=adinterestsuggestion&interest_list=${encodeURIComponent(jsonList)}&locale=pt_BR&limit=15&access_token=${token}`;

        const suggestionRes = await fetch(suggestionUrl);
        const suggestionData = await suggestionRes.json();

        if (suggestionRes.ok && Array.isArray(suggestionData.data)) {
          suggestions = suggestionData.data.map((item: any) => ({
            id: String(item.id),
            name: item.name,
            type: "interests",
          }));
        }
      } catch (err) {
        console.warn("[API_INTERESTS_SUGGESTIONS] Erro na busca de adinterestsuggestion:", err);
      }
    }

    // Scenario 2: If no selected interests or adinterestsuggestion returned empty -> search by business category
    if (suggestions.length === 0) {
      const keywords = getCategoryKeywords(category);
      const searchPromises = keywords.map(async (kw) => {
        try {
          const url = `https://graph.facebook.com/v24.0/search?type=adinterest&q=${encodeURIComponent(kw)}&locale=pt_BR&limit=4&access_token=${token}`;
          const res = await fetch(url);
          const data = await res.json();
          if (res.ok && Array.isArray(data.data)) {
            return data.data.map((item: any) => ({
              id: String(item.id),
              name: item.name,
              type: "interests",
            }));
          }
        } catch {
          // Ignore individual keyword failure
        }
        return [];
      });

      const results = await Promise.all(searchPromises);
      const mergedMap = new Map<string, { id: string; name: string; type?: string }>();
      for (const arr of results) {
        for (const item of arr) {
          if (!mergedMap.has(item.id)) {
            mergedMap.set(item.id, item);
          }
        }
      }
      suggestions = Array.from(mergedMap.values());
    }

    // Filter out interests that are already selected by name or ID
    const selectedLower = selectedList.map((s) => s.toLowerCase());
    const filteredSuggestions = suggestions
      .filter((s) => !selectedLower.includes(s.name.toLowerCase()) && !selectedLower.includes(s.id))
      .slice(0, 8);

    return NextResponse.json({
      success: true,
      suggestions: filteredSuggestions,
    });
  } catch (error: any) {
    console.error("[API_INTERESTS_SUGGESTIONS] Erro ao buscar sugestões:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro interno." },
      { status: 500 }
    );
  }
}
