
import { NextResponse, type NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const webhookUrl = "https://webhook.flowupinova.com.br/webhook/post_manual";

  try {
    const formData = await request.formData();
    
    // Recria o FormData para enviar ao webhook externo.
    // Isso garante que todos os campos sejam repassados.
    const webhookFormData = new FormData();
    for (const [key, value] of formData.entries()) {
      webhookFormData.append(key, value);
    }
    
    // Deixa o `fetch` definir o Content-Type para `multipart/form-data` com a boundary correta.
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
