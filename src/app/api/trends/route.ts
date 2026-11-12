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

function parseGoogleTrendsRss(xmlText: string, geo: string): GoogleTrendItem[] {
  const items: GoogleTrendItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemXml = match[1];
    const title = extractTagValue(itemXml, "title");
    if (!title) continue;

    const approxTraffic = extractTagValue(itemXml, "ht:approx_traffic") || "Em alta";
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
      id: `trend-${index}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      title,
      approxTraffic,
      pubDate,
      picture: picture || newsArticles[0]?.picture || undefined,
      pictureSource: pictureSource || newsArticles[0]?.source || undefined,
      trendsUrl,
      sourceLabel: "Google Trends Brasil (Tempo Real)",
      newsArticles: newsArticles.slice(0, 3),
    });

    index++;
  }

  return items;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const geo = (searchParams.get("geo") || "BR").toUpperCase();
    const query = (searchParams.get("q") || "").trim();

    const rssUrl = `https://trends.google.com/trending/rss?geo=${encodeURIComponent(geo)}&hl=pt-BR`;

    const response = await fetch(rssUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Falha ao consultar Google Trends RSS (status: ${response.status})`);
    }

    const xmlText = await response.text();
    let trends = parseGoogleTrendsRss(xmlText, geo);

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
      sourceUrl: "https://trends.google.com.br/trending?geo=BR&hl=pt-BR",
      trends,
      relatedSuggestions,
    });
  } catch (error: any) {
    console.error("[GOOGLE_TRENDS_API_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Não foi possível carregar os dados em tempo real do Google Trends.",
      },
      { status: 500 }
    );
  }
}
