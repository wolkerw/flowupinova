import { NextResponse, type NextRequest } from "next/server";
import { fal } from "@fal-ai/client";
import { Jimp } from "jimp";
import { admin, adminDb } from "@/lib/firebase-admin";
import crypto from "crypto";
import { logApiUsage } from "@/lib/services/api-usage-service-admin";

export const maxDuration = 300;


function safeJsonParse(rawText, fallback = null) {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.substring(7);
  else if (cleaned.startsWith('```')) cleaned = cleaned.substring(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
  cleaned = cleaned.trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('[GERAR_REFERENCIA] Erro no JSON.parse. Raw text (first 1500 chars):', cleaned.substring(0, 1500));
    try {
      const sanitized = cleaned.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
      return JSON.parse(sanitized);
    } catch(e2) {
      if (fallback) return fallback;
      throw e;
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const falKey = process.env.FAL_KEY || process.env.FAL_API_KEY;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!falKey || !apiKey) {
      return NextResponse.json(
        { error: "Chaves de API ausentes no servidor (FAL_KEY ou GEMINI_API_KEY)." },
        { status: 500 }
      );
    }

    const rawFalKey = falKey.trim().startsWith("Key ")
      ? falKey.trim().replace(/^Key\s+/i, "")
      : falKey.trim();

    fal.config({
      credentials: rawFalKey,
    });

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "generate-ideas") {
      const formData = await request.formData();
      const inspirationFile = formData.get("inspiration_file") as File;
      const description = (formData.get("description") as string) || "";
      const businessName = (formData.get("business_name") as string) || "";
      const businessCategory = (formData.get("business_category") as string) || "";
      const businessDescription = (formData.get("business_description") as string) || "";

      if (!inspirationFile) {
        return NextResponse.json({ error: "Imagem de inspiração não fornecida." }, { status: 400 });
      }

      // Converter imagem para base64
      const arrayBuffer = await inspirationFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const mimeType = inspirationFile.type || "image/jpeg";
      const base64Image = buffer.toString("base64");

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.toLocaleString("pt-BR", { month: "long" });

      const geminiPrompt = `Você é um especialista em Copywriting Sênior, Marketing e Diretor de Arte de redes sociais.
CONTEXTO TEMPORAL: Estamos no ano de ${currentYear}, no mês de ${currentMonth}. Sempre utilize esse ano/contexto atual caso precise citar datas, anos ou campanhas promocionais sazonais. Nunca cite o ano de 2024.

Análise detalhadamente a imagem de inspiração visual (print de post) fornecida e a descrição enviada pelo usuário: "${description}".
Com base nessas informações e no perfil comercial do usuário informado abaixo, crie 3 propostas de publicações virais e estratégicas para o Instagram que herdem e adaptem o conceito visual, estilo estético, layout e tom de voz do print de referência para a realidade deste negócio.

Informações do Negócio do Usuário:
- Nome da Empresa: ${businessName || "Não informado"}
- Ramo de Atuação: ${businessCategory || "Não informado"}
- Descrição do Negócio: ${businessDescription || "Não informado"}

Instruções para cada uma das 3 propostas de posts:
1. "titulo": Crie um título extremamente curto (máx 45 caracteres), instigante e magnético (gancho comercial forte).
2. "subtitulo": Crie um parágrafo curto e dinâmico (1 a 2 frases) aprofundando a dica ou tema e fechando com uma chamada para ação (CTA) curta e atrativa.
3. "hashtags": Uma lista contendo de 3 a 5 hashtags muito relevantes para o nicho comercial da publicação.

Você DEVE responder exclusivamente no formato JSON abaixo, de forma estrita, sem qualquer explicação, introdução, conclusão ou blocos de marcação de código adicionais. Responda APENAS o JSON bruto:
{
  "publicacoes": [
    {
      "titulo": "Título Magnético 1 🚀",
      "subtitulo": "Parágrafo curto de valor detalhando o post com CTA no final. O que você acha disso?",
      "hashtags": ["#Hashtag1", "#Hashtag2", "#Hashtag3"]
    },
    {
      "titulo": "Título Magnético 2 ✨",
      "subtitulo": "Conteúdo estratégico com dicas práticas e leitura dinâmica. Salve para ler depois!",
      "hashtags": ["#Hashtag4", "#Hashtag5", "#Hashtag6"]
    },
    {
      "titulo": "Título Magnético 3 💡",
      "subtitulo": "Post focado em autoridade e dor do cliente mostrando a solução. Visite nosso perfil para saber mais!",
      "hashtags": ["#Hashtag7", "#Hashtag8", "#Hashtag9"]
    }
  ]
}`;

      const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
      let parsed = null;

      if (anthropicApiKey) {
        try {
          console.log(
            "[GERAR_REFERENCIA] Usando Claude 3.5 Sonnet Vision (v2) para analisar inspiração..."
          );
          let response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "x-api-key": anthropicApiKey,
              "anthropic-version": "2023-06-01",
              "content-type": "application/json",
            },
            body: JSON.stringify({
              model: "claude-sonnet-5",
              max_tokens: 3000,
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "image",
                      source: {
                        type: "base64",
                        media_type: mimeType,
                        data: base64Image,
                      },
                    },
                    {
                      type: "text",
                      text: geminiPrompt,
                    },
                  ],
                },
              ],
            }),
          });

          // Se der erro de modelo não encontrado, tentar Sonnet v1 (20240620)
          if (!response.ok) {
            const errText = await response.text();
            console.warn(
              "[GERAR_REFERENCIA] Falha com Claude Sonnet v2 (Ideas), tentando v1:",
              errText
            );

            response = await fetch("https://api.anthropic.com/v1/messages", {
              method: "POST",
              headers: {
                "x-api-key": anthropicApiKey,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
              },
              body: JSON.stringify({
                model: "claude-sonnet-4-5-20250929",
                max_tokens: 3000,
                messages: [
                  {
                    role: "user",
                    content: [
                      {
                        type: "image",
                        source: {
                          type: "base64",
                          media_type: mimeType,
                          data: base64Image,
                        },
                      },
                      {
                        type: "text",
                        text: geminiPrompt,
                      },
                    ],
                  },
                ],
              }),
            });
          }

          if (!response.ok) {
            const errText = await response.text();
            console.error("[GERAR_REFERENCIA] Erro no Claude Vision v1/v2 (Ideas):", errText);
            throw new Error(`Falha no Claude Vision ao gerar ideias: ${errText}`);
          }

          const resData = await response.json();
          const rawText = resData.content?.[0]?.text;
          parsed = safeJsonParse(rawText);
        } catch (claudeError) {
          console.error(
            "[GERAR_REFERENCIA] Falha no Claude Vision (Ideas), acionando fallback para Gemini:",
            claudeError
          );
        }
      }

      if (!parsed) {
        try {
          console.log(
            "[GERAR_REFERENCIA] Usando Gemini 2.5 Pro de fallback para gerar ideias textuais..."
          );
          const geminiProUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`;
          const geminiResponse = await fetch(geminiProUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: geminiPrompt },
                    {
                      inlineData: {
                        mimeType: mimeType,
                        data: base64Image,
                      },
                    },
                  ],
                },
              ],
              generationConfig: { responseMimeType: "application/json", maxOutputTokens: 8192 },
            }),
          });

          if (!geminiResponse.ok) {
            throw new Error(await geminiResponse.text());
          }

          const resData = await geminiResponse.json();
          const rawJson = resData.candidates?.[0]?.content?.parts?.[0]?.text;
          parsed = safeJsonParse(rawJson);
        } catch (proError) {
          console.warn(
            "[GERAR_REFERENCIA] Falha no Gemini 2.5 Pro (Ideas), tentando Gemini 2.5 Flash:",
            proError
          );

          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;
          const geminiResponse = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: geminiPrompt },
                    {
                      inlineData: {
                        mimeType: mimeType,
                        data: base64Image,
                      },
                    },
                  ],
                },
              ],
              generationConfig: { responseMimeType: "application/json", maxOutputTokens: 8192 },
            }),
          });

          if (!geminiResponse.ok) {
            const errText = await geminiResponse.text();
            console.error("[MIGRATED_REF_IDEAS] Falha no Gemini Flash:", errText);
            throw new Error(`Falha ao gerar ideias no Gemini: ${errText}`);
          }

          const resData = await geminiResponse.json();
          const rawJson = resData.candidates?.[0]?.content?.parts?.[0]?.text;
          parsed = safeJsonParse(rawJson);
        }
      }

      return NextResponse.json(parsed);
    }

    if (action === "analyze") {
      const formData = await request.formData();
      const file = formData.get("file") as File;
      const secondaryFile = formData.get("secondaryFile") as File | null;

      if (!file) {
        return NextResponse.json({ error: "Arquivo de imagem não fornecido." }, { status: 400 });
      }

      // Função auxiliar para preparar buffer e cortar 1:1
      const processImage = async (imgFile: File) => {
        const arrayBuffer = await imgFile.arrayBuffer();
        let buffer = Buffer.from(arrayBuffer);
        const mimeType = imgFile.type || "image/jpeg";

        try {
          const image = await Jimp.read(buffer);
          const width = image.width;
          const height = image.height;
          if (width !== height) {
            const size = Math.min(width, height);
            const x = Math.max(0, Math.floor((width - size) / 2));
            const y = Math.max(0, Math.floor((height - size) / 2));
            image.crop({ x, y, w: size, h: size });
            buffer = await image.getBuffer("image/jpeg");
          }
        } catch (jimpError) {
          console.warn("[GERAR_REFERENCIA] Falha ao recortar imagem, usando original:", jimpError);
        }
        return {
          base64: buffer.toString("base64"),
          mimeType,
        };
      };

      const { base64: base64Image1, mimeType: mimeType1 } = await processImage(file);

      // Call Gemini for physical description
      const geminiAnalysisPrompt = `Analyze the given image with high precision to extract structural features for image conditioning. Determine if it depicts a product, a piece of clothing/apparel, a character, or a combination.

Return the analysis strictly in YAML format with the following fields depending on the subject type (do not add conversational text or markdown code blocks, return ONLY raw YAML):

If the image contains a PRODUCT or PACKAGING:
  brand_name: (Name of the brand if visible or inferable)
  color_scheme:
    - hex: (Hex code of prominent color)
      name: (Descriptive name of the color, e.g., matte olive green)
  font_style: (Describe the typography: serif, sans-serif, bold, elegant script, etc.)
  literal_texts_and_labels: (Transcribe every single word and phrase visible on the packaging exactly as written, inside double quotes)
  material_texture: (Describe the packaging material: frosted glass, matte paper, glossy plastic, brushed metal, etc.)
  visual_description: (A detailed sentence describing the object's shape, labeling design, and unique physical attributes)
  background_and_setting: (Detailed description of the environment, location, props, and background scenery)

If the image contains CLOTHING / APPAREL (Flat lay, hanger, or worn):
  item_type: (e.g., matching two-piece set, linen trousers, summer dress)
  color_scheme:
    - hex: (Hex code of fabric color)
      name: (Color name, e.g., pastel off-white, ocean blue)
  fabric_texture: (Describe the material and weave: textured linen, soft ribbed cotton, silk satin, thick denim)
  design_patterns: (Describe prints, patterns, stripes, buttons, stitching, or pocket details)
  cut_and_fit: (Describe the fit: oversized, cropped, slim fit, high-waisted, flowy)
  visual_description: (A detailed sentence summarizing the garment's appearance, shape, and physical design details)
  background_and_setting: (Detailed description of the environment, location, props, and background scenery)

If the image depicts a CHARACTER:
  character_name: (Name if known)
  color_scheme:
    - hex: (Hex code of prominent outfit/feature color)
      name: (Color name)
  outfit_style: (Detailed description of clothing style, accessories, or notable features)
  visual_description: (A full sentence summarizing face, hair, expression, and overall styling)
  background_and_setting: (Detailed description of the environment, location, props, and background scenery)`;

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;

      const callGeminiVision = async (base64: string, mime: string, specificPrompt: string) => {
        const response = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: specificPrompt },
                  {
                    inlineData: {
                      mimeType: mime,
                      data: base64,
                    },
                  },
                ],
              },
            ],
          }),
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        const resData = await response.json();
        return resData.candidates?.[0]?.content?.parts?.[0]?.text || "";
      };

      let yamlAnalysis = "";

      if (secondaryFile) {
        console.log(
          "[GERAR_REFERENCIA] Modo híbrido detectado. Analisando as duas imagens de referência em paralelo..."
        );
        const { base64: base64Image2, mimeType: mimeType2 } = await processImage(secondaryFile);

        const promptPerson = `${geminiAnalysisPrompt}\n\nCRITICAL: This is a CHARACTER reference (Foto 1). Focus strictly on character styling, facial details, hair, and overall fisionomy.`;
        const promptProduct = `${geminiAnalysisPrompt}\n\nCRITICAL: This is a PRODUCT/PROJECT/SCENARIO reference (Foto 2). Focus strictly on its physical features, shapes, textures, materials, and colors.`;

        const [analysis1, analysis2] = await Promise.all([
          callGeminiVision(base64Image1, mimeType1, promptPerson),
          callGeminiVision(base64Image2, mimeType2, promptProduct),
        ]);

        yamlAnalysis = `PRIMARY_PERSON_ANALYSIS:\n${analysis1}\n\nSECONDARY_PRODUCT_ANALYSIS:\n${analysis2}`;
      } else {
        yamlAnalysis = await callGeminiVision(base64Image1, mimeType1, geminiAnalysisPrompt);
      }

      return NextResponse.json({ success: true, yamlAnalysis });
    }

    if (action === "generate-prompt") {
      let yamlAnalysis = "";
      let description = "";
      let title = "";
      let businessProfile: any = null;
      let inspirationFile: File | null = null;
      let isRetailStyle = false;
      let hybridPriority = "balanced";

      const contentType = request.headers.get("content-type") || "";
      if (contentType.includes("multipart/form-data")) {
        const formData = await request.formData();
        yamlAnalysis = (formData.get("yamlAnalysis") as string) || "";
        description = (formData.get("description") as string) || "";
        title = (formData.get("title") as string) || "";
        isRetailStyle = formData.get("isRetailStyle") === "true";
        hybridPriority = (formData.get("hybridPriority") as string) || "balanced";
        const profileStr = formData.get("businessProfile") as string;
        if (profileStr) {
          try {
            businessProfile = JSON.parse(profileStr);
          } catch {}
        }
        inspirationFile = formData.get("inspiration_file") as File | null;
      } else {
        const body = await request.json();
        yamlAnalysis = body.yamlAnalysis || "";
        description = body.description || "";
        title = body.title || "";
        isRetailStyle = body.isRetailStyle === true || body.isRetailStyle === "true";
        hybridPriority = body.hybridPriority || "balanced";
        businessProfile = body.businessProfile || null;
      }

      if (!yamlAnalysis || !description) {
        return NextResponse.json(
          { error: "Campos 'yamlAnalysis' ou 'description' ausentes." },
          { status: 400 }
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
6. BRANDING AND VISUAL PALETTE (CRITICAL BRAND MATCHING): The advertising scene surrounding the subject MUST organically represent the brand colors of "${name || "the brand"}" (Primary: ${primaryHex} and Secondary: ${secondaryHex}).
   ${extendedColorsText ? `Additional extended brand colors to integrate:\n${extendedColorsText}` : ""}
   - Carefully blend these colors in the surrounding environment. For instance: add colored studio gel lighting highlights, gentle glowing neon tubes in the background, bokeh ambient colors, or aesthetic secondary props (a vase, furniture accent, background canvas texture, or studio accessories) reflecting this color palette.
   - If a Background/Studio Color Hex is specified, use that exact shade for the backdrop/studio setup.
   - The main reference product/garment itself must remain physically unaffected, retaining its original colors as detailed in the reference YAML description. Only customize the surrounding visual elements of the photo.
${
  fontsText
    ? `
7. TYPOGRAPHY AND BRAND FONTS: If the layout requires text overlays, badges, or printed titles, they must follow the brand's typography system:
   ${fontsText}
   - Describe a clean typographic composition that uses the specified Primary Font for titles/headers or aligns with the specified General Typographic Style (e.g. "with bold modern text printed in Montserrat typeface").
`
    : ""
}
`;
      }

      let inspirationInstruction = "";
      let inlineDataPart: any = null;

      let base64Image = "";
      let mimeType = "";

      if (inspirationFile) {
        try {
          const arrayBuffer = await inspirationFile.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          mimeType = inspirationFile.type || "image/jpeg";
          base64Image = buffer.toString("base64");

          inlineDataPart = {
            inlineData: {
              mimeType: mimeType,
              data: base64Image,
            },
          };

          inspirationInstruction = `
7. LAYOUT & COMPOSITION & ESTHETIC REPLICA FROM INSPIRATION (MANDATORY DECONSTRUCTION):
   You have been provided with an inspiration/reference image (the print of a post). You MUST analyze it with high-precision computer vision depth and aesthetic decoding:
   - DECONSTRUCT MODEL POSE & BODY LANGUAGE: Look at the human model (if any) in the reference print. Describe their exact pose, body posture, arm placement, hands position, face lean, head tilt, and how they interact with the product. E.g., if a hand holds the product from below, say "...the model casually holding the product in their right palm, fingers gently wrapped around the bottom...". Imitate this exact posture and physical interaction.
   - REPLICATE CAMERA ANGLE & FRAMING: Identify the camera focal lens style and framing (e.g., tight close-up, eye-level medium shot, low-angle flat-lay, high-angle portrait) and copy it exactly in your prompt.
   - COPY LIGHTING & ATMOSPHERE: Analyze the light source direction, light quality (e.g., hard high-contrast sunlight, ultra-soft cinematic window glow, directional rim lighting, studio gel colors) and translate it precisely.
   - DECONSTRUCT SCENARIO & PALETTE: Extract the precise colors of the environment (e.g., warm cream walls, sage green accessories, dark slate gray stone background), textures (wood grain, polished marble, concrete, linen folds), and copy them exactly to make the visual vibe indistinguishable from the reference post.
   - DECONSTRUCT GRAPHIC LAYOUT & BADGES: Observe if the reference post features geometric colored overlays, floating product stands, colored banner stripes, or discount badges. Request a highly clean, professional equivalent visual composition (e.g., "...with a clean, minimalist circular overlay badge containing the bold modern text 'PROMO'...") matching the placement from the reference.
   - ABSOLUTE TEXT ISOLATION RULE: Do NOT copy, translate, or include any texts, slogans, words, numbers, logos, or brand names present in the inspiration reference print. You MUST completely discard and ignore any text visible in the reference image. The ONLY text allowed on the generated image is the selected post title ("${title || ""}"), which must be printed exactly once. Copying text from the reference print is strictly prohibited.
   - FORCE FIDELITY: Your output prompt must explicitly detail these visual features as the foundational pillars of the generation, ensuring the resulting image is an extremely accurate aesthetic and compositional sibling of the reference print.
`;
        } catch (e) {
          console.warn(
            "[GERAR_REFERENCIA] Falha ao processar arquivo de inspiração para prompt:",
            e
          );
        }
      }

      let textRenderingInstruction = "";
      if (title && title.trim()) {
        textRenderingInstruction = `
- The user requested a literal text/title to be rendered directly on the image: "${title}".
- You MUST instruct the image generator to render this literal text exactly as written, inside double quotes, styled beautifully.
- Place it strategically (e.g. at the bottom, top-center, or on a clean graphic overlay) so it doesn't cover the main subjects (the person and the product).
- DUPLICATION PREVENTION (CRITICAL): The prompt must strictly instruct the image creator to render ONLY the exact words from the title "${title}", and strictly forbid adding, repeating, or duplicating any words. Under no circumstances should the prompt describe words from the title as separate or standalone text elements, as this confuses the generator. For example, do NOT write: 'render "Sua Empresa Blindada" and also the word "Empresa" twice.' Instead, write: 'render the title "Sua Empresa Blindada" once, and style the word "Empresa" (which is already inside the title) in bold'. Explicitly append: "Do not render any other words, do not duplicate any words, and only write the words of the title once. Ensure that no word (such as the company name or the word 'empresa') is written or repeated twice on the canvas. The text must read exactly '${title}' and nothing else."
- PORTUGUESE ACCENTUATION RULE (CRITICAL): To ensure perfect Portuguese (pt_BR) spelling and characters (such as á, é, í, ó, ú, ç, ã, õ, ê, ô), you MUST explicitly describe the accent marks in the prompt.
  - Example: If the text is "Lançamento Incrível", write: ...render the literal text "Lançamento Incrível" with a clean tilde (~) mark on the letter "ã" in "Lançamento", and a clean acute accent mark on the letter "í" in "Incrível". Ensure all accent marks and special characters (á, é, í, ó, ú, ç, ã, õ, ê, ô) are rendered perfectly with no spelling errors or distorted glyphs, using a standard sans-serif font like Montserrat or Arial which has full UTF-8 character support.
`;
      } else {
        textRenderingInstruction = `
- The prompt MUST describe the visual scene and subjects, but it MUST contain ABSOLUTELY NO text, slogans, prices, or graphical UI elements written on the canvas.
`;
      }

      let priorityInstruction = "";
      if (hybridPriority === "scenario") {
        priorityInstruction = `
# STRICT SCENARIO FIDELITY & ASYMMETRIC FRAMING RULE (CRITICAL FOR IMMOVABLES / SCENARIOS):
- The background, architecture, building, rooms, or garden from Photo 2 (described in SECONDARY_PRODUCT_ANALYSIS) are the absolute subject and setting of the scene.
- You MUST describe this physical scenario with high fidelity (materials, layout, lights, doors, windows, textures). Do NOT replace the backdrop with a generic scene.
- COMPOSITION & PLACEMENT: The person from Photo 1 must be placed off-center, positioned on the far-left or far-right of the frame (applying the photographic rule of thirds). The center of the image must remain completely open and unobstructed to beautifully display the main entrance, facade, or central architecture of the property in Photo 2.
`;
      } else if (hybridPriority === "packshot") {
        priorityInstruction = `
# STRICT PRODUCT SWAP & PACKSHOT COMPOSITION RULE (CRITICAL FOR PACKSHOTS):
- The product from Photo 1 (described in PRIMARY_PERSON_ANALYSIS) is the main subject to be highlighted.
- The environment, background, styling, decoration, and composition from Photo 2 (described in SECONDARY_PRODUCT_ANALYSIS) must be recreated with high fidelity as the backdrop.
- PRODUCT SWAP & PLACEMENT: Identify the main product/object positioned in the foreground of Photo 2, and replace it entirely with the product from Photo 1. Place the product from Photo 1 in the exact same position, scale, and angle as the original product in Photo 2.
- INTEGRATION: Keep the original surface (e.g. table, stone, shelf), shadows, reflections, and ambient lighting of Photo 2, ensuring the product from Photo 1 integrates naturally as if it was originally photographed there.
`;
      } else if (hybridPriority === "person") {
        priorityInstruction = `
# STRICT FOREGROUND PERSON FIDELITY RULE (CRITICAL FOR MODEL/RETRAIT FOCUS):
- The person from Photo 1 (described in PRIMARY_PERSON_ANALYSIS) is the primary focal point of the portrait. Focus heavily on their face, posture, clothes, and skin textures.
- The scenario from Photo 2 is used only as a loose visual reference or backdrop inspiration. You are allowed to simplify, crop, blur (using shallow depth of field / bokeh), or adjust the background layout of Photo 2 freely to make the person stand out as the hero of the image.
`;
      } else {
        priorityInstruction = `
# BALANCED FUSION RULE:
- Balance the visual presence of both the person from Photo 1 and the product/project/scenario from Photo 2.
- Describe a composition where the person is interacting naturally with the product/project, ensuring both elements are recognizable, in sharp focus, and lit under the same environment.
`;
      }

      const geminiSystemInstruction = `# ROLE
You are an elite Creative Art Director, Ad Designer, and Prompt Engineer specialized in User-Generated Content (UGC) advertising and premium photographic product placement for image generation models (specifically Flux Kontext).

# GOAL
Given a reference image description (extracted features in YAML), the user's creative advertising ideas, and optionally an inspiration image (the print), you MUST write a descriptive prompt in English for the "flux-pro/kontext" model.
This prompt MUST describe a realistic photorealistic scene, detailing the product, ambient scenery, professional lighting, camera lens and realism textures.

# CRITICAL RULES
1. OUTPUT LANGUAGE: You must write the final image prompt completely IN ENGLISH. Generating prompts in English dramatically increases the quality, pose accuracy, and realism of the model.
2. NO DUPLICATE PRODUCTS (ULTRA-CRITICAL): Since we are using "flux-pro/kontext" (an image conditioning model), you MUST refer to the user's product in the input image as "the product" or "the product in the input image" instead of describing a new, generic product from scratch. 
   - Never write phrases that cause the generator to draw two separate products (e.g. "a model holding a laptop while another laptop is on the table"). 
   - Always integrate "the product in the input image" seamlessly into the pose, scene, and hands of the model (if there is a model).
3. ABSOLUTELY NO CROPPED HEADS OR HAIR (ULTRA-CRITICAL): If the image features a person or model (holding a product, wearing clothing, or posing), you MUST ABSOLUTELY prevent the top of their head, forehead, or hair from being cut off by the border of the canvas.
   - You MUST explicitly inject multiple strict spatial instructions into the generated prompt.
   - You MUST include a phrase like: "framed in a balanced medium shot showing the model from the chest up, with a generous amount of empty space (clear headroom) above their head. The model's entire head, full hair, and face are completely visible and fully contained within the frame, with no cutoff or clipping by the borders of the image."
   - Avoid tight face close-ups, macro portraits, or extreme crops that focus excessively on the face/garment and leave no headroom. Always choose a spacious medium shot or a wide-angle composition.
4. TEXT RENDERING CONTROL (CRITICAL):
   ${textRenderingInstruction}
5. FORMAT: Always end the prompt with the instruction: "square format, optimized for Instagram feed".
${priorityInstruction}
${brandingInstruction}
${inspirationInstruction}
# UGC PHOTOGRAPHY & ESTHETIC PREMIUM
- Always describe a high-end commercial advertising photograph or a clean premium lifestyle portrait (e.g., "real-world professional commercial photography", "premium natural lifestyle scene", "luxury cinematic portrait").
- Mandatorily detail advanced lighting setups to create stunning visual separation (e.g., "cinematic volumetric natural lighting", "soft ambient sunlight", "gentle side-lighting casting warm soft diagonal shadows", "rim lighting highlighting the contours of the subject").
- Define professional camera specifications to preserve palpable textures and extreme optical sharpness (e.g., "shot on high-end camera, 50mm or 85mm lens, pin-sharp focus on the main subject, shallow depth of field, clean circular bokeh circles in the background").
- Strictly avoid banned artificial buzzwords (e.g., do NOT use "photorealistic", "ultrarealistic", "4k", "8k", "hyper-detailed", or "masterpiece").
- Emphasize natural tangible textures to force model realism: "subtle high-end film grain, realistic skin textures showing fine pores, natural fabric folds, soft textile imperfections, and realistic glass reflections".

# APPAREL & CLOTHING SPECIAL INSTRUCTIONS
If the reference product is clothing/apparel, describe a real human model wearing the garment naturally:
- Specify how the fabric falls, its physical texture (e.g., "textured heavy linen", "soft ribbed premium cotton", "glossy silk satin"), and visual details like wooden buttons, delicate stitching, prints, or specific cuts.
- Describe the model interacting naturally and elegantly with the environment (e.g., "standing relaxed", "leaning casually on the natural ambient furniture").
- Ensure the model's environment strictly represents the user's requested scenario (e.g., "inside the exact real-world scenario requested with beautiful ambient lighting").
- EXPLICITLY state: "The model's entire head, full hair, and face are completely visible and beautifully framed with generous headroom at the top, strictly preventing any part of the head, forehead, or hair from being clipped or cut off by the borders".

# OUTPUT FORMAT (Strict JSON)
You must return exclusively a valid JSON object with the following key. Do not include any explanations, introductory or concluding text:
{
  "imagePrompt": "The highly detailed descriptive prompt in English for the Flux Kontext model. It must be completely photographic, natural, and focus on the product and scene realism with absolutely no texts, logos, or overlay graphics except for the requested styled text title."
}
`;

      const geminiUserMessage = `Sua tarefa: criar um prompt de imagem para post no instagram conforme orientado pelas diretrizes do sistema.
Certifique-se de que a imagem de referência do produto seja representada com a maior precisão possível nas imagens geradas, especialmente em relação a todos os textos e detalhes físicos.
Além disso, se houver uma imagem de inspiração/print fornecida, garanta que a composição, pose do modelo, layout de enquadramento de câmera e estilo visual sejam fielmente imitados e replicados.

Descrição desejada de cenário/modelo pelo usuário: "${description}"

${title && title.trim() ? `Texto promocional / Título a ser renderizado na imagem: "${title}"` : ""}

Descrição física da imagem de referência do produto (YAML):
${yamlAnalysis}`;

      const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
      let parsedPrompt = null;

      if (anthropicApiKey) {
        try {
          console.log(
            "[GERAR_REFERENCIA] Usando Claude 3.5 Sonnet Vision (v2) para gerar o prompt de imagem..."
          );

          const claudeContent: any[] = [];
          if (base64Image) {
            claudeContent.push({
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType,
                data: base64Image,
              },
            });
            claudeContent.push({
              type: "text",
              text: "Esta é a imagem de inspiração/print de layout a ser replicada.",
            });
          }

          claudeContent.push({
            type: "text",
            text: geminiUserMessage,
          });

          let response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "x-api-key": anthropicApiKey,
              "anthropic-version": "2023-06-01",
              "content-type": "application/json",
            },
            body: JSON.stringify({
              model: "claude-sonnet-5",
              max_tokens: 2000,
              system: geminiSystemInstruction,
              messages: [
                {
                  role: "user",
                  content: claudeContent,
                },
              ],
            }),
          });

          // Se der erro de modelo não encontrado, tentar Sonnet v1 (20240620)
          if (!response.ok) {
            const errText = await response.text();
            console.warn(
              "[GERAR_REFERENCIA] Falha com Claude Sonnet v2 (Prompt), tentando v1:",
              errText
            );

            response = await fetch("https://api.anthropic.com/v1/messages", {
              method: "POST",
              headers: {
                "x-api-key": anthropicApiKey,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
              },
              body: JSON.stringify({
                model: "claude-sonnet-4-5-20250929",
                max_tokens: 2000,
                system: geminiSystemInstruction,
                messages: [
                  {
                    role: "user",
                    content: claudeContent,
                  },
                ],
              }),
            });
          }

          if (!response.ok) {
            const errText = await response.text();
            console.error("[GERAR_REFERENCIA] Erro no Claude Vision v1/v2 (Prompt):", errText);
            throw new Error(`Falha no Claude Vision ao gerar prompt: ${errText}`);
          }

          const resData = await response.json();
          const rawText = resData.content?.[0]?.text;
          parsedPrompt = safeJsonParse(rawText);
        } catch (claudeError) {
          console.error(
            "[GERAR_REFERENCIA] Falha catastrófica no Claude Vision (Prompt), acionando fallback para Gemini:",
            claudeError
          );
        }
      }

      if (!parsedPrompt) {
        try {
          console.log("[GERAR_REFERENCIA] Usando Gemini 2.5 Pro de fallback para gerar prompt...");
          const geminiProUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`;

          const contentsParts: any[] = [];
          if (inlineDataPart) {
            contentsParts.push({
              text: "Esta é a imagem de inspiração/print de layout a ser replicada:",
            });
            contentsParts.push(inlineDataPart);
          }
          contentsParts.push({ text: geminiUserMessage });

          const response = await fetch(geminiProUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: geminiSystemInstruction }],
              },
              contents: [{ parts: contentsParts }],
              generationConfig: { responseMimeType: "application/json", maxOutputTokens: 8192 },
            }),
          });

          if (!response.ok) {
            throw new Error(await response.text());
          }

          const resData = await response.json();
          const rawJson = resData.candidates?.[0]?.content?.parts?.[0]?.text;
          parsedPrompt = safeJsonParse(rawJson);
        } catch (proError) {
          console.warn(
            "[GERAR_REFERENCIA] Falha no Gemini 2.5 Pro (Prompt), tentando Gemini 2.5 Flash:",
            proError
          );

          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;

          const contentsParts: any[] = [];
          if (inlineDataPart) {
            contentsParts.push({
              text: "Esta é a imagem de inspiração/print de layout a ser replicada:",
            });
            contentsParts.push(inlineDataPart);
          }
          contentsParts.push({ text: geminiUserMessage });

          const response = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: geminiSystemInstruction }],
              },
              contents: [{ parts: contentsParts }],
              generationConfig: { responseMimeType: "application/json", maxOutputTokens: 8192 },
            }),
          });

          if (!response.ok) {
            throw new Error(await response.text());
          }

          const resData = await response.json();
          const rawJson = resData.candidates?.[0]?.content?.parts?.[0]?.text;
          parsedPrompt = safeJsonParse(rawJson);
        }
      }

      return NextResponse.json({ success: true, imagePrompt: parsedPrompt.imagePrompt });
    }

    if (action === "submit-kontext") {
      const formData = await request.formData();
      const file = formData.get("file") as File;
      const prompt = formData.get("prompt") as string;
      const postId = (formData.get("postId") as string) || "";
      const userId = (formData.get("userId") as string) || "";

      if (!file || !prompt) {
        return NextResponse.json({ error: "Campos 'file' ou 'prompt' ausentes." }, { status: 400 });
      }

      // Convert to buffer & crop just in case
      const arrayBuffer = await file.arrayBuffer();
      let buffer = Buffer.from(arrayBuffer);
      const mimeType = file.type || "image/jpeg";

      try {
        const image = await Jimp.read(buffer);
        const width = image.width;
        const height = image.height;
        if (width !== height) {
          const size = Math.min(width, height);
          const x = Math.max(0, Math.floor((width - size) / 2));
          const y = Math.max(0, Math.floor((height - size) / 2));
          image.crop({ x, y, w: size, h: size });
          buffer = await image.getBuffer("image/jpeg");
        }
      } catch (e) {
        console.warn("[GERAR_REFERENCIA] Falha no crop:", e);
      }

      // Upload to Fal.ai CDN
      const finalFile = new File([new Blob([buffer], { type: mimeType })], file.name, {
        type: mimeType,
      });
      const garmentPublicUrl = await fal.storage.upload(finalFile);

      // --- REMOÇÃO DE FUNDO AUTOMÁTICA VIA BRIA API ---
      let transparentProductUrl = garmentPublicUrl;
      try {
        console.log(
          `[GERAR_REFERENCIA] Removendo fundo do produto de forma síncrona via Bria API: ${garmentPublicUrl}`
        );
        const briaResponse = await fetch("https://queue.fal.run/fal-ai/bria/background/remove", {
          method: "POST",
          headers: {
            Authorization: `Key ${rawFalKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image_url: garmentPublicUrl,
          }),
        });

        if (briaResponse.ok) {
          const briaData = await briaResponse.json();
          const briaUrl = briaData.image?.url || briaData.images?.[0]?.url;
          if (briaUrl) {
            transparentProductUrl = briaUrl;
            console.log(
              `[GERAR_REFERENCIA] Fundo do produto removido com sucesso: ${transparentProductUrl}`
            );

            // Registrar log de consumo do Bria no Firestore
            logApiUsage({
              userId,
              type: "background_removal",
              provider: "falai",
              model: "bria",
              costUsd: 0.006,
            });
          }
        } else {
          console.warn(
            "[GERAR_REFERENCIA] Falha na API do Bria, prosseguindo com imagem original:",
            await briaResponse.text()
          );
        }
      } catch (briaError) {
        console.error(
          "[GERAR_REFERENCIA] Erro catastrófico ao remover fundo do produto (Bria), usando original:",
          briaError
        );
      }

      // Submit to queue
      const queueResponse = await fetch("https://queue.fal.run/fal-ai/flux-pro/kontext", {
        method: "POST",
        headers: {
          Authorization: `Key ${rawFalKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt,
          image_url: transparentProductUrl,
          aspect_ratio: "1:1",
        }),
      });

      if (!queueResponse.ok) {
        throw new Error(await queueResponse.text());
      }

      const queueData = await queueResponse.json();
      return NextResponse.json({
        success: true,
        requestId: queueData.request_id,
        statusUrl: queueData.status_url,
        responseUrl: queueData.response_url,
        garmentPublicUrl: garmentPublicUrl, // Retornando a URL da foto de referência original
      });
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // 🧪 TESTE PROVISÓRIO: submit-imagen4-ref
    // Substitui o Flux Kontext pelo Google Imagen 4 para benchmarking de qualidade.
    // Diferença crítica: Imagen 4 é TEXT-TO-IMAGE (não usa a foto do produto como
    // input direto), mas usa o prompt otimizado gerado a partir da análise do produto.
    // Fluxo: síncrono (sem fila/polling) → retorna imageUrl direto em COMPLETED.
    // ──────────────────────────────────────────────────────────────────────────────
    if (action === "submit-imagen4-ref") {
      const formData = await request.formData();
      const prompt = formData.get("prompt") as string;
      const postId = (formData.get("postId") as string) || "";
      const userId = (formData.get("userId") as string) || "";
      const caption = (formData.get("caption") as string) || null;

      if (!prompt || !postId || !userId) {
        return NextResponse.json(
          { error: "Campos obrigatórios ausentes: prompt, postId, userId." },
          { status: 400 }
        );
      }

      console.log(
        `[IMAGEN4_REF] Iniciando geração via Imagen 4 (modo benchmark) para o post ${postId}...`
      );

      // Cadeia de modelos: Fast primeiro (Ultra tendo 503), depois Ultra quando voltar
      const IMAGEN_MODELS = ["imagen-4.0-fast-generate-001", "imagen-4.0-ultra-generate-001"];

      let imageBytes: string | null = null;
      let modelUsed = "";

      for (const model of IMAGEN_MODELS) {
        try {
          console.log(`[IMAGEN4_REF] Tentando modelo ${model}...`);
          const imagenUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`;
          const imagenResponse = await fetch(imagenUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              instances: [{ prompt }],
              parameters: { sampleCount: 1, outputMimeType: "image/jpeg", aspectRatio: "1:1" },
            }),
          });

          if (imagenResponse.ok) {
            const data = await imagenResponse.json();
            const bytes = data?.predictions?.[0]?.bytesBase64Encoded;
            if (bytes) {
              imageBytes = bytes;
              modelUsed = model;
              console.log(`[IMAGEN4_REF] ✅ Sucesso com o modelo ${model}!`);
              break;
            }
          }
          const errText = await imagenResponse
            .text()
            .catch(() => `status ${imagenResponse.status}`);
          console.warn(
            `[IMAGEN4_REF] Modelo ${model} falhou (${imagenResponse.status}): ${errText.substring(0, 150)}`
          );
        } catch (modelErr: any) {
          console.warn(`[IMAGEN4_REF] Exceção no modelo ${model}:`, modelErr.message);
        }
      }

      if (!imageBytes) {
        return NextResponse.json(
          { error: "Todos os modelos do Google Imagen falharam para a geração de referência." },
          { status: 500 }
        );
      }

      // Salvar no Firebase Storage
      const bucket = admin
        .storage()
        .bucket(
          `${process.env.FIREBASE_PROJECT_ID || "studio-7502195980-3983c"}.firebasestorage.app`
        );
      const buffer = Buffer.from(imageBytes, "base64");
      const fileRef = bucket.file(`users/${userId}/posts/${postId}/imagen4_ref_generated.jpg`);
      const downloadToken = crypto.randomUUID();

      await fileRef.save(buffer, {
        metadata: {
          contentType: "image/jpeg",
          metadata: { firebaseStorageDownloadTokens: downloadToken },
        },
      });

      const firebaseDownloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileRef.name)}?alt=media&token=${downloadToken}`;
      console.log(
        `[IMAGEN4_REF] Imagem salva no Firebase Storage (${modelUsed}): ${firebaseDownloadUrl}`
      );

      // Atualizar post no Firestore
      try {
        await adminDb
          .collection("users")
          .doc(userId)
          .collection("posts")
          .doc(postId)
          .set(
            {
              imageUrls: [firebaseDownloadUrl],
              imagenModelUsed: modelUsed,
              status: "completed",
            },
            { merge: true }
          );
      } catch (fsErr) {
        console.error("[IMAGEN4_REF] Erro ao atualizar Firestore:", fsErr);
      }

      try {
        const galleryRef = adminDb.collection("users").doc(userId).collection("mediaGallery");
        await galleryRef.doc(`${postId}_imagen4_ref`).set({
          id: `${postId}_imagen4_ref`,
          url: firebaseDownloadUrl,
          storagePath: fileRef.name,
          source: "imagen4_ref_benchmark",
          prompt,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          usedInPostId: null,
          fileName: "imagen4_ref_generated.jpg",
          modelUsed,
          caption,
        });

        // Registrar log de consumo do Google Imagen 4
        logApiUsage({
          userId,
          type: "image_generation",
          provider: "google_vertex",
          model: modelUsed || "imagen-4",
          costUsd: 0.03,
        });
      } catch (galleryErr) {
        console.error("[IMAGEN4_REF] Erro ao salvar na galeria:", galleryErr);
      }

      // Retorna no mesmo formato do check-status COMPLETED para o frontend não precisar de polling
      return NextResponse.json({
        success: true,
        // Flags que o frontend usa para detectar "COMPLETED" sem polling
        status: "COMPLETED",
        imageUrl: firebaseDownloadUrl,
        modelUsed,
      });
    }

    if (action === "submit-nanobanana-ref") {
      const formData = await request.formData();
      const file = formData.get("file") as File;
      const secondaryFile = formData.get("secondaryFile") as File | null;
      const prompt = formData.get("prompt") as string;
      const postId = (formData.get("postId") as string) || "";
      const userId = (formData.get("userId") as string) || "";
      const caption = (formData.get("caption") as string) || null;
      const hybridPriority = (formData.get("hybridPriority") as string) || "balanced";

      if (!file || !prompt || !postId || !userId) {
        return NextResponse.json(
          { error: "Campos obrigatórios ausentes: file, prompt, postId, userId." },
          { status: 400 }
        );
      }

      console.log(`[NANOBANANA_REF] Iniciando processamento para o post ${postId}...`);

      // Função auxiliar para processar, recortar 1:1 proporcional e redimensionar para 768px max
      const processImageBuffer = async (imgFile: File) => {
        const arrBuf = await imgFile.arrayBuffer();
        let buf = Buffer.from(arrBuf);
        const mime = imgFile.type || "image/jpeg";
        try {
          const image = await Jimp.read(buf);
          let width = image.width;
          let height = image.height;

          if (width !== height) {
            const size = Math.min(width, height);
            const x = Math.max(0, Math.floor((width - size) / 2));
            const y = Math.max(0, Math.floor((height - size) / 2));
            image.crop({ x, y, w: size, h: size });
            width = size;
            height = size;
          }

          const maxDim = 768;
          if (width > maxDim) {
            image.resize({ w: maxDim, h: maxDim });
          }

          buf = await image.getBuffer("image/jpeg");
        } catch (e) {
          console.warn("[NANOBANANA_REF] Falha no crop/resize:", e);
        }
        return { buffer: buf, mimeType: "image/jpeg" };
      };

      // 1. Processar Foto 1 (Pessoa/Selfie)
      const { buffer: buffer1, mimeType: mimeType1 } = await processImageBuffer(file);

      // Upload Foto 1 para CDN do Fal.ai
      let garmentPublicUrl = "";
      try {
        const finalFile1 = new File([new Blob([buffer1], { type: mimeType1 })], file.name, {
          type: mimeType1,
        });
        garmentPublicUrl = await fal.storage.upload(finalFile1);
        console.log(`[NANOBANANA_REF] Foto 1 enviada para CDN do Fal.ai: ${garmentPublicUrl}`);
      } catch (uploadErr) {
        console.error(
          "[NANOBANANA_REF] Erro no upload da Foto 1 para o Fal.ai Storage:",
          uploadErr
        );
      }

      // Preparar variáveis do subject 2 (Produto/Projeto)
      let secondaryGarmentPublicUrl = "";
      let transparentProductUrl = "";
      let base64Image2 = "";
      let mimeType2 = "";

      let transparentGarmentUrl = garmentPublicUrl;
      if (hybridPriority === "packshot" && garmentPublicUrl) {
        try {
          console.log(
            `[NANOBANANA_REF] Removendo fundo da Foto 1 (Produto Amador) via Bria API (Packshot)...`
          );
          const briaResponse = await fetch("https://queue.fal.run/fal-ai/bria/background/remove", {
            method: "POST",
            headers: {
              Authorization: `Key ${rawFalKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              image_url: garmentPublicUrl,
            }),
          });

          if (briaResponse.ok) {
            const briaData = await briaResponse.json();
            const briaUrl = briaData.image?.url || briaData.images?.[0]?.url;
            if (briaUrl) {
              transparentGarmentUrl = briaUrl;
              console.log(
                `[NANOBANANA_REF] Fundo da Foto 1 removido via Bria: ${transparentGarmentUrl}`
              );
              logApiUsage({
                userId,
                type: "background_removal",
                provider: "falai",
                model: "bria",
                costUsd: 0.006,
              });
            }
          }
        } catch (briaError) {
          console.error("[NANOBANANA_REF] Erro no Bria para Foto 1 (Packshot):", briaError);
        }
      }

      if (secondaryFile) {
        // 2. Processar Foto 2 (Produto/Projeto)
        console.log("[NANOBANANA_REF] Processando Foto 2 (Produto/Projeto)...");
        const { buffer: buffer2, mimeType: mimeType2Original } =
          await processImageBuffer(secondaryFile);

        // Upload Foto 2 para CDN do Fal.ai
        try {
          const finalFile2 = new File(
            [new Blob([buffer2], { type: mimeType2Original })],
            secondaryFile.name,
            { type: mimeType2Original }
          );
          secondaryGarmentPublicUrl = await fal.storage.upload(finalFile2);
          console.log(
            `[NANOBANANA_REF] Foto 2 enviada para CDN do Fal.ai: ${secondaryGarmentPublicUrl}`
          );
        } catch (uploadErr) {
          console.error(
            "[NANOBANANA_REF] Erro no upload da Foto 2 para o Fal.ai Storage:",
            uploadErr
          );
        }

        // Remoção de fundo da Foto 2 (Produto) via Bria API (apenas se a prioridade NÃO for foco em cenário)
        transparentProductUrl = secondaryGarmentPublicUrl;
        if (
          secondaryGarmentPublicUrl &&
          hybridPriority !== "scenario" &&
          hybridPriority !== "packshot"
        ) {
          try {
            console.log(`[NANOBANANA_REF] Removendo fundo da Foto 2 (Produto) via Bria API...`);
            const briaResponse = await fetch(
              "https://queue.fal.run/fal-ai/bria/background/remove",
              {
                method: "POST",
                headers: {
                  Authorization: `Key ${rawFalKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  image_url: secondaryGarmentPublicUrl,
                }),
              }
            );

            if (briaResponse.ok) {
              const briaData = await briaResponse.json();
              const briaUrl = briaData.image?.url || briaData.images?.[0]?.url;
              if (briaUrl) {
                transparentProductUrl = briaUrl;
                console.log(
                  `[NANOBANANA_REF] Fundo da Foto 2 removido via Bria: ${transparentProductUrl}`
                );

                // Registrar log de consumo do Bria no Firestore
                logApiUsage({
                  userId,
                  type: "background_removal",
                  provider: "falai",
                  model: "bria",
                  costUsd: 0.006,
                });
              }
            } else {
              console.warn(
                "[NANOBANANA_REF] Falha na API do Bria para Foto 2, prosseguindo com original:",
                await briaResponse.text()
              );
            }
          } catch (briaError) {
            console.error(
              "[NANOBANANA_REF] Erro ao remover fundo da Foto 2 via Bria, usando original:",
              briaError
            );
          }
        }

        // Baixar imagem recortada e transparente do produto para base64
        base64Image2 = buffer2.toString("base64");
        mimeType2 = mimeType2Original;

        if (transparentProductUrl && transparentProductUrl !== secondaryGarmentPublicUrl) {
          try {
            console.log(
              `[NANOBANANA_REF] Baixando Foto 2 sem fundo de ${transparentProductUrl} para base64...`
            );
            const imgRes = await fetch(transparentProductUrl);
            if (imgRes.ok) {
              const imgArrayBuffer = await imgRes.arrayBuffer();
              let imgBuffer = Buffer.from(imgArrayBuffer);
              let mimeTypeDownloaded = imgRes.headers.get("content-type") || "image/png";

              // Otimizar e redimensionar PNG com fundo transparente
              try {
                const jimpImg = await Jimp.read(imgBuffer);
                if (jimpImg.width > 768 || jimpImg.height > 768) {
                  jimpImg.resize({ w: 768, h: 768 });
                }
                imgBuffer = await jimpImg.getBuffer("image/png");
                mimeTypeDownloaded = "image/png";
              } catch (jimpError) {
                console.warn("[NANOBANANA_REF] Falha ao re-processar Foto 2 com Jimp:", jimpError);
              }

              base64Image2 = imgBuffer.toString("base64");
              mimeType2 = mimeTypeDownloaded;
            }
          } catch (fetchErr) {
            console.error(
              "[NANOBANANA_REF] Falha ao baixar Foto 2 do Bria, usando original:",
              fetchErr
            );
          }
        }
      } else {
        // Se NÃO houver secondaryFile, a Foto 1 (file) é tratada como o produto no fluxo original
        // Então passamos ela pelo Bria se configurado
        transparentGarmentUrl = garmentPublicUrl;
        if (garmentPublicUrl) {
          try {
            console.log(`[NANOBANANA_REF] Removendo fundo da Foto única via Bria API...`);
            const briaResponse = await fetch(
              "https://queue.fal.run/fal-ai/bria/background/remove",
              {
                method: "POST",
                headers: {
                  Authorization: `Key ${rawFalKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  image_url: garmentPublicUrl,
                }),
              }
            );

            if (briaResponse.ok) {
              const briaData = await briaResponse.json();
              const briaUrl = briaData.image?.url || briaData.images?.[0]?.url;
              if (briaUrl) {
                transparentGarmentUrl = briaUrl;
                console.log(`[NANOBANANA_REF] Fundo removido via Bria: ${transparentGarmentUrl}`);
                logApiUsage({
                  userId,
                  type: "background_removal",
                  provider: "falai",
                  model: "bria",
                  costUsd: 0.006,
                });
              }
            }
          } catch (briaError) {
            console.error("[NANOBANANA_REF] Erro no Bria (modo único):", briaError);
          }
        }
      }

      // Preparar base64 da Foto 1
      let finalBase64Image1 = buffer1.toString("base64");
      let finalMimeType1 = mimeType1;

      if (transparentGarmentUrl && transparentGarmentUrl !== garmentPublicUrl) {
        try {
          console.log(
            `[NANOBANANA_REF] Baixando Foto 1 sem fundo de ${transparentGarmentUrl} para base64...`
          );
          const imgRes = await fetch(transparentGarmentUrl);
          if (imgRes.ok) {
            const imgArrayBuffer = await imgRes.arrayBuffer();
            let imgBuffer = Buffer.from(imgArrayBuffer);
            let mimeTypeDownloaded = imgRes.headers.get("content-type") || "image/png";

            // Otimizar e redimensionar PNG com fundo transparente
            try {
              const jimpImg = await Jimp.read(imgBuffer);
              if (jimpImg.width > 768 || jimpImg.height > 768) {
                jimpImg.resize({ w: 768, h: 768 });
              }
              imgBuffer = await jimpImg.getBuffer("image/png");
              mimeTypeDownloaded = "image/png";
            } catch (jimpError) {
              console.warn("[NANOBANANA_REF] Falha ao re-processar Foto 1 com Jimp:", jimpError);
            }

            finalBase64Image1 = imgBuffer.toString("base64");
            finalMimeType1 = mimeTypeDownloaded;
          }
        } catch (fetchErr) {
          console.error("[NANOBANANA_REF] Erro ao baixar Foto 1 sem fundo:", fetchErr);
        }
      }

      // 5. Configurar o prompt e a chamada ao Gemini (Nano Banana)
      const NANOBANANA_MODELS = [
        "gemini-3-pro-image",
        "gemini-3.1-flash-image",
        "gemini-3.5-flash-image",
      ];

      let nanobananaPrompt = "";
      let contentsParts: any[] = [];

      if (secondaryFile) {
        // Prompt Híbrido Avançado
        let priorityRule = "";
        if (hybridPriority === "scenario") {
          priorityRule = `1. FIDELIDADE DA PESSOA: Retrate a pessoa da Foto 1 de forma nítida e reconhecível (foco facial básico).
2. RECRIAÇÃO DE CORPO E ROUPAS: Vista a pessoa da Foto 1 com vestimentas elegantes e de alto nível apropriadas para o ambiente da Foto 2 (como blazer ou trajes corporativos refinados).
3. PRESERVAÇÃO RÍGIDA DO CENÁRIO (CRÍTICO): O cenário, a casa, o interior ou a arquitetura da Foto 2 são o assunto principal de fundo. Você deve reproduzir este cenário físico com máxima fidelidade.
4. POSICIONAMENTO LATERAL ASSIMÉTRICO (REGRA DOS TERÇOS): Posicione a pessoa da Foto 1 de forma deslocada para a lateral esquerda ou lateral direita da imagem (não centralizada). O centro do enquadramento deve permanecer totalmente livre e desimpedido para exibir a fachada da casa, a porta ou os detalhes estruturais da Foto 2.`;
        } else if (hybridPriority === "packshot") {
          priorityRule = `1. TROCA DE PRODUTO (PRODUCT SWAP): Identifique o produto central de primeiro plano na Foto 2 e substitua-o inteiramente pelo produto da Foto 1. Coloque o produto da Foto 1 na exata mesma posição, escala e ângulo do original.
2. FIDELIDADE DO PRODUTO: Preserve com máxima precisão o formato, cores, rótulos, logo, textos e marcas do produto da Foto 1. Ele deve continuar legível e idêntico à referência.
3. PRESERVAÇÃO RÍGIDA DO CENÁRIO DE FUNDO: O cenário de fundo, decorações, superfícies (como mesa, gelo, etc.) e o ambiente da Foto 2 devem ser recriados com máxima fidelidade. Não o substitua por um cenário genérico.
4. FUSÃO DE ILUMINAÇÃO E REFLEXOS: O novo produto deve absorver de forma realista a luz (direção, cor e brilho), reflexos de superfície e as sombras de contato que o produto original tinha na Foto 2.`;
        } else if (hybridPriority === "person") {
          priorityRule = `1. FIDELIDADE MÁXIMA DA PESSOA (FOCO PRINCIPAL): Retrate a pessoa da Foto 1 com altíssima fidelidade de detalhes faciais, fisionomia, expressão e pele. Ela é a heroína absoluta da foto.
2. RECRIAÇÃO DE CORPO E ROUPAS: Desenhe poses corporais naturais e roupas sofisticadas que combinem com a fisionomia e o tema.
3. ADAPTAÇÃO FLEXÍVEL DO CENÁRIO: O produto/cenário da Foto 2 serve apenas de contexto geral e ambientação de fundo. Você tem total liberdade criativa para simplificar, recortar ou desfocar (efeito bokeh) o fundo da Foto 2 para dar total destaque à pessoa.
4. FUSÃO DE ILUMINAÇÃO: Integre a pessoa e o cenário de fundo com uma iluminação artística e profissional direcionada ao sujeito principal.`;
        } else {
          priorityRule = `1. FIDELIDADE DA PESSOA: Retrate a pessoa da Foto 1 com máxima fidelidade fisionômica (rosto, barba/cabelo, cor dos olhos e pele). ela deve ser claramente identificável.
2. RECRIAÇÃO DE CORPO E ROUPAS: Estenda o corpo e desenhe poses naturais com vestimentas refinadas e de alta qualidade que harmonizem com o cenário.
3. INTEGRIDADE DO PRODUTO/PROJETO: Preserve o produto ou projeto da Foto 2 com suas características físicas, cores e proporções originais.
4. INTEGRAÇÃO TRIDIMENSIONAL: Posicione o produto/projeto e a pessoa na cena de forma integrada com iluminação, sombras e reflexos realistas. O cenário de fundo deve mesclá-los de forma natural.`;
        }

        const inputIsPackshot = hybridPriority === "packshot";
        nanobananaPrompt = `Você é um Diretor de Fotografia, Retratista Editorial e Ad Designer Sênior.
Com base nas duas imagens de referência fornecidas (${inputIsPackshot ? "Foto 1: Produto do Usuário; Foto 2: Cenário Comercial de Referência com outro produto" : "Foto 1: Selfie/Retrato da Pessoa; Foto 2: Produto/Projeto"}), gere uma imagem comercial profissional de altíssima qualidade integrando ambos na cena descrita no final.

DIRETRIZES DE CRIAÇÃO HÍBRIDA A SEREM SEGUIDAS RIGOROSAMENTE:
${priorityRule}

Cenário e estilo desejados: ${prompt}`;

        contentsParts = [
          { text: nanobananaPrompt },
          {
            inlineData: {
              mimeType: finalMimeType1,
              data: finalBase64Image1,
            },
          },
          {
            inlineData: {
              mimeType: mimeType2,
              data: base64Image2,
            },
          },
        ];
      } else {
        // Prompt Tradicional (Pessoa Única ou Produto Único)
        nanobananaPrompt = `Aqui está a foto de referência do produto (com fundo transparente/removido).
Gere uma imagem comercial realista, profissional e de altíssima qualidade posicionando este produto no cenário descrito a seguir.
ATENÇÃO REGRAS CRÍTICAS DE PRESERVAÇÃO DO PRODUTO:
1. Mantenha a integridade física, formato, marcas, rótulos, logo, textos e cores do produto EXACTAMENTE como estão na foto de referência.
2. Não altere, distorça ou modifique o produto. Ele deve parecer real, nítido e idêntico à referência.
3. Posicione o produto de forma tridimensional e integrada com as sombras e reflexos adequados no cenário.
4. O texto ou rótulo do produto deve continuar legível e idêntico ao original.

Cenário e estilo desejados: ${prompt}`;

        contentsParts = [
          { text: nanobananaPrompt },
          {
            inlineData: {
              mimeType: finalMimeType1,
              data: finalBase64Image1,
            },
          },
        ];
      }

      let imageBytes: string | null = null;
      let modelUsed = "";

      for (const model of NANOBANANA_MODELS) {
        let timeoutId: NodeJS.Timeout | null = null;
        try {
          console.log(`[NANOBANANA_REF] Tentando gerar com modelo ${model}...`);
          const nanobananaUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

          const controller = new AbortController();
          timeoutId = setTimeout(() => {
            console.warn(
              `[NANOBANANA_REF] Timeout de 75s atingido para o modelo ${model}. Abortando...`
            );
            controller.abort();
          }, 75000);

          const response = await fetch(nanobananaUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: contentsParts,
                },
              ],
            }),
            signal: controller.signal,
          });

          if (timeoutId) clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            const bytes = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (bytes) {
              imageBytes = bytes;
              modelUsed = model;
              console.log(`[NANOBANANA_REF] ✅ Sucesso total com o modelo ${model}!`);
              break;
            } else {
              console.warn(
                `[NANOBANANA_REF] Resposta ok do modelo ${model}, mas bytes de imagem ausentes:`,
                JSON.stringify(data).substring(0, 200)
              );
            }
          } else {
            const errText = await response.text().catch(() => `status ${response.status}`);
            console.warn(
              `[NANOBANANA_REF] Modelo ${model} retornou erro (${response.status}): ${errText.substring(0, 150)}`
            );
          }
        } catch (modelErr: any) {
          if (timeoutId) clearTimeout(timeoutId);
          console.warn(`[NANOBANANA_REF] Exceção na chamada do modelo ${model}:`, modelErr.message);
        }
      }

      if (!imageBytes) {
        return NextResponse.json(
          {
            error:
              "Todos os modelos do Google Gemini Image (Nano Banana) falharam para a geração por referência.",
          },
          { status: 500 }
        );
      }

      // 6. Gravar a imagem gerada no Firebase Storage
      const bucket = admin
        .storage()
        .bucket(
          `${process.env.FIREBASE_PROJECT_ID || "studio-7502195980-3983c"}.firebasestorage.app`
        );
      const generatedBuffer = Buffer.from(imageBytes, "base64");
      const fileRef = bucket.file(`users/${userId}/posts/${postId}/nanobanana_ref_generated.jpg`);
      const downloadToken = crypto.randomUUID();

      await fileRef.save(generatedBuffer, {
        metadata: {
          contentType: "image/jpeg",
          metadata: { firebaseStorageDownloadTokens: downloadToken },
        },
      });

      const firebaseDownloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileRef.name)}?alt=media&token=${downloadToken}`;
      console.log(
        `[NANOBANANA_REF] Imagem salva no Firebase Storage (${modelUsed}): ${firebaseDownloadUrl}`
      );

      // 7. Salvar e carregar referências secundárias se houver
      let firebaseSecondaryRefUrl = null;
      if (secondaryFile && secondaryGarmentPublicUrl) {
        try {
          const refRes2 = await fetch(secondaryGarmentPublicUrl);
          if (refRes2.ok) {
            const refBuffer2 = Buffer.from(await refRes2.arrayBuffer());
            const refFileRef2 = bucket.file(
              `users/${userId}/posts/${postId}/secondary_reference_image.jpg`
            );
            const refDownloadToken2 = crypto.randomUUID();

            await refFileRef2.save(refBuffer2, {
              metadata: {
                contentType: secondaryFile.type || "image/jpeg",
                metadata: { firebaseStorageDownloadTokens: refDownloadToken2 },
              },
            });
            firebaseSecondaryRefUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(refFileRef2.name)}?alt=media&token=${refDownloadToken2}`;
            console.log(
              `[NANOBANANA_REF] Foto de referência secundária salva no Storage via Admin: ${firebaseSecondaryRefUrl}`
            );
          }
        } catch (saveRefErr) {
          console.error(
            "[NANOBANANA_REF] Erro ao salvar referência secundária no Storage:",
            saveRefErr
          );
        }
      }

      // 8. Atualizar post no Firestore
      try {
        await adminDb
          .collection("users")
          .doc(userId)
          .collection("posts")
          .doc(postId)
          .set(
            {
              imageUrls: [firebaseDownloadUrl],
              referenceImageUrl: garmentPublicUrl || null,
              secondaryReferenceImageUrl: firebaseSecondaryRefUrl || null,
              nanobananaModelUsed: modelUsed,
              status: "completed",
            },
            { merge: true }
          );
      } catch (fsErr) {
        console.error("[NANOBANANA_REF] Erro ao atualizar Firestore:", fsErr);
      }

      try {
        const galleryRef = adminDb.collection("users").doc(userId).collection("mediaGallery");
        await galleryRef.doc(`${postId}_nanobanana_ref`).set({
          id: `${postId}_nanobanana_ref`,
          url: firebaseDownloadUrl,
          storagePath: fileRef.name,
          source: "nanobanana_ref",
          prompt,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          usedInPostId: null,
          fileName: "nanobanana_ref_generated.jpg",
          modelUsed,
          caption,
        });
        console.log(`[NANOBANANA_REF] Imagem gravada na galeria.`);

        // Registrar log de consumo do Nano Banana (Gemini 3 Pro Image)
        logApiUsage({
          userId,
          type: "image_generation",
          provider: "google_gemini",
          model: modelUsed || "imagen-3.0-generate-002",
          costUsd: 0.03,
        });
      } catch (galleryErr) {
        console.error("[NANOBANANA_REF] Erro ao salvar na galeria:", galleryErr);
      }

      // Retorna no formato compatível com o polling
      return NextResponse.json({
        success: true,
        status: "COMPLETED",
        imageUrl: firebaseDownloadUrl,
        modelUsed,
      });
    }

    if (action === "submit-dalle") {
      const openaiKey = process.env.OPENAI_API_KEY;
      if (!openaiKey) {
        return NextResponse.json(
          {
            error:
              "Chave de API da OpenAI ausente no servidor (OPENAI_API_KEY). Adicione no arquivo .env.local para testar o gpt-image-2.",
          },
          { status: 400 }
        );
      }

      const formData = await request.formData();
      const prompt = formData.get("prompt") as string;
      const postId = (formData.get("postId") as string) || "";
      const userId = (formData.get("userId") as string) || "";

      if (!prompt) {
        return NextResponse.json({ error: "Campo 'prompt' ausente." }, { status: 400 });
      }

      console.log(
        "[GERAR_REFERENCIA] Chamando OpenAI (gpt-image-1) para gerar imagem conceitual..."
      );
      try {
        const response = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openaiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-image-1",
            prompt: prompt,
            n: 1,
            size: "1024x1024",
            quality: "auto",
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error("[GERAR_REFERENCIA] Erro na API da OpenAI (gpt-image-2):", errText);
          throw new Error(`Erro na API da OpenAI (gpt-image-2): ${errText}`);
        }

        const resData = await response.json();
        const b64Data = resData.data?.[0]?.b64_json;
        const urlData = resData.data?.[0]?.url;

        if (!b64Data && !urlData) {
          throw new Error("Nenhum dado de imagem (url ou b64_json) retornado pela OpenAI.");
        }

        let dalleImageUrl = urlData || "";

        if (b64Data && postId && userId) {
          console.log(
            "[GERAR_REFERENCIA] Gravando imagem Base64 da OpenAI direto no Firebase Storage..."
          );
          try {
            const bucket = admin
              .storage()
              .bucket(
                admin.app().options.storageBucket || "studio-7502195980-3983c.firebasestorage.app"
              );
            const buffer = Buffer.from(b64Data, "base64");
            const fileRef = bucket.file(`users/${userId}/posts/${postId}/temp_dalle.jpg`);
            const downloadToken = crypto.randomUUID();

            await fileRef.save(buffer, {
              metadata: {
                contentType: "image/jpeg",
                metadata: {
                  firebaseStorageDownloadTokens: downloadToken,
                },
              },
            });

            dalleImageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileRef.name)}?alt=media&token=${downloadToken}`;
            console.log(
              `[GERAR_REFERENCIA] Imagem Base64 salva temporariamente no Firebase Storage: ${dalleImageUrl}`
            );
          } catch (fsErr) {
            console.error("[GERAR_REFERENCIA] Erro ao salvar Base64 no Firebase Storage:", fsErr);
            throw fsErr;
          }
        }

        console.log(`[GERAR_REFERENCIA] Imagem da OpenAI gerada com sucesso.`);

        const origin = request.nextUrl.origin;
        const fakeStatusUrl = `${origin}/api/conteudo/gerar-referencia?action=dalle-status&imageUrl=${encodeURIComponent(dalleImageUrl)}`;

        return NextResponse.json({
          success: true,
          requestId: "dalle-direct",
          statusUrl: fakeStatusUrl,
          responseUrl: fakeStatusUrl,
          garmentPublicUrl: dalleImageUrl,
        });
      } catch (dalleErr: any) {
        console.error("[GERAR_REFERENCIA] Falha na geração da OpenAI (gpt-image-2):", dalleErr);
        return NextResponse.json(
          { error: "Falha ao gerar imagem na OpenAI (gpt-image-2).", details: dalleErr.message },
          { status: 500 }
        );
      }
    }

    if (action === "upload-to-firebase") {
      const {
        postId,
        userId,
        finalImageUrl,
        referenceImageUrl,
        secondaryReferenceImageUrl,
        caption,
      } = await request.json();

      if (!postId || !userId || !finalImageUrl) {
        return NextResponse.json({ error: "Campos obrigatórios ausentes." }, { status: 400 });
      }

      console.log(
        `[GERAR_REFERENCIA] Iniciando upload no backend com Firebase Admin para o post ${postId}...`
      );

      let firebaseDownloadUrl = finalImageUrl;
      let firebaseRefUrl = null;
      let firebaseSecondaryRefUrl = null;

      try {
        const bucket = admin
          .storage()
          .bucket(
            admin.app().options.storageBucket || "studio-7502195980-3983c.firebasestorage.app"
          );

        // 1. Obtenção do buffer da imagem (ou decodificação direta de Base64, ou download via fetch se for URL HTTP)
        let buffer: Buffer;
        let contentType = "image/jpeg";

        if (finalImageUrl.startsWith("data:image/")) {
          console.log("[GERAR_REFERENCIA] Detectado formato Base64/Data URI na imagem final.");
          const match = finalImageUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (!match) {
            throw new Error("Formato Data URI inválido para decodificação.");
          }
          contentType = match[1];
          const base64Data = match[2];
          buffer = Buffer.from(base64Data, "base64");
        } else {
          console.log(
            `[GERAR_REFERENCIA] Fazendo download da imagem de URL externa: ${finalImageUrl}`
          );
          const imgRes = await fetch(finalImageUrl);
          if (!imgRes.ok) {
            throw new Error(
              `Falha ao baixar imagem gerada de URL externa (status ${imgRes.status})`
            );
          }
          const arrayBuffer = await imgRes.arrayBuffer();
          buffer = Buffer.from(arrayBuffer);
          contentType = imgRes.headers.get("Content-Type") || "image/jpeg";
        }

        const finalBuffer = buffer;

        const fileRef = bucket.file(`users/${userId}/posts/${postId}/generated_image.jpg`);
        const downloadToken = crypto.randomUUID();

        // Salvar o buffer no Storage com permissão total via Admin e registrar o download token
        await fileRef.save(finalBuffer, {
          metadata: {
            contentType: contentType,
            metadata: {
              firebaseStorageDownloadTokens: downloadToken,
            },
          },
        });

        // Gerar URL de download compatível com a biblioteca cliente
        firebaseDownloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileRef.name)}?alt=media&token=${downloadToken}`;
        console.log(
          `[GERAR_REFERENCIA] Imagem gerada salva no Firebase Storage via Admin: ${firebaseDownloadUrl}`
        );

        // 2. Download e upload da foto de referência original (se existir)
        if (referenceImageUrl) {
          const refRes = await fetch(referenceImageUrl);
          if (refRes.ok) {
            const arrayBuffer = await refRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const contentType = refRes.headers.get("Content-Type") || "image/jpeg";

            const refFileRef = bucket.file(`users/${userId}/posts/${postId}/reference_image.jpg`);
            const refDownloadToken = crypto.randomUUID();

            await refFileRef.save(buffer, {
              metadata: {
                contentType: contentType,
                metadata: {
                  firebaseStorageDownloadTokens: refDownloadToken,
                },
              },
            });

            firebaseRefUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(refFileRef.name)}?alt=media&token=${refDownloadToken}`;
            console.log(
              `[GERAR_REFERENCIA] Imagem de referência salva no Firebase Storage via Admin: ${firebaseRefUrl}`
            );
          }
        }

        // Download e upload da foto de referência secundária (se existir)
        if (secondaryReferenceImageUrl) {
          const refRes2 = await fetch(secondaryReferenceImageUrl);
          if (refRes2.ok) {
            const arrayBuffer2 = await refRes2.arrayBuffer();
            const buffer2 = Buffer.from(arrayBuffer2);
            const contentType2 = refRes2.headers.get("Content-Type") || "image/jpeg";

            const refFileRef2 = bucket.file(
              `users/${userId}/posts/${postId}/secondary_reference_image.jpg`
            );
            const refDownloadToken2 = crypto.randomUUID();

            await refFileRef2.save(buffer2, {
              metadata: {
                contentType: contentType2,
                metadata: {
                  firebaseStorageDownloadTokens: refDownloadToken2,
                },
              },
            });

            firebaseSecondaryRefUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(refFileRef2.name)}?alt=media&token=${refDownloadToken2}`;
            console.log(
              `[GERAR_REFERENCIA] Imagem de referência secundária salva no Firebase Storage via Admin: ${firebaseSecondaryRefUrl}`
            );
          }
        }
      } catch (uploadError: any) {
        console.error(
          "[GERAR_REFERENCIA] Erro no upload para o Firebase Storage no backend via Admin:",
          uploadError
        );
      }

      // 3. Atualizar Firestore de forma resiliente no backend usando Admin SDK (set com merge)
      try {
        const postDocRef = adminDb.collection("users").doc(userId).collection("posts").doc(postId);
        await postDocRef.set(
          {
            imageUrls: [firebaseDownloadUrl],
            referenceImageUrl: firebaseRefUrl || null,
            secondaryReferenceImageUrl: firebaseSecondaryRefUrl || null,
            status: "completed",
            tempDalleB64: admin.firestore.FieldValue.delete(),
          },
          { merge: true }
        );
        console.log(
          `[GERAR_REFERENCIA] Firestore atualizado com sucesso via Admin para o post ${postId}!`
        );

        try {
          const galleryRef = adminDb.collection("users").doc(userId).collection("mediaGallery");
          const galleryMediaId = `${postId}_ref_generated`;

          await galleryRef.doc(galleryMediaId).set({
            id: galleryMediaId,
            url: firebaseDownloadUrl,
            storagePath: `users/${userId}/posts/${postId}/generated_image.jpg`,
            source: "reference_generation",
            prompt: "Imagem gerada a partir de foto do produto via IA.",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            usedInPostId: null,
            fileName: "generated_image.jpg",
            caption: caption || null,
          });
          console.log(
            `[GERAR_REFERENCIA] Imagem catalogada com sucesso na subcoleção mediaGallery: ${galleryMediaId}`
          );

          logApiUsage({
            userId,
            type: "image_generation",
            provider: "falai",
            model: "flux-pro/kontext",
            costUsd: 0.05,
          });
        } catch (galleryError) {
          console.error(
            "[GERAR_REFERENCIA_ERROR] Falha ao catalogar imagem gerada na galeria:",
            galleryError
          );
        }
      } catch (fsError: any) {
        console.error(
          "[GERAR_REFERENCIA] Erro ao gravar dados no Firestore via Admin no backend:",
          fsError
        );
      }

      return NextResponse.json({
        success: true,
        imageUrl: firebaseDownloadUrl,
        referenceImageUrl: firebaseRefUrl,
        secondaryReferenceImageUrl: firebaseSecondaryRefUrl,
      });
    }

    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch (error: any) {
    console.error("[GERAR_REFERENCIA_ACTION_ERROR] Erro:", error);
    return NextResponse.json(
      {
        error: "Erro interno no servidor ao processar ação de referência.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "proxy") {
      const url = searchParams.get("url");
      if (!url) {
        return NextResponse.json({ error: "URL ausente." }, { status: 400 });
      }

      console.log(`[GERAR_REFERENCIA] Fazendo proxy da imagem: ${url}`);
      const imgRes = await fetch(url);
      if (!imgRes.ok) {
        return NextResponse.json(
          { error: `Falha ao baixar imagem no proxy (status ${imgRes.status})` },
          { status: 500 }
        );
      }

      const blob = await imgRes.blob();
      const headers = new Headers();
      headers.set("Content-Type", imgRes.headers.get("Content-Type") || "image/jpeg");
      headers.set("Access-Control-Allow-Origin", "*");

      return new NextResponse(blob, {
        status: 200,
        headers,
      });
    }

    const falKey = process.env.FAL_KEY || process.env.FAL_API_KEY;
    if (!falKey) {
      return NextResponse.json({ error: "FAL_KEY ausente." }, { status: 500 });
    }

    const rawFalKey = falKey.trim().startsWith("Key ")
      ? falKey.trim().replace(/^Key\s+/i, "")
      : falKey.trim();

    const statusUrl = searchParams.get("statusUrl");
    const responseUrl = searchParams.get("responseUrl");

    if (action === "check-status") {
      if (!statusUrl || !responseUrl) {
        return NextResponse.json({ error: "statusUrl ou responseUrl ausentes." }, { status: 400 });
      }

      if (statusUrl.includes("action=dalle-status") || statusUrl.includes("dalle")) {
        const parsedUrl = new URL(statusUrl);
        const imageUrl = parsedUrl.searchParams.get("imageUrl");
        console.log(
          `[GERAR_REFERENCIA] Interceptando status da OpenAI síncrono. Retornando COMPLETED para: ${imageUrl}`
        );
        return NextResponse.json({
          success: true,
          status: "COMPLETED",
          imageUrl: imageUrl,
        });
      }

      console.log(`[GERAR_REFERENCIA] Consultando status via statusUrl dinâmico: ${statusUrl}`);
      const checkResponse = await fetch(statusUrl, {
        method: "GET",
        headers: {
          Authorization: `Key ${rawFalKey}`,
        },
      });

      if (!checkResponse.ok) {
        const errorText = await checkResponse.text();
        console.error(
          `[GERAR_REFERENCIA] Falha ao consultar status na Fal.ai (Status ${checkResponse.status}):`,
          errorText
        );
        throw new Error(
          `Falha ao consultar status na Fal.ai (Status ${checkResponse.status}): ${errorText}`
        );
      }

      const checkData = await checkResponse.json();
      console.log(
        "[GERAR_REFERENCIA] Dados obtidos no status de requests:",
        JSON.stringify(checkData)
      );

      let imageUrl = null;
      let finalStatus = checkData.status;

      const postId = searchParams.get("postId") || "";
      const userId = searchParams.get("userId") || "";

      if (checkData.status === "COMPLETED") {
        console.log(
          `[GERAR_REFERENCIA] Status COMPLETED! Buscando resultado real no responseUrl: ${responseUrl}`
        );

        const resultResponse = await fetch(responseUrl, {
          method: "GET",
          headers: {
            Authorization: `Key ${rawFalKey}`,
          },
        });

        if (resultResponse.ok) {
          const resultData = await resultResponse.json();
          console.log(
            "[GERAR_REFERENCIA] Dados de resultado recebidos da Fal:",
            JSON.stringify(resultData)
          );

          imageUrl =
            resultData?.images?.[0]?.url ||
            resultData?.image?.url ||
            resultData?.output?.images?.[0]?.url ||
            resultData?.output?.image?.url;
        } else {
          console.error(
            "[GERAR_REFERENCIA] Falha ao ler responseUrl secundário:",
            await resultResponse.text()
          );
        }
      }

      return NextResponse.json({
        success: true,
        status: finalStatus,
        imageUrl: imageUrl,
        error: checkData.error,
      });
    }

    return NextResponse.json({ error: "Ação GET inválida." }, { status: 400 });
  } catch (error: any) {
    console.error("[GERAR_REFERENCIA_GET_ERROR] Erro:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
