import { NextResponse, type NextRequest } from "next/server";
import { getUidFromCookie } from "@/lib/firebase-admin";
import { getMetaConnectionAdmin } from "@/lib/services/meta-service-admin";

const TRANSLATION_MAP: Record<string, string> = {
  "people in brazil who prefer high-value goods": "pessoas no Brasil que preferem produtos de alto valor",
  "people who prefer high-value goods": "pessoas que preferem produtos de alto valor",
  "frequent international travelers": "viajantes internacionais frequentes",
  "frequent travelers": "viajantes frequentes",
  "upcoming birthday": "aniversariantes em breve",
  "close friends of people with a birthday": "amigos próximos de aniversariantes",
  "close friends of": "amigos próximos de",
  "new job": "novo emprego",
  "newlywed": "recém-casados",
  "recently moved": "mudou-se recentemente",
  "travel & tourism business": "negócios de viagem e turismo",
  "travel & tourism": "viagem e turismo",
  "travel": "viagem",
  "tourism": "turismo",
  "cruises": "cruzeiros",
  "business": "negócios",
  "interests": "interesses",
  "behaviors": "comportamentos",
  "demographics": "dados demográficos",
  "shopping": "compras",
  "fashion": "moda",
  "food": "alimentação",
  "drink": "bebidas",
  "sports": "esportes",
  "technology": "tecnologia",
  "fitness": "fitness",
  "wellness": "bem-estar",
  "entertainment": "entretenimento",
  "hobbies": "hobbies",
  "activities": "atividades",
  "travelers": "viajantes",
  "frequent": "frequentes",
  "international": "internacionais",
  "family": "família",
  "relationships": "relacionamentos",
  "outdoor": "ao ar livre",
  "outdoors": "ao ar livre",
  "home": "casa",
  "garden": "jardim",
  "beauty": "beleza",
  "salon": "salão",
  "cosmetics": "cosméticos",
  "pets": "animais de estimação",
  "dogs": "cães",
  "cats": "gatos",
  "education": "educação",
  "services": "serviços",
  "marketing": "marketing",
  "digital": "digital",
  "advertising": "publicidade",
  "real estate": "mercado imobiliário"
};

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
  work_positions: "Cargo"
};

const translationCache = new Map<string, string>();

const translateWordByWord = (text: string): string => {
  if (!text) return "";
  let translated = text;
  
  const keys = Object.keys(TRANSLATION_MAP).sort((a, b) => b.length - a.length);
  
  for (const key of keys) {
    const regex = new RegExp(`\\b${key}\\b`, "gi");
    translated = translated.replace(regex, (match) => {
      const replaced = TRANSLATION_MAP[key];
      if (match[0] === match[0].toUpperCase()) {
        return replaced[0].toUpperCase() + replaced.slice(1);
      }
      return replaced;
    });
  }
  
  translated = translated.replace(/\s*&\s*/g, " e ");
  
  return translated;
};

async function translateText(text: string): Promise<string> {
  const trimmed = String(text || "").trim();
  if (!trimmed) return "";
  
  const cacheKey = trimmed.toLowerCase();
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=${encodeURIComponent(trimmed)}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const translated = data?.[0]?.map((item: any) => item?.[0]).join("") || trimmed;
      if (translated) {
        translationCache.set(cacheKey, translated);
        return translated;
      }
    }
  } catch (err) {
    console.warn("[TRANSLATION_API] Erro ao traduzir no Google Translate, usando fallback de dicionário:", err);
  }

  return translateWordByWord(trimmed);
}

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

    if (adAccountId) {
      const cleanAdAccountId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
      const metaUrl = `https://graph.facebook.com/v24.0/${cleanAdAccountId}/targetingsearch?q=${encodeURIComponent(q)}&locale=pt_BR&access_token=${metaConnection.accessToken}`;
      
      const metaRes = await fetch(metaUrl);
      const metaData = await metaRes.json();

      if (metaRes.ok && metaData.data) {
        interests = await Promise.all(
          metaData.data.map(async (item: any) => ({
            id: item.id,
            name: await translateText(item.name),
            type: translateType(item.type || item.class || "interests"),
            audienceSizeMin: item.audience_size_lower_bound || item.audience_size || null,
            audienceSizeMax: item.audience_size_upper_bound || item.audience_size || null,
            path: await Promise.all((item.path || []).map((p: string) => translateText(p))),
            description: await translateText(item.description || "")
          }))
        );
      } else {
        console.warn("[API_INTERESTS] Falha no targetingsearch, usando fallback de busca genérica:", metaData);
      }
    }

    if (interests.length === 0) {
      const fallbackUrl = `https://graph.facebook.com/v24.0/search?type=adinterest&q=${encodeURIComponent(q)}&locale=pt_BR&access_token=${metaConnection.accessToken}`;
      
      const fallbackRes = await fetch(fallbackUrl);
      const fallbackData = await fallbackRes.json();

      if (!fallbackRes.ok) {
        console.error("[API_INTERESTS] Erro na busca genérica do Facebook Graph Search API:", fallbackData);
        return NextResponse.json(
          { success: false, error: fallbackData.error?.message || "Erro ao consultar interesses no Facebook." },
          { status: fallbackRes.status }
        );
      }

      interests = await Promise.all(
        (fallbackData.data || []).map(async (item: any) => ({
          id: item.id,
          name: await translateText(item.name),
          type: "Interesse",
          audienceSizeMin: item.audience_size_lower_bound || null,
          audienceSizeMax: item.audience_size_upper_bound || null,
          path: await Promise.all((item.path || []).map((p: string) => translateText(p))),
          description: await translateText(item.description || "")
        }))
      );
    }

    return NextResponse.json({
      success: true,
      interests
    });

  } catch (error: any) {
    console.error("[API_INTERESTS] Erro interno no endpoint de interesses:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
