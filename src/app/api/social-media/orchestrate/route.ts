import { NextRequest, NextResponse } from "next/server";
import { adminDb, verifyIdToken, getUidFromCookie } from "@/lib/firebase-admin";
import type {
  CampaignFormat,
  CampaignFrequency,
  CampaignObjective,
  CampaignPostItem,
  FunnelStage,
  SocialMediaAuditReport,
  SocialMediaCampaign,
} from "@/lib/types/social-media";
import { CAMPAIGN_OBJECTIVE_LABELS } from "@/lib/types/social-media";

export const dynamic = "force-dynamic";
export const maxDuration = 180;

const DAY_NAME_TO_INDEX: Record<string, number> = {
  "Domingo": 0,
  "Segunda-feira": 1,
  "Terça-feira": 2,
  "Quarta-feira": 3,
  "Quinta-feira": 4,
  "Sexta-feira": 5,
  "Sábado": 6,
};

const INDEX_TO_DAY_NAME: Record<number, string> = {
  0: "Domingo",
  1: "Segunda-feira",
  2: "Terça-feira",
  3: "Quarta-feira",
  4: "Quinta-feira",
  5: "Sexta-feira",
  6: "Sábado",
};

const DEFAULT_DAYS_BY_FREQ: Record<CampaignFrequency, string[]> = {
  2: ["Terça-feira", "Quinta-feira"],
  3: ["Terça-feira", "Quinta-feira", "Sábado"],
  5: ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira"],
};

async function resolveUserId(request: NextRequest, bodyUserId?: string): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.slice(7);
      const decoded = await verifyIdToken(token);
      if (decoded?.uid) return decoded.uid;
    } catch {
      // Fallback
    }
  }
  try {
    const cookieUid = await getUidFromCookie();
    if (cookieUid) return cookieUid;
  } catch {
    // Fallback
  }
  return bodyUserId || null;
}

