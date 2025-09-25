
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
    
    // Assegurando que hashtags seja um array
    const processedData = data.map((item: any) => {
        let hashtags = item.hashtags;
        if (typeof hashtags === 'string') {
            try {
                // Tenta fazer o parse da string JSON
                const parsedHashtags = JSON.parse(hashtags);
                hashtags = Array.isArray(parsedHashtags) ? parsedHashtags : [parsedHashtags];
            } catch (e) {
                console.warn("Could not parse hashtags string, splitting by space/comma:", hashtags);
                // Fallback para strings que não são JSON, como "tag1, tag2" ou "tag1 tag2"
                hashtags = hashtags.split(/[ ,]+/).filter(h => h.startsWith('#'));
                if (hashtags.length === 0) {
                    hashtags = hashtags.split(/[ ,]+/).filter(Boolean);
                }
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
