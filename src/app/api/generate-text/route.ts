
import { NextResponse } from 'next/server';
import { getGlobalSettings } from '@/lib/services/settings-service-admin';

export const maxDuration = 300;

export async function POST(request: Request) {
  const settings = await getGlobalSettings();
  const webhookUrl = settings.generateTextWebhook;

  try {
    const { summary } = await request.json();

    const webhookPayload = {
      summary,
    };

    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Server-Timeout": settings.serverTimeout,
      },
      body: JSON.stringify(webhookPayload),
    });

    if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text();
        console.error("Webhook error:", errorText);
        return NextResponse.json({ error: "Falha ao comunicar com o webhook de geração de texto.", details: errorText }, { status: webhookResponse.status });
    }

    const data = await webhookResponse.json();
    
    if (!Array.isArray(data)) {
        console.error("Formato de resposta do webhook inesperado (não é um array):", data);
        return NextResponse.json({ error: "Formato de resposta do webhook inesperado.", details: JSON.stringify(data, null, 2) }, { status: 500 });
    }

    const processedData = data.map((item: any) => {
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
          hashtags = hashtags.split(/[ ,]+/).filter(Boolean).map((h: string) => h.startsWith('#') ? h : `#${h}`);
        } else if (Array.isArray(hashtags)) {
          hashtags = hashtags.map((h: any) => String(h)).filter(Boolean).map((h: string) => h.startsWith('#') ? h : `#${h}`);
        } else {
          hashtags = [];
        }

        return { 
            id: item.id || crypto.randomUUID(),
            created_at: item.created_at || new Date().toISOString(),
            título: title,
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
