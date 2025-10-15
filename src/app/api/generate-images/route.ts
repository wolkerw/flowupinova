
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { publicacoes } = await request.json();
    const webhookUrl = process.env.N8N_WEBHOOK_URL + "/webhook/gerador_de_imagem";

    if (!publicacoes || !Array.isArray(publicacoes) || publicacoes.length === 0) {
      return NextResponse.json({ error: "Dados de publicação inválidos ou ausentes." }, { status: 400 });
    }

    // O webhook de imagem espera o texto do post, que está em `subtitulo`.
    const webhookPayload = {
      text: publicacoes[0].subtitulo || publicacoes[0].titulo
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
      return NextResponse.json({ error: "Falha ao comunicar com o webhook de geração de imagem.", details: errorText }, { status: webhookResponse.status });
    }

    const data = await webhookResponse.json();

    // A resposta esperada é um array de objetos, cada um com uma propriedade "output" contendo a URL.
    if (!Array.isArray(data) || !data[0] || !data[0].output) {
      console.error("Formato de resposta do webhook de imagem inesperado:", data);
      return NextResponse.json({ error: "Formato de resposta do webhook de imagem inesperado." }, { status: 500 });
    }
    
    const processedData = data.map((item: any) => {
        let imageUrl = item.output || "";
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
