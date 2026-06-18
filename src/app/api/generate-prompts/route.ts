import { NextResponse } from "next/server";

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const { content: selContent, businessProfile } = await request.json();

    if (!selContent) {
      return NextResponse.json({ error: "Conteúdo da publicação não enviado" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("[GENERATE_PROMPTS_ERROR] Chave GEMINI_API_KEY não encontrada no arquivo de ambiente.");
      return NextResponse.json(
        { error: "Configure a chave GEMINI_API_KEY no arquivo .env.local para habilitar a geração de prompts." },
        { status: 500 }
      );
    }

    let brandingInstruction = "";
    if (businessProfile) {
      const { name, category, primaryColor, secondaryColor, brandKit } = businessProfile;
      const primaryHex = primaryColor || "#000000";
      const secondaryHex = secondaryColor || "#FFFFFF";
      
      let extendedColorsText = "";
      if (brandKit?.extendedColors) {
        if (brandKit.extendedColors.complementary) {
          extendedColorsText += `- Complementary Color Hex: ${brandKit.extendedColors.complementary}\n`;
        }
        if (brandKit.extendedColors.background) {
          extendedColorsText += `- Background/Studio Color Hex: ${brandKit.extendedColors.background}\n`;
        }
      }

      let fontsText = "";
      if (brandKit?.fonts) {
        if (brandKit.fonts.primaryFont) {
          fontsText += `- Primary Font (Headers): "${brandKit.fonts.primaryFont}"\n`;
        }
        if (brandKit.fonts.secondaryFont) {
          fontsText += `- Secondary Font (Body): "${brandKit.fonts.secondaryFont}"\n`;
        }
        if (brandKit.fonts.style) {
          fontsText += `- General Typographic Style: ${brandKit.fonts.style}\n`;
        }
      }

      brandingInstruction = `
# BRANDING AND VISUAL IDENTITY RULES (MANDATORY PERSONALIZATION)
You are generating advertising images for the brand "${name || "a premium brand"}" which operates in the "${category || "general"}" niche.
The brand's visual identity is defined by the following palette:
- Primary Color Hex: ${primaryHex}
- Secondary Color Hex: ${secondaryHex}
${extendedColorsText}
Your CRITICAL mission is to strategically and organically blend these brand colors (primary, secondary, and complementary if provided) into the scenic environment of ALL 3 image concepts:
1. **Scenic Lighting Accent:** Use these colors in atmospheric lighting, neon signs, glowing bokeh circles, or soft rim light reflecting on the edges of the main subject.
2. **Prop Integration:** Place subtle and elegant props within the scene that carry these colors.
3. **Harmonious Backgrounds:** Blend these colors in abstract canvas backgrounds, soft wall paint, studio backdrops, or modern organic drapery. If a Background/Studio Color Hex is specified, use that exact shade for the backdrop/studio setup.
4. **Natural Integration:** The branding must look premium, modern, and extremely tasteful. DO NOT paint the entire image, the main product, or the background in a single flat color block. Keep it high-end and photorealistic.

${fontsText ? `
# TYPOGRAPHY RULES (MANDATORY TEXT RENDERING PERSONALIZATION)
When rendering the literal text/title on the image, instruct the generator to follow the brand's typography:
${fontsText}
Instruct the typography to be rendered using the specified Primary Font for titles/headers or using the specified General Typographic Style (e.g. "write the literal text '...' using a clean, sans-serif Montserrat font to match the brand's typography").
` : ""}
`;
    }

    // 1. Prompt do Diretor de Arte Otimizador de Prompts
    const systemInstructionText = `
Você é um Diretor de Arte de Publicidade e Especialista em Engenharia de Prompts para IAs geradoras de imagem (como Imagen e Flux).

# TAREFA
Transformar o título e subtítulo recebidos em exatamente 3 prompts descritivos de imagem ultra detalhados em INGLÊS. Cada prompt representará um design/imagem conceito diferente para o mesmo post.
${brandingInstruction}
# REGRAS CRÍTICAS DE ENGENHARIA DE PROMPT
1. IDIOMA DO PROMPT: Redija toda a descrição visual do cenário, pessoas, pose e iluminação em INGLÊS.
2. ELEMENTO DE TEXTO (PORTUGUÊS): Insira o título do post de forma literal dentro de aspas duplas inglesas no prompt, instruindo a IA a desenhá-lo na imagem.
   - Exemplo: "...with the literal text "TÍTULO EXATO EM PORTUGUÊS" written in clean, modern typography...".
3. MÁXIMO DE TEXTO: Somente inclua o título. É EXPRESSAMENTE PROIBIDO tentar incluir o subtítulo como texto na imagem, pois isso causará borrões e poluição.
4. ESTILO VISUAL PREMIUM: Descreva uma fotografia publicitária profissional de produto ou estilo de vida ("commercial food photography", "premium editorial portrait", etc.), detalhando a iluminação (ex: "studio lighting", "soft natural morning light"), lente de câmera (ex: "35mm lens, sharp focus") e profundidade de campo (ex: "depth of field, beautiful bokeh").

# FORMATO DE SAÍDA EXIGIDO (JSON ESTRITO)
Responda exclusivamente no formato JSON abaixo, sem qualquer introdução, conclusão ou marcações markdown:
{
  "prompts": [
    "A professional commercial food photography of a fresh tasty hamburger... with the literal text 'TITULO'...",
    "A professional lifestyle photography of a cozy gourmet restaurant... with the literal text 'TITULO'...",
    "A professional flat lay studio photography showing organic burger ingredients... with the literal text 'TITULO'..."
  ]
}
`;

    // 2. Chamar a API do Gemini com Fallback Resiliente
    const modelsToTry = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"];
    let aiResponseText = "";
    let lastError: any = null;

    const summaryText = `Título: ${selContent.titulo}\nSubtítulo: ${selContent.subtitulo}\nHashtags: ${Array.isArray(selContent.hashtags) ? selContent.hashtags.join(" ") : selContent.hashtags}`;

    for (const model of modelsToTry) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        console.log(`[GENERATE_PROMPTS] Enviando requisição para a API do Gemini usando modelo: ${model}...`);
        
        const response = await fetch(geminiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemInstructionText }]
            },
            contents: [
              {
                role: "user",
                parts: [{ text: `Conteúdo da publicação:\n${summaryText}` }]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              responseMimeType: "application/json"
            }
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Erro na API do Gemini (status ${response.status}): ${errorText}`);
        }

        const resData = await response.json();
        const candidateText = resData?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!candidateText) {
          throw new Error(`Resposta do Gemini vazia ou em formato inesperado`);
        }

        aiResponseText = candidateText.trim();
        break;
      } catch (err: any) {
        console.warn(`[GENERATE_PROMPTS_WARN] Falha ao chamar o modelo ${model}:`, err.message || err);
        lastError = err;
      }
    }

    if (!aiResponseText) {
      throw new Error(`Todos os modelos do Gemini falharam. Último erro: ${lastError?.message || lastError}`);
    }

    // 3. Processar e estruturar o JSON de retorno no padrão do n8n esperado pelo frontend
    let parsedData: any;
    try {
      parsedData = JSON.parse(aiResponseText);
    } catch (e) {
      const cleanedText = aiResponseText.replace(/```json|```/g, "").trim();
      parsedData = JSON.parse(cleanedText);
    }

    const promptsArray = parsedData.prompts || parsedData;

    if (!Array.isArray(promptsArray)) {
      throw new Error("O JSON retornado pela IA não contém um array de prompts válido.");
    }

    const outputFormat = [
      {
        output: {
          prompt: promptsArray.map((p: any) => String(p))
        }
      }
    ];

    console.log(`[GENERATE_PROMPTS] Sucesso ao gerar ${promptsArray.length} prompts.`);
    return NextResponse.json(outputFormat);
  } catch (error: any) {
    console.error("[GENERATE_PROMPTS_ERROR] Erro interno na API Route:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno ao processar a geração de prompts.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
