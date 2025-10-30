
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // --- MODO DE TESTE ---
    // A chamada real ao webhook está desativada.
    // Em vez disso, retornamos um JSON de exemplo para testar a interface.
    // Isso evita o consumo de créditos da API de imagem durante a depuração.

    const mockImageUrls = [
        "https://wlsmvzahqkilggnovxde.supabase.co/storage/v1/object/public/FlowUp/Assets/image.png_1761845149527.png",
        "https://wlsmvzahqkilggnovxde.supabase.co/storage/v1/object/public/FlowUp/Assets/image.png_1761845167509.png",
        "https://wlsmvzahqkilggnovxde.supabase.co/storage/v1/object/public/FlowUp/Assets/image.png_1761845186321.png"
    ];
    
    // Retorna um array de strings (URLs)
    return NextResponse.json({ success: true, imageUrls: mockImageUrls });

    /*
    // --- CÓDIGO ORIGINAL (DESATIVADO) ---
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
      // Retorna uma resposta JSON estruturada mesmo em caso de erro do webhook
      return NextResponse.json({ error: "Falha ao comunicar com o webhook de geração de imagem.", details: errorText }, { status: webhookResponse.status });
    }

    const data = await webhookResponse.json();

    if (!Array.isArray(data)) {
        // Log do formato inesperado para depuração
        console.error("Formato de resposta do webhook de imagem inesperado (não é um array):", data);
        // Retorna um erro JSON claro para o frontend
        return NextResponse.json({ error: "Formato de resposta do webhook de imagem inesperado." }, { status: 500 });
    }
    
    // Extrai apenas as URLs das imagens do array de objetos
    const imageUrls = data.map(item => item.url_da_imagem).filter(Boolean);

    if (imageUrls.length === 0) {
        return NextResponse.json({ error: "Nenhuma URL de imagem válida foi encontrada na resposta." }, { status: 500 });
    }
    
    // Retorna um array de strings (URLs)
    return NextResponse.json({ success: true, imageUrls: imageUrls });
    */

  } catch (error: any) {
    // Captura qualquer outro erro, como falha ao parsear o JSON da requisição inicial
    console.error("Internal server error:", error);
    return NextResponse.json({ error: "Erro interno do servidor.", details: error.message }, { status: 500 });
  }
}
