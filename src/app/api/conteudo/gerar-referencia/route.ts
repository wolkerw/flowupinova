import { NextResponse, type NextRequest } from "next/server";
import { fal } from "@fal-ai/client";
import { Jimp } from "jimp";

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
      const { yamlAnalysis, description } = await request.json();

      if (!yamlAnalysis || !description) {
        return NextResponse.json({ error: "Campos 'yamlAnalysis' ou 'description' ausentes." }, { status: 400 });
      }

      const geminiSystemInstruction = `# ROLE
You are an elite Creative Art Director and Prompt Engineer specialized in User-Generated Content (UGC) advertising and high-fidelity product placement for image generation models (specifically Flux Kontext).

# GOAL
Given a reference image description (extracted features in YAML) and the user's creative advertising ideas, write a short, highly natural, and descriptive image prompt IN ENGLISH optimized for the "flux-pro/kontext" model.

# CRITICAL RULES
1. OUTPUT LANGUAGE: You must write the final image prompt completely IN ENGLISH. Generating prompts in English dramatically increases the quality, pose accuracy, and realism of the model.
2. TEXT PRESERVATION: If there is any literal text to be rendered (e.g., brand names, shirt prints), specify it inside escaped double quotes exactly as it appears in the reference description. 
   - Example: "...wearing a shirt with the literal text \\"NOME DA MARCA\\" printed in clean typography..."
3. DO NOT HALLUCINATE: Never invent certifications, stamps, or long subtitles to be rendered on the product. Prohibit rendering long subtitles inside the physical image.
4. FORMAT: Always end the prompt with the instruction: "square format, optimized for Instagram feed".

# UGC REALISM & CAMERAS (Include at least 2-3 in the prompt)
- Camera styles: "spontaneous smartphone photo", "casual UGC candid shot", "slightly off-center composition".
- Lighting: "natural indoor morning light", "ambient daylight mixed with soft neon", "soft natural shadows".
- Texture: "raw unpolished look", "subtle film grain", "realistic skin textures", "natural imperfections".
- Strict ban: Never use artificial terms like "cinematic lighting", "photorealistic", "4k", "8k", or "masterpiece".

# APPAREL & CLOTHING SPECIAL INSTRUCTIONS
If the reference image is clothing/apparel, describe a real human model wearing the garment naturally:
- Specify how the fabric falls, its texture (e.g., "textured linen", "soft cotton"), and details like buttons, prints, or specific cuts.
- Describe the model interacting naturally with the environment (e.g., "walking casually", "sitting relaxed").
- Ensure the model matches the user's requested scenario (e.g., "on a sunny beach during golden hour").

# OUTPUT FORMAT (Strict JSON)
You must return exclusively a valid JSON object with the following single key. Do not include any explanations, introductory or concluding text:
{
  "imagePrompt": "A highly detailed descriptive prompt in English covering subject, action, mood, environment, camera, colors, and textile/textual accuracy, ending with the square format instruction."
}`;

      const geminiUserMessage = `Sua tarefa: criar um prompt de imagem para post no instagram conforme orientado pelas diretrizes do sistema.
Certifique-se de que a imagem de referência seja representada com a maior precisão possível nas imagens geradas, especialmente em relação a todos os textos e detalhes físicos.

Descrição desejada de cenário/modelo pelo usuário: "${description}"

Descrição física da imagem de referência (YAML):
${yamlAnalysis}`;

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const response = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: geminiSystemInstruction }]
          },
          contents: [{ parts: [{ text: geminiUserMessage }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const resData = await response.json();
      const rawJson = resData.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = JSON.parse(rawJson);

      return NextResponse.json({ success: true, imagePrompt: parsed.imagePrompt });
    }

    if (action === "submit-kontext") {
      const formData = await request.formData();
      const file = formData.get("file") as File;
      const prompt = formData.get("prompt") as string;

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
      const finalFile = new File([new Blob([buffer], { type: mimeType })], file.name, { type: mimeType });
      const garmentPublicUrl = await fal.storage.upload(finalFile);

      // Submit to queue
      const queueResponse = await fetch("https://queue.fal.run/fal-ai/flux-pro/kontext", {
        method: "POST",
        headers: {
          "Authorization": `Key ${rawFalKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: prompt,
          image_url: garmentPublicUrl,
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
        responseUrl: queueData.response_url
      });
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
    const falKey = process.env.FAL_KEY || process.env.FAL_API_KEY;
    if (!falKey) {
      return NextResponse.json({ error: "FAL_KEY ausente." }, { status: 500 });
    }

    const rawFalKey = falKey.trim().startsWith("Key ") 
      ? falKey.trim().replace(/^Key\s+/i, "") 
      : falKey.trim();

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const statusUrl = searchParams.get("statusUrl");
    const responseUrl = searchParams.get("responseUrl");

    if (action === "check-status") {
      if (!statusUrl || !responseUrl) {
        return NextResponse.json({ error: "statusUrl ou responseUrl ausentes." }, { status: 400 });
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
        status: checkData.status,
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
