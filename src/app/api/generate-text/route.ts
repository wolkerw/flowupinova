
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
    console.log("=============== WEBHOOK RESPONSE ===============");
    console.log(JSON.stringify(data, null, 2));
    console.log("================================================");
    
    // Ajustado para o formato de resposta direto do array do webhook
    const processedData = data.map((item: any) => {
        if (!item || !item.titulo) {
          return {
            titulo: "Erro de formato",
            subtitulo: "A resposta do webhook não continha um título válido.",
            hashtags: []
          };
        }

        let hashtags = item.hashtags;
        if (typeof hashtags === 'string') {
            try {
                // Tenta fazer o parse se for uma string JSON
                const parsedHashtags = JSON.parse(hashtags);
                hashtags = Array.isArray(parsedHashtags) ? parsedHashtags : [parsedHashtags.toString()];
            } catch (e) {
                // Se não for JSON, trata como string separada por vírgula/espaço
                hashtags = hashtags.split(/[ ,]+/).filter(h => h.startsWith('#'));
            }
        } else if (!Array.isArray(hashtags)) {
            hashtags = [];
        }

        return { 
            titulo: item.titulo || "Título não gerado", 
            subtitulo: item.subtitulo || "Subtítulo não gerado", 
            hashtags: hashtags.map((h: any) => typeof h === 'string' ? h : String(h))
        };
    });

    return NextResponse.json(processedData);

  } catch (error: any) {
    console.error("Internal server error:", error);
    return NextResponse.json({ error: "Erro interno do servidor.", details: error.message }, { status: 500 });
  }
}
