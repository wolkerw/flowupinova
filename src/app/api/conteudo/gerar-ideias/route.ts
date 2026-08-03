import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const maxDuration = 300; // Define o timeout máximo no Vercel (5 minutos)

function safeJsonParse(rawText: any, fallback = null) {
  if (!rawText || typeof rawText !== "string") return fallback;
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.substring(7);
  else if (cleaned.startsWith("```")) cleaned = cleaned.substring(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  cleaned = cleaned.trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("[GERAR_IDEIAS] Erro no JSON.parse. Raw text:", cleaned.substring(0, 500));
    try {
      const sanitized = cleaned.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
      return JSON.parse(sanitized);
    } catch (e2) {
      if (fallback) return fallback;
      throw e;
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("[GERAR_IDEIAS] Chave da API do Gemini não configurada.");
      return NextResponse.json({ error: "Erro de configuração no servidor." }, { status: 500 });
    }

    let dynamicPrompts: any = {};
    try {
      const docSnap = await adminDb.collection("system_settings").doc("prompts").get();
      if (docSnap.exists) {
        dynamicPrompts = docSnap.data();
      }
    } catch (dbErr) {
      console.error("[GERAR_IDEIAS] Erro ao buscar prompts do DB:", dbErr);
    }

    const formData = await request.formData();
    const imageUrl = (formData.get("imageUrl") as string) || "";
    const description = (formData.get("referenceDescription") as string) || "";
    const businessProfileJson = formData.get("businessProfile") as string;
    
    let businessProfile = null;
    if (businessProfileJson) {
      try {
        businessProfile = JSON.parse(businessProfileJson);
      } catch (e) {
        console.error("Erro ao parsear businessProfile:", e);
      }
    }

    // Montar o contexto do negócio
    let businessContext = "";
    if (businessProfile) {
      const parts = [];
      if (businessProfile.name) parts.push(`- Nome da Marca/Empresa: ${businessProfile.name}`);
      if (businessProfile.category) parts.push(`- Nicho/Categoria: ${businessProfile.category}`);
      if (businessProfile.description) parts.push(`- Descrição: ${businessProfile.description}`);
      if (businessProfile.slogan) parts.push(`- Slogan: ${businessProfile.slogan}`);
      if (businessProfile.targetAudience) parts.push(`- Público-Alvo: ${businessProfile.targetAudience}`);
      if (businessProfile.toneOfVoice) parts.push(`- Tom de Voz: ${businessProfile.toneOfVoice}`);
      
      if (parts.length > 0) {
        businessContext = `\n# CONTEXTO DE MARCA E NEGÓCIO\n${parts.join("\n")}\n`;
      }
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.toLocaleString("pt-BR", { month: "long" });

    // Preparar o prompt
    const basePrompt = dynamicPrompts.ideias_post_prompt || `Você é um especialista em criação de conteúdo viral para redes sociais. 
Gere 3 ideias de post com base no tema. 
Retorne um JSON contendo a chave "publicacoes" como um array de objetos com "titulo", "subtitulo" e "hashtags" (array de strings).`;

    let finalPrompt = basePrompt
      .replace("[ANO]", currentYear.toString())
      .replace("[MES]", currentMonth)
      .replace("[DESCRICAO]", description)
      .replace("[CONTEXTO_DO_NEGOCIO]", businessContext);

    // Instrução extra garantindo JSON caso falte
    if (!finalPrompt.includes("JSON")) {
      finalPrompt += `\n\nATENÇÃO: Você DEVE retornar EXCLUSIVAMENTE um JSON válido com a seguinte estrutura:
{
  "publicacoes": [
    {
      "titulo": "exemplo",
      "subtitulo": "exemplo",
      "hashtags": ["#exemplo"]
    }
  ]
}`;
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-latest:generateContent?key=${apiKey}`;
    const parts: any[] = [];

    // Se tiver imagem URL, vamos baixar e converter pra base64 pra usar visão do Gemini
    if (imageUrl && imageUrl.startsWith("http")) {
      try {
        const imageResponse = await fetch(imageUrl);
        if (imageResponse.ok) {
          const arrayBuffer = await imageResponse.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const mimeType = imageResponse.headers.get("content-type") || "image/jpeg";
          const base64Data = buffer.toString("base64");
          
          parts.push({
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          });
        }
      } catch (imgErr) {
        console.error("[GERAR_IDEIAS] Erro ao buscar imagem para a IA:", imgErr);
        // Segue sem a imagem se falhar
      }
    }

    parts.push({ text: `Contexto do Negócio: ${businessContext}\n\nDescrição/Tema: ${description}` });

    const requestBody = {
      contents: [
        {
          role: "user",
          parts: parts,
        },
      ],
      systemInstruction: {
        parts: [{ text: finalPrompt }],
      },
      generationConfig: {
        temperature: 0.9,
        responseMimeType: "application/json",
      },
    };

    console.log("[GERAR_IDEIAS] Chamando Gemini 1.5 Pro Vision...");
    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[GERAR_IDEIAS] Erro do Gemini:", errText);
      return NextResponse.json(
        { error: "Falha ao gerar ideias através da IA." },
        { status: 502 }
      );
    }

    const resData = await response.json();
    const generatedText = resData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error("Resposta vazia da IA.");
    }

    const parsedData = safeJsonParse(generatedText);
    
    if (parsedData && parsedData.publicacoes && Array.isArray(parsedData.publicacoes)) {
      return NextResponse.json(parsedData.publicacoes);
    } else if (Array.isArray(parsedData)) {
      return NextResponse.json(parsedData);
    } else {
      return NextResponse.json([parsedData]);
    }

  } catch (error: any) {
    console.error("[GERAR_IDEIAS] Erro interno:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao tentar gerar as ideias de post." },
      { status: 500 }
    );
  }
}
