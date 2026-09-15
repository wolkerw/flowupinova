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

    // Helper para limpar sufixos entre parênteses (ex: "Moda Feminina (apparel)" -> "Moda Feminina")
    const cleanInterestName = (name: string) => {
      return name.replace(/\s*\([^)]*\)/g, "").trim();
    };

    const cleanSelectedList = selectedList.map(cleanInterestName).filter(Boolean);

    // 1. Se o usuário já selecionou interesses -> Busca sugestões dinâmicas via adinterestsuggestion na Meta
    if (cleanSelectedList.length > 0) {
      try {
        const jsonList = JSON.stringify(cleanSelectedList);
        const suggestionUrl = `https://graph.facebook.com/v24.0/search?type=adinterestsuggestion&interest_list=${encodeURIComponent(jsonList)}&locale=pt_BR&limit=20&access_token=${token}`;

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
        console.warn("[API_INTERESTS_SUGGESTIONS] Aviso na busca de adinterestsuggestion:", err);
      }
    }

    // 2. Se a Meta adinterestsuggestion retornar poucos/nenhum resultado -> Buscar via palavras-chave derivadas dos interesses selecionados
    if (suggestions.length < 5 && cleanSelectedList.length > 0) {
      const derivedKeywords: string[] = [];

      cleanSelectedList.forEach((item) => {
        derivedKeywords.push(item);
        const words = item.split(" ").filter((w) => w.length > 3);
        derivedKeywords.push(...words);
      });

      const uniqueDerived = Array.from(new Set(derivedKeywords)).slice(0, 4);

      const derivedPromises = uniqueDerived.map(async (kw) => {
        try {
          const url = `https://graph.facebook.com/v24.0/search?type=adinterest&q=${encodeURIComponent(kw)}&locale=pt_BR&limit=5&access_token=${token}`;
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
          // ignora falha individual
        }
        return [];
      });

      const derivedResults = await Promise.all(derivedPromises);
      const tempMap = new Map<string, { id: string; name: string; type?: string }>();
      suggestions.forEach((s) => tempMap.set(s.id, s));

      for (const arr of derivedResults) {
        for (const item of arr) {
          if (!tempMap.has(item.id)) {
            tempMap.set(item.id, item);
          }
        }
      }
      suggestions = Array.from(tempMap.values());
    }

    // 3. Se ainda estiver sem sugestões -> inferir categoria do negócio ou dos nomes selecionados
    if (suggestions.length === 0) {
      let inferredCategory = category;

      if (!inferredCategory && selectedParam) {
        const selLower = selectedParam.toLowerCase();
        if (selLower.includes("moda") || selLower.includes("roupa") || selLower.includes("apparel") || selLower.includes("boutique") || selLower.includes("clothing")) {
          inferredCategory = "moda";
        } else if (selLower.includes("gastronomia") || selLower.includes("comida") || selLower.includes("restaurante") || selLower.includes("hamburguer") || selLower.includes("pizza") || selLower.includes("cuisine")) {
          inferredCategory = "alimentacao";
        } else if (selLower.includes("beleza") || selLower.includes("cosmetico") || selLower.includes("estetica") || selLower.includes("cabelo") || selLower.includes("beauty")) {
          inferredCategory = "beleza";
        }
      }

      const keywords = getCategoryKeywords(inferredCategory);
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

    // Filtrar interesses que já foram selecionados (por ID ou nome limpo)
    const selectedLower = selectedList.map((s) => cleanInterestName(s).toLowerCase());
    const filteredSuggestions = suggestions
      .filter((s) => {
        const sClean = cleanInterestName(s.name).toLowerCase();
        return (
          !selectedLower.includes(sClean) &&
          !selectedList.includes(s.id) &&
          !selectedList.includes(s.name)
        );
      })
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
