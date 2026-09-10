import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Jimp } from "jimp";
import { safeParseJSON } from "@/lib/utils";
import { aiRateLimit, getIpFromRequest } from "@/lib/rate-limit";
import { getAuthenticatedUser } from "@/lib/api-auth";

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const ip = getIpFromRequest(request);
    const { success, limit, reset, remaining } = await aiRateLimit.limit(ip);
    
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
          },
        }
      );
    }

    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: "Autenticação obrigatória para gerar prompts." },
        { status: 401 }
      );
    }

    let selContent: any = null;
    let businessProfile: any = null;
    let userId = "";
    let inspirationFile: File | null = null;

    let insertTextOnImage = true;
    let textOverlayMode = "INFOGRAPHIC";
    let productHeadline = "";
    let layoutStyle = "CLEAN_LUXURY";

    const contentType = request.headers.get("content-type") || "";
    let selectedPersona: any = null;
    if (contentType?.includes("multipart/form-data")) {
      const formData = await request.formData();
      const contentStr = formData.get("content") as string;
      if (contentStr) selContent = JSON.parse(contentStr);
      const profileStr = formData.get("businessProfile") as string;
      if (profileStr) businessProfile = JSON.parse(profileStr);
      const personaStr = formData.get("selectedPersona") as string;
      if (personaStr) {
        try {
          selectedPersona = JSON.parse(personaStr);
        } catch {
          selectedPersona = personaStr;
        }
      }
      userId = (formData.get("userId") as string) || "";
      inspirationFile = formData.get("inspiration_file") as File | null;
      if (formData.has("insertTextOnImage")) {
        insertTextOnImage = formData.get("insertTextOnImage") === "true";
      }
      if (formData.has("textOverlayMode")) {
        textOverlayMode = (formData.get("textOverlayMode") as string) || "INFOGRAPHIC";
      }
      if (formData.has("productHeadline")) {
        productHeadline = (formData.get("productHeadline") as string) || "";
      }
      if (formData.has("layoutStyle")) {
        layoutStyle = (formData.get("layoutStyle") as string) || "CLEAN_LUXURY";
      }
    } else {
      const body = await request.json();
      selContent = body.content;
      businessProfile = body.businessProfile;
      selectedPersona = body.selectedPersona;
      userId = body.userId;
      if (body.insertTextOnImage !== undefined) {
        insertTextOnImage = body.insertTextOnImage;
      }
      if (body.textOverlayMode !== undefined) {
        textOverlayMode = body.textOverlayMode;
      }
      if (body.productHeadline !== undefined) {
        productHeadline = body.productHeadline;
      }
      if (body.layoutStyle !== undefined) {
        layoutStyle = body.layoutStyle;
      }
    }

    if (!selContent) {
      return NextResponse.json({ error: "Conteúdo da publicação não enviado" }, { status: 400 });
    }

    if (userId && authUser.uid !== userId && !authUser.isAdmin) {
      return NextResponse.json(
        { error: "Operação não autorizada para este usuário." },
        { status: 403 }
      );
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

    let approvedPromptsExamples = "";
    if (userId) {
      try {
        console.log(
          `[GENERATE_PROMPTS] Buscando prompts de sucesso do mediaGallery para o usuário ${userId}...`
        );
        const gallerySnap = await adminDb
          .collection(`users/${userId}/mediaGallery`)
          .limit(50)
          .get();

        const approvedItems: { prompt: string; createdAt: any }[] = [];
        gallerySnap.forEach((doc: any) => {
          const data = doc.data();
          if (data.usedInPostId && data.prompt && data.source === "wizard_generation") {
            approvedItems.push({
              prompt: data.prompt,
              createdAt: data.createdAt?.toDate
                ? data.createdAt.toDate()
                : new Date(data.createdAt || 0),
            });
          }
        });

        // Ordenar em memória pela data de criação decrescente
        approvedItems.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        // Pegar os 5 prompts mais recentes aprovados pelo usuário
        const topApproved = approvedItems.slice(0, 5).map((item) => item.prompt);

        if (topApproved.length > 0) {
          approvedPromptsExamples = `
# STRUCTURAL PROMPTING SAMPLES (FEW-SHOT LEARNING - FOR COMPOSITION & CAMERA STYLE ONLY)
The following are structural reference samples of image prompts previously created in the system.
CRITICAL MANDATE: Use these samples ONLY to learn the desired level of photographic detail, lighting keywords, camera angles, and composition phrasing.
ABSOLUTELY FORBIDDEN: NEVER copy, reuse, or adapt any company name, brand name, logo, topic, or title from these examples (e.g. do not copy past brand names or previous titles).
You MUST generate prompts EXCLUSIVELY for the current brand "${businessProfile?.name || "the brand"}" (Niche: "${businessProfile?.category || "general"}") and the current post title: "${selContent?.titulo || ""}".
${topApproved.map((p, idx) => `Sample #${idx + 1}: ${p}`).join("\n\n")}
`;
          console.log(
            `[GENERATE_PROMPTS] Encontrados ${topApproved.length} prompts de sucesso para few-shot learning (estritamente estrutural).`
          );
        } else {
          console.log(
            `[GENERATE_PROMPTS] Nenhum prompt de sucesso anterior encontrado para este usuário.`
          );
        }
      } catch (err: any) {
        console.warn(
          `[GENERATE_PROMPTS_WARN] Falha ao buscar prompts aprovados do Firestore:`,
          err.message || err
        );
      }
    }

    let inspirationYaml = "";

    if (inspirationFile) {
      try {
        console.log("[GENERATE_PROMPTS] Processando arquivo de inspiração para análise visual...");
        const arrayBuffer = await inspirationFile.arrayBuffer();
        let buffer = Buffer.from(arrayBuffer);
        let mimeType = inspirationFile.type || "image/jpeg";

        try {
          const image = await Jimp.read(buffer);
          if (image.width > 768 || image.height > 768) {
            image.resize({ w: 768, h: 768 });
          }
          buffer = await image.getBuffer("image/jpeg");
          mimeType = "image/jpeg";
        } catch (jimpErr) {
          console.warn("[GENERATE_PROMPTS_WARN] Falha ao redimensionar imagem com Jimp, usando imagem original:", jimpErr);
        }

        const base64Image = buffer.toString("base64");

        const geminiAnalysisPrompt = `Analyze the given social media post print (inspiration reference) with extreme visual precision.
Deconstruct the image into a detailed description so an AI image generator can recreate the scene with high fidelity.
Describe:
1. SUBJECT & POSE: What is the main subject/person/object? Describe their exact pose, clothing, posture, and facial expression or product placement.
2. ENVIRONMENT & SETTING: Describe the exact room, architecture, outdoor/indoor location, furniture, walls, floor, plants, and background scenery.
3. COMPOSITION & FRAMING: Camera distance (e.g. medium shot, wide shot, close-up), camera height/angle, subject position (e.g. centered, right third), negative space areas.
4. LIGHTING & ATMOSPHERE: Light sources, lighting direction, shadows, atmosphere (e.g. warm golden sunset, moody dark room, bright daylight).
5. COLOR PALETTE: Main colors, tones, and contrast.

Return the description strictly in YAML format:
  subject_description: "..."
  environment_scenery: "..."
  composition_framing: "..."
  lighting_atmosphere: "..."
  color_palette: "..."
  full_detailed_scene_prompt: "Write a comprehensive 100-word English photographic prompt describing this exact visual scene, backdrop, lighting, and composition."`;

        const visionModels = [
          "gemini-2.5-flash",
          "gemini-2.0-flash",
          "gemini-1.5-flash",
          "gemini-flash-latest",
          "gemini-3.5-flash",
          "gemini-3.1-flash-lite",
          "gemini-2.5-pro",
        ];
        for (const model of visionModels) {
          try {
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const response = await fetch(geminiUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      { text: geminiAnalysisPrompt },
                      {
                        inlineData: {
                          mimeType: mimeType,
                          data: base64Image,
                        },
                      },
                    ],
                  },
                ],
                safetySettings: [
                  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
                ],
              }),
            });

            if (response.ok) {
              const resData = await response.json();
              inspirationYaml = resData.candidates?.[0]?.content?.parts?.[0]?.text || "";
              if (inspirationYaml) {
                console.log(`[GENERATE_PROMPTS] Análise YAML do print obtida com sucesso usando ${model}.`);
                break;
              }
            } else {
              console.warn(
                `[GENERATE_PROMPTS_WARN] Modelo ${model} falhou na análise de visão:`,
                await response.text()
              );
            }
          } catch (modelErr: any) {
            console.warn(
              `[GENERATE_PROMPTS_WARN] Erro ao tentar modelo ${model} para visão:`,
              modelErr.message || modelErr
            );
          }
        }
      } catch (e: any) {
        console.warn(
          "[GENERATE_PROMPTS_WARN] Falha ao processar arquivo de inspiração:",
          e.message || e
        );
      }
    }

    let brandingInstruction = "";
    if (businessProfile) {
      const {
        name,
        category,
        primaryColor,
        secondaryColor,
        brandKit,
        brandPositioning,
        keyProducts,
        clientProfile,
        stylisticPreferences,
      } = businessProfile;
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

      let memoryText = "";
      if (brandPositioning)
        memoryText += `- Brand Positioning / Value Proposition: ${brandPositioning}\n`;
      if (keyProducts) memoryText += `- Key Products/Services to Feature: ${keyProducts}\n`;
      if (clientProfile) memoryText += `- Target Client/Audience Persona: ${clientProfile}\n`;
      if (stylisticPreferences)
        memoryText += `- Stylistic and Visual Preferences: ${stylisticPreferences}\n`;

      let lockedPersona =
        selectedPersona && selectedPersona !== "all" && typeof selectedPersona === "object"
          ? selectedPersona
          : null;

      if (
        (!lockedPersona || lockedPersona === "all") &&
        brandKit?.selectedPersonaStrategy &&
        brandKit.selectedPersonaStrategy !== "all"
      ) {
        lockedPersona =
          brandKit.personas?.find(
            (p: any) => p.name === brandKit.selectedPersonaStrategy
          ) || null;
      }

      if (lockedPersona) {
        memoryText += `- TARGET BUYER PERSONA LOCKED BY USER (EXCLUSIVE TARGET FOCUS): Name: "${lockedPersona.name || "Target Persona"}" | Profile: "${lockedPersona.profile || "N/A"}" | Pain Points to Address: "${lockedPersona.painPoints || "N/A"}" | Buying Motivation: "${lockedPersona.buyingMotivation || "N/A"}"\n`;
      } else if (brandKit?.personas && brandKit.personas.length > 0) {
        const personasText = brandKit.personas
          .map((p: any, idx: number) => `Target Persona ${idx + 1}: ${p.name || "Client"} (${p.profile || "N/A"}) - Pains: ${p.painPoints || "N/A"}`)
          .join(" | ");
        memoryText += `- Target Buyer Personas to Reach: ${personasText}\n`;
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
CRITICAL ROLE DISTINCTION:
- The brand "${name || "the brand"}" (Niche: "${category || "general"}") is the SERVICE PROVIDER / ADVERTISER.
- Any Target Personas listed are the BUYER CLIENTS that the brand wants to attract with its ${category || "professional"} products, services, and solutions.
- MANDATORY RULE: NEVER create image prompts portraying the brand as if it WERE the persona's business. The scene MUST always feature ${name || "the brand"}'s actual niche ("${category || "general"}"), products, services, and visual identity.

The brand's visual identity is defined by the following palette:
- Primary Color Hex: ${primaryHex}
- Secondary Color Hex: ${secondaryHex}
${extendedColorsText}
${
  memoryText
    ? `\n# ADAPTIVE BRAND MEMORY & STRATEGIC INSIGHTS (CRITICAL):
The following details were learned about the business's positioning and target style. You MUST strictly apply these guidelines to the imagery, style, and props:
${memoryText}
- If a Stylistic Preference is defined (e.g. "luxury", "rustic", "neon/vibrant", "clean/minimalist"), shape the lighting, props, and overall scene composition to reflect this specific vibe.
- Ensure any key products listed are organically integrated or metaphorically referenced as the main visual focus.
`
    : ""
}

CRITICAL COLOR RULES FOR PROMPTING (MANDATORY - ZERO TOLERANCE FOR HEX CODES):
1. Translate all hex codes above into their plain, descriptive English color names (e.g., use "golden yellow", "deep royal blue", "dark charcoal gray").
2. ABSOLUTELY FORBIDDEN: NEVER write literal hexadecimal codes (like "${primaryHex}", "${secondaryHex}", or any 6-character hex), the hash symbol (#), or technical words like "hexadecimal", "hex code", "primary color", "secondary color" in your generated prompts. If you output a hex code in the prompt, the image generator will literally paint the characters "#3b82f6" onto the image as a glowing text overlay, completely ruining the aesthetic. You MUST describe the colors strictly with natural human language.
3. If you need to specify a color, just say the name of the color in English.

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
  fontsText && insertTextOnImage
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

    let option2Text = "";
    if (inspirationYaml) {
      option2Text = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## ⚡ OPTION 2 — ESTHETIC REPLICA FROM INSPIRATION (MANDATORY INSPIRATION MATCHING - OVERRIDES GENERIC BRANDING)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL INSTRUCTION FOR OPTION 2: You MUST generate an image prompt that DIRECTLY RECREATES AND MATCHES the visual scene, subject posture, architecture, furniture, background setting, and composition layout from the user's inspiration reference print analyzed below:

${inspirationYaml}

REPLICATION REQUIREMENTS (HIGHEST PRIORITY):
1. RECREATE THE EXACT SCENE & ENVIRONMENT: You MUST base the Option 2 prompt on the exact scenery, room, location, furniture, architecture, and background elements described in the YAML above. Do NOT replace the scene with a generic studio or workspace unless the inspiration reference image was literally a studio.
2. RECREATE THE COMPOSITION & FRAMING: Replicate the exact camera angle, subject positioning, distance, and negative space areas from the YAML.
3. RECREATE THE LIGHTING & ATMOSPHERE: Mimic the exact lighting style, direction, color temperature, and atmospheric mood described in the YAML.
4. BRAND PERSONALIZATION: Adapt the brand's primary and secondary colors subtly into props, lighting accents, or clothing details without altering the core scene architecture or layout.
5. ABSOLUTE TEXT ISOLATION RULE (MANDATORY): Do NOT copy, translate, or include any text, words, logos, or slogans from the inspiration print. Completely ignore all text in the reference print.
${
  selContent?.titulo && insertTextOnImage
    ? `- The ONLY text allowed on the generated image is the selected post title ("${selContent.titulo}"), printed exactly once.\n- NO DUPLICATE WORDS: Strictly apply text rendering rules.`
    : `- ABSOLUTE TEXT PROHIBITION: The user requested NO TEXT on the generated image. Do NOT instruct the generator to draw any typography.`
}
`;
    } else {
      option2Text = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## ⚡ OPTION 2 — CONCEPTUAL / MINIMALIST / GRAPHIC STUDIO (MANDATORY RULE: STYLE MATCHING SELECTED DESIGN REFERENCE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUBJECT & STYLE SELECTION:
You MUST review the 30 visual design references below. Analyze the topic, title, and theme of the post, and choose the single design reference that best adapts to the context (e.g., choose #07 or #26 for romantic/dating/couple themes, #05 or #06 for traditional/São João themes, #02, #08, #29 or #30 for sports/competition, #15 for bright cartoonish retail promos, #10 or #27 for hiring/recruitment/imobiliaria, #16 for religious/church themes, #21 for sticker/collectible sports themes, #22 for music playlists, #23 for elegant profile portraits, #24 for car wash/split layout, #25 for pizza/food themes, #28 for birthdays, etc.).

# VISUAL DESIGN REFERENCE CATALOG:
- REFERENCE #01: "Card de Aviso Tridimensional" (Card Clean com Fundo de Texto Gigante)
  Description: A clean floating white card with rounded corners containing the message. Behind the card, there is a giant background title (e.g. "AVISO" in a vibrant color) partially cropped. A small 3D alert warning element sits on top of the card, and a yellow pill-shaped button is at the bottom.
- REFERENCE #02: "Confronto Esportivo Minimalista" (Tipografia Assimétrica de Alto Contraste)
  Description: A highly asymmetrical and contrast-heavy title with a giant tilted "X" character in the brand's primary color (e.g. yellow or orange) separating two stacked team/brand names. The stacked names are rendered in thick, bold, clean white block letters with small country flags or minimal badges placed right next to them.
- REFERENCE #03: "Flyer Esportivo Vibrante" (Composição Multicamadas de Colagem)
  Description: A multi-layered collage/stencil style banner. Cut-out silhouettes of subjects or products layered with sharp high-contrast geometric borders. The main title is rendered in thick, solid, uppercase geometric letters at the top, accompanied by dates or tags enclosed in small green and yellow badges.
- REFERENCE #04: "Banner de Eventos Noturnos" (Texto com Gradiente de Neon e Luz)
  Description: A main title rendered in a bold condensed sans-serif font featuring a vibrant vertical color gradient (e.g., orange-to-pink or peach) with a soft glowing backlight behind the letters, casting atmospheric rim light on surrounding props or subjects.
- REFERENCE #05: "Design Festivo Temático" (Fonte Orgânica Bold de Alto Impacto)
  Description: A thick organic, playful sans-serif font for the main title, alternating colors between white and a bright brand color. Characterized by decorative elements integrated into the text (like a small hat, star, or banner overlaying a letter). Placed on a high-contrast background pattern (like checkered fabric or stripes) with decorative flags hanging from the top.
- REFERENCE #06: "Viva São João Tridimensional" (Texto de Material Físico Realista - Corda)
  Description: Main title written in a volumetric 3D script/cursive font mimicking a realistic braided rope (brown and blue fibers) with realistic fiber textures, casting soft contact shadows on the background. Surrounded by matching 3D thematic elements (e.g. small bonfires or lanterns) on the sides.
- REFERENCE #07: "Story Dia dos Namorados" (Serifada Elegante de Alta Moda / Luxo)
  Description: A high-fashion modern serif typeface for the main word of the title, showing high stroke contrast, rendered in a soft pastel coral/orange color. The background is clean and light, with a few delicate 3D heart or star models floating gently near the screen edges.
- REFERENCE #08: "Vista a sua Camisa" (Blocos de Texto Condensados Empilhados)
  Description: The title words are stacked vertically in a tight, compact, asymmetric block using ultra-bold condensed sans-serif letters, alternating colors between the brand's primary yellow and secondary blue, accompanied by iconic 3D props (like a golden trophy or shield).
- REFERENCE #09: "Informativo Decreto Municipal" (Visual Limpo com Folhas de Calendário 3D)
  Description: A clean informational layout with structured 3D calendar sheets or rounded geometric cards displaying dates/text in high detail, combined with glossy 3D stars, checkmarks, or calendar accents on a clean, modern solid-color backdrop.
- REFERENCE #10: "Vagas Abertas Vendedor" (Layout Dividido com Texto Gigante Lateral)
  Description: An asymmetrical split layout featuring a vertical colored container (holding text/bullet points) on one side, and a clean professional photo/subject on the other. In the background, a massive keyword of the title is rendered in a bold brand color, extending out and cropped by the image borders.
- REFERENCE #11: "Conceito Orgulho Autista" (Texto de Fundo com Objeto 3D Interseccionado)
  Description: A textured paper backdrop with a central, highly detailed 3D thematic symbol (like a colorful infinity loop or ribbon). Positioned right in the center of the image, the 3D symbol intersects and overlaps a massive, bold title text placed directly in the background, creating strong spatial depth.
- REFERENCE #12: "Aniversariante Sarah Silva" (Polaroid Inclinada com Balões Estrelas 3D)
  Description: A central tilted white photo frame (Polaroid style) displaying the portrait/subject. The scene is framed by realistic, highly shiny 3D inflated foil star/heart balloons floating near the edges, casting soft shadows, and giant background text peeking from the side.
- REFERENCE #13: "Cuidado da Saúde" (Cards de Tópicos Flutuantes Sobrepostos)
  Description: A subject photo positioned on one side. On the other side, multiple vertical, rounded, overlapping card panels holding the text, paired with clean minimalist vector icons inside colored circular badges. The backdrop features subtle medical/abstract line graphics.
- REFERENCE #14: "Torça com Muita Pizza" (Caixas Retangulares Alinhadas - Promo/Varejo)
  Description: A retail promo style layout with a vertical stack of compact, rectangular colored text blocks of high contrast (e.g. purple text on a yellow block). Surrounded by floating realistic foods/products (like pizza or burger models) and 3D sports balls.
- REFERENCE #15: "Ofertas do Dia Supermercado" (Tipografia de Plástico Inflado 3D Brilhante)
  Description: The main title is rendered in giant, glossy 3D volumetric letters that look like inflated soft plastic or vinyl toys (e.g. vibrant blue and yellow). The letters are surrounded by cartoony 3D elements (like golden coins, small shopping carts, or stars).
- REFERENCE #16: "Quarta da Bênção" (Card Translúcido com Blur e Texto Curvo)
  Description: A portrait of a speaker or pastor in the center, encircled by a thin, glowing ring of repetitive curved text. At the top, a semi-transparent purple rounded box with background blur (glassmorphism) contains subtitle text. The main title features high typographic contrast, with the main word written in a giant, elegant golden serif font.
- REFERENCE #17: "Dia do Apicultor" (Foto Realista com Balão 3D e Caixas de Texto)
  Description: Photorealistic hands holding a dripping honeycomb under warm sunset lighting. A realistic, glossy 3D heart-shaped balloon with black and yellow bee stripes floats in the center, overlapping the honeycomb. The text labels are placed in clean, solid white rectangular boxes, and the main title is rendered in a heavy geometric ultra-bold white font casting realistic contact shadows.
- REFERENCE #18: "Culto de Natal" (Condensada Stacked com Iluminação Dramática)
  Description: A dramatic close-up portrait of a speaker or singer under warm, intense side lighting with floating dust bokeh particles. The main title is stacked vertically in massive, ultra-bold, condensed sans-serif letters, using contrasting colors (e.g., solid white and soft pastel peach), paired with small vertical line markers on top indicating the date.
- REFERENCE #19: "Cesta de Amor (Dia dos Namorados)" (Varejo Clean com Balões Foil 3D)
  Description: A clean retail/lifestyle composition showing a smiling person holding a realistic, beautifully decorated gift basket full of chocolates and ribbons. Glossy, red 3D inflated metallic foil heart-shaped balloons float in the background. The title is written in a casual, rounded font in white and yellow, with a dark, semi-transparent footer banner at the bottom.
- REFERENCE #20: "Hoje tem Brasil (Mascote)" (Mascote 3D com Interface Flutuante 3D)
  Description: A friendly, highly detailed 3D cartoon mascot in a dynamic pose at the center of a blurred soccer stadium background. The mascot is surrounded by floating green and yellow hearts inside glossy 3D social media dialog bubbles. The bottom title is written in a highly fluid, expressive brush-painted script font.
- REFERENCE #21: "Figurinha de Jogador Confirmado (Neymar)" (Figurinha Colecionável com Grafismo de Fundo)
  Description: A centered cut-out photo portrait of a professional soccer player or subject. The background is a solid turquoise/teal canvas featuring a massive, thick green number "26" with rounded corners. Small official-looking cup badges/logos are placed on the top right, and circular country flag icons are stacked on the bottom right. The main title is displayed at the bottom in an extended, bold sans-serif font inside a dark rounded rectangular badge.
- REFERENCE #22: "Playlist de Hamburgueria" (Visual Escuro com Smartphone e Elementos 3D)
  Description: A deep burgundy/dark red background with thin beige circular border outlines. On the right, a realistic smartphone displays a music streaming playlist with album art. An inflated, glossy 3D red play button floats over the screen. The main title is rendered on the left in a heavy, textured cream and pink sans-serif font, accompanied by a quick hand-drawn scribble line on top and pill-shaped call-to-action buttons.
- REFERENCE #23: "Dia do Pastor" (Sobreposição de Fontes Serifada e Cursiva com Luz Quente)
  Description: A close-up side profile of a speaker or singer in low-key lighting with a warm orange glow illuminating from the right edge. The title in the center combines a massive serif font in solid white with a thin, expressive handwritten script font in orange/gold overlapping it. A small date badge is placed at the top left in clean, elegant uppercase lettering.
- REFERENCE #24: "Brilho ao seu Carro (Lava Rápido)" (Antes e Depois com Moldura Circular e Ícones 3D)
  Description: A dark blue background with abstract gradient shapes. In the center, a photorealistic SUV is displayed with a split "before and after" dirty/clean wash effect, surrounded by a glowing green neon circle. Metallic blue 3D icons representing a car wash (car wash nozzles with water droplets) float in the scene. A green circular price badge and buttons are positioned at the bottom.
- REFERENCE #25: "Dia da Pizza" (Perspectiva de Produto em Primeiro Plano com Tipografia Expressiva)
  Description: A close-up of a crispy pepperoni pizza in perspective on a dark flour-dusted table in the foreground. The background is a clean black chalkboard texture. The main title at the top is tilted and rendered in a combination of thick gestural white script and bold sans-serif block letters, accented by red ribbon-style banners.
- REFERENCE #26: "Dia dos Namorados Romântico Elegante" (Classic Romance Poster/Editorial Layout)
  Description: A couple in a romantic dance or embrace pose in the center. The background is a smooth vignette gradient from deep burgundy-wine red to black at the edges. Small romantic text block aligned to the left. The main title features high typographic contrast: the word "Feliz" in a classic white cursive script font, and "Namorados" in an extended, tilted soft pink rounded font, with the date in clean uppercase below.
- REFERENCE #27: "Localização Certa (Imóveis)" (Asymmetrical Real Estate Layout with Card and Portrait)
  Description: A smiling professional holding keys on the left, with a modern illuminated house in the background. On the right, a dark matte navy-blue rounded rectangular card overlays the scene, containing the title in clean white and golden sans-serif typography, accompanied by a beige CTA pill button. Brand footer info at the bottom.
- REFERENCE #28: "Feliz Aniversário Carla Silva" (Modern Festive Design with Tilted Ribbons)
  Description: Centered portrait of a smiling person wearing a golden cone party hat, with a shiny silver 3D heart-foil balloon. The background features a giant, cropped, high-contrast block text of "PARABÉNS". The bottom title is composed of tilted rectangular ribbon banners in high contrast (white and purple) holding the bold text "FELIZ ANIVERSÁRIO" and the name in a heavy sans-serif font.
- REFERENCE #29: "Copa em Ofertas" (3D June Festival and Sports Thematic Composition)
  Description: At the top, a 3D wooden-textured sign reading "Copa em Ofertas" decorated with a 3D June festival balloon, bonfire, and flags on one side, and a 3D soccer ball and golden trophy on the other. Yellow textured soccer field lines background. Below, photos of smiling fans in Brazil soccer jerseys with face paint holding a remote control.
- REFERENCE #30: "Dia da Grande Final (Copa)" (Minimalist Sports Poster with Trophy Spotlight)
  Description: Dark green textured background with a massive, very low-contrast text of "BRASIL ARGENTINA". In the center, a highly detailed 3D golden World Cup trophy with realistic contact shadows, flanked by flags of Brazil and Argentina. At the top, the title "DIA DA GRANDE FINAL" in a vibrant neon lime-green and white condensed sans-serif font, and date footer at the bottom.

GENERATION RULES FOR OPTION 3:
1. Select the single Reference ID (#01 to #30) that fits the post context best.
2. Build the entire prompt composition strictly following the selected reference's Visual Description.
3. You must prefix your generated Option 3 prompt with "[OPTION 3 — CONCEPTUAL MINIMALIST / SELECTED REFERENCE #XX]" substituting "#XX" with the chosen Reference ID (e.g. "[OPTION 3 — CONCEPTUAL MINIMALIST / SELECTED REFERENCE #07] A high-fashion...").
4. Keep the composition clean and maintain 45-55% of the frame as clean negative space for text placement.
5. Apply the brand's primary and secondary colors (translated to plain English names) to the key elements, backgrounds, or gradients.
6. HUMAN & PRODUCT FLEXIBILITY: You are encouraged to decide whether to include a human subject (like a real person interacting, a professional, or a customer), realistic products, or strictly 3D/2D graphics in the scene. Vary this decision randomly across generations. In some generations, make it strictly graphic/minimalist; in other generations, organically integrate real human elements or realistic products into the selected design reference composition. Do not use generic corporate layouts.

CAMERA & LENS:
- Front-facing flat graphic composition OR elegant 30-degree isometric view.
- Wide angle 24mm or tilt-shift for a clean, sharp, architectural look. Everything in sharp focus (f/8–f/11).
LIGHTING:
- Soft, even, diffused studio lighting. Use subtle colored gel lights matching the brand's complementary color to cast elegant rim highlights on the object and glass panels.
BRAND KIT ALIGNMENT (MANDATORY):
- The background gradient, geometric accent shapes, and gel highlights MUST strictly use the brand's Primary, Secondary, and Complementary colors.
- The text overlay must match the brand's typography.
`;
    }
    // 1. Regras condicionais de texto baseadas no textOverlayMode
    const effectiveTitle = productHeadline ? productHeadline.trim() : selContent?.titulo || "";
    let textRules = "";

    if (textOverlayMode === "NONE" || !insertTextOnImage) {
      textRules = `
2. ABSOLUTE TEXT PROHIBITION (MANDATORY - FOTOGRAFIA PURA): The user specifically requested NO TEXT on the image. You MUST NOT instruct the AI to write any words, titles, phrases, logos, or slogans on the image. The image must be a 100% clean graphic composition or photograph without any typography. The context/title "${effectiveTitle}" is strictly for thematic inspiration of the scene and MUST NOT be written on the canvas.
`;
    } else if (textOverlayMode === "TITLE_ONLY") {
      textRules = `
2. TEXT ELEMENT (TITLE ONLY - CLEAN COMMERCIAL TYPOGRAPHY): Embed ONLY the main headline "${effectiveTitle}" in double quotes inside the prompt.
   - MANDATORY TITLE-ONLY MANDATE: The generated prompt MUST instruct the image generator to render ONLY the main headline "${effectiveTitle}" with clean, prominent commercial typography in Portuguese (pt-BR).
   - STRICTLY FORBIDDEN: DO NOT render any feature cards, technical spec badges, icon bullet points, floating review stars, or complex footer text. Keep the composition clean and uncluttered, focusing 100% on the visual photo and the primary title.
   - MANDATORY TEXT BOUNDARY & SAFE INNER MARGINS (ZERO CUTOFF RULE — CRITICAL):
     All typography, letters, and the title MUST be placed strictly within the central safe area of the image with generous breathing room (at least 20% margin from left, right, top, and bottom borders). ZERO TEXT TOUCHING CANVAS EDGES. Absolutely no letters or words may extend to, touch, or be cropped by the outer boundaries of the canvas.
   - MANDATORY TEXT WRAPPING & MULTI-LINE STACKING:
     BREAK the title into 2 or 3 short, stacked, balanced lines with high typographic contrast.
   - DUPLICATION PREVENTION: Render ONLY the exact words from the title "${effectiveTitle}", and forbid duplicating any words.
   - PORTUGUESE ACCENTUATION RULE (CRITICAL): Ensure perfect Portuguese (pt_BR) characters (á, é, í, ó, ú, ç, ã, õ, ê, ô).
`;
    } else {
      // INFOGRAPHIC COMPLETO (Padrão)
      const brandName = businessProfile?.name || businessProfile?.brandKit?.name || "";
      textRules = `
2. TEXT & INFOGRAPHIC ELEMENTS (FULL CREATIVE AGENCY POSTER):
   - Embed the main headline "${effectiveTitle}" literally in double quotes inside the prompt.
   - Visual Infographic Structure: Structure the composition as a full creative agency commercial advertising poster. Include dynamic feature benefit callouts, clean minimalist floating icon badges, quality warranty seals, and premium graphic design integration matching the brand kit.
   - MANDATORY TEXT BOUNDARY & SAFE INNER MARGINS (ZERO CUTOFF RULE — CRITICAL):
     All typography, letters, text containers, badges, cards, and titles MUST be placed strictly within the central safe area of the image with generous breathing room (at least 20% margin from left, right, top, and bottom borders). ZERO TEXT TOUCHING CANVAS EDGES.
   - MANDATORY TEXT WRAPPING & MULTI-LINE STACKING:
     BREAK the title into 2 or 3 short, stacked, balanced lines with high typographic contrast.
   - DUPLICATION PREVENTION (CRITICAL): Render ONLY the exact words from the title "${effectiveTitle}", and forbid duplicating any words.
   - PORTUGUESE ACCENTUATION RULE (CRITICAL): Ensure perfect Portuguese (pt_BR) characters.
   - FORBIDDEN: Do NOT include long paragraphs. Keep secondary elements to short, high-impact phrases and icon labels.

3. ABSOLUTE PROHIBITION OF ALL LOGOS & BRANDMARKS (ZERO EMBEDDED LOGOS — STRICT MANDATE):
   - Under NO circumstances should the AI image generator draw, render, simulate, or invent ANY company logo, brand emblem, logomark, symbol, monogram, or watermark anywhere on the image.
   - The application features a dedicated high-resolution vector Brand Overlay tool in Step 4 where the user stamps their official PNG/SVG logo manually with 100% geometric precision. Any logo drawn by the AI model is an unauthorized hallucination.
   - STRICTLY FORBIDDEN: Do NOT write company names (including "${brandName}", or any fictional corporate titles) as logos, signatures, or marks in the corners, footers, headers, gadget screens, or inside floating cards.
   - Keep corners, headers, and footer areas 100% clean and open for manual logo overlay in the editor.
`;
    }

    // Mapa: id do layout -> instrução técnica para a IA
    const LAYOUT_TECHNICAL: Record<string, string> = {
      CINEMATIC: "LAYOUT STYLE — CINEMATIC: Cinematic photography, dramatic lighting, deep cinematic shadows, 85mm f/1.8 lens, shallow depth of field, rich cinematic color grade, atmospheric lighting.",
      STUDIO_CLEAN: "LAYOUT STYLE — STUDIO_CLEAN: Professional studio photography, elegant seamless neutral backdrop, soft uniform diffused studio lighting, high-end commercial photo studio aesthetic.",
      URBAN_LIFESTYLE: "LAYOUT STYLE — URBAN_LIFESTYLE: Authentic lifestyle photography, real-world outdoor urban setting, natural daylight, candid energetic moment, relatable modern city environment.",
      MINIMALIST: "LAYOUT STYLE — MINIMALIST: Minimalist design, spacious composition with generous negative space (50-60%), modern clean aesthetic, sophisticated and quiet luxury feel.",
      TECH_3D: "LAYOUT STYLE — TECH_3D: Premium 3D illustration, Octane Render / Redshift render style, vibrant colors, realistic material textures (glass, metallic, polished plastic), futuristic tech aesthetic.",
      MAGAZINE_3D: "LAYOUT STYLE — MAGAZINE_3D: High-fashion magazine cover style, integrated typography with 3D depth, subject partially overlaps and breaks through the title letters creating a dramatic 3D parallax effect.",
      PRODUCT_TECH: "LAYOUT STYLE — PRODUCT_TECH (/techfuturistic): High-conversion sci-fi tech commercial advertising poster / infographic product card. The product is the central hero resting on a futuristic glowing circular podium with ambient neon orange and cyan rim lighting. Sleek dark cyber-tech background with holographic HUD circular elements, benefit feature cards with glowing circular icons detailing specifications, bold high-contrast headline typography, and bottom specification badges. Professional e-commerce advertising grade.",
      PRODUCT_METAAD: "LAYOUT STYLE — PRODUCT_METAAD (/metaad): High-conversion Meta/Instagram advertising composition (OpenAI DALL-E & GPT-4o standard). The primary product/subject is the hero, framed with deliberate 45-55% clean negative space (top or side area) reserved for ad copy, headlines, and call-to-actions. High-contrast commercial studio lighting with a soft key light and sharp edge separation rim light. True-to-life product proportions, textures, and vibrant commercial appeal.",
      PRODUCT_PREMIUM: "LAYOUT STYLE — PRODUCT_PREMIUM (/premiumshowcase): Ultra-luxury commercial product showcase poster. The product is elegantly staged on a geometric architectural pedestal (such as polished white Carrara marble, frosted translucent glass, or brushed metal). Three-point studio lighting with a large overhead softbox, subtle caustic reflections, soft contact shadows (ambient occlusion), and an ultra-clean minimalist luxury atmosphere. Shot on Phase One IQ4 150MP, 85mm f/1.4 lens.",
      PRODUCT_BILLBOARD: "LAYOUT STYLE — PRODUCT_BILLBOARD (/3dbillboard): 3D Outdoor Billboard Campaign Poster. A hyper-realistic 3D outdoor billboard at dusk featuring this exact product in monumental scale breaking through the billboard borders, with ambient city glow, dramatic volumetric spotlights, and sharp brand fidelity.",
      PRODUCT_LIFESTYLE: "LAYOUT STYLE — PRODUCT_LIFESTYLE (/lifestylecontext): Premium lifestyle product placement in an authentic, aspirational real-world setting (e.g. contemporary oak desk in a sunlit architectural studio, luxury spa marble counter, or designer kitchen). Warm natural side lighting from a nearby window, gentle soft-focus depth of field, and organic atmosphere that highlights how the product integrates into daily life.",
      PRODUCT_DYNAMIC: "LAYOUT STYLE — PRODUCT_DYNAMIC (/dynamicaction): High-speed commercial advertising action poster. The product is surrounded by suspended elements: crystal-clear high-speed frozen water droplets, dynamic liquid splashes, floating natural ingredients, or energetic light trails. Studio strobe lighting with 1/8000s shutter freeze effect, creating a fresh, energetic hero visual.",
      PRODUCT_CATALOG: "LAYOUT STYLE — PRODUCT_CATALOG (/minimalcatalog): Pure e-commerce clean catalog aesthetic. The product stands on a seamless infinite solid or subtle light-gray gradient background. Perfectly even diffused light box illumination with zero distracting reflections. Crisp edge-to-edge focus (f/11), hyper-accurate colors and textures, conveying pristine commercial catalog perfection.",
      PRODUCT_COSMETICS: "LAYOUT STYLE — PRODUCT_COSMETICS (/luxurycosmetics): Luxury cosmetics and skincare advertising poster. Staged on a translucent acrylic ripple tray, delicate organic floral petals, golden texture droplets, and soft pastel studio backlighting. Refined beauty aesthetic.",
      PRODUCT_FLATLAY: "LAYOUT STYLE — PRODUCT_FLATLAY (/flatlayknolling): Precise 90-degree top-down flat lay knolling photography. Geometrically aligned with complementary lifestyle props on textured linen or wooden surface, soft diffused overhead lighting.",
      PRODUCT_GOURMET: "LAYOUT STYLE — PRODUCT_GOURMET (/gourmetculinary): Commercial culinary food advertising. Delicious rich textures, delicate rising steam, warm restaurant ambient glow, mouthwatering macro focus, and appetizing gourmet staging.",
      PRODUCT_RUSTIC: "LAYOUT STYLE — PRODUCT_RUSTIC (/rusticorganic): Organic artisanal botanical product staging. Resting on raw dark wood slab with dried eucalyptus, natural linen texture, and warm gentle sunbeams through a window.",
      PRODUCT_TESTIMONIAL: "LAYOUT STYLE — PRODUCT_TESTIMONIAL (/testimonialAd): Customer testimonial and 5-star review advertising poster. The physical product is the prominent hero on a clean surface with a floating frosted-glass review badge, 5 golden stars, and customer satisfaction callout.",
      PRODUCT_UGC: "LAYOUT STYLE — PRODUCT_UGC (/ugcProductPhoto): Authentic user-generated content (UGC) smartphone photography aesthetic. Macro close-up on the product in hand in a bright authentic real-world location (sunlit cafe or room), natural lighting, authentic organic texture.",
      PRODUCT_PACKAGING: "LAYOUT STYLE — PRODUCT_PACKAGING (/ProductPackaging): Premium product and packaging unboxed showcase. Staged on a textured podium with the product proudly standing next to its open luxury packaging box, embossed branding, and refined materials.",
      PRODUCT_CUSTOMER_QUOTE: "LAYOUT STYLE — PRODUCT_CUSTOMER_QUOTE (/CostumerPhoto+Quote): Customer quote and recommendation commercial layout. Close-up on the product interaction with a customer in soft background bokeh, accompanied by a stylized quote bubble with recommendation words.",
      PRODUCT_UNBOXING: "LAYOUT STYLE — PRODUCT_UNBOXING (/UnboxingImageAd): Premium unboxing experience layout. Open matte cardboard unboxing box with delicate tissue paper, branded ribbon, thank you card, and the hero product cleanly presented from an inviting top-down/angle perspective.",
      PRODUCT_MOCKUP: "LAYOUT STYLE — PRODUCT_MOCKUP (/ProductMockup): Ultra-clean 3D agency product mockup. Floating product with soft directional contact shadows, sleek studio softbox illumination, subtle translucent accents, and aesthetic soft gradient background.",
    };

    // Detecção automática de Slash Commands (/metaad, /premiumshowcase, /dynamicaction, etc.)
    const fullTextSearch = `${selContent?.titulo || ""} ${selContent?.subtitulo || ""}`.toLowerCase();
    if (fullTextSearch.includes("/techfuturistic") || fullTextSearch.includes("/tech")) {
      layoutStyle = "PRODUCT_TECH";
    } else if (fullTextSearch.includes("/metaad") || fullTextSearch.includes("/ad")) {
      layoutStyle = "PRODUCT_METAAD";
    } else if (fullTextSearch.includes("/premiumshowcase") || fullTextSearch.includes("/showcase") || fullTextSearch.includes("/luxo")) {
      layoutStyle = "PRODUCT_PREMIUM";
    } else if (fullTextSearch.includes("/3dbillboard") || fullTextSearch.includes("/billboard")) {
      layoutStyle = "PRODUCT_BILLBOARD";
    } else if (fullTextSearch.includes("/lifestylecontext") || fullTextSearch.includes("/lifestyle") || fullTextSearch.includes("/contexto")) {
      layoutStyle = "PRODUCT_LIFESTYLE";
    } else if (fullTextSearch.includes("/dynamicaction") || fullTextSearch.includes("/dynamic") || fullTextSearch.includes("/splash")) {
      layoutStyle = "PRODUCT_DYNAMIC";
    } else if (fullTextSearch.includes("/minimalcatalog") || fullTextSearch.includes("/catalog") || fullTextSearch.includes("/catalogo")) {
      layoutStyle = "PRODUCT_CATALOG";
    } else if (fullTextSearch.includes("/luxurycosmetics") || fullTextSearch.includes("/cosmetics") || fullTextSearch.includes("/skincare")) {
      layoutStyle = "PRODUCT_COSMETICS";
    } else if (fullTextSearch.includes("/flatlayknolling") || fullTextSearch.includes("/flatlay") || fullTextSearch.includes("/knolling")) {
      layoutStyle = "PRODUCT_FLATLAY";
    } else if (fullTextSearch.includes("/gourmetculinary") || fullTextSearch.includes("/gourmet") || fullTextSearch.includes("/comida")) {
      layoutStyle = "PRODUCT_GOURMET";
    } else if (fullTextSearch.includes("/rusticorganic") || fullTextSearch.includes("/rustic") || fullTextSearch.includes("/organico")) {
      layoutStyle = "PRODUCT_RUSTIC";
    } else if (fullTextSearch.includes("/testimonialad") || fullTextSearch.includes("/testimonial")) {
      layoutStyle = "PRODUCT_TESTIMONIAL";
    } else if (fullTextSearch.includes("/ugcproductphoto") || fullTextSearch.includes("/ugc")) {
      layoutStyle = "PRODUCT_UGC";
    } else if (fullTextSearch.includes("/productpackaging") || fullTextSearch.includes("/packaging")) {
      layoutStyle = "PRODUCT_PACKAGING";
    } else if (fullTextSearch.includes("/costumerphoto+quote") || fullTextSearch.includes("/customerphoto") || fullTextSearch.includes("/quote")) {
      layoutStyle = "PRODUCT_CUSTOMER_QUOTE";
    } else if (fullTextSearch.includes("/unboxingimagead") || fullTextSearch.includes("/unboxing")) {
      layoutStyle = "PRODUCT_UNBOXING";
    } else if (fullTextSearch.includes("/productmockup") || fullTextSearch.includes("/mockup")) {
      layoutStyle = "PRODUCT_MOCKUP";
    }

    // Sorteio de estilos aleatórios para garantir máxima variedade
    const allStyles = Object.keys(LAYOUT_TECHNICAL);
    const getRandomStyle = (exclude: string[] = []) => {
       const available = allStyles.filter(s => !exclude.includes(s));
       return available[Math.floor(Math.random() * available.length)];
    };

    let option1Style = "";
    let option2Style = "";

    if (layoutStyle && LAYOUT_TECHNICAL[layoutStyle]) {
       // Se o usuário selecionou um estilo, ele é o primário (Opção 1)
       option1Style = layoutStyle;
       option2Style = getRandomStyle([option1Style]);
    } else {
       // Automático: Sorteia 2 estilos totalmente diferentes
       option1Style = getRandomStyle();
       option2Style = getRandomStyle([option1Style]);
    }

    // 2. Prompt do Diretor de Arte Otimizador de Prompts
    const systemInstructionText = `
You are a world-class Advertising Art Director and expert in Prompt Engineering for AI image generators (OpenAI DALL-E 3, GPT-4o, Imagen, Flux, Midjourney).

# MANDATORY LAYOUT STYLE DIRECTIVES (HIGHEST PRIORITY — OVERRIDES ALL OTHER COMPOSITION RULES)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You MUST apply a specific layout and composition style for EACH of the 2 generated image options to guarantee maximum visual variety. This directive overrides any generic composition preference.

▶ FOR OPTION 1:
${LAYOUT_TECHNICAL[option1Style]}

▶ FOR OPTION 2:
${LAYOUT_TECHNICAL[option2Style]}

You MUST explicitly describe the designated layout composition mechanics in its respective prompt. Do NOT ignore this rule.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# CORE MISSION
Generate EXACTLY 2 ultra-detailed image prompts in ENGLISH from the given post title and subtitle.
CRITICAL: Each prompt MUST look like it was shot on a COMPLETELY DIFFERENT DAY, in a COMPLETELY DIFFERENT LOCATION, by a COMPLETELY DIFFERENT PHOTOGRAPHER, for a COMPLETELY DIFFERENT CAMPAIGN. If a viewer sees all 2 images side by side, they should NOT be able to tell they belong to the same brand from the visual style alone.

--------------------------------------------------------------------------------
## 🎨 OPTION 1 — HUMAN FOCUS / LIFESTYLE (MANDATORY RULE: MUST HAVE PEOPLE)
--------------------------------------------------------------------------------
SUBJECT: One or two REAL people (professional workers, satisfied customers, athletes, entrepreneurs — chosen based on the post topic) with confident, natural body language and expressions.
CAMERA: Medium shot (waist up) or American shot (thigh up). Camera angle: slightly low angle for authority, OR eye-level for approachability.
LENS: 50mm or 85mm prime lens, f/1.8, sharp focus on face/hands, beautiful background bokeh.
SETTING: A rich, contextually relevant real-world environment (construction site, modern office, café, workshop, gym, outdoor street) — NOT a studio.
LIGHTING: Describe natural and dramatic outdoor or indoor ambient lighting (e.g., "golden hour side light streaming through a factory window casting long shadows", "dramatic cinematic under-lighting in a modern kitchen").
COMPOSITION: You MUST strictly structure the composition, framing, and text placement according to the designated LAYOUT STYLE for Option 1. Do not default to the rule of thirds if the layout style dictates otherwise.
MANDATORY PROHIBITION: Do NOT describe any studio backdrop, geometric shapes, flat lays, or isolated products in this option.

--------------------------------------------------------------------------------
## 🎨 OPTION 2 — LIFESTYLE HYBRID COLLAGE (MANDATORY RULE: MUST HAVE PEOPLE AND INTEGRATED GRAPHICS/VECTORS ALIGNED TO NICHE)
--------------------------------------------------------------------------------
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

${option2Text}

${approvedPromptsExamples}

${brandingInstruction}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
--------------------------------------------------------------------------------
# CRITICAL PROMPT ENGINEERING RULES
--------------------------------------------------------------------------------
1. LANGUAGE: Write all visual descriptions in English only.
${textRules}
SPECIAL TEXT & BRANDING RULE (CRITICAL MANDATE): 
Since the primary engine may be gpt-image-2 (DALL-E 3), you can be creative with the typography and layout rules requested above, dynamically embedding the exact textual title within the scene as a realistic design element.
HOWEVER:
- ABSOLUTE BAN ON ALL LOGOS AND COMPANY BRANDMARKS (100% CLEAN CANVAS): You are STRICTLY FORBIDDEN from generating or asking the engine to draw ANY brand logo, emblem, corporate logomark, company name, or watermark anywhere in the artwork (corners, footers, headers, gadget screens, or UI cards). ALL prompts must describe a clean canvas free of drawn logos, because the user will manually overlay their official vector logo in Step 4.
- NEVER invent fictional company names, altered brand logos, or unrequested brand markings anywhere on props or clothing.

3. PREMIUM QUALITY TAGS: End every prompt with these quality booster tags: "ultra-realistic, award-winning advertising photography, 8K resolution, hyper-detailed, professional color grading, shot on Phase One IQ4".
4. RADICAL DIFFERENTIATION CHECK: Before outputting, mentally verify that the 2 prompts describe COMPLETELY DIFFERENT visual styles, color temperatures, settings, compositions, and moods. If two prompts feel similar, rewrite the weaker one to be more distinct.
5. MINIMUM LENGTH: Each prompt must be at least 120 words to ensure sufficient detail.
6. ZERO TOLERANCE ON HEX CODES, HASH SYMBOLS AND TECHNICAL LABELS (CRITICAL):
   - You MUST NOT output any hexadecimal color codes (e.g. #FFCC29, #373435, #000, #FFFFFF, etc.), the hash symbol (#), or CSS terms.
   - You MUST NOT output words like "hexadecimal", "hex", "hex code", "RGB", "HSL", "primary color", "secondary color", "brand kit", or "brand color".
   - If you include any of these technical words, symbols (#) or hex codes, the image generator will literally print them on the image, ruining the artwork.
   - All colors must be described using natural descriptive color words in English (e.g., "rich sky blue", "elegant forest green", "warm pastel pink", "minimalist dark gray").

7. ABSOLUTELY NO CROPPED HEADS OR HAIR (ULTRA-CRITICAL): If the generated prompt features a person or model (holding a product, wearing clothing, or posing), you MUST ABSOLUTELY prevent the top of their head, forehead, or hair from being cut off by the border of the canvas.
   - You MUST explicitly inject strict spatial instructions into the generated prompt.
   - You MUST include a phrase like: "framed in a balanced shot showing the model, with a generous amount of empty space (clear headroom) above their head. The model's entire head, full hair, and face are completely visible and fully contained within the frame, with no cutoff or clipping by the borders of the image."
   - Avoid tight face close-ups, macro portraits, or extreme crops that focus excessively on the face and leave no headroom. Always choose a spacious medium shot or a wide-angle composition.

8. MANDATORY VERTICAL 3:4 PORTRAIT RATIO (1080x1440 PIXELS - ULTRA-CRITICAL):
   - Every single generated prompt MUST describe a composition framed strictly in vertical 3:4 portrait aspect ratio (1080x1440 dimensions, Instagram vertical portrait post format).
   - You MUST include in every prompt: "framed vertically in 3:4 aspect ratio (1080x1440 portrait format)".
   - NEVER describe landscape, horizontal, banner, widescreen, 16:9, or 9:16 story compositions.

# REQUIRED OUTPUT FORMAT (STRICT JSON — NO MARKDOWN, NO PREAMBLE)
{
  "prompts": [
    "[OPTION 1 — LIFESTYLE] Full English prompt here... with the literal text 'TITULO AQUI'... framed vertically in 3:4 aspect ratio (1080x1440 portrait format), ultra-realistic, award-winning advertising photography, 8K resolution, hyper-detailed, professional color grading, shot on Phase One IQ4.",
    "[OPTION 2 — LIFESTYLE HYBRID COLLAGE] Full English prompt here... with the literal text 'TITULO AQUI'... framed vertically in 3:4 aspect ratio (1080x1440 portrait format), ultra-realistic, award-winning advertising photography, 8K resolution, hyper-detailed, professional color grading, shot on Phase One IQ4."
  ]
}
`;

    // 2. Chamar a API do Gemini com Fallback Resiliente
    const modelsToTry = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-flash-latest",
      "gemini-pro-latest",
      "gemini-3.5-flash",
      "gemini-3.1-flash-lite",
      "gemini-2.5-pro",
    ];
    let aiResponseText = "";
    let lastError: any = null;

    const summaryText = `Título: ${selContent.titulo}\nSubtítulo: ${selContent.subtitulo}\nHashtags: ${Array.isArray(selContent.hashtags) ? selContent.hashtags.join(" ") : selContent.hashtags}`;

    for (const model of modelsToTry) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        console.log(
          `[GENERATE_PROMPTS] Enviando requisição para a API do Gemini usando modelo: ${model}...`
        );

        const userParts: any[] = [{ text: `Conteúdo da publicação:\n${summaryText}` }];

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
                parts: userParts,
              },
            ],
            safetySettings: [
              { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
            ],
            generationConfig: {
              temperature: 0.7,
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
          console.warn("[GENERATE_PROMPTS_WARN] Resposta vazia. Payload:", JSON.stringify(resData));
          throw new Error(`Resposta vazia ou bloqueada. Motivo: ${resData?.candidates?.[0]?.finishReason || "Desconhecido"}`);
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
      parsedData = safeParseJSON(aiResponseText);
    } catch (e) {
      console.error("[GENERATE_PROMPTS_ERROR] Erro ao fazer parse do JSON retornado:", aiResponseText);
      // Tentativa extrema: extração por regex dos itens do array de prompts
      const arrayItems = aiResponseText.match(/"([^"\\]*(\\.[^"\\]*)*)"/g);
      if (arrayItems && arrayItems.length >= 3) {
        const extracted = arrayItems
          .map((item) => item.slice(1, -1).replace(/\\"/g, '"').trim())
          .filter((item) => item.length > 30);
        if (extracted.length > 0) {
          parsedData = { prompts: extracted };
        } else {
          throw new Error("A IA retornou um formato inválido que não pôde ser lido.");
        }
      } else {
        throw new Error("A IA retornou um formato inválido que não pôde ser lido.");
      }
    }

    const promptsArray = parsedData.prompts || parsedData;

    if (!Array.isArray(promptsArray)) {
      throw new Error("O JSON retornado pela IA não contém um array de prompts válido.");
    }

    const sanitizedPrompts = promptsArray.map((p: any) => {
      let text = String(p);
      text = text.replace(/#[0-9A-Fa-f]{3,6}\b/g, "");
      text = text.replace(/\b(hex|hexadecimal|hex code|código hex)\b/gi, "");
      // Limpa os hexadecimais mesmo sem # (ex: 1e293b) se caírem no formato exato da cor da marca
      if (businessProfile?.primaryColor) {
        const hex = businessProfile.primaryColor.replace("#", "");
        text = text.replace(new RegExp(`\\b${hex}\\b`, "gi"), "");
      }
      if (businessProfile?.secondaryColor) {
        const hex = businessProfile.secondaryColor.replace("#", "");
        text = text.replace(new RegExp(`\\b${hex}\\b`, "gi"), "");
      }
      return text.replace(/\s+/g, " ").trim();
    });

    const outputFormat = [
      {
        output: {
          prompt: sanitizedPrompts,
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
