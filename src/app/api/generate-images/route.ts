
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { publicacoes } = await request.json();
    const webhookUrl = "https://webhook.flowupinova.com.br/webhook/gerador_de_imagem";

    if (!publicacoes || !Array.isArray(publicacoes) || publicacoes.length === 0) {
      return NextResponse.json({ error: "Dados de publicação inválidos ou ausentes." }, { status: 400 });
    }

    const webhookPayload = {
      publicacoes: publicacoes.map((pub: any) => ({
        titulo: pub.titulo,
        subtitulo: pub.subtitulo,
        hashtags: pub.hashtags
      }))
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

    if (!Array.isArray(data)) {
      console.error("Formato de resposta do webhook de imagem inesperado (não é um array):", data);
      return NextResponse.json({ error: "Formato de resposta do webhook de imagem inesperado." }, { status: 500 });
    }
    
    // Extrai apenas as URLs das imagens do array de objetos
    const imageUrls = data.map(item => item.url_da_imagem).filter(Boolean);

    if (imageUrls.length === 0) {
        return NextResponse.json({ error: "Nenhuma URL de imagem válida foi encontrada na resposta." }, { status: 500 });
    }
    
    // Retorna um array de strings (URLs)
    return NextResponse.json(imageUrls);

  } catch (error: any) {
    console.error("Internal server error:", error);
    return NextResponse.json({ error: "Erro interno do servidor.", details: error.message }, { status: 500 });
  }
}
