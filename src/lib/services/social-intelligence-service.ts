import { adminDb } from "@/lib/firebase-admin";
import { JSDOM } from "jsdom";

export interface SocialIntelligenceCompetitor {
  name: string;
  snippet?: string;
  url?: string;
}

export interface SocialIntelligenceSummary {
  hasSocialData: boolean;
  instagram?: {
    username: string;
    name?: string;
    bio?: string;
    website?: string;
    recentPostsCaptions: string[];
    topThemes: string[];
  };
  facebook?: {
    pageName: string;
    about?: string;
    description?: string;
    category?: string;
    phone?: string;
    email?: string;
    address?: string;
    website?: string;
  };
  website?: {
    url: string;
    title?: string;
    metaDescription?: string;
    sampleText?: string;
  };
  competitors?: {
    queryUsed: string;
    list: SocialIntelligenceCompetitor[];
  };
  combinedPromptContext: string;
}

/**
 * Coleta inteligência da marca a partir de conexões oficiais (Instagram, Facebook)
 * e varredura pública de website (OSINT) para enriquecer o Brand Book e configurações.
 */
export async function collectSocialIntelligence(
  userId: string,
  fallbackWebsite?: string,
  brandNameHint?: string,
  segmentHint?: string
): Promise<SocialIntelligenceSummary> {
  const summary: SocialIntelligenceSummary = {
    hasSocialData: false,
    combinedPromptContext: "",
  };

  if (!userId) {
    return summary;
  }

  let websiteToScrape = fallbackWebsite?.trim() || "";
  let instagramAccessToken: string | null = null;
  let instagramUsername: string | null = null;
  let registeredName = brandNameHint || "";
  let registeredCategory = segmentHint || "";
  let registeredLocation = "";

  // 1. Buscar dados no Firestore
  try {
    const userDocRef = adminDb.collection("users").doc(userId);
    const [userSnap, igSnap] = await Promise.all([
      userDocRef.get(),
      userDocRef.collection("connections").doc("instagram").get(),
    ]);

    if (userSnap.exists) {
      const uData = userSnap.data();
      if (!websiteToScrape && uData?.website) {
        websiteToScrape = uData.website;
      }
      if (!registeredName && uData?.name) registeredName = uData.name;
      if (!registeredCategory && uData?.category) registeredCategory = uData.category;
      if (uData?.address) registeredLocation = uData.address;
    }

    if (igSnap.exists) {
      const igData = igSnap.data();
      if (igData?.isConnected && igData?.accessToken) {
        instagramAccessToken = igData.accessToken;
        instagramUsername = igData.instagramUsername || null;
      }
    }
  } catch (err) {
    console.warn("[SOCIAL_INTEL] Aviso ao buscar dados no Firestore do usuário:", err);
  }

  // 2. Coletar dados do Instagram Oficial via API
  if (instagramAccessToken) {
    try {
      summary.hasSocialData = true;

      // 2.1 Perfil do Instagram
      const profileRes = await fetch(
        `https://graph.instagram.com/me?fields=id,username,name,biography,website&access_token=${instagramAccessToken}`,
        { signal: AbortSignal.timeout(6000) }
      );

      let igName = "";
      let igBio = "";
      let igWeb = "";
      let currentUsername = instagramUsername || "";

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        currentUsername = profileData.username || currentUsername;
        igName = profileData.name || "";
        igBio = profileData.biography || "";
        igWeb = profileData.website || "";

        if (igWeb && !websiteToScrape) {
          websiteToScrape = igWeb;
        }
      }

      // 2.2 Publicações recentes do Instagram
      const mediaRes = await fetch(
        `https://graph.instagram.com/me/media?fields=id,caption,media_type,timestamp,like_count,comments_count&limit=10&access_token=${instagramAccessToken}`,
        { signal: AbortSignal.timeout(6000) }
      );

      const recentCaptions: string[] = [];
      if (mediaRes.ok) {
        const mediaData = await mediaRes.json();
        if (Array.isArray(mediaData.data)) {
          for (const item of mediaData.data) {
            if (item.caption && typeof item.caption === "string") {
              const cleanCaption = item.caption.trim().replace(/\s+/g, " ");
              if (cleanCaption.length > 5) {
                recentCaptions.push(cleanCaption.slice(0, 280));
              }
            }
          }
        }
      }

      summary.instagram = {
        username: currentUsername ? `@${currentUsername.replace(/^@/, "")}` : "@instagram",
        name: igName,
        bio: igBio,
        website: igWeb,
        recentPostsCaptions: recentCaptions.slice(0, 8),
        topThemes: extractThemesFromCaptions(recentCaptions),
      };
    } catch (igErr) {
      console.warn("[SOCIAL_INTEL] Falha ao coletar dados do Instagram:", igErr);
    }

    // 3. Tentar coletar dados da Página do Facebook vinculada
    try {
      const fbRes = await fetch(
        `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,about,description,category,phone,emails,single_line_address,website&access_token=${instagramAccessToken}`,
        { signal: AbortSignal.timeout(6000) }
      );

      if (fbRes.ok) {
        const fbData = await fbRes.json();
        if (Array.isArray(fbData.data) && fbData.data.length > 0) {
          const primaryPage = fbData.data[0];
          summary.facebook = {
            pageName: primaryPage.name || "",
            about: primaryPage.about || "",
            description: primaryPage.description || "",
            category: primaryPage.category || "",
            phone: primaryPage.phone || "",
            email: Array.isArray(primaryPage.emails) ? primaryPage.emails[0] : "",
            address: primaryPage.single_line_address || "",
            website: primaryPage.website || "",
          };

          if (primaryPage.website && !websiteToScrape) {
            websiteToScrape = primaryPage.website;
          }
          summary.hasSocialData = true;
        }
      }
    } catch (fbErr) {
      console.warn("[SOCIAL_INTEL] Falha ou sem permissão de páginas do Facebook:", fbErr);
    }
  }

  // 4. Web Scraping & OSINT do site da empresa
  if (websiteToScrape) {
    try {
      let validUrl = websiteToScrape;
      if (!/^https?:\/\//i.test(validUrl)) {
        validUrl = `https://${validUrl}`;
      }

      const webRes = await fetch(validUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html",
        },
        signal: AbortSignal.timeout(8000),
      });

      if (webRes.ok) {
        const html = await webRes.text();
        const dom = new JSDOM(html);
        const doc = dom.window.document;

        const title = doc.title || "";
        const metaDesc =
          doc.querySelector('meta[name="description"]')?.getAttribute("content") ||
          doc.querySelector('meta[property="og:description"]')?.getAttribute("content") ||
          "";

        // Coleta de texto relevante
        const textElements = Array.from(doc.querySelectorAll("h1, h2, p, section"))
          .map((el) => el.textContent?.trim() || "")
          .filter((t) => t.length > 20 && !t.includes("{") && !t.includes("function"));

        const sampleText = textElements.slice(0, 8).join(" | ").slice(0, 1000);

        summary.website = {
          url: validUrl,
          title: title.trim().slice(0, 120),
          metaDescription: metaDesc.trim().slice(0, 300),
          sampleText: sampleText,
        };
        summary.hasSocialData = true;
      }
    } catch (webErr) {
      console.warn("[SOCIAL_INTEL] Falha ao raspar website:", webErr);
    }
  }

  // 5. Busca Ativa Nominal de Concorrentes e Similares no Google/Web
  const targetSegment = segmentHint || summary.facebook?.category || registeredCategory || "";
  const targetBrand = brandNameHint || summary.instagram?.name || summary.facebook?.pageName || registeredName || "";
  const targetLoc = summary.facebook?.address || registeredLocation || "";

  if (targetSegment) {
    try {
      const competitorsResult = await searchActiveCompetitors(targetSegment, targetBrand, targetLoc);
      if (competitorsResult && competitorsResult.list.length > 0) {
        summary.competitors = competitorsResult;
        summary.hasSocialData = true;
      }
    } catch (compErr) {
      console.warn("[SOCIAL_INTEL] Aviso ao buscar concorrentes na web:", compErr);
    }
  }

  // 6. Montar o prompt contextual consolidado para a IA
  summary.combinedPromptContext = buildPromptContext(summary);

  return summary;
}

