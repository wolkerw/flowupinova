import { NextResponse, type NextRequest } from "next/server";
import { fal } from "@fal-ai/client";
import { Jimp } from "jimp";
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

      const geminiPrompt = `Você é um especialista em Copywriting Sênior, Marketing e Diretor de Arte de redes sociais.
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
        console.error("[MIGRATED_REF_IDEAS] Falha no Gemini:", errText);
        throw new Error(`Falha ao gerar ideias no Gemini: ${errText}`);
      }

      const resData = await geminiResponse.json();
      const rawJson = resData.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = JSON.parse(rawJson);

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

      const contentType = request.headers.get("content-type") || "";
      if (contentType.includes("multipart/form-data")) {
        const formData = await request.formData();
        yamlAnalysis = formData.get("yamlAnalysis") as string || "";
        description = formData.get("description") as string || "";
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

      if (inspirationFile) {
        try {
          const arrayBuffer = await inspirationFile.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const mimeType = inspirationFile.type || "image/jpeg";
          const base64Image = buffer.toString("base64");

          inlineDataPart = {
            inlineData: {
              mimeType: mimeType,
              data: base64Image
            }
          };

          inspirationInstruction = `
7. LAYOUT & COMPOSITION REPLICATION (CRITICAL REFERENCE REPLICA): You have been provided with an inspiration/reference image (the print of a post).
   - Carefully analyze its visual layout, composition, camera angle, framing, and the poses of the subject/model.
   - Your primary mission is to instruct the model to REPLICATE this exact visual composition, camera perspective, and enquadramento (framing).
   - Describe the exact spatial positioning: how the subject is standing/sitting relative to the frame, where the product is held or placed, and what the background backdrop consists of.
   - The generated prompt must force the model to mimic the structural layout of the reference print, but featuring the user's product (from YAML) instead of the original product/subject.
`;
        } catch (e) {
          console.warn("[GERAR_REFERENCIA] Falha ao processar arquivo de inspiração para prompt:", e);
        }
      }

      const geminiSystemInstruction = `# ROLE
You are an elite Creative Art Director and Prompt Engineer specialized in User-Generated Content (UGC) advertising and high-fidelity product placement for image generation models (specifically Flux Kontext).

# GOAL
Given a reference image description (extracted features in YAML), the user's creative advertising ideas, and optionally an inspiration image (the print), write a short, highly natural, and descriptive image prompt IN ENGLISH optimized for the "flux-pro/kontext" model.

# CRITICAL RULES
1. OUTPUT LANGUAGE: You must write the final image prompt completely IN ENGLISH. Generating prompts in English dramatically increases the quality, pose accuracy, and realism of the model.
2. TEXT PRESERVATION: If there is any literal text to be rendered (e.g., brand names, shirt prints), specify it inside escaped double quotes exactly as it appears in the reference description. 
   - Example: "...wearing a shirt with the literal text \\"NOME DA MARCA\\" printed in clean typography..."
3. DO NOT HALLUCINATE: Never invent certifications, stamps, or long subtitles to be rendered on the product. Prohibit rendering long subtitles inside the physical image.
4. ABSOLUTELY NO CROPPED HEADS OR HAIR (ULTRA-CRITICAL): If the image features a person or model (holding a product, wearing clothing, or posing), you MUST ABSOLUTELY prevent the top of their head, forehead, or hair from being cut off by the border of the canvas.
   - You MUST explicitly inject multiple strict spatial instructions into the generated prompt.
   - You MUST include a phrase like: "framed in a balanced medium shot showing the model from the chest up, with a generous amount of empty space (clear headroom) above their head. The model's entire head, full hair, and face are completely visible and fully contained within the frame, with no cutoff or clipping by the borders of the image."
   - Avoid tight face close-ups, macro portraits, or extreme crops that focus excessively on the face/garment and leave no headroom. Always choose a spacious medium shot or a wide-angle composition.
