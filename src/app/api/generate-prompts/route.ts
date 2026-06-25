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
      console.error(
        "[GENERATE_PROMPTS_ERROR] Chave GEMINI_API_KEY não encontrada no arquivo de ambiente."
      );
      return NextResponse.json(
        {
          error:
            "Configure a chave GEMINI_API_KEY no arquivo .env.local para habilitar a geração de prompts.",
        },
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

CRITICAL COLOR RULES FOR PROMPTING (MANDATORY):
1. Translate all hex codes above (e.g. "${primaryHex}", "${secondaryHex}") into their plain, descriptive English color names (e.g. use "golden yellow", "deep royal blue", "dark charcoal gray", "vibrant orange").
2. ABSOLUTELY FORBIDDEN: Do NOT write literal hexadecimal codes (like "${primaryHex}", "${secondaryHex}", or any other color hex), the hash symbol (#), or words like "hexadecimal", "hex", "hex code", "primary color", "secondary color", "brand kit", or "brand color" in the generated prompts. The image generator will literally print these hex codes or technical words on the visual artwork, which is strictly prohibited.
3. Do NOT include technical variables, labels, or CSS terms (like "primary color", "secondary color", "brand color", "color value") in the generated prompts. Refer to the colors only by their plain English names.

CRITICAL NICHE & PRODUCT ALIGNMENT RULE (MANDATORY FOR GRAPHICS & METAPHORS):
You MUST ensure that the graphics, floating elements, icons, props, and visual metaphors are DIRECTLY and explicitly related to the brand's niche ("${category || "general"}") and the products it sells.
- DO NOT generate generic corporate tech startup elements (like financial growth bar charts, upward arrows, security shields, or molecular data grids) unless the brand's niche is literally finance, security, or data science.
- STYLE VARIETY: The graphics do NOT always have to be 3D. You should vary the style: use 3D objects in some concepts, flat 2D vector art, minimal outlines/line art, or sleek illustrative details in others, depending on what looks most sophisticated.
- EVERY single visual metaphor or graphic detail must remind the viewer of what the brand sells:
  - If the brand sells Blinds/Shades/Curtains (Persianas e Cortinas), the floating graphic elements and props MUST look like modern stylized blinds, elegant curtain fabric folds, window frames, or golden sun rays filtering through slats.
  - If the brand is in real estate or construction, the elements must be houses, keys, blueprints, or building blocks.
  - If the brand is in dentistry, the elements must be teeth, smiles, or healthcare icons.
- If you use floating elements, they must represent the tools, products, or core theme of the business. Never generic dashboard metrics.

Your CRITICAL mission is to strategically and organically blend these brand colors (primary, secondary, and complementary if provided, translated to descriptive names) into the scenic environment of ALL 3 image concepts:
1. **Scenic Lighting Accent:** Use these colors in atmospheric lighting, neon signs, glowing bokeh circles, or soft rim light reflecting on the edges of the main subject.
2. **Prop Integration:** Place subtle and elegant props within the scene that carry these colors.
3. **Harmonious Backgrounds:** Blend these colors in abstract canvas backgrounds, soft wall paint, studio backdrops, or modern organic drapery. If a Background/Studio Color Hex is specified, use its plain color name for the backdrop/studio setup.
4. **Natural Integration:** The branding must look premium, modern, and extremely tasteful. DO NOT paint the entire image, the main product, or the background in a single flat color block. Keep it high-end and photorealistic.

${
  fontsText
    ? `
# TYPOGRAPHY RULES (MANDATORY TEXT RENDERING PERSONALIZATION)
When rendering the literal text/title on the image, instruct the generator to follow the brand's typography:
${fontsText}
Instruct the typography to be rendered using the specified Primary Font for titles/headers or using the specified General Typographic Style (e.g. "write the literal text '...' using a clean, sans-serif Montserrat font to match the brand's typography").
`
    : ""
}
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
## ⚡ OPTION 2 — LIFESTYLE HYBRID COLLAGE (MANDATORY RULE: MUST HAVE PEOPLE AND INTEGRATED GRAPHICS/VECTORS ALIGNED TO NICHE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUBJECT: A confident real person (professional, entrepreneur, creator) in a modern setting, dynamically integrated with floating premium graphic elements, interface vectors, or conceptual icons related to the brand's niche and products (CRITICAL: Do NOT show generic financial bar charts or arrows unless the brand is in finance. For instance, if the brand sells blinds/curtains, show floating stylized blinds, curtain folds, or window light reflections. The graphic style can vary: it can be 3D shapes, elegant flat 2D vectors, or minimal thin line art).
STYLE & LAYOUT:
- **Photo-Graphic Fusion:** Blending realistic human photography with high-end, clean graphic design assets (which can be 3D shapes, flat 2D graphics, or elegant line-art vectors). The graphics must float naturally in the air, casting soft reflections or realistic shadows if they are 3D, or overlaying cleanly as modern UI/graphic elements.
- **Niche-Specific Metaphors:** The shapes/vectors must represent the brand's actual product or segment. Never default to generic tech startup graphics.
- **Negative Space:** Maintain 30-40% of the frame as clean background area for text overlay, ensuring the graphics do not clutter the copy space.
- **Typographic Integration (Differentiated Text Layout):** The literal text/title must NOT just be placed in a straight line at the bottom. Instead, integrate it dynamically into the scene. For example, render the text using a combination of a bold heading font for the main word and a light font for the secondary words (typographic contrast). Place the text aligned to the negative space side, using the brand's primary color for the key highlighted word and white or the secondary color for the rest.
CAMERA & LENS:
- Medium shot (waist up) or close-up portrait.
- 50mm or 85mm lens, f/2.8 to keep the person and the nearest graphic elements in sharp focus while creating a soft blur in the deep background.
LIGHTING:
- Balanced studio lighting or modern office lighting. Use subtle colored gel lighting (using the brand's primary/secondary colors) reflecting on the person's face and bouncing off the graphics for a seamless visual blend.
BRAND KIT ALIGNMENT (MANDATORY):
- The graphic shapes, vectors, icons, and colored lights MUST strictly use the brand's Primary, Secondary, and Complementary colors.
- The text overlay must match the brand's typography.
MANDATORY PROHIBITION: Do NOT make the graphics look like cheap flat 2D clip art. If using 2D, it must look like premium minimalist vector icons or professional UI elements; if 3D, it must have depth, material textures (like glass, matte plastic, or metallic), and professional lighting.
 
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## ⚡ OPTION 3 — CONCEPTUAL / MINIMALIST / GRAPHIC STUDIO (MANDATORY RULE: BEHANCE / DRIBBBLE / DESIGNI STYLE ALIGNED TO NICHE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUBJECT: A premium, modern graphic design composition focusing on a stylized object, equipment, or conceptual symbol DIRECTLY associated with the brand's niche and products (CRITICAL: Do NOT show random abstract shapes. For blinds/curtains, show a stylized designer blind panel, decorative curtain rods, or window frames. For audio, show a sleek retro microphone. For dental, show a stylized tooth model. The central elements can be represented as a 3D object, a clean flat 2D layout, or an elegant line art composition).
STYLE & LAYOUT:
- **Dribbble & Behance Aesthetics:** Embed the central topic object inside a trendy design portfolio setup. Surround the object with accent elements (such as frosted glass panels, floating geometric shapes, flat vectors, or thin lines representing the brand's niche), and place it on a clean geometric platform/pedestal. The background must feature a smooth, luxury color gradient.
- **Designi Commercial Standard:** Organize the scene with a clean advertising layout, maintaining a strong visual hierarchy. Add soft, realistic contact shadows cast by the object and platforms to ground them naturally.
- **Negative Space:** Maintain 45-55% of the frame as clean negative space (smooth backdrop) for text placement.
- **High-End Typographic Design (Differentiated Text Layout):** The literal text/title must be treated as a premium graphic design piece, integrated creatively into the composition. Choose one of these styles:
  1. *Editorial Magazine Style:* Make the main word of the title gigantic, bold, and in uppercase, aligned to a side, while the rest of the text is smaller and elegant, creating a layout that looks like a luxury design portfolio (Behance) or a premium magazine cover.
  2. *3D Spatial Depth:* Position the 3D-styled text so it sits behind some floating glassmorphism panels or behind the central object, intersecting naturally to build visual depth.
  3. *Badge/Pill Accent:* Frame the main keyword of the title inside a clean geometric shape (like a colored pill capsule, rounded rectangle badge, or a minimalist border outline) using the brand's primary color, giving it a strong sticker/advertising pop.
  4. *Float Card with Giant Background Text:* Frame the message inside a rounded white/light floating card. Directly behind this card, place massive, bold background text (the main keyword) in a vibrant brand color, partially cropped/cut off by the image borders, creating a strong multi-layered advertising look (like a modern notice/reminder).
  5. *Asymmetrical Contrast Style (Sports/Promo):* Render the title with extreme contrast. Make one key letter (like a giant letter "X") much larger, tilted, and colored in the brand's primary yellow or orange, while the remaining words are stacked in clean, thick, white block lines. Add small decorative badges (like tiny flag icons or badges) next to the text.
  6. *Neon Event Style:* Render the text with a gorgeous vertical color gradient (such as vibrant orange-to-pink or electric blue-to-purple) with a soft glowing backlight behind the letters, making the typography pop out dynamically.
  7. *3D Physical Material Style:* Render the main words of the literal text using a highly detailed, volumetric cursive font resembling realistic physical materials aligned with the niche (e.g. for a rustic/festive theme, render the text as a thick, detailed brown and blue braided rope with realistic fiber textures and contact shadows).
  8. *High-Fashion Serif Contrast:* Display the main word of the title in a massive, elegant modern Serif typeface with high stroke contrast, rendered in a soft pastel coral/orange color, while the secondary words are styled small and clean. Add subtle 3D shapes (like heart/star models) floating gently on the image edges.
  9. *Asymmetrical Compact Stack:* Stack the words of the title vertically in a tight, asymmetric block using ultra-bold, condensed sans-serif letters, alternating colors between the brand's primary yellow and secondary blue, paired with iconic 3D elements (like a golden trophy or shield).
  10. *Clean Info Card with 3D Props:* Present the dates or key text organized inside distinct, realistic 3D calendar sheet cards or geometric badges, combined with sleek 3D graphic accents (like stars, checkmarks, or calendars) on a clean, modern backdrop.
  11. *Split-Layout with Giant Lateral Title:* Place a vertical blue/brand colored card/container on one side holding the details of the post, while a massive keyword of the title is placed in the background in a bold color, extending out and cropped by the image borders.
CAMERA & LENS:
- Front-facing flat graphic composition OR elegant 30-degree isometric view.
- Wide angle 24mm or tilt-shift for a clean, sharp, architectural look. Everything in sharp focus (f/8–f/11).
LIGHTING:
- Soft, even, diffused studio lighting. Use subtle colored gel lights matching the brand's complementary color to cast elegant rim highlights on the object and glass panels.
BRAND KIT ALIGNMENT (MANDATORY):
- The background gradient, geometric accent shapes, and gel highlights MUST strictly use the brand's Primary, Secondary, and Complementary colors.
- The text overlay must match the brand's typography.
MANDATORY PROHIBITION: Do NOT include real people. Do NOT use random abstract shapes that have no connection to the post's topic.


${brandingInstruction}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CRITICAL PROMPT ENGINEERING RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. LANGUAGE: Write all visual descriptions in English only.
2. TEXT ELEMENT (PORTUGUESE TITLE): Embed the post title literally in double quotes inside the prompt, instructing the AI to render it as a highly designed and styled layout on the image, avoiding boring linear text.
   - Design Guidelines: Instruct the image generator to play with the text layout. Use typographic contrast (e.g., combining bold uppercase words with elegant lowercase clean sans-serif/serif letters). You can specify split-line layout, overlapping elements, or highlighting the key word of the title in the brand's primary color.
   - Correct format example: ...with the literal text "TÍTULO EXATO EM PORTUGUÊS" rendered in a high-end editorial layout, where the word "DESTAQUE" is in massive bold uppercase using the brand's primary color, and the rest of the text is aligned cleanly below it in white...
   - PORTUGUESE ACCENTUATION RULE (CRITICAL - ZERO TOLERANCE FOR ACCENT ERRORS): To ensure perfect Portuguese (pt_BR) spelling and characters (such as á, é, í, ó, ú, ç, ã, õ, ê, ô, â, ô), you MUST explicitly list and describe each accent mark in the prompt text.
     - You MUST check every letter with an accent in the title (like á, é, í, ó, ú, ç, ã, õ, ê, ô) and describe it explicitly in English so the image generator doesn't make mistakes.
     - Example: If the title is "Vídeos Curtos Virais", write: ...render the literal text "Vídeos Curtos Virais" with a clean acute accent mark on the letter "í" in "Vídeos". Ensure all accent marks and special characters (like á, é, í, ó, ú, ç, ã, õ) are rendered perfectly with no spelling errors or distorted glyphs, using a standard sans-serif font like Montserrat or Arial which has full UTF-8 character support.
     - NEVER output raw text without describing the accentuation system to the model.
   - FORBIDDEN: Do NOT include the subtitle as image text. It will cause visual noise and blur.
3. PREMIUM QUALITY TAGS: End every prompt with these quality booster tags: "ultra-realistic, award-winning advertising photography, 8K resolution, hyper-detailed, professional color grading, shot on Phase One IQ4".
4. RADICAL DIFFERENTIATION CHECK: Before outputting, mentally verify that the 3 prompts describe COMPLETELY DIFFERENT visual styles, color temperatures, settings, compositions, and moods. If two prompts feel similar, rewrite the weaker one to be more distinct.
5. MINIMUM LENGTH: Each prompt must be at least 120 words to ensure sufficient detail.
6. ZERO TOLERANCE ON HEX CODES, HASH SYMBOLS AND TECHNICAL LABELS (CRITICAL):
   - You MUST NOT output any hexadecimal color codes (e.g. #FFCC29, #373435, #000, #FFFFFF, etc.), the hash symbol (#), or CSS terms.
   - You MUST NOT output words like "hexadecimal", "hex", "hex code", "RGB", "HSL", "primary color", "secondary color", "brand kit", or "brand color".
   - If you include any of these technical words, symbols (#) or hex codes, the image generator will literally print them on the image, ruining the artwork.
   - All colors must be described using natural descriptive color words in English (e.g., "rich sky blue", "elegant forest green", "warm pastel pink", "minimalist dark gray").

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
        console.log(
          `[GENERATE_PROMPTS] Enviando requisição para a API do Gemini usando modelo: ${model}...`
        );

        const response = await fetch(geminiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemInstructionText }],
            },
            contents: [
              {
                role: "user",
                parts: [{ text: `Conteúdo da publicação:\n${summaryText}` }],
              },
            ],
            generationConfig: {
              temperature: 1.2,
              responseMimeType: "application/json",
            },
          }),
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
        console.warn(
          `[GENERATE_PROMPTS_WARN] Falha ao chamar o modelo ${model}:`,
          err.message || err
        );
        lastError = err;
      }
    }

    if (!aiResponseText) {
      throw new Error(
        `Todos os modelos do Gemini falharam. Último erro: ${lastError?.message || lastError}`
      );
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
          prompt: promptsArray.map((p: any) => String(p)),
        },
      },
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
