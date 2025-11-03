
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { summary, brandSummary } = await request.json(); // Adicionado brandSummary
    const webhookUrl = "https://webhook.flowupinova.com.br/webhook/gerador_de_ideias";

    // Adicionado o brandSummary ao corpo da requisição do webhook
    const webhookPayload = {
      summary,
      brand_summary: brandSummary,
    };

    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookPayload),
    });

    if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text();
        console.error("Webhook error:", errorText);
        // Garante que a resposta de erro seja um JSON válido
        return NextResponse.json({ error: "Falha ao comunicar com o webhook de geração de texto.", details: errorText }, { status: webhookResponse.status });
    }

    const data = await webhookResponse.json();
    
    if (!Array.isArray(data)) {
        console.error("Formato de resposta do webhook inesperado (não é um array):", data);
        return NextResponse.json({ error: "Formato de resposta do webhook inesperado.", details: JSON.stringify(data, null, 2) }, { status: 500 });
    }

    // Process data to match the expected structure, handling potential inconsistencies.
    const processedData = data.map((item: any) => {
        // The webhook might return 'título' or 'titulo'. We normalize to 'titulo' with accent.
        const title = item.título || item.titulo;

        if (!item || !title) {
          return {
            titulo: "Erro de formato",
            subtitulo: "A resposta do webhook para este item não continha um título válido.",
            hashtags: [],
            url_da_imagem: null
          };
        }

        let hashtags = item.hashtags;
        if (typeof hashtags === 'string') {
          // If hashtags are a single string, split them.
          hashtags = hashtags.split(/[ ,]+/).filter(Boolean).map((h: string) => h.startsWith('#') ? h : `#${h}`);
        } else if (Array.isArray(hashtags)) {
          // If it's already an array, just ensure formatting.
          hashtags = hashtags.map((h: any) => String(h)).filter(Boolean).map((h: string) => h.startsWith('#') ? h : `#${h}`);
        } else {
          hashtags = [];
        }

        return { 
            id: item.id || crypto.randomUUID(), // Ensure an ID exists
            created_at: item.created_at || new Date().toISOString(),
            título: title, // Use the normalized title
            subtitulo: item.subtitulo || "Subtítulo não gerado", 
            hashtags: hashtags,
            url_da_imagem: item.url_da_imagem || null,
            aprovado_por_humano: item.aprovado_por_humano || false
        };
    });

    return NextResponse.json(processedData);

  } catch (error: any) {
    console.error("Internal server error:", error);
    return NextResponse.json({ error: "Erro interno do servidor.", details: error.message }, { status: 500 });
  }
}
