
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { summary } = await request.json();
    const webhookUrl = "https://webhook.flowupinova.com.br/webhook/gerador_de_ideias_e_imagens";

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
        // Garante que a resposta de erro seja um JSON válido
        return NextResponse.json({ error: "Falha ao comunicar com o webhook de geração de texto.", details: errorText }, { status: webhookResponse.status });
    }

    const data = await webhookResponse.json();
    
    const processedData = data.map((item: any) => {
        if (!item || !item.titulo) {
          return {
            titulo: "Erro de formato",
            subtitulo: "A resposta do webhook para este item não continha um título válido.",
            hashtags: [],
            url_da_imagem: null
          };
        }

        let hashtags = item.hashtags;
        if (typeof hashtags === 'string') {
          hashtags = hashtags.split(/[ ,]+/).filter(h => h).map(h => h.startsWith('#') ? h : `#${h}`);
        } else if (Array.isArray(hashtags)) {
          hashtags = hashtags.map((h: any) => String(h)).filter(h => h).map(h => h.startsWith('#') ? h : `#${h}`);
        } else {
          hashtags = [];
        }

        return { 
            titulo: item.titulo || "Título não gerado", 
            subtitulo: item.subtitulo || "Subtítulo não gerado", 
            hashtags: hashtags,
            url_da_imagem: item.url_da_imagem || null
        };
    });

    return NextResponse.json(processedData);

  } catch (error: any) {
    console.error("Internal server error:", error);
    return NextResponse.json({ error: "Erro interno do servidor.", details: error.message }, { status: 500 });
  }
}
