import { NextResponse, type NextRequest } from "next/server";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const { segmento, descricaoNegocio, textoPost, objetivo } = await request.json();

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
      "AIzaSyD2guuZbx-YhbrQD_-kEHCRlPyjcmVAiwE";

    if (!apiKey) {
      console.error("[GERAR_COPILOT_ERROR] Chave do Gemini não configurada.");
      return NextResponse.json(
        { error: "Configuração do servidor ausente: Chave da API do Gemini não encontrada." },
        { status: 500 }
      );
    }

    console.log(`[GERAR_COPILOT] Gerando sugestões com Gemini para objetivo: ${objetivo}...`);

    const now = new Date();
    const currentYear = now.getFullYear();

    // Criar o prompt detalhado para o especialista em marketing local da Meta
    const prompt = `
Você é um especialista em marketing digital da Meta (Facebook e Instagram) focado em pequenos e médios negócios locais brasileiros.
CONTEXTO TEMPORAL: Estamos no ano de ${currentYear}. Sempre utilize esse ano atual caso precise citar datas, anos ou campanhas promocionais sazonais. Nunca cite o ano de 2024.
Sua tarefa é criar títulos (headlines) magnéticos e copies altamente persuasivas para impulsionar um anúncio na região local.

INFORMAÇÕES DO NEGÓCIO:
- Nome do segmento: ${segmento || "Negócio Local"}
- Descrição da Empresa: ${descricaoNegocio || "Uma empresa focada no atendimento de qualidade aos seus clientes."}

CONTEXTO DO POST (SE HOUVER):
- Texto original da publicação a ser impulsionada: "${textoPost || "Sem publicação de referência - Criar do zero."}"

OBJETIVO DA CAMPANHA:
- ${objetivo === "MESSAGES" ? "Garantir contatos imediatos e mensagens iniciadas no WhatsApp ou Direct de clientes interessados." : objetivo === "LINK_CLICKS" ? "Direcionar tráfego qualificado de visitantes para o site da empresa ou perfil comercial." : "Gerar o máximo de engajamento local, curtidas, comentários e salvamentos."}

INSTRUÇÕES DE ESCRITA:
- Use uma linguagem amigável, direta, cativante e focada nos benefícios (copywriting moderno).
- Não use jargões difíceis. Fale diretamente com as dores e desejos dos moradores da região.
- Os títulos (Headlines) devem ser curtos, marcantes e diretos (máximo 40 caracteres).
- Os textos (Ad Copies) devem conter no máximo 3 pequenos parágrafos, usar emojis de forma natural e incluir um forte Call to Action (CTA).
- Retorne exatamente 3 sugestões diferentes e criativas.

Você deve responder estritamente com um objeto JSON válido, sem markdown ou formatações extras, seguindo exatamente o seguinte esquema JSON:
{
  "sugestoes": [
    {
      "titulo": "Título Curto Magnético 1",
      "texto": "Texto completo do anúncio 1 com chamada para ação no final.",
      "ctaSugerido": "Tipo de botão recomendado: SEND_MESSAGE, LEARN_MORE, CALL_NOW, GET_DIRECTIONS ou SHOP_NOW"
    },
    {
      "titulo": "Título Curto Magnético 2",
      "texto": "Texto completo do anúncio 2 com chamada para ação no final.",
      "ctaSugerido": "Tipo de botão recomendado: SEND_MESSAGE, LEARN_MORE, CALL_NOW, GET_DIRECTIONS ou SHOP_NOW"
    },
    {
      "titulo": "Título Curto Magnético 3",
      "texto": "Texto completo do anúncio 3 com chamada para ação no final.",
      "ctaSugerido": "Tipo de botão recomendado: SEND_MESSAGE, LEARN_MORE, CALL_NOW, GET_DIRECTIONS ou SHOP_NOW"
    }
  ]
}
`.trim();

    // Chamada direta para o Gemini REST API (gemini-3.5-flash)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("[GERAR_COPILOT_ERROR] Erro na API do Gemini:", errorText);
      return NextResponse.json(
        { error: "Erro ao se comunicar com a API do Gemini.", details: errorText },
        { status: geminiResponse.status }
      );
    }

    const data = await geminiResponse.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      console.error("[GERAR_COPILOT_ERROR] Resposta vazia da API do Gemini:", data);
      throw new Error("A API do Gemini retornou uma estrutura de dados vazia.");
    }

    // Tentar fazer o parse do JSON retornado
    try {
      const parsedData = JSON.parse(rawText.trim());
      return NextResponse.json(parsedData);
    } catch (parseErr) {
      console.error(
        "[GERAR_COPILOT_ERROR] Falha ao converter texto do Gemini para JSON. Conteúdo bruto:",
        rawText
      );

      // Tratamento de contingência básico caso não venha JSON estrito
      return NextResponse.json({
        sugestoes: [
          {
            titulo: "Chame a atenção da sua região!",
            texto: `${textoPost || "Confira nossas novidades e ofertas imperdíveis!"} Entre em contato hoje mesmo!`,
            ctaSugerido: "SEND_MESSAGE",
          },
          {
            titulo: "Qualidade garantida perto de você",
            texto: `Temos tudo o que você precisa no setor de ${segmento || "serviços locais"}. Venha nos conhecer!`,
            ctaSugerido: "LEARN_MORE",
          },
          {
            titulo: "Desconto especial local",
            texto: `Morador da região ganha atendimento VIP! Fale com nossa equipe agora mesmo e garanta sua oferta.`,
            ctaSugerido: "SEND_MESSAGE",
          },
        ],
      });
    }
  } catch (error: any) {
    console.error("[GERAR_COPILOT_ERROR] Erro crítico:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor na rota do Copilot.", details: error.message },
      { status: 500 }
    );
  }
}
