
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { publicacoes } = await request.json();
    const webhookUrl = "https://n8n.flowupinova.com.br/webhook-test/gerador_de_imagem";

    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ publicacoes }),
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error("Webhook error:", errorText);
      return NextResponse.json({ error: "Falha ao comunicar com o webhook de geração de imagem.", details: errorText }, { status: webhookResponse.status });
    }

    const data = await webhookResponse.json();

    // Corrige as URLs que vêm com "https://https://" duplicado e extrai apenas a URL
    const processedData = data.map((item: any) => {
      let imageUrl = item.url_da_imagem || "";
      if (imageUrl.startsWith("https://https://")) {
        imageUrl = imageUrl.substring(8); // Remove o "https://" extra
      }
      return { url_da_imagem: imageUrl };
    });

    return NextResponse.json(processedData);

  } catch (error: any) {
    console.error("Internal server error:", error);
    return NextResponse.json({ error: "Erro interno do servidor.", details: error.message }, { status: 500 });
  }
}
