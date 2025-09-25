
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
    
    // Assegurando que hashtags seja um array
    const processedData = data.map((item: any) => {
        let hashtags = item.hashtags;
        if (typeof hashtags === 'string') {
            try {
                // Tenta fazer o parse da string JSON, que pode ser '["#tag1", "#tag2"]'
                const parsedHashtags = JSON.parse(hashtags);
                hashtags = Array.isArray(parsedHashtags) ? parsedHashtags : [parsedHashtags];
            } catch (e) {
                // Se não for JSON, trata como string separada por espaço ou vírgula, ex: "#tag1, #tag2" ou "#tag1 #tag2"
                hashtags = hashtags.split(/[ ,]+/).filter(h => h.startsWith('#'));
                if (hashtags.length === 0) {
                     // Fallback se não houver '#', apenas separa por espaço/vírgula
                    hashtags = item.hashtags.split(/[ ,]+/).filter(Boolean);
                }
            }
        } else if (!Array.isArray(hashtags)) {
            // Garante que se não for string nem array, se torne um array vazio para evitar erros
            hashtags = [];
        }
        return { 
            titulo: item.titulo || "Título não gerado", 
            subtitulo: item.subtitulo || "Subtítulo não gerado", 
            hashtags 
        };
    });

    return NextResponse.json(processedData);

  } catch (error: any) {
    console.error("Internal server error:", error);
    return NextResponse.json({ error: "Erro interno do servidor.", details: error.message }, { status: 500 });
  }
}