function buildScheduleSlots(
  frequencyPerWeek: CampaignFrequency,
  durationWeeks: number,
  preferredDays: string[],
  bestHours: string[]
): Array<{
  dayIndex: number;
  weekNumber: number;
  scheduledDate: string;
  dayOfWeekLabel: string;
  suggestedTime: string;
}> {
  const validDays =
    preferredDays.length === frequencyPerWeek
      ? preferredDays
      : DEFAULT_DAYS_BY_FREQ[frequencyPerWeek] || DEFAULT_DAYS_BY_FREQ[3];

  const targetDayIndices = validDays
    .map((d) => DAY_NAME_TO_INDEX[d] ?? 2)
    .sort((a, b) => a - b);

  const slots: Array<{
    dayIndex: number;
    weekNumber: number;
    scheduledDate: string;
    dayOfWeekLabel: string;
    suggestedTime: string;
  }> = [];

  const totalPosts = frequencyPerWeek * durationWeeks;
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);
  // Começa a partir de amanhã para dar tempo de produção
  cursor.setDate(cursor.getDate() + 1);

  let dayCounter = 0;
  while (slots.length < totalPosts && dayCounter < 120) {
    const dow = cursor.getDay();
    if (targetDayIndices.includes(dow)) {
      const idx = slots.length;
      const weekNumber = Math.floor(idx / frequencyPerWeek) + 1;
      const yyyy = cursor.getFullYear();
      const mm = String(cursor.getMonth() + 1).padStart(2, "0");
      const dd = String(cursor.getDate()).padStart(2, "0");
      const suggestedTime =
        bestHours[idx % Math.max(1, bestHours.length)] || (idx % 2 === 0 ? "19:00" : "12:30");

      slots.push({
        dayIndex: idx + 1,
        weekNumber,
        scheduledDate: `${yyyy}-${mm}-${dd}`,
        dayOfWeekLabel: INDEX_TO_DAY_NAME[dow] || "Terça-feira",
        suggestedTime,
      });
    }
    cursor.setDate(cursor.getDate() + 1);
    dayCounter++;
  }

  return slots;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = await resolveUserId(request, body?.userId);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Usuário não autenticado." },
        { status: 401 }
      );
    }

    const objective: CampaignObjective =
      body?.objective &&
      ["engagement", "sales_launch", "authority", "local_social_selling"].includes(body.objective)
        ? body.objective
        : "engagement";

    const frequencyPerWeek: CampaignFrequency =
      body?.frequencyPerWeek === 2 || body?.frequencyPerWeek === 3 || body?.frequencyPerWeek === 5
        ? body.frequencyPerWeek
        : 3;

    const durationWeeks = Math.min(4, Math.max(1, Number(body?.durationWeeks || 2)));
    const customThemeOrOffer = String(body?.customThemeOrOffer || "").trim();
    const preferredDays: string[] = Array.isArray(body?.preferredDays)
      ? body.preferredDays
      : DEFAULT_DAYS_BY_FREQ[frequencyPerWeek];

    // 1. Carregar Auditoria mais recente e Brand Book do usuário
    const userRef = adminDb.collection("users").doc(userId);
    const [auditSnap, onboardingSnap] = await Promise.all([
      userRef.collection("social_audits").doc("latest").get(),
      userRef.collection("business").doc("onboarding").get(),
    ]);

    const auditReport = auditSnap.exists
      ? (auditSnap.data() as SocialMediaAuditReport)
      : null;
    const businessProfile = onboardingSnap.exists ? (onboardingSnap.data() as any) : {};

    const brandName =
      businessProfile?.name || auditReport?.accountName || auditReport?.username || "Sua Marca";
    const category = businessProfile?.category || "Produtos e Serviços";
    const description = businessProfile?.description || auditReport?.biography || "";
    const targetAudience =
      businessProfile?.targetAudience || "Clientes que buscam qualidade e confiança";
    const toneOfVoice = businessProfile?.toneOfVoice || "Consultivo, próximo e profissional";
    const slogan = businessProfile?.slogan || "";

    const bestHours = auditReport?.metrics?.bestHoursToPost?.length
      ? auditReport.metrics.bestHoursToPost
      : ["12:30", "19:00"];

    const slots = buildScheduleSlots(
      frequencyPerWeek,
      durationWeeks,
      preferredDays,
      bestHours
    );

    const objectiveMeta = CAMPAIGN_OBJECTIVE_LABELS[objective];

    const slotsDescription = slots
      .map(
        (s) =>
          `Post #${s.dayIndex} (Semana ${s.weekNumber} - ${s.dayOfWeekLabel}, ${s.scheduledDate} às ${s.suggestedTime})`
      )
      .join("\n");

    const orchestratorPrompt = `Você é um Estrategista Chefe de Social Media, Roteirista de Reels Virais e Copywriter Sênior.
Crie um Plano de Campanha Completo e Prático em Português do Brasil para o perfil abaixo, respeitando EXATAMENTE os ${slots.length} slots de publicação solicitados.

# CONTEXTO DA MARCA E AUDITORIA VIA API
- Marca / Perfil: ${brandName} (${auditReport?.username || "@instagram"})
- Nicho / Segmento: ${category}
- Sobre o Negócio: ${description}
- Slogan: ${slogan}
- Público-Alvo: ${targetAudience}
- Tom de Voz: ${toneOfVoice}
- Score Atual da Auditoria: ${auditReport?.overallScore ?? 70}/100
- Gargalos Detectados na Conta: ${auditReport?.bottlenecks?.join(" | ") || "Aumentar frequência e diversificar formatos"}
- Melhor Formato Histórico: ${auditReport?.metrics?.bestPerformingFormat || "Reels e Carrossel"}

# PARÂMETROS DA CAMPANHA SOLICITADA
- Objetivo Principal: ${objectiveMeta.label} (${objectiveMeta.subtitle})
- Constância: ${frequencyPerWeek}x por semana durante ${durationWeeks} semana(s) (Total: ${slots.length} publicações)
${customThemeOrOffer ? `- Tema / Produto / Oferta em Destaque solicitado pelo usuário: "${customThemeOrOffer}"` : ""}

# CALENDÁRIO DE SLOTS A PREENCHER (${slots.length} ITENS)
${slotsDescription}

# REGRAS DE OURO DA ORQUESTRAÇÃO
1. Alterne estrategicamente os formatos ("static_ai", "carousel_ai", "reels_organic") ao longo das semanas para equilibrar Alcance (Topo de Funil), Autoridade/Salvamentos (Meio de Funil) e Conversão/Direct (Fundo de Funil).
2. Para TODOS os posts, inclua uma sequência de 4 Stories do dia ("storiesSequence") para aquecer a audiência e um "directSellingScript" (palavra-chave de comentário + 3 mensagens de Direct para converter seguidores em clientes).
3. Se o formato for "reels_organic", preencha "reelsScript" com gancho de 3 segundos, roteiro falado, direção visual de gravação e CTA.
4. Se o formato for "carousel_ai" ou "static_ai", preencha "carouselSlides" (4 a 5 slides) e um "aiImagePrompt" rico e fotográfico (sem textos complexos na descrição da cena) para o gerador de imagem IA da plataforma.
5. Inclua também adaptações "omnichannel" (LinkedIn, TikTok e Facebook) para cada publicação.

Retorne EXCLUSIVAMENTE um JSON válido seguindo esta estrutura:
{
  "name": "Nome Estratégico da Campanha",
  "strategySummary": "Explicação executiva de 2 a 3 frases sobre a lógica desta campanha para crescer o engajamento e as vendas.",
  "editorialPillars": ["Pilar 1", "Pilar 2", "Pilar 3"],
  "posts": [
    {
      "dayIndex": 1,
      "title": "Título estratégico da publicação",
      "theme": "Pilar ou tema abordado",
      "funnelStage": "top_attraction | middle_authority | bottom_conversion",
      "format": "reels_organic | carousel_ai | static_ai",
      "caption": "Legenda pronta, persuasiva, escaneável, com emojis na medida certa e chamada para ação pedindo comentário com palavra-chave.",
      "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
      "aiImagePrompt": "Fotografia profissional de alta qualidade representando...",
      "reelsScript": {
        "hook": "Frase exata dos primeiros 3 segundos para travar o scroll",
        "body": "ROTEIRO FALADO EXATO E COMPLETO (palavra por palavra) para a pessoa falar olhando diretamente para a câmera em 30 segundos. NUNCA coloque apenas instruções vagas como 'mostre os diferenciais'. Escreva o texto falado real e natural com introdução, ponto 1, ponto 2, ponto 3 e fechamento prontos para ler ou gravar.",
        "cta": "Comente [PALAVRA] que eu te envio no Direct",
        "visualDirection": "Como gravar: enquadramento, movimento de câmera ou corte",
        "audioSuggestion": "Áudio em alta instrumental dinâmico ou voz original com legenda dinâmica",
        "durationSeconds": 30
      },
      "carouselSlides": [
        {
          "slideNumber": 1,
          "headline": "Título magnético da capa",
          "bodyText": "Subtítulo que gera curiosidade para arrastar para o lado",
          "visualHint": "Destaque visual limpo e contrastante"
        }
      ],
      "storiesSequence": [
        {
          "frameNumber": 1,
          "type": "opening",
          "scriptText": "Texto ou fala do Story 1 (Abertura/Contexto)",
          "visualSuggestion": "Foto dos bastidores ou câmera frontal falando",
          "interactiveSticker": "Enquete: Você também passa por isso? (Sim, sempre / Quero resolver)"
        },
        {
          "frameNumber": 2,
          "type": "poll_interaction",
          "scriptText": "Aprofundamento rápido gerando identificação",
          "visualSuggestion": "Texto curto sobre fundo da marca",
          "interactiveSticker": "Slider de emoji 🔥"
        },
        {
          "frameNumber": 3,
          "type": "value_content",
          "scriptText": "Dica prática + aviso do post novo no Feed",
          "visualSuggestion": "Print ou prévia borrada do post do dia no Feed",
          "interactiveSticker": "Sticker 'Novo Post' apontando para o feed"
        },
        {
          "frameNumber": 4,
          "type": "cta_link",
          "scriptText": "Chamada direta para responder o story ou clicar no link",
          "visualSuggestion": "Foto de resultado ou atendimento",
          "interactiveSticker": "Link para WhatsApp / Direct"
        }
      ],
      "directSellingScript": {
        "triggerKeyword": "QUERO",
        "openingMessage": "Olá! Vi seu comentário no post sobre [Tema]! Que ótimo ter você por aqui ✨",
        "qualificationQuestion": "Me conta rapidinho: hoje qual é o seu maior objetivo ou necessidade em relação a [Nicho]?",
        "closingCtaMessage": "Perfeito! Preparei uma condição/orientação especial para o seu caso. Posso te enviar os detalhes por aqui ou prefere no WhatsApp?"
      },
      "omnichannel": {
        "linkedin": {
          "headline": "Título corporativo/profissional para LinkedIn",
          "postText": "Adaptação executiva do conteúdo para o LinkedIn..."
        },
        "tiktok": {
          "hook": "Gancho nativo e rápido para TikTok",
          "script": "Roteiro ágil adaptado para linguagem TikTok",
          "caption": "Legenda curta + hashtags TikTok"
        },
        "facebook": {
          "postText": "Adaptação comunitária e direta para página do Facebook..."
        }
      }
    }
  ]
}`;

    let aiCampaign: any = null;
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
      for (const model of models) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: orchestratorPrompt }] }],
                generationConfig: {
                  temperature: 0.55,
                  responseMimeType: "application/json",
                },
              }),
              signal: AbortSignal.timeout(45000),
            }
          );

          if (res.ok) {
            const data = await res.json();
            const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) {
              const cleaned = rawText.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
              aiCampaign = JSON.parse(cleaned);
              break;
            }
          }
        } catch (err) {
          console.warn(`[SOCIAL_ORCHESTRATE] Falha no modelo ${model}:`, err);
        }
      }
    }

    const formatCycle: CampaignFormat[] = ["reels_organic", "carousel_ai", "static_ai"];
    const funnelCycle: FunnelStage[] = [
      "top_attraction",
      "middle_authority",
      "bottom_conversion",
    ];

    const focusTopic = customThemeOrOffer || category || "soluções da nossa marca";

    const normalizedPosts: CampaignPostItem[] = slots.map((slot, idx) => {
      const aiPost = Array.isArray(aiCampaign?.posts) ? aiCampaign.posts[idx] : null;
      const defaultFormat = formatCycle[idx % formatCycle.length];
      const defaultFunnel = funnelCycle[idx % funnelCycle.length];

      const format: CampaignFormat =
        aiPost?.format &&
        ["static_ai", "carousel_ai", "reels_organic", "stories_sequence"].includes(aiPost.format)
          ? aiPost.format
          : defaultFormat;

      const funnelStage: FunnelStage =
        aiPost?.funnelStage &&
        ["top_attraction", "middle_authority", "bottom_conversion"].includes(aiPost.funnelStage)
          ? aiPost.funnelStage
          : defaultFunnel;

      const defaultTitle =
        idx % 3 === 0
          ? `3 Segredos sobre ${focusTopic} que ninguém te conta`
          : idx % 3 === 1
            ? `Como escolher a melhor opção em ${focusTopic} passo a passo`
            : `Por que clientes exigentes escolhem a ${brandName}`;

      const title = aiPost?.title || defaultTitle;
      const theme = aiPost?.theme || (idx % 2 === 0 ? "Educação & Autoridade" : "Desejo & Conversão");
      const keyword =
        aiPost?.directSellingScript?.triggerKeyword?.toUpperCase() ||
        (idx % 2 === 0 ? "QUERO" : "SABERMAIS");

      const caption =
        aiPost?.caption ||
        `${title} ✨\n\nQuando falamos em ${focusTopic}, pequenos detalhes fazem toda a diferença no resultado final que você experimenta.\n\nNa ${brandName}, unimos excelência, atendimento próximo e soluções pensadas para facilitar o seu dia a dia.\n\n💬 Comente "${keyword}" aqui embaixo que nossa equipe te envia todas as informações diretamente no seu Direct!`;

      const hashtags =
        Array.isArray(aiPost?.hashtags) && aiPost.hashtags.length > 0
          ? aiPost.hashtags
          : [
              `#${brandName.replace(/\s+/g, "").toLowerCase()}`,
              `#${category.replace(/\s+/g, "").toLowerCase() || "negocios"}`,
              "#qualidade",
              "#dicas",
              "#atendimentopremium",
            ];

      const aiImagePrompt =
        aiPost?.aiImagePrompt ||
        `Fotografia publicitária editorial de altíssima qualidade para ${brandName} (${category}), destacando ${title}. Iluminação cinematográfica suave, composição limpa e moderna, cores alinhadas à identidade da marca.`;

      return {
        id: `item_${Date.now()}_${idx + 1}`,
        dayIndex: slot.dayIndex,
        weekNumber: slot.weekNumber,
        scheduledDate: slot.scheduledDate,
        suggestedTime: slot.suggestedTime,
        dayOfWeekLabel: slot.dayOfWeekLabel,
        title,
        theme,
        funnelStage,
        format,
        caption,
        hashtags,
        aiImagePrompt,
        reelsScript: {
          hook:
            aiPost?.reelsScript?.hook ||
            `Pare de cometer esse erro quando procurar por ${focusTopic}!`,
          body:
            aiPost?.reelsScript?.body ||
            (idx % 3 === 0
              ? `Se você ainda tenta resolver isso do jeito comum, está perdendo tempo e dinheiro.\n\nPresta atenção nesses 3 pontos essenciais:\n\n1️⃣ Primeiro: você não precisa perder horas criando tudo na mão. A automação certa estrutura suas ideias em minutos.\n\n2️⃣ Segundo: a constância estratégica é o que atrai clientes de verdade, não postar uma vez na vida.\n\n3️⃣ E terceiro: quem atende rápido e com qualidade fecha muito mais negócios na ${brandName}.\n\nQuer ver na prática como funciona no seu segmento?`
              : idx % 3 === 1
                ? `Na hora de escolher a melhor solução, não cometa o erro de olhar só para o preço.\n\nOlha esse passo a passo rápido:\n\n1️⃣ Passo 1: priorize ferramentas que simplifiquem a sua rotina em vez de complicar.\n\n2️⃣ Passo 2: busque um parceiro que ofereça padrão profissional e suporte próximo.\n\n3️⃣ Passo 3: tenha um fluxo validado para transformar novos seguidores em vendas reais.\n\nÉ exatamente isso que nós na ${brandName} fazemos todos os dias.`
                : `Você já reparou como empresas que se destacam parecem ter uma presença impecável todos os dias?\n\nNão é sorte, é método. Em vez de quebrar a cabeça todo dia, quem tem visão adota soluções inteligentes.\n\nNa ${brandName}, nós cuidamos da estratégia e da execução para você focar no atendimento dos seus clientes e no fechamento de vendas.\n\nQuer dar esse salto profissional ainda hoje?`),
          cta:
            aiPost?.reelsScript?.cta ||
            `Comente "${keyword}" aqui no vídeo que te mando o guia/condição completa no Direct!`,
          visualDirection:
            aiPost?.reelsScript?.visualDirection ||
            "Inicie com câmera frontal em ambiente bem iluminado nos primeiros 3 segundos; intercale com imagens de bastidores ou do produto/serviço em ação.",
          audioSuggestion:
            aiPost?.reelsScript?.audioSuggestion ||
            "Voz original clara com música de fundo instrumental lo-fi/upbeat em volume 12% e legendas dinâmicas na altura dos olhos.",
          durationSeconds: Number(aiPost?.reelsScript?.durationSeconds || 30),
        },
        carouselSlides:
          Array.isArray(aiPost?.carouselSlides) && aiPost.carouselSlides.length > 0
            ? aiPost.carouselSlides
            : [
                {
                  slideNumber: 1,
                  headline: title,
                  bodyText: "Arraste para o lado e descubra como ter o melhor resultado 👉",
                  visualHint: "Capa impactante com foco visual no tema principal",
                },
                {
                  slideNumber: 2,
                  headline: "O Problema mais comum",
                  bodyText: `Muitas pessoas perdem tempo e dinheiro por não avaliarem os critérios certos em ${focusTopic}.`,
                  visualHint: "Contraste visual mostrando a dúvida comum do cliente",
                },
                {
                  slideNumber: 3,
                  headline: "O Método da " + brandName,
                  bodyText: "Nossa abordagem foca em personalização, segurança e resultado comprovado.",
                  visualHint: "Destaque para o diferencial da marca",
                },
                {
                  slideNumber: 4,
                  headline: "Gostou dessa dica?",
                  bodyText: `Salve este post para consultar depois e comente "${keyword}" para falar conosco no Direct!`,
                  visualHint: "Slide final de chamada para ação (Salve + Comente)",
                },
              ],
        storiesSequence:
          Array.isArray(aiPost?.storiesSequence) && aiPost.storiesSequence.length > 0
            ? aiPost.storiesSequence
            : [
                {
                  frameNumber: 1,
                  type: "opening",
                  scriptText: `Bom dia! Hoje separei algo especial sobre ${focusTopic} que muitos clientes nos perguntam.`,
                  visualSuggestion: "Foto de bastidores do dia ou vídeo rápido de 10s",
                  interactiveSticker: "Enquete: Você tem dúvida sobre isso? (Muita! / Quero ver)",
                },
                {
                  frameNumber: 2,
                  type: "poll_interaction",
                  scriptText: `Olha só como esse detalhe transforma a experiência na ${brandName}.`,
                  visualSuggestion: "Close-up do produto, serviço ou atendimento sendo preparado",
                  interactiveSticker: "Termômetro de reação 😍",
                },
                {
                  frameNumber: 3,
                  type: "value_content",
                  scriptText: `Acabei de soltar um conteúdo completo no Feed sobre "${title}"!`,
                  visualSuggestion: "Compartilhamento do post do Feed com fundo personalizado",
                  interactiveSticker: "Toque aqui para ver o post completo 👇",
                },
                {
                  frameNumber: 4,
                  type: "cta_link",
                  scriptText: "Quer atendimento direto e prioritário? Toque no link abaixo ou responda este Story!",
                  visualSuggestion: "Card elegante com chamada para o WhatsApp ou Direct",
                  interactiveSticker: "Sticker de Link / WhatsApp",
                },
              ],
        directSellingScript: {
          triggerKeyword: keyword,
          openingMessage:
            aiPost?.directSellingScript?.openingMessage ||
            `Olá! Tudo bem? Vi seu comentário "${keyword}" no nosso post sobre ${title}! Que alegria falar com você por aqui ✨`,
          qualificationQuestion:
            aiPost?.directSellingScript?.qualificationQuestion ||
            `Para eu te orientar da melhor forma possível: você já conhece as soluções da ${brandName} ou está buscando ${focusTopic} pela primeira vez?`,
          closingCtaMessage:
            aiPost?.directSellingScript?.closingCtaMessage ||
            `Excelente! Separei as opções ideais para o seu perfil. Prefere que eu te envie o link/catálogo aqui mesmo ou te chamo no WhatsApp para agilizar?`,
        },
        omnichannel: {
          linkedin: {
            headline:
              aiPost?.omnichannel?.linkedin?.headline ||
              `${title}: Visão Estratégica por ${brandName}`,
            postText:
              aiPost?.omnichannel?.linkedin?.postText ||
              `No mercado atual de ${category}, a consistência e a atenção aos detalhes definem quem lidera a preferência do consumidor.\n\nHoje compartilhamos nossa visão sobre: ${title}.\n\nNa ${brandName}, acreditamos que entregar valor real antes mesmo da venda constrói relacionamentos duradouros.\n\nComo sua empresa ou rotina tem lidado com essa questão? Compartilhe nos comentários.`,
          },
          tiktok: {
            hook:
              aiPost?.omnichannel?.tiktok?.hook ||
              `Se você procura ${focusTopic}, precisa ver isso nos próximos 15 segundos!`,
            script:
              aiPost?.omnichannel?.tiktok?.script ||
              `1. Gancho visual imediato mostrando o antes/depois ou curiosidade.\n2. Explicação direta em 2 frases sobre ${title}.\n3. Finalize pedindo para seguir o perfil e comentar ${keyword}.`,
            caption:
              aiPost?.omnichannel?.tiktok?.caption ||
              `${title} 🔥 Comente ${keyword}! #${category.replace(/\s+/g, "").toLowerCase() || "dicas"} #fyp #viral`,
          },
          facebook: {
            postText:
              aiPost?.omnichannel?.facebook?.postText ||
              `${title} 👇\n\nNa ${brandName}, preparamos cada detalhe para oferecer o melhor em ${focusTopic}. Deixe seu comentário abaixo ou envie uma mensagem para conversar com nossa equipe!`,
          },
        },
        status: "pending",
      };
    });

    const campaignId = `camp_${Date.now()}`;
    const campaign: SocialMediaCampaign = {
      id: campaignId,
      name:
        aiCampaign?.name ||
        `Campanha ${objectiveMeta.label} (${frequencyPerWeek}x/sem • ${durationWeeks} sem)`,
      objective,
      frequencyPerWeek,
      durationWeeks,
      preferredDays:
        preferredDays.length === frequencyPerWeek
          ? preferredDays
          : DEFAULT_DAYS_BY_FREQ[frequencyPerWeek],
      strategySummary:
        aiCampaign?.strategySummary ||
        `Campanha orquestrada com base na auditoria via API da conta ${auditReport?.username || brandName}, combinando Reels para alcance, Carrosséis para salvamentos e Posts IA + Stories diários para conversão no Direct.`,
      editorialPillars:
        Array.isArray(aiCampaign?.editorialPillars) && aiCampaign.editorialPillars.length > 0
          ? aiCampaign.editorialPillars
          : [
              "Atração & Descoberta (Reels)",
              "Educação & Salvamentos (Carrossel)",
              "Prova Social & Oferta (Post IA + Direct)",
            ],
      posts: normalizedPosts,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(auditReport?.overallScore !== undefined
        ? { auditScoreAtCreation: auditReport.overallScore }
        : {}),
    };

    await userRef.collection("social_campaigns").doc(campaignId).set(campaign, { merge: true });

    return NextResponse.json({ success: true, campaign });
  } catch (error: any) {
    console.error("[SOCIAL_MEDIA_ORCHESTRATE_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Erro ao orquestrar campanha de redes sociais.",
      },
      { status: 500 }
    );
  }
}
