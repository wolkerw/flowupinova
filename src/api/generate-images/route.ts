
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { publicacoes } = await request.json();
    const webhookUrl = "https://webhook.flowupinova.com.br/webhook/gerador_de_imagem";

    if (!publicacoes || !Array.isArray(publicacoes) || publicacoes.length === 0) {
      return NextResponse.json({ success: false, error: "Dados de publicação inválidos ou ausentes." }, { status: 400 });
    }

    // O webhook espera um objeto que tenha a chave "publicacoes"
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
      // Retorna uma resposta JSON estruturada mesmo em caso de erro do webhook
      return NextResponse.json({ success: false, error: "Falha ao comunicar com o webhook de geração de imagem.", details: errorText }, { status: webhookResponse.status });
    }

    const data = await webhookResponse.json();

    // A resposta do webhook é um array de objetos. Vamos retornar a resposta completa.
    if (!Array.isArray(data)) {
        console.error("Formato de resposta do webhook de imagem inesperado (não é um array):", data);
        return NextResponse.json({ success: false, error: "Formato de resposta do webhook de imagem inesperado.", details: JSON.stringify(data, null, 2) }, { status: 500 });
    }
    
    // Apenas para verificação, vamos garantir que pelo menos uma url de imagem exista.
    const imageUrls = data.map(item => item.url_da_imagem).filter(Boolean);
    if (imageUrls.length === 0) {
        return NextResponse.json({ success: false, error: "Nenhuma URL de imagem válida foi encontrada na resposta do webhook." }, { status: 500 });
    }
    
    // Retorna o array de objetos completo dentro da propriedade 'data'
    return NextResponse.json({ success: true, data: data });

  } catch (error: any) {
    // Captura qualquer outro erro, como falha ao parsear o JSON da requisição inicial
    console.error("Internal server error:", error);
    return NextResponse.json({ success: false, error: "Erro interno do servidor.", details: error.message }, { status: 500 });
  }
}
