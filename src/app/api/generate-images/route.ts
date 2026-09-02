import { NextResponse } from "next/server";
import { admin, adminDb } from "@/lib/firebase-admin";
import { getUserStoragePathAdmin } from "@/lib/services/storage-utils-admin";
import crypto from "crypto";
import { logApiUsage } from "@/lib/services/api-usage-service-admin";
import { Jimp } from "jimp";

export const maxDuration = 300;

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 5,
  delay = 3000
): Promise<Response> {
  let lastResponse: Response | null = null;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      lastResponse = response;

      if (
        response.status === 429 ||
        response.status === 503 ||
        (response.status >= 500 && response.status <= 599)
      ) {
        console.warn(
          `[GENERATE_IMAGES_NATIVE] Recebido status ${response.status}. Tentando novamente em ${delay}ms... (Tentativa ${i + 1}/${retries})`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
        continue;
      }

      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      console.warn(
        `[GENERATE_IMAGES_NATIVE] Erro de rede ou desconhecido. Tentando novamente em ${delay}ms... (Tentativa ${i + 1}/${retries})`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
  return lastResponse || fetch(url, options);
}

export async function POST(request: Request) {
  try {
    const { prompt, postId, fileName, userId, content, layoutStyle, businessProfile } =
      await request.json();

    if (!prompt || !postId || !fileName || !userId) {
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes: prompt, postId, fileName, userId" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error(
        "[GENERATE_IMAGES_NATIVE_ERROR] Chave GEMINI_API_KEY não encontrada no arquivo de ambiente."
      );
      return NextResponse.json(
        { error: "Chave de API do Gemini ausente no servidor." },
        { status: 500 }
      );
    }

    // 1. Carregar as diretrizes visuais e paleta de cores da marca (Prioriza o businessProfile recebido do payload)
    let finalPrompt = prompt;
    try {
      let brandKit = businessProfile?.brandKit;
      let primaryColor = businessProfile?.primaryColor || brandKit?.primaryColor;
      let secondaryColor = businessProfile?.secondaryColor || brandKit?.secondaryColor;

      if (!brandKit) {
        const docSnap = await admin.firestore().doc(`users/${userId}/business/onboarding`).get();
        if (docSnap.exists) {
          const data = docSnap.data();
          brandKit = data?.brandKit;
          primaryColor = primaryColor || data?.primaryColor || brandKit?.primaryColor;
          secondaryColor = secondaryColor || data?.secondaryColor || brandKit?.secondaryColor;
        }
      }

      let brandEnhancements = "";
      if (brandKit?.visualGuidelines) {
        brandEnhancements += ` Siga o estilo visual de: ${brandKit.visualGuidelines.trim()}.`;
      }
      if (primaryColor || secondaryColor) {
        const colors = [];
        if (primaryColor) colors.push(primaryColor);
        if (secondaryColor) colors.push(secondaryColor);
        brandEnhancements += ` Integre de forma harmônica elementos de cenário ou iluminação sutil que remetam aos tons da marca (${colors.join(" e ")}).`;
      }

      if (brandEnhancements) {
        // Remover qualquer ponto final redundante para concatenar de forma limpa
        const cleanPrompt = prompt.trim().endsWith(".")
          ? prompt.trim().slice(0, -1)
          : prompt.trim();
        finalPrompt = `${cleanPrompt}.${brandEnhancements}`;
        console.log(
          `[GENERATE_IMAGES_NATIVE] Prompt estendido com diretrizes do Brand Kit: ${finalPrompt}`
        );
      }
    } catch (dbError) {
      console.warn(
        "[GENERATE_IMAGES_NATIVE] Falha ao carregar diretrizes de marca do Firestore (usando prompt original):",
        dbError
      );
    }

    // 2. Injetar o estilo selecionado no início do prompt (user prompt layer)
    // Isso garante que o modelo visual processe a instrução de estilo ANTES do conteúdo narrativo,
    // mesmo que o gpt-image-2 tente reescrever o restante do prompt.
    const STYLE_LABELS: Record<string, string> = {
      CINEMATIC: "Cinematic Photography — dramatic lighting, deep shadows, 85mm f/1.8 lens",
      STUDIO_CLEAN:
        "Studio Clean Photography — elegant seamless neutral backdrop, soft uniform lighting",
      URBAN_LIFESTYLE: "Authentic Urban Lifestyle — real outdoor city setting, natural daylight",
      MINIMALIST:
        "Minimalist Design — spacious composition, 50-60% clean negative space, modern sophisticated aesthetic",
      TECH_3D:
        "Premium 3D Tech Illustration — Octane/Redshift render style, vibrant colors, glass and metallic textures",
      MAGAZINE_3D:
        "Magazine 3D Cover — high-fashion magazine cover style, integrated typography with 3D depth, subject overlaps title letters",
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
      PRODUCT_TESTIMONIAL:
        "FULL CREATIVE AGENCY POSTER — Customer Testimonial & 5-Star Review Ad: High-conversion social proof advertisement. The physical product is the prominent hero on an elegant studio surface, accompanied by a clean floating glassmorphism 5-star rating card and customer testimonial quote. 20% safe margins.",
      PRODUCT_UGC:
        "AUTHENTIC UGC PRODUCT PHOTOGRAPHY: Real-world smartphone-style aesthetic (iPhone photography). Tight macro close-up of a hand holding or interacting with the hero product in an authentic sunlit environment (cafe, office, or modern room), with soft background blur. Real-world authentic texture.",
      PRODUCT_PACKAGING:
        "FULL CREATIVE AGENCY POSTER — Luxury Product & Packaging Showcase: Staging of the hero product positioned directly next to its open premium rigid gift box and embossed brand packaging on a textured stone or wood pedestal. Studio rim lighting highlighting materials and embossing. 20% safe margins.",
      PRODUCT_CUSTOMER_QUOTE:
        "FULL CREATIVE AGENCY POSTER — Customer Photo & Quote Commercial Ad: Authentic customer moment with tight macro close-up on the product in use, paired with an elegant floating quotation bubble containing a heartfelt customer praise quote. Customer in soft background bokeh. 20% safe margins.",
      PRODUCT_UNBOXING:
        "FULL CREATIVE AGENCY POSTER — Aesthetic Unboxing Experience Ad: Top-down / angle unboxing presentation. An open luxury matte unboxing box with delicate tissue paper revealing the pristine hero product nestled inside, surrounded by branded ribbon and thank you card on a clean tabletop. 20% safe margins.",
      PRODUCT_MOCKUP:
        "FULL CREATIVE AGENCY POSTER — Ultra-Clean 3D Agency Product Mockup: Floating minimalist commercial 3D render of the hero product with soft directional contact shadow, translucent materials, studio softbox illumination, and aesthetic clean pastel gradient backdrop. 20% safe margins.",
    };
    if (layoutStyle && STYLE_LABELS[layoutStyle]) {
      const heroProductRule = layoutStyle.startsWith("PRODUCT_")
        ? " [CRITICAL FRAMING MANDATE — HERO PRODUCT MACRO CLOSE-UP (ABSOLUTE PROTAGONIST): The physical product MUST ALWAYS BE THE MASSIVE CENTRAL HERO occupying 55% to 80% of the entire image canvas in high-detail macro or close-up studio photography. STRICTLY FORBIDDEN: DO NOT generate full-body human models, standing people, or wide environmental room shots where the product appears small. If human interaction is depicted, the camera MUST BE A TIGHT MACRO CLOSE-UP focused solely on the product on the wrist/hand, with the human person completely out of focus or cropped out of frame.]"
        : "";
      const styleHeader = `${heroProductRule}[VISUAL STYLE: ${STYLE_LABELS[layoutStyle]}] `;
      finalPrompt = styleHeader + finalPrompt;
      if (layoutStyle.startsWith("PRODUCT_")) {
        finalPrompt = finalPrompt
          .replace(/full[- ]body (shot|portrait|fashion|photo)[^\.]*\.?/gi, "")
          .replace(/entire person visible from head to feet[^\.]*\.?/gi, "")
          .replace(/showing the model from the (very )?top of their head down to their feet[^\.]*\.?/gi, "")
          .replace(/a (confident|fit|handsome|beautiful)? ?(male|female)? ?(model|athlete|man|woman|person) (is the central subject|stands in a relaxed[^\.]*|is standing[^\.]*|stands[^\.]*)\.?/gi, "")
          .replace(/no cropping of head or hair[^\.]*\.?/gi, "")
          .replace(/generous headroom above the head[^\.]*\.?/gi, "")
          .trim();
      }
      console.log(`[GENERATE_IMAGES_NATIVE] Estilo '${layoutStyle}' injetado no início do prompt.`);
    }

    // 2. Modelo Principal Estrito: gpt-image-2 (OpenAI) é SEMPRE o motor primário absoluto
    const MODELS_CHAIN = [
      { provider: "openai", model: "gpt-image-2" },
      { provider: "openai", model: "dall-e-3" },
      { provider: "google", model: "gemini-3-pro-image" },
    ];

    let imageBytes: string | null = null;
    let modelUsed = "";
    let lastError = "";
    const openaiKey = process.env.OPENAI_API_KEY;

    for (const config of MODELS_CHAIN) {
      console.log(
        `[GENERATE_IMAGES_NATIVE] Tentando modelo principal ${config.model} (${config.provider}) para o post ${postId} (Slot: ${fileName})...`
      );

      try {
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
            prompt: finalPrompt,
            n: 1,
            size: nativeSize,
          };

          const response = await fetchWithRetry("https://api.openai.com/v1/images/generations", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${openaiKey}`,
            },
            body: JSON.stringify(payload),
          });

          if (response.ok) {
            const data = await response.json();
            let b64 = data?.data?.[0]?.b64_json;
            if (!b64 && data?.data?.[0]?.url) {
              console.log(
                `[GENERATE_IMAGES_NATIVE] URL recebida da OpenAI (${config.model}), baixando imagem...`
              );
              const imgRes = await fetch(data.data[0].url);
              if (imgRes.ok) {
                const ab = await imgRes.arrayBuffer();
                b64 = Buffer.from(ab).toString("base64");
              }
            }
            if (b64) {
              imageBytes = b64;
              modelUsed = config.model;
              console.log(`[GENERATE_IMAGES_NATIVE] ✅ Sucesso com o modelo ${config.model}!`);
              break;
            }
          }
          const errText = await response.text().catch(() => `status ${response.status}`);
          lastError = `Modelo OpenAI ${config.model} falhou: ${errText.substring(0, 250)}`;
          console.error(`[GENERATE_IMAGES_NATIVE] ${lastError}`);
          throw new Error(lastError);
        } else if (config.model.startsWith("gemini-")) {
          // Google Gemini Image (Nano Banana)
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${apiKey}`;
          const response = await fetchWithRetry(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `[FORMAT: Vertical 3:4 portrait (1080x1440)] Framed vertically in 3:4 aspect ratio (1080x1440 portrait format). ${finalPrompt}`,
                    },
                  ],
                },
              ],
              generationConfig: {
                responseModalities: ["IMAGE"],
              },
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const bytes = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (bytes) {
              imageBytes = bytes;
              modelUsed = config.model;
              console.log(`[GENERATE_IMAGES_NATIVE] ✅ Sucesso com o modelo ${config.model}!`);
              break;
            }
          }
          const errText = await response.text().catch(() => `status ${response.status}`);
          lastError = `Modelo Google Gemini ${config.model} falhou: ${errText.substring(0, 250)}`;
          console.error(`[GENERATE_IMAGES_NATIVE] ${lastError}`);
          throw new Error(lastError);
        } else {
          // Google Imagen
          const imagenUrl = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:predict?key=${apiKey}`;
          const response = await fetchWithRetry(imagenUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              instances: [{ prompt: finalPrompt }],
              parameters: {
                sampleCount: 1,
                outputMimeType: "image/jpeg",
                aspectRatio: "3:4",
              },
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data?.predictions?.[0]?.bytesBase64Encoded) {
              imageBytes = data.predictions[0].bytesBase64Encoded;
              modelUsed = config.model;
              console.log(`[GENERATE_IMAGES_NATIVE] ✅ Sucesso com o modelo ${config.model}!`);
              break;
            }
          }
          const errText = await response.text().catch(() => `status ${response.status}`);
          lastError = `Modelo Google ${config.model} falhou: ${errText.substring(0, 250)}`;
          console.error(`[GENERATE_IMAGES_NATIVE] ${lastError}`);
          throw new Error(lastError);
        }
      } catch (err: any) {
        console.warn(
          `[GENERATE_IMAGES_NATIVE] Exceção na tentativa (${config.model}): ${err.message}. Tentando próximo modelo...`
        );
      }
    }

    if (!imageBytes) {
      console.error(
        `[GENERATE_IMAGES_NATIVE] Todos os modelos de imagem falharam. Último erro: ${lastError}`
      );
      throw new Error(`Falha na geração de imagem. ${lastError}`);
    }

    // 2. Converter o base64 para Buffer binário e padronizar com precisão em 1080x1440 (3:4)
    let buffer = Buffer.from(imageBytes, "base64");
    try {
      const image = await Jimp.read(buffer);
      const targetWidth = 1080;
      const targetHeight = 1440;
      const targetRatio = targetWidth / targetHeight; // 0.75 (3:4)
      const currentRatio = image.width / image.height;

      if (Math.abs(currentRatio - targetRatio) > 0.01) {
        let cropW = image.width;
        let cropH = image.height;
        if (currentRatio > targetRatio) {
          // Imagem mais larga (ex: horizontal 16:9 ou 1:1)
          cropW = Math.round(image.height * targetRatio);
          const x = Math.max(0, Math.floor((image.width - cropW) / 2));
          image.crop({ x, y: 0, w: cropW, h: cropH });
        } else {
          // Imagem mais alta (ex: vertical 9:16)
          cropH = Math.round(image.width / targetRatio);
          const y = Math.max(0, Math.floor((image.height - cropH) / 2));
          image.crop({ x: 0, y, w: cropW, h: cropH });
        }
      }

      image.resize({ w: targetWidth, h: targetHeight });
      buffer = await image.getBuffer("image/jpeg");
      console.log(
        `[GENERATE_IMAGES_NATIVE] Imagem concept_${fileName} formatada com precisão para 1080x1440 (3:4).`
      );
    } catch (jimpErr) {
      console.warn("[GENERATE_IMAGES_NATIVE] Falha ao ajustar proporção 3:4 com Jimp:", jimpErr);
    }

    // 3. Fazer o upload do buffer diretamente para o Firebase Storage usando o Firebase Admin SDK no bucket correto
    const projectId = process.env.FIREBASE_PROJECT_ID || "studio-7502195980-3983c";
    const bucket = admin.storage().bucket(`${projectId}.firebasestorage.app`);

    // Caminho da imagem conceito estruturado no Storage
    const userStoragePath = await getUserStoragePathAdmin(userId);
    const fileRef = bucket.file(
      `${userStoragePath}/posts/${postId}/concepts/image_${fileName}.jpg`
    );
    const downloadToken = crypto.randomUUID();

    await fileRef.save(buffer, {
      metadata: {
        contentType: "image/jpeg",
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
        },
      },
    });

    // 4. Construir a URL de download pública e estável do Firebase Storage
    const firebaseDownloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileRef.name)}?alt=media&token=${downloadToken}`;
    console.log(
      `[GENERATE_IMAGES_NATIVE] Sucesso absoluto! Imagem conceito ${fileName} salva de forma estável no Firebase Storage: ${firebaseDownloadUrl}`
    );

    // 5. Cadastrar automaticamente o registro da imagem gerada na subcoleção mediaGallery do Firestore do lojista
    try {
      const galleryRef = admin
        .firestore()
        .collection("users")
        .doc(userId)
        .collection("mediaGallery");
      const galleryMediaId = `${postId}_concept_${fileName}`;

      await galleryRef.doc(galleryMediaId).set({
        id: galleryMediaId,
        url: firebaseDownloadUrl,
        storagePath: fileRef.name,
        source: "wizard_generation",
        prompt: prompt,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        usedInPostId: null, // Inicialmente livre/não publicada
        fileName: `concept_${fileName}.jpg`,
        modelUsed: modelUsed || "gpt-image-2",
        caption: content
          ? `${content.titulo || ""}\n\n${content.subtitulo || ""}\n\n${Array.isArray(content.hashtags) ? content.hashtags.join(" ") : ""}`.trim()
          : null,
      });
      console.log(
        `[GENERATE_IMAGES_NATIVE] Imagem catalogada com sucesso na subcoleção mediaGallery do Firestore: ${galleryMediaId}`
      );

      // Log opcional de faturamento interno
      logApiUsage({
        userId,
        type: "image_generation",
        provider: modelUsed.includes("gpt") ? "openai" : "google_vertex",
        model: modelUsed || "gpt-image-2",
        costUsd: 0.03, // custo estimado padrão
      });
    } catch (firestoreError) {
      console.error(
        "[GENERATE_IMAGES_NATIVE_ERROR] Falha ao catalogar imagem gerada no Firestore:",
        firestoreError
      );
    }

    return NextResponse.json({
      success: true,
      imageUrl: firebaseDownloadUrl,
      fileName: fileName,
    });
  } catch (error: any) {
    console.error("[GENERATE_IMAGES_NATIVE_ERROR] Erro no processamento da imagem:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno ao processar a geração de imagem.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