/**
 * Monta o bloco de contexto de inteligência digital para alimentar o motor de IA
 */
function buildPromptContext(summary: SocialIntelligenceSummary): string {
  if (!summary.hasSocialData && !summary.website && !summary.instagram && !summary.facebook && !summary.competitors) {
    return "";
  }

  const sections: string[] = [];
  sections.push("=== CONTEXTO DE INTELIGÊNCIA DIGITAL COLETADO NA WEB E REDES SOCIAIS ===");

  if (summary.instagram) {
    sections.push(`[INSTAGRAM OFICIAL]: ${summary.instagram.username}`);
    if (summary.instagram.name) sections.push(`- Nome Comercial: ${summary.instagram.name}`);
    if (summary.instagram.bio) sections.push(`- Biografia Oficial: "${summary.instagram.bio}"`);
    if (summary.instagram.website) sections.push(`- Link da Bio: ${summary.instagram.website}`);
    if (summary.instagram.topThemes?.length) {
      sections.push(`- Temas Recorrentes: ${summary.instagram.topThemes.join(", ")}`);
    }
    if (summary.instagram.recentPostsCaptions?.length) {
      sections.push("- Amostra de Legendas Recentes no Feed:");
      summary.instagram.recentPostsCaptions.forEach((cap, i) => {
        sections.push(`  ${i + 1}. "${cap}"`);
      });
    }
  }

  if (summary.facebook) {
    sections.push(`\n[PÁGINA OFICIAL DO FACEBOOK]: ${summary.facebook.pageName}`);
    if (summary.facebook.category) sections.push(`- Categoria: ${summary.facebook.category}`);
    if (summary.facebook.about) sections.push(`- Sobre a Empresa: "${summary.facebook.about}"`);
    if (summary.facebook.description) sections.push(`- Descrição: "${summary.facebook.description}"`);
    if (summary.facebook.address) sections.push(`- Localização: ${summary.facebook.address}`);
    if (summary.facebook.phone) sections.push(`- Telefone: ${summary.facebook.phone}`);
  }

  if (summary.website) {
    sections.push(`\n[PRESENÇA NA WEB & SITE INSTITUCIONAL]: ${summary.website.url}`);
    if (summary.website.title) sections.push(`- Título do Site: ${summary.website.title}`);
    if (summary.website.metaDescription) {
      sections.push(`- Proposta de Valor / Meta Description: "${summary.website.metaDescription}"`);
    }
    if (summary.website.sampleText) {
      sections.push(`- Trecho do Conteúdo Institucional: "${summary.website.sampleText}"`);
    }
  }

  if (summary.competitors?.list?.length) {
    sections.push(`\n[BENCHMARK & CONCORRENTES DIRETOS/SIMILARES MAPEADOS NA WEB]:`);
    summary.competitors.list.forEach((comp, idx) => {
      sections.push(`  ${idx + 1}. "${comp.name}"${comp.snippet ? ` - ${comp.snippet}` : ""}`);
    });
    sections.push(
      "INSTRUÇÃO DE CONTRASTE ESTRATÉGICO: Use os concorrentes reais identificados acima para enriquecer os 'Diferenciais Competitivos' e a lista de 'Posicionamentos a Evitar', deixando nítido o que diferencia nossa marca dessas alternativas reais do mercado."
    );
  }

  sections.push("=========================================================================");
  sections.push(
    "INSTRUÇÃO DE FUSÃO ESTRATÉGICA: Cruze os elementos visuais e semióticos da logomarca com o ecossistema digital real acima. Alinhe o tom de voz, público-alvo, personas, propósito, diferenciais e linhas editoriais com os temas já validados da empresa, garantindo total personalização e relevância prática."
  );

  return sections.join("\n");
}

