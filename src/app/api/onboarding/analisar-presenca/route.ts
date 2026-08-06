import { NextResponse } from "next/server";
import { JSDOM } from "jsdom";

export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const website = formData.get("website") as string;
    const instagram = formData.get("instagram") as string;
    const userId = formData.get("userId") as string;

    if (!website && !instagram) {
      return NextResponse.json(
        { error: "Forneça pelo menos o site ou o Instagram." },
        { status: 400 }
      );
    }


    let scrapedData = "";

    // Tentar fazer o scraping do site se fornecido
    if (website) {
      try {
        console.log(`[ONBOARDING_IA] Iniciando scraping do site: ${website}`);
        const response = await fetch(website, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html",
          },
          signal: AbortSignal.timeout(15000),
        });

        if (response.ok) {
          const html = await response.text();
          const dom = new JSDOM(html);
          const document = dom.window.document;
          
          const title = document.title || "";
          const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute("content") || "";
          
          // Extrair Meta Tags Visuais (og:image, theme-color, icon)
          const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute("content") || "";
          const themeColor = document.querySelector('meta[name="theme-color"]')?.getAttribute("content") || "";
          const icon = document.querySelector('link[rel="icon"]')?.getAttribute("href") || 
                       document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute("href") || "";

          // Extrair Imagens (procurando logos)
          const images: string[] = [];
          document.querySelectorAll('img').forEach(img => {
            const src = img.getAttribute("src");
            const alt = (img.getAttribute("alt") || "").toLowerCase();
            const id = (img.getAttribute("id") || "").toLowerCase();
            const cls = (img.getAttribute("class") || "").toLowerCase();
            if (src && (alt.includes("logo") || src.includes("logo") || id.includes("logo") || cls.includes("logo"))) {
              // Resolver URLs relativas
              try {
                images.push(new URL(src, website).href);
              } catch {
                images.push(src);
              }
            }
          });

          // Extrair Cores em CSS inline e estilos globais simples
          const styles: string[] = [];
          document.querySelectorAll('style').forEach(style => {
            const css = style.textContent || "";
            // Regex ultra simples para extrair hex colors se o arquivo CSS não for gigantesco
            if (css.length < 5000) {
              const hexMatches = css.match(/#[0-9a-fA-F]{3,6}/g);
              if (hexMatches) styles.push(...hexMatches);
            }
          });

          // Limpar o resto para extrair texto (agora que pegamos as imagens)
          const elementsToRemove = document.querySelectorAll('script, style, svg, noscript, iframe');
          elementsToRemove.forEach((el) => el.remove());
          const bodyText = document.body?.textContent?.replace(/\s+/g, " ").trim() || "";
          
          // Montar pacote de dados bruto
          scrapedData = `Título: ${title}
Descrição: ${metaDesc}
Cor do Tema (Meta): ${themeColor}
Favicon/Icon: ${icon ? new URL(icon, website).href : ""}
OG Image: ${ogImage ? new URL(ogImage, website).href : ""}
Possíveis Logos encontrados nas tags <img>: ${images.slice(0, 5).join(", ")}
Algumas cores CSS extraídas: ${[...new Set(styles)].slice(0, 10).join(", ")}

Conteúdo textual:
${bodyText.substring(0, 10000)}`;

          console.log(`[ONBOARDING_IA] Scraping (com extração visual) bem sucedido.`);
        } else {
          scrapedData = "O site não pôde ser acessado ou bloqueou a extração.";
        }
      } catch (err: any) {
        scrapedData = "O site não pôde ser acessado devido a um erro de conexão.";
      }
    }

    const systemInstruction = `Você é um robô extrator de dados corporativos estrito.
Sua única função é ler os metadados visuais e textuais capturados do site/instagram da empresa e preencher um JSON de perfil comercial e de marca.

REGRA CRÍTICA ANTI-ALUCINAÇÃO (TOLERÂNCIA ZERO):
1. Você NÃO PODE deduzir ou inventar nenhuma informação.
2. Se a informação não estiver EXPLICITAMENTE escrita no texto fornecido, retorne o valor como uma string vazia "".
3. Não invente cores ou URLs de logotipos que não estiverem na lista de "Possíveis Logos" ou "OG Image" / "Favicon".

DADOS EXTRAÍDOS DO SITE (${website}):
"""
${scrapedData}
"""

HANDLE DO INSTAGRAM:
${instagram || "Não fornecido"}

Preencha os seguintes campos no formato JSON bruto.
{
  "name": "Nome da empresa/marca (vazio se não achar)",
  "category": "Segmento/Categoria da empresa em poucas palavras",
  "description": "Uma breve descrição do que a empresa faz (máx 3 frases)",
  "phone": "Telefone de contato",
  "address": "Endereço físico",
  "email": "Email de contato",
  "toneOfVoice": "Analise o texto e defina o tom de voz em uma palavra",
  "slogan": "Frase de efeito explícita",
  "targetAudience": "Quem é o público alvo",
  "logoUrl": "A URL mais provável que contém a logomarca da empresa entre as extraídas. Se não tiver certeza ou se for SVG inline corrompido, deixe vazio.",
  "primaryColor": "A cor principal em HEX extraída DIRETAMENTE da imagem da logomarca (se houver imagem anexada) ou do CSS",
  "secondaryColor": "A segunda cor mais comum em HEX extraída da logomarca, ou vazio"
}`;

    // Baixar e injetar imagens candidatas para que a IA possa "enxergar" o logotipo e extrair as cores dele
    const candidateUrls = [ogImage, icon, ...images].filter(url => url && url.startsWith("http")).slice(0, 2);
    const imageParts: any[] = [];
    
    for (const url of candidateUrls) {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          const arrayBuffer = await res.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString('base64');
          const mimeType = res.headers.get('content-type') || 'image/png';
          // Gemini aceita imagens de até certo tamanho e com mimetype correto
          if (mimeType.startsWith('image/')) {
            imageParts.push({
              inlineData: {
                data: base64,
                mimeType: mimeType
              }
            });
          }
        }
      } catch (e) {
        console.warn("[ONBOARDING_IA] Falha ao baixar imagem para IA visualizar:", url);
      }
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return NextResponse.json(
        { error: "Chave do Gemini ausente no servidor." },
        { status: 500 }
      );
    }

    console.log(`[ONBOARDING_IA] Enviando dados para extração no Gemini 3.5 Flash (com ${imageParts.length} imagens anexadas)...`);
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${geminiKey}`;
    
    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: systemInstruction },
              ...imageParts
            ]
          }
        ],
        generationConfig: {
          temperature: 0.0,
          responseMimeType: "application/json"
        }
      }),
    });

    if (!geminiResponse.ok) {
      const err = await geminiResponse.text();
      throw new Error(`Gemini API Error: ${err}`);
    }

    const data = await geminiResponse.json();
    let textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textResponse) {
      throw new Error("OpenAI retornou vazio.");
    }

    const parsedJson = JSON.parse(textResponse);
    console.log("[ONBOARDING_IA] Dados extraídos com sucesso via OpenAI:", parsedJson);

    return NextResponse.json({ output: parsedJson });

  } catch (error: any) {
    console.error("[ONBOARDING_IA_ERROR]", error);
    return NextResponse.json(
      { error: "Erro interno na extração", details: error.message },
      { status: 500 }
    );
  }
}
