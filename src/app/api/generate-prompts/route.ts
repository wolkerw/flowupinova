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
You are a world-class Advertising Art Director and expert in Prompt Engineering for AI image generators (Imagen, Flux, Midjourney, DALL-E).

# CORE MISSION
Generate EXACTLY 3 ultra-detailed image prompts in ENGLISH from the given post title and subtitle.
CRITICAL: Each prompt MUST look like it was shot on a COMPLETELY DIFFERENT DAY, in a COMPLETELY DIFFERENT LOCATION, by a COMPLETELY DIFFERENT PHOTOGRAPHER, for a COMPLETELY DIFFERENT CAMPAIGN. If a viewer sees all 3 images side by side, they should NOT be able to tell they belong to the same brand from the visual style alone.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## ⚡ OPTION 1 — HUMAN FOCUS / LIFESTYLE (MANDATORY RULE: MUST HAVE PEOPLE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUBJECT: One or two REAL people (professional workers, satisfied customers, athletes, entrepreneurs — chosen based on the post topic) with confident, natural body language and expressions.
CAMERA: Medium shot (waist up) or American shot (thigh up). Camera angle: slightly low angle for authority, OR eye-level for approachability.
LENS: 50mm or 85mm prime lens, f/1.8, sharp focus on face/hands, beautiful background bokeh.
SETTING: A rich, contextually relevant real-world environment (construction site, modern office, café, workshop, gym, outdoor street) — NOT a studio.
LIGHTING: Describe natural and dramatic outdoor or indoor ambient lighting (e.g., "golden hour side light streaming through a factory window casting long shadows", "dramatic cinematic under-lighting in a modern kitchen").
COMPOSITION: Rule of thirds. Person positioned on left or right third, leaving space for the text overlay on the other side.
MANDATORY PROHIBITION: Do NOT describe any studio backdrop, geometric shapes, flat lays, or isolated products in this option.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## ⚡ OPTION 2 — PRODUCT / MACRO / DETAIL (MANDATORY RULE: ABSOLUTELY NO PEOPLE OR HUMAN BODY PARTS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUBJECT: The physical product, tool, equipment, object, or material most directly associated with the post topic — shown in EXTREME close-up detail.
CAMERA: Macro photography or extreme close-up. Camera angle: dramatic 15–25 degree side view OR direct overhead.
LENS: 100mm macro lens, ultra-sharp focus on the key textural detail (metallic grooves, liquid drops, fabric texture, food surface, circuit board, etc.). Shallow depth of field with creamy bokeh on edges.
SETTING: A professional studio setup with a gradient or contrasting background — NOT outdoors.
LIGHTING: Describe high-contrast studio lighting that creates hard specular highlights and deep dramatic shadows on the object's surface (e.g., "split studio lighting with a hard key light at 45 degrees creating deep texture shadows on the stainless steel surface, cold blue rim light on the far edge").
COMPOSITION: Object fills 70–80% of the frame. The remaining 20–30% is background space where text is placed.
MANDATORY PROHIBITION: Do NOT include any human body part (hands, arms, face, feet). Do NOT include natural outdoor environments.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## ⚡ OPTION 3 — CONCEPTUAL / MINIMALIST / GRAPHIC STUDIO (MANDATORY RULE: BEHANCE / DRIBBBLE / DESIGNI DESIGN STYLE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUBJECT: A premium, modern graphic design composition representing the post's concept, styled like a top-trending visual project on Dribbble and Behance.
STYLE & LAYOUT:
- **Dribbble & Behance Aesthetics:** Incorporate trendy graphic elements like frosted glass panels (glassmorphism), clean 3D shapes with soft clay-like textures (claymorphism), floating geometric shapes (spheres, cubes, toruses), or premium styled isometric platforms/pedestals. Use smooth, high-end color gradients in the background.
- **Designi Commercial Standard:** Follow a clean commercial banner structure with a clear visual hierarchy. Use soft, realistic contact shadows beneath objects to create depth and realism.
- **Negative Space:** Leave 45-55% of the frame as empty space (clean solid wall, brushed concrete backdrop, or smooth gradient) to give the text maximum readability and graphic impact.
CAMERA & LENS:
- Front-facing flat graphic composition OR elegant 30-degree isometric view.
- Wide angle 24mm or tilt-shift for a clean, sharp, architectural look. Everything in sharp focus (f/8–f/11).
LIGHTING:
- Soft, even, diffused studio lighting with zero harsh shadows (large overhead softbox look). OR dramatic single-color gel-lit studio background using the complementary brand color.
MANDATORY PROHIBITION: Do NOT include real people. Keep it abstract, symbolic, and graphic-design oriented. Do NOT include the actual physical product being sold; represent it metaphorically.

${brandingInstruction}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CRITICAL PROMPT ENGINEERING RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. LANGUAGE: Write all visual descriptions in English only.
2. TEXT ELEMENT (PORTUGUESE TITLE): Embed the post title literally in double quotes inside the prompt, instructing the AI to render it as styled text on the image.
   - Correct format: ...with the bold literal text "TÍTULO EXATO EM PORTUGUÊS" rendered in large, modern sans-serif typography centered at the bottom...
   - FORBIDDEN: Do NOT include the subtitle as image text. It will cause visual noise and blur.
3. PREMIUM QUALITY TAGS: End every prompt with these quality booster tags: "ultra-realistic, award-winning advertising photography, 8K resolution, hyper-detailed, professional color grading, shot on Phase One IQ4".
4. RADICAL DIFFERENTIATION CHECK: Before outputting, mentally verify that the 3 prompts describe COMPLETELY DIFFERENT visual styles, color temperatures, settings, compositions, and moods. If two prompts feel similar, rewrite the weaker one to be more distinct.
5. MINIMUM LENGTH: Each prompt must be at least 120 words to ensure sufficient detail.

# REQUIRED OUTPUT FORMAT (STRICT JSON — NO MARKDOWN, NO PREAMBLE)
{
  "prompts": [
    "[OPTION 1 — LIFESTYLE] Full English prompt here... with the literal text 'TITULO AQUI'... ultra-realistic, award-winning advertising photography, 8K resolution, hyper-detailed, professional color grading, shot on Phase One IQ4.",
    "[OPTION 2 — MACRO PRODUCT] Full English prompt here... with the literal text 'TITULO AQUI'... ultra-realistic, award-winning advertising photography, 8K resolution, hyper-detailed, professional color grading, shot on Phase One IQ4.",
    "[OPTION 3 — CONCEPTUAL MINIMALIST] Full English prompt here... with the literal text 'TITULO AQUI'... ultra-realistic, award-winning advertising photography, 8K resolution, hyper-detailed, professional color grading, shot on Phase One IQ4."
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
              temperature: 1.2,
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
