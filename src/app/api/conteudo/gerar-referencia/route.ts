import { NextResponse, type NextRequest } from "next/server";
import { fal } from "@fal-ai/client";
import { Jimp } from "jimp";
import { admin, adminDb } from "@/lib/firebase-admin";
import crypto from "crypto";
import { logApiUsage } from "@/lib/services/api-usage-service-admin";
import { getUserStoragePathAdmin } from "@/lib/services/storage-utils-admin";
import { getSemanticCache, setSemanticCache } from "@/lib/services/semantic-cache";
import { safeParseJSON } from "@/lib/utils";

export const maxDuration = 300;

function safeJsonParse(rawText: any, fallback = null) {
  if (!rawText || typeof rawText !== "string") return fallback;
  try {
    return safeParseJSON(rawText);
  } catch (e) {
    if (fallback !== null) return fallback;
    throw e;
  }
}

async function removeBackgroundWithCache(
  imageBuffer: Buffer,
  fallbackUrl: string,
  rawFalKey: string,
  userId: string
): Promise<string> {
  const hash = crypto.createHash("sha256").update(imageBuffer).digest("hex");
  const cacheKey = `img_bria_hash_${hash}`;
  const cachedUrl = await getSemanticCache(cacheKey);

  if (cachedUrl) {
    console.log(`[CACHE] Fundo removido recuperado do cache para a imagem (${hash}): ${cachedUrl}`);
    return cachedUrl;
  }

  try {
    console.log(`[BRIA] Removendo fundo da imagem via Bria API...`);
    const briaResponse = await fetch("https://queue.fal.run/fal-ai/bria/background/remove", {
      method: "POST",
      headers: {
        Authorization: `Key ${rawFalKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: fallbackUrl,
      }),
    });

    if (briaResponse.ok) {
      const briaData = await briaResponse.json();
      const briaUrl = briaData.image?.url || briaData.images?.[0]?.url;
      if (briaUrl) {
        console.log(`[BRIA] Fundo removido com sucesso: ${briaUrl}`);
        
        logApiUsage({
          userId,
          type: "background_removal",
          provider: "falai",
          model: "bria",
          costUsd: 0.006,
        });

        console.log(`[CACHE] Baixando imagem da Fal.ai e salvando permanentemente no Firebase Storage...`);
        try {
          const imgRes = await fetch(briaUrl);
          if (!imgRes.ok) throw new Error("Falha ao baixar da Fal.ai");
          const imgArrayBuffer = await imgRes.arrayBuffer();
          const imgBuffer = Buffer.from(imgArrayBuffer);
          
          const bucket = admin.storage().bucket();
          const firebasePath = `cache/bria/${hash}.png`;
          const fileRef = bucket.file(firebasePath);
          const downloadToken = crypto.randomUUID();
          
          await fileRef.save(imgBuffer, {
            metadata: {
              contentType: "image/png",
              metadata: {
                firebaseStorageDownloadTokens: downloadToken,
              },
            },
          });

          const permanentUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileRef.name)}?alt=media&token=${downloadToken}`;
          
          await setSemanticCache(cacheKey, permanentUrl);
          console.log(`[CACHE] Imagem recortada salva permanentemente: ${permanentUrl}`);
          
          return permanentUrl;
        } catch (downloadErr) {
          console.error("[CACHE] Falha ao salvar imagem no Firebase, usando URL da Fal.ai:", downloadErr);
          return briaUrl;
        }
      }
    } else {
      console.warn("[BRIA] Falha na API do Bria, retornando URL original:", await briaResponse.text());
    }
  } catch (err) {
    console.error("[BRIA] Erro ao remover fundo via Bria, usando original:", err);
  }

  return fallbackUrl;
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

    let dynamicPrompts: any = {};
    try {
      const docSnap = await adminDb.collection("system_settings").doc("prompts").get();
      if (docSnap.exists) {
        dynamicPrompts = docSnap.data();
      }
    } catch (dbErr) {
      console.error("[GERAR_REFERENCIA] Erro ao buscar prompts do DB:", dbErr);
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "generate-ideas") {
      const formData = await request.formData();
      const inspirationFile = formData.get("inspiration_file") as File;
      const description = (formData.get("description") as string) || "";
      const businessProfileJson = formData.get("business_profile_json") as string;
      
      let businessProfile = null;
      if (businessProfileJson) {
        try {
          businessProfile = JSON.parse(businessProfileJson);
        } catch (e) {
          console.error("Erro ao parsear business_profile_json:", e);
        }
      }

      // Contexto do Perfil de Negócio (se disponível)
      let businessContext = "";
      if (businessProfile) {
        const parts = [];
        if (businessProfile.name) parts.push(`- **Nome da Marca/Empresa**: ${businessProfile.name}`);
        if (businessProfile.category)
          parts.push(`- **Nicho/Categoria**: ${businessProfile.category}`);
        if (businessProfile.description)
          parts.push(`- **Descrição do Negócio**: ${businessProfile.description}`);
        if (businessProfile.slogan) parts.push(`- **Slogan**: ${businessProfile.slogan}`);
        if (businessProfile.targetAudience)
          parts.push(`- **Público-Alvo**: ${businessProfile.targetAudience}`);
        if (businessProfile.toneOfVoice)
          parts.push(`- **Tom de Voz**: ${businessProfile.toneOfVoice}`);
        if (businessProfile.mainBenefits && businessProfile.mainBenefits.length > 0) {
          parts.push(`- **Principais Benefícios**: ${businessProfile.mainBenefits.join(", ")}`);
        }
        if (businessProfile.brandPositioning) {
          parts.push(
            `- **Diferencial / Posicionamento (Memória)**: ${businessProfile.brandPositioning}`
          );
        }
        if (businessProfile.keyProducts) {
          parts.push(
            `- **Produtos e Serviços de Destaque (Memória)**: ${businessProfile.keyProducts}`
          );
        }
        if (businessProfile.clientProfile) {
          parts.push(`- **Perfil do Cliente / Persona (Memória)**: ${businessProfile.clientProfile}`);
        }
        if (businessProfile.stylisticPreferences) {
          parts.push(
            `- **Preferências Estilísticas/Vibe (Memória)**: ${businessProfile.stylisticPreferences}`
          );
        }

        // Adicionar novas informações do Brand Kit profissional (fontes, cores e personas)
        const brandKit = businessProfile.brandKit;
        if (brandKit) {
          if (brandKit.fonts) {
            const fontsInfo = [];
            if (brandKit.fonts.primaryFont)
              fontsInfo.push(`Principal/Títulos: ${brandKit.fonts.primaryFont}`);
            if (brandKit.fonts.secondaryFont)
              fontsInfo.push(`Secundária/Corpo: ${brandKit.fonts.secondaryFont}`);
            if (brandKit.fonts.style) fontsInfo.push(`Estilo Geral: ${brandKit.fonts.style}`);
            if (fontsInfo.length > 0) {
              parts.push(`- **Tipografia da Marca**: ${fontsInfo.join(" | ")}`);
            }
          }

          if (brandKit.extendedColors) {
            const colorsInfo = [];
            if (brandKit.extendedColors.complementary)
              colorsInfo.push(`Complementar/Apoio: ${brandKit.extendedColors.complementary}`);
            if (brandKit.extendedColors.background)
              colorsInfo.push(`Cenário/Fundo: ${brandKit.extendedColors.background}`);
            if (colorsInfo.length > 0) {
              parts.push(`- **Paleta de Cores Estendida**: ${colorsInfo.join(" | ")}`);
            }
          }

          const personaParam =
            (formData.get("selected_persona") as string) ||
            (formData.get("selectedPersona") as string);
          let lockedPersona: any = null;
          if (personaParam) {
            try {
              lockedPersona = JSON.parse(personaParam);
            } catch {
              lockedPersona = personaParam;
            }
          }

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

          if (lockedPersona && typeof lockedPersona === "object") {
            parts.push(`- **PERSONA COMPRADORA ALVO TRAVADA PARA ESTA GERAÇÃO (FOCO EXCLUSIVO)**:
    * Nome da Persona: ${lockedPersona.name || "Persona Alvo"}
    * Perfil/Segmento: ${lockedPersona.profile || "N/A"}
    * Dores/Desafios deste Cliente: ${lockedPersona.painPoints || "N/A"}
    * Motivação de Compra deste Cliente: ${lockedPersona.buyingMotivation || "N/A"}

    REGRA DE FOCO VISUAL: A composição visual deve ser projetada para atrair a atenção e dialogar com o universo deste comprador alvo (${lockedPersona.name || "Cliente Alvo"}).`);
          } else if (brandKit.personas && brandKit.personas.length > 0) {
            const personasInfo = brandKit.personas
              .map((p: any, idx: number) => {
                return `Persona Alvo ${idx + 1} (${p.name || "Sem nome"}):
      * Perfil/Nicho do Cliente Alvo: ${p.profile || "N/A"}
      * Dores/Desafios deste Cliente: ${p.painPoints || "N/A"}
      * Motivação de Compra deste Cliente: ${p.buyingMotivation || "N/A"}`;
              })
              .join("\n");
            parts.push(`- **PERSONAS COMPRADORAS / PÚBLICO-ALVO QUE A MARCA QUER ATRAIR**:\n${personasInfo}`);
          }
        }

        if (parts.length > 0) {
          businessContext = `
# CONTEXTO DE MARCA E IDENTIDADE DO NEGÓCIO DO USUÁRIO
Você é o diretor criativo oficial desta marca específica. Use as informações reais do negócio abaixo para adaptar as abordagens, criar títulos contextualizados e aplicar o tom de voz e estilo corretos:
${parts.join("\n")}

DIRETRIZES CRÍTICAS DE MARCA E PERSONAS (INVIOLÁVEL):
1. **IDENTIDADE DA MARCA (O EMISSOR)**: A arte visual e os textos devem promover SEMPRE o negócio do usuário ("${businessProfile.name}" - Nicho: "${businessProfile.category || "negócios"}").
2. **PAPEL DAS PERSONAS (CLIENTES ALVO, NÃO A EMPRESA)**: As personas representam os **CLIENTES COMPRADORES / ALVOS DE BUSCA** que a empresa quer atrair. NUNCA crie artes como se a empresa do usuário fosse a persona!
   - *Exemplo*: Se a empresa do usuário for de Contabilidade (ex: MT Gestão Contábil) e a persona for uma Médica/Dona de Clínica, a arte deve representar a CONTABILIDADE oferecendo soluções de gestão e inteligência financeira PARA clínicas médicas. NUNCA crie uma arte de consultas médicas ou procedimento cirúrgico como se a empresa fosse um hospital.
3. **Tom de Voz e Vibe**: Escreva legendas e prompts visuais aplicando de forma consistente o Tom de Voz definido (${businessProfile.toneOfVoice || "profissional e persuasivo"}).
4. **Benefícios e Posicionamento**: Sempre destaque os diferenciais e benefícios das soluções da empresa do usuário ao dialogar com a persona.
`;
        }
      } else {
        // Fallback para os campos antigos caso a interface mande apenas nome, categoria e desc
        const businessName = (formData.get("business_name") as string) || "";
        const businessCategory = (formData.get("business_category") as string) || "";
        const businessDescription = (formData.get("business_description") as string) || "";
        
        businessContext = `
Informações Básicas do Negócio:
- Nome da Empresa: ${businessName || "Não informado"}
- Ramo de Atuação: ${businessCategory || "Não informado"}
- Descrição do Negócio: ${businessDescription || "Não informado"}
`;
      }

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

      const rawIdeiasPrompt = dynamicPrompts.ideias_post_prompt || `Você é um especialista em Copywriting Sênior, Marketing e Diretor de Arte de redes sociais.
CONTEXTO TEMPORAL: Estamos no ano de [ANO], no mês de [MES]. Sempre utilize esse ano/contexto atual caso precise citar datas, anos ou campanhas promocionais sazonais. Nunca cite o ano de 2024.

Análise detalhadamente a imagem de inspiração visual (print de post) fornecida e a descrição enviada pelo usuário: "[DESCRICAO]".
Com base nessas informações e no perfil comercial do usuário informado abaixo, crie 3 propostas de publicações virais e estratégicas para o Instagram que herdem e adaptem o conceito visual, estilo estético, layout e tom de voz do print de referência para a realidade deste negócio.

[CONTEXTO_DO_NEGOCIO]

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

      let geminiPrompt = rawIdeiasPrompt
        .replace("[ANO]", currentYear.toString())
        .replace("[MES]", currentMonth)
        .replace("[DESCRICAO]", description)
        .replace("[CONTEXTO_DO_NEGOCIO]", businessContext);

      // Se o prompt master não tinha as tags originais (porque foi atualizado), garantimos que a IA receba o contexto e a descrição no final
      if (!geminiPrompt.includes(description) && description) {
        geminiPrompt += `\n\nDescrição/Tema fornecido pelo usuário: ${description}`;
      }
      if (!geminiPrompt.includes(businessContext) && businessContext) {
        geminiPrompt += `\n\nContexto do Negócio:\n${businessContext}`;
      }

      // GARANTIA CRÍTICA DE FORMATO: Injeta as regras de JSON que podem estar faltando no prompt do admin
      geminiPrompt += `\n\nINSTRUÇÕES DE FORMATO OBRIGATÓRIO (VOCÊ DEVE SEGUIR ESTA ESTRUTURA ESTRITAMENTE):
Responda EXATAMENTE E APENAS com um objeto JSON válido, contendo uma propriedade "publicacoes" que é um array com as 3 ideias. Cada ideia deve ter as propriedades exatas: "titulo" (string), "subtitulo" (string) e "hashtags" (array de strings com a hashtag incluída, ex: ["#foo"]).
Exemplo de formato:
{
  "publicacoes": [
    { "titulo": "Seu título aqui", "subtitulo": "Seu subtítulo explicativo aqui", "hashtags": ["#marketing", "#sucesso"] }
  ]
}
NÃO inclua crases, NENHUM bloco markdown \`\`\`json, nem qualquer texto antes ou depois do JSON. Devolva apenas o JSON puro.`;

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
                model: "claude-3-opus-20240229",
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
          let proErrMessage = "";
          try {
            console.log(
              "[GERAR_REFERENCIA] Usando Gemini 1.5 Pro de fallback para gerar ideias textuais..."
            );
            const geminiProUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-latest:generateContent?key=${apiKey}`;
            const geminiResponse = await fetch(geminiProUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [
                  {
                    role: "user",
                    parts: [
                      {
                        inlineData: {
                          mimeType: mimeType,
                          data: base64Image,
                        },
                      },
                      { text: "Analise a imagem de acordo com as instruções do sistema." }
                    ],
                  },
                ],
                systemInstruction: {
                  parts: [{ text: geminiPrompt }],
                },
                generationConfig: {
                  temperature: 0.9,
                  responseMimeType: "application/json",
                },
              }),
            });

            if (!geminiResponse.ok) {
              throw new Error(await geminiResponse.text());
            }

            const resData = await geminiResponse.json();
            const rawJson = resData.candidates?.[0]?.content?.parts?.[0]?.text;
            parsed = safeJsonParse(rawJson);
          } catch (proError: any) {
            proErrMessage = proError.message || String(proError);
            console.warn(
              "[GERAR_REFERENCIA] Falha no Gemini 1.5 Pro (Ideas), tentando Gemini 1.5 Flash:",
              proErrMessage
            );

            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
            const geminiResponseFlash = await fetch(geminiUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [
                  {
                    role: "user",
                    parts: [
                      {
                        inlineData: {
                          mimeType: mimeType,
                          data: base64Image,
                        },
                      },
                      { text: "Analise a imagem de acordo com as instruções do sistema." }
                    ],
                  },
                ],
                systemInstruction: {
                  parts: [{ text: geminiPrompt }],
                },
                generationConfig: {
                  temperature: 0.9,
                  responseMimeType: "application/json",
                },
              }),
            });

            if (!geminiResponseFlash.ok) {
              const flashErrText = await geminiResponseFlash.text();
              console.error("[MIGRATED_REF_IDEAS] Falha no Gemini Flash:", flashErrText);
              throw new Error(`Falha ao gerar ideias no Gemini.\nErro no Pro: ${proErrMessage}\nErro no Flash: ${flashErrText}`);
            }

            const resData = await geminiResponseFlash.json();
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

      let base64Image2 = "";
      let mimeType2 = "";
      if (secondaryFile) {
        const processed = await processImage(secondaryFile);
        base64Image2 = processed.base64;
        mimeType2 = processed.mimeType;
      }

      const cacheKey = "analyze_" + base64Image1 + (base64Image2 ? "_" + base64Image2 : "");
      const cachedData = await getSemanticCache(cacheKey);
      if (cachedData) {
        return NextResponse.json({ success: true, yamlAnalysis: cachedData });
      }

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

If the image contains CLOTHING / APPAREL (Flat lay, hanger, or worn by a human model):
  item_type: (e.g., matching two-piece set, linen trousers, summer dress)
  human_model_present: (true or false — is a live human model wearing the garment in the photo?)
  required_shot_type: (MANDATORY FIELD — set to "full_body" if human_model_present is true, otherwise "product_shot")
  color_scheme:
    - hex: (Hex code of fabric color)
      name: (Color name, e.g., pastel off-white, ocean blue)
  fabric_texture: (Describe the material and weave: textured linen, soft ribbed cotton, silk satin, thick denim)
  design_patterns: (Describe prints, patterns, stripes, buttons, stitching, or pocket details)
  cut_and_fit: (Describe the fit: oversized, cropped, slim fit, high-waisted, flowy)
  visual_description: (A detailed sentence summarizing the garment's appearance, shape, and physical design details)
  background_and_setting: (Detailed description of the environment, location, props, and background scenery)
  full_body_composition_note: (MANDATORY if human_model_present is true — Write: "The human model wearing this garment MUST be shown in a FULL BODY shot from head to feet, with generous headroom above and the full outfit silhouette visible. Never crop the head or feet.")

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
        // secondary image already processed for cache key

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

      await setSemanticCache(cacheKey, yamlAnalysis);

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

      const textRenderingInstruction = `
- The prompt MUST describe the visual scene and subjects, but it MUST contain ABSOLUTELY NO text, letters, slogans, prices, or graphical UI elements written on the canvas. Under no circumstances should any typography, text, or character be printed on the generated image.
`;

      let priorityInstruction = "";
      if (hybridPriority === "scenario") {
        priorityInstruction = `
# STRICT SCENARIO FIDELITY & ASYMMETRIC FRAMING RULE (CRITICAL FOR IMMOVABLES / SCENARIOS):
- The background, architecture, building, rooms, or garden from Photo 2 (described in SECONDARY_PRODUCT_ANALYSIS) are the absolute subject and setting of the scene.
- You MUST describe this physical scenario with high fidelity (materials, layout, lights, doors, windows, textures). Do NOT replace the backdrop with a generic scene.
- COMPOSITION & PLACEMENT: The person from Photo 1 must be placed off-center, positioned on the far-left or far-right of the frame (applying the photographic rule of thirds). The center of the image must remain completely open and unobstructed to beautifully display the main entrance, facade, or central architecture of the property in Photo 2.
- INTEGRATION OF SUBJECT IN THE ARCHITECTURE: The person must not be a large close-up portrait. Instead, frame the scene in a wide-shot or medium-wide shot where the person is smaller in the frame and physically integrated into the building's architecture. Describe them in a natural pose: e.g., leaning casually against an external wall of the house, standing right next to the entrance doorway, walking through the entrance, or standing on the front porch. The person acts as a scale reference and natural character in the architectural scene, while the building remains the main hero of the photo.
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
3. ABSOLUTELY NO CROPPED HEADS, BODY PARTS OR HAIR — COMPLETE HUMAN BODY VISIBILITY (ULTRA-CRITICAL, NON-NEGOTIABLE): If the image features a person or model (holding a product, wearing clothing, or posing), the following rules are ABSOLUTE and CANNOT be overridden by any other instruction:
   - **HEAD & HAIR RULE**: The model's full head, forehead, hair, and face MUST be entirely contained within the frame. The top of the head must have a generous empty space buffer of at least 10-15% of the frame height above it. NEVER clip, crop, or cut any part of the head or hair.
   - **FULL BODY RULE FOR APPAREL/FASHION**: When the reference product is clothing, apparel, garments, shoes, or any wearable item, you MUST frame the model in a FULL BODY SHOT — showing the model from the top of their head all the way down to their feet (or at minimum mid-thigh). This is mandatory because the entire garment must be visible. DO NOT use chest-up, waist-up, or any partial body framing for apparel products.
   - **NEGATIVE PROMPT MANDATORY**: You MUST include the following phrase verbatim in the generated prompt: "full body shot, entire person visible from head to feet, generous headroom above the head, no cropping of head or hair, no cutoff, head fully inside frame"
   - **SPATIAL COMPOSITION**: Use a wide-angle or medium-wide lens (35mm to 50mm equivalent) that comfortably fits the full model with space to breathe above and below. The model should occupy approximately 70-80% of the vertical frame height, leaving visible headroom on top and floor/environment space on the bottom.
   - **PRODUCT DOES NOT OVERRIDE PERSON**: The person wearing the clothing or holding the product is the PRIMARY subject of the scene. The framing must NEVER be tightened to show the product at the expense of cutting off parts of the human body. The product is secondary to the full, dignified representation of the human being in the scene.
   - You MUST explicitly inject multiple strict spatial instructions into the generated prompt.
   - Avoid tight face close-ups, macro portraits, or extreme crops that focus excessively on the face/garment and leave no headroom. Always choose a spacious full-body or medium-wide composition.
4. TEXT RENDERING CONTROL (CRITICAL):
   ${textRenderingInstruction}
5. FORMAT: Always end the prompt with the instruction: "framed vertically in 3:4 portrait format (1080x1440 pixels), optimized for Instagram portrait post".
${priorityInstruction}
${brandingInstruction}
${inspirationInstruction}
${dynamicPrompts.ugc_prompt || `# UGC PHOTOGRAPHY & ESTHETIC PREMIUM
- Always describe a high-end commercial advertising photograph or a clean premium lifestyle portrait (e.g., "real-world professional commercial photography", "premium natural lifestyle scene", "luxury cinematic portrait").
- Mandatorily detail advanced lighting setups to create stunning visual separation (e.g., "cinematic volumetric natural lighting", "soft ambient sunlight", "gentle side-lighting casting warm soft diagonal shadows", "rim lighting highlighting the contours of the subject").
- Define professional camera specifications to preserve palpable textures and extreme optical sharpness (e.g., "shot on high-end camera, 50mm or 85mm lens, pin-sharp focus on the main subject, shallow depth of field, clean circular bokeh circles in the background").
- Strictly avoid banned artificial buzzwords (e.g., do NOT use "photorealistic", "ultrarealistic", "4k", "8k", "hyper-detailed", or "masterpiece").
- Emphasize natural tangible textures to force model realism: "subtle high-end film grain, realistic skin textures showing fine pores, natural fabric folds, soft textile imperfections, and realistic glass reflections".

# APPAREL & CLOTHING SPECIAL INSTRUCTIONS — FULL BODY MANDATORY
If the reference product is clothing/apparel, shoes, or any wearable item, all of the following rules are ABSOLUTE and override any other composition instruction:
- **FRAMING IS FULL BODY ONLY**: You MUST describe a full body shot framing. The model must be shown completely from head to toe. Explicitly state: "full-body portrait shot, showing the model from the very top of their head down to their feet, with the entire outfit clearly visible from top to bottom, generous empty headroom above the head".
- Specify how the fabric falls, its physical texture (e.g., "textured heavy linen", "soft ribbed premium cotton", "glossy silk satin"), and visual details like wooden buttons, delicate stitching, prints, or specific cuts.
- Describe the model interacting naturally and elegantly with the environment (e.g., "standing relaxed", "leaning casually on the natural ambient furniture").
- Ensure the model's environment strictly represents the user's requested scenario (e.g., "inside the exact real-world scenario requested with beautiful ambient lighting").
- EXPLICITLY state: "The model's entire body is fully visible — head, hair, face, torso, legs, and feet — all beautifully framed with generous headroom at the top and ground visible at the bottom, strictly preventing any part of the body, head, forehead, or hair from being clipped or cut off by the borders. Full body shot. No cropping.".
- NEVER frame apparel shots as chest-up, waist-up, or product close-up. The garment's full silhouette from collar/shoulder to hem/feet is the visual story — it must be fully shown.`}

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
              model: "claude-3-5-sonnet-20241022",
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

          // Se der erro de modelo não encontrado, tentar Haiku 3.5
          if (!response.ok) {
            const errText = await response.text();
            console.warn(
              "[GERAR_REFERENCIA] Falha com Claude Sonnet 3.5 (Prompt), tentando Haiku:",
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
                model: "claude-3-5-haiku-20241022",
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
      const userStoragePath = await getUserStoragePathAdmin(userId);
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

      // Cadeia de modelos: gpt-image-2 primeiro como oficial
      const MODELS_CHAIN = [
        { provider: "openai", model: "gpt-image-2" },
        { provider: "openai", model: "chatgpt-image-latest" },
        { provider: "openai", model: "dall-e-3" },
      ];

      let imageBytes: string | null = null;
      let modelUsed = "";
      let lastError = "";
      const openaiKey = process.env.OPENAI_API_KEY;

      for (const config of MODELS_CHAIN) {
        try {
          console.log(`[IMAGE_REF] Tentando modelo ${config.model} (${config.provider})...`);
          let bytes: string | null = null;

          if (config.provider === "openai") {
            if (!openaiKey) throw new Error("OPENAI_API_KEY ausente no ambiente (.env.local)");
            const nativeSize =
              config.model === "gpt-image-2"
                ? "1152x1536"
                : config.model === "dall-e-3"
                  ? "1024x1792"
                  : "1024x1024";
            const payload: any = {
              model: config.model,
              prompt: prompt,
              n: 1,
              size: nativeSize,
            };
            if (config.model === "dall-e-3" || config.model === "dall-e-2") {
              payload.response_format = "b64_json";
            }

            const response = await fetch("https://api.openai.com/v1/images/generations", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${openaiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            });

            if (response.ok) {
              const data = await response.json();
              bytes = data?.data?.[0]?.b64_json;
              if (!bytes && data?.data?.[0]?.url) {
                console.log(`[IMAGE_REF] URL recebida da OpenAI (${config.model}), baixando imagem...`);
                const imgRes = await fetch(data.data[0].url);
                if (imgRes.ok) {
                  const ab = await imgRes.arrayBuffer();
                  bytes = Buffer.from(ab).toString("base64");
                }
              }
            } else {
              const errText = await response.text();
              lastError = `Modelo OpenAI ${config.model} falhou: ${errText.substring(0, 250)}`;
              console.error(`[IMAGE_REF] ${lastError}`);
              throw new Error(lastError);
            }
          } else {
            const imagenUrl = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:predict?key=${apiKey}`;
            const imagenResponse = await fetch(imagenUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                instances: [{ prompt }],
                parameters: { sampleCount: 1, outputMimeType: "image/jpeg", aspectRatio: "3:4" },
              }),
            });

            if (imagenResponse.ok) {
              const data = await imagenResponse.json();
              bytes = data?.predictions?.[0]?.bytesBase64Encoded;
            } else {
              const errText = await imagenResponse.text();
              lastError = `Modelo Google ${config.model} falhou: ${errText.substring(0, 250)}`;
              console.error(`[IMAGE_REF] ${lastError}`);
              throw new Error(lastError);
            }
          }

          if (bytes) {
            imageBytes = bytes;
            modelUsed = config.model;
            console.log(`[IMAGE_REF] ✅ Sucesso com o modelo ${config.model}!`);
            break;
          }
        } catch (modelErr: any) {
          console.warn(`[IMAGE_REF] Exceção no modelo ${config.model}:`, modelErr.message);
        }
      }

      if (!imageBytes) {
        return NextResponse.json(
          { error: `Falha na geração de imagem. ${lastError}` },
          { status: 500 }
        );
      }

      // Pós-processamento Jimp: Formatar para 1080 x 1440 (3:4 Vertical Feed)
      try {
        const jimpImage = await Jimp.read(Buffer.from(imageBytes, "base64"));
        const targetWidth = 1080;
        const targetHeight = 1440;
        const targetRatio = targetWidth / targetHeight; // 0.75

        const currentRatio = jimpImage.width / jimpImage.height;
        if (Math.abs(currentRatio - targetRatio) > 0.01) {
          let cropW = jimpImage.width;
          let cropH = jimpImage.height;
          if (currentRatio > targetRatio) {
            cropW = Math.round(jimpImage.height * targetRatio);
          } else {
            cropH = Math.round(jimpImage.width / targetRatio);
          }
          const cropX = Math.max(0, Math.floor((jimpImage.width - cropW) / 2));
          const cropY = Math.max(0, Math.floor((jimpImage.height - cropH) / 2));
          jimpImage.crop({ x: cropX, y: cropY, w: cropW, h: cropH });
        }
        jimpImage.resize({ w: targetWidth, h: targetHeight });
        const processedBuffer = await jimpImage.getBuffer("image/jpeg");
        imageBytes = processedBuffer.toString("base64");
      } catch (jimpErr) {
        console.warn("[IMAGE_REF] Falha ao ajustar proporção 3:4 via Jimp:", jimpErr);
      }

      // Salvar no Firebase Storage
      const bucket = admin
        .storage()
        .bucket(
          `${process.env.FIREBASE_PROJECT_ID || "studio-7502195980-3983c"}.firebasestorage.app`
        );
      const buffer = Buffer.from(imageBytes, "base64");
      const fileRef = bucket.file(`${userStoragePath}/posts/${postId}/imagen4_ref_generated.jpg`);
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

        // Registrar log de consumo
        logApiUsage({
          userId,
          type: "image_generation",
          provider: modelUsed.includes("gpt") ? "openai" : "google_vertex",
          model: modelUsed || "gpt-image-2",
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
      const userStoragePath = await getUserStoragePathAdmin(userId);
      const caption = (formData.get("caption") as string) || null;
      const layoutStyle = (formData.get("layoutStyle") as string) || "";
      const hybridPriority = (formData.get("hybridPriority") as string) || "balanced";
      const openaiKey = process.env.OPENAI_API_KEY;

      if (!file || !prompt || !postId || !userId) {
        return NextResponse.json(
          { error: "Campos obrigatórios ausentes: file, prompt, postId, userId." },
          { status: 400 }
        );
      }

      console.log(
        `[NANOBANANA_REF] Iniciando processamento para o post ${postId} (Preset: ${layoutStyle || "Padrão"})...`
      );

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

          buf = await image.getBuffer("image/png");
        } catch (e) {
          console.warn("[NANOBANANA_REF] Falha no crop/resize:", e);
        }
        return { buffer: buf, mimeType: "image/png" };
      };

      // 1. Processar Foto 1 (Pessoa/Selfie/Produto)
      const { buffer: buffer1, mimeType: mimeType1 } = await processImageBuffer(file);

      // Preparar variáveis do subject 2 (Produto/Projeto)
      let secondaryGarmentPublicUrl = "";
      let transparentProductUrl = "";
      let base64Image2 = "";
      let mimeType2 = "";
      let garmentPublicUrl = "";
      let transparentGarmentUrl = "";
      let displaySystemBlueprint = "";

      const referenceReplicationMode =
        (formData.get("referenceReplicationMode") as string) || "full";

      if (secondaryFile) {
        console.log(
          `[NANOBANANA_REF] Processando Foto 2 (Referência) — Modo: ${referenceReplicationMode}...`
        );
        const { buffer: buffer2, mimeType: mimeType2Original } =
          await processImageBuffer(secondaryFile);

        base64Image2 = buffer2.toString("base64");
        mimeType2 = mimeType2Original;

        // Extração do Display System Blueprint da Foto de Referência via IA de Visão
        if (apiKey || openaiKey) {
          try {
            console.log(
              `[DISPLAY_SYSTEM] 🧠 Analisando Foto 2 com IA de Visão (Modo: ${referenceReplicationMode})...`
            );

            const visionPrompt =
              referenceReplicationMode === "full"
                ? `You are an elite Commercial Advertising Art Director & Design Engineer. Analyze this reference ad creative and extract its complete Display & Graphic Layout Blueprint:
1. Graphic Layout & Architecture (badges, cards, discount containers, price pills, borders, overlay banners, CTA buttons).
2. Typography & Text Placements (exact headline location, text hierarchy, typography font style, contrast colors, visual weight).
3. Environment & Backdrop (surface materials, backdrop textures, lighting direction, rim lights, ambient atmosphere).
4. Composition & Product Placement (where the hero product is anchored, negative space, surrounding splashes or particles).

Respond with a precise 3-4 sentence instruction guiding how to replicate this exact complete advertising creative architecture around a new product.`
                : `You are an elite Commercial Advertising Art Director & Photography Engineer. Analyze this reference image and extract ONLY its photographic environment and lighting setup (ignoring any graphic texts or logos):
1. Environment & Backdrop (exact 3D surfaces, textures, architectural setting, color grading).
2. Lighting & Reflections (key light direction, softbox/sunlight temperature, rim light, reflections, realistic shadows).
3. Camera Perspective (macro, eye-level, low angle, tilt, depth of field).
4. Physical Props & Effects (water splashes, pedestals, botanical elements, dynamic particles).

Respond with a concise 3-4 sentence photographic instruction to recreate this clean 3D physical environment without copying any written text or graphics from the reference.`;

            if (apiKey) {
              const visionUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
              const visionRes = await fetch(visionUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [
                    {
                      parts: [
                        { text: visionPrompt },
                        {
                          inlineData: {
                            mimeType: mimeType2Original || "image/jpeg",
                            data: buffer2.toString("base64"),
                          },
                        },
                      ],
                    },
                  ],
                }),
              });

              if (visionRes.ok) {
                const vData = await visionRes.json();
                const vText = vData?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (vText) {
                  displaySystemBlueprint = vText.trim();
                  console.log(
                    "[DISPLAY_SYSTEM] ✅ Blueprint extraído com sucesso:",
                    displaySystemBlueprint.substring(0, 120)
                  );
                }
              }
            }
          } catch (visErr: any) {
            console.warn(
              "[DISPLAY_SYSTEM] Falha ao extrair Display System Blueprint:",
              visErr?.message
            );
          }
        }
      }

      // Se NÃO houver chave OpenAI (fallback para Gemini Nano Banana Pro puro), realiza processamento legado no Fal.ai/Bria
      if (!openaiKey) {
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

        transparentGarmentUrl = garmentPublicUrl;
        if (hybridPriority === "packshot" && garmentPublicUrl) {
          try {
            console.log(
              `[NANOBANANA_REF] Removendo fundo da Foto 1 (Produto Amador) via Bria API (Packshot)...`
            );
            transparentGarmentUrl = await removeBackgroundWithCache(
              buffer1,
              garmentPublicUrl,
              rawFalKey,
              userId
            );
          } catch (briaError) {
            console.error("[NANOBANANA_REF] Erro no Bria para Foto 1 (Packshot):", briaError);
          }
        }
      } else {
        console.log(
          "[NANOBANANA_REF] 🚀 gpt-image-2 ativo: pulando Fal.ai Bria (segmentação e ambientação nativas com custo R$ 0 de Fal.ai)."
        );
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
          priorityRule = `1. SUBJECT FIDELITY: Depict the person from Photo 1 clearly, but frame them in a wide-shot, full-body, or medium-wide shot (smaller in the frame) to give absolute prominence and priority to the architecture of the house.
2. PHYSICAL INTEGRATION INTO THE ARCHITECTURE (CRITICAL): Position the person physically integrated with the house/building elements from Photo 2. They must be depicted leaning casually against an external wall, standing right next to the entrance doorway, climbing the porch steps, or entering the door. The person must serve as a scale reference and human context, NEVER as a large, central close-up portrait.
3. RIGID SCENARIO PRESERVATION (CRITICAL): The scenario, house, interior, or architecture from Photo 2 is the main subject of the foreground and background. You must replicate this physical structure (facade, porch, doors, windows, stone/wood textures) with maximum fidelity.
4. ASYMMETRIC LATERAL POSITIONING (RULE OF THIRDS): Position the person from Photo 1 off-center, shifted to the far-left or far-right of the image (never centered). The center of the frame must remain completely open and unobstructed to beautifully display the main entrance, door, and structural facade of the house in Photo 2.`;
        } else if (hybridPriority === "packshot") {
          priorityRule = `1. PRODUCT SWAP: Identify the main foreground product in Photo 2 and replace it entirely with the product from Photo 1. Place the product from Photo 1 in the exact same position, scale, and angle as the original.
2. PRODUCT FIDELITY: Replicate the shape, colors, labels, logo, text, and brands of the product from Photo 1 with maximum precision. It must remain readable and identical to the reference.
3. RIGID BACKDROP PRESERVATION: Recreate the background scenery, decorations, surfaces (table, shelf, ice, etc.) from Photo 2 with maximum fidelity. Do not replace it with a generic background.
4. LIGHTING & SHADOW FUSION: The new product must realistically absorb the lighting (direction, color, brightness), surface reflections, and contact shadows of the original product from Photo 2.`;
        } else if (hybridPriority === "person") {
          priorityRule = `1. MAXIMUM PERSON FIDELITY (PRIMARY FOCUS): Depict the person from Photo 1 with extremely high fidelity of facial features, posture, expressions, and skin textures. They are the absolute hero of the shot.
2. BODY & APPAREL RECREATION: Draw natural body poses and sophisticated clothing that match the person's physique and the overall theme.
3. FLEXIBLE SCENARIO ADAPTATION: The product/scenery from Photo 2 serves only as loose background context. You have total creative freedom to simplify, crop, or blur (bokeh effect) the background of Photo 2 to emphasize the person.
4. LIGHTING FUSION: Integrate the person and the background scene with professional, artistic lighting focused on the main subject.`;
        } else {
          priorityRule = `1. SUBJECT FIDELITY: Depict the person from Photo 1 with maximum physical fidelity (face, hair, eyes, skin). They must be clearly recognizable.
2. BODY & APPAREL RECREATION: Draw natural body poses with refined, high-quality clothing that harmonizes with the scenario.
3. PRODUCT/PROJECT INTEGRITY: Replicate the product or project from Photo 2, preserving its physical features, colors, and original proportions.
4. THREE-DIMENSIONAL INTEGRATION: Position the product/project and the person in the scene integrated with realistic lighting, shadows, and reflections. The background must blend them naturally.`;
        }

        const inputIsPackshot = hybridPriority === "packshot";
        
        const rawHibridoPrompt = dynamicPrompts.hibrido_prompt || `Você é um Diretor de Fotografia, Retratista Editorial e Ad Designer Sênior especializado em campanhas de UGC (User-Generated Content) de alto nível.
Com base nas duas imagens de referência fornecidas (Foto 1 e Foto 2), gere uma imagem comercial premium de estilo de vida realista (premium lifestyle portrait/ad) integrando ambos na cena.

DIRETRIZES DE ESTÉTICA FOTOGRÁFICA UGC (SIGA ESTRITAMENTE):
- REGRA CRÍTICA DE PROIBIÇÃO DE TEXTOS (ABSOLUTELY NO TEXT - ZERO TOLERANCE): A imagem final gerada NÃO deve conter nenhum tipo de texto, palavra, letra, número, logotipo, marca d'água ou elemento gráfico escrito (como banners ou etiquetas). A imagem deve ser puramente fotográfica e limpa de qualquer tipografia.
- REGRA CRÍTICA DE ENQUADRAMENTO (ABSOLUTELY NO CROPPED HEADS - ZERO TOLERANCE): Se houver uma pessoa ou modelo na cena, você deve OBRIGATORIAMENTE exibir a cabeça, cabelo e rosto completos do modelo dentro do enquadramento, deixando um espaço livre (headroom) na parte superior. Nunca corte o topo da cabeça ou cabelo do modelo.
- Utilize iluminação profissional e natural para criar profundidade e separação tridimensional.
- Replique o visual de uma câmera profissional de alto padrão (lente 50mm ou 85mm, foco nítido, desfoque suave de fundo).
- Preserve texturas realistas e tangíveis (grão de filme, poros da pele, dobras de tecido). Evite aspecto de plástico artificial.`;

        nanobananaPrompt = `${rawHibridoPrompt}

REGRAS DE CRIAÇÃO HÍBRIDA PARA ESTA GERAÇÃO:
${priorityRule}

Cenário desejado e estilo: ${prompt}`;

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
        const rawProdutoPrompt = dynamicPrompts.produto_prompt || `Aqui está a foto de referência do produto (com fundo transparente/removido).
Você é um Diretor de Fotografia Comercial e Ad Designer Sênior especializado em campanhas de UGC (User-Generated Content). Gere uma imagem comercial realista de estilo de vida premium posicionando este produto no cenário descrito a seguir.

ATENÇÃO REGRAS CRÍTICAS DE PRESERVAÇÃO DO PRODUTO:
1. Mantenha a integridade física, formato, marcas, rótulos, logo, textos e cores do produto EXACTAMENTE como estão na foto de referência.
2. Não altere, distorça ou modifique o produto. Ele deve parecer real, nítido e idêntico à referência.
3. Posicione o produto de forma tridimensional e integrada com as sombras e reflexos adequados no cenário.
4. O texto ou rótulo do produto deve continuar legível e idêntico ao original.

DIRETRIZES DE ESTÉTICA FOTOGRÁFICA UGC:
- REGRA CRÍTICA DE PROIBIÇÃO DE TEXTOS (ABSOLUTELY NO TEXT - ZERO TOLERANCE): A imagem final gerada NÃO deve conter nenhum tipo de texto, palavra, letra, número, logotipo, marca d'água ou elemento gráfico escrito (como banners ou etiquetas). A imagem deve ser puramente fotográfica e limpa de qualquer tipografia.
- REGRA CRÍTICA DE ENQUADRAMENTO (ABSOLUTELY NO CROPPED HEADS - ZERO TOLERANCE): Se houver uma pessoa ou modelo vestindo o produto, segurando o produto ou posando na cena, você deve OBRIGATORIAMENTE exibir a cabeça, cabelo e rosto completos do modelo dentro do enquadramento. Certifique-se de deixar um espaço livre generoso acima da cabeça. NUNCA corte o topo da cabeça ou o cabelo pelas bordas da imagem.
- Integre o produto organicamente com iluminação profissional de estúdio ou natural de ambiente (ex: luz solar de janela suave).
- Simule captura fotográfica premium com câmera profissional de ponta e lente de 50mm ou 85mm.`;

        nanobananaPrompt = `${rawProdutoPrompt}

Cenário desejado e estilo: ${prompt}`;

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

      // 5.1 Roteamento Inteligente: Para fotos de produto, aciona gpt-image-2 (Image-to-Image) como motor primário!
      let effectiveLayoutStyle = layoutStyle;
      const promptLower = (prompt || "").toLowerCase();
      if (!effectiveLayoutStyle || effectiveLayoutStyle === "AUTO") {
        if (promptLower.includes("/techfuturistic") || promptLower.includes("/tech")) effectiveLayoutStyle = "PRODUCT_TECH";
        else if (promptLower.includes("/metaad") || promptLower.includes("/ad")) effectiveLayoutStyle = "PRODUCT_METAAD";
        else if (promptLower.includes("/premiumshowcase") || promptLower.includes("/showcase") || promptLower.includes("/luxo")) effectiveLayoutStyle = "PRODUCT_PREMIUM";
        else if (promptLower.includes("/3dbillboard") || promptLower.includes("/billboard")) effectiveLayoutStyle = "PRODUCT_BILLBOARD";
        else if (promptLower.includes("/lifestylecontext") || promptLower.includes("/lifestyle")) effectiveLayoutStyle = "PRODUCT_LIFESTYLE";
        else if (promptLower.includes("/dynamicaction") || promptLower.includes("/dynamic") || promptLower.includes("/splash")) effectiveLayoutStyle = "PRODUCT_DYNAMIC";
        else if (promptLower.includes("/minimalcatalog") || promptLower.includes("/catalog")) effectiveLayoutStyle = "PRODUCT_CATALOG";
        else if (promptLower.includes("/luxurycosmetics") || promptLower.includes("/cosmetics")) effectiveLayoutStyle = "PRODUCT_COSMETICS";
        else if (promptLower.includes("/flatlayknolling") || promptLower.includes("/flatlay")) effectiveLayoutStyle = "PRODUCT_FLATLAY";
        else if (promptLower.includes("/gourmetculinary") || promptLower.includes("/gourmet")) effectiveLayoutStyle = "PRODUCT_GOURMET";
        else if (promptLower.includes("/rusticorganic") || promptLower.includes("/rustic")) effectiveLayoutStyle = "PRODUCT_RUSTIC";
      }

      const isProductPreset = Boolean(effectiveLayoutStyle && effectiveLayoutStyle.startsWith("PRODUCT_"));
      const insertTextOnImage = formData.get("insertTextOnImage") !== "false";
      const textHeadline = (formData.get("textHeadline") as string) || "";
      const businessProfileRaw = (formData.get("businessProfile") as string) || "";

      let brandTypographyDirective = "";
      let brandIdentityDirective = "";
      if (businessProfileRaw) {
        try {
          const bp = JSON.parse(businessProfileRaw);
          if (bp.businessName) {
            brandIdentityDirective = `Brand: ${bp.businessName}. `;
          }
          if (bp.visualIdentity?.typography?.primaryFont) {
            brandTypographyDirective = `with ${bp.visualIdentity.typography.primaryFont} typography style`;
          } else if (bp.visualIdentity?.typography?.style) {
            brandTypographyDirective = `with ${bp.visualIdentity.typography.style} typography style`;
          }
        } catch (bpErr) {
          console.warn("[NANOBANANA_REF] Falha ao processar businessProfile:", bpErr);
        }
      }

      if (openaiKey) {
        const STYLE_LABELS: Record<string, string> = {
          PRODUCT_TECH:
            "FULL CREATIVE AGENCY POSTER — Futuristic Tech Infographic & Ad Card: Dark cyber-tech commercial poster. Central product resting on a glowing circular high-tech podium with cyan and orange neon rim lighting, floating sci-fi holographic HUD elements, a bold modern tech headline in Portuguese (pt-BR), a floating quality seal badge, and a bottom row of 4 distinct technical benefit cards with glowing line icons and Portuguese micro-descriptions. Sleek UI aesthetic, zero clipping, 20% safe margins.",
          PRODUCT_PREMIUM:
            "FULL CREATIVE AGENCY POSTER — Ultra-Luxury Commercial Ad Poster: Opulent luxury advertising poster. Top headline with golden embossed serif typography in Portuguese (pt-BR) (e.g. 'SABOR QUE IMPRESSIONA' or 'EXCELÊNCIA QUE DEFINE') with a subtle crown or star icon, sub-headline, a circular golden quality seal badge on top-right, central hero product on an artisanal dark wood slab or polished Carrara marble pedestal with atmospheric warm studio glow and subtle embers/sparks, and at the bottom a row of 4 luxury benefit badges with minimalist golden line icons and Portuguese descriptors, finished with an elegant bottom slogan bar. 20% safe margins.",
          PRODUCT_METAAD:
            "FULL CREATIVE AGENCY POSTER — Meta Ads High-Conversion Creative: High-impact social media advertising poster. Dynamic hook headline in bold modern sans-serif, 45-55% strategic negative space for copy/pricing, promotional badge or offer tag, sharp rim-light separation on the hero product, and clean bottom value-proposition badges with crisp icons in Portuguese. 20% safe margins.",
          PRODUCT_BILLBOARD:
            "FULL CREATIVE AGENCY POSTER — 3D Outdoor Billboard Campaign: Giant anamorphic 3D billboard in a premier metropolitan avenue at dusk. The product breaks out of the billboard frame with 3D depth, dramatic volumetric spotlights, luminous urban city skyline in the background, bold campaign headline, and sponsor branding marks. 20% safe margins.",
          PRODUCT_DYNAMIC:
            "FULL CREATIVE AGENCY POSTER — High-Speed Commercial Action: High-energy advertising poster with frozen water splashes, suspended ingredient slices or energy particles at 1/8000s shutter freeze. Dynamic slanted action headline in Portuguese, energy quality seal, and bottom performance badges with line icons. 20% safe margins.",
          PRODUCT_CATALOG:
            "FULL CREATIVE AGENCY POSTER — E-Commerce Clean Catalog Feature Sheet: Minimalist studio catalog presentation. Pure neutral studio backdrop, uniform shadowless illumination, clean modern headline, official product model subtitle, and bottom minimalist icon row detailing core technical dimensions and specs. 20% safe margins.",
          PRODUCT_COSMETICS:
            "FULL CREATIVE AGENCY POSTER — High-End Beauty & Skincare Editorial: Ethereal cosmetic advertising layout. Translucent acrylic ripple water tray, pastel studio backlighting, delicate organic floral petals and golden serum droplets. Refined luxury serif headline in Portuguese, dermatological/botanical trust badge, and bottom cards highlighting natural active ingredients and benefits. 20% safe margins.",
          PRODUCT_FLATLAY:
            "FULL CREATIVE AGENCY POSTER — 90-Degree Flat Lay Knolling Layout: Top-down orthographic product arrangement. Tactile linen or wood surface, perfectly organized complementary lifestyle items, elegant callout badges, and clean aesthetic typography in Portuguese. 20% safe margins.",
          PRODUCT_GOURMET:
            "FULL CREATIVE AGENCY POSTER — Artisanal Food & Culinary Campaign: Mouthwatering gourmet food advertisement. Warm rustic restaurant setting, rising steam, appetizing macro textures, rustic gold/white culinary headline, freshness guarantee stamp, and bottom cards detailing fresh ingredients, preparation craft, and premium flavor. 20% safe margins.",
          PRODUCT_RUSTIC:
            "FULL CREATIVE AGENCY POSTER — Organic & Artisanal Craft Advertisement: Raw organic wood slab, dried eucalyptus branches, warm sunbeams, handcrafted organic typography in Portuguese, eco-friendly certification seal, and bottom cards detailing sustainable materials and handmade quality. 20% safe margins.",
          PRODUCT_LIFESTYLE:
            "FULL CREATIVE AGENCY POSTER — Aspirational Lifestyle Campaign: Real-world aspirational environment with natural morning window lighting, storytelling headline in Portuguese, authentic organic integration, and subtle bottom brand value points. 20% safe margins.",
        };

        const styleHeader =
          isProductPreset && STYLE_LABELS[effectiveLayoutStyle]
            ? `[VISUAL PRESET: ${STYLE_LABELS[effectiveLayoutStyle]}] `
            : "";

        const cleanPrompt = (prompt || "")
          .replace(/\/(techfuturistic|metaad|premiumshowcase|3dbillboard|lifestylecontext|dynamicaction|minimalcatalog|luxurycosmetics|flatlayknolling|gourmetculinary|rusticorganic|ad|showcase|splash|catalog|tech|flatlay|gourmet|rustic|luxo|contexto)/gi, "")
          .trim();

        const agencyDirective = isProductPreset && insertTextOnImage
          ? `CREATIVE ADVERTISING AGENCY DIRECTIVE: Act as an award-winning Creative Advertising Agency Art Director. Construct a complete, bespoke commercial advertising poster / infographic card dynamically tailored to the product niche and the chosen preset theme. Include: (1) An impactful headline at the top in Portuguese (pt-BR) with decorative badge/icon, (2) A floating quality/guarantee seal badge, (3) The hero product prominently staged in the center with thematic lighting and atmospheric depth, (4) At the bottom, a row of 3-4 distinct benefit cards with minimalist line icons and short Portuguese descriptors tailored to the product's actual features, (5) An elegant bottom slogan bar. DIVERSIFY CREATIVELY: Adapt color palette, typography style, and iconography uniquely to this specific product type. MANDATORY: 20% safe margin from all borders to prevent text clipping.`
          : isProductPreset
          ? "Professional commercial advertising grade, stunning visual hierarchy, tactile product texture, physical contact shadows and reflections, sharp focal clarity on product details."
          : "UGC Photographic Directives: Hyper-realistic natural lighting, authentic depth of field, tactile real-world product texture, accurate physical shadows and reflections, professional commercial advertising grade.";

        let typographyPrompt = "";
        if (insertTextOnImage && textHeadline) {
          typographyPrompt = `CUSTOM HEADLINE: Use the exact headline text "${textHeadline}" for the primary title ${brandTypographyDirective || "with clean, bold, high-contrast typography"}. Place all text within the central safe area with at least 20% breathing room from borders. If the text is long, break it into 2-3 short stacked lines. Ensure perfect spelling in Portuguese, sharp crisp characters, zero typos, and professional graphic design visual hierarchy.`;
        } else if (!insertTextOnImage && !isProductPreset) {
          typographyPrompt =
            "ABSOLUTE CLEAN COMPOSITION (NO TEXT OVERLAY): Do NOT add any written headline text, slogans, letters, watermarks, or artificial graphic overlay. The composition must remain clean, authentic photographic product art.";
        }

        const displaySystemHeader = displaySystemBlueprint
          ? `[DISPLAY SYSTEM REPLICATED FROM REFERENCE PHOTO: ${displaySystemBlueprint}] `
          : "";

        const openaiPrompt = `${styleHeader}${displaySystemHeader}Commercial advertising photography featuring this exact product from the input image: ${cleanPrompt || "premium product showcase"}. ${brandIdentityDirective}${agencyDirective} ${typographyPrompt} Preserve the exact product shape, brand labels, logo, typography and physical identity with maximum fidelity. Ultra high definition, hyper-realistic, photorealistic.`;

        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            console.log(
              `[NANOBANANA_REF] 🎯 Image-to-Image ativo! Enviando foto do produto para OpenAI /v1/images/edits (gpt-image-2 - Tentativa ${attempt}/3)...`
            );
            const editsFormData = new FormData();
            const productBlob = new Blob([buffer1], { type: "image/png" });
            editsFormData.append("image", productBlob, "product.png");
            editsFormData.append("model", "gpt-image-2");
            editsFormData.append("prompt", openaiPrompt);
            editsFormData.append("n", "1");
            editsFormData.append("size", "1152x1536");

            const openaiRes = await fetch("https://api.openai.com/v1/images/edits", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${openaiKey}`,
              },
              body: editsFormData,
            });

            if (openaiRes.ok) {
              const resData = await openaiRes.json();
              let b64 = resData?.data?.[0]?.b64_json;
              if (!b64 && resData?.data?.[0]?.url) {
                const imgRes = await fetch(resData.data[0].url);
                if (imgRes.ok) {
                  const ab = await imgRes.arrayBuffer();
                  b64 = Buffer.from(ab).toString("base64");
                }
              }
              if (b64) {
                imageBytes = b64;
                modelUsed = "gpt-image-2";
                console.log(
                  `[NANOBANANA_REF] ✅ Sucesso absoluto com Image-to-Image OpenAI (gpt-image-2) na tentativa ${attempt}!`
                );
                break;
              }
            } else {
              const errTxt = await openaiRes.text();
              console.warn(
                `[NANOBANANA_REF] OpenAI /v1/images/edits (gpt-image-2) tentativa ${attempt} falhou:`,
                errTxt
              );
              if (attempt < 3) {
                await new Promise((r) => setTimeout(r, attempt * 1500));
              }
            }
          } catch (openaiErr: any) {
            console.warn(
              `[NANOBANANA_REF] Exceção no Image-to-Image (gpt-image-2 - Tentativa ${attempt}):`,
              openaiErr.message
            );
            if (attempt < 3) {
              await new Promise((r) => setTimeout(r, 1500));
            }
          }
        }
      }

      // Se não gerou via OpenAI (ou se for o fluxo padrão sem preset de produto), utiliza o Nano Banana Pro
      if (!imageBytes) {
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

      // Pós-processamento Jimp: Formatar para 1080 x 1440 (3:4 Vertical Feed)
      try {
        const jimpImage = await Jimp.read(Buffer.from(imageBytes, "base64"));
        const targetWidth = 1080;
        const targetHeight = 1440;
        const targetRatio = targetWidth / targetHeight; // 0.75

        const currentRatio = jimpImage.width / jimpImage.height;
        if (Math.abs(currentRatio - targetRatio) > 0.01) {
          let cropW = jimpImage.width;
          let cropH = jimpImage.height;
          if (currentRatio > targetRatio) {
            cropW = Math.round(jimpImage.height * targetRatio);
          } else {
            cropH = Math.round(jimpImage.width / targetRatio);
          }
          const cropX = Math.max(0, Math.floor((jimpImage.width - cropW) / 2));
          const cropY = Math.max(0, Math.floor((jimpImage.height - cropH) / 2));
          jimpImage.crop({ x: cropX, y: cropY, w: cropW, h: cropH });
        }
        jimpImage.resize({ w: targetWidth, h: targetHeight });
        const processedBuffer = await jimpImage.getBuffer("image/jpeg");
        imageBytes = processedBuffer.toString("base64");
      } catch (jimpErr) {
        console.warn("[NANOBANANA_REF] Falha ao ajustar proporção 3:4 via Jimp:", jimpErr);
      }

      // 6. Gravar a imagem gerada no Firebase Storage
      const bucket = admin
        .storage()
        .bucket(
          `${process.env.FIREBASE_PROJECT_ID || "studio-7502195980-3983c"}.firebasestorage.app`
        );
      const generatedBuffer = Buffer.from(imageBytes, "base64");
      const isOpAi =
        modelUsed?.includes("gpt-image") ||
        modelUsed?.includes("chatgpt-image") ||
        modelUsed?.includes("dall-e");

      const storageFileName = isOpAi ? "gpt_product_preset_generated.jpg" : "nanobanana_ref_generated.jpg";
      const sourceTag = isOpAi ? "gpt_product_preset" : "nanobanana_ref";
      const docId = isOpAi ? `${postId}_gpt_product_preset` : `${postId}_nanobanana_ref`;

      const fileRef = bucket.file(`${userStoragePath}/posts/${postId}/${storageFileName}`);
      const downloadToken = crypto.randomUUID();

      await fileRef.save(generatedBuffer, {
        metadata: {
          contentType: "image/jpeg",
          metadata: { firebaseStorageDownloadTokens: downloadToken },
        },
      });

      const firebaseDownloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileRef.name)}?alt=media&token=${downloadToken}`;
      console.log(
        `[GERAR_REFERENCIA] Imagem salva no Firebase Storage (${modelUsed}): ${firebaseDownloadUrl}`
      );

      // 7. Salvar e carregar referências secundárias se houver
      let firebaseSecondaryRefUrl = null;
      if (secondaryFile && secondaryGarmentPublicUrl) {
        try {
          const refRes2 = await fetch(secondaryGarmentPublicUrl);
          if (refRes2.ok) {
            const refBuffer2 = Buffer.from(await refRes2.arrayBuffer());
            const refFileRef2 = bucket.file(
              `${userStoragePath}/posts/${postId}/secondary_reference_image.jpg`
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
              `[GERAR_REFERENCIA] Foto de referência secundária salva no Storage via Admin: ${firebaseSecondaryRefUrl}`
            );
          }
        } catch (saveRefErr) {
          console.error(
            "[GERAR_REFERENCIA] Erro ao salvar referência secundária no Storage:",
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
              modelUsed: modelUsed,
              layoutStyle: layoutStyle || null,
              status: "completed",
            },
            { merge: true }
          );
      } catch (fsErr) {
        console.error("[GERAR_REFERENCIA] Erro ao atualizar Firestore:", fsErr);
      }

      try {
        const galleryRef = adminDb.collection("users").doc(userId).collection("mediaGallery");
        await galleryRef.doc(docId).set({
          id: docId,
          url: firebaseDownloadUrl,
          storagePath: fileRef.name,
          source: sourceTag,
          prompt,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          usedInPostId: null,
          fileName: storageFileName,
          modelUsed,
          caption,
        });
        console.log(`[GERAR_REFERENCIA] Imagem gravada na galeria.`);

        // Registrar log de consumo do modelo utilizado
        const isOpAi =
          modelUsed?.includes("gpt-image") ||
          modelUsed?.includes("chatgpt-image") ||
          modelUsed?.includes("dall-e");
        logApiUsage({
          userId,
          type: "image_generation",
          provider: isOpAi ? "openai" : "google_gemini",
          model: modelUsed || "gemini-3-pro-image",
          costUsd: isOpAi ? 0.04 : 0.03,
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
      const userStoragePath = await getUserStoragePathAdmin(userId);

      if (!prompt) {
        return NextResponse.json({ error: "Campo 'prompt' ausente." }, { status: 400 });
      }

      console.log(
        "[GERAR_REFERENCIA] Chamando OpenAI (gpt-image-2) para gerar imagem conceitual..."
      );
      try {
        const response = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openaiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-image-2",
            prompt: prompt,
            n: 1,
            size: "1152x1536",
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error("[GERAR_REFERENCIA] Erro na API da OpenAI (gpt-image-2):", errText);
          throw new Error(`Erro na API da OpenAI (gpt-image-2): ${errText}`);
        }

        const resData = await response.json();
        let b64Data = resData.data?.[0]?.b64_json;
        const urlData = resData.data?.[0]?.url;

        if (!b64Data && !urlData) {
          throw new Error("Nenhum dado de imagem (url ou b64_json) retornado pela OpenAI.");
        }

        if (!b64Data && urlData) {
          const urlRes = await fetch(urlData);
          if (urlRes.ok) {
            const ab = await urlRes.arrayBuffer();
            b64Data = Buffer.from(ab).toString("base64");
          }
        }

        let dalleImageUrl = urlData || "";

        if (b64Data && postId && userId) {
          console.log(
            "[GERAR_REFERENCIA] Gravando imagem Base64 da OpenAI direto no Firebase Storage..."
          );
          try {
            // Pós-processamento Jimp: Formatar para 1080 x 1440 (3:4 Vertical Feed)
            try {
              const jimpImage = await Jimp.read(Buffer.from(b64Data, "base64"));
              const targetWidth = 1080;
              const targetHeight = 1440;
              const targetRatio = targetWidth / targetHeight; // 0.75

              const currentRatio = jimpImage.width / jimpImage.height;
              if (Math.abs(currentRatio - targetRatio) > 0.01) {
                let cropW = jimpImage.width;
                let cropH = jimpImage.height;
                if (currentRatio > targetRatio) {
                  cropW = Math.round(jimpImage.height * targetRatio);
                } else {
                  cropH = Math.round(jimpImage.width / targetRatio);
                }
                const cropX = Math.max(0, Math.floor((jimpImage.width - cropW) / 2));
                const cropY = Math.max(0, Math.floor((jimpImage.height - cropH) / 2));
                jimpImage.crop({ x: cropX, y: cropY, w: cropW, h: cropH });
              }
              jimpImage.resize({ w: targetWidth, h: targetHeight });
              const processedBuffer = await jimpImage.getBuffer("image/jpeg");
              b64Data = processedBuffer.toString("base64");
            } catch (jimpErr) {
              console.warn("[SUBMIT_DALLE] Falha ao ajustar proporção 3:4 via Jimp:", jimpErr);
            }

            const bucket = admin
              .storage()
              .bucket(
                admin.app().options.storageBucket || "studio-7502195980-3983c.firebasestorage.app"
              );
            const buffer = Buffer.from(b64Data, "base64");
            const fileRef = bucket.file(`${userStoragePath}/posts/${postId}/temp_dalle.jpg`);
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
      const userStoragePath = `users/${userId}`;

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

        const userStoragePath = `users/${userId}`;
        const finalBuffer = buffer;

        const fileRef = bucket.file(`${userStoragePath}/posts/${postId}/generated_image.jpg`);
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

            const refFileRef = bucket.file(`${userStoragePath}/posts/${postId}/reference_image.jpg`);
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
              `${userStoragePath}/posts/${postId}/secondary_reference_image.jpg`
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
            storagePath: `${userStoragePath}/posts/${postId}/generated_image.jpg`,
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
      const imgRes = await fetch(url, { signal: AbortSignal.timeout(4000) });
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
