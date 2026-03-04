
import { NextResponse } from 'next/server';

// Aumenta o tempo máximo de execução desta rota para 300 segundos (5 minutos).
// Isso é necessário para webhooks de IA que podem demorar para processar.
export const maxDuration = 300;

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
        "X-Server-Timeout": "300",
      },
      body: JSON.stringify(webhookPayload),
    });

    // Lê a resposta como texto para poder analisar manualmente
    const responseText = await webhookResponse.text();

    if (!webhookResponse.ok) {
      console.error("[API_GENERATE_IMAGES] Webhook error:", webhookResponse.status, responseText);
      // Tenta extrair uma mensagem de erro mais detalhada do corpo da resposta
      let errorDetails = `O serviço de geração de imagens retornou um erro (HTTP ${webhookResponse.status}).`;
      try {
        // Tenta parsear como JSON primeiro
        const errorJson = JSON.parse(responseText);
        errorDetails = errorJson.detail || errorJson.error || JSON.stringify(errorJson);
      } catch (e) {
        // Se não for JSON, verifica se é um HTML de erro de gateway/timeout
        if (responseText.toLowerCase().includes('<html>')) {
            errorDetails = "O serviço de geração de imagens demorou muito para responder (timeout). Tente novamente.";
        } else {
             errorDetails = responseText.substring(0, 200); // Limita o tamanho do texto do erro
        }
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
        console.error("[API_GENERATE_IMAGES] JSON.parse error on webhook response:", responseText);
        return NextResponse.json({ success: false, error: "Formato de resposta do webhook de imagem inesperado (não é JSON).", details: responseText }, { status: 500 });
    }
    
    // Verifica se a resposta é um array
    if (!Array.isArray(data)) {
        console.error("[API_GENERATE_IMAGES] Formato de resposta do webhook de imagem inesperado (não é um array):", data);
        return NextResponse.json({ success: false, error: "Formato de resposta do webhook de imagem inesperado (não é um array).", details: JSON.stringify(data, null, 2) }, { status: 500 });
    }
    
    // Repassa o array completo para o frontend dentro de uma estrutura padronizada
    return NextResponse.json({ success: true, data: data });

  } catch (error: any) {
    // Captura erros da requisição inicial (ex: body malformado) ou outros erros inesperados.
    console.error("[API_GENERATE_IMAGES] Internal server error:", error);
    return NextResponse.json({ success: false, error: "Erro interno do servidor ao processar a geração de imagens.", details: error.message }, { status: 500 });
  }
}
