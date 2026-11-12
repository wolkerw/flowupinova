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
