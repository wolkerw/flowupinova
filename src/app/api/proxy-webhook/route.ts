import { NextResponse, type NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  // Este endpoint agora é um proxy genérico que suporta múltiplos destinos via parâmetro 'target'
  const target = request.nextUrl.searchParams.get('target');
  let webhookUrl = "";

  if (target === 'post_manual') {
    webhookUrl = "https://webhook.flowupinova.com.br/webhook/post_manual";
  } else if (target === 'imagem_sem_logo') {
    webhookUrl = "https://webhook.flowupinova.com.br/webhook/imagem_sem_logo";
  } else if (target === 'gerador_imagem_referencia') {
    webhookUrl = "https://n8n.flowupinova.com.br/webhook-test/gerador_imagem_referencia";
  } else {
    // Fallback para manter compatibilidade com chamadas sem target
    webhookUrl = "https://webhook.flowupinova.com.br/webhook/post_manual";
  }

  try {
    const formData = await request.formData();
    
    // Recria o FormData para enviar ao webhook externo.
    const webhookFormData = new FormData();
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        webhookFormData.append(key, value, value.name);
      } else {
        webhookFormData.append(key, value);
      }
    }
    
    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      body: webhookFormData,
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error("Erro no webhook externo:", errorText);
      return NextResponse.json({ error: "Falha ao comunicar com o webhook de upload.", details: errorText }, { status: webhookResponse.status });
    }

    const data = await webhookResponse.json();
    
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Erro interno na API proxy:", error);
    return NextResponse.json({ error: "Erro interno do servidor no proxy.", details: error.message }, { status: 500 });
  }
}
