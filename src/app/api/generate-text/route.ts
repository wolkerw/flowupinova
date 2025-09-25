
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { summary } = await request.json();
    const webhookUrl = "https://webhook.flowupinova.com.br/webhook/gerador_de_ideias";

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
    
    // Assegurando que hashtags seja um array e acessando a chave correta
    const processedData = data.map((item: any) => {
        // A chave é uma string literal "output.publicacoes"
        const publicacao = item['output.publicacoes'];
        if (!publicacao) {
          return {
            titulo: "Erro de formato",
            subtitulo: "Não foi possível encontrar 'output.publicacoes' na resposta.",
            hashtags: []
          };
        }

        let hashtags = publicacao.hashtags;
        if (typeof hashtags === 'string') {
            try {
                const parsedHashtags = JSON.parse(hashtags);
                hashtags = Array.isArray(parsedHashtags) ? parsedHashtags : [parsedHashtags];
            } catch (e) {
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
