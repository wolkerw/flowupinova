import { NextResponse, type NextRequest } from "next/server";
import { fal } from "@fal-ai/client";
import { Jimp, loadFont } from "jimp";
import { SANS_32_WHITE, SANS_64_WHITE } from "jimp/fonts";
import { admin, adminDb } from "@/lib/firebase-admin";
import crypto from "crypto";

export const maxDuration = 300;


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
      const description = formData.get("description") as string || "";
      const businessName = formData.get("business_name") as string || "";
      const businessCategory = formData.get("business_category") as string || "";
      const businessDescription = formData.get("business_description") as string || "";

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
          console.log("[GERAR_REFERENCIA] Usando Claude 3.5 Sonnet Vision (v2) para analisar inspiração...");
          let response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "x-api-key": anthropicApiKey,
              "anthropic-version": "2023-06-01",
              "content-type": "application/json"
            },
            body: JSON.stringify({
              model: "claude-3-5-sonnet-20241022",
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
                        data: base64Image
                      }
                    },
                    {
                      type: "text",
                      text: geminiPrompt
                    }
                  ]
                }
              ]
            })
          });

          // Se der erro de modelo não encontrado, tentar Sonnet v1 (20240620)
          if (!response.ok) {
            const errText = await response.text();
            console.warn("[GERAR_REFERENCIA] Falha com Claude Sonnet v2 (Ideas), tentando v1:", errText);
            
            response = await fetch("https://api.anthropic.com/v1/messages", {
              method: "POST",
              headers: {
                "x-api-key": anthropicApiKey,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
              },
              body: JSON.stringify({
                model: "claude-3-5-sonnet-20240620",
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
                          data: base64Image
                        }
                      },
                      {
                        type: "text",
                        text: geminiPrompt
                      }
                    ]
                  }
                ]
              })
            });
          }

          if (!response.ok) {
            const errText = await response.text();
            console.error("[GERAR_REFERENCIA] Erro no Claude Vision v1/v2 (Ideas):", errText);
            throw new Error(`Falha no Claude Vision ao gerar ideias: ${errText}`);
          }

          const resData = await response.json();
          const rawText = resData.content?.[0]?.text;
          parsed = JSON.parse(rawText.trim());
        } catch (claudeError) {
          console.error("[GERAR_REFERENCIA] Falha no Claude Vision (Ideas), acionando fallback para Gemini:", claudeError);
        }
      }

      if (!parsed) {
        try {
          console.log("[GERAR_REFERENCIA] Usando Gemini 2.5 Pro de fallback para gerar ideias textuais...");
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
                        data: base64Image
                      }
                    }
                  ]
                }
              ],
              generationConfig: { responseMimeType: "application/json" }
            })
          });

          if (!geminiResponse.ok) {
            throw new Error(await geminiResponse.text());
          }

          const resData = await geminiResponse.json();
          const rawJson = resData.candidates?.[0]?.content?.parts?.[0]?.text;
          parsed = JSON.parse(rawJson);
        } catch (proError) {
          console.warn("[GERAR_REFERENCIA] Falha no Gemini 2.5 Pro (Ideas), tentando Gemini 2.5 Flash:", proError);
          
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
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
                        data: base64Image
                      }
                    }
                  ]
                }
              ],
              generationConfig: { responseMimeType: "application/json" }
            })
          });

          if (!geminiResponse.ok) {
            const errText = await geminiResponse.text();
            console.error("[MIGRATED_REF_IDEAS] Falha no Gemini Flash:", errText);
            throw new Error(`Falha ao gerar ideias no Gemini: ${errText}`);
          }

          const resData = await geminiResponse.json();
          const rawJson = resData.candidates?.[0]?.content?.parts?.[0]?.text;
          parsed = JSON.parse(rawJson);
        }
      }

      return NextResponse.json(parsed);
    }

    if (action === "analyze") {
      const formData = await request.formData();
      const file = formData.get("file") as File;

      if (!file) {
        return NextResponse.json({ error: "Arquivo de imagem não fornecido." }, { status: 400 });
      }

      // Convert image to Buffer
      const arrayBuffer = await file.arrayBuffer();
      let buffer = Buffer.from(arrayBuffer);
      const mimeType = file.type || "image/jpeg";

      // Crop image to 1:1 if needed
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

      const base64Image = buffer.toString("base64");

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

If the image contains CLOTHING / APPAREL (Flat lay, hanger, or worn):
  item_type: (e.g., matching two-piece set, linen trousers, summer dress)
  color_scheme:
    - hex: (Hex code of fabric color)
      name: (Color name, e.g., pastel off-white, ocean blue)
  fabric_texture: (Describe the material and weave: textured linen, soft ribbed cotton, silk satin, thick denim)
  design_patterns: (Describe prints, patterns, stripes, buttons, stitching, or pocket details)
  cut_and_fit: (Describe the fit: oversized, cropped, slim fit, high-waisted, flowy)
  visual_description: (A detailed sentence summarizing the garment's appearance, shape, and physical design details)

If the image depicts a CHARACTER:
  character_name: (Name if known)
  color_scheme:
    - hex: (Hex code of prominent outfit/feature color)
      name: (Color name)
  outfit_style: (Detailed description of clothing style, accessories, or notable features)
  visual_description: (A full sentence summarizing face, hair, expression, and overall styling)`;

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
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
                    data: base64Image
                  }
                }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const resData = await response.json();
      const yamlAnalysis = resData.candidates?.[0]?.content?.parts?.[0]?.text;

      return NextResponse.json({ success: true, yamlAnalysis });
    }

    if (action === "generate-prompt") {
      let yamlAnalysis = "";
      let description = "";
      let businessProfile: any = null;
      let inspirationFile: File | null = null;
      let isRetailStyle = false;

      const contentType = request.headers.get("content-type") || "";
      if (contentType.includes("multipart/form-data")) {
        const formData = await request.formData();
        yamlAnalysis = formData.get("yamlAnalysis") as string || "";
        description = formData.get("description") as string || "";
        isRetailStyle = formData.get("isRetailStyle") === "true";
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
        isRetailStyle = body.isRetailStyle === true || body.isRetailStyle === "true";
        businessProfile = body.businessProfile || null;
      }

      if (!yamlAnalysis || !description) {
        return NextResponse.json({ error: "Campos 'yamlAnalysis' ou 'description' ausentes." }, { status: 400 });
      }

      let brandingInstruction = "";
      if (businessProfile) {
        const { name, category, primaryColor, secondaryColor } = businessProfile;
        brandingInstruction = `
6. BRANDING AND VISUAL PALETTE (CRITICAL BRAND MATCHING): The advertising scene surrounding the subject MUST organically represent the brand colors of "${name || "the brand"}" (Primary: ${primaryColor || "#000000"} and Secondary: ${secondaryColor || "#FFFFFF"}).
   - Carefully blend these colors in the surrounding environment. For instance: add colored studio gel lighting highlights, gentle glowing neon tubes in the background, bokeh ambient colors, or aesthetic secondary props (a vase, furniture accent, background canvas texture, or studio accessories) reflecting this color palette.
   - The main reference product/garment itself must remain physically unaffected, retaining its original colors as detailed in the reference YAML description. Only customize the surrounding visual elements of the photo.
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
              data: base64Image
            }
          };

          inspirationInstruction = `
7. LAYOUT & COMPOSITION & ESTHETIC REPLICA FROM INSPIRATION (MANDATORY DECONSTRUCTION):
   You have been provided with an inspiration/reference image (the print of a post). You MUST analyze it with high-precision computer vision depth and aesthetic decoding:
   - DECONSTRUCT MODEL POSE & BODY LANGUAGE: Look at the human model (if any) in the reference print. Describe their exact pose, body posture, arm placement, hands position, face lean, head tilt, and how they interact with the product. E.g., if a hand holds the product from below, say "...the model casually holding the product in their right palm, fingers gently wrapped around the bottom...". Imitate this exact posture and physical interaction.
   - REPLICATE CAMERA ANGLE & FRAMING: Identify the camera focal lens style and framing (e.g., tight close-up, eye-level medium shot, low-angle flat-lay, high-angle portrait) and copy it exactly in your prompt.
   - COPY LIGHTING & ATMOSPHERE: Analyze the light source direction, light quality (e.g., hard high-contrast sunlight, ultra-soft cinematic window glow, directional rim lighting, studio gel colors) and translate it precisely.
   - DECONSTRUCT SCENARIO & PALETTE: Extract the precise colors of the environment (e.g., warm cream walls, sage green accessories, dark slate gray stone background), textures (wood grain, polished marble, concrete, linen folds), and copy them exactly to make the visual vibe indistinguishable from the reference post.
   - DECONSTRUCT GRAPHIC LAYOUT & BADGES: Observe if the reference post features geometric colored overlays, floating product stands, colored banner stripes, or discount badges. Request a highly clean, professional equivalent visual composition (e.g., "...with a clean, minimalist circular overlay badge containing the bold modern text 'PROMO'...") matching the placement from the reference.
   - FORCE FIDELITY: Your output prompt must explicitly detail these visual features as the foundational pillars of the generation, ensuring the resulting image is an extremely accurate aesthetic and compositional sibling of the reference print.
`;
        } catch (e) {
          console.warn("[GERAR_REFERENCIA] Falha ao processar arquivo de inspiração para prompt:", e);
        }
      }

      let retailStyleInstruction = "";
      if (isRetailStyle) {
        retailStyleInstruction = `
8. HIGH-IMPACT RETAIL ADVERTISING STYLE (CRITICAL RETAIL RULES):
   Since High-Impact Retail Mode is active, you MUST structure the generated image prompt with these exact, detailed sections, written in English. Ensure any literal text strings are written in Brazilian Portuguese and MUST strictly retain their correct orthographical accents and diacritics (ALL CAPS, e.g. "PROMOÇÃO", "POR APENAS R$ 199,90", "EXCLUSÍVO", "APROVEITE"):
   - [SCENARIO & ACTION DYNAMICS]: Describe the product ("the product in the input image") in a highly dynamic, action-oriented real-world context matching the product type (e.g., if a bicycle, speeding on a trail; if sports gear, in an athletic arena; if cosmetics, floating with splash and particles). Specifically request dramatic motion effects like dust splatters, flying dirt particles, water splashes, mud spray, or light streaks around the product to simulate high energy and movement.
   - [GRAPHIC DESIGN LAYOUT - MANDATORY]: Describe the following visual layouts and elements to be rendered natively on the image itself:
     1. MAIN HEADLINE: At the top or middle of the image, specify a bold, slanted/tilted commercial title/slogan based on the user's text or ideas (e.g., "BIKE DE ALTA PERFORMANCE" or "EXCLUSÍVO"). It MUST be described as "written in bold, tilted brushstroke typography over a dark brushstroke background for high contrast".
     2. PRICE TAG / OFFER BADGE: In the lower quadrant (left or right), describe a dynamic, eye-catching badge or grunge-style label using high-contrast colors (e.g., black, neon-yellow, bright orange) containing the literal text of the promotional price/offer (e.g., "POR APENAS R$ 199,90" or "OFERTA ESPECIAL" derived from the user's input).
     3. TECHNICAL/COMMERCIAL BENEFIT BADGES: On one side of the image (right or left), describe a vertical column of three or four sleek dark circular badges. Inside each badge, a simple minimalist white icon is displayed, with adjacent small white text displaying the key technical or commercial features of the product (e.g., "21 MARCHAS", "SUSPENSÃO", "FREIO A DISCO"). Derivate these features logically from the user's description or YAML analysis, and ensure they are written in proper uppercase Brazilian Portuguese with all correct accents (e.g., "SUSPENSÃO", "PROMOÇÃO", "EXCLUSÍVO").
     4. COGNITIVE SIMPLICITY: The text must be simple, readable, and bold, seamlessly integrated with the product's colors and the branding palette.
`;
      }

      const geminiSystemInstruction = `# ROLE
You are an elite Creative Art Director, Ad Designer, and Prompt Engineer specialized in User-Generated Content (UGC) advertising and premium photographic product placement for image generation models (specifically Flux Kontext).

# GOAL
Given a reference image description (extracted features in YAML), the user's creative advertising ideas, and optionally an inspiration image (the print), you MUST write TWO separate descriptive prompts in English:
1. "imagePrompt" (specifically for the "flux-pro/kontext" model): This prompt MUST describe a realistic photorealistic scene, detailing the product, ambient scenery, professional lighting, camera lens and realism textures, but it MUST contain ABSOLUTELY NO text, slogans, prices, or graphical UI elements written on the canvas.
2. "ideogramPrompt" (specifically for the "ideogram-v4/remix" model): This prompt will be used to Remix the realistic image. It MUST describe the final e-commerce design poster, overlaying clean professional typography, titles/slogans in proper accented Portuguese, price tags, call-to-action buttons, and technical benefit badges in the style of Brazilian commercial ads.
${isRetailStyle ? `
# HIGH-IMPACT RETAIL MODE
This generation requires a High-Impact Retail Advertising Style. You must strictly incorporate the RETAIL MODE instructions detailed below.` : ""}

# CRITICAL RULES
1. OUTPUT LANGUAGE: You must write the final image prompt completely IN ENGLISH. Generating prompts in English dramatically increases the quality, pose accuracy, and realism of the model.
2. TEXT PRESERVATION & ACCENTS MANDATORY (CRITICAL FOR PORTUGUESE): If there is any literal text in Portuguese to be rendered on the image (e.g. brand names, stickers, discount badges, slogans), you MUST strictly write them with proper Portuguese accents and special diacritic symbols (like 'Ã', 'Ç', 'Õ', 'É', 'Ó', 'Í').
   - Use correct Portuguese spelling and diacritics (e.g. use "PROMOÇÃO" instead of "PROMOCAO", "VERÃO" instead of "VERAO", "EXCLUSÍVO" instead of "EXCLUSIVO").
   - Under no circumstances should you strip accents or simplify characters in literal text strings, as correct Portuguese orthography is mandatory.
3. GRAPHIC BADGES & DESIGN OVERLAYS: You MUST explicitly describe and request clean, professional graphic design badges, stickers, and promotional discount circles (e.g., a circle badge saying "LIQUIDAÇÃO 35%") if they are present in the inspiration/reference print layout or requested by the user. Ensure text inside these badges is simple, bold, and enclosed in escaped double quotes (e.g., "...featuring a clean fuchsia pink circular sticker overlay with the text \\"PROMOÇÃO DE VERÃO\\" in bold modern sans-serif typography...").
4. NO DUPLICATE PRODUCTS (ULTRA-CRITICAL): Since we are using "flux-pro/kontext" (an image conditioning model), you MUST refer to the user's product in the input image as "the product" or "the product in the input image" instead of describing a new, generic product from scratch. 
   - Never write phrases that cause the generator to draw two separate products (e.g. "a model holding a laptop while another laptop is on the table"). 
   - Always integrate "the product in the input image" seamlessly into the pose, scene, and hands of the model (if there is a model).
5. ABSOLUTELY NO CROPPED HEADS OR HAIR (ULTRA-CRITICAL): If the image features a person or model (holding a product, wearing clothing, or posing), you MUST ABSOLUTELY prevent the top of their head, forehead, or hair from being cut off by the border of the canvas.
   - You MUST explicitly inject multiple strict spatial instructions into the generated prompt.
   - You MUST include a phrase like: "framed in a balanced medium shot showing the model from the chest up, with a generous amount of empty space (clear headroom) above their head. The model's entire head, full hair, and face are completely visible and fully contained within the frame, with no cutoff or clipping by the borders of the image."
   - Avoid tight face close-ups, macro portraits, or extreme crops that focus excessively on the face/garment and leave no headroom. Always choose a spacious medium shot or a wide-angle composition.
6. FORMAT: Always end the prompt with the instruction: "square format, optimized for Instagram feed".
7. IDEOGRAM REMIX IMAGE PRESERVATION (ULTRA-CRITICAL): In the "ideogramPrompt", you MUST start the prompt with the exact literal string: "This is a remix of the reference image. You MUST keep the main subject, the model, their face, hair, body posture, and the exact clothing/product in the reference image completely unchanged and identical. Only overlay the graphic design, typography, text, and labels." This is mandatory to prevent the remix model from changing the model or the product.
${brandingInstruction}
${inspirationInstruction}
${retailStyleInstruction}
# UGC PHOTOGRAPHY & ESTHETIC PREMIUM
- Always describe a high-end commercial advertising photograph or a clean premium lifestyle portrait (e.g., "high-end studio product placement", "premium commercial food photography", "luxury editorial portrait").
- Mandatorily detail advanced studio lighting setups to create stunning visual separation (e.g., "cinematic volumetric lighting", "soft diffuse professional studio gel lighting", "gentle side-lighting casting warm soft diagonal shadows", "rim lighting highlighting the contours of the subject").
- Define professional camera specifications to preserve palpable textures and extreme optical sharpness (e.g., "shot on high-end camera, 50mm or 85mm lens, pin-sharp focus on the main subject, shallow depth of field, clean circular bokeh circles in the background").
- Strictly avoid banned artificial buzzwords (e.g., do NOT use "photorealistic", "ultrarealistic", "4k", "8k", "hyper-detailed", or "masterpiece").
- Emphasize natural tangible textures to force model realism: "subtle high-end film grain, realistic skin textures showing fine pores, natural fabric folds, soft textile imperfections, and realistic glass reflections".

# APPAREL & CLOTHING SPECIAL INSTRUCTIONS
If the reference product is clothing/apparel, describe a real human model wearing the garment naturally:
- Specify how the fabric falls, its physical texture (e.g., "textured heavy linen", "soft ribbed premium cotton", "glossy silk satin"), and visual details like wooden buttons, delicate stitching, prints, or specific cuts.
- Describe the model interacting naturally and elegantly with the environment (e.g., "standing relaxed", "leaning casually on a sleek studio counter").
- Ensure the model's environment strictly represents the user's requested scenario (e.g., "inside a high-end beige studio backdrop with soft warm spotlights").
- EXPLICITLY state: "The model's entire head, full hair, and face are completely visible and beautifully framed with generous headroom at the top, strictly preventing any part of the head, forehead, or hair from being clipped or cut off by the borders".

# OUTPUT FORMAT (Strict JSON)
You must return exclusively a valid JSON object with the following two keys. Do not include any explanations, introductory or concluding text:
{
  "imagePrompt": "The highly detailed descriptive prompt in English for the Flux Kontext model. It must be completely photographic, natural, and focus on the product and scene realism with absolutely no texts, logos, or overlay graphics.",
  "ideogramPrompt": "The descriptive prompt in English for the Ideogram v4 remix model. It must describe the graphic design overlay, typography placement, Brazilian retail text phrases in Brazilian Portuguese (properly accented), prices, and technical badges matching the brand kit."
}
`;

      const geminiUserMessage = `Sua tarefa: criar um prompt de imagem para post no instagram conforme orientado pelas diretrizes do sistema.
Certifique-se de que a imagem de referência do produto seja representada com a maior precisão possível nas imagens geradas, especialmente em relação a todos os textos e detalhes físicos.
Além disso, se houver uma imagem de inspiração/print fornecida, garanta que a composição, pose do modelo, layout de enquadramento de câmera e estilo visual sejam fielmente imitados e replicados.

Descrição desejada de cenário/modelo pelo usuário: "${description}"

Descrição física da imagem de referência do produto (YAML):
${yamlAnalysis}`;

      const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
      let parsedPrompt = null;

      if (anthropicApiKey) {
        try {
          console.log("[GERAR_REFERENCIA] Usando Claude 3.5 Sonnet Vision (v2) para gerar o prompt de imagem...");
          
          const claudeContent: any[] = [];
          if (base64Image) {
            claudeContent.push({
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType,
                data: base64Image
              }
            });
            claudeContent.push({
              type: "text",
              text: "Esta é a imagem de inspiração/print de layout a ser replicada."
            });
          }
          
          claudeContent.push({
            type: "text",
            text: geminiUserMessage
          });

          let response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "x-api-key": anthropicApiKey,
              "anthropic-version": "2023-06-01",
              "content-type": "application/json"
            },
            body: JSON.stringify({
              model: "claude-3-5-sonnet-20241022",
              max_tokens: 2000,
              system: geminiSystemInstruction,
              messages: [
                {
                  role: "user",
                  content: claudeContent
                }
              ]
            })
          });

          // Se der erro de modelo não encontrado, tentar Sonnet v1 (20240620)
          if (!response.ok) {
            const errText = await response.text();
            console.warn("[GERAR_REFERENCIA] Falha com Claude Sonnet v2 (Prompt), tentando v1:", errText);

            response = await fetch("https://api.anthropic.com/v1/messages", {
              method: "POST",
              headers: {
                "x-api-key": anthropicApiKey,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
              },
              body: JSON.stringify({
                model: "claude-3-5-sonnet-20240620",
                max_tokens: 2000,
                system: geminiSystemInstruction,
                messages: [
                  {
                    role: "user",
                    content: claudeContent
                  }
                ]
              })
            });
          }

          if (!response.ok) {
            const errText = await response.text();
            console.error("[GERAR_REFERENCIA] Erro no Claude Vision v1/v2 (Prompt):", errText);
            throw new Error(`Falha no Claude Vision ao gerar prompt: ${errText}`);
          }

          const resData = await response.json();
          const rawText = resData.content?.[0]?.text;
          parsedPrompt = JSON.parse(rawText.trim());
        } catch (claudeError) {
          console.error("[GERAR_REFERENCIA] Falha catastrófica no Claude Vision (Prompt), acionando fallback para Gemini:", claudeError);
        }
      }

      if (!parsedPrompt) {
        try {
          console.log("[GERAR_REFERENCIA] Usando Gemini 2.5 Pro de fallback para gerar prompt...");
          const geminiProUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`;
          
          const contentsParts: any[] = [];
          if (inlineDataPart) {
            contentsParts.push({ text: "Esta é a imagem de inspiração/print de layout a ser replicada:" });
            contentsParts.push(inlineDataPart);
          }
          contentsParts.push({ text: geminiUserMessage });

          const response = await fetch(geminiProUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: geminiSystemInstruction }]
              },
              contents: [{ parts: contentsParts }],
              generationConfig: { responseMimeType: "application/json" }
            })
          });

          if (!response.ok) {
            throw new Error(await response.text());
          }

          const resData = await response.json();
          const rawJson = resData.candidates?.[0]?.content?.parts?.[0]?.text;
          parsedPrompt = JSON.parse(rawJson);
        } catch (proError) {
          console.warn("[GERAR_REFERENCIA] Falha no Gemini 2.5 Pro (Prompt), tentando Gemini 2.5 Flash:", proError);
          
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
          
          const contentsParts: any[] = [];
          if (inlineDataPart) {
            contentsParts.push({ text: "Esta é a imagem de inspiração/print de layout a ser replicada:" });
            contentsParts.push(inlineDataPart);
          }
          contentsParts.push({ text: geminiUserMessage });

          const response = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: geminiSystemInstruction }]
              },
              contents: [{ parts: contentsParts }],
              generationConfig: { responseMimeType: "application/json" }
            })
          });

          if (!response.ok) {
            throw new Error(await response.text());
          }

          const resData = await response.json();
          const rawJson = resData.candidates?.[0]?.content?.parts?.[0]?.text;
          parsedPrompt = JSON.parse(rawJson);
        }
      }

      return NextResponse.json({ success: true, imagePrompt: parsedPrompt.imagePrompt, ideogramPrompt: parsedPrompt.ideogramPrompt || "" });
    }

    if (action === "submit-kontext") {
      const formData = await request.formData();
      const file = formData.get("file") as File;
      const prompt = formData.get("prompt") as string;
      const ideogramPrompt = formData.get("ideogramPrompt") as string || "";
      const postId = formData.get("postId") as string || "";
      const userId = formData.get("userId") as string || "";

      if (!file || !prompt) {
        return NextResponse.json({ error: "Campos 'file' ou 'prompt' ausentes." }, { status: 400 });
      }

      if (postId && userId && ideogramPrompt) {
        try {
          const postDocRef = adminDb.collection("users").doc(userId).collection("posts").doc(postId);
          await postDocRef.set({
            ideogramPrompt: ideogramPrompt,
            isGeneratingIdeogram: false
          }, { merge: true });
          console.log(`[GERAR_REFERENCIA] ideogramPrompt gravado com sucesso no Firestore para o post ${postId}`);
        } catch (fsErr) {
          console.error("[GERAR_REFERENCIA] Erro ao gravar ideogramPrompt no Firestore:", fsErr);
        }
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
      const finalFile = new File([new Blob([buffer], { type: mimeType })], file.name, { type: mimeType });
      const garmentPublicUrl = await fal.storage.upload(finalFile);

      // --- REMOÇÃO DE FUNDO AUTOMÁTICA VIA BRIA API ---
      let transparentProductUrl = garmentPublicUrl;
      try {
        console.log(`[GERAR_REFERENCIA] Removendo fundo do produto de forma síncrona via Bria API: ${garmentPublicUrl}`);
        const briaResponse = await fetch("https://queue.fal.run/fal-ai/bria/background/remove", {
          method: "POST",
          headers: {
            "Authorization": `Key ${rawFalKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            image_url: garmentPublicUrl
          })
        });

        if (briaResponse.ok) {
          const briaData = await briaResponse.json();
          const briaUrl = briaData.image?.url || briaData.images?.[0]?.url;
          if (briaUrl) {
            transparentProductUrl = briaUrl;
            console.log(`[GERAR_REFERENCIA] Fundo do produto removido com sucesso: ${transparentProductUrl}`);
          }
        } else {
          console.warn("[GERAR_REFERENCIA] Falha na API do Bria, prosseguindo com imagem original:", await briaResponse.text());
        }
      } catch (briaError) {
        console.error("[GERAR_REFERENCIA] Erro catastrófico ao remover fundo do produto (Bria), usando original:", briaError);
      }

      // Submit to queue
      const queueResponse = await fetch("https://queue.fal.run/fal-ai/flux-pro/kontext", {
        method: "POST",
        headers: {
          "Authorization": `Key ${rawFalKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: prompt,
          image_url: transparentProductUrl,
          aspect_ratio: "1:1"
        })
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
        garmentPublicUrl: garmentPublicUrl // Retornando a URL da foto de referência original
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
      const postId = formData.get("postId") as string || "";
      const userId = formData.get("userId") as string || "";

      if (!prompt || !postId || !userId) {
        return NextResponse.json({ error: "Campos obrigatórios ausentes: prompt, postId, userId." }, { status: 400 });
      }

      console.log(`[IMAGEN4_REF] Iniciando geração via Imagen 4 (modo benchmark) para o post ${postId}...`);

      // Cadeia de modelos: Fast primeiro (Ultra tendo 503), depois Ultra quando voltar
      const IMAGEN_MODELS = [
        "imagen-4.0-fast-generate-001",
        "imagen-4.0-ultra-generate-001",
      ];

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
          const errText = await imagenResponse.text().catch(() => `status ${imagenResponse.status}`);
          console.warn(`[IMAGEN4_REF] Modelo ${model} falhou (${imagenResponse.status}): ${errText.substring(0, 150)}`);
        } catch (modelErr: any) {
          console.warn(`[IMAGEN4_REF] Exceção no modelo ${model}:`, modelErr.message);
        }
      }

      if (!imageBytes) {
        return NextResponse.json({ error: "Todos os modelos do Google Imagen falharam para a geração de referência." }, { status: 500 });
      }

      // Salvar no Firebase Storage
      const bucket = admin.storage().bucket(`${process.env.FIREBASE_PROJECT_ID || "studio-7502195980-3983c"}.firebasestorage.app`);
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
      console.log(`[IMAGEN4_REF] Imagem salva no Firebase Storage (${modelUsed}): ${firebaseDownloadUrl}`);

      // Atualizar post no Firestore
      try {
        await adminDb.collection("users").doc(userId).collection("posts").doc(postId).set({
          imageUrls: [firebaseDownloadUrl],
          imagenModelUsed: modelUsed,
          status: "completed",
        }, { merge: true });
      } catch (fsErr) {
        console.error("[IMAGEN4_REF] Erro ao atualizar Firestore:", fsErr);
      }

      // Salvar na mediaGallery
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

    // 🍌 NANO BANANA REF: Geração por Referência de Imagem via Gemini/Nano Banana (síncrono, sem polling)
    if (action === "submit-nanobanana-ref") {
      const formData = await request.formData();
      const file = formData.get("file") as File;
      const prompt = formData.get("prompt") as string;
      const postId = formData.get("postId") as string || "";
      const userId = formData.get("userId") as string || "";

      if (!file || !prompt || !postId || !userId) {
        return NextResponse.json({ error: "Campos obrigatórios ausentes: file, prompt, postId, userId." }, { status: 400 });
      }

      console.log(`[NANOBANANA_REF] Iniciando processamento da foto do produto para o post ${postId}...`);

      // 1. Recorte 1:1 proporcional usando Jimp
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
        console.warn("[NANOBANANA_REF] Falha no crop:", e);
      }

      // 2. Upload temporário para a CDN do Fal.ai
      let garmentPublicUrl = "";
      try {
        const finalFile = new File([new Blob([buffer], { type: mimeType })], file.name, { type: mimeType });
        garmentPublicUrl = await fal.storage.upload(finalFile);
        console.log(`[NANOBANANA_REF] Imagem enviada para CDN do Fal.ai: ${garmentPublicUrl}`);
      } catch (uploadErr) {
        console.error("[NANOBANANA_REF] Erro no upload para o Fal.ai Storage:", uploadErr);
      }

      // 3. Remoção de fundo via Bria API
      let transparentProductUrl = garmentPublicUrl;
      if (garmentPublicUrl) {
        try {
          console.log(`[NANOBANANA_REF] Removendo fundo do produto de forma síncrona via Bria API...`);
          const briaResponse = await fetch("https://queue.fal.run/fal-ai/bria/background/remove", {
            method: "POST",
            headers: {
              "Authorization": `Key ${rawFalKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              image_url: garmentPublicUrl
            })
          });

          if (briaResponse.ok) {
            const briaData = await briaResponse.json();
            const briaUrl = briaData.image?.url || briaData.images?.[0]?.url;
            if (briaUrl) {
              transparentProductUrl = briaUrl;
              console.log(`[NANOBANANA_REF] Fundo do produto removido com sucesso via Bria: ${transparentProductUrl}`);
            }
          } else {
            console.warn("[NANOBANANA_REF] Falha na API do Bria, prosseguindo com imagem original:", await briaResponse.text());
          }
        } catch (briaError) {
          console.error("[NANOBANANA_REF] Erro ao remover fundo via Bria, usando original:", briaError);
        }
      }

      // 4. Download da imagem com fundo removido e conversão para Base64
      let finalBase64Image = buffer.toString("base64");
      let finalMimeType = mimeType;

      if (transparentProductUrl && transparentProductUrl !== garmentPublicUrl) {
        try {
          console.log(`[NANOBANANA_REF] Baixando imagem sem fundo de ${transparentProductUrl} para converter para Base64...`);
          const imgRes = await fetch(transparentProductUrl);
          if (imgRes.ok) {
            const imgArrayBuffer = await imgRes.arrayBuffer();
            const imgBuffer = Buffer.from(imgArrayBuffer);
            finalBase64Image = imgBuffer.toString("base64");
            finalMimeType = imgRes.headers.get("content-type") || "image/png";
          } else {
            console.warn(`[NANOBANANA_REF] Erro no download da imagem sem fundo (${imgRes.status}), usando original croppada.`);
          }
        } catch (fetchErr) {
          console.error("[NANOBANANA_REF] Falha ao baixar imagem do Bria, usando original croppada:", fetchErr);
        }
      }

      // 5. Chamada síncrona ao Gemini Image (Nano Banana Pro/2)
      const NANOBANANA_MODELS = [
        "gemini-3-pro-image",
        "gemini-3.1-flash-image",
        "gemini-2.5-flash-image"
      ];

      // Formatar o prompt para garantir a fidelidade do produto inserido
      const nanobananaPrompt = `Aqui está a foto de referência do produto (com fundo transparente/removido).
Gere uma imagem comercial realista, profissional e de altíssima qualidade posicionando este produto no cenário descrito a seguir.
ATENÇÃO REGRAS CRÍTICAS DE PRESERVAÇÃO DO PRODUTO:
1. Mantenha a integridade física, formato, marcas, rótulos, logo, textos e cores do produto EXACTAMENTE como estão na foto de referência.
2. Não altere, distorça ou modifique o produto. Ele deve parecer real, nítido e idêntico à referência.
3. Posicione o produto de forma tridimensional e integrada com as sombras e reflexos adequados no cenário.
4. O texto ou rótulo do produto deve continuar legível e idêntico ao original.

Cenário e estilo desejados: ${prompt}`;

      let imageBytes: string | null = null;
      let modelUsed = "";

      for (const model of NANOBANANA_MODELS) {
        try {
          console.log(`[NANOBANANA_REF] Tentando gerar com modelo ${model}...`);
          const nanobananaUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          
          const response = await fetch(nanobananaUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: nanobananaPrompt },
                  {
                    inlineData: {
                      mimeType: finalMimeType,
                      data: finalBase64Image
                    }
                  }
                ]
              }]
            })
          });

          if (response.ok) {
            const data = await response.json();
            const bytes = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (bytes) {
              imageBytes = bytes;
              modelUsed = model;
              console.log(`[NANOBANANA_REF] ✅ Sucesso total com o modelo ${model}!`);
              break;
            } else {
              console.warn(`[NANOBANANA_REF] Resposta ok do modelo ${model}, mas bytes de imagem ausentes:`, JSON.stringify(data).substring(0, 200));
            }
          } else {
            const errText = await response.text().catch(() => `status ${response.status}`);
            console.warn(`[NANOBANANA_REF] Modelo ${model} retornou erro (${response.status}): ${errText.substring(0, 150)}`);
          }
        } catch (modelErr: any) {
          console.warn(`[NANOBANANA_REF] Exceção na chamada do modelo ${model}:`, modelErr.message);
        }
      }

      if (!imageBytes) {
        return NextResponse.json({ error: "Todos os modelos do Google Gemini Image (Nano Banana) falharam para a geração por referência." }, { status: 500 });
      }

      // 6. Gravar a imagem gerada no Firebase Storage
      const bucket = admin.storage().bucket(`${process.env.FIREBASE_PROJECT_ID || "studio-7502195980-3983c"}.firebasestorage.app`);
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
      console.log(`[NANOBANANA_REF] Imagem salva no Firebase Storage (${modelUsed}): ${firebaseDownloadUrl}`);

      // 7. Atualizar post no Firestore
      try {
        await adminDb.collection("users").doc(userId).collection("posts").doc(postId).set({
          imageUrls: [firebaseDownloadUrl],
          referenceImageUrl: garmentPublicUrl || null,
          nanobananaModelUsed: modelUsed,
          status: "completed",
        }, { merge: true });
      } catch (fsErr) {
        console.error("[NANOBANANA_REF] Erro ao atualizar Firestore:", fsErr);
      }

      // 8. Salvar na mediaGallery
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
        });
        console.log(`[NANOBANANA_REF] Imagem gravada na galeria.`);
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
          { error: "Chave de API da OpenAI ausente no servidor (OPENAI_API_KEY). Adicione no arquivo .env.local para testar o gpt-image-2." },
          { status: 400 }
        );
      }

      const formData = await request.formData();
      const prompt = formData.get("prompt") as string;
      const postId = formData.get("postId") as string || "";
      const userId = formData.get("userId") as string || "";

      if (!prompt) {
        return NextResponse.json({ error: "Campo 'prompt' ausente." }, { status: 400 });
      }

      console.log("[GERAR_REFERENCIA] Chamando OpenAI (gpt-image-1) para gerar imagem conceitual...");
      try {
        const response = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openaiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "gpt-image-1",
            prompt: prompt,
            n: 1,
            size: "1024x1024",
            quality: "auto"
          })
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
          console.log("[GERAR_REFERENCIA] Gravando imagem Base64 da OpenAI direto no Firebase Storage...");
          try {
            const bucket = admin.storage().bucket(admin.app().options.storageBucket || "studio-7502195980-3983c.firebasestorage.app");
            const buffer = Buffer.from(b64Data, "base64");
            const fileRef = bucket.file(`users/${userId}/posts/${postId}/temp_dalle.jpg`);
            const downloadToken = crypto.randomUUID();

            await fileRef.save(buffer, {
              metadata: {
                contentType: "image/jpeg",
                metadata: {
                  firebaseStorageDownloadTokens: downloadToken
                }
              }
            });

            dalleImageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileRef.name)}?alt=media&token=${downloadToken}`;
            console.log(`[GERAR_REFERENCIA] Imagem Base64 salva temporariamente no Firebase Storage: ${dalleImageUrl}`);
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
          garmentPublicUrl: dalleImageUrl
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
      const { postId, userId, finalImageUrl, referenceImageUrl } = await request.json();

      if (!postId || !userId || !finalImageUrl) {
        return NextResponse.json({ error: "Campos obrigatórios ausentes." }, { status: 400 });
      }

      console.log(`[GERAR_REFERENCIA] Iniciando upload no backend com Firebase Admin para o post ${postId}...`);
      
      let firebaseDownloadUrl = finalImageUrl;
      let firebaseRefUrl = null;

      try {
        const bucket = admin.storage().bucket(admin.app().options.storageBucket || "studio-7502195980-3983c.firebasestorage.app");

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
          console.log(`[GERAR_REFERENCIA] Fazendo download da imagem de URL externa: ${finalImageUrl}`);
          const imgRes = await fetch(finalImageUrl);
          if (!imgRes.ok) {
            throw new Error(`Falha ao baixar imagem gerada de URL externa (status ${imgRes.status})`);
          }
          const arrayBuffer = await imgRes.arrayBuffer();
          buffer = Buffer.from(arrayBuffer);
          contentType = imgRes.headers.get("Content-Type") || "image/jpeg";
        }

        let finalBuffer = buffer;
          try {
            console.log("[GERAR_REFERENCIA] Iniciando fusão gráfica programática Jimp na imagem gerada...");
            const jImage = await Jimp.read(buffer);

            // Carregar Brand Kit e Promo do Firestore
            let brandColor = "#ff0055"; // Fuchsia Pink padrão
            let promoText = "";
            let isRetailStyle = false;

            try {
              const postSnap = await adminDb.collection("users").doc(userId).collection("posts").doc(postId).get();
              if (postSnap.exists) {
                const postData = postSnap.data();
                if (postData?.promoText) {
                  promoText = postData.promoText.toUpperCase();
                }
                isRetailStyle = !!postData?.isRetailStyle;
              }

              const onboardingSnap = await adminDb.collection("users").doc(userId).collection("business").doc("onboarding").get();
              if (onboardingSnap.exists) {
                const obData = onboardingSnap.data();
                if (obData?.primaryColor) {
                  brandColor = obData.primaryColor;
                }
              }
            } catch (fsErr) {
              console.warn("[GERAR_REFERENCIA] Erro ao buscar Brand Kit, usando valores padrão:", fsErr);
            }

            console.log(`[GERAR_REFERENCIA] Brand Kit carregado. Cor: ${brandColor}, Promo: ${promoText}`);

            // Funções auxiliares portáteis para desenho de pixels
            const rgbaToInt = (r: number, g: number, b: number, a: number = 255) => {
              return ((r & 0xFF) << 24) | ((g & 0xFF) << 16) | ((b & 0xFF) << 8) | (a & 0xFF);
            };

            const hexToRgbaInt = (hexStr: string, alpha: number = 255) => {
              const cleaned = hexStr.replace("#", "");
              const r = parseInt(cleaned.substring(0, 2), 16);
              const g = parseInt(cleaned.substring(2, 4), 16);
              const b = parseInt(cleaned.substring(4, 6), 16);
              return rgbaToInt(r, g, b, alpha);
            };

            const drawSolidCircle = (image: any, cx: number, cy: number, r: number, colorHex: number) => {
              const r2 = r * r;
              for (let x = cx - r; x <= cx + r; x++) {
                for (let y = cy - r; y <= cy + r; y++) {
                  const dx = x - cx;
                  const dy = y - cy;
                  if (dx * dx + dy * dy <= r2) {
                    if (x >= 0 && x < image.width && y >= 0 && y < image.height) {
                      image.setPixelColor(colorHex, x, y);
                    }
                  }
                }
              }
            };

            const drawSolidRect = (image: any, x1: number, y1: number, w: number, h: number, colorHex: number) => {
              for (let x = x1; x < x1 + w; x++) {
                for (let y = y1; y < y1 + h; y++) {
                  if (x >= 0 && x < image.width && y >= 0 && y < image.height) {
                    image.setPixelColor(colorHex, x, y);
                  }
                }
              }
            };

            const stripAccents = (str: string) => {
              return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/Ç/g, "C");
            };

            const getCenterX = (text: string, fontSize: 32 | 64) => {
              const charWidth = fontSize === 64 ? 28 : 14;
              const textWidth = text.length * charWidth;
              return Math.max(60, 240 - textWidth / 2);
            };

            const primaryColorInt = hexToRgbaInt(brandColor);

            // 1. Desenhar Círculo de Desconto no canto superior esquerdo se houver promoText e não for estilo de varejo (IA já desenha organicamente)
            if (promoText && !isRetailStyle) {
              console.log("[GERAR_REFERENCIA] Desenhando círculo promocional com Jimp...");
              drawSolidCircle(jImage, 240, 240, 180, primaryColorInt);

              // Parser de texto inteligente para circular promo
              let line1 = "PROMOCAO DE";
              let line2 = "50% OFF";
              let line3 = "APROVEITE";

              const percentMatch = promoText.match(/(\d+%\s*(OFF|DESCONTO|DE DESCONTO)?)/i);
              if (percentMatch) {
                line2 = percentMatch[1].toUpperCase();
                const cleanText = promoText.replace(percentMatch[0], "").trim();
                if (cleanText) {
                  const words = cleanText.split(" ");
                  if (words.length >= 2) {
                    line1 = words.slice(0, Math.ceil(words.length / 2)).join(" ").toUpperCase();
                    line3 = words.slice(Math.ceil(words.length / 2)).join(" ").toUpperCase();
                  } else {
                    line1 = cleanText.substring(0, 12).toUpperCase();
                    line3 = "APROVEITE";
                  }
                }
              } else {
                const words = promoText.split(" ");
                if (words.length >= 3) {
                  line1 = words.slice(0, 1).join(" ").toUpperCase();
                  line2 = words.slice(1, 3).join(" ").toUpperCase();
                  line3 = words.slice(3).join(" ").toUpperCase() || "HOJE";
                } else if (words.length === 2) {
                  line1 = "OFERTA";
                  line2 = words[0].toUpperCase();
                  line3 = words[1].toUpperCase();
                } else {
                  line1 = "OFERTA";
                  line2 = promoText.toUpperCase() || "ESPECIAL";
                  line3 = "EXCLUSIVA";
                }
              }

              const cleanLine1 = stripAccents(line1);
              const cleanLine2 = stripAccents(line2);
              const cleanLine3 = stripAccents(line3);

              const font32 = await loadFont(SANS_32_WHITE);
              const font64 = await loadFont(SANS_64_WHITE);

              // Escrever textos centralizados no círculo com matemática portátil
              const x1 = getCenterX(cleanLine1, 32);
              const x2 = getCenterX(cleanLine2, 64);
              const x3 = getCenterX(cleanLine3, 32);

              jImage.print({
                font: font32,
                x: x1,
                y: 110,
                text: cleanLine1
              });

              jImage.print({
                font: font64,
                x: x2,
                y: 180,
                text: cleanLine2
              });

              jImage.print({
                font: font32,
                x: x3,
                y: 280,
                text: cleanLine3
              });
            }

            finalBuffer = await jImage.getBuffer("image/jpeg");
            console.log("[GERAR_REFERENCIA] Fusão gráfica programática Jimp concluída com sucesso!");
          } catch (jimpErr) {
            console.error("[GERAR_REFERENCIA] Falha na mesclagem gráfica do Jimp, usando imagem original da Fal:", jimpErr);
          }

          const fileRef = bucket.file(`users/${userId}/posts/${postId}/generated_image.jpg`);
          const downloadToken = crypto.randomUUID();

          // Salvar o buffer no Storage com permissão total via Admin e registrar o download token
          await fileRef.save(finalBuffer, {
            metadata: {
              contentType: contentType,
              metadata: {
                firebaseStorageDownloadTokens: downloadToken
              }
            }
          });

          // Gerar URL de download compatível com a biblioteca cliente
          firebaseDownloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileRef.name)}?alt=media&token=${downloadToken}`;
          console.log(`[GERAR_REFERENCIA] Imagem gerada salva no Firebase Storage via Admin: ${firebaseDownloadUrl}`);

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
                  firebaseStorageDownloadTokens: refDownloadToken
                }
              }
            });

            firebaseRefUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(refFileRef.name)}?alt=media&token=${refDownloadToken}`;
            console.log(`[GERAR_REFERENCIA] Imagem de referência salva no Firebase Storage via Admin: ${firebaseRefUrl}`);
          }
        }
      } catch (uploadError: any) {
        console.error("[GERAR_REFERENCIA] Erro no upload para o Firebase Storage no backend via Admin:", uploadError);
        // Não quebra o fluxo, retorna com a URL original como fallback
      }

      // 3. Atualizar Firestore de forma resiliente no backend usando Admin SDK (set com merge)
      try {
        const postDocRef = adminDb.collection("users").doc(userId).collection("posts").doc(postId);
        await postDocRef.set({
          imageUrls: [firebaseDownloadUrl],
          referenceImageUrl: firebaseRefUrl || null,
          status: "completed",
          tempDalleB64: admin.firestore.FieldValue.delete()
        }, { merge: true });
        console.log(`[GERAR_REFERENCIA] Firestore atualizado com sucesso via Admin para o post ${postId}! E o Base64 temporário foi excluído.`);

        // 4. Cadastrar automaticamente o registro da imagem gerada na subcoleção mediaGallery do Firestore do lojista
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
            usedInPostId: null, // Disponível — ainda não publicada nas redes sociais
            fileName: "generated_image.jpg"
          });
          console.log(`[GERAR_REFERENCIA] Imagem catalogada com sucesso na subcoleção mediaGallery: ${galleryMediaId}`);
        } catch (galleryError) {
          console.error("[GERAR_REFERENCIA_ERROR] Falha ao catalogar imagem gerada na galeria:", galleryError);
        }
      } catch (fsError: any) {
        console.error("[GERAR_REFERENCIA] Erro ao gravar dados no Firestore via Admin no backend:", fsError);
      }

      return NextResponse.json({
        success: true,
        imageUrl: firebaseDownloadUrl,
        referenceImageUrl: firebaseRefUrl
      });
    }

    if (action === "submit-ideogram-remix") {
      try {
        const { postId, userId, fluxImageUrl, textPrompt } = await request.json();

        if (!postId || !userId || !fluxImageUrl || !textPrompt) {
          return NextResponse.json({ error: "Campos obrigatórios ausentes para o Remix." }, { status: 400 });
        }

        console.log(`[GERAR_REFERENCIA] Iniciando Remix do Ideogram sob demanda para o post ${postId}...`);

        const ideogramApiKey = process.env.IDEOGRAM_API_KEY;
        if (!ideogramApiKey) {
          throw new Error("IDEOGRAM_API_KEY ausente no servidor.");
        }

        // 1. Carregar dados do post no Firestore para ver aspect ratio e outras infos
        const postSnap = await adminDb.collection("users").doc(userId).collection("posts").doc(postId).get();
        if (!postSnap.exists) {
          throw new Error("Post não encontrado no Firestore.");
        }
        const postData = postSnap.data();

        // 2. Baixar imagem do Flux
        console.log(`[GERAR_REFERENCIA] Baixando imagem do Flux: ${fluxImageUrl}`);
        const imgRes = await fetch(fluxImageUrl);
        if (!imgRes.ok) {
          throw new Error(`Falha ao baixar imagem do Flux (status ${imgRes.status})`);
        }
        const arrayBuffer = await imgRes.arrayBuffer();
        const blob = new Blob([arrayBuffer]);

        // 3. Mapear aspect_ratio
        let aspect = "1x1";
        if (postData?.platform === "story" || postData?.isStories || postData?.aspectRatio?.includes("9")) {
          aspect = "9x16";
        }

        console.log(`[GERAR_REFERENCIA] Enviando Remix para Ideogram v4 Turbo com aspect ratio ${aspect}...`);
        const formData = new FormData();
        formData.append("image", blob, "flux-image.jpg");
        formData.append("text_prompt", textPrompt);
        formData.append("aspect_ratio", aspect);
        formData.append("model", "V_4");
        formData.append("rendering_speed", "TURBO");
        formData.append("image_weight", "60");

        const ideoRes = await fetch("https://api.ideogram.ai/v1/ideogram-v4/remix", {
          method: "POST",
          headers: {
            "Api-Key": ideogramApiKey
          },
          body: formData
        });

        if (!ideoRes.ok) {
          const errText = await ideoRes.text();
          throw new Error(`Erro na API do Ideogram: ${errText}`);
        }

        const ideoData = await ideoRes.json();
        const finalUrl = ideoData.data?.[0]?.url;

        if (!finalUrl) {
          throw new Error("API do Ideogram não retornou nenhuma imagem.");
        }

        console.log(`[GERAR_REFERENCIA] Ideogram Remix concluído com sucesso. Salvando no Firebase Storage para durabilidade...`);

        let firebaseDownloadUrl = finalUrl;
        try {
          const bucket = admin.storage().bucket(admin.app().options.storageBucket || "studio-7502195980-3983c.firebasestorage.app");
          const ideoImgRes = await fetch(finalUrl);
          if (ideoImgRes.ok) {
            const ideoArrayBuffer = await ideoImgRes.arrayBuffer();
            const ideoBuffer = Buffer.from(ideoArrayBuffer);
            const contentType = ideoImgRes.headers.get("Content-Type") || "image/jpeg";

            const fileRef = bucket.file(`users/${userId}/posts/${postId}/retail_promotional_image.jpg`);
            const downloadToken = crypto.randomUUID();

            await fileRef.save(ideoBuffer, {
              metadata: {
                contentType: contentType,
                metadata: {
                  firebaseStorageDownloadTokens: downloadToken
                }
              }
            });

            firebaseDownloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileRef.name)}?alt=media&token=${downloadToken}`;
            console.log(`[GERAR_REFERENCIA] Imagem do Ideogram salva no Firebase Storage: ${firebaseDownloadUrl}`);
          }
        } catch (storageErr) {
          console.error("[GERAR_REFERENCIA] Falha ao fazer upload da imagem do Ideogram no Storage:", storageErr);
        }

        // 4. Salvar ideogramImageUrl no Firestore do post e atualizar status
        await adminDb.collection("users").doc(userId).collection("posts").doc(postId).set({
          ideogramImageUrl: firebaseDownloadUrl,
          retailTitle: textPrompt
        }, { merge: true });

        // Também catalogar na galeria de mídias!
        try {
          const galleryRef = adminDb.collection("users").doc(userId).collection("mediaGallery");
          const galleryMediaId = `${postId}_retail_remix`;
          
          await galleryRef.doc(galleryMediaId).set({
            id: galleryMediaId,
            url: firebaseDownloadUrl,
            storagePath: `users/${userId}/posts/${postId}/retail_promotional_image.jpg`,
            source: "ideogram_retail_remix",
            prompt: textPrompt,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            usedInPostId: null, // Disponível — ainda não publicada nas redes sociais
            fileName: "retail_promotional_image.jpg"
          });
          console.log(`[GERAR_REFERENCIA] Imagem do Ideogram catalogada na mediaGallery: ${galleryMediaId}`);
        } catch (galleryError) {
          console.error("[GERAR_REFERENCIA_ERROR] Falha ao catalogar imagem do Ideogram na galeria:", galleryError);
        }

        return NextResponse.json({
          success: true,
          imageUrl: firebaseDownloadUrl
        });
      } catch (err: any) {
        console.error("[GERAR_REFERENCIA] Erro no submit-ideogram-remix:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
      }
    }

    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });

  } catch (error: any) {
    console.error("[GERAR_REFERENCIA_ACTION_ERROR] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao processar ação de referência.", details: error.message },
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
        return NextResponse.json({ error: `Falha ao baixar imagem no proxy (status ${imgRes.status})` }, { status: 500 });
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
        console.log(`[GERAR_REFERENCIA] Interceptando status da OpenAI síncrono. Retornando COMPLETED para: ${imageUrl}`);
        return NextResponse.json({
          success: true,
          status: "COMPLETED",
          imageUrl: imageUrl
        });
      }

      console.log(`[GERAR_REFERENCIA] Consultando status via statusUrl dinâmico: ${statusUrl}`);
      const checkResponse = await fetch(statusUrl, {
        method: "GET",
        headers: {
          "Authorization": `Key ${rawFalKey}`
        }
      });

      if (!checkResponse.ok) {
        const errorText = await checkResponse.text();
        console.error(`[GERAR_REFERENCIA] Falha ao consultar status na Fal.ai (Status ${checkResponse.status}):`, errorText);
        throw new Error(`Falha ao consultar status na Fal.ai (Status ${checkResponse.status}): ${errorText}`);
      }

      const checkData = await checkResponse.json();
      console.log("[GERAR_REFERENCIA] Dados obtidos no status de requests:", JSON.stringify(checkData));

      let imageUrl = null;
      let finalStatus = checkData.status;

      const postId = searchParams.get("postId") || "";
      const userId = searchParams.get("userId") || "";

      if (checkData.status === "COMPLETED") {
        console.log(`[GERAR_REFERENCIA] Status COMPLETED! Buscando resultado real no responseUrl: ${responseUrl}`);
        
        const resultResponse = await fetch(responseUrl, {
          method: "GET",
          headers: {
            "Authorization": `Key ${rawFalKey}`
          }
        });

        if (resultResponse.ok) {
          const resultData = await resultResponse.json();
          console.log("[GERAR_REFERENCIA] Dados de resultado recebidos da Fal:", JSON.stringify(resultData));
          
          imageUrl = 
            resultData?.images?.[0]?.url || 
            resultData?.image?.url || 
            resultData?.output?.images?.[0]?.url || 
            resultData?.output?.image?.url;
        } else {
          console.error("[GERAR_REFERENCIA] Falha ao ler responseUrl secundário:", await resultResponse.text());
        }
      }

      return NextResponse.json({
        success: true,
        status: finalStatus,
        imageUrl: imageUrl,
        error: checkData.error
      });
    }

    return NextResponse.json({ error: "Ação GET inválida." }, { status: 400 });
  } catch (error: any) {
    console.error("[GERAR_REFERENCIA_GET_ERROR] Erro:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
