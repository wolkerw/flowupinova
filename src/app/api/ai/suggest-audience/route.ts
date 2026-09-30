import { NextResponse, type NextRequest } from "next/server";
import { getUidFromCookie } from "@/lib/firebase-admin";
import { getMetaConnectionAdmin } from "@/lib/services/meta-service-admin";

export const maxDuration = 300;

const DEFAULT_META_INTEREST_MAP: Record<string, Array<{ id: string; name: string; type: string }>> = {
  alimentacao: [
    { id: "6003415019460", name: "Gastronomia", type: "interests" },
    { id: "6003325727945", name: "Hambúrguer", type: "interests" },
    { id: "6003668857118", name: "Pizza", type: "interests" },
    { id: "6003436950375", name: "Restaurantes", type: "interests" },
  ],
  beleza: [
    { id: "6003088846792", name: "Salão de beleza", type: "interests" },
    { id: "6002839660079", name: "Cosméticos", type: "interests" },
    { id: "6003058986332", name: "Cabelo", type: "interests" },
  ],
  moda: [
    { id: "6003456388203", name: "Roupas", type: "interests" },
    { id: "6003348453981", name: "Calçados", type: "interests" },
    { id: "6003346592981", name: "Compras online", type: "interests" },
  ],
  padrao: [
    { id: "6003346592981", name: "Compras online", type: "interests" },
    { id: "6003415019460", name: "Gastronomia", type: "interests" },
    { id: "6003349442621", name: "Entretenimento", type: "interests" },
  ],
};

