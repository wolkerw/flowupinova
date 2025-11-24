
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const webhookUrl = "https://webhook.flowupinova.com.br/webhook/gerador_de_imagem";

  try {
    const payload = await request.json();

    // O webhook espera um objeto que tenha a chave "publicacoes".
    const webhookPayload = payload.publicacoes ? payload : { publicacoes: payload };

    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookPayload),
    });

    // Lê a resposta como texto para poder analisar manualmente
    const responseText = await webhookResponse.text();

    if (!webhookResponse.ok) {
      console.error("Webhook error:", webhookResponse.status, responseText);
      // Tenta extrair uma mensagem de erro mais detalhada do corpo da resposta
      let errorDetails = responseText;
      try {
        const errorJson = JSON.parse(responseText);
        errorDetails = errorJson.detail || errorJson.error || responseText;
      } catch (e) {
        // O corpo da resposta de erro não era JSON, usa o texto puro.
      }
      return NextResponse.json({ success: false, error: "Falha ao comunicar com o webhook de geração de imagem.", details: errorDetails }, { status: webhookResponse.status });
    }
    
    // Se a resposta estiver vazia, retorna um erro claro.
    if (!responseText) {
        return NextResponse.json({ success: false, error: "O webhook de imagem retornou uma resposta vazia." }, { status: 500 });
    }

    // Tenta parsear a resposta de sucesso como JSON
    let data;
    try {
        data = JSON.parse(responseText);
    } catch (e) {
        console.error("JSON.parse error on webhook response:", responseText);
        return NextResponse.json({ success: false, error: "Formato de resposta do webhook de imagem inesperado (não é JSON).", details: responseText }, { status: 500 });
    }
    
    // Verifica se a resposta é um array
    if (!Array.isArray(data)) {
        console.error("Formato de resposta do webhook de imagem inesperado (não é um array):", data);
        return NextResponse.json({ success: false, error: "Formato de resposta do webhook de imagem inesperado (não é um array).", details: JSON.stringify(data, null, 2) }, { status: 500 });
    }
    
    // Repassa o array completo para o frontend dentro de uma estrutura padronizada
    return NextResponse.json({ success: true, data: data });

  } catch (error: any) {
    // Captura erros da requisição inicial (ex: body malformado) ou outros erros inesperados.
    console.error("Internal server error in /api/generate-images:", error);
    return NextResponse.json({ success: false, error: "Erro interno do servidor.", details: error.message }, { status: 500 });
  }
}
