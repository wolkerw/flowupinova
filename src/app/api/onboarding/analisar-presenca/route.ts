import { NextResponse } from "next/server";
import { JSDOM } from "jsdom";

export const maxDuration = 120; // Scraper + LLM costuma demorar um pouco

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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Chave do Gemini ausente no servidor." },
        { status: 500 }
      );
    }

    let scrapedText = "";

    // Tentar fazer o scraping do site se fornecido
    if (website) {
      try {
        console.log(`[ONBOARDING_IA] Iniciando scraping do site: ${website}`);
        // Usar User-Agent genérico para evitar bloqueios simples
        const response = await fetch(website, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html",
          },
          signal: AbortSignal.timeout(15000), // Timeout de 15s para não travar
        });

        if (response.ok) {
          const html = await response.text();
          // JSDOM para parsear e limpar o HTML
          const dom = new JSDOM(html);
          const document = dom.window.document;
          
          // Pegar title e description meta tags para ajudar o modelo
          const title = document.title || "";
          const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute("content") || "";

          // Remover scripts, styles e SVGs que só poluem o texto
          const elementsToRemove = document.querySelectorAll('script, style, svg, noscript, iframe, link, meta, img');
          elementsToRemove.forEach((el) => el.remove());

          // Pegar o texto limpo
          const bodyText = document.body?.textContent?.replace(/\s+/g, " ").trim() || "";
          
          scrapedText = `Título da página: ${title}\nDescrição: ${metaDesc}\n\nConteúdo: ${bodyText.substring(0, 15000)}`;
          console.log(`[ONBOARDING_IA] Scraping bem sucedido. Extraídos ${scrapedText.length} caracteres.`);
        } else {
          console.warn(`[ONBOARDING_IA] Falha ao acessar site: status ${response.status}`);
          scrapedText = "O site não pôde ser acessado ou bloqueou a extração. O servidor retornou erro.";
        }
      } catch (err: any) {
        console.warn(`[ONBOARDING_IA] Exceção ao fazer scraping:`, err.message);
        scrapedText = "O site não pôde ser acessado devido a um erro de conexão (timeout ou erro de DNS).";
      }
    }

    // Preparar o prompt estrito anti-alucinação
    const systemInstruction = `Você é um robô extrator de dados corporativos extremamente estrito e literal.
Sua única função é ler os dados capturados do site e do instagram da empresa e preencher um JSON de perfil comercial.

REGRA CRÍTICA ANTI-ALUCINAÇÃO (TOLERÂNCIA ZERO):
1. Você NÃO PODE deduzir, inventar, alucinar ou "chutar" nenhuma informação.
2. Se a informação não estiver EXPLICITAMENTE escrita no texto fornecido, ou se o texto informar que o site falhou/bloqueou, você DEVE retornar o valor como uma string vazia "".
3. Não crie slogans falsos, não crie telefones genéricos ou descrições inventadas. Retorne EXATAMENTE o que puder abstrair do texto.

TEXTO EXTRAÍDO DO SITE (${website}):
"""
${scrapedText}
"""

HANDLE DO INSTAGRAM (Se houver):
${instagram || "Não fornecido"}

Preencha os seguintes campos no formato JSON bruto. Deixe em branco ("") o que não encontrar:
{
  "name": "Nome da empresa/marca (vazio se não achar)",
  "category": "Segmento/Categoria da empresa em poucas palavras (vazio se não achar)",
  "description": "Uma breve descrição do que a empresa faz (máx 3 frases, vazio se não achar)",
  "phone": "Telefone de contato (vazio se não achar)",
  "address": "Endereço físico (se houver, vazio se não achar)",
  "email": "Email de contato (se houver, vazio se não achar)",
  "toneOfVoice": "Analise o texto e defina o tom de voz em uma palavra (ex: Formal, Descontraído, Luxuoso, etc). Vazio se não achar.",
  "slogan": "Frase de efeito ou slogan explícito (vazio se não achar)",
  "targetAudience": "Quem é o público alvo (vazio se não achar)"
}`;

    console.log("[ONBOARDING_IA] Enviando texto para extração no Gemini 1.5 Flash...");
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: "Você deve responder estritamente em JSON puro sem marcações markdown. Aja como um extrator de dados exato." }]
        },
        contents: [
          { role: "user", parts: [{ text: systemInstruction }] },
        ],
        generationConfig: {
          temperature: 0.0, // Temperatura 0 para focar em extração literal, nenhuma criatividade ou alucinação
          responseMimeType: "application/json",
        },
      }),
    });

    if (!geminiResponse.ok) {
      const err = await geminiResponse.text();
      throw new Error(`Gemini API Error: ${err}`);
    }

    const data = await geminiResponse.json();
    let textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textResponse) {
      throw new Error("Gemini retornou vazio.");
    }

    // Limpar possíveis formatações
    textResponse = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();

    const parsedJson = JSON.parse(textResponse);
    console.log("[ONBOARDING_IA] Dados extraídos com sucesso:", parsedJson);

    return NextResponse.json({ output: parsedJson });

  } catch (error: any) {
    console.error("[ONBOARDING_IA_ERROR]", error);
    return NextResponse.json(
      { error: "Erro interno na extração", details: error.message },
      { status: 500 }
    );
  }
}
