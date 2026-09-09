import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    let dynamicPrompts: any = {};
    try {
      const docSnap = await adminDb.collection("system_settings").doc("prompts").get();
      if (docSnap.exists) {
        dynamicPrompts = docSnap.data();
      }
    } catch (dbErr) {
      console.error("[MELHORAR_TEXTO] Erro ao buscar prompts do DB:", dbErr);
    }

    const { textoOriginal, format, businessProfile, contextInfo } = await request.json();

    if (!textoOriginal || typeof textoOriginal !== "string") {
      return NextResponse.json({ error: "Texto original não fornecido." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("[MELHORAR_TEXTO] Chave da API do Gemini não configurada.");
      return NextResponse.json(
        { error: "Erro de configuração no servidor." },
        { status: 500 }
      );
    }

    const isStructured = format === "structured";
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;

    let brandContext = "";
    if (businessProfile) {
      const bParts = [];
      if (businessProfile.name) bParts.push(`Nome da Empresa: ${businessProfile.name}`);
      if (businessProfile.category) bParts.push(`Nicho/Categoria: ${businessProfile.category}`);
      if (businessProfile.toneOfVoice) bParts.push(`Tom de Voz: ${businessProfile.toneOfVoice}`);
      if (bParts.length > 0) {
        brandContext = `\nContexto da Marca:\n${bParts.join("\n")}`;
      }
    }

    let inputPrompt = textoOriginal;
    if (contextInfo && contextInfo.trim()) {
      inputPrompt = `Texto/Rascunho do usuário:\n"${textoOriginal}"\n\nContexto do produto/ideia:\n"${contextInfo.trim()}"`;
    }

    let systemInstruction = "";
    if (isStructured) {
      systemInstruction = dynamicPrompts.melhorar_texto_estruturado_prompt || `Você é um Copywriter Sênior e Estrategista de Redes Sociais de alta conversão (Instagram, Facebook e LinkedIn).
Sua missão é aprimorar o texto/rascunho fornecido pelo usuário e entregar uma publicação completa, magnética e profissional.
${brandContext}

Você DEVE responder ESTRITAMENTE em formato JSON com a seguinte estrutura:
{
  "titulo": "Título curto, instigante e magnético (máximo 8 a 10 palavras, sem hashtags)",
  "legenda": "A legenda completa, persuasiva e fluida, com excelente leitura, parágrafos bem espaçados, emojis naturais e um forte Call to Action (CTA) no final.",
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5"]
}

DIRETRIZES:
- Mantenha a essência, benefícios e objetivo do texto original do usuário.
- O título deve capturar a atenção imediata de quem rola o feed.
- A legenda deve ser envolvente e convidativa, formatada com quebras de linha duplas entre parágrafos curtos.
- Gere de 4 a 8 hashtags altamente relevantes ao tema e nicho.
- Retorne apenas o JSON puro, sem markdown delimitador (não use \`\`\`json), sem textos extras.`;
    } else {
      systemInstruction = dynamicPrompts.melhorar_texto_prompt || `Você é um especialista em Copywriting para Redes Sociais.
Sua tarefa é melhorar a legenda fornecida pelo usuário.
Diretrizes:
- Corrija erros gramaticais e deixe a leitura mais fluida, persuasiva e engajadora.
- Você tem total liberdade de inserir emojis e dar uma "animada" no tom de voz.
- Mantenha estritamente o CONTEXTO e a MENSAGEM PRINCIPAL solicitados.
- Traga sempre uma nova variação criativa e diferente, assumindo que se você foi chamado novamente para o mesmo tema, o usuário não gostou da versão anterior.
- DEVOLVA APENAS A LEGENDA FINAL. Não adicione comentários, aspas no início/fim, ou explicações. O seu texto será colado diretamente na caixa de edição do usuário.`;
    }

    const requestBody: any = {
      contents: [
        {
          role: "user",
          parts: [{ text: inputPrompt }],
        },
      ],
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      generationConfig: {
        temperature: 0.9,
        ...(isStructured ? { responseMimeType: "application/json" } : {}),
      },
    };

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[MELHORAR_TEXTO] Falha na API do Gemini:", errText);
      return NextResponse.json(
        { error: "Falha ao se comunicar com a IA para melhorar o texto." },
        { status: 502 }
      );
    }

    const resData = await response.json();
    const textoMelhorado = resData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textoMelhorado) {
      throw new Error("A IA não retornou um texto válido.");
    }

    if (isStructured) {
      let parsed: any = {};
      try {
        parsed = JSON.parse(textoMelhorado);
      } catch (e) {
        const cleaned = textoMelhorado.replace(/```json/g, "").replace(/```/g, "").trim();
        parsed = JSON.parse(cleaned);
      }

      const cleanHashtags = Array.isArray(parsed.hashtags)
        ? parsed.hashtags.map((h: string) => (h.startsWith("#") ? h : `#${h}`))
        : [];

      return NextResponse.json({
        titulo: parsed.titulo?.trim() || "Destaque",
        legenda: parsed.legenda?.trim() || parsed.subtitulo?.trim() || textoMelhorado.trim(),
        hashtags: cleanHashtags,
        textoMelhorado: parsed.legenda?.trim() || textoMelhorado.trim(),
      });
    }

    // Retorno legado para requisições simples
    return NextResponse.json({ textoMelhorado: textoMelhorado.trim() });
  } catch (error: any) {
    console.error("[MELHORAR_TEXTO] Erro interno:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao tentar melhorar o texto." },
      { status: 500 }
    );
  }
}
