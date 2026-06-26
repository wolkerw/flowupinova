import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const { content: selContent, businessProfile, userId } = await request.json();

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

    let approvedPromptsExamples = "";
    if (userId) {
      try {
        console.log(`[GENERATE_PROMPTS] Buscando prompts de sucesso do mediaGallery para o usuário ${userId}...`);
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
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || 0)
            });
          }
        });

        // Ordenar em memória pela data de criação decrescente
        approvedItems.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        // Pegar os 5 prompts mais recentes aprovados pelo usuário
        const topApproved = approvedItems.slice(0, 5).map(item => item.prompt);

        if (topApproved.length > 0) {
          approvedPromptsExamples = `
# SUCCESSFUL PROMPTING SAMPLES (FEW-SHOT LEARNING)
The following are examples of image prompts that the user previously approved, loved, and successfully published/scheduled.
Analyze their structure, level of detail, and stylistic cues, and use them as reference/inspiration to generate the new concepts:
${topApproved.map((p, idx) => `Example #${idx + 1}: ${p}`).join("\n\n")}
`;
          console.log(`[GENERATE_PROMPTS] Encontrados ${topApproved.length} prompts de sucesso para few-shot learning.`);
        } else {
          console.log(`[GENERATE_PROMPTS] Nenhum prompt de sucesso anterior encontrado para este usuário.`);
        }
      } catch (err: any) {
        console.warn(`[GENERATE_PROMPTS_WARN] Falha ao buscar prompts aprovados do Firestore:`, err.message || err);
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
        stylisticPreferences
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
      if (brandPositioning) memoryText += `- Brand Positioning / Value Proposition: ${brandPositioning}\n`;
      if (keyProducts) memoryText += `- Key Products/Services to Feature: ${keyProducts}\n`;
      if (clientProfile) memoryText += `- Target Client/Audience Persona: ${clientProfile}\n`;
      if (stylisticPreferences) memoryText += `- Stylistic and Visual Preferences: ${stylisticPreferences}\n`;

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
${memoryText ? `\n# ADAPTIVE BRAND MEMORY & STRATEGIC INSIGHTS (CRITICAL):
The following details were learned about the business's positioning and target style. You MUST strictly apply these guidelines to the imagery, style, and props:
${memoryText}
- If a Stylistic Preference is defined (e.g. "luxury", "rustic", "neon/vibrant", "clean/minimalist"), shape the lighting, props, and overall scene composition to reflect this specific vibe.
- Ensure any key products listed are organically integrated or metaphorically referenced as the main visual focus.
` : ""}

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
## ⚡ OPTION 3 — CONCEPTUAL / MINIMALIST / GRAPHIC STUDIO (MANDATORY RULE: DRIBBBLE / DRIBBBLE / DESIGNI STYLE MATCHING SELECTED DESIGN REFERENCE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUBJECT & STYLE SELECTION:
You MUST review the 25 visual design references below. Analyze the topic, title, and theme of the post, and choose the single design reference that best adapts to the context (e.g., choose #07 for romantic/dating themes, #05 or #06 for traditional/São João themes, #02 or #08 for sports/competition, #15 for bright cartoonish retail promos, #10 for hiring/recruitment, #16 for religious/church themes, #21 for sticker/collectible sports themes, #22 for music playlists, #23 for elegant profile portraits, #24 for car wash/split layout, #25 for pizza/food themes, etc.).

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

GENERATION RULES FOR OPTION 3:
1. Select the single Reference ID (#01 to #25) that fits the post context best.
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


${approvedPromptsExamples}

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
