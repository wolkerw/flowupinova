import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export interface TrendNewsArticle {
  title: string;
  url: string;
  source: string;
  picture?: string;
}

export interface GoogleTrendItem {
  id: string;
  title: string;
  approxTraffic: string;
  trafficVolume: number;
  growthPercent?: number;
  isActive?: boolean;
  relevanceRank?: number;
  relatedQueries?: string[];
  pubDate: string;
  picture?: string;
  pictureSource?: string;
  trendsUrl: string;
  sourceLabel: string;
  newsArticles: TrendNewsArticle[];
}

function decodeXmlEntities(text: string): string {
  if (!text) return "";
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .trim();
}

function extractTagValue(xmlBlock: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const match = xmlBlock.match(regex);
  return match ? decodeXmlEntities(match[1]) : "";
}

export function parseTrafficVolume(trafficStr: string): number {
  if (!trafficStr) return 0;
  const normalized = trafficStr.toLowerCase().trim();
  const digitsOnly = normalized.replace(/[^0-9]/g, "");
  const baseNumber = parseInt(digitsOnly, 10) || 0;

  if (normalized.includes("mi") || normalized.includes("m+") || normalized.includes("m ")) {
    return baseNumber * 1_000_000;
  }
  if (normalized.includes("mil") || normalized.includes("k")) {
    return baseNumber * 1_000;
  }
  return baseNumber;
}

export function formatTrafficDisplay(volume: number, fallbackRaw: string): string {
  if (volume >= 1_000_000) {
    const m = Math.round(volume / 1_000_000);
    return `${m} mi+`;
  }
  if (volume >= 1_000) {
    const k = Math.round(volume / 1_000);
    return `${k} mil+`;
  }
  if (volume > 0) {
    return `${volume}+`;
  }
  return fallbackRaw || "Em alta";
}

