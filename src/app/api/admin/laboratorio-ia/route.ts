import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { model, temperature, systemPrompt, userPrompt, image1, image2, layoutStyle } = body;

    if (model.startsWith("manus")) {
      const manusKey = process.env.MANUS_API_KEY || process.env.MANUS_API;
      if (!manusKey) {
        return NextResponse.json({ error: "MANUS_API_KEY não configurada no .env" }, { status: 500 });
      }

      // Conforme o PDF, precisamos criar uma Task na Manus
      const manusUrl = "https://api.manus.ai/v2/task.create"; 
      
      const finalContent = `${systemPrompt || ""}\n\n${userPrompt || "Gere um conteúdo de marketing."}`;

      const payload = {
        message: { content: finalContent }
      };

      const response = await fetch(manusUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-manus-api-key": manusKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("[LAB_IA] Falha na API do Manus:", errText);
        return NextResponse.json({ error: "Erro na API do Manus", details: errText }, { status: response.status });
      }

      const resData = await response.json();
      const taskId = resData.task_id || resData.id;

      if (!taskId) {
        return NextResponse.json({ error: "API Manus não retornou task_id", details: resData }, { status: 500 });
      }

      // Salva no Firestore para controlar o andamento (necessita adminDb import)
      const { adminDb } = await import("@/lib/firebase-admin");
      await adminDb.collection("manus_tasks").doc(taskId).set({
        taskId,
        status: "pending",
        createdAt: new Date().toISOString(),
        model
      });

      // Retorna para o Frontend que estamos aguardando
      return NextResponse.json({ 
        pending: true,
        taskId, 
        message: "Tarefa enviada. Aguardando processamento da Manus..." 
      });
    }

    // Fluxo para OpenAI (GPT Image / DALL-E)
    if (model.includes("gpt-image") || model.includes("chatgpt-image")) {
      const openaiKey = process.env.OPENAI_API_KEY;
      if (!openaiKey) {
        return NextResponse.json({ error: "OPENAI_API_KEY não configurada no .env" }, { status: 500 });
      }

      const openaiUrl = "https://api.openai.com/v1/images/generations";
      let finalPrompt = [systemPrompt, userPrompt].filter(Boolean).join("\n\n") || "Um objeto aleatório";

      // 1. Injetar Estilo no topo (Mesma lógica do app)
      const STYLE_LABELS: Record<string, string> = {
        CINEMATIC: "Cinematic Photography — dramatic lighting, deep shadows, 85mm f/1.8 lens",
        STUDIO_CLEAN: "Studio Clean Photography — elegant seamless neutral backdrop, soft uniform lighting",
        URBAN_LIFESTYLE: "Authentic Urban Lifestyle — real outdoor city setting, natural daylight",
        MINIMALIST: "Minimalist Design — spacious composition, 50-60% clean negative space, modern sophisticated aesthetic",
        TECH_3D: "Premium 3D Tech Illustration — Octane/Redshift render style, vibrant colors, glass and metallic textures",
        MAGAZINE_3D: "Magazine 3D Cover — high-fashion magazine cover style, integrated typography with 3D depth, subject overlaps title letters",
        PRODUCT_TECH: "High-Conversion Sci-Fi Tech Commercial Infographic & Ad Poster — The product is the central hero resting on a futuristic glowing circular podium with ambient neon orange and cyan rim lighting. Sleek dark cyber-tech background with holographic HUD circular elements, benefit feature cards with glowing circular icons detailing specifications, bold high-contrast headline typography, and bottom specification badges. Professional e-commerce advertising grade.",
        PRODUCT_METAAD: "High-Conversion Meta/Instagram Ad Poster — The primary product is the central hero, framed with deliberate 45-55% clean negative space (top or side area) reserved for ad copy, headlines, and call-to-actions. High-contrast commercial studio lighting with a soft key light and sharp edge separation rim light. True-to-life product proportions, tactile textures, and vibrant commercial appeal.",
        PRODUCT_PREMIUM: "Ultra-Luxury Commercial Product Showcase Poster — The product is elegantly staged on a geometric architectural pedestal (such as polished white Carrara marble or frosted translucent glass). Three-point studio lighting with a large overhead softbox, subtle caustic reflections, soft contact shadows (ambient occlusion), and an ultra-clean minimalist luxury atmosphere.",
        PRODUCT_BILLBOARD: "3D Outdoor Billboard Campaign Poster — A hyper-realistic 3D outdoor billboard at dusk featuring this exact product in monumental scale breaking through the billboard borders, with ambient city glow, dramatic volumetric spotlights, and sharp brand fidelity.",
        PRODUCT_LIFESTYLE: "Aspirational Lifestyle Product Placement — Authentic contemporary interior setting with natural window side lighting and gentle soft-focus depth of field.",
        PRODUCT_DYNAMIC: "High-Speed Commercial Advertising Action Poster — The product is surrounded by suspended elements: crystal-clear high-speed frozen water droplets, dynamic liquid splashes, floating natural ingredients, or energetic light trails. Studio strobe lighting with 1/8000s shutter freeze effect, creating a fresh, energetic hero visual.",
        PRODUCT_CATALOG: "Clean Minimalist E-Commerce Catalog — Seamless infinite pure studio backdrop, perfectly uniform shadowless diffused light, f/11 edge-to-edge sharpness, hyper-accurate colors and textures.",
        PRODUCT_COSMETICS: "Luxury Cosmetics & Skincare Advertising Poster — Translucent acrylic ripple water tray, delicate organic floral petals, golden texture droplets, soft pastel studio backlighting, and ethereal beauty aesthetic.",
        PRODUCT_FLATLAY: "90-Degree Flat Lay Knolling Commercial Poster — Top-down orthographic view, geometric prop organization, tactile natural linen and wooden background, balanced studio lighting.",
        PRODUCT_GOURMET: "Commercial Food & Culinary Advertising — Appetizing rich textures, delicate rising steam, warm restaurant ambient glow, mouthwatering macro focus, and gourmet culinary staging.",
        PRODUCT_RUSTIC: "Rustic & Artisanal Botanical Product Staging — Raw dark wood slab, dried eucalyptus branches, natural linen texture, and warm gentle sunbeams through a window.",
      };
      if (layoutStyle && STYLE_LABELS[layoutStyle]) {
        finalPrompt = `[VISUAL STYLE: ${STYLE_LABELS[layoutStyle]}] ${finalPrompt}`;
      }

      const response = await fetch(openaiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: model,
          prompt: finalPrompt,
          n: 1,
          size: model === "gpt-image-2" ? "1152x1536" : "1024x1024"
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("[LAB_IA] Falha na API da OpenAI:", errText);
        return NextResponse.json(
          { error: `Erro na API da OpenAI (${model})`, details: errText },
          { status: response.status }
        );
      }

      const resData = await response.json();
      const b64 = resData?.data?.[0]?.b64_json;
      const imageUrl = resData?.data?.[0]?.url;

      if (b64) {
        return NextResponse.json({
          result: {
            message: `Imagem gerada com sucesso via ${model.toUpperCase()}`,
            imageUrl: `data:image/png;base64,${b64}`
          }
        });
      } else if (imageUrl) {
        return NextResponse.json({
          result: {
            message: `Imagem gerada com sucesso via ${model.toUpperCase()}`,
            imageUrl: imageUrl
          }
        });
      }

      return NextResponse.json({ result: resData });
    }

    // Fluxo padrão para o Gemini ou Imagen
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY não configurada." }, { status: 500 });
    }

    if (model.startsWith("imagen")) {
      // Fluxo para Imagen 4
      const imagenUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`;
      let finalImagenPrompt = [systemPrompt, userPrompt].filter(Boolean).join("\n\n") || "Um objeto aleatório";
      
      const STYLE_LABELS: Record<string, string> = {
        CINEMATIC: "Cinematic Photography — dramatic lighting, deep shadows, 85mm f/1.8 lens",
        STUDIO_CLEAN: "Studio Clean Photography — elegant seamless neutral backdrop, soft uniform lighting",
        URBAN_LIFESTYLE: "Authentic Urban Lifestyle — real outdoor city setting, natural daylight",
        MINIMALIST: "Minimalist Design — spacious composition, 50-60% clean negative space, modern sophisticated aesthetic",
        TECH_3D: "Premium 3D Tech Illustration — Octane/Redshift render style, vibrant colors, glass and metallic textures",
        MAGAZINE_3D: "Magazine 3D Cover — high-fashion magazine cover style, integrated typography with 3D depth, subject overlaps title letters",
      };
      if (layoutStyle && STYLE_LABELS[layoutStyle]) {
        finalImagenPrompt = `[VISUAL STYLE: ${STYLE_LABELS[layoutStyle]}] ${finalImagenPrompt}`;
      }
      
      const imagenResponse = await fetch(imagenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt: finalImagenPrompt }],
          parameters: { sampleCount: 1, outputMimeType: "image/jpeg", aspectRatio: "3:4" },
        }),
      });

      if (!imagenResponse.ok) {
        const errText = await imagenResponse.text();
        console.error("[LAB_IA] Falha na API do Imagen:", errText);
        return NextResponse.json(
          { error: "Erro na API da IA (Imagen)", details: errText },
          { status: imagenResponse.status }
        );
      }

      const data = await imagenResponse.json();
      const bytes = data?.predictions?.[0]?.bytesBase64Encoded;
      
      if (bytes) {
        return NextResponse.json({ 
          result: { 
            message: "Imagem gerada com sucesso via Imagen 4", 
            imageUrl: `data:image/jpeg;base64,${bytes}` 
          } 
        });
      }
      
      return NextResponse.json({ result: data });
    }

    // A URL muda levemente dependendo da string exata do modelo, mas a v1beta é padrão para quase todos
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const parts: any[] = [];
    
    if (userPrompt) {
      parts.push({ text: userPrompt });
    }

    if (image1) {
      parts.push({
        inlineData: {
          mimeType: image1.mimeType,
          data: image1.base64,
        },
      });
    }

    if (image2) {
      parts.push({
        inlineData: {
          mimeType: image2.mimeType,
          data: image2.base64,
        },
      });
    }

    const requestBody: any = {
      contents: [
        {
          role: "user",
          parts,
        },
      ],
      generationConfig: {
        temperature: temperature ?? 0.7,
        ...(model.includes("image") ? { responseModalities: ["IMAGE"] } : {})
      },
    };

    if (systemPrompt) {
      requestBody.systemInstruction = {
        parts: [{ text: systemPrompt }],
      };
    }

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[LAB_IA] Falha na API do Gemini:", errText);
      return NextResponse.json(
        { error: "Erro na API da IA", details: errText },
        { status: response.status }
      );
    }

    const resData = await response.json();
    const part = resData.candidates?.[0]?.content?.parts?.[0];
    const resultText = part?.text || "";
    const inlineData = part?.inlineData;

    if (inlineData && inlineData.data) {
      return NextResponse.json({
        result: {
          message: "Imagem gerada com sucesso via Nano Banana",
          imageUrl: `data:${inlineData.mimeType};base64,${inlineData.data}`
        }
      });
    }

    // Tentamos dar um parse caso a resposta seja um JSON
    let parsedResult = resultText;
    try {
      if (resultText.startsWith("```json")) {
        const clean = resultText.replace(/```json\n?/, "").replace(/```$/, "");
        parsedResult = JSON.parse(clean);
      } else {
        parsedResult = JSON.parse(resultText);
      }
    } catch {
      // Ignora, é só texto plano
    }

    return NextResponse.json({ result: parsedResult });
  } catch (error: any) {
    console.error("[LAB_IA] Erro interno:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor do laboratório.", details: error.message },
      { status: 500 }
    );
  }
}
