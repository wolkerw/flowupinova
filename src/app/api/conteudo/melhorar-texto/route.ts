import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { textoOriginal } = await request.json();

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

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const systemInstruction = `Você é um especialista em Copywriting para Redes Sociais.
Sua tarefa é melhorar a legenda fornecida pelo usuário.
Diretrizes:
- Corrija erros gramaticais e deixe a leitura mais fluida, persuasiva e engajadora.
- Você tem total liberdade de inserir emojis e dar uma "animada" no tom de voz.
- Mantenha estritamente o CONTEXTO e a MENSAGEM PRINCIPAL solicitados.
- Traga sempre uma nova variação criativa e diferente, assumindo que se você foi chamado novamente para o mesmo tema, o usuário não gostou da versão anterior.
- DEVOLVA APENAS A LEGENDA FINAL. Não adicione comentários, aspas no início/fim, ou explicações. O seu texto será colado diretamente na caixa de edição do usuário.`;

    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [{ text: textoOriginal }],
        },
      ],
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      generationConfig: {
        temperature: 0.9, // Temperatura mais alta para garantir variações em cada clique
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

    // Limpeza extra para garantir que não virão quebras de linha ou espaços desnecessários nas bordas
    return NextResponse.json({ textoMelhorado: textoMelhorado.trim() });
  } catch (error: any) {
    console.error("[MELHORAR_TEXTO] Erro interno:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao tentar melhorar o texto." },
      { status: 500 }
    );
  }
}
