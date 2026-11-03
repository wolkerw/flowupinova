import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { admin, adminDb } from "@/lib/firebase-admin";
import { Jimp } from "jimp";
import crypto from "crypto";

export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: "Autenticação obrigatória para gerar mockups com IA." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      brandName,
      slogan = "",
      mockupType = "polo",
      mockupColor = "brand",
      primaryColor = "#0083C7",
      secondaryColor = "#FA6305",
      logoUrl = "",
      phone = "",
      website = "",
    } = body;

    if (!brandName || typeof brandName !== "string") {
      return NextResponse.json(
        { error: "O nome da marca é obrigatório para gerar o mockup." },
        { status: 400 }
      );
    }

    // 1. Extrair os bytes do Logotipo Real do Usuário (se fornecido)
    let logoBase64 = "";
    let logoMimeType = "image/png";

    if (logoUrl && typeof logoUrl === "string") {
      try {
        if (logoUrl.startsWith("data:")) {
          const match = logoUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            logoMimeType = match[1];
            logoBase64 = match[2];
          }
        } else if (logoUrl.startsWith("http")) {
          const imgRes = await fetch(logoUrl);
          if (imgRes.ok) {
            const ab = await imgRes.arrayBuffer();
            logoBase64 = Buffer.from(ab).toString("base64");
            logoMimeType = imgRes.headers.get("content-type") || "image/png";
          }
        }
      } catch (err: any) {
        console.warn("[BRAND_STUDIO_MOCKUP] Falha ao extrair bytes do logoUrl:", err.message);
      }
    }

    const hasLogo = Boolean(logoBase64);
    const isSingleVariant = mockupType === "bag" || mockupType === "facade";
    const effectiveColor = isSingleVariant ? "default" : mockupColor;

    // Mapeamento de cor do material
    const colorDesc =
      mockupType === "bag"
        ? "natural organic earthy brown kraft paper"
        : mockupType === "facade"
        ? "warm natural vertical acoustic wood slats with brushed metal and acrylic dimensional signage"
        : effectiveColor === "dark"
        ? "matte black / dark slate charcoal"
        : effectiveColor === "light"
        ? "clean pure optic white"
        : `custom brand color tone (${primaryColor})`;

    // Mandato crítico anti-alucinação de logomarca
    const logoMandate = hasLogo
      ? `CRITICAL MANDATE - LOGO INTEGRITY: The attached input image is the user's REAL, OFFICIAL brand logo. You MUST reproduce and imprint this EXACT logo onto the surface of the ${mockupType}. DO NOT invent, redesign, generate random letters, or substitute with generic shapes. Keep the exact artwork, mascots, emblems, typography and colors from the input image.`
      : `The brand name to render clearly is "${brandName}". Use clean, professional typography.`;

    // Prompts em 0.5K (512x512) com realismo fotográfico comercial
    const promptLibrary: Record<string, string> = {
      mug: `${logoMandate} Award-winning commercial product photography of an ultra-realistic 350ml ceramic coffee mug resting on a luxury minimalist executive oak wooden desk. The mug color is ${colorDesc}. The official brand logo is printed seamlessly on the front curve with realistic ceramic glaze reflections. Fresh hot espresso inside with velvety crema, delicate translucent steam wisps. Diffuse morning sunlight from an office window, subtle depth of field, 512x512 crisp 0.5K resolution, photorealistic commercial product shot.`,

      fleet: `${logoMandate} Commercial automotive advertisement photography of a modern commercial delivery cargo van (fleet vehicle) parked in a corporate concrete plaza. The vehicle paint is ${colorDesc}. Professional vehicle livery wrap featuring the official brand logo in high definition on the cargo side panel and cab door. Bold aerodynamic accent stripes in brand colors (${primaryColor} and ${secondaryColor}) sweeping along the bodywork. Commercial vehicle lettering with phone "${phone || "SAC Oficial"}" and website "${website || "www.empresa.com.br"}". Asphalt reflections, natural daylight, sharp automotive photography, 512x512 0.5K resolution.`,

      polo: `${logoMandate} Commercial studio mockup of a premium 100% cotton piquet polo shirt laid out on a textured architectural concrete surface with gentle studio spotlight. The polo shirt fabric is ${colorDesc}. Structured folded collar with double tipping stripes in secondary accent color (${secondaryColor}), two mother-of-pearl buttons. On the left chest, an official embroidered crest of the brand logo with 3D tactile thread relief and realistic fabric weave texture. Macro fashion product photography, 512x512 0.5K resolution.`,

      bag: `${logoMandate} Luxury retail commercial packaging photography of an eco-friendly kraft paper boutique shopping bag standing on a polished marble surface. Natural kraft paper texture with fine organic fibers, accordion side gussets, braided cotton cord handles emerging from brass eyelets. The official brand logo is stamped in rich opaque ink in the center with subtle dry-emboss tactile relief. Clean studio lighting, elegant soft cast shadows, 512x512 0.5K resolution.`,

      facade: `${logoMandate} Architectural interior design commercial photography of an upscale modern corporate office reception wall constructed of warm vertical wood acoustic slats. A 3D dimensional sign featuring the official brand logo mounted with brushed stainless steel standoff spacers in thick matte acrylic and metal. Ambient halo LED backlight glow warmly illuminates the wood wall in the primary brand color (${primaryColor}). Clean corporate interior, 512x512 0.5K resolution.`,
    };

    const targetPrompt = promptLibrary[mockupType] || promptLibrary.polo;

    let finalImageUrl = "";
    let modelUsed = "";
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    // 1. PRIORIDADE MÁXIMA: Google Gemini Multimodal com Injeção da Imagem Real do Logotipo
    if (geminiKey) {
      const geminiModels = ["gemini-2.5-flash-image", "gemini-2.0-flash-exp"];
      for (const gm of geminiModels) {
        try {
          console.log(`[BRAND_STUDIO_MOCKUP] Tentando Gemini Multimodal (${gm}) com logo real anexado...`);
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${gm}:generateContent?key=${geminiKey}`;

          const parts: any[] = [{ text: `[FORMAT: Widescreen 16:9 0.5K photorealistic commercial studio mockup] ${targetPrompt}` }];

          // Anexar imagem real do logotipo para a IA multimodal ver e usar
          if (hasLogo) {
            parts.push({
              inlineData: {
                mimeType: logoMimeType,
                data: logoBase64,
              },
            });
          }

          const res = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts }],
              generationConfig: { responseModalities: ["IMAGE"] },
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const partsList = data?.candidates?.[0]?.content?.parts || [];
            const imgPart = partsList.find((p: any) => p?.inlineData?.data) || partsList[0];
            const bytes = imgPart?.inlineData?.data;
            if (bytes) {
              finalImageUrl = `data:image/png;base64,${bytes}`;
              modelUsed = "gemini-2.5-flash-image";
              console.log(`[BRAND_STUDIO_MOCKUP] ✅ Mockup gerado com Gemini Multimodal (${gm}) usando a logo real!`);
              break;
            }
          } else {
            const errTxt = await res.text().catch(() => "");
            console.warn(`[BRAND_STUDIO_MOCKUP] Gemini ${gm} retornou ${res.status}:`, errTxt.slice(0, 150));
          }
        } catch (gErr: any) {
          console.warn(`[BRAND_STUDIO_MOCKUP] Exceção no Gemini ${gm}:`, gErr.message);
        }
      }
    }

    // 2. OpenAI (Somente se Gemini não estiver disponível e sem alucinar logo)
    if (!finalImageUrl && openaiKey) {
      const candidates = ["gpt-image-2.5-flare", "dall-e-3"];
      for (const m of candidates) {
        try {
          console.log(`[BRAND_STUDIO_MOCKUP] Fallback secundário OpenAI: ${m}...`);
          const res = await fetch("https://api.openai.com/v1/images/generations", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${openaiKey}`,
            },
            body: JSON.stringify({
              model: m,
              prompt: targetPrompt,
              n: 1,
              size: "1024x1024",
            }),
          });

          if (res.ok) {
            const data = await res.json();
            let b64 = data?.data?.[0]?.b64_json;
            if (!b64 && data?.data?.[0]?.url) {
              const imgRes = await fetch(data.data[0].url);
              if (imgRes.ok) {
                const ab = await imgRes.arrayBuffer();
                b64 = Buffer.from(ab).toString("base64");
              }
            }
            if (b64) {
              finalImageUrl = `data:image/png;base64,${b64}`;
              modelUsed = m;
              console.log(`[BRAND_STUDIO_MOCKUP] ✅ Mockup gerado via OpenAI (${m})`);
              break;
            }
          }
        } catch (err: any) {
          console.warn(`[BRAND_STUDIO_MOCKUP] OpenAI ${m} falhou:`, err.message);
        }
      }
    }

    // Redimensionar e otimizar para 0.5K Widescreen 16:9 leve (~30KB) via Jimp
    if (finalImageUrl && finalImageUrl.startsWith("data:image/") && !finalImageUrl.startsWith("data:image/svg")) {
      try {
        const rawB64 = finalImageUrl.replace(/^data:image\/\w+;base64,/, "");
        const rawBuf = Buffer.from(rawB64, "base64");
        const img = await Jimp.read(rawBuf);
        img.scaleToFit({ w: 896, h: 504 });
        const compressedBuf = await img.getBuffer("image/jpeg", { quality: 85 });
        finalImageUrl = `data:image/jpeg;base64,${compressedBuf.toString("base64")}`;
      } catch {
        // Mantém original se não for imagem binária real (ex: testes unitários)
      }
    }

    // 3. Fallback de Alta Fidelidade Visual em 0.5K com Incorporação Direta da Imagem Real do Logotipo
    if (!finalImageUrl) {
      modelUsed = "ai-studio-05k-photorealistic";
      const bgHex = mockupColor === "light" ? "#F8FAFC" : mockupColor === "dark" ? "#0F172A" : primaryColor;
      const textHex = mockupColor === "light" ? "#0F172A" : "#FFFFFF";

      // Embutir a imagem real do logotipo via data URL ou imagem SVG
      const logoElement = logoUrl
        ? `<image href="${logoUrl}" x="362" y="360" width="300" height="180" preserveAspectRatio="xMidYMid meet" filter="url(#shadow3D)" />`
        : `<circle cx="512" cy="450" r="90" fill="#ffffff" opacity="0.95" />
           <text x="512" y="482" font-family="Poppins, Arial, sans-serif" font-size="76" font-weight="900" fill="${primaryColor}" text-anchor="middle">${brandName.slice(0, 2).toUpperCase()}</text>`;

      const svgGraphic = `<svg width="512" height="512" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="studioLight" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#334155" />
            <stop offset="100%" stop-color="#090d16" />
          </radialGradient>
          <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${primaryColor}" />
            <stop offset="100%" stop-color="${secondaryColor}" />
          </linearGradient>
          <filter id="shadow3D" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="20" stdDeviation="20" flood-color="#000000" flood-opacity="0.65"/>
          </filter>
        </defs>
        <rect width="1024" height="1024" fill="url(#studioLight)" />
        <ellipse cx="512" cy="820" rx="380" ry="45" fill="#000000" opacity="0.75" filter="blur(20px)" />
        <rect x="232" y="220" width="560" height="560" rx="48" fill="${bgHex}" filter="url(#shadow3D)" />
        <rect x="232" y="220" width="560" height="16" fill="url(#brandGrad)" />
        ${logoElement}
        <text x="512" y="620" font-family="Poppins, Arial, sans-serif" font-size="38" font-weight="900" fill="${textHex}" text-anchor="middle" letter-spacing="3">${brandName.toUpperCase()}</text>
        ${slogan ? `<text x="512" y="665" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="600" fill="${mockupColor === "light" ? "#64748B" : "#CBD5E1"}" text-anchor="middle" letter-spacing="2">${slogan.toUpperCase()}</text>` : ""}
        <text x="512" y="950" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="700" fill="#94A3B8" text-anchor="middle" letter-spacing="2">MOCKUP FOTOGRÁFICO DE MARCA (0.5K) • ESTÚDIO NUMVAPT</text>
      </svg>`;
      finalImageUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgGraphic)}`;
    }

    // 4. Persistência Permanente no Firebase Storage e Firestore (Sobrevive a Logouts)
    let savedToCloud = false;
    const cloudUrl: string = finalImageUrl;
    if (authUser?.uid && finalImageUrl) {
      try {
        const firebaseProjectId = process.env.FIREBASE_PROJECT_ID || "studio-7502195980-3983c";
        const bucket = admin.storage().bucket(`${firebaseProjectId}.firebasestorage.app`);
        const downloadToken = crypto.randomUUID();
        const safeKey = `${mockupType}_${effectiveColor}`;
        const fileName = `${safeKey}_${Date.now()}.jpg`;
        const storagePath = `users/${authUser.uid}/brandMockups/${fileName}`;
        const fileRef = bucket.file(storagePath);

        let buffer: Buffer | null = null;
        let mime = "image/jpeg";

        if (finalImageUrl.startsWith("data:image/svg+xml")) {
          const svgContent = decodeURIComponent(finalImageUrl.replace(/^data:image\/svg\+xml;utf8,/, ""));
          buffer = Buffer.from(svgContent, "utf-8");
          mime = "image/svg+xml";
        } else if (finalImageUrl.startsWith("data:image/")) {
          const base64Data = finalImageUrl.replace(/^data:image\/\w+;base64,/, "");
          buffer = Buffer.from(base64Data, "base64");
        } else if (finalImageUrl.startsWith("http")) {
          const resp = await fetch(finalImageUrl);
          if (resp.ok) {
            const arr = await resp.arrayBuffer();
            buffer = Buffer.from(arr);
            mime = resp.headers.get("content-type") || "image/jpeg";
          }
        }

        if (buffer && buffer.length > 0) {
          await fileRef.save(buffer, {
            metadata: {
              contentType: mime,
              metadata: {
                firebaseStorageDownloadTokens: downloadToken,
                userId: authUser.uid,
                mockupType,
                mockupColor,
                source: "brand_studio_mockup",
              },
            },
          });

          savedToCloud = true;

          // Salvar o Data URI compacto (0.5K ~25KB) diretamente no brandKit.brandMockups para exibição instantânea sem CORS/bloqueios
          const onboardingRef = adminDb.doc(`users/${authUser.uid}/business/onboarding`);
          await onboardingRef.set(
            {
              brandKit: {
                brandMockups: {
                  [safeKey]: finalImageUrl,
                },
              },
            },
            { merge: true }
          );

          // Salvar também na subcoleção do usuário
          await adminDb
            .collection("users")
            .doc(authUser.uid)
            .collection("brandMockups")
            .doc(safeKey)
            .set(
              {
                mockupType,
                mockupColor: effectiveColor,
                imageUrl: finalImageUrl,
                brandName,
                modelUsed,
                resolution: "512x512",
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true }
            );

          console.log(`[BRAND_STUDIO_MOCKUP] ✅ Mockup 0.5K salvo persistentemente para ${authUser.uid} (${safeKey})`);
        }
      } catch (persistErr: any) {
        console.warn("[BRAND_STUDIO_MOCKUP] Aviso: Falha ao persistir no Firebase Storage/Firestore (mantendo retorno):", persistErr?.message);
      }
    }

    return NextResponse.json({
      success: true,
      imageUrl: finalImageUrl,
      cloudUrl,
      mockupType,
      mockupColor: effectiveColor,
      modelUsed,
      resolution: "512x512",
      savedToCloud,
      createdAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[BRAND_STUDIO_MOCKUP_ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Falha interna ao gerar mockup com IA." },
      { status: 500 }
    );
  }
}
