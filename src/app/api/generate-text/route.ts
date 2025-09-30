
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { summary } = await request.json();
    const webhookUrl = "https://n8n.flowupinova.com.br/webhook-test/gerador_de_ideias";

    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ summary }),
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error("Webhook error:", errorText);
      return NextResponse.json({ error: "Falha ao comunicar com o webhook de geração de texto." }, { status: webhookResponse.status });
    }

    const data = await webhookResponse.json();
    
    // Ajustado para o novo formato de resposta do webhook de teste
    const processedData = data.map((item: any) => {
        const publicacao = item.json; // Acessa o objeto 'json' diretamente
        if (!publicacao) {
          return {
            titulo: "Erro de formato",
            subtitulo: "Não foi possível encontrar o objeto 'json' na resposta.",
            hashtags: []
          };
        }

        let hashtags = publicacao.hashtags;
        if (typeof hashtags === 'string') {
            try {
                // Tenta fazer o parse de uma string JSON
                const parsedHashtags = JSON.parse(hashtags);
                hashtags = Array.isArray(parsedHashtags) ? parsedHashtags : [parsedHashtags];
            } catch (e) {
                // Se falhar, trata como string separada por vírgula ou espaço
                hashtags = hashtags.split(/[ ,]+/).filter(h => h.startsWith('#'));
            }
        } else if (!Array.isArray(hashtags)) {
            hashtags = [];
        }

        return { 
            titulo: publicacao.titulo || "Título não gerado", 
            subtitulo: publicacao.subtitulo || "Subtítulo não gerado", 
            hashtags 
        };
    });

    return NextResponse.json(processedData);

  } catch (error: any) {
    console.error("Internal server error:", error);
    return NextResponse.json({ error: "Erro interno do servidor.", details: error.message }, { status: 500 });
  }
}