function parseGoogleTrendsRss(xmlText: string, geo: string): GoogleTrendItem[] {
  const items: GoogleTrendItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemXml = match[1];
    const title = extractTagValue(itemXml, "title");
    if (!title) continue;

    const rawTraffic = extractTagValue(itemXml, "ht:approx_traffic") || "200+";
    const trafficVolume = parseTrafficVolume(rawTraffic);
    const approxTraffic = formatTrafficDisplay(trafficVolume, rawTraffic);
    const pubDate = extractTagValue(itemXml, "pubDate") || new Date().toUTCString();
    const picture = extractTagValue(itemXml, "ht:picture");
    const pictureSource = extractTagValue(itemXml, "ht:picture_source");

    const newsArticles: TrendNewsArticle[] = [];
    const newsRegex = /<ht:news_item>([\s\S]*?)<\/ht:news_item>/gi;
    let newsMatch: RegExpExecArray | null;

    while ((newsMatch = newsRegex.exec(itemXml)) !== null) {
      const newsXml = newsMatch[1];
      const newsTitle = extractTagValue(newsXml, "ht:news_item_title");
      const newsUrl = extractTagValue(newsXml, "ht:news_item_url");
      const newsSource = extractTagValue(newsXml, "ht:news_item_source");
      const newsPicture = extractTagValue(newsXml, "ht:news_item_picture");

      if (newsTitle && newsUrl) {
        newsArticles.push({
          title: newsTitle,
          url: newsUrl,
          source: newsSource || "Google News",
          picture: newsPicture || undefined,
        });
      }
    }

    const encodedQuery = encodeURIComponent(title);
    const trendsUrl = `https://trends.google.com.br/trends/explore?q=${encodedQuery}&geo=${geo}&hl=pt-BR`;

    items.push({
      id: `trend-rss-${index}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      title,
      approxTraffic,
      trafficVolume,
      growthPercent: 1000,
      isActive: true,
      relevanceRank: index + 1,
      relatedQueries: [],
      pubDate,
      picture: picture || newsArticles[0]?.picture || undefined,
      pictureSource: pictureSource || newsArticles[0]?.source || undefined,
      trendsUrl,
      sourceLabel: "Google Trends Brasil",
      newsArticles: newsArticles.slice(0, 3),
    });

    index++;
  }

  return items;
}

/**
 * Extrai notícias e pautas em alta no Google Notícias Brasil para o nicho/ramo específico da empresa.
 */
export function parseGoogleNewsNicheRss(
  xmlText: string,
  nicheQuery: string,
  geo: string
): GoogleTrendItem[] {
  const items: GoogleTrendItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = itemRegex.exec(xmlText)) !== null && items.length < 24) {
    const itemXml = match[1];
    const rawTitle = extractTagValue(itemXml, "title");
    const link = extractTagValue(itemXml, "link");
    const pubDate = extractTagValue(itemXml, "pubDate") || new Date().toUTCString();
    const sourceName = extractTagValue(itemXml, "source") || "Google Notícias";

    if (!rawTitle || !link) continue;

    // Remove o sufixo " - Nome do Portal" do título do Google News para exibir o assunto limpo
    const suffixPattern = new RegExp(`\\s*[-–|]\\s*${sourceName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    const cleanTitle = rawTitle.replace(suffixPattern, "").trim() || rawTitle;

    const encodedQuery = encodeURIComponent(nicheQuery);
    const trendsUrl = `https://trends.google.com.br/trends/explore?q=${encodedQuery}&geo=${geo}&hl=pt-BR`;

    items.push({
      id: `niche-${index}-${cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`,
      title: cleanTitle,
      approxTraffic: "Em alta no setor",
      trafficVolume: 1000,
      isActive: true,
      relevanceRank: index + 1,
      relatedQueries: [],
      pubDate,
      trendsUrl,
      sourceLabel: sourceName,
      newsArticles: [
        {
          title: cleanTitle,
          url: link,
          source: sourceName,
        },
      ],
    });

    index++;
  }

  return items;
}

/**
 * Extrai a lista oficial (24h ou 7 dias) diretamente do payload `AF_initDataCallback` (ds:0)
 * da página https://trends.google.com/trending?geo=BR&hl=pt-BR&hours=..., garantindo 100% de fidelidade com o Google Trends.
 */
export function parseGoogleTrendsHtmlDs0(
  htmlText: string,
  geo: string,
  rssMap: Map<string, GoogleTrendItem>
): GoogleTrendItem[] {
  const regex = /AF_initDataCallback\(\{key:\s*'ds:0'[\s\S]*?data:([\s\S]*?),\s*sideChannel:/;
  const match = htmlText.match(regex);
  if (!match || !match[1]) {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(match[1]);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed) || !Array.isArray(parsed[1])) {
    return [];
  }

  const rawList = parsed[1] as unknown[];
  const items: GoogleTrendItem[] = [];

  for (let i = 0; i < rawList.length && items.length < 60; i++) {
    const entry = rawList[i];
    if (!Array.isArray(entry)) continue;

    const title = typeof entry[0] === "string" ? entry[0].trim() : "";
    if (!title) continue;

    const trafficVolume = typeof entry[6] === "number" ? entry[6] : 0;
    const approxTraffic = formatTrafficDisplay(trafficVolume, "Em alta");
    const growthPercent = typeof entry[8] === "number" ? entry[8] : 0;

    const startSeconds =
      Array.isArray(entry[3]) && typeof entry[3][0] === "number"
        ? entry[3][0]
        : Math.floor(Date.now() / 1000);
    const pubDate = new Date(startSeconds * 1000).toISOString();

    const isActive = entry[4] === null;

    const rawRelated = Array.isArray(entry[9]) ? entry[9] : [];
    const relatedQueries = rawRelated
      .filter(
        (q): q is string =>
          typeof q === "string" &&
          q.trim().length > 0 &&
          q.trim().toLowerCase() !== title.toLowerCase()
      )
      .slice(0, 6);

    const rssMatch = rssMap.get(title.toLowerCase());
    const encodedQuery = encodeURIComponent(title);
    const trendsUrl = `https://trends.google.com.br/trends/explore?q=${encodedQuery}&geo=${geo}&hl=pt-BR`;

    items.push({
      id: `trend-${i}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      title,
      approxTraffic,
      trafficVolume,
      growthPercent,
      isActive,
      relevanceRank: i + 1,
      relatedQueries,
      pubDate,
      picture: rssMatch?.picture,
      pictureSource: rssMatch?.pictureSource,
      trendsUrl,
      sourceLabel: "Google Trends Brasil",
      newsArticles: rssMatch?.newsArticles || [],
    });
  }

  return items;
}

function cleanNicheSearchQuery(rawNiche: string): string {
  if (!rawNiche) return "";
  // Se a categoria tiver separadores como "—", "-", ",", "/", pega o termo principal limpo
  const firstPart = rawNiche
    .split(/[—–\-|,/()]/)[0]
    .replace(
      /^(serviços?\s+de|loja\s+de|clínica\s+de|clinica\s+de|consultório\s+de|consultorio\s+de|agência\s+de|agencia\s+de|escritório\s+de|escritorio\s+de|empresa\s+de|estúdio\s+de|estudio\s+de|fornecedor\s+de|centro\s+de|instituto\s+de)\s+/i,
      ""
    )
    .replace(/\b(ltda|me|eireli|s\/a)\b/gi, "")
    .trim();
  return firstPart || rawNiche.trim();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const geo = (searchParams.get("geo") || "BR").toUpperCase();
    const query = (searchParams.get("q") || "").trim();
    const period = (searchParams.get("period") || "today").toLowerCase();
    const rawNiche = (searchParams.get("niche") || "").trim();

    const commonHeaders = {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    };

    // Modo 1: "Seu Mercado" (Automático pelo nicho da empresa)
    if (period === "niche" && rawNiche) {
      const cleanNiche = cleanNicheSearchQuery(rawNiche);
      const searchTopic = query || cleanNiche;
      // Usa aspas exatas quando há 2+ palavras para evitar resultados fora do setor (ex: "produção" virando "produção de mel")
      const exactNewsQuery = searchTopic.includes(" ") ? `"${searchTopic}"` : searchTopic;

      const news7dUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(exactNewsQuery)}+when:14d&hl=pt-BR&gl=${geo}&ceid=${geo}:pt-419`;
      const news30dUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(exactNewsQuery)}+when:30d&hl=pt-BR&gl=${geo}&ceid=${geo}:pt-419`;
      const suggestUrl = `https://suggestqueries.google.com/complete/search?client=firefox&hl=pt-BR&gl=${geo}&q=${encodeURIComponent(searchTopic)}`;

      const [news7dRes, suggestRes] = await Promise.allSettled([
        fetch(news7dUrl, { headers: commonHeaders, cache: "no-store" }),
        fetch(suggestUrl, { cache: "no-store" }),
      ]);

      let nicheTrends: GoogleTrendItem[] = [];
      if (news7dRes.status === "fulfilled" && news7dRes.value.ok) {
        const xml7d = await news7dRes.value.text();
        nicheTrends = parseGoogleNewsNicheRss(xml7d, searchTopic, geo);
      }

      // Se a janela de 7 dias tiver poucos artigos para um nicho muito específico, complementa com 30 dias
      if (nicheTrends.length < 6) {
        try {
          const res30d = await fetch(news30dUrl, { headers: commonHeaders, cache: "no-store" });
          if (res30d.ok) {
            const xml30d = await res30d.text();
            const items30d = parseGoogleNewsNicheRss(xml30d, searchTopic, geo);
            const existingTitles = new Set(nicheTrends.map((t) => t.title.toLowerCase()));
            for (const item of items30d) {
              if (!existingTitles.has(item.title.toLowerCase()) && nicheTrends.length < 24) {
                nicheTrends.push(item);
                existingTitles.add(item.title.toLowerCase());
              }
            }
          }
        } catch (err30d) {
          console.warn("[TRENDS_NICHE_30D_WARN]", err30d);
        }
      }

      let relatedSuggestions: string[] = [];
      if (suggestRes.status === "fulfilled" && suggestRes.value.ok) {
        try {
          const suggestData = await suggestRes.value.json();
          if (Array.isArray(suggestData?.[1])) {
            relatedSuggestions = suggestData[1].filter(
              (item: unknown): item is string => typeof item === "string" && item.trim().length > 0
            );
          }
        } catch {
          // ignore suggest parse error
        }
      }

      return NextResponse.json({
        success: true,
        fetchedAt: new Date().toISOString(),
        geo,
        period: "niche",
        nicheUsed: searchTopic,
        sourceUrl: `https://trends.google.com.br/trends/explore?q=${encodeURIComponent(searchTopic)}&geo=BR&hl=pt-BR`,
        trends: nicheTrends,
        relatedSuggestions,
      });
    }

    // Modo 2 e 3: Google Trends Geral (Hoje = 24h | Semana = 168h)
    const hours = period === "week" ? 168 : 24;
    const webTrendingUrl = `https://trends.google.com/trending?geo=${encodeURIComponent(geo)}&hl=pt-BR&hours=${hours}`;
    const rssUrl = `https://trends.google.com/trending/rss?geo=${encodeURIComponent(geo)}&hl=pt-BR`;

    const [webResult, rssResult] = await Promise.allSettled([
      fetch(webTrendingUrl, {
        headers: {
          ...commonHeaders,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        cache: "no-store",
      }),
      fetch(rssUrl, {
        headers: {
          ...commonHeaders,
          Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
        },
        cache: "no-store",
      }),
    ]);

    const rssMap = new Map<string, GoogleTrendItem>();
    let rssTrends: GoogleTrendItem[] = [];

    if (rssResult.status === "fulfilled" && rssResult.value.ok) {
      const xmlText = await rssResult.value.text();
      rssTrends = parseGoogleTrendsRss(xmlText, geo);
      for (const item of rssTrends) {
        rssMap.set(item.title.toLowerCase(), item);
      }
    }

    let trends: GoogleTrendItem[] = [];
    if (webResult.status === "fulfilled" && webResult.value.ok) {
      const htmlText = await webResult.value.text();
      trends = parseGoogleTrendsHtmlDs0(htmlText, geo, rssMap);
    }

    // Fallback para RSS caso o HTML não retorne itens
    if (trends.length === 0) {
      if (rssTrends.length === 0) {
        throw new Error("Falha ao consultar dados em tempo real do Google Trends Brasil.");
      }
      trends = rssTrends;
    }

    // Se o usuário buscou um termo específico na barra de filtro, também buscamos sugestões reais do Google Autocomplete
    let relatedSuggestions: string[] = [];
    if (query) {
      try {
        const suggestUrl = `https://suggestqueries.google.com/complete/search?client=firefox&hl=pt-BR&gl=${geo}&q=${encodeURIComponent(query)}`;
        const suggestRes = await fetch(suggestUrl, { cache: "no-store" });
        if (suggestRes.ok) {
          const suggestData = await suggestRes.json();
          if (Array.isArray(suggestData?.[1])) {
            relatedSuggestions = suggestData[1].filter(
              (item: unknown): item is string => typeof item === "string" && item.trim().length > 0
            );
          }
        }
      } catch (suggestErr) {
        console.warn("[TRENDS_SUGGEST_WARN]", suggestErr);
      }
    }

    return NextResponse.json({
      success: true,
      fetchedAt: new Date().toISOString(),
      geo,
      period,
      hours,
      sourceUrl: `https://trends.google.com.br/trending?geo=BR&hl=pt-BR&hours=${hours}`,
      trends,
      relatedSuggestions,
    });
  } catch (error: any) {
    console.error("[GOOGLE_TRENDS_API_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error.message || "Não foi possível carregar os dados em tempo real do Google Trends.",
      },
      { status: 500 }
    );
  }
}

export interface LiveNewsItem {
  title: string;
  source: string;
  link: string;
}

/**
 * Consulta em tempo real (menos de 1s) o RSS do Google Notícias para o termo exato em alta,
 * trazendo as manchetes jornalísticas reais apuradas pelos principais veículos de imprensa (G1, Exame, Folha, etc.).
 */
export async function fetchLiveNewsForTopic(topic: string): Promise<LiveNewsItem[]> {
  if (!topic || !topic.trim()) return [];
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(
      topic.trim()
    )}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/rss+xml, application/xml, text/xml",
      },
      cache: "no-store",
    });
    clearTimeout(timer);

    if (!res.ok) return [];
    const xml = await res.text();
    const items: LiveNewsItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match: RegExpExecArray | null;

    while ((match = itemRegex.exec(xml)) !== null && items.length < 3) {
      const itemXml = match[1];
      const rawTitle = extractTagValue(itemXml, "title");
      const sourceName = extractTagValue(itemXml, "source") || "Imprensa";
      const link = extractTagValue(itemXml, "link") || "";

      if (rawTitle) {
        const cleanTitle = rawTitle
          .replace(
            new RegExp(`\\s*[-–|]\\s*${sourceName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
            ""
          )
          .trim() || rawTitle;

        items.push({
          title: cleanTitle,
          source: sourceName,
          link,
        });
      }
    }
    return items;
  } catch (err) {
    console.warn("[LIVE_NEWS_FETCH_WARN] Falha ao consultar notícias ao vivo:", err);
    return [];
  }
}

/**
 * Tenta buscar de forma ultrarrápida (timeout 1.8s) a descrição/resumo da notícia
 * através das meta tags og:description ou description da página do portal.
 */
async function fetchNewsSnippetQuickly(url?: string): Promise<string | undefined> {
  if (!url || typeof url !== "string" || !url.startsWith("http")) return undefined;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1800);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      cache: "no-store",
    });
    clearTimeout(timer);
    if (!res.ok) return undefined;
    const html = await res.text();
    const ogMatch =
      html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i) ||
      html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);

    if (ogMatch && ogMatch[1]) {
      return ogMatch[1]
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .trim();
    }
  } catch {
    // Falha silenciosa para não atrasar a geração do post
  }
  return undefined;
}

/**
 * Construtor determinístico de fallback para briefing estruturado de notícia/tendência.
 */
export function buildStructuredTrendFallback(params: {
  trendTitle: string;
  newsTitle?: string;
  newsSnippet?: string;
  liveNews?: LiveNewsItem[];
  source?: string;
  companyNiche?: string;
  companyName?: string;
}) {
  const { trendTitle, newsTitle, newsSnippet, liveNews, companyNiche, companyName } = params;
  const nicheLabel = companyNiche || "negócios";
  const cleanedTitle = (trendTitle || "").replace(/["“”]/g, "").trim();

  // Constrói uma Head onde o tópico está obrigatoriamente presente, com sentido completo e relevância prática (sem truncar com reticências e SEM ponto final)
  let headline = "";
  const topicLower = cleanedTitle.toLowerCase();
  if (topicLower.includes("outlook") || topicLower.includes("microsoft") || topicLower.includes("teams")) {
    headline = `Falhas em sistemas da Microsoft, como ${cleanedTitle}, mostram a importância de canais alternativos no setor de ${nicheLabel}`;
  } else if (newsTitle) {
    const cleanNews = newsTitle.replace(/\s*[-–|].*$/, "").trim();
    headline = `${cleanNews} sobre ${cleanedTitle}: o que muda para o seu negócio em ${nicheLabel}`;
  } else {
    headline = `Acontecimentos recentes sobre ${cleanedTitle} mostram a importância de estratégias sólidas em ${nicheLabel}`;
  }
  headline = headline.replace(/[\.\s]+$/, "");

  let newsSummary = "";
  if (liveNews && liveNews.length > 0) {
    newsSummary = `Acontecimentos recentes apuram que: "${liveNews[0].title}"${
      liveNews[1] ? `, com desdobramentos adicionais: "${liveNews[1].title}"` : ""
    }. O acontecimento gera impactos diretos no setor e na rotina operacional de empresas e consumidores.`;
  } else if (newsSnippet) {
    newsSummary = newsSnippet.slice(0, 240);
  } else if (newsTitle) {
    newsSummary = `Apurações recentes sobre "${newsTitle}" trazem desdobramentos operacionais relevantes e exigem atenção estratégica de empresas do setor.`;
  } else {
    newsSummary = `Apurações jornalísticas recentes sobre "${cleanedTitle}" ganham forte repercussão no mercado, mobilizando discussões técnicas e decisões estratégicas de negócios.`;
  }

  // Matriz de arquétipos visuais dinâmicos para rotatividade equilibrada de layouts (incluindo smartphone, desktop, conceitual e executivo)
  const SCENARIOS = [
    `Fotografia editorial cinematográfica e profissional de alto padrão no segmento de ${nicheLabel}. Protagonista em postura confiante e moderna apresentando a solução em um smartphone elegante com tela nítida voltada para o leitor, iluminação de estúdio suave e difusa, composição limpa e equilibrada em ângulo aberto a médio, profundidade de campo sutil e espaço negativo reservado para diagramação de texto e identidade visual.`,
    `Fotografia editorial cinematográfica e profissional de alto padrão no segmento de ${nicheLabel}. Ambiente corporativo contemporâneo, profissionais analisando dados e relatórios estratégicos em monitores de mesa com iluminação de estúdio suave e difusa, composição limpa e equilibrada, profundidade de campo sutil, detalhes nítidos e naturais e espaço negativo premium.`,
    `Composição fotográfica conceitual e sofisticada no segmento de ${nicheLabel}. Linhas arquitetônicas modernas, iluminação volumétrica suave de estúdio e enquadramento equilibrado com amplo espaço negativo reservado para diagramação de texto e identidade visual, transmitindo segurança e inovação com estética editorial minimalista.`,
    `Fotografia executiva autêntica e acolhedora no habitat de ${nicheLabel}. Protagonista em postura confiante e natural em mesa de reunião elegante com laptop e caderno executivo, luz natural difusa, composição equilibrada e profundidade de campo suave.`
  ];

  // Alterna o cenário e o estilo de overlay com base no título da tendência
  const titleHash = Math.abs(cleanedTitle.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0));
  const visualPrompt = SCENARIOS[titleHash % SCENARIOS.length];
  const suggestedOverlay = (titleHash % 2 === 0 ? "TITLE_ONLY" : "INFOGRAPHIC") as "TITLE_ONLY" | "INFOGRAPHIC";

  // NÃO insere "Fonte: X" para que o gerador de imagem não desenhe créditos de imprensa na arte comercial do usuário
  const fullBrief = `[Cena Visual]: ${visualPrompt} [Head Relevante da Arte]: "${headline}" [Contexto Resumido e Boas Práticas]: ${newsSummary} [Ação Estratégica do Negócio]: Conecte esse acontecimento a soluções de alto valor e orientações práticas para o público de ${nicheLabel}${companyName ? ` na ${companyName}` : ""}.`;

  return {
    newsSummary,
    headline,
    visualPrompt,
    fullBrief,
    suggestedOverlay,
  };
}

/**
 * Prompt de sistema para refinamento inteligente de notícia em micro-briefing publicitário de alta conversão.
 */
export function buildStructuredTrendAIPrompt(params: {
  trendTitle: string;
  newsTitle?: string;
  newsSnippet?: string;
  newsDigest?: string;
  source?: string;
  companyNiche?: string;
  companyName?: string;
}): string {
  const { trendTitle, newsTitle, newsSnippet, newsDigest, source, companyNiche, companyName } = params;
  return `Você é um Diretor de Arte e Estrategista Publicitário Sênior especialista em conteúdo de alta autoridade para redes sociais (Feed 4:5).

Seu objetivo é analisar as notícias apuradas sobre o assunto em alta e sintetizar uma proposta de post comercial relevante e entendível para a empresa do usuário na plataforma NumVapt.

DADOS JORNALÍSTICOS EM TEMPO REAL APURADOS SOBRE "${trendTitle}":
${
  newsDigest
    ? newsDigest
    : `- Manchete: "${newsTitle || trendTitle}" (Fonte: ${source || "Google Notícias"})`
}
${newsSnippet ? `- Lead/Trecho adicional da matéria: "${newsSnippet}"\n` : ""}- Nicho do negócio: "${companyNiche || "Negócios & Serviços"}"
- Nome da empresa: "${companyName || "Nossa Empresa"}"

DIRETRIZES OBRIGATÓRIAS DE REDAÇÃO E ARTE:
1. "headline": CRIE UMA HEAD RELEVANTE, COMPREENSÍVEL E COM SENTIDO COMPLETO.
   - REGRA OBRIGATÓRIA: O TÓPICO EM ALTA ("${trendTitle}") DEVE ESTAR OBRIGATORIAMENTE PRESENTE NA HEAD de forma explícita e natural.
   - ESTRUTURA DA HEAD: Una o acontecimento real do tópico a um gancho claro de aprendizado, importância ou valor prático para o público de ${companyNiche || "negócios"}.
   - EXEMPLO DE PADRÃO ESPERADO: "Falhas globais em sistemas da Microsoft, como ${trendTitle}, mostram a importância de canais alternativos de contato"
   - SEM CORTES E ZERO PONTO FINAL: NÃO termine com reticências ("...") nem com ponto final ("."). A frase DEVE ter sentido completo e início, meio e fim (entre 60 e 110 caracteres), sem ponto final pois é um título publicitário.
2. "newsSummary": Resumo conciso de 1 a 2 frases explicando com clareza o fato real que motivou a tendência, contextualizando boas práticas para o negócio.
3. "visualPrompt": ROTATIVIDADE EQUILIBRADA DE LAYOUTS VISUAIS:
   - Alterne dinamicamente a composição da cena entre diferentes abordagens visuais de alto padrão (o smartphone com app é um formato válido, mas deve rotacionar com outros formatos para manter o feed diversificado):
     * Layout A (Smartphone / Mobile Showcase): Protagonista carismático apresentando a solução em um smartphone ou interagindo com dispositivo móvel moderno voltado para o leitor.
     * Layout B (Desktop / Estação de Tecnologia): Profissionais em ambiente corporativo moderno analisando gráficos e dashboards em monitores de mesa elegantes.
     * Layout C (Conceitual & Minimalista): Composição visual artística sofisticada com metáforas visuais, iluminação volumétrica e amplo espaço negativo.
     * Layout D (Reunião / Mesa Executiva): Protagonista ou equipe em reunião colaborativa em mesa elegante com laptop ou cadernos de projeto.
   - Use iluminação suave de estúdio, estética clean e espaço negativo reservado para diagramação de texto (SEM 8K/4K/0,5K).
4. "fullBrief": Monte o briefing completo no formato:
   "[Cena Visual]: <visualPrompt> [Head Relevante da Arte]: <headline> [Contexto Resumido e Boas Práticas]: <newsSummary> [Ação Estratégica do Negócio]: Conecte esse acontecimento a orientações práticas e soluções para o público de ${companyNiche || "negócios"}${companyName ? ` na ${companyName}` : ""}."
5. "PROIBIÇÃO TOTAL DE CRÉDITOS DE IMPRENSA NA ARTE": É TERMINANTEMENTE PROIBIDO incluir na arte textos como "Fonte: G1", "Segundo a Folha", etc. A arte é 100% autoral da empresa do usuário (${companyName || "Nossa Empresa"}).
6. "suggestedOverlay": DIVERSIFIQUE O FORMATO:
   - Retorne "TITLE_ONLY" quando a pauta pedir uma fotografia limpa e imponente com a Head marcante em destaque (sem lista de ícones!).
   - Retorne "INFOGRAPHIC" apenas quando houver 3 dicas ou pontos acionáveis claros para diagramar.
7. "SEM MENÇÃO A RESOLUÇÃO NO TEXTO": NUNCA mencione termos técnicos de resolução como "8K", "4K", "HD" ou "0,5K" em nenhuma parte do prompt visual ou do briefing. Foque em termos estéticos de fotografia.

RETORNE APENAS UM JSON VÁLIDO NO SEGUINTE FORMATO:
{
  "newsSummary": "...",
  "headline": "...",
  "visualPrompt": "...",
  "fullBrief": "...",
  "suggestedOverlay": "TITLE_ONLY"
}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const trendTitle = String(body.trendTitle || body.title || "").trim();
    if (!trendTitle) {
      return NextResponse.json(
        { success: false, error: "Título do assunto/tendência é obrigatório." },
        { status: 400 }
      );
    }

    let newsTitle = body.newsTitle ? String(body.newsTitle).trim() : undefined;
    let source = body.source ? String(body.source).trim() : undefined;
    const newsUrl = body.newsUrl ? String(body.newsUrl).trim() : undefined;
    const companyNiche = body.companyNiche ? String(body.companyNiche).trim() : undefined;
    const companyName = body.companyName ? String(body.companyName).trim() : undefined;

    // Busca notícias ao vivo no Google News RSS em tempo real para obter apuração profunda
    const [liveNews, newsSnippet] = await Promise.all([
      fetchLiveNewsForTopic(trendTitle),
      fetchNewsSnippetQuickly(newsUrl),
    ]);

    // Se o cliente não forneceu notícias detalhadas, usa as manchetes jornalísticas apuradas ao vivo
    if (!newsTitle && liveNews.length > 0) {
      newsTitle = liveNews[0].title;
    }
    if (!source && liveNews.length > 0) {
      source = liveNews[0].source;
    }

    const newsDigest =
      liveNews.length > 0
        ? liveNews.map((n, idx) => `${idx + 1}. "${n.title}" (Fonte: ${n.source})`).join("\n")
        : newsTitle
        ? `1. "${newsTitle}" (Fonte: ${source || "Imprensa"})`
        : undefined;

    const fallback = buildStructuredTrendFallback({
      trendTitle,
      newsTitle,
      newsSnippet,
      liveNews,
      source,
      companyNiche,
      companyName,
    });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: true,
        ...fallback,
        source: "deterministic_fallback",
      });
    }

    try {
      const prompt = buildStructuredTrendAIPrompt({
        trendTitle,
        newsTitle,
        newsSnippet,
        newsDigest,
        source,
        companyNiche,
        companyName,
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6500);

      const aiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.35,
              responseMimeType: "application/json",
            },
          }),
        }
      );
      clearTimeout(timeoutId);

      if (aiRes.ok) {
        const data = await aiRes.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const parsed = JSON.parse(
          rawText.replace(/```json\s*/gi, "").replace(/```/g, "").trim()
        );

        const newsSummary = String(parsed.newsSummary || fallback.newsSummary).trim();
        const headline = String(parsed.headline || fallback.headline).trim();
        const visualPrompt = String(parsed.visualPrompt || fallback.visualPrompt).trim();
        const fullBrief = String(parsed.fullBrief || fallback.fullBrief).trim();
        const suggestedOverlay =
          parsed.suggestedOverlay === "TITLE_ONLY" ? "TITLE_ONLY" : "INFOGRAPHIC";

        return NextResponse.json({
          success: true,
          newsSummary,
          headline: headline.length > 130 ? headline.slice(0, 128) : headline,
          visualPrompt,
          fullBrief,
          suggestedOverlay,
          source: "gemini-2.5-flash",
        });
      }
    } catch (aiErr) {
      console.warn("[TREND_STRUCT_AI_WARN] Falha na chamada IA, usando fallback estruturado:", aiErr);
    }

    return NextResponse.json({
      success: true,
      ...fallback,
      source: "fallback_after_error",
    });
  } catch (err: any) {
    console.error("[TREND_POST_ERROR]", err);
    return NextResponse.json(
      { success: false, error: err.message || "Erro interno ao processar requisição." },
      { status: 500 }
    );
  }
}
