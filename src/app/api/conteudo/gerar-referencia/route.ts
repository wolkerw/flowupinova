import { NextResponse, type NextRequest } from "next/server";
import { storage, db } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import { fal } from "@fal-ai/client";
import { Jimp } from "jimp";

export const maxDuration = 300; // Define timeout de até 5 minutos no Vercel

export async function POST(request: NextRequest) {
  try {
    const falKey = process.env.FAL_KEY || process.env.FAL_API_KEY;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!falKey) {
      console.error("[GERAR_REFERENCIA_ERROR] Chave FAL_KEY ou FAL_API_KEY não encontrada no .env.local");
      return NextResponse.json(
        { error: "Configuração do servidor ausente: Chave do Fal.ai não configurada." },
        { status: 500 }
      );
    }

    if (!apiKey) {
      console.error("[GERAR_REFERENCIA_ERROR] Chave GEMINI_API_KEY não encontrada no .env.local");
      return NextResponse.json(
        { error: "Configuração do servidor ausente: Chave do Gemini não configurada." },
        { status: 500 }
      );
    }

    // Configura o cliente do fal.ai com a chave crua
    const rawFalKey = falKey.trim().startsWith("Key ") 
      ? falKey.trim().replace(/^Key\s+/i, "") 
      : falKey.trim();

    fal.config({
      credentials: rawFalKey,
    });

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const description = formData.get("description") as string;
    const postId = formData.get("postId") as string;
    const userId = formData.get("userId") as string;

    if (!file) {
      return NextResponse.json({ error: "Arquivo do produto (imagem) não fornecido." }, { status: 400 });
    }

    if (!description) {
      return NextResponse.json({ error: "Descrição do cenário ou modelo não fornecida." }, { status: 400 });
    }

    console.log(`[GERAR_REFERENCIA] Iniciando processamento local avançado do post ${postId || "sem_id"}...`);

    // Iniciamos o processamento de IA assíncrono em segundo plano (IIFE)
    // para evitar o limite de 10s da Vercel Hobby e contornar erros de timeout
    (async () => {
      try {
        // 1. Converter a imagem em Buffer
        const arrayBuffer = await file.arrayBuffer();
        let buffer = Buffer.from(arrayBuffer);
        const mimeType = file.type || "image/jpeg";

        // --- CORTAR IMAGEM PARA 1:1 ANTES DE SEGUIR ---
        console.log(`[GERAR_REFERENCIA_BG] Pré-processando imagem de referência para formato quadrado 1:1...`);
        try {
          const image = await Jimp.read(buffer);
          const width = image.width;
          const height = image.height;
          
          console.log(`[GERAR_REFERENCIA_BG] Dimensões originais: ${width}x${height}`);
          if (width !== height) {
            const size = Math.min(width, height);
            const x = Math.max(0, Math.floor((width - size) / 2));
            const y = Math.max(0, Math.floor((height - size) / 2));
            
            console.log(`[GERAR_REFERENCIA_BG] Recortando imagem: x=${x}, y=${y}, size=${size}px`);
            image.crop({ x, y, w: size, h: size });
            buffer = await image.getBuffer("image/jpeg");
            console.log(`[GERAR_REFERENCIA_BG] Imagem recortada com sucesso para 1:1.`);
          } else {
            console.log(`[GERAR_REFERENCIA_BG] Imagem já é perfeitamente quadrada (1:1). Nenhuma alteração necessária.`);
          }
        } catch (jimpError: any) {
          console.error("[GERAR_REFERENCIA_BG_WARNING] Falha ao recortar imagem com Jimp, prosseguindo com a imagem original:", jimpError);
        }

        const base64Image = buffer.toString("base64");

        console.log(`[GERAR_REFERENCIA_BG] Analisando imagem de referência com o Google Gemini (2.5-flash)...`);

        // 2. Chamar o Gemini para extrair características detalhadas da imagem (YAML)
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
        const analysisResponse = await fetch(geminiUrl, {
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

        if (!analysisResponse.ok) {
          const errText = await analysisResponse.text();
          console.error("[GERAR_REFERENCIA_BG_ERROR] Erro na análise do Gemini:", errText);
          throw new Error(`Erro na análise visual da imagem: ${errText}`);
        }

        const analysisData = await analysisResponse.json();
        const yamlAnalysis = analysisData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!yamlAnalysis) {
          throw new Error("O Gemini não retornou resultado de análise da imagem.");
        }
        console.log("[GERAR_REFERENCIA_BG] Análise YAML concluída com sucesso:\n", yamlAnalysis);

        // 3. Chamar o Gemini (Text) para gerar o Prompt UGC otimizado em Inglês (JSON estruturado)
        console.log("[GERAR_REFERENCIA_BG] Construindo prompt de imagem otimizado UGC com o Gemini...");

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
Certifique-se de que a imagem de referência seja representada com a maior precisão possível nas imagens geradas, especially em relação a todos os textos e detalhes físicos.

Descrição desejada de cenário/modelo pelo usuário: "${description}"

Descrição física da imagem de referência (YAML):
${yamlAnalysis}`;

        const promptResponse = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: geminiSystemInstruction }]
            },
            contents: [
              {
                parts: [{ text: geminiUserMessage }]
              }
            ],
            generationConfig: {
              responseMimeType: "application/json"
            }
          })
        });

        if (!promptResponse.ok) {
          const errText = await promptResponse.text();
          console.error("[GERAR_REFERENCIA_BG_ERROR] Erro na construção do prompt UGC pelo Gemini:", errText);
          throw new Error(`Erro ao estruturar o prompt UGC: ${errText}`);
        }

        const promptData = await promptResponse.json();
        const rawJsonText = promptData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawJsonText) {
          throw new Error("O Gemini não retornou resultado de prompt UGC estruturado.");
        }

        const structuredOutput = JSON.parse(rawJsonText);
        const optimizedImagePrompt = structuredOutput.imagePrompt;

        if (!optimizedImagePrompt) {
          throw new Error(`A saída do Gemini não continha a chave 'imagePrompt': ${rawJsonText}`);
        }
        console.log("[GERAR_REFERENCIA_BG] Prompt UGC final estruturado em inglês:\n", optimizedImagePrompt);

        // 4. Iniciar o upload no Fal.ai CDN usando a SDK oficial
        console.log(`[GERAR_REFERENCIA_BG] Fazendo upload do produto para o Fal.ai CDN...`);
        const finalFileToUpload = new File([new Blob([buffer], { type: mimeType })], file.name, { type: mimeType });
        const garmentPublicUrl = await fal.storage.upload(finalFileToUpload);
        
        if (!garmentPublicUrl) {
          throw new Error("Falha ao obter URL pública da imagem do produto do Fal.ai CDN.");
        }
        console.log("[GERAR_REFERENCIA_BG] Imagem de referência pública no Fal.ai CDN em:", garmentPublicUrl);

        // 5. Chamar a API de condicionamento de imagem do Fal.ai (Flux Pro Kontext)
        console.log("[GERAR_REFERENCIA_BG] Chamando Flux Pro Kontext no Fal.ai...");
        
        const kontextResult: any = await fal.run("fal-ai/flux-pro/kontext", {
          input: {
            prompt: optimizedImagePrompt,
            image_url: garmentPublicUrl,
            aspect_ratio: "1:1"
          },
        });

        console.log("[GERAR_REFERENCIA_BG] kontextResult completo:", JSON.stringify(kontextResult, null, 2));

        const finalImageUrl = 
          kontextResult?.data?.image?.url || 
          kontextResult?.image?.url || 
          kontextResult?.data?.images?.[0]?.url || 
          kontextResult?.images?.[0]?.url || 
          (kontextResult?.data?.image && typeof kontextResult.data.image === 'string' ? kontextResult.data.image : undefined) ||
          (kontextResult?.image && typeof kontextResult.image === 'string' ? kontextResult.image : undefined);

        if (!finalImageUrl) {
          throw new Error(`Flux Pro Kontext não retornou URL da imagem gerada. Retorno da API: ${JSON.stringify(kontextResult)}`);
        }
        console.log("[GERAR_REFERENCIA_BG] Geração do Flux Pro Kontext concluída com sucesso:", finalImageUrl);

        // 6. Salvar a imagem final de forma definitiva no Firebase Storage local
        let outputUrl = finalImageUrl;

        try {
          console.log("[GERAR_REFERENCIA_BG] Baixando imagem final do Fal.ai para persistência no Firebase...");
          const downloadResponse = await fetch(finalImageUrl);
          if (downloadResponse.ok) {
            const finalBuffer = Buffer.from(await downloadResponse.arrayBuffer());
            const finalPath = `posts/${postId || "geral"}/${Date.now()}_resultado.jpg`;
            const finalRef = ref(storage, finalPath);

            console.log(`[GERAR_REFERENCIA_BG] Salvando imagem final no Firebase Storage em: ${finalPath}...`);
            await uploadBytes(finalRef, finalBuffer, {
              contentType: "image/jpeg",
            });

            const finalStorageUrl = await getDownloadURL(finalRef);
            console.log("[GERAR_REFERENCIA_BG] Imagem final salva com sucesso no Firebase Storage em:", finalStorageUrl);
            outputUrl = finalStorageUrl;
          } else {
            console.warn("[GERAR_REFERENCIA_BG_WARNING] Falha ao baixar imagem do Fal.ai, usando a URL original de API.");
          }
        } catch (storageError: any) {
          console.warn(
            "[GERAR_REFERENCIA_BG_WARNING] Falha ao salvar a imagem no Firebase Storage. Usando URL pública do Fal.ai como fallback.",
            storageError.message || storageError
          );
        }

        // Ao final de tudo, gravamos o link gerado diretamente no post correspondente no Firestore local
        if (postId && userId) {
          try {
            const { adminDb } = await import("@/lib/firebase-admin");
            const postRef = adminDb.collection("users").doc(userId).collection("posts").doc(postId);
            await postRef.update({
              imageUrls: [outputUrl]
            });
            console.log(`[GERAR_REFERENCIA_BG] Documento do post ${postId} atualizado com a imagem final gerada via adminDb.`);
          } catch (dbAdminErr: any) {
            console.error("[GERAR_REFERENCIA_BG_ERROR] Falha ao atualizar via adminDb, tentando fallback:", dbAdminErr);
            const postRef = doc(db, "users", userId, "posts", postId);
            await updateDoc(postRef, {
              imageUrls: [outputUrl]
            });
          }
        }
      } catch (bgError: any) {
        console.error("[GERAR_REFERENCIA_BG_ERROR] Erro na geração em segundo plano:", bgError);
        if (postId && userId) {
          try {
            const { adminDb } = await import("@/lib/firebase-admin");
            const postRef = adminDb.collection("users").doc(userId).collection("posts").doc(postId);
            await postRef.update({
              status: "failed",
              failureReason: bgError.message || "Erro interno ao processar a geração de imagem por referência."
            });
            console.log(`[GERAR_REFERENCIA_BG] Documento do post ${postId} atualizado com status failed via adminDb.`);
          } catch (dbErr) {
            console.error("[GERAR_REFERENCIA_BG_ERROR] Falha ao gravar erro no Firestore via adminDb, tentando fallback:", dbErr);
            try {
              const postRef = doc(db, "users", userId, "posts", postId);
              await updateDoc(postRef, {
                status: "failed",
                failureReason: bgError.message || "Erro interno ao processar a geração de imagem por referência."
              });
            } catch (fallbackErr) {
              console.error("[GERAR_REFERENCIA_BG_ERROR] Falha total no fallback Firestore:", fallbackErr);
            }
          }
        }
      }
    })();

    // Retorna imediatamente sucesso de inicialização assíncrona para o frontend
    return NextResponse.json({
      success: true,
      message: "Geração por referência iniciada em segundo plano.",
      postId: postId
    });

  } catch (error: any) {
    console.error("[GERAR_REFERENCIA_ERROR] Erro crítico no processamento local:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar a imagem por IA.", details: error.message },
      { status: 500 }
    );
  }
}
