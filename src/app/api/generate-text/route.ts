
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { summary } = await request.json();
    const webhookUrl = process.env.N8N_WEBHOOK_URL + "/webhook/gerador_de_ideias_e_imagens";

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
    
    // O webhook retorna um array diretamente, então processamos cada item.
    const processedData = data.map((item: any) => {
        if (!item || !item.titulo) {
          // Se um item no array estiver malformado, retornamos um erro para ele.
          return {
            titulo: "Erro de formato",
            subtitulo: "A resposta do webhook para este item não continha um título válido.",
            hashtags: [],
            url_da_imagem: null
          };
        }

        let hashtags = item.hashtags;
        // Garante que as hashtags sejam sempre um array de strings.
        if (typeof hashtags === 'string') {
          // Trata como string separada por vírgula/espaço e garante que comece com #
          hashtags = hashtags.split(/[ ,]+/).filter(h => h).map(h => h.startsWith('#') ? h : `#${h}`);
        } else if (Array.isArray(hashtags)) {
          // Garante que todos os elementos sejam strings e comecem com #
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
