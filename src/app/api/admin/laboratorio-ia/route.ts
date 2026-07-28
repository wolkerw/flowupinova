import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { model, temperature, systemPrompt, userPrompt, image1, image2 } = body;

    if (model.startsWith("manus")) {
      const manusKey = process.env.MANUS_API;
      if (!manusKey) {
        return NextResponse.json({ error: "MANUS_API não configurada no .env" }, { status: 500 });
      }

      const messages: any[] = [];
      if (systemPrompt) {
        messages.push({ role: "system", content: systemPrompt });
      }
      
      const userContent: any[] = [];
      if (userPrompt) {
        userContent.push({ type: "text", text: userPrompt });
      }
      if (image1) {
        userContent.push({
          type: "image_url",
          image_url: { url: `data:${image1.mimeType};base64,${image1.base64}` },
        });
      }
      if (image2) {
        userContent.push({
          type: "image_url",
          image_url: { url: `data:${image2.mimeType};base64,${image2.base64}` },
        });
      }
      messages.push({ role: "user", content: userContent });

      // Assumindo endpoint compatível com OpenAI para o Manus
      const manusUrl = "https://api.manus.im/v1/chat/completions"; 
      const response = await fetch(manusUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${manusKey}`,
        },
        body: JSON.stringify({
          model: model, 
          messages,
          temperature: temperature ?? 0.7,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("[LAB_IA] Falha na API do Manus:", errText);
        return NextResponse.json({ error: "Erro na API do Manus", details: errText }, { status: response.status });
      }

      const resData = await response.json();
      const resultText = resData.choices?.[0]?.message?.content || "";
      let parsedResult = resultText;
      try {
        if (resultText.startsWith("```json")) {
          const clean = resultText.replace(/```json\n?/, "").replace(/```$/, "");
          parsedResult = JSON.parse(clean);
        } else {
          parsedResult = JSON.parse(resultText);
        }
      } catch { }

      return NextResponse.json({ result: parsedResult });
    }

    // Fluxo padrão para o Gemini
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY não configurada." }, { status: 500 });
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
    const resultText = resData.candidates?.[0]?.content?.parts?.[0]?.text || "";

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