export async function POST(request: NextRequest) {
  try {
    const uid = await getUidFromCookie();
    if (!uid) {
      return NextResponse.json(
        { success: false, error: "Usuário não autenticado." },
        { status: 401 }
      );
    }

    const {
      postText = "",
      postImageUrl = "",
      businessAddress = "",
      businessCategory = "",
      objective = "MESSAGES",
      userQuery = "",
      currentAudience = null,
    } = await request.json();

    let metaToken: string | null = null;
    try {
      const metaConn = await getMetaConnectionAdmin(uid);
      if (metaConn?.isConnected && metaConn?.accessToken) {
        metaToken = metaConn.accessToken;
      }
    } catch (err) {
      console.warn("[SUGGEST_AUDIENCE] Aviso ao buscar token Meta do admin:", err);
    }

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
      "AIzaSyD2guuZbx-YhbrQD_-kEHCRlPyjcmVAiwE";

    // Determinar objetivo da Meta API e CTA correspondente
    let backendObjective = "WHATSAPP";
    let backendCtaType = "WHATSAPP_MESSAGE";
    if (objective === "LINK_CLICKS") {
      backendObjective = "TRAFFIC";
      backendCtaType = "LEARN_MORE";
    } else if (objective === "PROFILE_VISITS" || objective === "LOCAL_REACH") {
      backendObjective = "REACH";
      backendCtaType = "LEARN_MORE";
    }

    const categoryKey = String(businessCategory || "").toLowerCase();
    let defaultInterests = DEFAULT_META_INTEREST_MAP.padrao;
    if (categoryKey.includes("alimento") || categoryKey.includes("comida") || categoryKey.includes("restaurante")) {
      defaultInterests = DEFAULT_META_INTEREST_MAP.alimentacao;
    } else if (categoryKey.includes("beleza") || categoryKey.includes("estetic") || categoryKey.includes("salao")) {
      defaultInterests = DEFAULT_META_INTEREST_MAP.beleza;
    } else if (categoryKey.includes("moda") || categoryKey.includes("roupa")) {
      defaultInterests = DEFAULT_META_INTEREST_MAP.moda;
    }

    const defaultFallbackAudience = {
      ageMin: 20,
      ageMax: 55,
      radiusKm: 10,
      interests: defaultInterests.map((i) => i.name).join(", "),
      metaInterests: defaultInterests,
      suggestedBudgetDaily: 15,
      suggestedDurationDays: 3,
      explanation:
        "Selecionamos um público altamente qualificado na sua cidade para gerar os melhores resultados de campanha na Meta.",
      ctaType: backendCtaType,
      campaignObjective: backendObjective,
      headline: "Aproveite nossa oferta especial!",
      bodyText: postText || "Confira nossas novidades e ofertas imperdíveis!",
    };

    if (!apiKey) {
      return NextResponse.json({
        success: true,
        audience: defaultFallbackAudience,
      });
    }

    const currentYear = new Date().getFullYear();

    let prompt = "";
    if (userQuery) {
      prompt = `Você é um agente Copiloto especialista em tráfego pago Meta Ads conversando interativamente em português (ano ${currentYear}).

DADOS DA PUBLICAÇÃO E NEGÓCIO:
- Texto do Post: "${postText || "Publicação promocional do negócio"}"
- Endereço / Local: "${businessAddress || "Brasil / Cidade local"}"
- Categoria do Negócio: "${businessCategory || "Comércio / Serviços Locais"}"
- Objetivo Selecionado: "${objective}"

CONFIGURAÇÕES ATUAIS DA CAMPANHA:
${currentAudience ? JSON.stringify(currentAudience) : "Idade: 20-55, Raio: 10km, Orçamento: R$15/dia"}

MENSAGEM DO USUÁRIO: "${userQuery}"

REGRAS DE RESPOSTA (JSON Estrito):
1. Se a mensagem for uma saudação ou dúvida geral (ex: "oi", "boa tarde", "como funciona?"), responda no campo "explanation" de forma natural, amigável e prestativa em 1 ou 2 frases, mantendo as configurações atuais.
2. Se o usuário pedir alterações nas configurações (ex: "Aumente o raio para 20km", "Altere a idade para 18 a 40", "Aumente o orçamento para R$ 25"), aplique os novos valores e no campo "explanation" confirme o ajuste feito e o impacto na campanha.

Formato JSON esperado:
{
  "audience": {
    "ageMin": ${currentAudience?.ageMin || 20},
    "ageMax": ${currentAudience?.ageMax || 55},
    "radiusKm": ${currentAudience?.radiusKm || 10},
    "interests": "${currentAudience?.interests || defaultFallbackAudience.interests}",
    "suggestedBudgetDaily": ${currentAudience?.suggestedBudgetDaily || 15},
    "suggestedDurationDays": ${currentAudience?.suggestedDurationDays || 3},
    "headline": "${currentAudience?.headline || defaultFallbackAudience.headline}",
    "explanation": "Explicação ou resposta direta da IA para o usuário."
  }
}
`.trim();
    } else {
      prompt = `Você é um especialista sênior em anúncios da Meta (Facebook e Instagram) e estrategista de tráfego pago para pequenos e médios negócios no Brasil (ano ${currentYear}).

Sua missão é analisar os dados de uma publicação e o objetivo comercial para gerar uma campanha 100% pronta para publicação na Meta Ads.

DADOS DA PUBLICAÇÃO E NEGÓCIO:
- Texto do Post: "${postText || "Publicação promocional do negócio"}"
- Endereço / Local do Negócio: "${businessAddress || "Brasil / Cidade local"}"
- Categoria do Negócio: "${businessCategory || "Comércio / Serviços Locais"}"
- Objetivo Selecionado: "${objective}" (MESSAGES, PROFILE_VISITS, LINK_CLICKS, LOCAL_REACH)

REGRAS DE RESPOSTA (JSON Estrito):
1. "ageMin": Idade mínima (18 a 65).
2. "ageMax": Idade máxima (20 a 65).
3. "radiusKm": Raio em km (5, 10, 15 ou 25).
4. "interests": String com 3 a 5 palavras-chave de interesses em português separadas por vírgula.
5. "suggestedBudgetDaily": Valor inteiro em Reais (R$) por dia (10 a 30).
6. "suggestedDurationDays": Duração inteira em dias (3 a 7).
7. "headline": Título magnético e curto para o anúncio na Meta (máximo 35 caracteres).
8. "explanation": Explicação didática de 2 frases sobre por que essa segmentação foi escolhida.

Formato JSON esperado:
{
  "audience": {
    "ageMin": 20,
    "ageMax": 50,
    "radiusKm": 10,
    "interests": "Gastronomia, Hambúrguer, Pizza, Delivery",
    "suggestedBudgetDaily": 15,
    "suggestedDurationDays": 3,
    "headline": "Sabor Irresistível Perto de Você!",
    "explanation": "Configuramos um público local próximo ao seu endereço com interesse em gastronomia para atrair pedidos diretos."
  }
}
`.trim();
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    });

    if (!geminiResponse.ok) {
      return NextResponse.json({
        success: true,
        audience: defaultFallbackAudience,
      });
    }

    const data = await geminiResponse.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return NextResponse.json({
        success: true,
        audience: defaultFallbackAudience,
      });
    }

    let parsedAudience: any = defaultFallbackAudience;
    try {
      const parsed = JSON.parse(rawText.trim());
      if (parsed.audience) {
        parsedAudience = {
          ...defaultFallbackAudience,
          ageMin: Number(parsed.audience.ageMin) || 20,
          ageMax: Number(parsed.audience.ageMax) || 55,
          radiusKm: Number(parsed.audience.radiusKm) || 10,
          interests: String(parsed.audience.interests || defaultFallbackAudience.interests),
          suggestedBudgetDaily: Number(parsed.audience.suggestedBudgetDaily) || 15,
          suggestedDurationDays: Number(parsed.audience.suggestedDurationDays) || 3,
          headline: String(parsed.audience.headline || defaultFallbackAudience.headline),
          explanation: String(parsed.audience.explanation || defaultFallbackAudience.explanation),
        };
      }
    } catch {
      // Ignora erro e mantêm fallback seguro
    }

    // Se houver token da Meta, consultar mídias/interesses oficiais da Meta Graph API para resolver IDs reais
    let realMetaInterests: Array<{ id: string; name: string; type: string }> = defaultInterests;
    if (metaToken && parsedAudience.interests) {
      try {
        const keywords = parsedAudience.interests
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean);

        const fetchedList: Array<{ id: string; name: string; type: string }> = [];

        await Promise.all(
          keywords.slice(0, 3).map(async (kw: string) => {
            try {
              const url = `https://graph.facebook.com/v24.0/search?type=adinterest&q=${encodeURIComponent(kw)}&locale=pt_BR&limit=2&access_token=${metaToken}`;
              const res = await fetch(url);
              const data = await res.json();
              if (res.ok && Array.isArray(data.data)) {
                data.data.forEach((item: any) => {
                  fetchedList.push({
                    id: String(item.id),
                    name: item.name,
                    type: "interests",
                  });
                });
              }
            } catch {
              // ignora erro individual de busca de palavra-chave
            }
          })
        );

        if (fetchedList.length > 0) {
          realMetaInterests = fetchedList;
        }
      } catch (err) {
        console.warn("[SUGGEST_AUDIENCE] Erro na consulta de interesses Meta:", err);
      }
    }

    return NextResponse.json({
      success: true,
      audience: {
        ...parsedAudience,
        metaInterests: realMetaInterests,
      },
    });
  } catch (error: any) {
    console.error("[SUGGEST_AUDIENCE] Erro crítico:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