function extractThemesFromCaptions(captions: string[]): string[] {
  const wordsMap: Record<string, number> = {};
  const stopWords = new Set([
    "para", "com", "uma", "mais", "sobre", "como", "pela", "pelo", "esse", "esta", "voce", "você", "tudo", "aqui", "onde", "quando", "quem", "qual", "muito", "anos", "dia", "dias", "hoje", "nosso", "nossa", "nossos", "nossas"
  ]);

  for (const cap of captions) {
    const tokens = cap.toLowerCase().match(/\b[a-záàâãéèêíïóôõöúçñ]{4,}\b/g) || [];
    for (const token of tokens) {
      if (!stopWords.has(token)) {
        wordsMap[token] = (wordsMap[token] || 0) + 1;
      }
    }
  }

  return Object.entries(wordsMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
}

/**
 * Realiza busca ativa na web de concorrentes e referências do mesmo segmento
 */
async function searchActiveCompetitors(
  segment: string,
  brandName?: string,
  location?: string
): Promise<{ queryUsed: string; list: SocialIntelligenceCompetitor[] } | undefined> {
  const cleanSegment = segment?.trim();
  if (!cleanSegment) return undefined;

  const queryParts = [cleanSegment];
  if (location?.trim()) queryParts.push(location.trim().slice(0, 30));
  queryParts.push("empresas concorrentes similares");
  const query = queryParts.join(" ");

  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) return undefined;

    const html = await res.text();
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    const results: SocialIntelligenceCompetitor[] = [];
    const elements = doc.querySelectorAll(".result");
    const brandLower = brandName?.toLowerCase().trim() || "";

    for (const el of Array.from(elements)) {
      const titleLink = el.querySelector(".result__title a");
      const snippetEl = el.querySelector(".result__snippet");
      const rawTitle = titleLink?.textContent?.trim() || "";
      const snippet = snippetEl?.textContent?.trim() || "";
      const href = titleLink?.getAttribute("href") || "";

      let compName = rawTitle.split(/[-|–:]/)[0].trim();
      if (!compName || compName.length < 3 || compName.length > 50) {
        compName = rawTitle.slice(0, 40).trim();
      }

      if (brandLower && compName.toLowerCase().includes(brandLower)) {
        continue;
      }

      const lowerTitle = rawTitle.toLowerCase();
      if (
        lowerTitle.includes("wikipedia") ||
        lowerTitle.includes("como escolher") ||
        lowerTitle.includes("o que é") ||
        lowerTitle.includes("significado")
      ) {
        continue;
      }

      if (compName && !results.some((r) => r.name.toLowerCase() === compName.toLowerCase())) {
        results.push({
          name: compName,
          snippet: snippet.slice(0, 160),
          url: href.startsWith("http") ? href : undefined,
        });
      }

      if (results.length >= 4) break;
    }

    if (results.length > 0) {
      return {
        queryUsed: query,
        list: results,
      };
    }
  } catch (err) {
    console.warn("[SOCIAL_INTEL] Falha na busca ativa de concorrentes:", err);
  }

  return undefined;
}

