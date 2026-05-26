import { NextResponse } from "next/server";

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const { summary } = await request.json();

    if (!summary) {
      return NextResponse.json({ error: "Resumo/tema não enviado" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("[GENERATE_TEXT_ERROR] Chave GEMINI_API_KEY não encontrada no arquivo de ambiente.");
      return NextResponse.json(
        { error: "Configure a chave GEMINI_API_KEY no arquivo .env.local para habilitar a geração de texto." },
        { status: 500 }
      );
    }

    // 1. Prompt do Copywriter Viral
    const systemInstructionText = `
Você é um Copywriter Sênior e Especialista em Crescimento Viral no Instagram. Sua especialidade é extrair o máximo de potencial de qualquer tema de negócio e transformá-lo em postagens que geram salvamentos, compartilhamentos e engajamento orgânico.

# OBJETIVO
Gerar exatamente 3 ideias virais e estratégicas de posts para o Instagram a partir do tema fornecido como entrada. Cada postagem deve oferecer valor real e informativo ao leitor, com gancho comercial sutil.

# INSTRUÇÕES DE ESTRUTURAÇÃO
1. Crie exatamente 3 ideias totalmente distintas entre si.
2. Cada publicação DEVE conter:
   - titulo: Uma frase curta (máx 45 caracteres), instigante e magnética (gancho forte).
   - subtitulo: Um pequeno parágrafo dinâmico (1 a 2 frases) detalhando o conteúdo de valor, finalizando com uma chamada para ação (CTA) curta.
   - hashtags: Uma lista com 3 a 5 hashtags focadas no nicho da publicação.

# FORMATO DE SAÍDA EXIGIDO (JSON ESTRITO)
Responda exclusivamente no formato JSON abaixo, sem qualquer introdução, conclusão, marcações de bloco de código markdown (como \`\`\`json) ou textos adicionais:
{
  "publicacoes": [
    {
      "titulo": "Título Magnético 1 🚀",
      "subtitulo": "Parágrafo curto de alto valor que aprofunda o tema e convida o leitor a interagir. O que você acha disso?",
      "hashtags": ["#Negocio", "#DicaDeMarketing", "#Sucesso"]
    },
    {
      "titulo": "Título Magnético 2 ✨",
      "subtitulo": "Conteúdo estratégico contendo dicas práticas de rápida aplicação e leitura dinâmica. Salve para não esquecer!",
      "hashtags": ["#Hamburgueria", "#Gourmet", "#DicaRapida"]
    },
    {
      "titulo": "Título Magnético 3 💡",
      "subtitulo": "Post focado em autoridade e dor do cliente, mostrando a solução ideal de forma persuasiva. Clique no link para saber mais!",
      "hashtags": ["#Estrategia", "#Inovacao", "#Resultados"]
    }
  ]
}
`;

    // 2. Chamar a API do Gemini com Fallback Resiliente
    const modelsToTry = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"];
    let aiResponseText = "";
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        console.log(`[GENERATE_TEXT] Enviando requisição para a API do Gemini usando modelo: ${model}...`);
        
        const response = await fetch(geminiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemInstructionText }]
            },
            contents: [
              {
                role: "user",
                parts: [{ text: `Tema/Resumo do post: ${summary}` }]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              responseMimeType: "application/json"
            }
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Erro na API do Gemini (status ${response.status}): ${errorText}`);
        }

        const resData = await response.json();
        const candidateText = resData?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!candidateText) {
          throw new Error(`Resposta do Gemini vazia ou em formato inesperado`);
        }

        aiResponseText = candidateText.trim();
        break;
      } catch (err: any) {
        console.warn(`[GENERATE_TEXT_WARN] Falha ao chamar o modelo ${model}:`, err.message || err);
        lastError = err;
      }
    }

    if (!aiResponseText) {
      throw new Error(`Todos os modelos do Gemini falharam. Último erro: ${lastError?.message || lastError}`);
    }

    // 3. Processar e estruturar o JSON de retorno
    let parsedData: any;
    try {
      parsedData = JSON.parse(aiResponseText);
    } catch (e) {
      const cleanedText = aiResponseText.replace(/```json|```/g, "").trim();
      parsedData = JSON.parse(cleanedText);
    }

    const publicacoes = parsedData.publicacoes || parsedData;

    if (!Array.isArray(publicacoes)) {
      throw new Error("O JSON retornado pela IA não contém um array de publicações válido.");
    }

    const processedData = publicacoes.map((item: any) => {
      const title = item.titulo || item.título;
      
      let hashtags = item.hashtags;
      if (typeof hashtags === "string") {
        hashtags = hashtags.split(/[ ,]+/).filter(Boolean).map((h: string) => (h.startsWith("#") ? h : `#${h}`));
      } else if (Array.isArray(hashtags)) {
        hashtags = hashtags.map((h: any) => String(h)).filter(Boolean).map((h: string) => (h.startsWith("#") ? h : `#${h}`));
      } else {
        hashtags = [];
      }

      return {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        titulo: title || "Ideia sem título",
        subtitulo: item.subtitulo || "Subtítulo não gerado",
        hashtags: hashtags,
        url_da_imagem: null,
        aprovado_por_humano: false
      };
    });

    console.log(`[GENERATE_TEXT] Sucesso ao gerar ${processedData.length} publicações.`);
    return NextResponse.json(processedData);
  } catch (error: any) {
    console.error("[GENERATE_TEXT_ERROR] Erro interno do servidor:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao gerar texto.", details: error.message },
      { status: 500 }
    );
  }
}
