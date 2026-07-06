import { NextResponse } from "next/server";

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const { summary, businessProfile } = await request.json();

    if (!summary) {
      return NextResponse.json({ error: "Resumo/tema não enviado" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error(
        "[GENERATE_TEXT_ERROR] Chave GEMINI_API_KEY não encontrada no arquivo de ambiente."
      );
      return NextResponse.json(
        {
          error:
            "Configure a chave GEMINI_API_KEY no arquivo .env.local para habilitar a geração de texto.",
        },
        { status: 500 }
      );
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

        if (brandKit.personas && brandKit.personas.length > 0) {
          const personasInfo = brandKit.personas
            .map((p: any, idx: number) => {
              return `Persona ${idx + 1} (${p.name || "Sem nome"}):
    * Perfil: ${p.profile || "N/A"}
    * Dores/Desafios: ${p.painPoints || "N/A"}
    * Motivação de Compra: ${p.buyingMotivation || "N/A"}`;
            })
            .join("\n");
          parts.push(`- **Personas Identificadas para Direcionamento**:\n${personasInfo}`);
        }
      }

      if (parts.length > 0) {
        businessContext = `
# CONTEXTO DE MARCA E IDENTIDADE DO NEGÓCIO DO USUÁRIO
Você é o redator oficial desta marca específica. Use as informações reais do negócio abaixo para adaptar as abordagens, criar títulos contextualizados e aplicar o tom de voz correto:
${parts.join("\n")}

DIRETRIZES DE PERSONALIZAÇÃO:
1. **Nome e Slogan**: Faça alusão ou use o nome da marca nos posts se fizer sentido comercial.
2. **Tom de Voz e Vibe**: Escreva as legendas aplicando de forma consistente o Tom de Voz definido (${businessProfile.toneOfVoice || "profissional e persuasivo"}). Se houver "Preferências Estilísticas/Vibe" na memória, adapte a linguagem para harmonizar com esse estilo (ex: se for luxuoso, use linguagem mais refinada, sofisticada e exclusiva; se for rústico/casual/afetivo, use algo mais acolhedor, simples e próximo).
3. **Foco, Diferenciais e Produtos**: Direcione os ganchos mentais e os benefícios dos posts ao Público-Alvo / Perfil do Cliente ideal da memória. Destaque fortemente o Diferencial/Posicionamento da Marca (se presente na memória) e cite ou crie ganchos baseados nos Produtos/Serviços Principais coletados na memória.
4. **Hashtags do Nicho**: Suas sugestões de hashtags devem incluir de 2 a 3 hashtags exclusivas e relevantes ao nicho de atuação (${businessProfile.category || "negócios"}).
5. **Segmentação por Personas**: Como você deve propor exatamente 3 postagens (Ideias 1, 2 e 3):
   - Se houver **Personas da Marca** descritas no contexto acima, você DEVE direcionar cada uma das 3 propostas de post de forma personalizada para uma das personas cadastradas.
   - O Post 1 deve ser escrito especificamente para resolver as dores e apelar às motivações de compra da **Persona 1**.
   - O Post 2 deve fazer o mesmo para a **Persona 2** (se houver, caso contrário use a Persona 1 com outra abordagem).
   - O Post 3 deve fazer o mesmo para a **Persona 3** (se houver, caso contrário use outra persona disponível).
   - Ajuste sutilmente o tom da escrita de cada legenda para ressonar com o perfil específico dessa persona (ex: falar de homologação e segurança para o comprador técnico, ou facilidade e resultados rápidos para o gerente operacional).
`;
      }
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.toLocaleString("pt-BR", { month: "long" });

    // 1. Prompt do Copywriter Viral
    const systemInstructionText = `
Você é um Copywriter Sênior e Especialista em Crescimento Viral no Instagram. Sua especialidade é extrair o máximo de potencial de qualquer tema de negócio e transformá-lo em postagens que geram salvamentos, compartilhamentos e engajamento orgânico.

CONTEXTO TEMPORAL: Estamos no ano de ${currentYear}, no mês de ${currentMonth}. Sempre utilize esse ano/contexto atual caso precise citar datas, anos ou campanhas promocionais sazonais. Nunca cite o ano de 2024.
${businessContext}
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
        console.log(
          `[GENERATE_TEXT] Enviando requisição para a API do Gemini usando modelo: ${model}...`
        );

        const response = await fetch(geminiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemInstructionText }],
            },
            contents: [
              {
                role: "user",
                parts: [{ text: `Tema/Resumo do post: ${summary}` }],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              responseMimeType: "application/json",
            },
          }),
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
      throw new Error(
        `Todos os modelos do Gemini falharam. Último erro: ${lastError?.message || lastError}`
      );
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
        hashtags = hashtags
          .split(/[ ,]+/)
          .filter(Boolean)
          .map((h: string) => (h.startsWith("#") ? h : `#${h}`));
      } else if (Array.isArray(hashtags)) {
        hashtags = hashtags
          .map((h: any) => String(h))
          .filter(Boolean)
          .map((h: string) => (h.startsWith("#") ? h : `#${h}`));
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
        aprovado_por_humano: false,
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
