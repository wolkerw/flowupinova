
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo encontrado na requisição." }, { status: 400 });
    }

    // A URL do webhook agora é a que você especificou.
    const webhookUrl = "https://webhook.flowupinova.com.br/webhook/post_manual";

    // Recriamos o FormData para enviar ao webhook externo.
    const webhookFormData = new FormData();
    webhookFormData.append('file', file);

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
    
    // Retorna a resposta do webhook para o cliente.
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Erro interno na API proxy:", error);
    return NextResponse.json({ error: "Erro interno do servidor no proxy.", details: error.message }, { status: 500 });
  }
}

    