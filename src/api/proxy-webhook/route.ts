
import { NextResponse, type NextRequest } from 'next/server';

// Aumenta o tempo máximo de execução desta rota para 180 segundos (3 minutos).
export const maxDuration = 180;

export async function POST(request: NextRequest) {
  // O URL do webhook agora vem de um parâmetro de busca, ex: /api/proxy-webhook?target=post_manual
  const targetWebhookName = request.nextUrl.searchParams.get('target');
  
  let webhookUrl = "";

  if (targetWebhookName === 'post_manual') {
      webhookUrl = "https://webhook.flowupinova.com.br/webhook/post_manual";
  } else if (targetWebhookName === 'imagem_sem_logo') {
      webhookUrl = "https://webhook.flowupinova.com.br/webhook/imagem_sem_logo";
  } else if (targetWebhookName === 'gerador_imagem_referencia') {
      webhookUrl = "https://n8n.flowupinova.com.br/webhook-test/gerador_imagem_referencia";
  } else {
      return NextResponse.json({ error: "Webhook de destino não especificado ou inválido." }, { status: 400 });
  }

  try {
    const formData = await request.formData();
    
    // Recria o FormData no servidor para enviar ao webhook externo.
    const webhookFormData = new FormData();
    for (const [key, value] of formData.entries()) {
      // Se o valor for um arquivo, precisamos garantir que ele seja tratado como tal
      if (value instanceof File) {
        webhookFormData.append(key, value, value.name);
      } else {
        webhookFormData.append(key, value);
      }
    }
    
    // O `fetch` nativo definirá o Content-Type para `multipart/form-data` com o boundary correto.
    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      body: webhookFormData,
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error("Erro no webhook externo:", errorText);
      let errorDetails = errorText;
      try {
        // Tenta extrair a mensagem de erro se a resposta for um JSON de erro.
        const errorJson = JSON.parse(errorText);
        errorDetails = errorJson.message || errorJson.error || errorText;
      } catch (e) {
        // Se a resposta de erro não for JSON, usa o texto puro.
      }
      return NextResponse.json({ error: "Falha ao comunicar com o webhook externo.", details: errorDetails }, { status: webhookResponse.status });
    }

    const data = await webhookResponse.json();
    
    // Retorna a resposta do webhook para the cliente.
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Erro interno na API proxy:", error.message);
    return NextResponse.json({ error: "Erro interno do servidor no proxy.", details: error.message }, { status: 500 });
  }
}
