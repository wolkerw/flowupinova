
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
      return NextResponse.json({ error: "Falha ao comunicar com o webhook de geração de texto.", details: errorText }, { status: webhookResponse.status });
    }

    const data = await webhookResponse.json();
    console.log("=============== WEBHOOK RESPONSE ===============");
    console.log(JSON.stringify(data, null, 2));
    console.log("================================================");
    
    // O webhook retorna um array diretamente, então processamos cada item.
    const processedData = data.map((item: any) => {
        if (!item || !item.titulo) {
          // Se um item no array estiver malformado, retornamos um erro para ele.
          return {
            titulo: "Erro de formato",
            subtitulo: "A resposta do webhook para este item não continha um título válido.",
            hashtags: []
          };
        }

        let hashtags = item.hashtags;
        // Garante que as hashtags sejam sempre um array de strings.
        if (typeof hashtags === 'string') {
            try {
                // Tenta fazer o parse se for uma string JSON
                const parsedHashtags = JSON.parse(hashtags);
                hashtags = Array.isArray(parsedHashtags) ? parsedHashtags : [String(parsedHashtags)];
            } catch (e) {
                // Se não for JSON, trata como string separada por vírgula/espaço
                hashtags = hashtags.split(/[ ,]+/).filter(h => h && h.startsWith('#'));
            }
        } else if (!Array.isArray(hashtags)) {
            hashtags = [];
        }

        return { 
            titulo: item.titulo || "Título não gerado", 
            subtitulo: item.subtitulo || "Subtítulo não gerado", 
            hashtags: hashtags.map((h: any) => String(h)) // Garante que todos os elementos sejam strings
        };
    });

    return NextResponse.json(processedData);

  } catch (error: any) {
    console.error("Internal server error:", error);
    return NextResponse.json({ error: "Erro interno do servidor.", details: error.message }, { status: 500 });
  }
}

    

    