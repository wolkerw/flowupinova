import { NextRequest, NextResponse } from "next/server";
import { adminDb, verifyIdToken, getUidFromCookie } from "@/lib/firebase-admin";
import type {
  AnalyzedPostSummary,
  SocialMediaAuditMetrics,
  SocialMediaAuditReport,
} from "@/lib/types/social-media";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const DAYS_PT = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

async function resolveUserId(request: NextRequest, bodyUserId?: string): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.slice(7);
      const decoded = await verifyIdToken(token);
      if (decoded?.uid) return decoded.uid;
    } catch {
      // Continua para tentativa via cookie/body
    }
  }
  try {
    const cookieUid = await getUidFromCookie();
    if (cookieUid) return cookieUid;
  } catch {
    // Fallback para bodyUserId
  }
  return bodyUserId || null;
}

async function fetchPostInsightsSafe(
  postId: string,
  igToken?: string | null,
  fbTokens: string[] = []
): Promise<{ reach: number; saved: number; totalInteractions: number }> {
  const tokensToTry: Array<{ host: string; token: string }> = [];
  if (igToken) {
    tokensToTry.push({ host: "https://graph.instagram.com/v20.0", token: igToken });
  }
  for (const fbToken of fbTokens) {
    if (fbToken) {
      tokensToTry.push({ host: "https://graph.facebook.com/v20.0", token: fbToken });
    }
  }

  const metricSets = ["reach,saved,total_interactions", "reach,saved", "reach"];

  for (const { host, token } of tokensToTry) {
    for (const metrics of metricSets) {
      try {
        const url = `${host}/${encodeURIComponent(postId)}/insights?metric=${metrics}&access_token=${encodeURIComponent(token)}`;
        const res = await fetch(url, {
          cache: "no-store",
          signal: AbortSignal.timeout(4500),
        });
        if (!res.ok) continue;
        const data = await res.json();
        if (Array.isArray(data?.data) && data.data.length > 0) {
          const getVal = (name: string) => {
            const m = data.data.find((item: any) => item.name === name);
            return Number(m?.values?.[0]?.value ?? 0);
          };
          return {
            reach: getVal("reach"),
            saved: getVal("saved"),
            totalInteractions: getVal("total_interactions"),
          };
        }
      } catch {
        // Tenta próxima combinação
      }
    }
  }

  return { reach: 0, saved: 0, totalInteractions: 0 };
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

    // 1. Buscar conexões e Brand Book do usuário no Firestore
    const userRef = adminDb.collection("users").doc(userId);
    const [igSnap, metaSnap, linkedinSnap, tiktokSnap, onboardingSnap] = await Promise.all([
      userRef.collection("connections").doc("instagram").get(),
      userRef.collection("connections").doc("meta").get(),
      userRef.collection("connections").doc("linkedin").get(),
      userRef.collection("connections").doc("tiktok").get(),
      userRef.collection("business").doc("onboarding").get(),
    ]);

    const igData = igSnap.exists ? (igSnap.data() as any) : null;
    const metaData = metaSnap.exists ? (metaSnap.data() as any) : null;
    const linkedinData = linkedinSnap.exists ? (linkedinSnap.data() as any) : null;
    const tiktokData = tiktokSnap.exists ? (tiktokSnap.data() as any) : null;
    const businessProfile = onboardingSnap.exists ? (onboardingSnap.data() as any) : {};

    const isIgConnected = Boolean(igData?.isConnected && igData?.accessToken);
    const isMetaConnected = Boolean(metaData?.isConnected && (metaData?.accessToken || metaData?.userAccessToken));

    if (!isIgConnected && !isMetaConnected) {
      return NextResponse.json(
        {
          success: false,
          code: "NOT_CONNECTED",
          error:
            "Sua conta do Instagram/Facebook ainda não está conectada via API. Conecte sua rede social em Posts ou Configurações para realizar a auditoria automática.",
        },
        { status: 400 }
      );
    }

    const igAccessToken: string | null = igData?.accessToken || null;
    const fbTokens = [metaData?.accessToken, metaData?.userAccessToken].filter(Boolean) as string[];

    // 2. Coletar dados do perfil e mídias via API Oficial
    let username = igData?.instagramUsername || businessProfile?.instagram || "";
    let accountName = businessProfile?.name || metaData?.pageName || "";
    let biography = businessProfile?.description || "";
    let website = businessProfile?.website || "";
    let followersCount: number | undefined = undefined;
    let mediaCount: number | undefined = undefined;

    const rawMediaItems: any[] = [];

    if (igAccessToken) {
      // 2.1 Dados do Perfil Instagram
      try {
        const profileFields = "id,username,name,biography,website,followers_count,media_count";
        const profileRes = await fetch(
          `https://graph.instagram.com/me?fields=${profileFields}&access_token=${encodeURIComponent(igAccessToken)}`,
          { cache: "no-store", signal: AbortSignal.timeout(7000) }
        );

        if (profileRes.ok) {
          const pData = await profileRes.json();
          username = pData.username || username;
          accountName = pData.name || accountName;
          biography = pData.biography || biography;
          website = pData.website || website;
          if (typeof pData.followers_count === "number") followersCount = pData.followers_count;
          if (typeof pData.media_count === "number") mediaCount = pData.media_count;
        } else {
          // Fallback com campos básicos caso followers_count não seja permitido pelo escopo do token
          const basicRes = await fetch(
            `https://graph.instagram.com/me?fields=id,username,name,biography,website&access_token=${encodeURIComponent(igAccessToken)}`,
            { cache: "no-store", signal: AbortSignal.timeout(6000) }
          );
          if (basicRes.ok) {
            const basicData = await basicRes.json();
            username = basicData.username || username;
            accountName = basicData.name || accountName;
            biography = basicData.biography || biography;
            website = basicData.website || website;
          }
        }
      } catch (err) {
        console.warn("[SOCIAL_AUDIT] Aviso ao consultar perfil IG:", err);
      }

      // 2.2 Últimas 18 mídias do Instagram
      try {
        const mediaFields =
          "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count";
        const mediaRes = await fetch(
          `https://graph.instagram.com/me/media?fields=${mediaFields}&limit=18&access_token=${encodeURIComponent(igAccessToken)}`,
          { cache: "no-store", signal: AbortSignal.timeout(8000) }
        );
        if (mediaRes.ok) {
          const mData = await mediaRes.json();
          if (Array.isArray(mData?.data)) {
            rawMediaItems.push(...mData.data);
          }
        }
      } catch (err) {
        console.warn("[SOCIAL_AUDIT] Aviso ao consultar mídias IG:", err);
      }
    }

    // 2.3 Fallback via Meta Page / Instagram Business Account caso o token IG direto não tenha retornado mídias
    if (rawMediaItems.length === 0 && fbTokens.length > 0 && metaData?.pageId) {
      for (const fbToken of fbTokens) {
        try {
          const pageRes = await fetch(
            `https://graph.facebook.com/v20.0/${encodeURIComponent(metaData.pageId)}?fields=name,about,description,website,instagram_business_account{id,username,name,biography,website,followers_count,media_count,media.limit(18){id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count}}&access_token=${encodeURIComponent(fbToken)}`,
            { cache: "no-store", signal: AbortSignal.timeout(8000) }
          );
          if (pageRes.ok) {
            const pageData = await pageRes.json();
            accountName = accountName || pageData.name || "";
            biography = biography || pageData.about || pageData.description || "";
            website = website || pageData.website || "";

            const igBiz = pageData.instagram_business_account;
            if (igBiz) {
              username = igBiz.username || username;
              accountName = igBiz.name || accountName;
              biography = igBiz.biography || biography;
              website = igBiz.website || website;
              if (typeof igBiz.followers_count === "number") followersCount = igBiz.followers_count;
              if (typeof igBiz.media_count === "number") mediaCount = igBiz.media_count;
              if (Array.isArray(igBiz.media?.data)) {
                rawMediaItems.push(...igBiz.media.data);
              }
            }
            if (rawMediaItems.length > 0) break;
          }
        } catch {
          // Tenta próximo token
        }
      }
    }

    // 3. Enriquecer até 10 publicações recentes com Insights (reach, saved, total_interactions)
    const itemsToEnrich = rawMediaItems.slice(0, 10);
    const remainingItems = rawMediaItems.slice(10);

    const enrichedTop = await Promise.all(
      itemsToEnrich.map(async (item: any): Promise<AnalyzedPostSummary> => {
        const insights = await fetchPostInsightsSafe(item.id, igAccessToken, fbTokens);
        const likes = Number(item.like_count ?? 0);
        const comments = Number(item.comments_count ?? 0);
        const saved = Number(insights.saved ?? 0);
        const totalInteractions =
          insights.totalInteractions > 0
            ? insights.totalInteractions
            : likes + comments + saved;

        return {
          id: String(item.id),
          caption: typeof item.caption === "string" ? item.caption.trim() : "",
          mediaType: item.media_type || "IMAGE",
          likes,
          comments,
          reach: Number(insights.reach ?? 0),
          saved,
          totalInteractions,
          permalink: item.permalink,
          timestamp: item.timestamp,
          thumbnailUrl: item.thumbnail_url || item.media_url,
        };
      })
    );

    const enrichedRest: AnalyzedPostSummary[] = remainingItems.map((item: any) => {
      const likes = Number(item.like_count ?? 0);
      const comments = Number(item.comments_count ?? 0);
      return {
        id: String(item.id),
        caption: typeof item.caption === "string" ? item.caption.trim() : "",
        mediaType: item.media_type || "IMAGE",
        likes,
        comments,
        reach: 0,
        saved: 0,
        totalInteractions: likes + comments,
        permalink: item.permalink,
        timestamp: item.timestamp,
        thumbnailUrl: item.thumbnail_url || item.media_url,
      };
    });

    const allPosts: AnalyzedPostSummary[] = [...enrichedTop, ...enrichedRest];

    // 4. Calcular Métricas Reais de Performance e Constância
    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const postsInLast30Days = allPosts.filter((p) => {
      if (!p.timestamp) return false;
      const t = new Date(p.timestamp).getTime();
      return !isNaN(t) && now - t <= thirtyDaysMs;
    });

    const postsPerWeekLast30Days = Number((postsInLast30Days.length / 4.28).toFixed(1));

    // Maior hiato em dias entre publicações (ou desde a última publicação)
    let longestGapDays = 0;
    const sortedTimestamps = allPosts
      .map((p) => (p.timestamp ? new Date(p.timestamp).getTime() : NaN))
      .filter((t) => !isNaN(t))
      .sort((a, b) => b - a);

    if (sortedTimestamps.length > 0) {
      const daysSinceLastPost = Math.round((now - sortedTimestamps[0]) / (1000 * 60 * 60 * 24));
      longestGapDays = Math.max(longestGapDays, daysSinceLastPost);
      for (let i = 0; i < sortedTimestamps.length - 1; i++) {
        const gap = Math.round(
          (sortedTimestamps[i] - sortedTimestamps[i + 1]) / (1000 * 60 * 60 * 24)
        );
        if (gap > longestGapDays) longestGapDays = gap;
      }
    } else {
      longestGapDays = 30;
    }

    const totalCount = allPosts.length || 1;
    const sumLikes = allPosts.reduce((acc, p) => acc + p.likes, 0);
    const sumComments = allPosts.reduce((acc, p) => acc + p.comments, 0);
    const sumReach = allPosts.reduce((acc, p) => acc + p.reach, 0);
    const sumSaved = allPosts.reduce((acc, p) => acc + p.saved, 0);
    const sumInteractions = allPosts.reduce((acc, p) => acc + p.totalInteractions, 0);

    const avgLikes = Math.round(sumLikes / totalCount);
    const avgComments = Math.round(sumComments / totalCount);
    const avgReach = Math.round(sumReach / Math.max(1, itemsToEnrich.length));
    const avgSaved = Math.round(sumSaved / Math.max(1, itemsToEnrich.length));

    let avgEngagementRate = 0;
    if (sumReach > 0) {
      avgEngagementRate = Number(((sumInteractions / sumReach) * 100).toFixed(2));
    } else if (followersCount && followersCount > 0) {
      avgEngagementRate = Number(
        (((avgLikes + avgComments + avgSaved) / followersCount) * 100).toFixed(2)
      );
    } else if (allPosts.length > 0) {
      avgEngagementRate = Number(Math.min(12.5, Math.max(1.2, (avgLikes + avgComments * 2) / 10)).toFixed(2));
    }

    const formatBreakdown = {
      image: 0,
      video: 0,
      carousel: 0,
    };

    const formatInteractions: Record<string, { count: number; interactions: number }> = {
      "Reels / Vídeo": { count: 0, interactions: 0 },
      "Carrossel": { count: 0, interactions: 0 },
      "Post Estático": { count: 0, interactions: 0 },
    };

    const dayScores: Record<string, number> = {};
    const hourScores: Record<string, number> = {};

    for (const post of allPosts) {
      const mType = (post.mediaType || "").toUpperCase();
      if (mType === "VIDEO" || mType === "REELS") {
        formatBreakdown.video++;
        formatInteractions["Reels / Vídeo"].count++;
        formatInteractions["Reels / Vídeo"].interactions += post.totalInteractions + 1;
      } else if (mType === "CAROUSEL_ALBUM") {
        formatBreakdown.carousel++;
        formatInteractions["Carrossel"].count++;
        formatInteractions["Carrossel"].interactions += post.totalInteractions + 1;
      } else {
        formatBreakdown.image++;
        formatInteractions["Post Estático"].count++;
        formatInteractions["Post Estático"].interactions += post.totalInteractions + 1;
      }

      if (post.timestamp) {
        const dt = new Date(post.timestamp);
        if (!isNaN(dt.getTime())) {
          const dayName = DAYS_PT[dt.getDay()];
          const weight = Math.max(1, post.totalInteractions);
          dayScores[dayName] = (dayScores[dayName] || 0) + weight;

          const hour = dt.getHours();
          const slot =
            hour < 12 ? "09:00" : hour < 15 ? "12:30" : hour < 18 ? "17:00" : "19:30";
          hourScores[slot] = (hourScores[slot] || 0) + weight;
        }
      }
    }

    let bestPerformingFormat = "Reels / Vídeo";
    let bestFormatAvg = -1;
    for (const [fmtName, stats] of Object.entries(formatInteractions)) {
      if (stats.count > 0) {
        const avg = stats.interactions / stats.count;
        if (avg > bestFormatAvg) {
          bestFormatAvg = avg;
          bestPerformingFormat = fmtName;
        }
      }
    }

    const bestDaysToPost =
      Object.keys(dayScores).length >= 2
        ? Object.entries(dayScores)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([d]) => d)
        : ["Terça-feira", "Quinta-feira", "Sábado"];

    const bestHoursToPost =
      Object.keys(hourScores).length >= 1
        ? Object.entries(hourScores)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2)
            .map(([h]) => h)
        : ["12:00", "19:00"];

    const topPosts = [...allPosts]
      .sort((a, b) => b.totalInteractions - a.totalInteractions)
      .slice(0, 4);

    const metrics: SocialMediaAuditMetrics = {
      totalAnalyzedPosts: allPosts.length,
      postsPerWeekLast30Days,
      longestGapDays,
      avgLikes,
      avgComments,
      avgReach,
      avgSaved,
      avgEngagementRate,
      formatBreakdown,
      bestPerformingFormat,
      bestDaysToPost,
      bestHoursToPost,
      topPosts,
    };

    // 5. Gerar Diagnóstico Estratégico com Gemini IA
    const formattedUsername = username
      ? `@${username.replace(/^@/, "")}`
      : accountName || "@perfil_conectado";

    const captionsSample = allPosts
      .slice(0, 10)
      .map(
        (p, idx) =>
          `${idx + 1}. [${p.mediaType}] (Likes: ${p.likes}, Comentários: ${p.comments}, Alcance: ${p.reach}, Salvos: ${p.saved}) Legenda: "${(p.caption || "Sem legenda").slice(0, 220)}"`
      )
      .join("\n");

    const auditPrompt = `Você é um Diretor de Estratégia Digital, Especialista em Algoritmo do Instagram e Copywriter Sênior.
Sua missão é analisar os dados reais extraídos via API Oficial do Instagram/Meta deste cliente e produzir um Diagnóstico Profundo e Acionável em Português do Brasil.

# DADOS DO PERFIL & MARCA
- Perfil: ${formattedUsername}
- Nome da Empresa/Marca: ${accountName || "Não informado"}
- Segmento/Nicho: ${businessProfile?.category || "Negócios / Serviços"}
- Bio Atual no Instagram: "${biography || "Não preenchida ou não detectada"}"
- Website na Bio: "${website || "Ausente"}"
- Público-Alvo: ${businessProfile?.targetAudience || "Clientes do segmento"}
- Tom de Voz da Marca: ${businessProfile?.toneOfVoice || "Profissional e próximo"}
- Seguidores: ${followersCount ?? "Não informado pelo escopo"}

# MÉTRICAS REAIS EXTRAÍDAS VIA API (ÚLTIMOS ${allPosts.length} POSTS)
- Frequência nos últimos 30 dias: ${postsPerWeekLast30Days} posts por semana
- Maior intervalo sem postar: ${longestGapDays} dias
- Média de Curtidas: ${avgLikes} | Média de Comentários: ${avgComments} | Alcance Médio: ${avgReach} | Salvamentos Médios: ${avgSaved}
- Taxa de Engajamento Média: ${avgEngagementRate}%
- Mix de Formatos: ${formatBreakdown.image} Imagens Estáticas, ${formatBreakdown.video} Vídeos/Reels, ${formatBreakdown.carousel} Carrosséis
- Formato com Melhor Performance: ${bestPerformingFormat}
- Melhores Dias Detectados: ${bestDaysToPost.join(", ")}

# AMOSTRA REAL DAS ÚLTIMAS PUBLICAÇÕES
${captionsSample || "Nenhuma publicação recente encontrada na linha do tempo."}

Retorne EXCLUSIVAMENTE um objeto JSON válido com a estrutura exata abaixo:
{
  "overallScore": 72,
  "scoreClassification": "Crítico | Em Evolução | Bom | Excelente",
  "executiveSummary": "Resumo executivo direto (2 a 3 frases) explicando o momento atual do perfil com base nos números reais e o que precisa mudar imediatamente.",
  "bioAnalysis": {
    "currentStatus": "Avaliação crítica da bio atual e do link de conversão.",
    "suggestedBio": "Sugestão de nova Bio altamente magnética em 3 linhas com emojis estratégicos e proposta de valor clara.",
    "suggestedCta": "Chamada para ação ideal para a última linha da Bio (ex: 👇 Agende sua avaliação / Peça pelo link)."
  },
  "strengths": [
    "Ponto forte real identificado nos posts ou posicionamento 1",
    "Ponto forte 2",
    "Ponto forte 3"
  ],
  "bottlenecks": [
    "Gargalo real que está limitando o alcance/engajamento 1 (ex: baixa proporção de Reels ou falta de CTAs nas legendas)",
    "Gargalo 2",
    "Gargalo 3"
  ],
  "strategicRecommendations": [
    {
      "title": "Título curto e acionável da melhoria",
      "description": "Explicação prática de como aplicar na próxima campanha semanal.",
      "impact": "Alto",
      "category": "Frequência | Formato | Copywriting | Bio | Conversão"
    }
  ],
  "recommendedObjective": "engagement | sales_launch | authority | local_social_selling",
  "recommendedFrequency": 3
}`;

    let aiResult: any = null;
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
                contents: [{ role: "user", parts: [{ text: auditPrompt }] }],
                generationConfig: {
                  temperature: 0.4,
                  responseMimeType: "application/json",
                },
              }),
              signal: AbortSignal.timeout(25000),
            }
          );

          if (res.ok) {
            const data = await res.json();
            const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) {
              const cleaned = rawText.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
              aiResult = JSON.parse(cleaned);
              break;
            }
          }
        } catch (err) {
          console.warn(`[SOCIAL_AUDIT] Falha no modelo ${model}:`, err);
        }
      }
    }

    // Cálculo determinístico de fallback ou normalização caso a IA falhe
    const baseScore = Math.min(
      95,
      Math.max(
        28,
        Math.round(
          (postsPerWeekLast30Days >= 3 ? 35 : postsPerWeekLast30Days >= 1.5 ? 22 : 10) +
            (formatBreakdown.video > 0 ? 20 : 8) +
            (formatBreakdown.carousel > 0 ? 15 : 5) +
            (biography ? 15 : 5) +
            Math.min(15, avgEngagementRate * 2)
        )
      )
    );

    const finalScore =
      typeof aiResult?.overallScore === "number"
        ? Math.min(100, Math.max(15, Math.round(aiResult.overallScore)))
        : baseScore;

    const scoreClassification: SocialMediaAuditReport["scoreClassification"] =
      finalScore >= 80
        ? "Excelente"
        : finalScore >= 60
          ? "Bom"
          : finalScore >= 40
            ? "Em Evolução"
            : "Crítico";

    const report: SocialMediaAuditReport = {
      id: "latest",
      createdAt: new Date().toISOString(),
      username: formattedUsername,
      accountName: accountName || formattedUsername,
      biography: biography || "",
      website: website || "",
      ...(followersCount !== undefined ? { followersCount } : {}),
      ...(mediaCount !== undefined ? { mediaCount } : {}),
      connectedPlatforms: {
        instagram: isIgConnected,
        facebook: isMetaConnected,
        linkedin: Boolean(linkedinData?.isConnected),
        tiktok: Boolean(tiktokData?.isConnected),
      },
      overallScore: finalScore,
      scoreClassification,
      executiveSummary:
        aiResult?.executiveSummary ||
        `Analisamos ${allPosts.length} publicações via API oficial. Sua frequência atual é de ${postsPerWeekLast30Days} posts/semana e o formato de melhor resposta é ${bestPerformingFormat}. Implementar uma rotina constante de 3x por semana combinando Reels, Carrosséis e Stories diários destravará seu alcance orgânico.`,
      metrics,
      bioAnalysis: {
        currentStatus:
          aiResult?.bioAnalysis?.currentStatus ||
          (biography
            ? "Sua biografia apresenta o negócio, mas pode ganhar uma promessa de transformação mais clara e um gatilho direto para o link."
            : "Biografia não detectada ou pouco detalhada. É essencial estruturar autoridade, benefício e chamada para ação."),
        suggestedBio:
          aiResult?.bioAnalysis?.suggestedBio ||
          `✨ ${accountName || "Especialistas"} | ${businessProfile?.category || "Soluções sob medida"}\n🎯 ${businessProfile?.slogan || "Transformando resultados com qualidade e confiança"}\n📍 Atendimento personalizado`,
        suggestedCta:
          aiResult?.bioAnalysis?.suggestedCta ||
          "👇 Toque no link abaixo e fale com nossa equipe agora!",
      },
      strengths:
        Array.isArray(aiResult?.strengths) && aiResult.strengths.length > 0
          ? aiResult.strengths
          : [
              `Conta conectada oficialmente via API com histórico de ${allPosts.length} publicações analisadas.`,
              `O formato ${bestPerformingFormat} já demonstra boa receptividade junto à audiência atual.`,
              `Identidade de marca mapeada para geração de criativos alinhados ao seu posicionamento.`,
            ],
      bottlenecks:
        Array.isArray(aiResult?.bottlenecks) && aiResult.bottlenecks.length > 0
          ? aiResult.bottlenecks
          : [
              postsPerWeekLast30Days < 2.5
                ? `Frequência abaixo do ideal (${postsPerWeekLast30Days} posts/semana nos últimos 30 dias), reduzindo a entrega orgânica do algoritmo.`
                : "Oportunidade de diversificar ganchos visuais nos primeiros 3 segundos para aumentar salvamentos.",
              formatBreakdown.video === 0
                ? "Ausência recente de Reels/Vídeos orgânicos para atrair novos seguidores (Topo de Funil)."
                : "Baixo uso de chamadas para ação (CTAs) que incentivem comentários com palavra-chave e conversas no Direct.",
              formatBreakdown.carousel === 0
                ? "Falta de Carrosséis educativos que aumentam o tempo de tela e a taxa de salvamentos."
                : "Necessidade de aquecer as publicações do feed com sequências intencionais de Stories no mesmo dia.",
            ],
      strategicRecommendations:
        Array.isArray(aiResult?.strategicRecommendations) &&
        aiResult.strategicRecommendations.length > 0
          ? aiResult.strategicRecommendations
          : [
              {
                title: "Estabelecer Constância Fixa de 3x na Semana",
                description: `Concentrar as publicações em ${bestDaysToPost.join(", ")} por volta das ${bestHoursToPost[0] || "19:00"}, mantendo previsibilidade para o algoritmo.`,
                impact: "Alto",
                category: "Frequência",
              },
              {
                title: "Equilibrar Funil com Reels + Carrossel + Post IA",
                description:
                  "Usar 1 Reel semanal para alcance de não-seguidores, 1 Carrossel educativo para salvamentos e 1 Post de oferta/prova social para conversão.",
                impact: "Alto",
                category: "Formato",
              },
              {
                title: "Ativar Social Selling com Palavra-Chave nas Legendas",
                description:
                  "Substituir CTAs genéricos ('link na bio') por comandos de comentário (ex: 'Comente QUERO que te envio no Direct') para disparar o engajamento.",
                impact: "Alto",
                category: "Conversão",
              },
              {
                title: "Sequência de 4 Stories de Aquecimento nos Dias de Post",
                description:
                  "Publicar uma sequência com enquete e caixinha de perguntas antes de soltar o post no feed para elevar a entrega nas primeiras 2 horas.",
                impact: "Médio",
                category: "Copywriting",
              },
            ],
      recommendedObjective:
        aiResult?.recommendedObjective &&
        ["engagement", "sales_launch", "authority", "local_social_selling"].includes(
          aiResult.recommendedObjective
        )
          ? aiResult.recommendedObjective
          : postsPerWeekLast30Days < 2
            ? "engagement"
            : "authority",
      recommendedFrequency:
        aiResult?.recommendedFrequency === 2 ||
        aiResult?.recommendedFrequency === 3 ||
        aiResult?.recommendedFrequency === 5
          ? aiResult.recommendedFrequency
          : 3,
    };

    // 6. Salvar auditoria no Firestore
    await userRef.collection("social_audits").doc("latest").set(report, { merge: true });

    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    console.error("[SOCIAL_MEDIA_AUDIT_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Erro ao executar auditoria de redes sociais.",
      },
      { status: 500 }
    );
  }
}
