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
        MAGAZINE_3D: "Magazine Cover 3D Parallax Effect — subject breaks through the text plane, editorial serif headline behind the person",
        CLEAN_LUXURY: "Clean Minimalist Luxury — large white negative space, soft diffused light, no clutter, ultra-premium aesthetic",
        UGC_CINEMATIC: "Authentic Lifestyle UGC Cinematic — candid real moment, natural window light, cinematic color grade",
        LIFESTYLE_HYBRID: "Lifestyle Hybrid — person in dynamic action on real-world setting, clean background, subject on one side with open space for text",
      };
      if (layoutStyle && STYLE_LABELS[layoutStyle]) {
        finalPrompt = `[VISUAL STYLE: ${STYLE_LABELS[layoutStyle]}] ${finalPrompt}`;
      }

      // 2. Anti-rewriting para GPT Image 2
      if (model === "gpt-image-2") {
        finalPrompt = `I NEED to test how the tool works with extremely simple and exact prompts. DO NOT ADD ANY DETAIL, JUST USE IT AS-IS: ${finalPrompt}`;
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
          size: "1024x1024"
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
        MAGAZINE_3D: "Magazine Cover 3D Parallax Effect — subject breaks through the text plane, editorial serif headline behind the person",
        CLEAN_LUXURY: "Clean Minimalist Luxury — large white negative space, soft diffused light, no clutter, ultra-premium aesthetic",
        UGC_CINEMATIC: "Authentic Lifestyle UGC Cinematic — candid real moment, natural window light, cinematic color grade",
        LIFESTYLE_HYBRID: "Lifestyle Hybrid — person in dynamic action on real-world setting, clean background, subject on one side with open space for text",
      };
      if (layoutStyle && STYLE_LABELS[layoutStyle]) {
        finalImagenPrompt = `[VISUAL STYLE: ${STYLE_LABELS[layoutStyle]}] ${finalImagenPrompt}`;
      }
      
      const imagenResponse = await fetch(imagenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt: finalImagenPrompt }],
          parameters: { sampleCount: 1, outputMimeType: "image/jpeg", aspectRatio: "1:1" },
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