5. FORMAT: Always end the prompt with the instruction: "square format, optimized for Instagram feed".
${brandingInstruction}
${inspirationInstruction}
# UGC REALISM & CAMERAS (Include at least 2-3 in the prompt)
- Camera styles: "spontaneous smartphone photo", "casual UGC candid shot", "centered composition with generous headroom", "medium shot with clear space above the head".
- Lighting: "natural indoor morning light", "ambient daylight mixed with soft neon", "soft natural shadows".
- Texture: "raw unpolished look", "subtle film grain", "realistic skin textures", "natural imperfections".
- Strict ban: Never use artificial terms like "cinematic lighting", "photorealistic", "4k", "8k", or "masterpiece".

# APPAREL & CLOTHING SPECIAL INSTRUCTIONS
If the reference image is clothing/apparel, describe a real human model wearing the garment naturally:
- Specify how the fabric falls, its texture (e.g., "textured linen", "soft cotton"), and details like buttons, prints, or specific cuts.
- Describe the model interacting naturally with the environment (e.g., "walking casually", "sitting relaxed").
- Ensure the model matches the user's requested scenario (e.g., "on a sunny beach during golden hour").
- EXPLICITLY state: "The model's entire head, hair, and face are fully visible, beautifully framed with clear headroom at the top of the image, ensuring no part of the head or hair is cut off by the border".

# OUTPUT FORMAT (Strict JSON)
You must return exclusively a valid JSON object with the following single key. Do not include any explanations, introductory or concluding text:
{
  "imagePrompt": "A highly detailed descriptive prompt in English covering subject, action, mood, environment, camera, colors, and textile/textual accuracy, explicitly detailing with heavy emphasis that the entire head, skull, and hair are fully visible inside the frame with generous headroom, prohibiting tight crops or cutoffs of the head, and ending with the square format instruction."
}`;

      const geminiUserMessage = `Sua tarefa: criar um prompt de imagem para post no instagram conforme orientado pelas diretrizes do sistema.
Certifique-se de que a imagem de referência do produto seja representada com a maior precisão possível nas imagens geradas, especialmente em relação a todos os textos e detalhes físicos.
Além disso, se houver uma imagem de inspiração/print fornecida, garanta que a composição, pose do modelo, layout de enquadramento de câmera e estilo visual sejam fielmente imitados e replicados.

Descrição desejada de cenário/modelo pelo usuário: "${description}"

Descrição física da imagem de referência do produto (YAML):
${yamlAnalysis}`;

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
        responseUrl: queueData.response_url,
        garmentPublicUrl: garmentPublicUrl // Retornando a URL da foto de referência original
      });
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

        // 1. Download da imagem gerada da Fal.ai no servidor Next.js
        const imgRes = await fetch(finalImageUrl);
        if (imgRes.ok) {
          const arrayBuffer = await imgRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const contentType = imgRes.headers.get("Content-Type") || "image/jpeg";

          const fileRef = bucket.file(`users/${userId}/posts/${postId}/generated_image.jpg`);
          const downloadToken = crypto.randomUUID();

          // Salvar o buffer no Storage com permissão total via Admin e registrar o download token
          await fileRef.save(buffer, {
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
        } else {
          console.warn("[GERAR_REFERENCIA] Falha ao baixar imagem gerada no servidor, usando original do Fal.ai.");
        }

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
          status: "completed"
        }, { merge: true });
        console.log(`[GERAR_REFERENCIA] Firestore atualizado com sucesso via Admin para o post ${postId}!`);

        // 4. Cadastrar automaticamente o registro da imagem gerada na subcoleção mediaGallery do Firestore do lojista
        try {
          const galleryRef = adminDb.collection("users").doc(userId).collection("mediaGallery");
          const galleryMediaId = `${postId}_ref_generated`;
          
          await galleryRef.doc(galleryMediaId).set({
            id: galleryMediaId,
            url: firebaseDownloadUrl,
            storagePath: `users/${userId}/posts/${postId}/generated_image.jpg`,
            source: "reference_generation",
            prompt: "Imagem gerada a partir de print de referência e produto.",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            usedInPostId: postId,
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
