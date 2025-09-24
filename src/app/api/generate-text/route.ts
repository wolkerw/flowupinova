
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
                hashtags = JSON.parse(hashtags);
            } catch (e) {
                console.warn("Could not parse hashtags string:", hashtags);
                hashtags = hashtags.split(/[ ,]+/).filter(Boolean); // Fallback to splitting by space or comma
            }
        }
        return { ...item, hashtags };
    });

    return NextResponse.json(processedData);

  } catch (error: any) {
    console.error("Internal server error:", error);
    return NextResponse.json({ error: "Erro interno do servidor.", details: error.message }, { status: 500 });
  }
}

    